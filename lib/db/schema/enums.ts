import { pgEnum } from "drizzle-orm/pg-core";

/** Postgres enum types. `user_role` is gone — admin is the JWT claim only. */

export const categoryStatus = pgEnum("category_status", ["active", "coming_soon", "archived"]);
export const cartStatus = pgEnum("cart_status", ["active", "abandoned", "converted", "merged"]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);
export const paymentMethod = pgEnum("payment_method", ["upi", "card", "netbanking", "wallet", "cod"]);
export const paymentStatus = pgEnum("payment_status", [
  "created",
  "authorized",
  "captured",
  "failed",
  "refunded",
  "partially_refunded",
]);
export const refundStatus = pgEnum("refund_status", ["initiated", "processed", "failed"]);
export const couponType = pgEnum("coupon_type", ["percent", "fixed_amount", "free_shipping"]);
export const reviewStatus = pgEnum("review_status", ["pending", "approved", "rejected"]);
export const addressKind = pgEnum("address_kind", ["shipping", "billing", "both"]);
export const bannerPlacement = pgEnum("banner_placement", [
  "home_hero",
  "shop_top",
  "category_top",
  "checkout_top",
]);
export const campaignChannel = pgEnum("campaign_channel", ["email", "whatsapp", "sms"]);
export const campaignStatus = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "failed",
  "cancelled",
]);
export const notificationChannel = pgEnum("notification_channel", ["email", "whatsapp", "sms"]);
export const notificationStatus = pgEnum("notification_status", [
  "queued",
  "sent",
  "delivered",
  "failed",
  "bounced",
]);

/** New in the rebuild. */
export const stockMovementReason = pgEnum("stock_movement_reason", [
  "order",
  "restock",
  "adjustment",
  "return",
  "reservation_release",
]);
export const returnRequestStatus = pgEnum("return_request_status", [
  "requested",
  "approved",
  "rejected",
  "received",
  "refunded",
]);
