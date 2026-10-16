-- Production patch 2026-10-16 (idempotent). Apply once to the hosted project:
--   npx supabase@latest db query --project-ref psqqqhcfmfojrqsvzzzb --linked --file supabase/production/patch_20261016_feedback_and_hardening.sql
--
-- 1. Creates idea_card_feedback, which the Creator Vault feedback widget (/api/feedback/card) writes
--    to but which was never part of schema_stock_only.sql, so every feedback submission returned 500.
-- 2. Applies supabase/migrations/20261016120000_harden_client_privileges.sql: signed-in users could
--    promote their own profile to admin.

begin;

-- 1. Creator card feedback (final shape of migrations 20260806090000, 20260829120000, 20260829170000)
create table if not exists public.idea_card_feedback (
  id uuid primary key default gen_random_uuid(),
  card_id text not null,
  idea_id uuid not null references public.idea_candidates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  shot_status text not null default 'planned',
  was_shot boolean not null default false,
  rating integer check (rating between 1 and 5),
  modified_sections text[] default '{}',
  feedback_text text check (length(feedback_text) <= 1000),
  actual_capture_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint idea_card_feedback_shot_status_check check (shot_status in ('shot', 'planned', 'skipped')),
  constraint idea_card_feedback_shot_consistency_check check (was_shot = (shot_status = 'shot')),
  constraint idea_card_feedback_rating_requires_shot_check check (shot_status = 'shot' or rating is null),
  constraint idea_card_feedback_card_identity_check check (card_id = idea_id::text),
  constraint idea_card_feedback_capture_minutes_requires_shot_check check (
    actual_capture_minutes is null or (shot_status = 'shot' and actual_capture_minutes between 1 and 1440)
  )
);

create unique index if not exists idea_card_feedback_user_idea_uidx on public.idea_card_feedback(user_id, idea_id);
create index if not exists idx_idea_card_feedback_was_shot on public.idea_card_feedback(was_shot);

drop trigger if exists idea_card_feedback_set_updated_at on public.idea_card_feedback;
create trigger idea_card_feedback_set_updated_at
before update on public.idea_card_feedback
for each row execute function public.set_updated_at();

alter table public.idea_card_feedback enable row level security;
revoke all privileges on public.idea_card_feedback from public, anon, authenticated;
grant select, insert, update on public.idea_card_feedback to authenticated;
grant all privileges on public.idea_card_feedback to service_role;

drop policy if exists "Users can view own card feedback" on public.idea_card_feedback;
create policy "Users can view own card feedback"
  on public.idea_card_feedback for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can submit delivered card feedback" on public.idea_card_feedback;
create policy "Users can submit delivered card feedback"
  on public.idea_card_feedback for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and card_id = idea_id::text
    and exists (
      select 1 from public.idea_box_items item
      where item.user_id = (select auth.uid()) and item.idea_id = idea_card_feedback.idea_id
    )
  );

drop policy if exists "Users can update own card feedback" on public.idea_card_feedback;
create policy "Users can update own card feedback"
  on public.idea_card_feedback for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and card_id = idea_id::text
    and exists (
      select 1 from public.idea_box_items item
      where item.user_id = (select auth.uid()) and item.idea_id = idea_card_feedback.idea_id
    )
  );

-- 2. Client privilege hardening (same as supabase/migrations/20261016120000_harden_client_privileges.sql)
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

drop policy if exists card_reports_owner_insert on public.card_reports;

revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from anon;
revoke truncate, references, trigger
  on all tables in schema public from authenticated;

commit;
