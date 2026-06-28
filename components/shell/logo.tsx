import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  tone = "navy",
  href = "/",
}: {
  className?: string;
  tone?: "navy" | "white";
  href?: string | null;
}) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2.5",
        tone === "white" ? "text-white" : "text-navy-800",
        className,
      )}
    >
      <Image
        src="/logo.png"
        alt=""
        width={28}
        height={28}
        // The brand mark is navy; on the dark footer (tone="white") render it as a
        // crisp white silhouette so it stays legible.
        className={cn("h-7 w-7", tone === "white" && "brightness-0 invert")}
      />
      <span
        className="inline-flex items-baseline text-2xl font-semibold leading-none tracking-[0.01em]"
        style={{ fontFamily: "var(--font-oswald), sans-serif" }}
      >
        ASAI<span className="text-[#225777]">.One</span>
      </span>
    </span>
  );

  if (href === null) return content;
  return (
    <Link href={href} aria-label="ASAI.One home" className="inline-flex">
      {content}
    </Link>
  );
}
