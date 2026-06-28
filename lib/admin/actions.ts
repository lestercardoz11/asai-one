"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIsAdmin, getUser } from "@/lib/auth/user";
import { finalizeOrder } from "@/lib/checkout/finalize";
import type { Database, Json } from "@/lib/supabase/database.types";

const IMAGE_BUCKET = "product-images";
const STORAGE_PUBLIC_MARKER = `/storage/v1/object/public/${IMAGE_BUCKET}/`;

// Statuses that mean the order is being fulfilled — reaching any of these for the
// first time must commit stock + coupon (handles deferred-commit COD orders).
const FULFILLING_STATUSES = new Set<OrderStatus>([
  "confirmed",
  "processing",
  "shipped",
  "delivered",
]);

type OrderStatus = Database["public"]["Enums"]["order_status"];
type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
type CategoryStatus = Database["public"]["Enums"]["category_status"];

const ORDER_STATUSES: readonly OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const CATEGORY_STATUSES: readonly CategoryStatus[] = ["active", "coming_soon", "archived"];

/** Defense-in-depth: every admin action re-checks the role (RLS also enforces). */
async function assertAdmin() {
  if (!(await getIsAdmin())) throw new Error("Forbidden");
}

/** Parse a required, non-negative integer paise value from form input. */
function parsePaise(raw: FormDataEntryValue | null, field: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`Invalid ${field}: must be a whole, non-negative amount.`);
  }
  return n;
}

/** Like `parsePaise` but treats blank input as `null` (optional money/int). */
function parseOptionalInt(raw: FormDataEntryValue | null, field: string): number | null {
  const s = String(raw ?? "").trim();
  if (s === "") return null;
  return parsePaise(s, field);
}

/** Trim a text field, mapping blank to `null` for nullable columns. */
function optionalText(raw: FormDataEntryValue | null): string | null {
  const s = String(raw ?? "").trim();
  return s === "" ? null : s;
}

/** Split a comma- or newline-separated field into a trimmed, non-empty array. */
function parseList(raw: FormDataEntryValue | null, sep: "," | "\n"): string[] {
  const text = String(raw ?? "");
  const parts = sep === "," ? text.split(",") : text.split(/\r?\n/);
  return parts.map((s) => s.trim()).filter(Boolean);
}

/**
 * Specifications, entered one per line as "Label: Value" (no JSON). Stored as the
 * jsonb array [{label, value}] the storefront renders. A line with no colon is
 * kept as a label-only spec.
 */
function parseSpecs(raw: FormDataEntryValue | null): Json {
  const lines = String(raw ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.map((line) => {
    const i = line.indexOf(":");
    return i === -1
      ? { label: line, value: "" }
      : { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() };
  }) as Json;
}

/** A required, non-empty trimmed string (slug/sku/name validation). */
function requireText(raw: FormDataEntryValue | null, field: string): string {
  const s = String(raw ?? "").trim();
  if (s === "") throw new Error(`${field} is required.`);
  return s;
}

/**
 * Revalidate catalogue-facing routes after a write that changes what shoppers
 * see. The root layout revalidation covers product + commute pages; the product
 * path is hit explicitly when the slug is known.
 */
function revalidateCatalogue(slug?: string | null) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/product/${slug}`);
}

/**
 * Strict stock-quantity parser — unlike `parsePaise`, a blank/missing value is an
 * ERROR (not a silent 0 that would wipe stock), and scientific notation / int4
 * overflow are rejected.
 */
function parseQuantity(raw: FormDataEntryValue | null, field: string): number {
  const s = String(raw ?? "").trim();
  if (!/^\d+$/.test(s)) throw new Error(`Invalid ${field}: enter a whole, non-negative number.`);
  const n = Number(s);
  if (!Number.isSafeInteger(n) || n > 1_000_000) throw new Error(`Invalid ${field}: out of range.`);
  return n;
}

/**
 * Admins enter money in RUPEES (e.g. "299" or "299.50"); we store integer paise.
 * Round to avoid binary-float drift.
 */
function parseRupeesToPaise(raw: FormDataEntryValue | null, field: string): number {
  const s = String(raw ?? "").trim();
  const n = Number(s);
  if (s === "" || !Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid ${field}: enter an amount in rupees (e.g. 299 or 299.50).`);
  }
  return Math.round(n * 100);
}

/** Like `parseRupeesToPaise` but a blank value means "not set" (→ null). */
function parseOptionalRupeesToPaise(raw: FormDataEntryValue | null, field: string): number | null {
  const s = String(raw ?? "").trim();
  if (s === "") return null;
  return parseRupeesToPaise(s, field);
}

/**
 * Map a Postgres unique-violation (23505) to a friendly message; rethrow anything
 * else. An assertion signature so the supabase result's `data` narrows to non-null
 * after the call (same as `if (error) throw error`).
 */
function throwFriendly(
  error: { code?: string } | null,
  uniqueMessage: string,
): asserts error is null {
  if (!error) return;
  if (error.code === "23505") throw new Error(uniqueMessage);
  throw error as unknown as Error;
}

export async function updateProduct(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  if (!id) throw new Error("Missing product id.");
  const slug = requireText(formData.get("slug"), "Slug");
  const { error } = await supabase
    .from("products")
    .update({
      name: requireText(formData.get("name"), "Name"),
      slug,
      short_description: optionalText(formData.get("short_description")),
      description: optionalText(formData.get("description")),
      price_paise: parseRupeesToPaise(formData.get("price_rupees"), "price"),
      original_price_paise: parseOptionalRupeesToPaise(formData.get("original_price_rupees"), "original price"),
      tags: parseList(formData.get("tags"), ","),
      specs: parseSpecs(formData.get("specs")),
      features: parseList(formData.get("features"), "\n"),
      compatibility: optionalText(formData.get("compatibility")),
      hsn_code: optionalText(formData.get("hsn_code")),
      shipping_policy: optionalText(formData.get("shipping_policy")),
      is_returnable: formData.get("is_returnable") === "on",
      return_window_days: parseOptionalInt(formData.get("return_window_days"), "return window") ?? 0,
      is_active: formData.get("is_active") === "on",
      is_featured: formData.get("is_featured") === "on",
      is_new: formData.get("is_new") === "on",
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidateCatalogue(slug);
}

export async function createProduct(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const slug = requireText(formData.get("slug"), "Slug");
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: requireText(formData.get("name"), "Name"),
      slug,
      sku: requireText(formData.get("sku"), "SKU"),
      category_id: requireText(formData.get("category_id"), "Category"),
      price_paise: parseRupeesToPaise(formData.get("price_rupees"), "price"),
      is_active: true,
    })
    .select("id")
    .single();
  throwFriendly(error, "That product slug or SKU is already in use.");
  revalidatePath("/admin/products");
  revalidateCatalogue(slug);
  redirect(`/admin/products/${data.id}`);
}

export async function deleteProduct(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  if (!id) throw new Error("Missing product id.");
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/products");
  revalidateCatalogue();
  redirect("/admin/products");
}

export async function updateInventory(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const variantId = String(formData.get("variant_id"));
  if (!variantId) throw new Error("Missing variant id.");
  const quantity = parseQuantity(formData.get("quantity"), "quantity");
  const { error } = await supabase
    .from("inventory")
    .update({ quantity })
    .eq("variant_id", variantId);
  if (error) throw error;
  // Revalidate the editor page (where this form lives) + the storefront so stock
  // changes show immediately, not just the products list.
  const { data: v } = await supabase
    .from("product_variants")
    .select("product_id, products(slug)")
    .eq("id", variantId)
    .maybeSingle();
  const prod = v ? (Array.isArray(v.products) ? v.products[0] : v.products) : null;
  revalidatePath("/admin/products");
  if (v?.product_id) revalidatePath(`/admin/products/${v.product_id}`);
  revalidateCatalogue(prod?.slug ?? null);
}

// ──────────────────────────────────────────────────────────────────────────
// Variants
// ──────────────────────────────────────────────────────────────────────────

export async function createVariant(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const productId = String(formData.get("product_id"));
  if (!productId) throw new Error("Missing product id.");
  const { data, error } = await supabase
    .from("product_variants")
    .insert({
      product_id: productId,
      sku: requireText(formData.get("sku"), "SKU"),
      variant_name: optionalText(formData.get("variant_name")),
      price_paise: parseOptionalRupeesToPaise(formData.get("price_rupees"), "price"),
      original_price_paise: parseOptionalRupeesToPaise(formData.get("original_price_rupees"), "original price"),
      weight_grams: parseOptionalInt(formData.get("weight_grams"), "weight"),
      position: parseOptionalInt(formData.get("position"), "position") ?? 0,
      is_active: true,
    })
    .select("id")
    .single();
  throwFriendly(error, "That variant SKU is already in use.");
  // Seed an inventory row so stock is immediately editable via updateInventory.
  const { error: invErr } = await supabase
    .from("inventory")
    .insert({ product_id: productId, variant_id: data.id, quantity: 0 });
  if (invErr) throw invErr;
  revalidatePath(`/admin/products/${productId}`);
  revalidateCatalogue();
}

export async function updateVariant(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const id = String(formData.get("variant_id"));
  if (!id) throw new Error("Missing variant id.");
  const { data, error } = await supabase
    .from("product_variants")
    .update({
      sku: requireText(formData.get("sku"), "SKU"),
      variant_name: optionalText(formData.get("variant_name")),
      price_paise: parseOptionalRupeesToPaise(formData.get("price_rupees"), "price"),
      original_price_paise: parseOptionalRupeesToPaise(formData.get("original_price_rupees"), "original price"),
      weight_grams: parseOptionalInt(formData.get("weight_grams"), "weight"),
      position: parseOptionalInt(formData.get("position"), "position") ?? 0,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id)
    .select("product_id")
    .single();
  throwFriendly(error, "That variant SKU is already in use.");
  revalidatePath(`/admin/products/${data.product_id}`);
  revalidateCatalogue();
}

export async function deleteVariant(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const id = String(formData.get("variant_id"));
  const productId = String(formData.get("product_id"));
  if (!id) throw new Error("Missing variant id.");
  // Clear dependent rows first (PostgREST does not cascade for us).
  await supabase.from("inventory").delete().eq("variant_id", id);
  await supabase.from("variant_option_values").delete().eq("variant_id", id);
  const { error } = await supabase.from("product_variants").delete().eq("id", id);
  if (error) throw error;
  // If this was the product's default variant, clear the pointer.
  if (productId) {
    await supabase
      .from("products")
      .update({ default_variant_id: null })
      .eq("id", productId)
      .eq("default_variant_id", id);
  }
  revalidatePath(`/admin/products/${productId}`);
  revalidateCatalogue();
}

export async function setDefaultVariant(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const productId = String(formData.get("product_id"));
  const variantId = String(formData.get("variant_id"));
  if (!productId || !variantId) throw new Error("Missing product or variant id.");
  const { error } = await supabase
    .from("products")
    .update({ default_variant_id: variantId })
    .eq("id", productId);
  if (error) throw error;
  revalidatePath(`/admin/products/${productId}`);
  revalidateCatalogue();
}

// ──────────────────────────────────────────────────────────────────────────
// Options & values
// ──────────────────────────────────────────────────────────────────────────

export async function addOption(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const productId = String(formData.get("product_id"));
  if (!productId) throw new Error("Missing product id.");
  const { error } = await supabase.from("product_options").insert({
    product_id: productId,
    name: requireText(formData.get("name"), "Option name"),
    position: parseOptionalInt(formData.get("position"), "position") ?? 0,
  });
  throwFriendly(error, "An option with that name already exists for this product.");
  revalidatePath(`/admin/products/${productId}`);
}

export async function deleteOption(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const optionId = String(formData.get("option_id"));
  const productId = String(formData.get("product_id"));
  if (!optionId) throw new Error("Missing option id.");
  // Remove the option's values and any variant pins that reference them first.
  const { data: values } = await supabase
    .from("product_option_values")
    .select("id")
    .eq("option_id", optionId);
  const valueIds = (values ?? []).map((v) => v.id);
  if (valueIds.length) {
    await supabase.from("variant_option_values").delete().in("option_value_id", valueIds);
    await supabase.from("product_option_values").delete().eq("option_id", optionId);
  }
  const { error } = await supabase.from("product_options").delete().eq("id", optionId);
  if (error) throw error;
  revalidatePath(`/admin/products/${productId}`);
  revalidateCatalogue();
}

export async function addOptionValue(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const optionId = String(formData.get("option_id"));
  const productId = String(formData.get("product_id"));
  if (!optionId) throw new Error("Missing option id.");
  const { error } = await supabase.from("product_option_values").insert({
    option_id: optionId,
    value: requireText(formData.get("value"), "Value"),
    position: parseOptionalInt(formData.get("position"), "position") ?? 0,
  });
  throwFriendly(error, "That value already exists for this option.");
  revalidatePath(`/admin/products/${productId}`);
}

export async function deleteOptionValue(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const valueId = String(formData.get("value_id"));
  const productId = String(formData.get("product_id"));
  if (!valueId) throw new Error("Missing value id.");
  await supabase.from("variant_option_values").delete().eq("option_value_id", valueId);
  const { error } = await supabase.from("product_option_values").delete().eq("id", valueId);
  if (error) throw error;
  revalidatePath(`/admin/products/${productId}`);
  revalidateCatalogue();
}

/** Replace a variant's option-value pins with the submitted set (one per option). */
export async function setVariantOptionValues(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const variantId = String(formData.get("variant_id"));
  const productId = String(formData.get("product_id"));
  if (!variantId) throw new Error("Missing variant id.");
  const valueIds = formData
    .getAll("option_value_id")
    .map((v) => String(v))
    .filter((v) => v !== "");
  await supabase.from("variant_option_values").delete().eq("variant_id", variantId);
  if (valueIds.length) {
    const rows = valueIds.map((option_value_id) => ({ variant_id: variantId, option_value_id }));
    const { error } = await supabase.from("variant_option_values").insert(rows);
    if (error) throw error;
  }
  revalidatePath(`/admin/products/${productId}`);
  revalidateCatalogue();
}

// ──────────────────────────────────────────────────────────────────────────
// Images (Storage via the service-role client; rows via the RLS client)
// ──────────────────────────────────────────────────────────────────────────

export async function uploadProductImage(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const productId = String(formData.get("product_id"));
  if (!productId) throw new Error("Missing product id.");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("No image file provided.");

  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
  const path = `products/${randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) throw upErr;

  const publicUrl = admin.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  // Force-primary if the admin ticked it OR the product currently has no primary,
  // so a product always has exactly one primary for the storefront ordering.
  const { count: primaryCount } = await supabase
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("is_primary", true);
  const isPrimary = formData.get("is_primary") === "on" || (primaryCount ?? 0) === 0;
  const { data: inserted, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      url: publicUrl,
      alt: optionalText(formData.get("alt")),
      position: parseOptionalInt(formData.get("position"), "position") ?? 0,
      is_primary: isPrimary,
    })
    .select("id")
    .single();
  if (error) throw error;
  // Keep exactly one primary per product — demote the others when this is primary.
  if (isPrimary && inserted) {
    await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", productId)
      .neq("id", inserted.id);
  }
  revalidatePath(`/admin/products/${productId}`);
  revalidateCatalogue();
}

export async function deleteProductImage(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const imageId = String(formData.get("image_id"));
  const productId = String(formData.get("product_id"));
  if (!imageId) throw new Error("Missing image id.");

  const { data: image } = await supabase
    .from("product_images")
    .select("url, is_primary")
    .eq("id", imageId)
    .maybeSingle();
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw error;

  // If we removed the primary, promote the next image (lowest position) so the
  // product keeps a primary for the storefront's primary-first ordering.
  if (image?.is_primary) {
    const { data: next } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase.from("product_images").update({ is_primary: true }).eq("id", next.id);
    }
  }

  // Remove the backing Storage object when the URL points at our bucket.
  const idx = image?.url ? image.url.indexOf(STORAGE_PUBLIC_MARKER) : -1;
  if (image?.url && idx !== -1) {
    const objectPath = decodeURIComponent(image.url.slice(idx + STORAGE_PUBLIC_MARKER.length));
    const admin = createAdminClient();
    await admin.storage.from(IMAGE_BUCKET).remove([objectPath]);
  }
  revalidatePath(`/admin/products/${productId}`);
  revalidateCatalogue();
}

const STATUS_TIMESTAMP: Record<string, string | undefined> = {
  confirmed: "confirmed_at",
  shipped: "shipped_at",
  delivered: "delivered_at",
  cancelled: "cancelled_at",
};

export async function updateOrderStatus(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  if (!id) throw new Error("Missing order id.");
  const status = String(formData.get("status")) as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) {
    throw new Error("Invalid order status.");
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status, user_id, coupon_id, discount_paise")
    .eq("id", id)
    .single();

  // A cancelled/refunded order already had its stock returned and coupon released.
  // Reopening it would NOT re-commit stock (finalize only fires on pending) → oversell.
  // Block transitions out of a terminal state.
  if (order && (order.status === "cancelled" || order.status === "refunded") && status !== order.status) {
    throw new Error("This order is closed (cancelled/refunded) and cannot be reopened.");
  }

  if (order) {
    if (FULFILLING_STATUSES.has(status)) {
      // Forward: first transition into a fulfilling state (e.g. confirming a COD
      // order) commits stock + coupon exactly once — finalizeOrder's
      // pending→confirmed guard makes a re-run a no-op.
      const { data: items } = await admin
        .from("order_items")
        .select("variant_id, quantity")
        .eq("order_id", id);
      await finalizeOrder(
        order.id,
        (items ?? []).map((i) => ({ variantId: i.variant_id, qty: i.quantity })),
        order.coupon_id,
        order.user_id,
        order.discount_paise,
      );
    } else if (
      (status === "cancelled" || status === "refunded") &&
      FULFILLING_STATUSES.has(order.status as OrderStatus)
    ) {
      // Reverse: an already-committed order is being cancelled/refunded — restock
      // every line and release the coupon redemption (mirrors user cancelOrder).
      const { data: items } = await admin
        .from("order_items")
        .select("variant_id, quantity")
        .eq("order_id", id);
      for (const it of items ?? []) {
        if (!it.variant_id) continue;
        const { error: rsErr } = await admin.rpc("restock_inventory", {
          p_variant_id: it.variant_id,
          p_qty: it.quantity,
        });
        if (rsErr) console.error("updateOrderStatus: restock_inventory failed", rsErr);
      }
      const { error: rcErr } = await admin.rpc("release_coupon", { p_order_id: id });
      if (rcErr) console.error("updateOrderStatus: release_coupon failed", rcErr);
    }
  }

  const patch: OrderUpdate = { status };
  const ts = STATUS_TIMESTAMP[status];
  if (ts) (patch as Record<string, unknown>)[ts] = new Date().toISOString();
  const { error } = await supabase.from("orders").update(patch).eq("id", id);
  if (error) throw error;

  // Optional admin note. If the status changed, the trigger already logged a
  // history row — attach the note to it; otherwise record a standalone note.
  const note = optionalText(formData.get("note"));
  if (note) {
    const changed = order ? order.status !== status : true;
    if (changed) {
      const { data: latest } = await admin
        .from("order_status_history")
        .select("id")
        .eq("order_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest) await admin.from("order_status_history").update({ notes: note }).eq("id", latest.id);
    } else {
      const me = await getUser();
      await admin.from("order_status_history").insert({
        order_id: id,
        from_status: status,
        to_status: status,
        notes: note,
        changed_by: me?.id ?? null,
      });
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

// ──────────────────────────────────────────────────────────────────────────
// Content — commute modes (categories) + CMS pages
// ──────────────────────────────────────────────────────────────────────────

/** Edit a commute mode's display copy + live/coming-soon status. */
export async function updateMode(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  if (!id) throw new Error("Missing mode id.");
  const status = String(formData.get("status")) as CategoryStatus;
  if (!CATEGORY_STATUSES.includes(status)) throw new Error("Invalid status.");
  const { error } = await supabase
    .from("categories")
    .update({
      name: requireText(formData.get("name"), "Name"),
      tagline: optionalText(formData.get("tagline")),
      description: optionalText(formData.get("description")),
      status,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/content");
  revalidatePath("/", "layout");
}

/** Upload a hero image for a commute mode (Storage via service-role). */
export async function uploadModeImage(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  if (!id) throw new Error("Missing mode id.");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("No image file provided.");
  const { data: prev } = await supabase.from("categories").select("hero_image_url").eq("id", id).maybeSingle();
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
  const path = `categories/${randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) throw upErr;
  const publicUrl = admin.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from("categories").update({ hero_image_url: publicUrl }).eq("id", id);
  if (error) throw error;
  // Delete the previously-referenced object so replacements don't leak files.
  const oldUrl = prev?.hero_image_url ?? null;
  const oi = oldUrl ? oldUrl.indexOf(STORAGE_PUBLIC_MARKER) : -1;
  if (oldUrl && oi !== -1) {
    await admin.storage.from(IMAGE_BUCKET).remove([decodeURIComponent(oldUrl.slice(oi + STORAGE_PUBLIC_MARKER.length))]);
  }
  revalidatePath("/admin/content");
  revalidatePath("/", "layout");
}

/** Remove a commute mode's hero image (clears the URL + deletes the object). */
export async function removeModeImage(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  if (!id) throw new Error("Missing mode id.");
  const { data: cat } = await supabase
    .from("categories")
    .select("hero_image_url")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("categories").update({ hero_image_url: null }).eq("id", id);
  if (error) throw error;
  const url = cat?.hero_image_url ?? null;
  const idx = url ? url.indexOf(STORAGE_PUBLIC_MARKER) : -1;
  if (url && idx !== -1) {
    const objectPath = decodeURIComponent(url.slice(idx + STORAGE_PUBLIC_MARKER.length));
    const admin = createAdminClient();
    await admin.storage.from(IMAGE_BUCKET).remove([objectPath]);
  }
  revalidatePath("/admin/content");
  revalidatePath("/", "layout");
}

export async function updateCmsPage(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const slug = optionalText(formData.get("slug"));
  const { error } = await supabase
    .from("cms_pages")
    .update({
      title: requireText(formData.get("title"), "Title"),
      body_markdown: String(formData.get("body_markdown") ?? ""),
      meta_title: optionalText(formData.get("meta_title")),
      meta_description: optionalText(formData.get("meta_description")),
      is_published: formData.get("is_published") === "on",
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/content");
  if (slug) revalidatePath(`/${slug}`);
}

export async function setAdminRole(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get("user_id"));
  if (!userId) throw new Error("Missing user id.");
  const makeAdmin = formData.get("make_admin") === "true";

  // `is_admin()` is driven solely by the JWT `app_metadata.role` claim (the
  // `admin_roles` table was dropped in the schema rebuild). Update the claim via
  // the service-role auth admin API — it is the single source of truth.
  if (!makeAdmin) {
    const current = await getUser();
    if (current?.id === userId) {
      throw new Error("You cannot revoke your own admin access.");
    }
  }

  const admin = createAdminClient();
  const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: makeAdmin ? "admin" : "customer" },
  });
  if (authErr) throw authErr;
  // NOTE: the claim change only takes effect on the target's next JWT refresh, so
  // a revoked admin keeps access until their access token expires. supabase-js has
  // no clean per-user session-revocation call; mitigate by keeping the Auth access-
  // token TTL short (Dashboard → Auth → Sessions). RLS/page gates re-read is_admin()
  // from the (then-refreshed) claim, so this is a bounded, not permanent, lag.

  revalidatePath("/admin/customers");
}
