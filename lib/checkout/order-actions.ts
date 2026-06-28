"use server";

import { getCoupon } from "@/lib/data";
import { publicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUser } from "@/lib/auth/user";
import { computeTotals } from "./pricing";
import { finalizeOrder } from "./finalize";
import {
  createRazorpayOrder,
  razorpayConfigured,
  razorpayKeyId,
  verifyPaymentSignature,
} from "@/lib/razorpay";
import type { Order, OrderItem, PaymentMethod } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";

type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];

export interface CheckoutContact {
  fullName: string;
  email: string;
  phone: string;
  line: string;
  city: string;
  state: string;
  pin: string;
}

export interface CreateOrderInput {
  contact: CheckoutContact;
  items: { variantId: string; qty: number }[];
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
  /** Client-generated, stable per checkout attempt — dedupes double-submits. */
  idempotencyKey?: string | null;
  /** Save `contact` as the user's default address (logged-in, own-order only). */
  saveAddress?: boolean;
}

/** Prefill data for the checkout shipping form — the logged-in user's profile
 * merged with their default saved address. Null for guests. */
export interface CheckoutDefaults {
  fullName: string;
  email: string;
  phone: string;
  line: string;
  city: string;
  state: string;
  pin: string;
}

/** Read the signed-in user's saved details to prefill checkout. Null = guest. */
export async function getCheckoutDefaults(): Promise<CheckoutDefaults | null> {
  const profile = await getProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const { data: addr } = await supabase
    .from("addresses")
    .select("full_name, phone, line1, city, state, postal_code")
    .eq("is_default", true)
    .maybeSingle();
  return {
    fullName: addr?.full_name ?? profile.full_name ?? "",
    email: profile.email ?? "",
    phone: addr?.phone ?? profile.phone ?? "",
    line: addr?.line1 ?? "",
    city: addr?.city ?? "",
    state: addr?.state ?? "",
    pin: addr?.postal_code ?? "",
  };
}

export interface CreateOrderResult {
  ok: boolean;
  message?: string;
  order?: Order;
  /** Razorpay handoff for online payment (when configured). */
  razorpay?: { orderId: string; amount: number; keyId: string; dbOrderId: string };
  /** True when no payment provider / persistence is configured (demo mode). */
  simulated?: boolean;
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Server-side validation of the checkout contact. `createOrder` is a public
 * Server Action reachable without the client form, so we never trust the
 * browser's validation — bad email/phone/address are rejected and length-capped
 * before they reach a privileged (service-role) insert or the notify pipeline.
 */
function validateContact(c: CheckoutContact): string | null {
  const fields: [keyof CheckoutContact, number][] = [
    ["fullName", 120],
    ["line", 200],
    ["city", 80],
    ["state", 80],
    ["pin", 12],
  ];
  for (const [key, max] of fields) {
    const v = (c[key] ?? "").trim();
    if (!v) return "Please complete all delivery details.";
    if (v.length > max) return "One of the delivery fields is too long.";
  }
  if (!EMAIL_RE.test(c.email.trim()) || c.email.length > 254) {
    return "Please enter a valid email address.";
  }
  const phoneDigits = c.phone.replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return "Please enter a valid phone number.";
  }
  if (!/^\d{4,10}$/.test(c.pin.trim())) {
    return "Please enter a valid postal code.";
  }
  return null;
}

/** Re-price the cart from the database — never trust client-supplied prices. */
async function priceCart(items: { variantId: string; qty: number }[]) {
  const ids = items.map((i) => i.variantId);
  const { data, error } = await publicClient()
    .from("product_variants")
    .select(
      // Single products↔variants relationship now (default_variant_id has no FK),
      // so no disambiguating hint is needed. Pull the product base price (for null-
      // override inheritance) and the category status (only sell from live categories).
      "id, sku, variant_name, price_paise, product_id, is_active, products(name, price_paise, is_active, deleted_at, categories(status))",
    )
    // Only sell live variants whose parent product is active and not soft-deleted.
    // Defense-in-depth beyond RLS so a deactivated SKU can never be priced/charged.
    .eq("is_active", true)
    .in("id", ids);
  if (error) throw error;

  // PostgREST returns the parent/category as to-one objects; the generated type
  // widens them to arrays, so normalize either shape.
  type Parent = {
    name: string;
    price_paise: number;
    is_active: boolean;
    deleted_at: string | null;
    categories: { status: string } | { status: string }[] | null;
  };
  const parentOf = (v: { products: unknown }): Parent | null => {
    const p = Array.isArray(v.products) ? v.products[0] : v.products;
    return (p ?? null) as Parent | null;
  };
  const categoryActive = (p: Parent | null) => {
    const c = Array.isArray(p?.categories) ? p?.categories[0] : p?.categories;
    return c?.status === "active";
  };

  const byId = new Map(
    (data ?? [])
      .filter((v) => {
        const p = parentOf(v);
        // Drop variants whose product is inactive/soft-deleted or whose category isn't live.
        return p != null && p.is_active && p.deleted_at == null && categoryActive(p);
      })
      .map((v) => {
        const p = parentOf(v);
        return [
          v.id,
          {
            sku: v.sku,
            label: v.variant_name ?? "",
            // Inherit the product base price when the variant override is null (never 0).
            price: v.price_paise ?? p?.price_paise ?? 0,
            productId: v.product_id,
            productName: p?.name ?? "",
          },
        ];
      }),
  );

  const lines = items
    .map((i) => {
      const v = byId.get(i.variantId);
      if (!v) return null;
      const qty = Math.max(1, Math.min(i.qty, 99));
      return { ...v, variantId: i.variantId, qty, lineTotal: v.price * qty };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  return { lines, subtotal };
}

/** Upsert the user's default address from the checkout contact. Best-effort. */
async function saveDefaultAddress(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  c: CheckoutContact,
) {
  const row = {
    user_id: userId,
    full_name: c.fullName,
    phone: toE164(c.phone),
    line1: c.line,
    city: c.city,
    state: c.state,
    postal_code: c.pin,
    country: "IN",
    is_default: true,
  };
  const { data: existing } = await admin
    .from("addresses")
    .select("id")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();
  if (existing) {
    await admin.from("addresses").update(row).eq("id", existing.id);
  } else {
    await admin.from("addresses").insert(row);
  }
}

/** Return the existing order for an idempotency key, re-issuing the Razorpay
 * handoff when an online payment is still awaiting capture. */
async function resolveExistingOrder(
  admin: ReturnType<typeof createAdminClient>,
  key: string,
  baseOrder: Omit<Order, "id">,
  total: number,
): Promise<CreateOrderResult | null> {
  const { data: existing } = await admin
    .from("orders")
    .select("id, order_number")
    .eq("idempotency_key", key)
    .maybeSingle();
  if (!existing) return null;
  const order: Order = { ...baseOrder, id: existing.order_number };
  const { data: pay } = await admin
    .from("payments")
    .select("razorpay_order_id, status")
    .eq("order_id", existing.id)
    .maybeSingle();
  if (pay?.razorpay_order_id && pay.status !== "captured" && razorpayConfigured()) {
    return {
      ok: true,
      order,
      razorpay: { orderId: pay.razorpay_order_id, amount: total, keyId: razorpayKeyId()!, dbOrderId: existing.id },
    };
  }
  return { ok: true, order };
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const contactError = validateContact(input.contact);
  if (contactError) return { ok: false, message: contactError };

  const { lines, subtotal } = await priceCart(input.items);
  if (lines.length === 0) return { ok: false, message: "Your cart is empty." };

  const coupon = input.couponCode ? (await getCoupon(input.couponCode)) ?? null : null;
  const { shipping, discount, total } = computeTotals(subtotal, coupon);

  const orderItems: OrderItem[] = lines.map((l) => ({
    productTitle: l.productName,
    variantLabel: l.label,
    sku: l.sku,
    unitPrice: l.price,
    qty: l.qty,
  }));

  const baseOrder: Omit<Order, "id"> = {
    contactName: input.contact.fullName,
    contactEmail: input.contact.email,
    contactPhone: toE164(input.contact.phone),
    items: orderItems,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === "cod" ? "cod_pending" : "pending",
    subtotal,
    shipping,
    discount,
    total,
    status: "placed",
    createdAt: new Date().toISOString(),
  };

  // Demo mode: no secret key → validate + price on the server but don't
  // persist. Keeps the clickable flow working until keys land.
  if (!process.env.SUPABASE_SECRET_KEY) {
    return {
      ok: true,
      simulated: true,
      order: { ...baseOrder, id: `ASAI-${randomCode()}` },
    };
  }

  const admin = createAdminClient();
  const user = await getUser();

  // coupon_id is the single source of truth on orders now (coupon_code dropped).
  // Resolve the validated coupon's id (case-insensitive on the normalized code).
  let couponId: string | null = null;
  // Only record the coupon when it actually applied — a real discount, or free
  // shipping (which yields discount=0 but still "uses" the coupon). Otherwise we'd
  // burn a usage_limit slot for a coupon that had no effect.
  if (coupon && (discount > 0 || coupon.type === "free_shipping")) {
    // Exact match on the (already-normalized) stored code — avoid ilike, whose
    // %/_ would act as wildcards.
    const { data: c } = await admin.from("coupons").select("id").eq("code", coupon.code).maybeSingle();
    couponId = c?.id ?? null;
  }

  const idempotencyKey = input.idempotencyKey?.trim() || null;

  // Idempotency: a re-submitted checkout (double-click, network retry) with the
  // same key must not create a second order / Razorpay order. If the key already
  // exists, return the existing order (and re-issue its Razorpay handoff if any).
  if (idempotencyKey) {
    const existing = await resolveExistingOrder(admin, idempotencyKey, baseOrder, total);
    if (existing) return existing;
  }

  // `order_number` is assigned by the BEFORE-INSERT trigger when null.
  const orderPayload: Omit<OrderInsert, "order_number"> = {
    user_id: user?.id ?? null,
    email: input.contact.email.trim(),
    phone: toE164(input.contact.phone),
    status: "pending",
    subtotal_paise: subtotal,
    shipping_paise: shipping,
    discount_paise: discount,
    total_paise: total,
    coupon_id: couponId,
    idempotency_key: idempotencyKey,
    shipping_address: {
      full_name: input.contact.fullName,
      line1: input.contact.line,
      city: input.contact.city,
      state: input.contact.state,
      postal_code: input.contact.pin,
      country: "IN",
    },
  };
  const { data: orderRow, error: orderErr } = await admin
    .from("orders")
    .insert(orderPayload as OrderInsert)
    .select("id, order_number")
    .single();
  // Lost a race on the unique idempotency key → return the winner's order.
  if (orderErr && (orderErr as { code?: string }).code === "23505" && idempotencyKey) {
    const existing = await resolveExistingOrder(admin, idempotencyKey, baseOrder, total);
    if (existing) return existing;
  }
  if (orderErr || !orderRow) {
    return { ok: false, message: orderErr?.message ?? "Could not create order." };
  }

  const { error: itemsErr } = await admin.from("order_items").insert(
    lines.map((l) => ({
      order_id: orderRow.id,
      product_id: l.productId,
      variant_id: l.variantId,
      product_name: l.productName,
      sku: l.sku,
      variant_label: l.label,
      quantity: l.qty,
      unit_price_paise: l.price,
      total_paise: l.lineTotal,
    })),
  );
  if (itemsErr) {
    // Don't proceed to payment with a line-item-less order. Cancel and bail.
    await admin.from("orders").update({ status: "cancelled" }).eq("id", orderRow.id);
    return { ok: false, message: "Could not record order items. Please try again." };
  }

  // Remember the buyer's own address for next time (never a "someone else" recipient).
  if (input.saveAddress && user) {
    await saveDefaultAddress(admin, user.id, input.contact).catch((e) =>
      console.error("createOrder: saveDefaultAddress failed", e),
    );
  }

  const order: Order = { ...baseOrder, id: orderRow.order_number };

  // COD: record the order as pending but DON'T commit stock/coupon yet. Otherwise
  // an attacker could place many unpaid COD orders to exhaust inventory and
  // burn limited-use coupons. Stock/coupon are committed when an admin confirms
  // the order (see updateOrderStatus → finalizeOrder).
  if (input.paymentMethod === "cod") {
    await admin.from("payments").insert({
      order_id: orderRow.id,
      provider: "razorpay",
      method: "cod",
      status: "created",
      amount_paise: total,
    });
    return { ok: true, order };
  }

  // Online payment with Razorpay configured.
  if (razorpayConfigured()) {
    try {
      const rzp = await createRazorpayOrder(total, orderRow.order_number);
      await admin.from("payments").insert({
        order_id: orderRow.id,
        provider: "razorpay",
        razorpay_order_id: rzp.id,
        method: input.paymentMethod,
        status: "created",
        amount_paise: total,
      });
      return {
        ok: true,
        order,
        razorpay: {
          orderId: rzp.id,
          amount: total,
          keyId: razorpayKeyId()!,
          dbOrderId: orderRow.id,
        },
      };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Payment init failed." };
    }
  }

  // Persistence available but no Razorpay keys. NEVER auto-capture in production:
  // a missing/empty Razorpay env var must fail closed, not hand out free orders.
  // The simulated capture is gated to non-production (or an explicit opt-in flag)
  // so the local/demo flow still completes end-to-end.
  const allowSimulated =
    process.env.NODE_ENV !== "production" || process.env.ALLOW_SIMULATED_PAYMENTS === "true";
  if (!allowSimulated) {
    // Order stays `pending`; no stock/coupon side effects until a real payment lands.
    return { ok: false, message: "Online payments are temporarily unavailable. Please try again later." };
  }
  await admin.from("payments").insert({
    order_id: orderRow.id,
    provider: "razorpay",
    method: input.paymentMethod,
    status: "captured",
    amount_paise: total,
    captured_at: new Date().toISOString(),
  });
  await finalizeOrder(orderRow.id, lines, couponId, user?.id ?? null, discount);
  return { ok: true, order, simulated: true };
}

export async function verifyPayment(input: {
  dbOrderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): Promise<{ ok: boolean; message?: string }> {
  const admin = createAdminClient();

  // Bind the signature to THIS order: a genuine signature only proves the
  // Razorpay order/payment pair is authentic — not that it belongs to the
  // caller-supplied dbOrderId. Without this check, a valid signature from a
  // cheap order could be replayed to capture an arbitrary (expensive) order.
  const { data: pay } = await admin
    .from("payments")
    .select("razorpay_order_id, status")
    .eq("order_id", input.dbOrderId)
    .single();

  if (!pay || pay.razorpay_order_id !== input.razorpayOrderId) {
    return { ok: false, message: "Order does not match this payment." };
  }
  // Idempotency / replay guard: never re-finalize an already-captured payment.
  if (pay.status === "captured") {
    return { ok: true };
  }

  if (
    !verifyPaymentSignature({
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      signature: input.signature,
    })
  ) {
    return { ok: false, message: "Payment signature verification failed." };
  }

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, user_id, coupon_id, discount_paise")
    .eq("id", input.dbOrderId)
    .single();
  if (orderErr || !order) {
    console.error("verifyPayment: order lookup failed", orderErr);
    return { ok: false, message: "Order not found." };
  }

  // Defense-in-depth ownership check: a signed-in caller may only confirm their
  // own order. (Guest orders have a null user_id and are protected by the
  // order↔signature binding above.)
  if (order.user_id) {
    const user = await getUser();
    if (!user || user.id !== order.user_id) {
      return { ok: false, message: "You are not authorized to confirm this order." };
    }
  }

  const { error: captureErr } = await admin
    .from("payments")
    .update({
      razorpay_payment_id: input.razorpayPaymentId,
      razorpay_signature: input.signature,
      status: "captured",
      captured_at: new Date().toISOString(),
    })
    .eq("order_id", input.dbOrderId)
    .eq("razorpay_order_id", input.razorpayOrderId);
  if (captureErr) {
    console.error("verifyPayment: capture update failed", captureErr);
    return { ok: false, message: "Could not record payment. Please contact support." };
  }

  const { data: items, error: itemsErr } = await admin
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", input.dbOrderId);
  if (itemsErr) console.error("verifyPayment: order_items lookup failed", itemsErr);

  await finalizeOrder(
    order.id,
    (items ?? []).map((i) => ({ variantId: i.variant_id, qty: i.quantity })),
    order.coupon_id,
    order.user_id,
    order.discount_paise,
  );
  return { ok: true };
}

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
