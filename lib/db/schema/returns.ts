import { pgTable, uuid, text, integer, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { returnRequestStatus } from "./enums";
import { orders, orderItems } from "./orders";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* ── Return requests (RMA) ─────────────────────────────────────────────────── */
export const returnRequests = pgTable(
  "return_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    userId: uuid("user_id"), // → auth.users (companion SQL, ON DELETE SET NULL)
    status: returnRequestStatus("status").notNull().default("requested"),
    reason: text("reason"),
    resolutionNote: text("resolution_note"),
    ...timestamps,
  },
  (t) => [
    index("return_requests_order_idx").on(t.orderId),
    index("return_requests_user_idx").on(t.userId),
    index("return_requests_status_idx").on(t.status),
  ],
);

/* ── Return line items ─────────────────────────────────────────────────────── */
export const returnItems = pgTable(
  "return_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    returnRequestId: uuid("return_request_id")
      .notNull()
      .references(() => returnRequests.id, { onDelete: "cascade" }),
    orderItemId: uuid("order_item_id").references(() => orderItems.id, { onDelete: "set null" }),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("return_items_request_idx").on(t.returnRequestId),
    check("return_items_quantity_chk", sql`quantity > 0`),
  ],
);
