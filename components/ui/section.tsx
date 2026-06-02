import { cn } from "@/lib/utils";

/** Mono eyebrow label — the small uppercase tag above section titles. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("type-mono inline-flex items-center gap-2 text-navy-500", className)}>
      <span aria-hidden className="h-px w-6 bg-navy-300" />
      {children}
    </span>
  );
}

/** Section heading block: eyebrow + display title + optional subtitle. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="type-display text-4xl text-navy-800 sm:text-5xl">{title}</h2>
      {subtitle && (
        <p className={cn("max-w-2xl text-ink-60", align === "center" && "mx-auto")}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
