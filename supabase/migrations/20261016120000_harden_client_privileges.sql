-- Harden client (anon/authenticated) privileges on the production stock-only schema.
--
-- Production was built from supabase/production/schema_stock_only.sql, which kept the default
-- Supabase grants but missed the role-protection trigger from 20260817140000_launch_p0_p1.sql.
-- profiles_update_own / profiles_insert_own only check the row owner, so any signed-in user could
-- set their own profiles.role to 'admin' (or change their plan) with the public anon key.

-- 1. profiles.role and profiles.plan can only be written by privileged roles (service_role,
--    postgres). Client inserts always start as a free creator.
create or replace function public.prevent_profile_privileged_client_write()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      if coalesce(new.role, 'creator') <> 'creator' or coalesce(new.plan, 'free') <> 'free' then
        raise exception 'profile role and plan cannot be set from client context'
          using errcode = '42501';
      end if;
    elsif old.role is distinct from new.role or old.plan is distinct from new.plan then
      raise exception 'profile role and plan cannot be changed from client context'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_client_update on public.profiles;
drop trigger if exists profiles_prevent_role_client_write on public.profiles;
drop trigger if exists profiles_prevent_privileged_client_write on public.profiles;
create trigger profiles_prevent_privileged_client_write
before insert or update on public.profiles
for each row execute function public.prevent_profile_privileged_client_write();

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert to authenticated
with check (
  (select auth.uid()) = id
  and coalesce(role, 'creator') = 'creator'
  and coalesce(plan, 'free') = 'free'
);

-- 2. Card reports are created by the reportCard server action with the service role after it
--    validates ownership and status. A direct client insert bypassed that validation (arbitrary
--    status, admin fields, or delivery items of other users).
drop policy if exists card_reports_owner_insert on public.card_reports;

-- 3. Anonymous visitors only ever read public catalog rows. RLS already blocks their writes; remove
--    the grants as defence in depth. TRUNCATE, REFERENCES and TRIGGER are not subject to RLS at
--    all and are never needed by API clients.
revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from anon;
revoke truncate, references, trigger
  on all tables in schema public from authenticated;
