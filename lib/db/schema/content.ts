import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  primaryKey,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  bannerPlacement,
  campaignChannel,
  campaignStatus,
  notificationChannel,
  notificationStatus,
} from "./enums";
import { categories } from "./catalogue";
import { orders } from "./orders";
import { carts } from "./commerce";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* ── CMS pages ─────────────────────────────────────────────────────────────── */
export const cmsPages = pgTable(
  "cms_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    bodyMarkdown: text("body_markdown").notNull(),
    bodyHtml: text("body_html"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    isPublished: boolean("is_published").notNull().default(true),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdBy: uuid("created_by"), // → auth.users (companion SQL)
    updatedBy: uuid("updated_by"), // → auth.users (companion SQL)
    ...timestamps,
  },
  (t) => [uniqueIndex("cms_pages_slug_key").on(t.slug)],
);

/* ── Banners ───────────────────────────────────────────────────────────────── */
export const banners = pgTable(
  "banners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    imageUrl: text("image_url"),
    ctaLabel: text("cta_label"),
    ctaHref: text("cta_href"),
    placement: bannerPlacement("placement").notNull().default("home_hero"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validTo: timestamp("valid_to", { withTimezone: true }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("banners_slug_key").on(t.slug),
    index("banners_placement_idx").on(t.placement),
    index("banners_category_idx").on(t.categoryId),
  ],
);

/* ── Settings (singleton row id=1) ─────────────────────────────────────────── */
export const settings = pgTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),
    data: jsonb("data").notNull().default(sql`'{}'::jsonb`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid("updated_by"), // → auth.users (companion SQL)
  },
  () => [check("settings_singleton_chk", sql`id = 1`)],
);

/* ── Notifications (lifecycle/marketing sends + dedupe log) ─────────────────── */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"), // → auth.users (companion SQL)
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    cartId: uuid("cart_id").references(() => carts.id, { onDelete: "set null" }),
    channel: notificationChannel("channel").notNull(),
    templateKey: text("template_key").notNull(),
    recipient: text("recipient").notNull(),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    status: notificationStatus("status").notNull().default("queued"),
    providerMessageId: text("provider_message_id"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("notifications_user_idx").on(t.userId),
    index("notifications_order_idx").on(t.orderId),
    index("notifications_cart_idx").on(t.cartId),
  ],
);

/* ── Marketing campaigns ───────────────────────────────────────────────────── */
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  channel: campaignChannel("channel").notNull().default("email"),
  audience: jsonb("audience").notNull().default(sql`'{}'::jsonb`),
  templateKey: text("template_key").notNull(),
  subject: text("subject"),
  bodyMarkdown: text("body_markdown"),
  status: campaignStatus("status").notNull().default("draft"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  recipientCount: integer("recipient_count").notNull().default(0),
  deliveredCount: integer("delivered_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  createdBy: uuid("created_by"), // → auth.users (companion SQL)
  ...timestamps,
});

/* ── Analytics events (anon telemetry) ─────────────────────────────────────── */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"), // → auth.users (companion SQL)
    anonId: text("anon_id"),
    sessionId: text("session_id"),
    eventName: text("event_name").notNull(),
    eventPayload: jsonb("event_payload").notNull().default(sql`'{}'::jsonb`),
    url: text("url"),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("analytics_events_name_idx").on(t.eventName), index("analytics_events_user_idx").on(t.userId)],
);

/* ── Admin audit log ───────────────────────────────────────────────────────── */
export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminUserId: uuid("admin_user_id"), // → auth.users (companion SQL)
    action: text("action").notNull(),
    targetTable: text("target_table"),
    targetId: text("target_id"),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("admin_audit_log_admin_idx").on(t.adminUserId)],
);

/* ── Webhook dedupe ledger ─────────────────────────────────────────────────── */
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  event: text("event").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  payload: jsonb("payload"),
});

/* ── Rate limits (fixed-window; purged daily by pg_cron) ───────────────────── */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);
