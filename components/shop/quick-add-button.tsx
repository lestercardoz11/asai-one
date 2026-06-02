"use client";

import { useCart } from "@/lib/cart/cart-context";
import { toast } from "@/components/ui/toast";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

/**
 * Quick-add for product cards: adds the product's default variant straight to
 * the cart. Fuller variant selection lives on the PDP.
 */
export function QuickAddButton({
  variantId,
  productId,
  productTitle,
  variantLabel,
  hasChoices,
  size = "sm",
  variant = "secondary",
  full,
  label,
}: {
  variantId: string;
  productId: string;
  productTitle: string;
  variantLabel: string;
  hasChoices: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
  full?: boolean;
  label?: string;
}) {
  const { addItem } = useCart();
  return (
    <Button
      size={size}
      variant={variant}
      full={full}
      onClick={() => {
        addItem(variantId, productId, 1);
        toast({
          title: "Added to cart",
          description: hasChoices
            ? `${productTitle} · ${variantLabel}`
            : productTitle,
          variant: "success",
        });
      }}
    >
      {label ?? (hasChoices ? "Quick Add" : "Add to Cart")}
    </Button>
  );
}
