-- P0/P1 launch hardening: prices, admin insert lock, source_ledger RLS.

update public.box_products
set price_usd_cents = case slug
  when 'viral_box_500' then 5000
  when 'premium_viral_box_1000' then 10000
  else price_usd_cents
end,
updated_at = now()
where slug in ('viral_box_500', 'premium_viral_box_1000')
  and price_usd_cents is distinct from case slug
    when 'viral_box_500' then 5000
    when 'premium_viral_box_1000' then 10000
    else price_usd_cents
  end;

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
  and coalesce(role, 'creator') = 'creator'
);

create or replace function public.prevent_profile_role_client_write()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' and coalesce(new.role, 'creator') <> 'creator' then
      raise exception 'profile role cannot be set from client context';
    end if;
    if tg_op = 'UPDATE' and old.role is distinct from new.role then
      raise exception 'profile role cannot be changed from client context';
    end if;
  end if;
  if tg_op = 'INSERT' then
    new.role := coalesce(new.role, 'creator');
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_client_update on public.profiles;
drop trigger if exists profiles_prevent_role_client_write on public.profiles;
create trigger profiles_prevent_role_client_write
before insert or update of role on public.profiles
for each row execute function public.prevent_profile_role_client_write();

alter table public.source_ledger enable row level security;
revoke all on table public.source_ledger from anon, authenticated, public;
grant select, insert, update, delete on table public.source_ledger to service_role;
