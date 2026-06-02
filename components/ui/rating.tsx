import { cn } from "@/lib/utils";
import { StarIcon } from "@/components/icons";
import type { ReviewSummary } from "@/lib/types";

/** Compact 5-star rating with fractional fill, plus optional review count. */
export function Rating({
  summary,
  showCount = true,
  className,
}: {
  summary: ReviewSummary;
  showCount?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (summary.rating / 5) * 100));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="relative inline-flex"
        role="img"
        aria-label={`Rated ${summary.rating} out of 5`}
      >
        <div className="flex text-ink-12">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className="h-3.5 w-3.5" strokeWidth={1.25} />
          ))}
        </div>
        <div
          className="absolute inset-0 flex overflow-hidden text-navy-500"
          style={{ width: `${pct}%` }}
          aria-hidden
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon
              key={i}
              className="h-3.5 w-3.5 shrink-0 fill-navy-500"
              strokeWidth={1.25}
            />
          ))}
        </div>
      </div>
      {showCount && (
        <span className="type-mono text-ink-60">
          {summary.rating.toFixed(1)}{" "}
          <span className="text-ink-30">({summary.count})</span>
        </span>
      )}
    </div>
  );
}
