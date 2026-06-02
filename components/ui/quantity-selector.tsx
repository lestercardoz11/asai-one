"use client";

import { cn } from "@/lib/utils";
import { MinusIcon, PlusIcon } from "@/components/icons";

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const btn =
    "grid place-items-center text-navy-800 transition-colors hover:bg-navy-50 disabled:pointer-events-none disabled:text-ink-30";

  return (
    <div className={cn("inline-flex border border-ink-12 bg-white", className)}>
      <button
        type="button"
        aria-label="Decrease quantity"
        className={cn(btn, dim)}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <span
        aria-live="polite"
        className={cn(
          "grid min-w-10 place-items-center border-x border-ink-12 type-mono text-ink",
          size === "sm" ? "text-[11px]" : "text-xs",
        )}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={cn(btn, dim)}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
