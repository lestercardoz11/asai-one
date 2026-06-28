import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Bordered white admin panel with an optional header bar and footer. */
export function Card({
  title,
  description,
  actions,
  footer,
  padded = true,
  className,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const hasHeader = title || description || actions;
  return (
    <section className={cn("border border-ink-12 bg-white", className)}>
      {hasHeader && (
        <div className="flex items-center justify-between gap-4 border-b border-ink-12 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="type-condensed text-sm text-navy-800">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-ink-60">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </div>
      )}
      <div className={cn(padded && "p-5")}>{children}</div>
      {footer && <div className="border-t border-ink-12 px-5 py-4">{footer}</div>}
    </section>
  );
}
