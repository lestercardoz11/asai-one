import Link from "next/link";
import type { CommuteMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MODE_ICONS, ArrowRightIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";

export function ModeCard({
  mode,
  className,
}: {
  mode: CommuteMode;
  className?: string;
}) {
  const Icon = MODE_ICONS[mode.icon];
  const live = mode.status === "live";

  return (
    <Link
      href={`/commute/${mode.slug}`}
      aria-label={`${mode.name}${live ? "" : " — coming soon"}`}
      className={cn(
        "group relative flex flex-col justify-between border border-ink-12 bg-white p-5 transition-transform duration-200 ease-out hover:-translate-y-0.5 min-h-44",
        !live && "bg-near-white",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <Icon
          className={cn(
            "h-9 w-9",
            live ? "text-navy-800" : "text-ink-30",
          )}
          strokeWidth={1.25}
        />
        {live ? (
          <ArrowRightIcon className="h-5 w-5 text-ink-30 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-navy-800" />
        ) : (
          <Badge tone="soon">Coming Soon</Badge>
        )}
      </div>

      <div className="mt-6">
        <h3
          className={cn(
            "type-condensed text-base",
            live ? "text-navy-800" : "text-ink-60",
          )}
        >
          {mode.name}
        </h3>
        <p className="mt-1 text-[13px] leading-snug text-ink-60">
          {live ? mode.tagline : mode.description}
        </p>
      </div>

      {live && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-navy-800 transition-transform duration-200 group-hover:scale-x-100"
        />
      )}
    </Link>
  );
}
