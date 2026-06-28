import "server-only";

/**
 * Shared helpers for the Phase C admin dashboard: the date-range → days mapping
 * used by both the dashboard page and the CSV export route, plus a tiny CSV
 * serializer. Kept framework-free so it stays trivially unit-testable.
 */

/** Selectable dashboard windows, in days. */
export const ADMIN_RANGES = [7, 30, 90] as const;
export type AdminRange = (typeof ADMIN_RANGES)[number];

/** Default window when no (or an invalid) `?range=` is supplied. */
export const DEFAULT_RANGE: AdminRange = 30;

/**
 * The revenue bar chart is capped to the most recent N days for readability —
 * 90 daily bars is unreadable, so for the 90-day range we still chart the last
 * 30 days (the KPIs + top products + low-stock widgets honour the full range).
 */
export const MAX_CHART_DAYS = 30;

/** Coerce a raw `?range=` querystring value to a valid window in days. */
export function parseRange(raw: string | string[] | undefined): AdminRange {
  const first = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(first);
  return (ADMIN_RANGES as readonly number[]).includes(n) ? (n as AdminRange) : DEFAULT_RANGE;
}

/** ISO cutoff timestamp for "now minus `days`", for `placed_at >= cutoff` filters. */
export function rangeCutoffIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * RFC-4180 CSV field: wrap in quotes, double any inner quotes. Also neutralizes
 * spreadsheet formula injection — a value starting with = + - @ (or tab/CR) is
 * prefixed with a single quote so Excel/Sheets treats it as text, not a formula
 * (the exported `email` column is user-controlled).
 */
export function csvField(value: string | number | null | undefined): string {
  let s = value == null ? "" : String(value);
  // Neutralize formulas even when prefixed with whitespace (some apps trim first).
  if (/^\s*[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Serialize a single row of values to a CSV line. */
export function csvRow(fields: ReadonlyArray<string | number | null | undefined>): string {
  return fields.map(csvField).join(",");
}

/** Serialize a header + rows to a CSV document (CRLF line endings per RFC-4180). */
export function toCsv(
  header: ReadonlyArray<string>,
  rows: ReadonlyArray<ReadonlyArray<string | number | null | undefined>>,
): string {
  return [csvRow(header), ...rows.map((r) => csvRow(r))].join("\r\n");
}
