import type { NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureByRazorpayOrder, failByRazorpayOrder } from "@/lib/checkout/finalize";

/**
 * Razorpay payment webhook — the source of truth for payment status (fires even
 * if the browser never returns to the success handler). Verifies the signature
 * against the raw body, dedupes by event id via `webhook_events`, then reconciles.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature)) {
    return new Response("invalid signature", { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: { id?: string; order_id?: string; amount?: number; currency?: string };
      };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const entity = event.payload?.payment?.entity;

  // Idempotency must key off a STABLE provider id, never a random fallback (a
  // random id would let every re-delivery reprocess). Prefer Razorpay's event id
  // header; otherwise derive a deterministic key from the payment id + event type.
  const headerEventId = request.headers.get("x-razorpay-event-id");
  const eventId = headerEventId ?? (entity?.id ? `${entity.id}:${event.event ?? "unknown"}` : null);
  if (!eventId) {
    return new Response("missing event id", { status: 400 });
  }

  const admin = createAdminClient();

  // A duplicate event id violates the PK and is acked without re-processing.
  const { error: dupeErr } = await admin
    .from("webhook_events")
    .insert({ id: eventId, provider: "razorpay", event: event.event ?? "unknown", payload: event });
  if (dupeErr) return new Response("ok (duplicate)", { status: 200 });

  const rzpOrderId = entity?.order_id;

  if (rzpOrderId) {
    if (event.event === "payment.captured" && entity?.id) {
      // Reconcile amount/currency against the DB order — never finalize on a
      // partial/mismatched capture even though the signature is valid.
      const ok = await captureByRazorpayOrder(rzpOrderId, entity.id, {
        amount: entity.amount,
        currency: entity.currency,
      });
      if (!ok) {
        // Capture not reconciled — a true amount/currency mismatch OR a transient
        // DB failure inside captureByRazorpayOrder. Remove the dedupe row so the
        // Razorpay retry REPROCESSES instead of being acked as a duplicate;
        // otherwise a genuinely-paid order could be stranded `pending` with stock
        // never decremented. finalizeOrder's pending→confirmed guard keeps reprocessing safe.
        await admin.from("webhook_events").delete().eq("id", eventId);
        return new Response("capture not reconciled", { status: 409 });
      }
    } else if (event.event === "payment.failed") {
      await failByRazorpayOrder(rzpOrderId);
    }
  }

  return new Response("ok", { status: 200 });
}
