do $$
begin
  create type public.card_report_status as enum (
    'under_review',
    'accepted',
    'rejected',
    'replaced',
    'closed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.card_report_reason as enum (
    'unclear_execution',
    'duplicate_or_too_similar',
    'wrong_lane_or_creator_mode_fit',
    'safety_or_sponsor_concern',
    'too_generic',
    'already_used_or_not_useful',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.card_report_admin_decision as enum (
    'reject',
    'accept_no_replace',
    'accept_replace'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.card_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delivery_id uuid not null references public.idea_box_deliveries(id) on delete cascade,
  delivery_item_id uuid not null references public.idea_box_items(id) on delete cascade,
  idea_id uuid not null references public.idea_candidates(id) on delete restrict,
  reason public.card_report_reason not null,
  creator_note text not null default '' check (char_length(creator_note) <= 2000),
  status public.card_report_status not null default 'under_review',
  admin_decision public.card_report_admin_decision,
  admin_feedback text check (admin_feedback is null or char_length(admin_feedback) <= 5000),
  admin_private_note text check (admin_private_note is null or char_length(admin_private_note) <= 5000),
  replacement_idea_id uuid references public.idea_candidates(id) on delete set null,
  replacement_inventory_id uuid references public.idea_inventory(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint card_reports_admin_resolution_chk check (
    (status = 'under_review' and admin_decision is null and reviewed_at is null)
    or
    (status <> 'under_review' and admin_decision is not null and reviewed_at is not null)
  ),
  constraint card_reports_replacement_chk check (
    (admin_decision = 'accept_replace' and replacement_idea_id is not null and replacement_inventory_id is not null)
    or
    (admin_decision is distinct from 'accept_replace')
  )
);

create table if not exists public.card_report_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.card_reports(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  actor text not null default 'system' check (actor in ('creator', 'admin', 'system')),
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.card_report_replacements (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.card_reports(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  delivery_id uuid not null references public.idea_box_deliveries(id) on delete cascade,
  delivery_item_id uuid not null references public.idea_box_items(id) on delete cascade,
  old_idea_id uuid not null references public.idea_candidates(id) on delete restrict,
  old_inventory_id uuid not null references public.idea_inventory(id) on delete restrict,
  new_idea_id uuid not null references public.idea_candidates(id) on delete restrict,
  new_inventory_id uuid not null references public.idea_inventory(id) on delete restrict,
  replaced_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists card_reports_one_open_per_item_uidx
on public.card_reports(delivery_item_id)
where status = 'under_review';

create index if not exists card_reports_user_status_idx
on public.card_reports(user_id, status, created_at desc);

create index if not exists card_reports_status_created_idx
on public.card_reports(status, created_at desc);

create index if not exists card_reports_delivery_item_idx
on public.card_reports(delivery_item_id, created_at desc);

create index if not exists card_report_events_report_idx
on public.card_report_events(report_id, created_at desc);

create index if not exists card_report_replacements_report_idx
on public.card_report_replacements(report_id, created_at desc);

drop trigger if exists card_reports_set_updated_at on public.card_reports;
create trigger card_reports_set_updated_at
before update on public.card_reports
for each row execute function public.set_updated_at();

alter table public.card_reports enable row level security;
alter table public.card_report_events enable row level security;
alter table public.card_report_replacements enable row level security;

drop policy if exists "card_reports_owner_select" on public.card_reports;
create policy "card_reports_owner_select" on public.card_reports
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "card_reports_owner_insert" on public.card_reports;
create policy "card_reports_owner_insert" on public.card_reports
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'under_review'
  and admin_decision is null
  and admin_feedback is null
  and admin_private_note is null
  and replacement_idea_id is null
  and replacement_inventory_id is null
  and reviewed_by is null
  and reviewed_at is null
  and exists (
    select 1
    from public.idea_box_items item
    where item.id = card_reports.delivery_item_id
      and item.delivery_id = card_reports.delivery_id
      and item.idea_id = card_reports.idea_id
      and item.user_id = (select auth.uid())
  )
);

drop policy if exists "card_report_events_owner_select" on public.card_report_events;
create policy "card_report_events_owner_select" on public.card_report_events
for select to authenticated
using ((select auth.uid()) = user_id);

revoke all privileges on public.card_reports from public, anon, authenticated;
revoke all privileges on public.card_report_events from public, anon, authenticated;
revoke all privileges on public.card_report_replacements from public, anon, authenticated;

grant select (
  id,
  user_id,
  delivery_id,
  delivery_item_id,
  idea_id,
  reason,
  creator_note,
  status,
  admin_decision,
  admin_feedback,
  replacement_idea_id,
  reviewed_at,
  closed_at,
  created_at,
  updated_at
) on public.card_reports to authenticated;

grant insert (
  user_id,
  delivery_id,
  delivery_item_id,
  idea_id,
  reason,
  creator_note,
  status
) on public.card_reports to authenticated;

grant select (
  id,
  report_id,
  user_id,
  actor,
  event_type,
  created_at
) on public.card_report_events to authenticated;

grant all privileges on public.card_reports to service_role;
grant all privileges on public.card_report_events to service_role;
grant all privileges on public.card_report_replacements to service_role;

create or replace function public.replace_reported_card(
  p_report_id uuid,
  p_replacement_inventory_id uuid,
  p_admin_user_id uuid,
  p_admin_feedback text,
  p_admin_private_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_report public.card_reports%rowtype;
  v_item public.idea_box_items%rowtype;
  v_delivery public.idea_box_deliveries%rowtype;
  v_new_inventory public.idea_inventory%rowtype;
  v_now timestamptz := now();
begin
  select *
  into v_report
  from public.card_reports
  where id = p_report_id
  for update;

  if not found then
    raise exception 'card report not found';
  end if;

  if v_report.status <> 'under_review' then
    raise exception 'card report is not under review';
  end if;

  select *
  into v_item
  from public.idea_box_items
  where id = v_report.delivery_item_id
  for update;

  if not found then
    raise exception 'delivery item not found';
  end if;

  select *
  into v_delivery
  from public.idea_box_deliveries
  where id = v_report.delivery_id
  for update;

  if not found then
    raise exception 'delivery not found';
  end if;

  select *
  into v_new_inventory
  from public.idea_inventory
  where id = p_replacement_inventory_id
  for update;

  if not found then
    raise exception 'replacement inventory not found';
  end if;

  if v_new_inventory.status <> 'available'
    or v_new_inventory.quality_floor_passed is not true
    or v_new_inventory.reuse_count >= v_new_inventory.max_reuse_count then
    raise exception 'replacement inventory is not available';
  end if;

  if v_new_inventory.category_id <> v_delivery.category_id
    or v_new_inventory.persona_id <> v_delivery.persona_id then
    raise exception 'replacement must match the same category and creator mode';
  end if;

  if v_new_inventory.idea_id = v_item.idea_id then
    raise exception 'replacement cannot be the reported card';
  end if;

  if exists (
    select 1
    from public.idea_box_items existing_item
    where existing_item.delivery_id = v_item.delivery_id
      and existing_item.id <> v_item.id
      and existing_item.idea_id = v_new_inventory.idea_id
  ) then
    raise exception 'replacement is already inside this box';
  end if;

  insert into public.card_report_replacements (
    report_id,
    user_id,
    delivery_id,
    delivery_item_id,
    old_idea_id,
    old_inventory_id,
    new_idea_id,
    new_inventory_id,
    replaced_by,
    metadata
  ) values (
    v_report.id,
    v_report.user_id,
    v_report.delivery_id,
    v_report.delivery_item_id,
    v_item.idea_id,
    v_item.inventory_id,
    v_new_inventory.idea_id,
    v_new_inventory.id,
    p_admin_user_id,
    jsonb_build_object('reason', v_report.reason, 'slot_index', v_item.slot_index)
  );

  update public.idea_box_items
  set idea_id = v_new_inventory.idea_id,
      inventory_id = v_new_inventory.id
  where id = v_item.id;

  update public.idea_inventory
  set reuse_count = greatest(reuse_count - 1, 0),
      status = case
        when status = 'retired'::public.inventory_status and greatest(reuse_count - 1, 0) < max_reuse_count then 'available'::public.inventory_status
        else status
      end
  where id = v_item.inventory_id;

  update public.idea_inventory
  set reuse_count = reuse_count + 1,
      last_assigned_at = v_now,
      status = case
        when reuse_count + 1 >= max_reuse_count then 'retired'::public.inventory_status
        else status
      end
  where id = v_new_inventory.id;

  update public.card_reports
  set status = 'replaced',
      admin_decision = 'accept_replace',
      admin_feedback = nullif(trim(coalesce(p_admin_feedback, '')), ''),
      admin_private_note = nullif(trim(coalesce(p_admin_private_note, '')), ''),
      replacement_idea_id = v_new_inventory.idea_id,
      replacement_inventory_id = v_new_inventory.id,
      reviewed_by = p_admin_user_id,
      reviewed_at = v_now,
      closed_at = v_now
  where id = v_report.id;

  insert into public.card_report_events (
    report_id,
    user_id,
    actor,
    event_type,
    metadata
  ) values (
    v_report.id,
    v_report.user_id,
    'admin',
    'card_replaced',
    jsonb_build_object('replacement_idea_id', v_new_inventory.idea_id)
  );

  return v_new_inventory.idea_id;
end;
$$;

revoke all on function public.replace_reported_card(uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.replace_reported_card(uuid, uuid, uuid, text, text) to service_role;
