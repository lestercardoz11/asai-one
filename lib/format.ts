/**
 * Money is stored as integer **paise** everywhere in the app (build-plan
 * convention) — never as floats. Format only at the display boundary.
 */

const inrWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format integer paise as an INR string, e.g. 129900 → "₹1,299". */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return Number.isInteger(rupees) ? inrWhole.format(rupees) : inrPaise.format(rupees);
}

/** Convert a whole-rupee figure to paise (authoring helper for mock data). */
export function rupees(amount: number): number {
  return Math.round(amount * 100);
}

/** Percentage off, rounded, given current + compare-at prices in paise. */
export function discountPct(price: number, compareAt?: number): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
