"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { FreeShipBar } from "@/components/cart/free-ship-bar";
import { ProductImage } from "@/components/ui/product-image";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  CloseIcon,
  ArrowRightIcon,
  CartIcon,
  MinusIcon,
  PlusIcon,
} from "@/components/icons";

export function MiniCart() {
  const { lines, itemCount, subtotal, drawerOpen, closeCart, setQty, removeItem } =
    useCart();

  // Lock background scroll + close on Escape while open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    if (drawerOpen) document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeCart]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70]",
        drawerOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!drawerOpen}
    >
      <div
        className={cn(
          "absolute inset-0 bg-navy-900/40 transition-opacity duration-200",
          drawerOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={closeCart}
      />
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex w-[88%] max-w-md flex-col bg-white transition-transform duration-300 ease-out",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
      >
        <div className="flex h-16 items-center justify-between border-b border-ink-12 px-5">
          <h2 className="type-condensed text-sm text-navy-800">
            Your Cart {itemCount > 0 && `· ${itemCount}`}
          </h2>
          <button
            type="button"
            aria-label="Close cart"
            onClick={closeCart}
            className="grid h-10 w-10 place-items-center text-navy-800"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <CartIcon className="h-10 w-10 text-ink-30" strokeWidth={1.25} />
            <p className="type-display mt-4 text-2xl text-navy-800">Your cart is empty</p>
            <Link
              href="/shop"
              onClick={closeCart}
              className={buttonVariants({ size: "lg", className: "mt-6" })}
            >
              Shop the lineup
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-ink-12 px-5 py-4">
              <FreeShipBar />
            </div>
            <ul className="flex-1 divide-y divide-ink-12 overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.variantId} className="flex gap-3 py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-ink-12 bg-near-white">
                    <ProductImage art={l.image} alt={l.title} />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="type-condensed text-[13px] text-navy-800">{l.title}</p>
                    {l.hasChoices && (
                      <p className="type-mono text-[10px] text-ink-30">{l.variantLabel}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center border border-ink-12">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          className="grid h-7 w-7 place-items-center text-navy-800 disabled:text-ink-30"
                          onClick={() => setQty(l.variantId, l.qty - 1)}
                          disabled={l.qty <= 1}
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center type-mono text-[11px] text-navy-800">
                          {l.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          className="grid h-7 w-7 place-items-center text-navy-800"
                          onClick={() => setQty(l.variantId, l.qty + 1)}
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="tabular-nums text-sm text-navy-800">
                        {formatINR(l.lineTotal)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${l.title}`}
                    onClick={() => removeItem(l.variantId)}
                    className="self-start text-ink-30 transition-colors hover:text-navy-800"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-ink-12 px-5 py-5">
              <div className="flex items-center justify-between">
                <span className="type-condensed text-sm text-navy-800">Subtotal</span>
                <span className="font-condensed text-lg font-semibold tabular-nums text-navy-800">
                  {formatINR(subtotal)}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/checkout/shipping"
                  onClick={closeCart}
                  className={buttonVariants({ size: "lg", full: true })}
                >
                  Checkout <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className={buttonVariants({ variant: "secondary", size: "lg", full: true })}
                >
                  View full cart
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
