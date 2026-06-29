import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Right-aligned action row at the foot of a form. `sticky` pins it to the
 *  bottom of the viewport for long forms (bleeds to the enclosing Card's edges). */
export function FormActions({
  sticky,
  className,
  children,
}: {
  sticky?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-ink-12 pt-5",
        sticky && "sticky bottom-0 -mx-5 -mb-5 bg-white px-5 pb-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
