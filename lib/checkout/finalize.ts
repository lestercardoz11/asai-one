import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOrderConfirmed } from "@/lib/notify/dispatch";

/**
 * Order finalization shared by the client-verify Server Action and the Razorpay
 * webhook. Runs with the service-role client (RLS gates these writes). The
 * status guard (`pending` → `confirmed`) makes stock decrement idempotent when
 * both paths fire for the same order.
 */
export async function finalizeOrder(
  dbOrderId: string,
  items: { variantId: string | null; qty: number }[],
  couponId: string | null,
  userId: string | null,
  discount: number,
) {
  const admin = createAdminClient();

  const { data: transitioned } = await admin
    .from("orders")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", dbOrderId)
    .eq("status", "pending")
    .select("id");

  // Only the first transition decrements stock / records redemption.
  if (!transitioned || transitioned.length === 0) return;

  // Atomic, concurrency-safe stock decrement (RPC). Oversell is clamped to 0 and
  // flagged so it can be reconciled (manual review / refund) rather than silently lost.
  for (const it of items) {
    if (!it.variantId) continue;
    const { data: ok, error: invErr } = await admin.rpc("decrement_inventory", {
      p_variant_id: it.variantId,
      p_qty: it.qty,
    });
    if (invErr) console.error("finalizeOrder: decrement_inventory failed", invErr);
    else if (ok === false) {
      console.error("finalizeOrder: OVERSELL — insufficient stock", {
        orderId: dbOrderId,
        variantId: it.variantId,
        qty: it.qty,
      });
    }
  }

  // Idempotent, atomic coupon redemption (RPC) — increments times_redeemed only
  // when a new redemption row is inserted; the unique (coupon_id, order_id)
  // constraint makes a re-run a no-op. coupon_id is the single source of truth
  // now (coupon_code dropped); resolve the code for the redeem RPC.
  if (couponId) {
    const { data: c } = await admin.from("coupons").select("code").eq("id", couponId).maybeSingle();
    if (c?.code) {
      const { data: redeemed, error: redErr } = await admin.rpc("redeem_coupon", {
        p_code: c.code,
        // Guest orders have a null user_id; the SQL param is nullable even though
        // the generated type isn't.
        p_user_id: userId as string,
        p_order_id: dbOrderId,
        p_discount: discount,
      });
      if (redErr) console.error("finalizeOrder: redeem_coupon failed", redErr);
      else if (redeemed === false)
        // Charge already happened at the discounted total, but the coupon was not
        // redeemed (usage/per-user limit hit, or deactivated mid-flight). Flag for review.
        console.error("finalizeOrder: coupon NOT redeemed — order confirmed at a discounted total; manual review", {
          orderId: dbOrderId,
          couponId,
        });
    }
  }

  // Transactional order-confirmation email (Resend). Best-effort.
  try {
    await notifyOrderConfirmed(dbOrderId);
  } catch (e) {
    console.error("order confirmation notify failed", e);
  }
}

/**
 * Mark a payment captured by its Razorpay order id and finalize the order.
 * Returns false when the captured amount/currency does not reconcile with the
 * recorded payment (caller should NOT ack the webhook as success).
 */
export async function captureByRazorpayOrder(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  captured?: { amount?: number; currency?: string },
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: pay, error: payErr } = await admin
    .from("payments")
    .select("order_id, amount_paise")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();
  if (payErr) {
    console.error("captureByRazorpayOrder: payment lookup failed", payErr);
    return false;
  }
  if (!pay) return true; // nothing to reconcile (unknown order) — ack to stop retries

  // Reconcile money before trusting the capture. Razorpay enforces amount at
  // order creation, but we re-verify defensively against the DB.
  if (captured) {
    if (typeof captured.amount === "number" && captured.amount !== pay.amount_paise) {
      console.error("captureByRazorpayOrder: amount mismatch", {
        expected: pay.amount_paise,
        got: captured.amount,
      });
      return false;
    }
    if (captured.currency && captured.currency.toUpperCase() !== "INR") {
      console.error("captureByRazorpayOrder: currency mismatch", captured.currency);
      return false;
    }
  }

  const { error: updErr } = await admin
    .from("payments")
    .update({
      razorpay_payment_id: razorpayPaymentId,
      status: "captured",
      captured_at: new Date().toISOString(),
    })
    .eq("razorpay_order_id", razorpayOrderId);
  if (updErr) {
    console.error("captureByRazorpayOrder: capture update failed", updErr);
    return false;
  }

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, user_id, coupon_id, discount_paise")
    .eq("id", pay.order_id)
    .single();
  if (orderErr || !order) {
    console.error("captureByRazorpayOrder: order lookup failed", orderErr);
    return false;
  }
  const { data: items, error: itemsErr } = await admin
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", pay.order_id);
  if (itemsErr) console.error("captureByRazorpayOrder: order_items lookup failed", itemsErr);

  await finalizeOrder(
    order.id,
    (items ?? []).map((i) => ({ variantId: i.variant_id, qty: i.quantity })),
    order.coupon_id,
    order.user_id,
    order.discount_paise,
  );
  return true;
}

export async function failByRazorpayOrder(razorpayOrderId: string) {
  const admin = createAdminClient();
  await admin
    .from("payments")
    .update({ status: "failed" })
    .eq("razorpay_order_id", razorpayOrderId);
}
