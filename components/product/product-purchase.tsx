"use client";

import { useMemo, useState } from "react";
import type { Product, VariantSelection } from "@/lib/types";
import { resolveVariant, isValueAvailable, defaultSelection } from "@/lib/variants";
import { useCart } from "@/lib/cart/cart-context";
import { toast } from "@/components/ui/toast";
import { formatINR, discountPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { CheckIcon } from "@/components/icons";

export function ProductPurchase({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [selection, setSelection] = useState<VariantSelection>(() =>
    defaultSelection(product),
  );
  const [qty, setQty] = useState(1);

  const variant = useMemo(
    () => resolveVariant(product, selection) ?? product.variants[0],
    [product, selection],
  );

  const off = discountPct(variant.price, variant.compareAtPrice);
  const inStock = variant.stock > 0;
  const lowStock = inStock && variant.stock <= 10;

  const choose = (optionId: string, valueId: string) =>
    setSelection((prev) => ({ ...prev, [optionId]: valueId }));

  const add = () => {
    if (!inStock) return;
    addItem(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        title: product.title,
        image: product.images[0],
        variantLabel: variant.label,
        sku: variant.sku,
        hasChoices: product.variants.length > 1,
        unitPrice: variant.price,
        compareAtPrice: variant.compareAtPrice,
      },
      qty,
    );
    toast({
      title: "Added to cart",
      description:
        product.variants.length > 1
          ? `${product.title} · ${variant.label} × ${qty}`
          : `${product.title} × ${qty}`,
      variant: "success",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* price */}
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-condensed text-3xl font-semibold tabular-nums text-navy-800">
          {formatINR(variant.price)}
        </span>
        {variant.compareAtPrice && (
          <span className="type-mono text-base text-ink-30 line-through">
            {formatINR(variant.compareAtPrice)}
          </span>
        )}
        {off && <Badge tone="sale">Save {off}%</Badge>}
      </div>

      {/* variant options */}
      {product.options.map((option) => {
        const selectedValueId = selection[option.id];
        const selectedValue = option.values.find((v) => v.id === selectedValueId);
        return (
          <fieldset key={option.id} className="flex flex-col gap-2.5">
            <legend className="type-mono text-ink-60">
              {option.name}:{" "}
              <span className="text-navy-800">{selectedValue?.value}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const selected = selectedValueId === value.id;
                const available = isValueAvailable(product, option, value.id, selection);
                return (
                  <button
                    key={value.id}
                    type="button"
                    onClick={() => choose(option.id, value.id)}
                    aria-pressed={selected}
                    disabled={!available && !selected}
                    className={cn(
                      "min-w-16 border px-4 py-2.5 type-condensed text-xs transition-colors",
                      selected
                        ? "border-navy-800 bg-navy-800 text-white"
                        : "border-ink-12 bg-white text-navy-800 hover:border-navy-800",
                      !available &&
                        !selected &&
                        "cursor-not-allowed border-ink-12 text-ink-30 line-through hover:border-ink-12",
                    )}
                  >
                    {value.value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {/* stock */}
      <p className="type-mono text-[11px]">
        {inStock ? (
          <span className={cn(lowStock ? "text-error" : "text-navy-500")}>
            {lowStock ? `Only ${variant.stock} left` : "In stock"} · SKU {variant.sku}
          </span>
        ) : (
          <span className="text-ink-30">Out of stock · SKU {variant.sku}</span>
        )}
      </p>

      {/* qty + add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <QuantitySelector value={qty} onChange={setQty} />
        <Button size="lg" full onClick={add} disabled={!inStock} className="sm:flex-1">
          {inStock ? `Add to Cart · ${formatINR(variant.price * qty)}` : "Out of Stock"}
        </Button>
      </div>

      {/* trust line */}
      <ul className="flex flex-col gap-1.5 border-t border-ink-12 pt-5">
        {product.features.slice(0, 3).map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-ink-60">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" />
            {f}
          </li>
        ))}
      </ul>

      {/* sticky mobile add bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-12 bg-white/95 p-3 backdrop-blur sm:hidden">
        <div className="container-page flex items-center gap-3">
          <div className="leading-tight">
            <p className="font-condensed text-lg font-semibold tabular-nums text-navy-800">
              {formatINR(variant.price * qty)}
            </p>
            {product.variants.length > 1 && (
              <p className="type-mono text-[10px] text-ink-30">{variant.label}</p>
            )}
          </div>
          <Button size="lg" onClick={add} disabled={!inStock} className="flex-1">
            {inStock ? "Add to Cart" : "Out of Stock"}
          </Button>
        </div>
      </div>
    </div>
  );
}
