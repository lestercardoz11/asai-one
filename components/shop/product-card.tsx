import Link from "next/link";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatINR, discountPct } from "@/lib/format";
import { ProductImage } from "@/components/ui/product-image";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { QuickAddButton } from "@/components/shop/quick-add-button";
import { TruckIcon, ReturnIcon } from "@/components/icons";

export function ProductCard({
  product,
  className,
  priority,
}: {
  product: Product;
  className?: string;
  priority?: boolean;
}) {
  const defaultVariant =
    product.variants.find((v) => v.id === product.defaultVariantId) ??
    product.variants[0];
  const hasChoices = product.variants.length > 1;
  const minPrice = Math.min(...product.variants.map((v) => v.price));
  const off = discountPct(defaultVariant.price, defaultVariant.compareAtPrice);
  const href = `/product/${product.slug}`;

  return (
    <article
      className={cn(
        "group flex flex-col border border-ink-12 bg-white transition-transform duration-200 ease-out hover:-translate-y-0.5",
        className,
      )}
    >
      <Link href={href} className="block focus-visible:outline-none">
        {/* media */}
        <div className="relative aspect-square overflow-hidden border-b border-ink-12">
          <ProductImage art={product.images[0]} alt={product.title} priority={priority} />
          <div className="absolute left-0 top-0 flex flex-col gap-px p-0">
            {product.isNew && <Badge tone="new">New</Badge>}
            {off && <Badge tone="sale">−{off}%</Badge>}
            {product.isBestSeller && !product.isNew && (
              <Badge tone="soon">Best Seller</Badge>
            )}
          </div>
        </div>

        {/* body */}
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="type-condensed text-sm text-navy-800">{product.title}</h3>
          </div>
          <p className="line-clamp-2 min-h-10 text-[13px] leading-snug text-ink-60">
            {product.shortDescription}
          </p>
          <Rating summary={product.reviewSummary} className="mt-0.5" />

          <div className="mt-1 flex items-baseline gap-2">
            {hasChoices && (
              <span className="type-mono text-ink-30">From</span>
            )}
            <span className="font-condensed text-lg font-semibold tabular-nums text-navy-800">
              {formatINR(hasChoices ? minPrice : defaultVariant.price)}
            </span>
            {defaultVariant.compareAtPrice && !hasChoices && (
              <span className="type-mono text-ink-30 line-through">
                {formatINR(defaultVariant.compareAtPrice)}
              </span>
            )}
          </div>

          {/* policy row */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-60">
            <span className="inline-flex items-center gap-1 type-mono">
              <TruckIcon className="h-3.5 w-3.5" /> 24h
            </span>
            <span className="inline-flex items-center gap-1 type-mono">
              <ReturnIcon className="h-3.5 w-3.5" />
              {product.returnPolicy === "returnable" ? "Returnable" : "Non-Returnable"}
            </span>
          </div>
        </div>
      </Link>

      <div className="mt-auto p-4 pt-0">
        <QuickAddButton full product={product} />
      </div>
    </article>
  );
}
