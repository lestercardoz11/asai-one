"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderItem, PaymentMethod } from "@/lib/types";

const ORDER_SELECT =
  "id, order_number, user_id, email, phone, status, subtotal_paise, shipping_paise, discount_paise, total_paise, shipping_address, placed_at";

interface OrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  status: string;
  subtotal_paise: number;
  shipping_paise: number;
  discount_paise: number;
  total_paise: number;
  shipping_address: { full_name?: string } | null;
  placed_at: string;
}

/**
 * Read an order for the confirmation screen. Authorization is by EITHER:
 *  - the signed-in owner (RLS-scoped read by order_number), OR
 *  - a matching access_token (service-role read, exact-token match only).
 * Returns null when neither holds, so the page shows its empty state.
 */
export async function getOrderForConfirmation(input: {
  number: string;
  token?: string | null;
}): Promise<Order | null> {
  const number = input.number?.trim();
  if (!number) return null;
  // Demo mode (no persistence) — nothing to read; the in-memory page handles it.
  if (!process.env.SUPABASE_SECRET_KEY) return null;

  // Owner path: RLS only returns the row if the caller owns it.
  const supabase = await createClient();
  let row = (
    await supabase.from("orders").select(ORDER_SELECT).eq("order_number", number).maybeSingle()
  ).data as OrderRow | null;

  // Token path: exact (order_number, access_token) match via service role.
  if (!row && input.token) {
    const admin = createAdminClient();
    row = (
      await admin
        .from("orders")
        .select(ORDER_SELECT)
        .eq("order_number", number)
        .eq("access_token", input.token)
        .maybeSingle()
    ).data as OrderRow | null;
  }
  if (!row) return null;

  // Line items + payment are read with the service role once authorized above.
  const admin = createAdminClient();
  const { data: items } = await admin
    .from("order_items")
    .select("product_name, variant_label, sku, unit_price_paise, quantity")
    .eq("order_id", row.id);
  const { data: pay } = await admin
    .from("payments")
    .select("method, status")
    .eq("order_id", row.id)
    .maybeSingle();

  const orderItems: OrderItem[] = (items ?? []).map((i) => ({
    productTitle: i.product_name,
    variantLabel: i.variant_label ?? "",
    sku: i.sku,
    unitPrice: i.unit_price_paise,
    qty: i.quantity,
  }));

  const method = (pay?.method ?? "upi") as PaymentMethod;
  return {
    id: row.order_number,
    contactName: row.shipping_address?.full_name ?? "",
    contactEmail: row.email,
    contactPhone: row.phone ?? "",
    items: orderItems,
    paymentMethod: method,
    paymentStatus: pay?.status === "captured" ? "paid" : method === "cod" ? "cod_pending" : "pending",
    subtotal: row.subtotal_paise,
    shipping: row.shipping_paise,
    discount: row.discount_paise,
    total: row.total_paise,
    status: row.status === "pending" ? "placed" : (row.status as Order["status"]),
    createdAt: row.placed_at,
  };
}
