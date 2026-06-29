import Link from "next/link";
import type { ReactNode } from "react";

/** Consistent admin page header: optional back link, display title, optional
 *  description, and a right-aligned actions slot. */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-ink-12 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="type-condensed text-xs text-navy-500 transition-colors hover:text-navy-800"
          >
            ← {backLabel}
          </Link>
        )}
        <h1 className="type-display text-4xl text-navy-800">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-60">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
