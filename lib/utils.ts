/**
 * Minimal class-name composer. We deliberately avoid pulling clsx +
 * tailwind-merge as runtime deps for this prototype — our component set is
 * controlled enough that class collisions are managed by hand. Accepts the same
 * loose argument shapes (strings, falsey values, arrays) for ergonomics.
 */
type ClassValue = string | number | null | false | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
    } else {
      out.push(String(input));
    }
  }
  return out.join(" ");
}

/** Deterministic slugify for ids/anchors. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
