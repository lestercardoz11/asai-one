import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { remindAbandoned } from "@/lib/notify/dispatch";

/** Constant-time comparison of the cron bearer token to avoid timing leaks. */
function bearerMatches(authorization: string | null, secret: string): boolean {
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(authorization ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Abandoned-cart recovery (build-plan §11). Finds pending orders (contact +
 * items captured at checkout) older than the threshold with no reminder yet, and
 * nudges via the captured channel — email → Resend, phone-only → WhatsApp — so
 * both registered and guest shoppers are reachable.
 *
 * Schedule via Vercel Cron / pg_cron / external scheduler hitting this endpoint
 * with `Authorization: Bearer $CRON_SECRET`.
 */
const THRESHOLD_MINUTES = 30;

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !bearerMatches(request.headers.get("authorization"), secret)) {
    return new Response("unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - THRESHOLD_MINUTES * 60_000).toISOString();

  const { data: orders, error } = await admin
    .from("orders")
    .select("id, email, phone, shipping_address, placed_at")
    .eq("status", "pending")
    .lt("placed_at", cutoff)
    .limit(100);
  if (error) return new Response(error.message, { status: 500 });
  if (!orders || orders.length === 0) return Response.json({ reminded: 0 });

  const ids = orders.map((o) => o.id);
  const { data: notified } = await admin
    .from("notifications")
    .select("order_id")
    .eq("template_key", "abandoned_cart")
    .in("order_id", ids);
  const alreadyReminded = new Set((notified ?? []).map((n) => n.order_id));

  // A `pending` order is NOT an abandoned cart if it's a COD order (placed, awaiting
  // admin confirm) or already has a captured payment (paid but not yet finalized).
  // Reminding those customers "you left items in your cart" would be wrong.
  const { data: pays } = await admin
    .from("payments")
    .select("order_id, method, status")
    .in("order_id", ids);
  const notAbandoned = new Set(
    (pays ?? []).filter((p) => p.method === "cod" || p.status === "captured").map((p) => p.order_id),
  );

  let reminded = 0;
  const channels: Record<string, number> = {};
  for (const o of orders) {
    if (alreadyReminded.has(o.id) || notAbandoned.has(o.id)) continue;
    const { count } = await admin
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("order_id", o.id);
    const channel = await remindAbandoned({
      id: o.id,
      email: o.email,
      phone: o.phone,
      shipping_address: o.shipping_address as { full_name?: string } | null,
      itemCount: count ?? 1,
    });
    if (channel) {
      reminded++;
      channels[channel] = (channels[channel] ?? 0) + 1;
    }
  }

  return Response.json({ reminded, channels });
}
