import type {
  ArtDescriptor,
  CommuteMode,
  Coupon,
  ModeIcon,
  Product,
  ProductOption,
  ProductVariant,
} from "@/lib/types";

/**
 * Row → domain mappers. These translate the Supabase schema into the exact
 * `lib/types` shapes the (signed-off) UI consumes, so swapping the data source
 * never touches a component. Keep in sync with `lib/supabase/database.types`.
 */

/* The PostgREST select strings — colocated with the mappers that read them. */
// Variants embed via the single product_id relationship (default_variant_id is a
// plain column now — no FK — so there's no longer a second path to disambiguate).
// Options/values and the variant↔value junction are embedded for the normalized
// variant model.
export const PRODUCT_SELECT = `
  id, slug, name, short_description, description, price_paise, rating, review_count,
  is_featured, is_new, is_returnable, shipping_policy, specs, features,
  default_variant_id, category_id,
  product_options ( id, name, position, product_option_values ( id, value, position ) ),
  product_variants ( id, product_id, sku, variant_name, price_paise, original_price_paise, position, is_active, variant_option_values ( option_value_id ), inventory ( quantity ) ),
  product_images ( url, alt, position, is_primary )
` as const;

export const MODE_SELECT = `
  id, slug, name, status, description, icon, tagline, hero_image_url, sort_order
` as const;

/* Branded-art fallback pattern per product family (cosmetic; src wins when set). */
const PATTERN_BY_SLUG: Record<string, ArtDescriptor["pattern"]> = {
  "asai-absrb": "absorb",
  "asai-childlock": "lock",
  "asai-drylock-pods": "pods",
  "asai-pureride": "rings",
  "asai-shield": "shield",
};

function artFromImage(
  slug: string,
  url: string,
  position: number,
): ArtDescriptor {
  return {
    src: url,
    pattern: PATTERN_BY_SLUG[slug] ?? "compass",
    accent: 500,
    tone: "white",
    seed: `${slug}-${position}`,
  };
}

type DbVariant = {
  id: string;
  product_id: string;
  sku: string;
  variant_name: string | null;
  price_paise: number | null;
  original_price_paise: number | null;
  position: number;
  is_active: boolean;
  variant_option_values: { option_value_id: string }[] | null;
  inventory: { quantity: number }[] | null;
};

type DbOption = {
  id: string;
  name: string;
  position: number;
  product_option_values: { id: string; value: string; position: number }[] | null;
};

type DbImage = {
  url: string;
  alt: string | null;
  position: number;
  is_primary: boolean;
};

type DbProduct = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  price_paise: number;
  rating: number | string | null;
  review_count: number | null;
  is_featured: boolean;
  is_new: boolean;
  is_returnable: boolean;
  shipping_policy: string | null;
  specs: unknown;
  features: string[] | null;
  default_variant_id: string | null;
  category_id: string;
  product_options: DbOption[] | null;
  product_variants: DbVariant[] | null;
  product_images: DbImage[] | null;
};

// A variant's price_paise is an OVERRIDE; null means "inherit the product base price"
// (never 0 — selling at ₹0 was a real bug before inheritance).
function mapVariant(v: DbVariant, basePrice: number): ProductVariant {
  const stock = (v.inventory ?? []).reduce((s, i) => s + (i.quantity ?? 0), 0);
  return {
    id: v.id,
    productId: v.product_id,
    label: v.variant_name ?? "",
    optionValueIds: (v.variant_option_values ?? []).map((x) => x.option_value_id),
    price: v.price_paise ?? basePrice,
    compareAtPrice: v.original_price_paise ?? undefined,
    sku: v.sku,
    stock,
  };
}

function mapOption(o: DbOption): ProductOption {
  return {
    id: o.id,
    name: o.name,
    values: (o.product_option_values ?? [])
      .sort((a, b) => a.position - b.position)
      .map((val) => ({ id: val.id, value: val.value })),
  };
}

export function mapProduct(p: DbProduct): Product {
  const variants = (p.product_variants ?? [])
    .filter((v) => v.is_active)
    .sort((a, b) => a.position - b.position)
    .map((v) => mapVariant(v, p.price_paise));

  const options = (p.product_options ?? [])
    .sort((a, b) => a.position - b.position)
    .map(mapOption);

  const images = (p.product_images ?? [])
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position)
    .map((img) => artFromImage(p.slug, img.url, img.position));

  const basePrice = variants.length
    ? Math.min(...variants.map((v) => v.price))
    : p.price_paise;

  const specs = Array.isArray(p.specs)
    ? (p.specs as { label: string; value: string }[])
    : [];

  return {
    id: p.id,
    slug: p.slug,
    modeId: p.category_id,
    title: p.name,
    shortDescription: p.short_description ?? "",
    longDescription: p.description ?? "",
    basePrice,
    images,
    features: p.features ?? [],
    specs,
    reviewSummary: {
      rating: Number(p.rating ?? 0),
      count: p.review_count ?? 0,
    },
    shippingPolicy: p.shipping_policy ?? "Ships in 24–48h",
    returnPolicy: p.is_returnable ? "returnable" : "non_returnable",
    isBestSeller: p.is_featured,
    isNew: p.is_new,
    published: true, // RLS only returns active, non-deleted products
    variants,
    defaultVariantId: p.default_variant_id ?? variants[0]?.id ?? "",
    options,
  };
}

type DbCategory = {
  id: string;
  slug: string;
  name: string;
  status: string;
  description: string | null;
  icon: string | null;
  tagline: string | null;
  hero_image_url: string | null;
  sort_order: number;
};

const ICON_BY_SLUG: Record<string, ModeIcon> = {
  "2-wheeler": "two-wheeler",
  "4-wheeler": "four-wheeler",
  pedestrian: "pedestrian",
  "public-transport": "public-transport",
};

export function mapMode(c: DbCategory): CommuteMode {
  const status = c.status === "active" ? "live" : "coming_soon";
  const icon = (c.icon as ModeIcon) ?? ICON_BY_SLUG[c.slug] ?? "two-wheeler";

  let bannerImage: ArtDescriptor | undefined;
  if (c.hero_image_url) {
    bannerImage = {
      src: c.hero_image_url,
      pattern: "compass",
      accent: 800,
      tone: "navy",
      seed: `${c.slug}-banner`,
    };
  } else if (status === "live") {
    bannerImage = { pattern: "compass", accent: 800, tone: "navy", seed: `${c.slug}-banner` };
  }

  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon,
    status,
    description: c.description ?? "",
    tagline: c.tagline ?? "",
    bannerImage,
  };
}

type DbCoupon = {
  code: string;
  type: string;
  value_paise: number | null;
  percent_off: number | string | null;
  min_subtotal_paise: number | null;
  max_discount_paise: number | null;
  description: string | null;
};

export function mapCoupon(c: DbCoupon): Coupon {
  const type: Coupon["type"] =
    c.type === "percent" ? "percent" : c.type === "free_shipping" ? "free_shipping" : "flat";
  const value =
    type === "percent" ? Number(c.percent_off ?? 0) : type === "flat" ? c.value_paise ?? 0 : 0;
  return {
    code: c.code,
    type,
    value,
    minSubtotal: c.min_subtotal_paise || undefined,
    maxDiscount: c.max_discount_paise ?? undefined,
    label: c.description ?? c.code,
  };
}
