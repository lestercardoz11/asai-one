import type {
  CommuteMode,
  Coupon,
  Product,
  ProductVariant,
} from "@/lib/types";
import { MODES } from "./modes";
import { PRODUCTS } from "./products";
import { COUPONS } from "./coupons";

/**
 * Backend-agnostic data adapter.
 *
 * Every component reads the catalogue through these functions — never from the
 * mock arrays directly. In Phase 3 the bodies are reimplemented against Supabase
 * with the SAME signatures, so swapping the data source touches this file only.
 *
 * Functions are async on purpose: it mirrors the real (network) data layer and
 * keeps call sites unchanged across the Phase 3 swap. The data is static, so
 * pages still prerender to static shells — navigations stay instant without
 * Cache Components (see docs/PHASE-0-2-DELIVERY.md).
 */

function clone<T>(value: T): T {
  return structuredClone(value);
}

const liveModeIds = new Set(
  MODES.filter((m) => m.status === "live").map((m) => m.id),
);

function isShoppable(p: Product): boolean {
  return p.published && liveModeIds.has(p.modeId);
}

/* ── Modes ─────────────────────────────────────────────────────────────────── */

export async function getModes(): Promise<CommuteMode[]> {
  return clone(MODES);
}

export async function getMode(slug: string): Promise<CommuteMode | undefined> {
  return clone(MODES.find((m) => m.slug === slug));
}

/* ── Products ──────────────────────────────────────────────────────────────── */

/** All shoppable products (published + belonging to a live mode). */
export async function getProducts(): Promise<Product[]> {
  return clone(PRODUCTS.filter(isShoppable));
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const p = PRODUCTS.find((x) => x.slug === slug && isShoppable(x));
  return clone(p);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return clone(PRODUCTS.find((x) => x.id === id && isShoppable(x)));
}

export async function getProductsByMode(modeSlug: string): Promise<Product[]> {
  const mode = MODES.find((m) => m.slug === modeSlug);
  if (!mode || mode.status !== "live") return [];
  return clone(PRODUCTS.filter((p) => p.modeId === mode.id && isShoppable(p)));
}

export async function getFeaturedProducts(): Promise<Product[]> {
  // Best sellers first, then new arrivals — the home carousel order.
  const live = PRODUCTS.filter(isShoppable);
  const score = (p: Product) => (p.isBestSeller ? 2 : 0) + (p.isNew ? 1 : 0);
  return clone([...live].sort((a, b) => score(b) - score(a)));
}

export async function getBestSellers(): Promise<Product[]> {
  return clone(PRODUCTS.filter((p) => isShoppable(p) && p.isBestSeller));
}

export async function getNewArrivals(): Promise<Product[]> {
  return clone(PRODUCTS.filter((p) => isShoppable(p) && p.isNew));
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return getProducts();
  return clone(
    PRODUCTS.filter(
      (p) =>
        isShoppable(p) &&
        (p.title.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.features.some((f) => f.toLowerCase().includes(q))),
    ),
  );
}

/* ── Variants ──────────────────────────────────────────────────────────────── */

export async function getVariant(
  variantId: string,
): Promise<{ product: Product; variant: ProductVariant } | undefined> {
  for (const p of PRODUCTS) {
    const variant = p.variants.find((v) => v.id === variantId);
    if (variant) return clone({ product: p, variant });
  }
  return undefined;
}

/* ── Coupons ───────────────────────────────────────────────────────────────── */

export async function getCoupon(code: string): Promise<Coupon | undefined> {
  return clone(
    COUPONS.find((c) => c.code.toLowerCase() === code.trim().toLowerCase()),
  );
}

/** Synchronous coupon lookup for the client cart (catalogue is bundled). */
export function findCouponSync(code: string): Coupon | undefined {
  const c = COUPONS.find(
    (x) => x.code.toLowerCase() === code.trim().toLowerCase(),
  );
  return c ? { ...c } : undefined;
}

/**
 * Synchronous variant resolver for the client-side cart. Safe in Phase 2
 * because the mock catalogue is bundled; in Phase 3 the cart hydrates line
 * items from server data instead.
 */
export function resolveVariantSync(
  variantId: string,
): { product: Product; variant: ProductVariant } | undefined {
  for (const p of PRODUCTS) {
    const variant = p.variants.find((v) => v.id === variantId);
    if (variant) return { product: p, variant };
  }
  return undefined;
}

export { COUPONS };
