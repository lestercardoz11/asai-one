import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { reviewStatus, addressKind } from "./enums";
import { products } from "./catalogue";
import { orders } from "./orders";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* ── Profiles (1:1 with auth.users; auto-created by tg_handle_new_user) ─────── */
export const profiles = pgTable(
  "profiles",
  {
    // PK == auth.users.id; FK added in companion SQL (ON DELETE CASCADE).
    id: uuid("id").primaryKey(),
    email: text("email"),
    phone: text("phone"),
    fullName: text("full_name"),
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    whatsappOptIn: boolean("whatsapp_opt_in").notNull().default(false),
    ...timestamps,
  },
  () => [check("profiles_phone_chk", sql`phone IS NULL OR phone ~ '^\\+[1-9][0-9]{6,14}$'`)],
);

/* ── Addresses ─────────────────────────────────────────────────────────────── */
export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(), // → auth.users (companion SQL)
    kind: addressKind("kind").notNull().default("both"),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull().default("IN"),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("addresses_user_idx").on(t.userId),
    // At most one default address per user.
    uniqueIndex("addresses_user_default_uq").on(t.userId).where(sql`is_default`),
    check("addresses_phone_chk", sql`phone ~ '^\\+[1-9][0-9]{6,14}$'`),
  ],
);

/* ── Reviews ───────────────────────────────────────────────────────────────── */
// Single `status` source of truth (is_published dropped). Public read = approved.
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(), // → auth.users (companion SQL)
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(),
    title: text("title"),
    body: text("body"),
    isVerifiedPurchase: boolean("is_verified_purchase").notNull().default(false),
    status: reviewStatus("status").notNull().default("pending"),
    ...timestamps,
  },
  (t) => [
    index("reviews_product_idx").on(t.productId),
    index("reviews_user_idx").on(t.userId),
    index("reviews_status_idx").on(t.status),
    check("reviews_rating_chk", sql`rating >= 1 AND rating <= 5`),
  ],
);

/* ── Wishlist ──────────────────────────────────────────────────────────────── */
export const wishlist = pgTable(
  "wishlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(), // → auth.users (companion SQL)
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One row per (user, product) — the duplicate unique index is not recreated.
    uniqueIndex("wishlist_user_product_key").on(t.userId, t.productId),
    index("wishlist_product_idx").on(t.productId),
  ],
);
