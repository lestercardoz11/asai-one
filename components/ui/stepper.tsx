import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/icons";

export interface Step {
  label: string;
  href?: string;
}

/** Horizontal numbered stepper for the checkout flow. */
export function Stepper({
  steps,
  current,
  className,
}: {
  steps: Step[];
  current: number; // zero-based index of the active step
  className?: string;
}) {
  return (
    <ol className={cn("flex items-center", className)}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center border type-mono text-[11px]",
                  done && "border-navy-800 bg-navy-800 text-white",
                  active && "border-navy-800 bg-white text-navy-800",
                  !done && !active && "border-ink-12 bg-white text-ink-30",
                )}
              >
                {done ? <CheckIcon className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "type-condensed text-[11px]",
                  active ? "text-navy-800" : "text-ink-30",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mx-3 hidden h-px flex-1 sm:block",
                  done ? "bg-navy-800" : "bg-ink-12",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
