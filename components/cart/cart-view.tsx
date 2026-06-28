"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { CartLine } from "@/components/cart/cart-line";
import { OrderSummary } from "@/components/cart/order-summary";
import { CouponField } from "@/components/cart/coupon-field";
import { buttonVariants } from "@/components/ui/button";
import { CartIcon, ArrowRightIcon, LockIcon } from "@/components/icons";

export function CartView() {
  const { lines, ready, itemCount } = useCart();

  if (!ready) {
    return <div className="h-64 animate-fade" aria-busy />;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md border border-ink-12 bg-white px-8 py-16 text-center">
        <CartIcon className="mx-auto h-10 w-10 text-ink-30" strokeWidth={1.25} />
        <h2 className="type-display mt-4 text-3xl text-navy-800">Your cart is empty</h2>
        <p className="mt-2 text-ink-60">
          Nothing here yet. Find the kit that makes your commute better.
        </p>
        <Link
          href="/commute/2-wheeler"
          className={buttonVariants({ size: "lg", className: "mt-6" })}
        >
          Shop 2-Wheeler <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      {/* lines */}
      <div>
        <div className="flex items-center justify-between border-b border-ink-12 pb-3">
          <h2 className="type-condensed text-sm text-navy-800">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </h2>
          <Link href="/shop" className="type-condensed text-xs text-navy-500 hover:text-navy-800">
            Continue shopping
          </Link>
        </div>
        <div className="divide-y divide-ink-12">
          {lines.map((line) => (
            <CartLine key={line.variantId} line={line} />
          ))}
        </div>
      </div>

      {/* summary */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <OrderSummary>
          <div className="flex flex-col gap-4">
            <CouponField />
            <Link
              href="/checkout/shipping"
              className={buttonVariants({ size: "lg", full: true })}
            >
              Proceed to Checkout <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <p className="inline-flex items-center justify-center gap-1.5 type-mono text-[10px] text-ink-30">
              <LockIcon className="h-3.5 w-3.5" /> Secure, encrypted checkout
            </p>
          </div>
        </OrderSummary>
      </div>
    </div>
  );
}
