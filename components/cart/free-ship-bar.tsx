"use client";

import { useCart } from "@/lib/cart/cart-context";
import { FREE_SHIP_THRESHOLD } from "@/lib/checkout/pricing";
import { formatINR } from "@/lib/format";
import { TruckIcon, CheckIcon } from "@/components/icons";

/** Progress nudge toward the free-shipping threshold. Renders nothing for an
 *  empty cart; "unlocked" once shipping is free, otherwise the remaining amount. */
export function FreeShipBar() {
  const { subtotal, shipping } = useCart();
  if (subtotal <= 0) return null;

  const unlocked = shipping === 0;
  const remaining = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
  const pct = Math.min(100, Math.round((subtotal / FREE_SHIP_THRESHOLD) * 100));

  return (
    <>
      <div aria-live="polite" className="flex flex-col gap-2">
        <p className="inline-flex items-center gap-2 type-condensed text-xs text-navy-800">
          {unlocked ? (
            <>
              <CheckIcon className="h-4 w-4 text-navy-500" />
              You&apos;ve unlocked FREE shipping
            </>
          ) : (
            <>
              <TruckIcon className="h-4 w-4 text-navy-500" />
              Add <span className="tabular-nums">{formatINR(remaining)}</span> for FREE shipping
            </>
          )}
        </p>
        <div className="h-1.5 w-full bg-ink-12">
          <div
            className="h-full bg-navy-800 transition-[width] duration-500"
            style={{ width: `${unlocked ? 100 : pct}%` }}
          />
        </div>
      </div>
      <div className="h-px bg-ink-12" />
    </>
  );
}
