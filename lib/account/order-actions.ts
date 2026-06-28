"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth/user";

export type OrderActionResult = { ok: boolean; message: string };

// A buyer may cancel only before fulfilment begins. Shipped / delivered /
// already-cancelled / refunded orders are out of their hands.
const CANCELLABLE = new Set(["pending", "confirmed"]);

/**
 * Cancel one of the caller's own orders. Ownership is verified against the RLS
 * SELECT (a user can only read their own orders); the write goes through the
 * service-role client because the orders UPDATE policy is admin-only.
 *
 * Paid online orders are NOT self-cancellable — that requires a refund, handled
 * by support. COD and unpaid orders cancel immediately, restocking inventory if
 * the order had already been confirmed (stock committed at finalize).
 */
export async function cancelOrder(orderId: string): Promise<OrderActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, message: "Please sign in again." };
  if (!orderId) return { ok: false, message: "Something went wrong." };

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, user_id")
    .eq("id", orderId)
    .maybeSingle();
  // RLS already scopes the read; the explicit owner check is defence-in-depth.
  if (!order || order.user_id !== user.id) return { ok: false, message: "Order not found." };

  if (!CANCELLABLE.has(order.status)) {
    return {
      ok: false,
      message: "This order can no longer be cancelled. Please contact support.",
    };
  }

  if (!process.env.SUPABASE_SECRET_KEY) {
    return { ok: false, message: "Cancellations are temporarily unavailable. Please contact support." };
  }
  const admin = createAdminClient();

  // A captured online payment means money has moved — block self-cancel and
  // route to support for a refund. COD payments stay 'created' until delivery.
  const { data: pay } = await admin
    .from("payments")
    .select("status, method")
    .eq("order_id", order.id)
    .maybeSingle();
  if (pay && pay.status === "captured" && pay.method !== "cod") {
    return {
      ok: false,
      message: "This order is already paid. Please request a refund from support.",
    };
  }

  // Atomically flip to cancelled, guarding against a race with admin fulfilment:
  // if the status moved out of the cancellable set in the meantime, 0 rows match.
  const { data: updated, error: updErr } = await admin
    .from("orders")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", order.id)
    .in("status", ["pending", "confirmed"])
    .select("id");
  if (updErr) {
    console.error("cancelOrder: status update failed", updErr);
    return { ok: false, message: "Could not cancel your order. Please try again." };
  }
  if (!updated || updated.length === 0) {
    return {
      ok: false,
      message: "This order can no longer be cancelled. Please contact support.",
    };
  }

  // Only a confirmed order had its stock decremented at finalize — put it back.
  // Pending orders never committed stock, so there's nothing to restore.
  if (order.status === "confirmed") {
    const { data: items } = await admin
      .from("order_items")
      .select("variant_id, quantity")
      .eq("order_id", order.id);
    for (const it of items ?? []) {
      if (!it.variant_id) continue;
      const { error: rsErr } = await admin.rpc("restock_inventory", {
        p_variant_id: it.variant_id,
        p_qty: it.quantity,
      });
      if (rsErr) console.error("cancelOrder: restock_inventory failed", rsErr);
    }
    // Release the coupon so a limited/once-per-user code isn't permanently burned.
    const { error: rcErr } = await admin.rpc("release_coupon", { p_order_id: order.id });
    if (rcErr) console.error("cancelOrder: release_coupon failed", rcErr);
  }

  revalidatePath("/account");
  return { ok: true, message: "Your order has been cancelled." };
}
