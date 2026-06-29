import { cn } from "@/lib/utils";

/** Dashboard metric tile. Sits in a hairline grid (parent supplies bg-ink-12 + gap-px). */
export function KpiCard({
  label,
  value,
  sub,
  alert,
}: {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div className="bg-white p-5">
      <p className="type-mono text-[11px] uppercase tracking-wide text-ink-30">{label}</p>
      <p
        className={cn(
          "mt-2 font-condensed text-3xl font-semibold tabular-nums",
          alert ? "text-error" : "text-navy-800",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 type-mono text-[11px] text-ink-60">{sub}</p>}
    </div>
  );
}
