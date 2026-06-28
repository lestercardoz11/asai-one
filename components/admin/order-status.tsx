/** Shared order-status presentation for the admin Orders screens. */

export const ORDER_STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "border-ink-12 bg-near-white text-ink-60" },
  confirmed: { label: "Confirmed", cls: "border-navy-500 bg-navy-50 text-navy-800" },
  processing: { label: "Processing", cls: "border-navy-500 bg-navy-50 text-navy-800" },
  shipped: { label: "Shipped", cls: "border-navy-800 bg-navy-800 text-white" },
  delivered: { label: "Delivered", cls: "border-navy-800 bg-navy-800 text-white" },
  cancelled: { label: "Cancelled", cls: "border-error bg-white text-error" },
  refunded: { label: "Refunded", cls: "border-error bg-white text-error" },
};

export function StatusBadge({ status }: { status: string }) {
  const m = ORDER_STATUS_META[status] ?? { label: status, cls: "border-ink-12 text-ink-60" };
  return (
    <span className={`inline-block border px-2 py-0.5 type-mono text-[10px] uppercase ${m.cls}`}>
      {m.label}
    </span>
  );
}
