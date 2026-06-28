-- Companion SQL: Row-Level Security. Applied after tables + constraints.
-- Mirrors the audited policy model: public catalogue reads, owner reads/writes
-- via (select auth.uid()), admin via is_admin(). Rebuild changes: reviews public
-- read keys on status='approved'; analytics insert is scoped to own/null; new
-- tables (options/values, stock_movements, returns) get policies; admin_roles gone.

/* ── Enable RLS on every table ─────────────────────────────────────────────── */
do $$
declare t text;
  tbls text[] := array[
    'categories','products','product_options','product_option_values','product_variants',
    'variant_option_values','product_images','inventory','stock_movements',
    'coupons','coupon_redemptions','orders','order_items','order_status_history',
    'payments','refunds','carts','cart_items','addresses','profiles','reviews',
    'wishlist','return_requests','return_items','cms_pages','banners','settings',
    'notifications','marketing_campaigns','analytics_events','admin_audit_log',
    'webhook_events','rate_limits'
  ];
begin
  foreach t in array tbls loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end$$;

/* ── Catalogue: public read + admin all ────────────────────────────────────── */
create policy categories_select_public on public.categories for select to anon, authenticated
  using (deleted_at is null);
create policy categories_all_admin on public.categories for all to authenticated
  using (is_admin()) with check (is_admin());

create policy products_select_public on public.products for select to anon, authenticated
  using (deleted_at is null and is_active);
create policy products_all_admin on public.products for all to authenticated
  using (is_admin()) with check (is_admin());

create policy product_variants_select_public on public.product_variants for select to anon, authenticated
  using (is_active and exists (
    select 1 from public.products p where p.id = product_id and p.is_active and p.deleted_at is null));
create policy product_variants_all_admin on public.product_variants for all to authenticated
  using (is_admin()) with check (is_admin());

create policy product_options_select_public on public.product_options for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active and p.deleted_at is null));
create policy product_options_all_admin on public.product_options for all to authenticated
  using (is_admin()) with check (is_admin());

create policy product_option_values_select_public on public.product_option_values for select to anon, authenticated
  using (exists (
    select 1 from public.product_options o join public.products p on p.id = o.product_id
    where o.id = option_id and p.is_active and p.deleted_at is null));
create policy product_option_values_all_admin on public.product_option_values for all to authenticated
  using (is_admin()) with check (is_admin());

create policy variant_option_values_select_public on public.variant_option_values for select to anon, authenticated
  using (exists (
    select 1 from public.product_variants v join public.products p on p.id = v.product_id
    where v.id = variant_id and v.is_active and p.is_active and p.deleted_at is null));
create policy variant_option_values_all_admin on public.variant_option_values for all to authenticated
  using (is_admin()) with check (is_admin());

create policy product_images_select_public on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active and p.deleted_at is null));
create policy product_images_all_admin on public.product_images for all to authenticated
  using (is_admin()) with check (is_admin());

create policy inventory_select_public on public.inventory for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active and p.deleted_at is null));
create policy inventory_all_admin on public.inventory for all to authenticated
  using (is_admin()) with check (is_admin());

create policy stock_movements_all_admin on public.stock_movements for all to authenticated
  using (is_admin()) with check (is_admin());

/* ── Coupons: admin-only (lookup via SECURITY DEFINER RPC) ─────────────────── */
create policy coupons_all_admin on public.coupons for all to authenticated
  using (is_admin()) with check (is_admin());
create policy coupon_redemptions_select_own on public.coupon_redemptions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy coupon_redemptions_all_admin on public.coupon_redemptions for all to authenticated
  using (is_admin()) with check (is_admin());

/* ── Orders ────────────────────────────────────────────────────────────────── */
create policy orders_select_own on public.orders for select to authenticated
  using ((select auth.uid()) = user_id);
create policy orders_select_admin on public.orders for select to authenticated using (is_admin());
-- No authenticated INSERT policy by design: orders/order_items are created only via
-- the service-role client (bypasses RLS). A user-facing INSERT policy was dropped —
-- it let logged-in users POST fake `pending` orders that polluted admin KPIs.
create policy orders_update_admin on public.orders for update to authenticated
  using (is_admin()) with check (is_admin());

create policy order_items_select_own on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
create policy order_items_all_admin on public.order_items for all to authenticated
  using (is_admin()) with check (is_admin());

create policy order_status_history_select_own on public.order_status_history for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
create policy order_status_history_all_admin on public.order_status_history for all to authenticated
  using (is_admin()) with check (is_admin());

create policy payments_select_own on public.payments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
create policy payments_all_admin on public.payments for all to authenticated
  using (is_admin()) with check (is_admin());

create policy refunds_select_own on public.refunds for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
create policy refunds_all_admin on public.refunds for all to authenticated
  using (is_admin()) with check (is_admin());

/* ── Carts (authenticated-own + admin; anon carts intentionally unsupported) ─ */
create policy carts_select_own on public.carts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy carts_select_admin on public.carts for select to authenticated using (is_admin());
create policy carts_insert_own on public.carts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy carts_update_own on public.carts for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy carts_delete_own on public.carts for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy cart_items_select_own on public.cart_items for select to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));
create policy cart_items_insert_own on public.cart_items for insert to authenticated
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));
create policy cart_items_update_own on public.cart_items for update to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));
create policy cart_items_delete_own on public.cart_items for delete to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));
create policy cart_items_select_admin on public.cart_items for select to authenticated using (is_admin());

/* ── Addresses ─────────────────────────────────────────────────────────────── */
create policy addresses_select_own on public.addresses for select to authenticated
  using ((select auth.uid()) = user_id);
create policy addresses_select_admin on public.addresses for select to authenticated using (is_admin());
create policy addresses_insert_own on public.addresses for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy addresses_update_own on public.addresses for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy addresses_delete_own on public.addresses for delete to authenticated
  using ((select auth.uid()) = user_id);

/* ── Profiles ──────────────────────────────────────────────────────────────── */
create policy profiles_select_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_select_admin on public.profiles for select to authenticated using (is_admin());
create policy profiles_insert_self on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

/* ── Reviews (public read = approved) ──────────────────────────────────────── */
create policy reviews_select_public on public.reviews for select to anon, authenticated
  using (status = 'approved');
create policy reviews_select_own on public.reviews for select to authenticated
  using ((select auth.uid()) = user_id);
create policy reviews_insert_own on public.reviews for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy reviews_update_own on public.reviews for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy reviews_delete_own on public.reviews for delete to authenticated
  using ((select auth.uid()) = user_id);
create policy reviews_all_admin on public.reviews for all to authenticated
  using (is_admin()) with check (is_admin());

/* ── Wishlist ──────────────────────────────────────────────────────────────── */
create policy wishlist_select_own on public.wishlist for select to authenticated
  using ((select auth.uid()) = user_id);
create policy wishlist_insert_own on public.wishlist for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy wishlist_delete_own on public.wishlist for delete to authenticated
  using ((select auth.uid()) = user_id);

/* ── Returns (owner read + owner insert + admin all) ───────────────────────── */
create policy return_requests_select_own on public.return_requests for select to authenticated
  using ((select auth.uid()) = user_id);
create policy return_requests_insert_own on public.return_requests for insert to authenticated
  with check ((select auth.uid()) = user_id
    and exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
create policy return_requests_all_admin on public.return_requests for all to authenticated
  using (is_admin()) with check (is_admin());

create policy return_items_select_own on public.return_items for select to authenticated
  using (exists (select 1 from public.return_requests rr
    where rr.id = return_request_id and rr.user_id = (select auth.uid())));
create policy return_items_insert_own on public.return_items for insert to authenticated
  with check (exists (select 1 from public.return_requests rr
    where rr.id = return_request_id and rr.user_id = (select auth.uid())));
create policy return_items_all_admin on public.return_items for all to authenticated
  using (is_admin()) with check (is_admin());

/* ── CMS / banners / settings ──────────────────────────────────────────────── */
create policy cms_pages_select_public on public.cms_pages for select to anon, authenticated
  using (deleted_at is null and is_published);
create policy cms_pages_all_admin on public.cms_pages for all to authenticated
  using (is_admin()) with check (is_admin());

create policy banners_select_public on public.banners for select to anon, authenticated
  using (is_active and (valid_from is null or valid_from <= now()) and (valid_to is null or valid_to >= now()));
create policy banners_all_admin on public.banners for all to authenticated
  using (is_admin()) with check (is_admin());

create policy settings_select_public on public.settings for select to anon, authenticated using (true);
create policy settings_all_admin on public.settings for all to authenticated
  using (is_admin()) with check (is_admin());

/* ── Notifications / marketing / analytics / audit / webhooks ──────────────── */
create policy notifications_select_own on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy notifications_all_admin on public.notifications for all to authenticated
  using (is_admin()) with check (is_admin());

create policy marketing_campaigns_all_admin on public.marketing_campaigns for all to authenticated
  using (is_admin()) with check (is_admin());

-- Anon telemetry insert, but scoped: a row's user_id must be the caller's (or null).
create policy analytics_events_insert_own on public.analytics_events for insert to anon, authenticated
  with check (user_id = (select auth.uid()) or user_id is null);
create policy analytics_events_select_own on public.analytics_events for select to authenticated
  using ((select auth.uid()) = user_id);
create policy analytics_events_select_admin on public.analytics_events for select to authenticated using (is_admin());

create policy admin_audit_log_select_admin on public.admin_audit_log for select to authenticated using (is_admin());
create policy admin_audit_log_insert_admin on public.admin_audit_log for insert to authenticated with check (is_admin());

create policy webhook_events_select_admin on public.webhook_events for select to authenticated using (is_admin());

-- rate_limits: RLS enabled, no policies → only service-role (via check_rate_limit) reaches it.
