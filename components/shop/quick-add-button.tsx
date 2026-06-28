"use client";

import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart/cart-context";
import { toast } from "@/components/ui/toast";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

/**
 * Quick-add for product cards: adds the product's default variant straight to
 * the cart with a price/display snapshot. Fuller variant selection lives on the
 * PDP.
 */
export function QuickAddButton({
  product,
  size = "sm",
  variant = "secondary",
  full,
  label,
}: {
  product: Product;
  size?: ButtonSize;
  variant?: ButtonVariant;
  full?: boolean;
  label?: string;
}) {
  const { addItem } = useCart();
  const defaultVariant =
    product.variants.find((v) => v.id === product.defaultVariantId) ??
    product.variants[0];
  const hasChoices = product.variants.length > 1;

  return (
    <Button
      size={size}
      variant={variant}
      full={full}
      disabled={!defaultVariant}
      onClick={() => {
        if (!defaultVariant) return;
        addItem({
          variantId: defaultVariant.id,
          productId: product.id,
          slug: product.slug,
          title: product.title,
          image: product.images[0],
          variantLabel: defaultVariant.label,
          sku: defaultVariant.sku,
          hasChoices,
          unitPrice: defaultVariant.price,
          compareAtPrice: defaultVariant.compareAtPrice,
        });
        toast({
          title: "Added to cart",
          description: hasChoices
            ? `${product.title} · ${defaultVariant.label}`
            : product.title,
          variant: "success",
        });
      }}
    >
      {label ?? (hasChoices ? "Quick Add" : "Add to Cart")}
    </Button>
  );
}
