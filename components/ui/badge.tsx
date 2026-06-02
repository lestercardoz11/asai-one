import { cn } from "@/lib/utils";

export type BadgeTone = "new" | "sale" | "soon" | "returnable" | "non-returnable" | "neutral";

const tones: Record<BadgeTone, string> = {
  new: "bg-navy-800 text-white",
  sale: "bg-error text-white",
  soon: "bg-white text-navy-800 border border-navy-800",
  returnable: "bg-navy-50 text-navy-700 border border-navy-100",
  "non-returnable": "bg-white text-ink-60 border border-ink-12",
  neutral: "bg-white text-ink-60 border border-ink-12",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "type-mono inline-flex items-center px-2 py-1 leading-none text-[10px]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
