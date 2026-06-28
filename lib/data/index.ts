import type { CommuteMode, Coupon, Product, ProductVariant } from "@/lib/types";
import { publicClient } from "@/lib/supabase/public";
import {
  MODE_SELECT,
  PRODUCT_SELECT,
  mapCoupon,
  mapMode,
  mapProduct,
} from "./map";

/**
 * Backend data adapter (Phase 3 — Supabase).
 *
 * Every component reads the catalogue through these functions — never from the
 * database directly. The signatures are unchanged from the Phase 2 mock adapter,
 * so swapping the data source touched only this file + the row→domain mappers.
 *
 * Reads use the cookieless public (anon) client; row visibility is governed by
 * RLS (active, non-deleted products / live categories / valid coupons).
 */

/* ── Modes (categories) ──────────────────────────────────────────────────── */

export async function getModes(): Promise<CommuteMode[]> {
  const { data, error } = await publicClient()
    .from("categories")
    .select(MODE_SELECT)
    .is("deleted_at", null)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(mapMode);
}

export async function getMode(slug: string): Promise<CommuteMode | undefined> {
  const { data, error } = await publicClient()
    .from("categories")
    .select(MODE_SELECT)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMode(data) : undefined;
}

async function liveCategoryIds(): Promise<string[]> {
  const { data, error } = await publicClient()
    .from("categories")
    .select("id, status")
    .eq("status", "active")
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((c) => c.id);
}

/* ── Products ────────────────────────────────────────────────────────────── */

/** All shoppable products (active + belonging to a live mode). */
export async function getProducts(): Promise<Product[]> {
  const liveIds = await liveCategoryIds();
  if (liveIds.length === 0) return [];
  const { data, error } = await publicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .in("category_id", liveIds)
    .order("name");
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const { data, error } = await publicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const liveIds = await liveCategoryIds();
  if (!liveIds.includes(data.category_id)) return undefined;
  return mapProduct(data);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const { data, error } = await publicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const liveIds = await liveCategoryIds();
  if (!liveIds.includes(data.category_id)) return undefined;
  return mapProduct(data);
}

export async function getProductsByMode(modeSlug: string): Promise<Product[]> {
  const mode = await getMode(modeSlug);
  if (!mode || mode.status !== "live") return [];
  const { data, error } = await publicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("category_id", mode.id)
    .order("name");
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  // Best sellers first, then new arrivals — the home carousel order.
  const products = await getProducts();
  const score = (p: Product) => (p.isBestSeller ? 2 : 0) + (p.isNew ? 1 : 0);
  return [...products].sort((a, b) => score(b) - score(a));
}

export async function getBestSellers(): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.isBestSeller);
}

export async function getNewArrivals(): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.isNew);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  const products = await getProducts();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      p.features.some((f) => f.toLowerCase().includes(q)),
  );
}

/* ── Variants ────────────────────────────────────────────────────────────── */

export async function getVariant(
  variantId: string,
): Promise<{ product: Product; variant: ProductVariant } | undefined> {
  const { data, error } = await publicClient()
    .from("product_variants")
    .select("product_id")
    .eq("id", variantId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const product = await getProductById(data.product_id);
  if (!product) return undefined;
  const variant = product.variants.find((v) => v.id === variantId);
  return variant ? { product, variant } : undefined;
}

/* ── Coupons ─────────────────────────────────────────────────────────────── */

export async function getCoupon(code: string): Promise<Coupon | undefined> {
  const trimmed = code.trim();
  if (!trimmed) return undefined;
  // Lookup via a SECURITY DEFINER RPC: anon can no longer `select * from coupons`
  // to enumerate every active code. The RPC enforces active/window/usage-limit
  // and returns at most the single matching, currently-usable coupon.
  const { data, error } = await publicClient().rpc("lookup_coupon", { p_code: trimmed });
  if (error) throw error;
  const row = data?.[0];
  return row ? mapCoupon(row) : undefined;
}
