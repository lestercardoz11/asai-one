"use client";

import Link from "next/link";
import type { CartLine as CartLineType } from "@/lib/cart/cart-context";
import { useCart } from "@/lib/cart/cart-context";
import { formatINR } from "@/lib/format";
import { ProductImage } from "@/components/ui/product-image";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { CloseIcon } from "@/components/icons";

export function CartLine({ line }: { line: CartLineType }) {
  const { setQty, removeItem } = useCart();

  return (
    <div className="flex gap-4 py-5">
      <Link
        href={`/product/${line.slug}`}
        className="relative block h-24 w-24 shrink-0 overflow-hidden border border-ink-12 bg-white"
      >
        <ProductImage art={line.image} alt={line.title} />
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/product/${line.slug}`}
              className="type-condensed text-sm text-navy-800 transition-colors hover:text-navy-500"
            >
              {line.title}
            </Link>
            {line.hasChoices && (
              <p className="mt-0.5 type-mono text-ink-60">{line.variantLabel}</p>
            )}
            <p className="mt-0.5 type-mono text-[10px] text-ink-30">SKU {line.sku}</p>
          </div>
          <button
            type="button"
            onClick={() => removeItem(line.variantId)}
            aria-label={`Remove ${line.title}`}
            className="text-ink-30 transition-colors hover:text-error"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-auto flex items-end justify-between pt-3">
          <QuantitySelector
            size="sm"
            value={line.qty}
            onChange={(q) => setQty(line.variantId, q)}
          />
          <div className="text-right">
            <p className="font-condensed text-base font-semibold tabular-nums text-navy-800">
              {formatINR(line.lineTotal)}
            </p>
            {line.qty > 1 && (
              <p className="type-mono text-[10px] text-ink-30">
                {formatINR(line.unitPrice)} each
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
