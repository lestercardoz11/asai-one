"use client";

import type { ReactNode } from "react";
import { useCart } from "@/lib/cart/cart-context";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FreeShipBar } from "@/components/cart/free-ship-bar";

function Row({
  label,
  value,
  muted,
  strong,
}: {
  label: ReactNode;
  value: ReactNode;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          strong ? "type-condensed text-sm text-navy-800" : "text-sm",
          muted ? "text-ink-60" : "text-ink",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          strong ? "font-condensed text-lg font-semibold text-navy-800" : "text-sm",
          muted && "text-ink-60",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Order totals panel. Consumed by both the Cart and Checkout pages. */
export function OrderSummary({
  title = "Order Summary",
  children,
  className,
}: {
  title?: string;
  /** Footer slot — e.g. coupon field + proceed button. */
  children?: ReactNode;
  className?: string;
}) {
  const { subtotal, shipping, discount, total, itemCount } = useCart();

  return (
    <div className={cn("border border-ink-12 bg-white", className)}>
      <div className="border-b border-ink-12 px-5 py-4">
        <h2 className="type-condensed text-sm text-navy-800">{title}</h2>
      </div>
      <div className="flex flex-col gap-3 px-5 py-5">
        <FreeShipBar />
        <Row
          label={`Subtotal (${itemCount} ${itemCount === 1 ? "item" : "items"})`}
          value={formatINR(subtotal)}
        />
        {discount > 0 && (
          <Row label="Discount" value={`− ${formatINR(discount)}`} muted />
        )}
        <Row
          label="Shipping"
          value={shipping === 0 ? "Free" : formatINR(shipping)}
          muted
        />
        <div className="my-1 h-px bg-ink-12" />
        <Row label="Total" value={formatINR(total)} strong />
        <p className="type-mono text-[10px] text-ink-30">Inclusive of all taxes</p>
      </div>
      {children && <div className="border-t border-ink-12 px-5 py-5">{children}</div>}
    </div>
  );
}
