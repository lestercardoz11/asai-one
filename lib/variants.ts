import type {
  Product,
  ProductVariant,
  VariantAttributes,
  VariantAxisKey,
} from "@/lib/types";

/**
 * Pure, synchronous variant helpers shared by the PDP and cart. The model is
 * attribute-based so a single set of helpers drives every case — the simple
 * pack/tier toggles and the two-axis DryLock (weight × pack) selector alike.
 */

/** Distinct option values present for an axis, in first-seen order. */
export function axisOptions(
  product: Product,
  key: VariantAxisKey,
): Array<NonNullable<VariantAttributes[VariantAxisKey]>> {
  const seen = new Set<string>();
  const out: Array<NonNullable<VariantAttributes[VariantAxisKey]>> = [];
  for (const v of product.variants) {
    const val = v.attributes[key];
    if (val == null) continue;
    const id = String(val);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(val);
  }
  return out;
}

/** Find the variant matching a full set of selected attributes. */
export function resolveVariant(
  product: Product,
  selection: VariantAttributes,
): ProductVariant | undefined {
  const keys = product.variantAxes.map((a) => a.key);
  return product.variants.find((v) =>
    keys.every((k) => v.attributes[k] === selection[k]),
  );
}

/**
 * Whether a candidate value on `key` is reachable given the rest of the current
 * selection — used to disable impossible combinations in the UI.
 */
export function isOptionAvailable(
  product: Product,
  key: VariantAxisKey,
  value: NonNullable<VariantAttributes[VariantAxisKey]>,
  selection: VariantAttributes,
): boolean {
  const otherKeys = product.variantAxes
    .map((a) => a.key)
    .filter((k) => k !== key);
  return product.variants.some(
    (v) =>
      v.attributes[key] === value &&
      otherKeys.every((k) => v.attributes[k] === selection[k]) &&
      v.stock > 0,
  );
}

/** The selection object for a product's default variant. */
export function defaultSelection(product: Product): VariantAttributes {
  const def =
    product.variants.find((v) => v.id === product.defaultVariantId) ??
    product.variants[0];
  return { ...def.attributes };
}

/** Human label for an axis value (e.g. weightGrams 150 → "150g"). */
export function formatAxisValue(
  key: VariantAxisKey,
  value: NonNullable<VariantAttributes[VariantAxisKey]>,
): string {
  switch (key) {
    case "weightGrams":
      return `${value}g`;
    case "packSize":
      return value === 1 ? "Single" : `Pack of ${value}`;
    case "tier":
      return String(value).charAt(0).toUpperCase() + String(value).slice(1);
    default:
      return String(value);
  }
}
