import { pgTable, uuid, text, bigint, integer, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { cartStatus } from "./enums";
import { products, productVariants } from "./catalogue";
import { orders } from "./orders";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* ── Carts ─────────────────────────────────────────────────────────────────── */
export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"), // → auth.users (companion SQL)
    anonId: text("anon_id"),
    status: cartStatus("status").notNull().default("active"),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true }),
    reminderEmailSentAt: timestamp("reminder_email_sent_at", { withTimezone: true }),
    reminderWhatsappSentAt: timestamp("reminder_whatsapp_sent_at", { withTimezone: true }),
    // New: link an abandoned/converted cart to the order it became.
    convertedOrderId: uuid("converted_order_id").references(() => orders.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("carts_user_idx").on(t.userId),
    index("carts_status_idx").on(t.status),
    index("carts_converted_order_idx").on(t.convertedOrderId),
  ],
);

/* ── Cart items ────────────────────────────────────────────────────────────── */
export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    quantity: integer("quantity").notNull().default(1),
    unitPricePaise: bigint("unit_price_paise", { mode: "number" }).notNull(),
    ...timestamps,
  },
  (t) => [
    index("cart_items_cart_idx").on(t.cartId),
    index("cart_items_product_idx").on(t.productId),
    index("cart_items_variant_idx").on(t.variantId),
    check("cart_items_quantity_chk", sql`quantity > 0`),
    check("cart_items_unit_price_chk", sql`unit_price_paise >= 0`),
  ],
);
