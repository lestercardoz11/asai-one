-- DESTRUCTIVE. Drops all application-owned objects in `public` (tables, sequences,
-- our functions, enum types) plus the two triggers we own outside public.
-- Deliberately NOT `DROP SCHEMA public CASCADE` — that would take installed
-- extensions (pgcrypto, uuid-ossp, pg_cron, pg_stat_statements …) and their
-- objects with it. Extension-owned routines/types are skipped via pg_depend.
-- auth.users (auth schema) and the Storage schema are untouched.

drop trigger if exists on_auth_user_created on auth.users;
drop event trigger if exists rls_auto_enable_trigger;

-- 1) tables (CASCADE clears their policies, triggers, FKs)
do $$
declare r record;
begin
  for r in (
    select c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r','p')
      and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
  ) loop
    execute format('drop table if exists public.%I cascade', r.relname);
  end loop;
end$$;

-- 2) sequences
do $$
declare r record;
begin
  for r in (
    select c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'S'
      and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
  ) loop
    execute format('drop sequence if exists public.%I cascade', r.relname);
  end loop;
end$$;

-- 3) our functions / procedures (skip extension-owned)
do $$
declare r record;
begin
  for r in (
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  ) loop
    execute format('drop function if exists %s cascade', r.sig);
  end loop;
end$$;

-- 4) our enum types (skip extension-owned)
do $$
declare r record;
begin
  for r in (
    select t.typname
    from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typtype = 'e'
      and not exists (select 1 from pg_depend d where d.objid = t.oid and d.deptype = 'e')
  ) loop
    execute format('drop type if exists public.%I cascade', r.typname);
  end loop;
end$$;
