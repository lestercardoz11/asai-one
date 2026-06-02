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
  const { product, variant, item, lineTotal } = line;
  const hasChoices = product.variants.length > 1;

  return (
    <div className="flex gap-4 py-5">
      <Link
        href={`/product/${product.slug}`}
        className="block h-24 w-24 shrink-0 border border-ink-12"
      >
        <ProductImage art={product.images[0]} alt={product.title} />
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/product/${product.slug}`}
              className="type-condensed text-sm text-navy-800 transition-colors hover:text-navy-500"
            >
              {product.title}
            </Link>
            {hasChoices && (
              <p className="mt-0.5 type-mono text-ink-60">{variant.label}</p>
            )}
            <p className="mt-0.5 type-mono text-[10px] text-ink-30">
              SKU {variant.sku}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeItem(variant.id)}
            aria-label={`Remove ${product.title}`}
            className="text-ink-30 transition-colors hover:text-error"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-auto flex items-end justify-between pt-3">
          <QuantitySelector
            size="sm"
            value={item.qty}
            onChange={(q) => setQty(variant.id, q)}
          />
          <div className="text-right">
            <p className="font-condensed text-base font-semibold tabular-nums text-navy-800">
              {formatINR(lineTotal)}
            </p>
            {item.qty > 1 && (
              <p className="type-mono text-[10px] text-ink-30">
                {formatINR(variant.price)} each
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
