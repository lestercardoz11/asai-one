import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";
import { StatusBadge } from "@/components/admin/order-status";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card } from "@/components/admin/ui/card";

const FILTERS = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;
type Filter = (typeof FILTERS)[number];

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter: Filter = (FILTERS as readonly string[]).includes(status ?? "")
    ? (status as Filter)
    : "all";

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, order_number, email, phone, status, total_paise, placed_at");
  if (filter !== "all") query = query.eq("status", filter);
  const { data: orders } = await query.order("placed_at", { ascending: false }).limit(100);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Orders"
        description="Open an order to see its details and move it through the fulfilment workflow."
      />

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <Link
              key={f}
              href={f === "all" ? "/admin/orders" : `/admin/orders?status=${f}`}
              className={`border px-3 py-1.5 type-condensed text-xs capitalize transition-colors ${
                active
                  ? "border-navy-800 bg-navy-800 text-white"
                  : "border-ink-12 bg-white text-ink-60 hover:border-navy-800"
              }`}
            >
              {f}
            </Link>
          );
        })}
      </div>

      <Card padded={false}>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-12 text-left type-mono text-[10px] uppercase text-ink-30">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-12">
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="hover:bg-near-white">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="type-condensed text-xs text-navy-800 hover:underline">
                    {o.order_number}
                  </Link>
                  <p className="type-mono text-[10px] text-ink-30">
                    {new Date(o.placed_at).toLocaleDateString("en-IN")}
                  </p>
                </td>
                <td className="px-4 py-3 text-[13px] text-ink-60">{o.email ?? o.phone ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums">{formatINR(o.total_paise)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="type-condensed text-xs text-navy-500 hover:text-navy-800"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-30">
                  No orders{filter !== "all" ? ` with status “${filter}”` : ""} yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  );
}
