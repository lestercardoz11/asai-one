import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Eyebrow } from "@/components/ui/section";

export interface PolicyLayoutProps {
  title: string;
  updated: string;
  intro?: string;
  children: ReactNode;
}

/**
 * Shared presentation shell for legal / policy pages.
 * Renders a breadcrumb, a header block, a "last updated" line, then a single
 * readable column of legal prose styled with strong typographic hierarchy.
 */
export function PolicyLayout({ title, updated, intro, children }: PolicyLayoutProps) {
  return (
    <div className="animate-reveal">
      <div className="container-page py-12 sm:py-16">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Policies" },
            { label: title },
          ]}
        />

        <header className="mt-8 border-b border-ink-12 pb-8">
          <Eyebrow>Legal</Eyebrow>
          <h1 className="type-display mt-4 text-4xl text-navy-800 sm:text-5xl">
            {title}
          </h1>
          <p className="type-mono mt-4 text-ink-30">Last updated: {updated}</p>
          {intro && (
            <p className="mt-6 max-w-3xl leading-relaxed text-ink-60">{intro}</p>
          )}
        </header>

        <div className="mt-10 max-w-3xl">{children}</div>
      </div>
    </div>
  );
}

/** A titled section within a policy page. */
export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="type-condensed text-xl text-navy-800">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 leading-relaxed text-ink-60">
        {children}
      </div>
    </section>
  );
}

/** Highlighted key statement — used to draw the eye to important terms. */
export function PolicyCallout({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-2 border-navy-300 bg-navy-50 px-4 py-3 text-navy-700">
      {children}
    </div>
  );
}
