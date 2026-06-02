"use client";

import { useState } from "react";
import type { ArtDescriptor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/ui/product-image";

export function ProductGallery({
  images,
  title,
}: {
  images: ArtDescriptor[];
  title: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full border border-ink-12 bg-white">
        <ProductImage art={images[active]} alt={`${title} — view ${active + 1}`} priority />
        <span className="absolute right-3 top-3 type-mono text-[10px] text-ink-30">
          {String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
        </span>
      </div>

      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((art, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "h-20 w-20 border bg-white transition-colors",
                i === active ? "border-navy-800" : "border-ink-12 hover:border-navy-300",
              )}
            >
              <ProductImage art={art} alt={`${title} thumbnail ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
