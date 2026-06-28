import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";
import {
  ADMIN_RANGES,
  MAX_CHART_DAYS,
  parseRange,
  type AdminRange,
} from "@/lib/admin/dashboard";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card } from "@/components/admin/ui/card";
import { KpiCard } from "@/components/admin/ui/kpi-card";

interface Kpis {
  revenue_paise: number;
  previous_revenue_paise: number;
  orders: number;
  previous_orders: number;
  aov_paise: number;
  new_customers: number;
  low_stock_count: number;
  pending_reviews: number;
  pending_orders: number;
}

interface LowStockRow {
  quantity: number;
  low_stock_threshold: number;
  products: { name: string } | null;
  product_variants: { variant_name: string | null; sku: string } | null;
}

function delta(curr: number, prev: number): string {
  if (!prev) return curr > 0 ? "▲ new" : "—";
  const pct = Math.round(((curr - prev) / prev) * 100);
  return `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct)}%`;
}

export default async function AdminDashboard({
  searchParams,
}: {
  // Next 16: searchParams is a Promise — must be awaited.
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const days = parseRange(sp.range);
  const chartDays = Math.min(days, MAX_CHART_DAYS);

  const supabase = await createClient();
  const [{ data: kpisRaw }, { data: top }, { data: series }, { data: lowStockRaw }] =
    await Promise.all([
      supabase.rpc("admin_dashboard_kpis", { days }),
      supabase.rpc("admin_top_products", { days, lim: 5 }),
      supabase.rpc("admin_revenue_timeseries", { days: chartDays }),
      supabase
        .from("inventory")
        .select(
          "quantity, low_stock_threshold, products!inner(name, deleted_at), product_variants(variant_name, sku)",
        )
        .is("products.deleted_at", null)
        .order("quantity", { ascending: true })
        .limit(100),
    ]);

  const k = (kpisRaw as unknown as Kpis) ?? null;
  const maxRev = Math.max(1, ...((series ?? []).map((d) => Number(d.revenue_paise))));
  const lowStock = ((lowStockRaw ?? []) as unknown as LowStockRow[])
    .filter((r) => r.quantity <= r.low_stock_threshold)
    .slice(0, 12);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Dashboard"
        description={`Last ${days} days`}
        actions={
          <>
            <RangeSelector current={days} />
            <Link
              href={`/admin/orders/export?range=${days}`}
              prefetch={false}
              className="border border-ink-12 bg-white px-3 py-1.5 type-condensed text-xs text-navy-500 transition-colors hover:text-navy-800"
            >
              Download CSV
            </Link>
          </>
        }
      />

      {!k ? (
        <p className="mt-8 text-ink-60">Analytics unavailable.</p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-px border border-ink-12 bg-ink-12 lg:grid-cols-4">
            <KpiCard label="Revenue" value={formatINR(k.revenue_paise)} sub={delta(k.revenue_paise, k.previous_revenue_paise)} />
            <KpiCard label="Orders" value={String(k.orders)} sub={delta(k.orders, k.previous_orders)} />
            <KpiCard label="Avg. order" value={formatINR(Math.round(k.aov_paise))} />
            <KpiCard label="New customers" value={String(k.new_customers)} />
            <KpiCard label="Pending orders" value={String(k.pending_orders)} alert={k.pending_orders > 0} />
            <KpiCard label="Low stock" value={String(k.low_stock_count)} alert={k.low_stock_count > 0} />
            <KpiCard label="Pending reviews" value={String(k.pending_reviews)} />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <Card title={`Revenue · last ${chartDays} days`}>
              <div className="flex h-40 items-end gap-1">
                {(series ?? []).map((d) => (
                  <div key={d.bucket_date} className="flex flex-1 flex-col items-center gap-1" title={`${d.bucket_date}: ${formatINR(Number(d.revenue_paise))}`}>
                    <div
                      className="w-full bg-navy-500"
                      style={{ height: `${(Number(d.revenue_paise) / maxRev) * 100}%`, minHeight: 2 }}
                    />
                  </div>
                ))}
                {(!series || series.length === 0) && (
                  <p className="text-sm text-ink-30">No revenue in this range.</p>
                )}
              </div>
            </Card>

            <Card title={`Top products · ${days} days`}>
              {top && top.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {top.map((p) => (
                    <li key={p.product_id} className="flex items-center justify-between text-sm">
                      <span className="text-navy-800">{p.product_name}</span>
                      <span className="type-mono text-[11px] text-ink-60">
                        {p.units_sold} sold · {formatINR(Number(p.revenue_paise))}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-30">No sales yet.</p>
              )}
            </Card>
          </div>

          <div className="mt-8">
            <Card
              title="Low stock"
              actions={
                <Link href="/admin/products" className="type-mono text-[10px] text-navy-500 hover:text-navy-800">
                  Manage stock →
                </Link>
              }
              padded={false}
            >
              {lowStock.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-12 text-left type-mono text-[10px] uppercase text-ink-30">
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Variant</th>
                      <th className="px-5 py-3 text-right">Qty</th>
                      <th className="px-5 py-3 text-right">Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-12">
                    {lowStock.map((r, i) => (
                      <tr key={`${r.products?.name}-${r.product_variants?.sku}-${i}`}>
                        <td className="px-5 py-3 text-navy-800">{r.products?.name ?? "—"}</td>
                        <td className="px-5 py-3 text-ink-60">
                          {r.product_variants?.variant_name ?? r.product_variants?.sku ?? "—"}
                        </td>
                        <td className={`px-5 py-3 text-right tabular-nums ${r.quantity === 0 ? "text-error" : "text-navy-800"}`}>
                          {r.quantity}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-ink-30">{r.low_stock_threshold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="px-5 py-8 text-center text-sm text-ink-30">All variants are above their thresholds.</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function RangeSelector({ current }: { current: AdminRange }) {
  return (
    <div className="flex border border-ink-12 bg-white" role="group" aria-label="Date range">
      {ADMIN_RANGES.map((r) => {
        const active = r === current;
        return (
          <Link
            key={r}
            href={`/admin?range=${r}`}
            aria-current={active ? "page" : undefined}
            className={`px-3 py-1.5 type-mono text-[11px] transition-colors ${
              active ? "bg-navy-800 text-white" : "text-ink-60 hover:text-navy-800"
            }`}
          >
            {r}d
          </Link>
        );
      })}
    </div>
  );
}
