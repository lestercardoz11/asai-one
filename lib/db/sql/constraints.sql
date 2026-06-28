-- Companion SQL: FKs to auth.users (not modeled in Drizzle), the cross-cycle
-- stock_movements→orders FK, and functional indexes Drizzle can't express.

/* ── auth.users foreign keys ───────────────────────────────────────────────── */
-- CASCADE: rows that should die with the user.
alter table public.profiles
  add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
alter table public.addresses
  add constraint addresses_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.carts
  add constraint carts_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.reviews
  add constraint reviews_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.wishlist
  add constraint wishlist_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

-- SET NULL: rows that outlive the user (orders, audit, content, ledgers).
alter table public.orders
  add constraint orders_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.order_status_history
  add constraint order_status_history_changed_by_fkey foreign key (changed_by) references auth.users(id) on delete set null;
alter table public.coupon_redemptions
  add constraint coupon_redemptions_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.refunds
  add constraint refunds_initiated_by_fkey foreign key (initiated_by) references auth.users(id) on delete set null;
alter table public.products
  add constraint products_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
alter table public.coupons
  add constraint coupons_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
alter table public.notifications
  add constraint notifications_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.analytics_events
  add constraint analytics_events_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.admin_audit_log
  add constraint admin_audit_log_admin_user_id_fkey foreign key (admin_user_id) references auth.users(id) on delete set null;
alter table public.cms_pages
  add constraint cms_pages_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
alter table public.cms_pages
  add constraint cms_pages_updated_by_fkey foreign key (updated_by) references auth.users(id) on delete set null;
alter table public.settings
  add constraint settings_updated_by_fkey foreign key (updated_by) references auth.users(id) on delete set null;
alter table public.marketing_campaigns
  add constraint marketing_campaigns_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
alter table public.return_requests
  add constraint return_requests_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.stock_movements
  add constraint stock_movements_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

/* ── order_items / cart_items → products & variants (SET NULL: keep snapshot) ─ */
alter table public.order_items
  add constraint order_items_product_id_fkey foreign key (product_id) references public.products(id) on delete set null;
alter table public.order_items
  add constraint order_items_variant_id_fkey foreign key (variant_id) references public.product_variants(id) on delete set null;

/* ── Cross-cycle FK: stock_movements → orders (avoided in Drizzle to break the cycle) ─ */
alter table public.stock_movements
  add constraint stock_movements_order_id_fkey foreign key (order_id) references public.orders(id) on delete set null;

/* ── Functional indexes ────────────────────────────────────────────────────── */
-- One inventory row per (product, variant-or-none, warehouse). COALESCE folds the
-- nullable variant_id into the uniqueness key.
create unique index inventory_pvw_uq
  on public.inventory (product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid), warehouse_code);

-- Case-insensitive coupon code uniqueness (replaces the old case-sensitive UNIQUE(code)).
create unique index coupons_code_lower_uq on public.coupons (lower(code));
