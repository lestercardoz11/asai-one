-- Companion SQL: runtime objects not owned by a single table.

-- Order number sequence (referenced by tg_orders_assign_number). Clean start
-- pre-launch (the one test order was dropped in the rebuild).
create sequence if not exists public.order_number_seq start 1;

-- Daily rate-limit cleanup (pg_cron). Idempotent — survives the rebuild because
-- it lives in the cron schema, but re-asserted here for a self-contained setup.
do $$
begin
  if not exists (select 1 from cron.job where jobname = 'cleanup-rate-limits') then
    perform cron.schedule(
      'cleanup-rate-limits',
      '15 3 * * *',
      $job$delete from public.rate_limits where window_start < now() - interval '1 day'$job$
    );
  end if;
end$$;
