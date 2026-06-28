-- Companion SQL: admin dashboard aggregators. SECURITY DEFINER with an internal
-- is_admin() guard (defense in depth); EXECUTE is also revoked from anon +
-- authenticated in grants.sql so they are admin-only at both layers.

create or replace function public.admin_dashboard_kpis(days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  rev_total numeric := 0;
  order_count integer := 0;
  prev_rev numeric := 0;
  prev_order_count integer := 0;
  aov numeric := 0;
  cust_count integer := 0;
  low_stock integer := 0;
  pending_reviews integer := 0;
  pending_orders integer := 0;
begin
  if not public.is_admin() then
    raise exception 'unauthorised';
  end if;

  select coalesce(sum(total_paise),0)::numeric, count(*)
    into rev_total, order_count
    from public.orders
    where status not in ('cancelled','refunded')
      and placed_at >= now() - (days || ' days')::interval;

  select coalesce(sum(total_paise),0)::numeric, count(*)
    into prev_rev, prev_order_count
    from public.orders
    where status not in ('cancelled','refunded')
      and placed_at >= now() - ((days*2) || ' days')::interval
      and placed_at <  now() - (days || ' days')::interval;

  if order_count > 0 then aov := rev_total / order_count; end if;

  select count(*) into cust_count from public.profiles
    where created_at >= now() - (days || ' days')::interval;
  select count(*) into low_stock from public.inventory
    where quantity <= low_stock_threshold;
  select count(*) into pending_reviews from public.reviews where status = 'pending';
  select count(*) into pending_orders from public.orders
    where status in ('pending','confirmed','processing');

  return jsonb_build_object(
    'revenue_paise', rev_total,
    'previous_revenue_paise', prev_rev,
    'orders', order_count,
    'previous_orders', prev_order_count,
    'aov_paise', aov,
    'new_customers', cust_count,
    'low_stock_count', low_stock,
    'pending_reviews', pending_reviews,
    'pending_orders', pending_orders,
    'days', days
  );
end;
$$;

create or replace function public.admin_revenue_timeseries(days integer default 30)
returns table(bucket_date date, revenue_paise bigint, order_count integer)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'unauthorised';
  end if;
  return query
    with day_series as (
      select generate_series((current_date - (days - 1))::date, current_date, '1 day'::interval)::date as d
    ),
    bucketed as (
      select date_trunc('day', placed_at)::date as d,
        sum(total_paise)::bigint as rev, count(*)::integer as cnt
      from public.orders
      where status not in ('cancelled','refunded') and placed_at >= current_date - (days - 1)
      group by 1
    )
    select day_series.d, coalesce(bucketed.rev, 0)::bigint, coalesce(bucketed.cnt, 0)::integer
    from day_series left join bucketed on bucketed.d = day_series.d
    order by day_series.d asc;
end;
$$;

create or replace function public.admin_top_products(days integer default 30, lim integer default 5)
returns table(product_id uuid, product_name text, units_sold bigint, revenue_paise bigint)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'unauthorised';
  end if;
  return query
    select oi.product_id, max(oi.product_name) as pname,
      sum(oi.quantity)::bigint as units, sum(oi.total_paise)::bigint as rev
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.placed_at >= now() - (days || ' days')::interval
      and o.status not in ('cancelled','refunded')
      and oi.product_id is not null
    group by oi.product_id
    order by rev desc
    limit lim;
end;
$$;
