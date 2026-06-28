import {
  pgTable,
  uuid,
  text,
  bigint,
  integer,
  boolean,
  numeric,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
  check,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { categoryStatus, stockMovementReason } from "./enums";

/** created_at/updated_at present on every mutable table (tg_set_updated_at). */
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* ── Categories (now hierarchical via parent_id) ───────────────────────────── */
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: categoryStatus("status").notNull().default("active"),
    sortOrder: integer("sort_order").notNull().default(0),
    heroImageUrl: text("hero_image_url"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    icon: text("icon"),
    tagline: text("tagline"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("categories_slug_key").on(t.slug),
    index("categories_parent_idx").on(t.parentId),
    index("categories_sort_idx").on(t.sortOrder),
  ],
);

/* ── Products ──────────────────────────────────────────────────────────────── */
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    pricePaise: bigint("price_paise", { mode: "number" }).notNull(),
    originalPricePaise: bigint("original_price_paise", { mode: "number" }),
    tags: text("tags").array().notNull().default(sql`'{}'`),
    specs: jsonb("specs").notNull().default(sql`'[]'::jsonb`),
    features: text("features").array().notNull().default(sql`'{}'`),
    compatibility: text("compatibility"),
    isReturnable: boolean("is_returnable").notNull().default(true),
    returnWindowDays: integer("return_window_days").notNull().default(7),
    isActive: boolean("is_active").notNull().default(true),
    isNew: boolean("is_new").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    rating: numeric("rating").notNull().default("0"),
    reviewCount: integer("review_count").notNull().default(0),
    weightGrams: integer("weight_grams"),
    hsnCode: text("hsn_code"),
    shippingPolicy: text("shipping_policy"),
    // Plain column (no FK) — an FK to product_variants would re-create the
    // second products↔variants relationship path that confuses PostgREST embeds.
    defaultVariantId: uuid("default_variant_id"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdBy: uuid("created_by"), // → auth.users (FK added in companion SQL)
    ...timestamps,
  },
  (t) => [
    uniqueIndex("products_slug_key").on(t.slug),
    uniqueIndex("products_sku_key").on(t.sku),
    index("products_category_idx").on(t.categoryId),
    index("products_default_variant_idx").on(t.defaultVariantId),
    index("products_active_idx").on(t.isActive).where(sql`deleted_at IS NULL`),
    check("products_price_chk", sql`price_paise >= 0`),
    check("products_original_price_chk", sql`original_price_paise IS NULL OR original_price_paise >= price_paise`),
    check("products_rating_chk", sql`rating >= 0 AND rating <= 5`),
    check("products_review_count_chk", sql`review_count >= 0`),
    check("products_return_window_chk", sql`return_window_days >= 0`),
  ],
);

/* ── Variant model (fully normalized) ──────────────────────────────────────── */
// Axes (e.g. "Pack size", "Weight"), their allowed values, the SKU-level
// variants, and the junction binding a variant to one value per axis.
export const productOptions = pgTable(
  "product_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("product_options_product_name_key").on(t.productId, t.name),
    index("product_options_product_idx").on(t.productId),
  ],
);

export const productOptionValues = pgTable(
  "product_option_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    optionId: uuid("option_id")
      .notNull()
      .references(() => productOptions.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    uniqueIndex("product_option_values_option_value_key").on(t.optionId, t.value),
    index("product_option_values_option_idx").on(t.optionId),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    variantName: text("variant_name"),
    pricePaise: bigint("price_paise", { mode: "number" }),
    originalPricePaise: bigint("original_price_paise", { mode: "number" }),
    weightGrams: integer("weight_grams"),
    position: integer("position").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("product_variants_sku_key").on(t.sku),
    index("product_variants_product_idx").on(t.productId),
    check("product_variants_price_chk", sql`price_paise IS NULL OR price_paise >= 0`),
    check(
      "product_variants_original_price_chk",
      sql`original_price_paise IS NULL OR price_paise IS NULL OR original_price_paise >= price_paise`,
    ),
  ],
);

export const variantOptionValues = pgTable(
  "variant_option_values",
  {
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    optionValueId: uuid("option_value_id")
      .notNull()
      .references(() => productOptionValues.id, { onDelete: "cascade" }),
  },
  (t) => [
    // A variant pins exactly one value per axis; PK is the (variant, value) pair.
    primaryKey({ columns: [t.variantId, t.optionValueId] }),
    index("variant_option_values_value_idx").on(t.optionValueId),
  ],
);

/* ── Images ────────────────────────────────────────────────────────────────── */
export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt"),
    position: integer("position").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("product_images_product_idx").on(t.productId),
    index("product_images_variant_idx").on(t.variantId),
  ],
);

/* ── Inventory + ledger ────────────────────────────────────────────────────── */
export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    warehouseCode: text("warehouse_code").notNull().default("MUM-1"),
    ...timestamps,
  },
  (t) => [
    index("inventory_product_idx").on(t.productId),
    index("inventory_variant_idx").on(t.variantId),
    // Note: the (product_id, COALESCE(variant_id,…), warehouse_code) unique is a
    // functional index — defined in companion SQL.
    check("inventory_quantity_chk", sql`quantity >= 0`),
    check("inventory_reserved_chk", sql`reserved >= 0`),
  ],
);

/** Append-only audit of every stock change (oversell reconciliation). */
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    delta: bigint("delta", { mode: "number" }).notNull(),
    reason: stockMovementReason("reason").notNull(),
    orderId: uuid("order_id"), // → orders.id (FK in companion SQL, avoids cycle)
    note: text("note"),
    createdBy: uuid("created_by"), // → auth.users
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("stock_movements_variant_idx").on(t.variantId),
    index("stock_movements_order_idx").on(t.orderId),
  ],
);
