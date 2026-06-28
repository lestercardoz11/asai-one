import {
  pgTable,
  uuid,
  text,
  bigint,
  integer,
  jsonb,
  timestamp,
  numeric,
  boolean,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orderStatus, paymentMethod, paymentStatus, refundStatus, couponType } from "./enums";

/** created_at/updated_at present on every mutable table (tg_set_updated_at). */
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* ── Coupons ───────────────────────────────────────────────────────────────── */
// Lives with orders to keep the orders↔coupons FK in one module (no import cycle).
export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Stored normalized (lower-cased, trimmed); a unique index on lower(code) is
    // added in companion SQL so the constraint is case-insensitive.
    code: text("code").notNull(),
    description: text("description"),
    type: couponType("type").notNull(),
    valuePaise: bigint("value_paise", { mode: "number" }),
    percentOff: numeric("percent_off"),
    minSubtotalPaise: bigint("min_subtotal_paise", { mode: "number" }).notNull().default(0),
    maxDiscountPaise: bigint("max_discount_paise", { mode: "number" }),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    usageLimit: integer("usage_limit"),
    perUserLimit: integer("per_user_limit"),
    timesRedeemed: integer("times_redeemed").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdBy: uuid("created_by"), // → auth.users (companion SQL)
    ...timestamps,
  },
  () => [
    check("coupons_value_chk", sql`value_paise IS NULL OR value_paise >= 0`),
    check("coupons_percent_chk", sql`percent_off IS NULL OR (percent_off > 0 AND percent_off <= 100)`),
    check("coupons_min_subtotal_chk", sql`min_subtotal_paise >= 0`),
    check("coupons_max_discount_chk", sql`max_discount_paise IS NULL OR max_discount_paise >= 0`),
    check("coupons_usage_limit_chk", sql`usage_limit IS NULL OR usage_limit > 0`),
    check("coupons_per_user_limit_chk", sql`per_user_limit IS NULL OR per_user_limit > 0`),
    check("coupons_times_redeemed_chk", sql`times_redeemed >= 0`),
  ],
);

/* ── Orders ────────────────────────────────────────────────────────────────── */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull(), // assigned by trigger
    userId: uuid("user_id"), // → auth.users (companion SQL); null for guests
    email: text("email").notNull(),
    phone: text("phone"),
    status: orderStatus("status").notNull().default("pending"),
    subtotalPaise: bigint("subtotal_paise", { mode: "number" }).notNull(),
    shippingPaise: bigint("shipping_paise", { mode: "number" }).notNull().default(0),
    taxPaise: bigint("tax_paise", { mode: "number" }).notNull().default(0),
    discountPaise: bigint("discount_paise", { mode: "number" }).notNull().default(0),
    totalPaise: bigint("total_paise", { mode: "number" }).notNull(),
    // coupon_id is the single source of truth — coupon_code dropped in the rebuild.
    couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
    shippingAddress: jsonb("shipping_address").notNull(),
    billingAddress: jsonb("billing_address"),
    notes: text("notes"),
    idempotencyKey: text("idempotency_key"),
    placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_order_number_key").on(t.orderNumber),
    // Partial-unique: dedupe double-submits without blocking many NULLs.
    uniqueIndex("orders_idempotency_key_uq").on(t.idempotencyKey).where(sql`idempotency_key IS NOT NULL`),
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_placed_at_idx").on(t.placedAt),
    index("orders_coupon_idx").on(t.couponId),
    check("orders_phone_chk", sql`phone IS NULL OR phone ~ '^\\+[1-9][0-9]{6,14}$'`),
    check("orders_subtotal_chk", sql`subtotal_paise >= 0`),
    check("orders_shipping_chk", sql`shipping_paise >= 0`),
    check("orders_tax_chk", sql`tax_paise >= 0`),
    check("orders_discount_chk", sql`discount_paise >= 0`),
    check("orders_total_chk", sql`total_paise >= 0`),
  ],
);

/* ── Order items (snapshot at purchase) ────────────────────────────────────── */
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id"), // → products (companion SQL, ON DELETE SET NULL)
    variantId: uuid("variant_id"), // → product_variants (companion SQL, ON DELETE SET NULL)
    productName: text("product_name").notNull(),
    sku: text("sku").notNull(),
    variantLabel: text("variant_label"),
    quantity: integer("quantity").notNull(),
    unitPricePaise: bigint("unit_price_paise", { mode: "number" }).notNull(),
    totalPaise: bigint("total_paise", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    index("order_items_product_idx").on(t.productId),
    index("order_items_variant_idx").on(t.variantId),
    check("order_items_quantity_chk", sql`quantity > 0`),
    check("order_items_unit_price_chk", sql`unit_price_paise >= 0`),
    check("order_items_total_chk", sql`total_paise >= 0`),
  ],
);

/* ── Order status history (trigger-fed) ────────────────────────────────────── */
export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatus("from_status"),
    toStatus: orderStatus("to_status").notNull(),
    notes: text("notes"),
    changedBy: uuid("changed_by"), // → auth.users (companion SQL)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_status_history_order_idx").on(t.orderId)],
);

/* ── Payments ──────────────────────────────────────────────────────────────── */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("razorpay"),
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    razorpaySignature: text("razorpay_signature"),
    method: paymentMethod("method").notNull(),
    status: paymentStatus("status").notNull().default("created"),
    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
    errorCode: text("error_code"),
    errorDescription: text("error_description"),
    rawResponse: jsonb("raw_response"),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    // These uniques double as the lookup indexes — the redundant plain indexes
    // that duplicated them in the old schema are intentionally not recreated.
    uniqueIndex("payments_order_id_key").on(t.orderId),
    uniqueIndex("payments_razorpay_order_id_key").on(t.razorpayOrderId).where(sql`razorpay_order_id IS NOT NULL`),
    uniqueIndex("payments_razorpay_payment_id_key").on(t.razorpayPaymentId).where(sql`razorpay_payment_id IS NOT NULL`),
    check("payments_amount_chk", sql`amount_paise >= 0`),
  ],
);

/* ── Refunds ───────────────────────────────────────────────────────────────── */
export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    razorpayRefundId: text("razorpay_refund_id"),
    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
    status: refundStatus("status").notNull().default("initiated"),
    reason: text("reason"),
    rawResponse: jsonb("raw_response"),
    initiatedBy: uuid("initiated_by"), // → auth.users (companion SQL)
    processedAt: timestamp("processed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("refunds_razorpay_refund_id_key").on(t.razorpayRefundId).where(sql`razorpay_refund_id IS NOT NULL`),
    index("refunds_payment_idx").on(t.paymentId),
    index("refunds_order_idx").on(t.orderId),
    check("refunds_amount_chk", sql`amount_paise > 0`),
  ],
);

/* ── Coupon redemptions ────────────────────────────────────────────────────── */
export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    userId: uuid("user_id"), // → auth.users (companion SQL)
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    discountPaise: bigint("discount_paise", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Single idempotency unique (the duplicate (order_id, coupon_id) is dropped);
    // (coupon_id, user_id) index backs per-user-limit checks.
    uniqueIndex("coupon_redemptions_coupon_order_key").on(t.couponId, t.orderId),
    index("coupon_redemptions_coupon_user_idx").on(t.couponId, t.userId),
    check("coupon_redemptions_discount_chk", sql`discount_paise >= 0`),
  ],
);
