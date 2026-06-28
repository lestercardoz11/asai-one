-- Companion SQL: functions / RPCs.
-- Applied after the Drizzle-generated table DDL. Not expressible in Drizzle TS.
-- Carries over the audited functions from migrations 001–015 + hardening, with
-- the rebuild changes: inventory functions write the stock_movements ledger;
-- a new tg_reviews_maintain_rating keeps products.rating/review_count in sync.

/* ── Authorization ─────────────────────────────────────────────────────────── */
-- Admin = JWT app_metadata.role claim (NOT the dropped admin_roles table).
create or replace function public.is_admin()
returns boolean
language sql
stable security definer
set search_path to ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

/* ── Coupons ───────────────────────────────────────────────────────────────── */
-- Anon-callable lookup: returns at most the single currently-usable coupon so
-- anon cannot enumerate every active code (coupons has no public SELECT policy).
create or replace function public.lookup_coupon(p_code text)
returns table(code text, type coupon_type, value_paise bigint, percent_off numeric,
              min_subtotal_paise bigint, max_discount_paise bigint, description text)
language sql
stable security definer
set search_path to 'public'
as $$
  select c.code, c.type, c.value_paise, c.percent_off, c.min_subtotal_paise,
         c.max_discount_paise, c.description
  from public.coupons c
  where lower(c.code) = lower(trim(p_code))
    and c.deleted_at is null
    and c.is_active
    and (c.starts_at is null or c.starts_at <= now())
    and (c.ends_at is null or c.ends_at >= now())
    and (c.usage_limit is null or c.times_redeemed < c.usage_limit)
  limit 1;
$$;

-- Idempotent redemption (unique (coupon_id, order_id)); service-role only.
-- Enforces usage_limit + per_user_limit under the row lock (not just at lookup).
create or replace function public.redeem_coupon(p_code text, p_user_id uuid, p_order_id uuid, p_discount bigint)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_coupon_id uuid;
  v_usage_limit integer;
  v_per_user_limit integer;
  v_times_redeemed integer;
  v_user_count integer;
  v_inserted integer;
begin
  select id, usage_limit, per_user_limit, times_redeemed
    into v_coupon_id, v_usage_limit, v_per_user_limit, v_times_redeemed
    from public.coupons where lower(code) = lower(p_code) for update;
  if v_coupon_id is null then
    return false;
  end if;
  if v_usage_limit is not null and v_times_redeemed >= v_usage_limit then
    return false;
  end if;
  if v_per_user_limit is not null and p_user_id is not null then
    select count(*) into v_user_count from public.coupon_redemptions
      where coupon_id = v_coupon_id and user_id = p_user_id;
    if v_user_count >= v_per_user_limit then return false; end if;
  end if;
  with ins as (
    insert into public.coupon_redemptions (coupon_id, user_id, order_id, discount_paise)
    values (v_coupon_id, p_user_id, p_order_id, coalesce(p_discount, 0))
    on conflict (coupon_id, order_id) do nothing
    returning 1
  )
  select count(*) into v_inserted from ins;
  if v_inserted > 0 then
    update public.coupons set times_redeemed = times_redeemed + 1 where id = v_coupon_id;
  end if;
  return v_inserted > 0;
end;
$$;

-- Reverse a redemption when a committed order is cancelled/refunded. Service-role only.
create or replace function public.release_coupon(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_coupon_id uuid;
begin
  delete from public.coupon_redemptions where order_id = p_order_id
    returning coupon_id into v_coupon_id;
  if v_coupon_id is not null then
    update public.coupons set times_redeemed = greatest(times_redeemed - 1, 0)
      where id = v_coupon_id;
  end if;
end;
$$;

/* ── Inventory (+ stock_movements ledger) ──────────────────────────────────── */
-- Atomic, anti-oversell decrement. Writes an append-only ledger row. Service-role
-- only. Variant-keyed (every sellable line is a variant in this catalogue).
create or replace function public.decrement_inventory(p_variant_id uuid, p_qty integer)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_product_id uuid;
  v_prev integer;
begin
  if p_qty is null or p_qty <= 0 then
    return true;
  end if;
  update public.inventory
     set quantity = quantity - p_qty, updated_at = now()
   where variant_id = p_variant_id
     and quantity >= p_qty
  returning product_id into v_product_id;
  if found then
    insert into public.stock_movements (product_id, variant_id, delta, reason)
      values (v_product_id, p_variant_id, -p_qty, 'order');
    return true;
  end if;
  -- Insufficient stock: clamp to zero (best-effort) and ledger the real delta.
  select product_id, quantity into v_product_id, v_prev
    from public.inventory where variant_id = p_variant_id;
  if v_prev is not null and v_prev > 0 then
    update public.inventory set quantity = 0, updated_at = now() where variant_id = p_variant_id;
    insert into public.stock_movements (product_id, variant_id, delta, reason, note)
      values (v_product_id, p_variant_id, -v_prev, 'order', 'clamped: insufficient stock');
  end if;
  return false;
end;
$$;

-- Put stock back (user/admin cancellation of a confirmed order). Ledgered.
create or replace function public.restock_inventory(p_variant_id uuid, p_qty integer)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_product_id uuid;
begin
  if p_qty is null or p_qty <= 0 then return; end if;
  update public.inventory
     set quantity = quantity + p_qty, updated_at = now()
   where variant_id = p_variant_id
  returning product_id into v_product_id;
  if found then
    insert into public.stock_movements (product_id, variant_id, delta, reason)
      values (v_product_id, p_variant_id, p_qty, 'restock');
  end if;
end;
$$;

/* ── Rate limiting (fixed-window) — service-role only ──────────────────────── */
create or replace function public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
    values (p_key, v_window, 1)
  on conflict (key, window_start)
    do update set count = public.rate_limits.count + 1
  returning count into v_count;
  return v_count <= p_limit;
end;
$$;

/* ── Triggers ──────────────────────────────────────────────────────────────── */
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auto-create a profiles row from auth.users on signup.
create or replace function public.tg_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  insert into public.profiles (id, email, phone, full_name)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.tg_orders_assign_number()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := 'ASA-' || to_char(now(), 'YYMM') || lpad(nextval('public.order_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

-- SECURITY DEFINER so the history insert is never blocked by RLS on the writer.
create or replace function public.tg_orders_log_status_change()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

-- Keep products.rating / review_count in sync with approved reviews.
create or replace function public.tg_reviews_maintain_rating()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p set
    rating = coalesce(
      (select round(avg(r.rating)::numeric, 1) from public.reviews r
        where r.product_id = v_product_id and r.status = 'approved'), 0),
    review_count = (select count(*) from public.reviews r
        where r.product_id = v_product_id and r.status = 'approved')
  where p.id = v_product_id;
  return coalesce(new, old);
end;
$$;

-- Event trigger: auto-enable RLS on any future public table.
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $$
declare
  cmd record;
begin
  for cmd in
    select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table','partitioned table')
  loop
    if cmd.schema_name = 'public' then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception when others then
        raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    end if;
  end loop;
end;
$$;
