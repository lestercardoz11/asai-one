import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateOrderStatus } from "@/lib/admin/actions";
import { formatINR } from "@/lib/format";
import { StatusBadge } from "@/components/admin/order-status";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card } from "@/components/admin/ui/card";
import { FormGrid, AdminField } from "@/components/admin/ui/form-grid";
import { FormActions } from "@/components/admin/ui/form-actions";
import { Select, Textarea } from "@/components/ui/field";

type Params = Promise<{ id: string }>;

// The forward fulfilment path and the natural next step from each state.
const FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;
const STEP_LABEL: Record<string, string> = {
  pending: "Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};
const NEXT: Record<string, { status: string; label: string }> = {
  pending: { status: "confirmed", label: "Confirm order" },
  confirmed: { status: "processing", label: "Start processing" },
  processing: { status: "shipped", label: "Mark as shipped" },
  shipped: { status: "delivered", label: "Mark as delivered" },
};
const ALL_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

type Address = {
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

function dt(at: string | null | undefined): string {
  return at ? new Date(at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";
}

export default async function AdminOrderDetail({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, email, phone, status, subtotal_paise, shipping_paise, tax_paise, discount_paise, total_paise, shipping_address, notes, placed_at, confirmed_at, shipped_at, delivered_at, cancelled_at, order_items(product_name, sku, variant_label, quantity, unit_price_paise, total_paise), payments(method, status, amount_paise, razorpay_payment_id, captured_at), order_status_history(from_status, to_status, notes, created_at)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const ship = (order.shipping_address ?? {}) as unknown as Address;
  const items = order.order_items ?? [];
  const payment = (order.payments ?? [])[0];
  const history = [...(order.order_status_history ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const terminal = order.status === "cancelled" || order.status === "refunded";
  const currentRank = (FLOW as readonly string[]).indexOf(order.status);
  const next = NEXT[order.status];
  const stepAt: Record<string, string | null> = {
    pending: order.placed_at,
    confirmed: order.confirmed_at,
    processing: null,
    shipped: order.shipped_at,
    delivered: order.delivered_at,
  };

  const canCancel = ["pending", "confirmed", "processing", "shipped"].includes(order.status);
  const canRefund = ["confirmed", "processing", "shipped", "delivered"].includes(order.status);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={order.order_number}
        description={`Placed ${dt(order.placed_at)}`}
        backHref="/admin/orders"
        backLabel="Orders"
        actions={<StatusBadge status={order.status} />}
      />

      {terminal && (
        <div className="mt-4 border border-error bg-white px-4 py-3 text-sm text-error">
          This order was {order.status === "refunded" ? "refunded" : "cancelled"}
          {order.cancelled_at ? ` on ${dt(order.cancelled_at)}` : ""}. Stock was returned and any
          coupon released.
        </div>
      )}

      {/* ── Fulfilment workflow ───────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="type-condensed text-lg text-navy-800">Fulfilment</h2>
        <ol className={`mt-4 grid grid-cols-5 gap-2 ${terminal ? "opacity-50" : ""}`}>
          {FLOW.map((s, i) => {
            const reached = !terminal && i <= currentRank;
            const isCurrent = !terminal && i === currentRank;
            return (
              <li key={s} className="flex flex-col items-center text-center">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full border text-xs ${
                    reached ? "border-navy-800 bg-navy-800 text-white" : "border-ink-12 bg-white text-ink-30"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`mt-2 type-condensed text-[11px] ${
                    isCurrent ? "text-navy-800" : reached ? "text-navy-500" : "text-ink-30"
                  }`}
                >
                  {STEP_LABEL[s]}
                </span>
                {stepAt[s] && <span className="mt-0.5 type-mono text-[9px] text-ink-30">{dt(stepAt[s])}</span>}
              </li>
            );
          })}
        </ol>
        {/* connecting line under the circles */}
        <div className="mt-2 h-px bg-ink-12" />
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* ── Left: items + totals + history ──────────────────────────────── */}
        <div>
          <Card title="Items" padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-12 text-left type-mono text-[10px] uppercase text-ink-30">
                    <th className="px-4 py-2">Item</th>
                    <th className="px-4 py-2">Qty</th>
                    <th className="px-4 py-2">Price</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-12">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3">
                        <p className="text-navy-800">{it.product_name}</p>
                        <p className="type-mono text-[10px] text-ink-30">
                          {it.variant_label ? `${it.variant_label} · ` : ""}
                          {it.sku}
                        </p>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{it.quantity}</td>
                      <td className="px-4 py-3 tabular-nums">{formatINR(it.unit_price_paise)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(it.total_paise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Totals */}
          <div className="mt-3 ml-auto max-w-xs space-y-1 text-sm">
            <Row label="Subtotal" value={formatINR(order.subtotal_paise)} />
            {order.discount_paise > 0 && <Row label="Discount" value={`− ${formatINR(order.discount_paise)}`} />}
            <Row label="Shipping" value={order.shipping_paise ? formatINR(order.shipping_paise) : "Free"} />
            {order.tax_paise > 0 && <Row label="Tax" value={formatINR(order.tax_paise)} />}
            <div className="flex justify-between border-t border-ink-12 pt-1 font-condensed text-base font-semibold text-navy-800">
              <span>Total</span>
              <span className="tabular-nums">{formatINR(order.total_paise)}</span>
            </div>
          </div>

          {/* History */}
          <div className="mt-10">
            <Card title="History">
              <ul className="flex flex-col gap-3 border-l border-ink-12 pl-4">
                {history.map((h, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-navy-500" />
                    <p className="text-sm text-navy-800">
                      {h.from_status ? `${h.from_status} → ` : ""}
                      <span className="font-medium">{h.to_status}</span>
                    </p>
                    <p className="type-mono text-[10px] text-ink-30">{dt(h.created_at)}</p>
                    {h.notes && <p className="mt-0.5 text-[13px] text-ink-60">&quot;{h.notes}&quot;</p>}
                  </li>
                ))}
                {history.length === 0 && <li className="text-sm text-ink-30">No history yet.</li>}
              </ul>
            </Card>
          </div>
        </div>

        {/* ── Right: customer + payment + actions ─────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Next step */}
          <Card title="Move forward">
            {next ? (
              <form action={updateOrderStatus}>
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="status" value={next.status} />
                <AdminField label="Note">
                  <Textarea name="note" rows={2} placeholder="Add a note (optional)…" />
                </AdminField>
                <FormActions>
                  <Button type="submit">{next.label}</Button>
                </FormActions>
              </form>
            ) : (
              <p className="text-sm text-ink-60">
                {terminal ? "This order is closed." : "This order is delivered — nothing left to do."}
              </p>
            )}

            {(canCancel || canRefund) && (
              <div className="mt-4 flex flex-wrap gap-3 border-t border-ink-12 pt-4">
                {canCancel && (
                  <form action={updateOrderStatus}>
                    <input type="hidden" name="id" value={order.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <button type="submit" className="type-condensed text-xs text-error hover:opacity-80">
                      Cancel order
                    </button>
                  </form>
                )}
                {canRefund && (
                  <form action={updateOrderStatus}>
                    <input type="hidden" name="id" value={order.id} />
                    <input type="hidden" name="status" value="refunded" />
                    <button type="submit" className="type-condensed text-xs text-error hover:opacity-80">
                      Mark refunded
                    </button>
                  </form>
                )}
              </div>
            )}
          </Card>

          {/* Manual status override */}
          <Card title="Set status">
            <form action={updateOrderStatus}>
              <input type="hidden" name="id" value={order.id} />
              <FormGrid>
                <AdminField label="Status">
                  <Select name="status" defaultValue={order.status}>
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s}
                      </option>
                    ))}
                  </Select>
                </AdminField>
                <AdminField label="Note">
                  <Textarea name="note" rows={2} placeholder="Note (optional)…" />
                </AdminField>
              </FormGrid>
              <FormActions>
                <Button type="submit" variant="secondary">Update status</Button>
              </FormActions>
            </form>
          </Card>

          {/* Customer */}
          <Card title="Customer">
            <div className="space-y-1 text-sm text-ink-60">
              {ship.full_name && <p className="text-navy-800">{ship.full_name}</p>}
              {order.email && (
                <p>
                  <a href={`mailto:${order.email}`} className="hover:underline">
                    {order.email}
                  </a>
                </p>
              )}
              {order.phone && <p>{order.phone}</p>}
            </div>
            <h3 className="type-mono text-[10px] text-ink-30 mt-4">Shipping address</h3>
            <address className="mt-1 not-italic text-sm text-ink-60">
              {ship.line1}
              {ship.line2 ? <>, {ship.line2}</> : null}
              <br />
              {[ship.city, ship.state, ship.postal_code].filter(Boolean).join(", ")}
              <br />
              {ship.country}
            </address>
          </Card>

          {/* Payment */}
          <Card title="Payment">
            {payment ? (
              <div className="space-y-1 text-sm text-ink-60">
                <p>
                  <span className="type-mono text-[10px] text-ink-30">Method</span>{" "}
                  <span className="uppercase text-navy-800">{payment.method}</span>
                </p>
                <p>
                  <span className="type-mono text-[10px] text-ink-30">Status</span>{" "}
                  <span className="uppercase text-navy-800">{payment.status}</span>
                </p>
                <p>
                  <span className="type-mono text-[10px] text-ink-30">Amount</span>{" "}
                  <span className="tabular-nums text-navy-800">{formatINR(payment.amount_paise)}</span>
                </p>
                {payment.captured_at && (
                  <p className="type-mono text-[10px] text-ink-30">Captured {dt(payment.captured_at)}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink-30">No payment recorded.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-60">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
