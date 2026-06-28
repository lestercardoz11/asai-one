-- Companion SQL: trigger wiring. Applied after functions.sql.

/* updated_at maintenance on every mutable table */
do $$
declare
  t text;
  mutable text[] := array[
    'categories','products','product_options','product_variants','product_images',
    'inventory','coupons','orders','payments','refunds','carts','cart_items',
    'addresses','profiles','reviews','return_requests','cms_pages','banners',
    'settings','notifications','marketing_campaigns'
  ];
begin
  foreach t in array mutable loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.tg_set_updated_at()', t);
  end loop;
end$$;

/* Orders: assign order number (before insert) + log status history (after) */
drop trigger if exists orders_assign_number on public.orders;
create trigger orders_assign_number
  before insert on public.orders
  for each row execute function public.tg_orders_assign_number();

drop trigger if exists orders_log_status_change on public.orders;
create trigger orders_log_status_change
  after insert or update on public.orders
  for each row execute function public.tg_orders_log_status_change();

/* Reviews: maintain products.rating / review_count */
drop trigger if exists reviews_maintain_rating on public.reviews;
create trigger reviews_maintain_rating
  after insert or update or delete on public.reviews
  for each row execute function public.tg_reviews_maintain_rating();

/* New auth user → profiles row */
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_handle_new_user();

/* Auto-enable RLS on future public tables */
drop event trigger if exists rls_auto_enable_trigger;
create event trigger rls_auto_enable_trigger
  on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function public.rls_auto_enable();
