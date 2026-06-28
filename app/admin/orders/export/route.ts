import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/auth/user";
import { parseRange, rangeCutoffIso, toCsv } from "@/lib/admin/dashboard";

/**
 * Admin-only CSV export of orders for the selected `?range=7|30|90` window.
 * Gated by `getIsAdmin()` (defense-in-depth on top of RLS) and read via the
 * authenticated server client so admin RLS policies apply.
 */
const HEADER = [
  "order_number",
  "placed_at",
  "status",
  "email",
  "subtotal_paise",
  "discount_paise",
  "shipping_paise",
  "total_paise",
] as const;

export async function GET(request: NextRequest) {
  if (!(await getIsAdmin())) {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseRange(searchParams.get("range") ?? undefined);

  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "order_number, placed_at, status, email, subtotal_paise, discount_paise, shipping_paise, total_paise",
    )
    .gte("placed_at", rangeCutoffIso(days))
    .order("placed_at", { ascending: false });

  if (error) {
    return new Response("Export failed", { status: 500 });
  }

  const csv = toCsv(
    HEADER,
    (orders ?? []).map((o) => [
      o.order_number,
      o.placed_at,
      o.status,
      o.email,
      o.subtotal_paise,
      o.discount_paise,
      o.shipping_paise,
      o.total_paise,
    ]),
  );

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${days}d.csv"`,
    },
  });
}
