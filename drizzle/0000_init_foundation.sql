CREATE TYPE "public"."address_kind" AS ENUM('shipping', 'billing', 'both');--> statement-breakpoint
CREATE TYPE "public"."banner_placement" AS ENUM('home_hero', 'shop_top', 'category_top', 'checkout_top');--> statement-breakpoint
CREATE TYPE "public"."campaign_channel" AS ENUM('email', 'whatsapp', 'sms');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."cart_status" AS ENUM('active', 'abandoned', 'converted', 'merged');--> statement-breakpoint
CREATE TYPE "public"."category_status" AS ENUM('active', 'coming_soon', 'archived');--> statement-breakpoint
CREATE TYPE "public"."coupon_type" AS ENUM('percent', 'fixed_amount', 'free_shipping');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'whatsapp', 'sms');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('queued', 'sent', 'delivered', 'failed', 'bounced');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('upi', 'card', 'netbanking', 'wallet', 'cod');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('initiated', 'processed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."return_request_status" AS ENUM('requested', 'approved', 'rejected', 'received', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_reason" AS ENUM('order', 'restock', 'adjustment', 'return', 'reservation_release');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "category_status" DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"hero_image_url" text,
	"meta_title" text,
	"meta_description" text,
	"icon" text,
	"tagline" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"quantity" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 5 NOT NULL,
	"warehouse_code" text DEFAULT 'MUM-1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_quantity_chk" CHECK (quantity >= 0),
	CONSTRAINT "inventory_reserved_chk" CHECK (reserved >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"url" text NOT NULL,
	"alt" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"option_id" uuid NOT NULL,
	"value" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"variant_name" text,
	"price_paise" bigint,
	"original_price_paise" bigint,
	"weight_grams" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_price_chk" CHECK (price_paise IS NULL OR price_paise >= 0),
	CONSTRAINT "product_variants_original_price_chk" CHECK (original_price_paise IS NULL OR price_paise IS NULL OR original_price_paise >= price_paise)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"short_description" text,
	"description" text,
	"price_paise" bigint NOT NULL,
	"original_price_paise" bigint,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"specs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"features" text[] DEFAULT '{}' NOT NULL,
	"compatibility" text,
	"is_returnable" boolean DEFAULT true NOT NULL,
	"return_window_days" integer DEFAULT 7 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_new" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"rating" numeric DEFAULT '0' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"weight_grams" integer,
	"hsn_code" text,
	"shipping_policy" text,
	"default_variant_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_price_chk" CHECK (price_paise >= 0),
	CONSTRAINT "products_original_price_chk" CHECK (original_price_paise IS NULL OR original_price_paise >= price_paise),
	CONSTRAINT "products_rating_chk" CHECK (rating >= 0 AND rating <= 5),
	CONSTRAINT "products_review_count_chk" CHECK (review_count >= 0),
	CONSTRAINT "products_return_window_chk" CHECK (return_window_days >= 0)
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"delta" bigint NOT NULL,
	"reason" "stock_movement_reason" NOT NULL,
	"order_id" uuid,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variant_option_values" (
	"variant_id" uuid NOT NULL,
	"option_value_id" uuid NOT NULL,
	CONSTRAINT "variant_option_values_variant_id_option_value_id_pk" PRIMARY KEY("variant_id","option_value_id")
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"user_id" uuid,
	"order_id" uuid NOT NULL,
	"discount_paise" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_redemptions_discount_chk" CHECK (discount_paise >= 0)
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"type" "coupon_type" NOT NULL,
	"value_paise" bigint,
	"percent_off" numeric,
	"min_subtotal_paise" bigint DEFAULT 0 NOT NULL,
	"max_discount_paise" bigint,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"usage_limit" integer,
	"per_user_limit" integer,
	"times_redeemed" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_value_chk" CHECK (value_paise IS NULL OR value_paise >= 0),
	CONSTRAINT "coupons_percent_chk" CHECK (percent_off IS NULL OR (percent_off > 0 AND percent_off <= 100)),
	CONSTRAINT "coupons_min_subtotal_chk" CHECK (min_subtotal_paise >= 0),
	CONSTRAINT "coupons_max_discount_chk" CHECK (max_discount_paise IS NULL OR max_discount_paise >= 0),
	CONSTRAINT "coupons_usage_limit_chk" CHECK (usage_limit IS NULL OR usage_limit > 0),
	CONSTRAINT "coupons_per_user_limit_chk" CHECK (per_user_limit IS NULL OR per_user_limit > 0),
	CONSTRAINT "coupons_times_redeemed_chk" CHECK (times_redeemed >= 0)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"product_name" text NOT NULL,
	"sku" text NOT NULL,
	"variant_label" text,
	"quantity" integer NOT NULL,
	"unit_price_paise" bigint NOT NULL,
	"total_paise" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_quantity_chk" CHECK (quantity > 0),
	CONSTRAINT "order_items_unit_price_chk" CHECK (unit_price_paise >= 0),
	CONSTRAINT "order_items_total_chk" CHECK (total_paise >= 0)
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"notes" text,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"phone" text,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"subtotal_paise" bigint NOT NULL,
	"shipping_paise" bigint DEFAULT 0 NOT NULL,
	"tax_paise" bigint DEFAULT 0 NOT NULL,
	"discount_paise" bigint DEFAULT 0 NOT NULL,
	"total_paise" bigint NOT NULL,
	"coupon_id" uuid,
	"shipping_address" jsonb NOT NULL,
	"billing_address" jsonb,
	"notes" text,
	"idempotency_key" text,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_phone_chk" CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{6,14}$'),
	CONSTRAINT "orders_subtotal_chk" CHECK (subtotal_paise >= 0),
	CONSTRAINT "orders_shipping_chk" CHECK (shipping_paise >= 0),
	CONSTRAINT "orders_tax_chk" CHECK (tax_paise >= 0),
	CONSTRAINT "orders_discount_chk" CHECK (discount_paise >= 0),
	CONSTRAINT "orders_total_chk" CHECK (total_paise >= 0)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'razorpay' NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"razorpay_signature" text,
	"method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"amount_paise" bigint NOT NULL,
	"error_code" text,
	"error_description" text,
	"raw_response" jsonb,
	"captured_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_chk" CHECK (amount_paise >= 0)
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"razorpay_refund_id" text,
	"amount_paise" bigint NOT NULL,
	"status" "refund_status" DEFAULT 'initiated' NOT NULL,
	"reason" text,
	"raw_response" jsonb,
	"initiated_by" uuid,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_amount_chk" CHECK (amount_paise > 0)
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_paise" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_items_quantity_chk" CHECK (quantity > 0),
	CONSTRAINT "cart_items_unit_price_chk" CHECK (unit_price_paise >= 0)
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"anon_id" text,
	"status" "cart_status" DEFAULT 'active' NOT NULL,
	"abandoned_at" timestamp with time zone,
	"reminder_email_sent_at" timestamp with time zone,
	"reminder_whatsapp_sent_at" timestamp with time zone,
	"converted_order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "address_kind" DEFAULT 'both' NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text DEFAULT 'IN' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "addresses_phone_chk" CHECK (phone ~ '^\+[1-9][0-9]{6,14}$')
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"phone" text,
	"full_name" text,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"whatsapp_opt_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_phone_chk" CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{6,14}$')
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid,
	"rating" integer NOT NULL,
	"title" text,
	"body" text,
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_chk" CHECK (rating >= 1 AND rating <= 5)
);
--> statement-breakpoint
CREATE TABLE "wishlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "return_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_request_id" uuid NOT NULL,
	"order_item_id" uuid,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "return_items_quantity_chk" CHECK (quantity > 0)
);
--> statement-breakpoint
CREATE TABLE "return_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid,
	"status" "return_request_status" DEFAULT 'requested' NOT NULL,
	"reason" text,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid,
	"action" text NOT NULL,
	"target_table" text,
	"target_id" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"anon_id" text,
	"session_id" text,
	"event_name" text NOT NULL,
	"event_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"url" text,
	"referrer" text,
	"user_agent" text,
	"ip_hash" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"image_url" text,
	"cta_label" text,
	"cta_href" text,
	"placement" "banner_placement" DEFAULT 'home_hero' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone,
	"category_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"body_markdown" text NOT NULL,
	"body_html" text,
	"meta_title" text,
	"meta_description" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"channel" "campaign_channel" DEFAULT 'email' NOT NULL,
	"audience" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"template_key" text NOT NULL,
	"subject" text,
	"body_markdown" text,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"order_id" uuid,
	"cart_id" uuid,
	"channel" "notification_channel" NOT NULL,
	"template_key" text NOT NULL,
	"recipient" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "notification_status" DEFAULT 'queued' NOT NULL,
	"provider_message_id" text,
	"error_message" text,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "settings_singleton_chk" CHECK (id = 1)
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload" jsonb
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_option_id_product_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."product_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_option_values" ADD CONSTRAINT "variant_option_values_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_option_values" ADD CONSTRAINT "variant_option_values_option_value_id_product_option_values_id_fk" FOREIGN KEY ("option_value_id") REFERENCES "public"."product_option_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_converted_order_id_orders_id_fk" FOREIGN KEY ("converted_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_request_id_return_requests_id_fk" FOREIGN KEY ("return_request_id") REFERENCES "public"."return_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_key" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "categories_sort_idx" ON "categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "inventory_product_idx" ON "inventory" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inventory_variant_idx" ON "inventory" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_images_variant_idx" ON "product_images" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_option_values_option_value_key" ON "product_option_values" USING btree ("option_id","value");--> statement-breakpoint
CREATE INDEX "product_option_values_option_idx" ON "product_option_values" USING btree ("option_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_options_product_name_key" ON "product_options" USING btree ("product_id","name");--> statement-breakpoint
CREATE INDEX "product_options_product_idx" ON "product_options" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_key" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_key" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_default_variant_idx" ON "products" USING btree ("default_variant_id");--> statement-breakpoint
CREATE INDEX "products_active_idx" ON "products" USING btree ("is_active") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "stock_movements_variant_idx" ON "stock_movements" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "stock_movements_order_idx" ON "stock_movements" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "variant_option_values_value_idx" ON "variant_option_values" USING btree ("option_value_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_redemptions_coupon_order_key" ON "coupon_redemptions" USING btree ("coupon_id","order_id");--> statement-breakpoint
CREATE INDEX "coupon_redemptions_coupon_user_idx" ON "coupon_redemptions" USING btree ("coupon_id","user_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_items_variant_idx" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idempotency_key_uq" ON "orders" USING btree ("idempotency_key") WHERE idempotency_key IS NOT NULL;--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_placed_at_idx" ON "orders" USING btree ("placed_at");--> statement-breakpoint
CREATE INDEX "orders_coupon_idx" ON "orders" USING btree ("coupon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_razorpay_order_id_key" ON "payments" USING btree ("razorpay_order_id") WHERE razorpay_order_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_razorpay_payment_id_key" ON "payments" USING btree ("razorpay_payment_id") WHERE razorpay_payment_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "refunds_razorpay_refund_id_key" ON "refunds" USING btree ("razorpay_refund_id") WHERE razorpay_refund_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "refunds_payment_idx" ON "refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "refunds_order_idx" ON "refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "cart_items_cart_idx" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "cart_items_product_idx" ON "cart_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "cart_items_variant_idx" ON "cart_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "carts_user_idx" ON "carts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "carts_status_idx" ON "carts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "carts_converted_order_idx" ON "carts" USING btree ("converted_order_id");--> statement-breakpoint
CREATE INDEX "addresses_user_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "addresses_user_default_uq" ON "addresses" USING btree ("user_id") WHERE is_default;--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "reviews_user_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "wishlist_user_product_key" ON "wishlist" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "wishlist_product_idx" ON "wishlist" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "return_items_request_idx" ON "return_items" USING btree ("return_request_id");--> statement-breakpoint
CREATE INDEX "return_requests_order_idx" ON "return_requests" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "return_requests_user_idx" ON "return_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "return_requests_status_idx" ON "return_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admin_audit_log_admin_idx" ON "admin_audit_log" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "analytics_events_name_idx" ON "analytics_events" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "analytics_events_user_idx" ON "analytics_events" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "banners_slug_key" ON "banners" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "banners_placement_idx" ON "banners" USING btree ("placement");--> statement-breakpoint
CREATE INDEX "banners_category_idx" ON "banners" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_pages_slug_key" ON "cms_pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_order_idx" ON "notifications" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "notifications_cart_idx" ON "notifications" USING btree ("cart_id");