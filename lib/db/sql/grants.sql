-- Companion SQL: function EXECUTE grants. Postgres grants EXECUTE to PUBLIC by
-- default on CREATE, so privileged + admin RPCs must be explicitly revoked.

/* Privileged service-role-only RPCs (anti-oversell, coupon redemption, rate limit). */
revoke execute on function public.decrement_inventory(uuid, integer) from public, anon, authenticated;
revoke execute on function public.restock_inventory(uuid, integer) from public, anon, authenticated;
revoke execute on function public.redeem_coupon(text, uuid, uuid, bigint) from public, anon, authenticated;
revoke execute on function public.release_coupon(uuid) from public, anon, authenticated;
revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;

/* Admin aggregators: remove the default PUBLIC grant (clears anon), then grant
   back to authenticated. They are guarded internally by is_admin() and are called
   by the admin dashboard via the authenticated (admin) session — they CANNOT be
   revoked from authenticated without breaking admins (service-role/postgres fail
   is_admin()). The residual "authenticated can execute a definer fn" advisor WARN
   is accepted: the function self-guards. */
revoke execute on function public.admin_dashboard_kpis(integer) from public;
revoke execute on function public.admin_revenue_timeseries(integer) from public;
revoke execute on function public.admin_top_products(integer, integer) from public;
grant execute on function public.admin_dashboard_kpis(integer) to authenticated;
grant execute on function public.admin_revenue_timeseries(integer) to authenticated;
grant execute on function public.admin_top_products(integer, integer) to authenticated;

/* Trigger / event-trigger functions are never called directly via RPC (triggers
   still fire — EXECUTE is not checked in trigger context). Supabase's default
   privileges grant EXECUTE to anon + authenticated directly, so revoke from those
   roles (not just PUBLIC) to clear the definer-function advisory. */
revoke execute on function public.tg_handle_new_user() from public, anon, authenticated;
revoke execute on function public.tg_orders_log_status_change() from public, anon, authenticated;
revoke execute on function public.tg_reviews_maintain_rating() from public, anon, authenticated;
revoke execute on function public.tg_set_updated_at() from public, anon, authenticated;
revoke execute on function public.tg_orders_assign_number() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

/* lookup_coupon stays anon-callable by design (single-row, guarded lookup).
   is_admin() stays executable — RLS policies evaluate it per row. */
grant execute on function public.lookup_coupon(text) to anon, authenticated;
