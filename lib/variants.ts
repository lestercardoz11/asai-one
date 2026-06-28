import type { Product, ProductOption, ProductVariant, VariantSelection } from "@/lib/types";

/**
 * Pure, synchronous variant helpers shared by the PDP and cart. The model is
 * normalized: a product has ordered options/values, and each variant pins one
 * value per option (by id). A selection maps option id → chosen value id.
 */

/** The variant matching a full selection (one value per option). */
export function resolveVariant(
  product: Product,
  selection: VariantSelection,
): ProductVariant | undefined {
  const wanted = Object.values(selection);
  return product.variants.find(
    (v) =>
      v.optionValueIds.length === wanted.length &&
      wanted.every((id) => v.optionValueIds.includes(id)),
  );
}

/**
 * Whether a candidate value on `option` is reachable given the rest of the
 * current selection — used to disable impossible combinations in the UI.
 */
export function isValueAvailable(
  product: Product,
  option: ProductOption,
  valueId: string,
  selection: VariantSelection,
): boolean {
  return product.variants.some((v) => {
    if (v.stock <= 0) return false;
    if (!v.optionValueIds.includes(valueId)) return false;
    // Every *other* option must still match the current selection.
    return product.options.every((o) => {
      if (o.id === option.id) return true;
      const sel = selection[o.id];
      return sel == null || v.optionValueIds.includes(sel);
    });
  });
}

/** The selection object for a product's default variant. */
export function defaultSelection(product: Product): VariantSelection {
  const def =
    product.variants.find((v) => v.id === product.defaultVariantId) ??
    product.variants[0];
  const selection: VariantSelection = {};
  if (!def) return selection;
  for (const option of product.options) {
    const match = option.values.find((val) => def.optionValueIds.includes(val.id));
    if (match) selection[option.id] = match.id;
  }
  return selection;
}
