create extension if not exists pgcrypto;

do $$ begin create type public.safety_status as enum ('SAFE','NEEDS_REVIEW','BLOCKED'); exception when duplicate_object then null; end $$;
do $$ begin create type public.review_decision as enum ('PASS','REFINE','HUMAN_REVIEW_REQUIRED','BLOCK'); exception when duplicate_object then null; end $$;
do $$ begin create type public.idea_status as enum ('draft','ready','needs_refinement','human_review_required','blocked','published','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type public.generation_source_mode as enum ('admin_direct','jsonl_import'); exception when duplicate_object then null; end $$;
do $$ begin create type public.score_band as enum ('low','mid','high'); exception when duplicate_object then null; end $$;
do $$ begin create type public.inventory_status as enum ('available','paused','retired'); exception when duplicate_object then null; end $$;
do $$ begin create type public.purchase_status as enum ('pending','paid','failed','refunded','canceled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.checkout_session_status as enum ('created','open','paid','expired','canceled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.box_delivery_status as enum ('pending','delivered','needs_inventory','failed','refunded'); exception when duplicate_object then null; end $$;
do $$ begin create type public.card_report_status as enum ('under_review','accepted','rejected','replaced','closed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.card_report_reason as enum ('unclear_execution','duplicate_or_too_similar','wrong_lane_or_creator_mode_fit','safety_or_sponsor_concern','too_generic','already_used_or_not_useful','other'); exception when duplicate_object then null; end $$;
do $$ begin create type public.card_report_admin_decision as enum ('reject','accept_no_replace','accept_replace'); exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'creator' check (role in ('creator','admin')),
  plan text not null default 'free',
  locale text not null default 'en-US',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  handle text,
  niche text,
  default_platforms text[] not null default '{}',
  production_capacity jsonb not null default '{}'::jsonb,
  voice_guidelines jsonb not null default '{}'::jsonb,
  constraints jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  family text not null default 'creator_content',
  risk_level text not null default 'low' check (risk_level in ('low','medium','restricted')),
  enabled boolean not null default true,
  sort_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slug = lower(slug)),
  check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$')
);

create table if not exists public.creator_personas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  tags text[] not null default '{}',
  enabled boolean not null default true,
  sort_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slug = lower(slug)),
  check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$')
);

create table if not exists public.creator_category_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  persona_id uuid references public.creator_personas(id) on delete set null,
  priority integer not null default 100,
  selected_content_layers text[] not null default '{}',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists creator_category_preferences_user_category_persona_uidx
on public.creator_category_preferences(user_id, category_id, coalesce(persona_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table if not exists public.box_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  price_usd_cents integer not null check (price_usd_cents > 0),
  idea_count integer not null check (idea_count > 0),
  allocation jsonb not null check (jsonb_typeof(allocation) = 'object'),
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slug = lower(slug)),
  check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$')
);

create table if not exists public.idea_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  external_idea_id text,
  category_id uuid references public.categories(id) on delete restrict,
  persona_id uuid references public.creator_personas(id) on delete restrict,
  platform text not null default 'instagram_reels',
  format text not null default 'short_video',
  language text not null default 'en',
  locale text not null default 'US',
  title text not null,
  one_sentence_premise text not null,
  core_insight text,
  opportunity_statement text,
  mechanism_ids text[] not null default '{}',
  trend_signal_ids uuid[] not null default '{}',
  hook_options jsonb not null default '[]'::jsonb,
  story_beats jsonb not null default '[]'::jsonb,
  comedy_remix jsonb not null default '{}'::jsonb,
  human_awareness jsonb not null default '{}'::jsonb,
  production_requirements jsonb not null default '{}'::jsonb,
  content_style_layers text[] not null default '{}',
  candidate_source public.generation_source_mode,
  safety_status public.safety_status not null default 'SAFE',
  perspective_prism_status public.review_decision not null default 'PASS',
  confidence_band text not null default 'MEDIUM',
  status public.idea_status not null default 'published',
  decision_trace jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idea_cards (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null unique references public.idea_candidates(id) on delete cascade,
  title text not null,
  card jsonb not null,
  markdown text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idea_inventory (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null unique references public.idea_candidates(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  persona_id uuid not null references public.creator_personas(id) on delete restrict,
  platform text not null default 'instagram_reels',
  language text not null default 'en',
  content_style_layers text[] not null default '{}',
  internal_rank_score numeric(5,2) not null check (internal_rank_score between 0 and 100),
  score_band public.score_band not null,
  quality_floor_passed boolean not null default true,
  status public.inventory_status not null default 'available',
  reuse_count integer not null default 0 check (reuse_count between 0 and 1),
  max_reuse_count integer not null default 1 check (max_reuse_count = 1),
  published_at timestamptz not null default now(),
  last_assigned_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  box_product_id uuid not null references public.box_products(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  persona_id uuid references public.creator_personas(id) on delete set null,
  provider text not null default 'stripe',
  provider_checkout_session_id text unique,
  provider_payment_intent_id text,
  amount_usd_cents integer not null check (amount_usd_cents > 0),
  currency text not null default 'usd',
  status public.purchase_status not null default 'pending',
  fulfillment_source text not null default 'stripe' check (fulfillment_source in ('stripe','admin_gift')),
  completed_at timestamptz,
  raw_event jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  box_product_id uuid not null references public.box_products(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  persona_id uuid references public.creator_personas(id) on delete set null,
  purchase_id uuid references public.purchases(id) on delete set null,
  provider text not null default 'stripe',
  provider_session_id text unique,
  status public.checkout_session_status not null default 'created',
  checkout_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idea_box_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  purchase_id uuid unique references public.purchases(id) on delete set null,
  box_product_id uuid not null references public.box_products(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  persona_id uuid not null references public.creator_personas(id) on delete restrict,
  status public.box_delivery_status not null default 'pending',
  allocation jsonb not null default '{}'::jsonb,
  failure_reason text,
  opened_at timestamptz,
  opened_metadata jsonb not null default '{}'::jsonb,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idea_box_items (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.idea_box_deliveries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  inventory_id uuid not null references public.idea_inventory(id) on delete restrict,
  idea_id uuid not null references public.idea_candidates(id) on delete restrict,
  slot_index integer not null check (slot_index > 0),
  assigned_band public.score_band not null,
  created_at timestamptz not null default now(),
  unique (delivery_id, slot_index),
  unique (delivery_id, idea_id)
);

create table if not exists public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz,
  processing_status text not null default 'processing' check (processing_status in ('processing','processed','failed')),
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.linked_social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('instagram','google','meta')),
  provider_account_id text,
  handle text,
  display_name text,
  avatar_url text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  channel text not null default 'in_app' check (channel in ('in_app','email','both')),
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.atelier_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  instagram_handle text,
  desired_effect text not null,
  project_context text not null,
  status text not null default 'new' check (status in ('new','contacted','qualified','closed','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  updated_at timestamptz not null default now()
);

create table if not exists public.card_report_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.card_reports(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  actor text not null default 'system' check (actor in ('creator','admin','system')),
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

create index if not exists categories_enabled_sort_idx on public.categories(enabled, sort_order, slug);
create index if not exists creator_personas_enabled_sort_idx on public.creator_personas(enabled, sort_order, slug);
create index if not exists purchases_user_status_idx on public.purchases(user_id, status, created_at desc);
create index if not exists checkout_sessions_user_status_idx on public.checkout_sessions(user_id, status, created_at desc);
create index if not exists idea_inventory_stock_idx on public.idea_inventory(category_id, persona_id, score_band, status, reuse_count, internal_rank_score desc) where status = 'available'::public.inventory_status and reuse_count = 0;
create unique index if not exists idea_box_items_global_idea_uidx on public.idea_box_items(idea_id);
create unique index if not exists idea_box_items_global_inventory_uidx on public.idea_box_items(inventory_id);
create index if not exists idea_box_deliveries_user_status_idx on public.idea_box_deliveries(user_id, status, created_at desc);
create index if not exists idea_box_items_user_delivery_idx on public.idea_box_items(user_id, delivery_id, slot_index);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, read_at, created_at desc);
create index if not exists atelier_leads_status_created_idx on public.atelier_leads(status, created_at desc);
create unique index if not exists card_reports_one_open_per_item_uidx on public.card_reports(delivery_item_id) where status = 'under_review';
create index if not exists card_reports_user_status_idx on public.card_reports(user_id, status, created_at desc);
create index if not exists card_reports_status_created_idx on public.card_reports(status, created_at desc);

do $$ begin create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger creator_profiles_set_updated_at before update on public.creator_profiles for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger creator_personas_set_updated_at before update on public.creator_personas for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger box_products_set_updated_at before update on public.box_products for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger purchases_set_updated_at before update on public.purchases for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger checkout_sessions_set_updated_at before update on public.checkout_sessions for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger idea_candidates_set_updated_at before update on public.idea_candidates for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger idea_cards_set_updated_at before update on public.idea_cards for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger idea_inventory_set_updated_at before update on public.idea_inventory for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger idea_box_deliveries_set_updated_at before update on public.idea_box_deliveries for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger linked_social_accounts_set_updated_at before update on public.linked_social_accounts for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger atelier_leads_set_updated_at before update on public.atelier_leads for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger card_reports_set_updated_at before update on public.card_reports for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;

create or replace function public.inventory_health()
returns table (category_slug text, persona_slug text, low_count bigint, mid_count bigint, high_count bigint, low_target integer, mid_target integer, high_target integer, low_threshold integer, mid_threshold integer, high_threshold integer, needs_generation boolean)
language sql
security invoker
set search_path = public, pg_temp
as $$
  with pairs as (
    select c.id as category_id, p.id as persona_id
    from public.categories c cross join public.creator_personas p
    where c.enabled = true and p.enabled = true
    union select inv.category_id, inv.persona_id from public.idea_inventory inv
  ),
  counts as (
    select pairs.category_id, pairs.persona_id,
      count(inv.id) filter (where inv.score_band = 'low' and inv.status = 'available' and inv.reuse_count = 0 and inv.quality_floor_passed is true and not exists (select 1 from public.idea_box_items used where used.idea_id = inv.idea_id or used.inventory_id = inv.id)) as low_count,
      count(inv.id) filter (where inv.score_band = 'mid' and inv.status = 'available' and inv.reuse_count = 0 and inv.quality_floor_passed is true and not exists (select 1 from public.idea_box_items used where used.idea_id = inv.idea_id or used.inventory_id = inv.id)) as mid_count,
      count(inv.id) filter (where inv.score_band = 'high' and inv.status = 'available' and inv.reuse_count = 0 and inv.quality_floor_passed is true and not exists (select 1 from public.idea_box_items used where used.idea_id = inv.idea_id or used.inventory_id = inv.id)) as high_count
    from pairs
    left join public.idea_inventory inv on inv.category_id = pairs.category_id and inv.persona_id = pairs.persona_id
    group by pairs.category_id, pairs.persona_id
  )
  select c.slug, p.slug, counts.low_count, counts.mid_count, counts.high_count,
    200, 100, 100, 60, 30, 30,
    counts.low_count < 60 or counts.mid_count < 30 or counts.high_count < 30
  from counts
  join public.categories c on c.id = counts.category_id
  join public.creator_personas p on p.id = counts.persona_id
  order by (counts.low_count < 60 or counts.mid_count < 30 or counts.high_count < 30) desc,
    c.sort_order,
    p.sort_order,
    c.slug,
    p.slug;
$$;

create or replace function public.deliver_idea_box(p_user_id uuid, p_box_product_slug text, p_category_slug text, p_persona_slug text, p_purchase_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product public.box_products%rowtype;
  v_category_id uuid;
  v_persona_id uuid;
  v_delivery_id uuid;
  v_band public.score_band;
  v_needed integer;
  v_available integer;
  v_slot_index integer := 1;
  v_inventory_id uuid;
  v_idea_id uuid;
  v_existing_status public.box_delivery_status;
  v_loop_index integer;
begin
  if p_user_id is null then raise exception 'p_user_id is required'; end if;

  if p_purchase_id is not null then
    select id, status into v_delivery_id, v_existing_status from public.idea_box_deliveries where purchase_id = p_purchase_id for update;
    if v_delivery_id is not null and v_existing_status = 'delivered' then return v_delivery_id; end if;
  end if;

  select * into v_product from public.box_products where slug = p_box_product_slug and enabled = true;
  if not found then raise exception 'box product not found: %', p_box_product_slug; end if;
  select id into v_category_id from public.categories where slug = p_category_slug and enabled = true;
  if v_category_id is null then raise exception 'category not found: %', p_category_slug; end if;
  select id into v_persona_id from public.creator_personas where slug = p_persona_slug and enabled = true;
  if v_persona_id is null then raise exception 'persona not found: %', p_persona_slug; end if;

  for v_band in select unnest(array['low','mid','high']::public.score_band[]) loop
    v_needed := coalesce((v_product.allocation ->> v_band::text)::integer, 0);
    if v_needed > 0 then
      select count(*)::integer into v_available
      from public.idea_inventory inv
      where inv.category_id = v_category_id and inv.score_band = v_band and inv.status = 'available'
        and inv.reuse_count = 0 and inv.max_reuse_count = 1 and inv.quality_floor_passed is true
        and not exists (select 1 from public.idea_box_items used where used.idea_id = inv.idea_id or used.inventory_id = inv.id);
      if v_available < v_needed then
        if v_delivery_id is null then
          insert into public.idea_box_deliveries(user_id,purchase_id,box_product_id,category_id,persona_id,status,allocation,failure_reason)
          values (p_user_id,p_purchase_id,v_product.id,v_category_id,v_persona_id,'needs_inventory',v_product.allocation,format('insufficient %s inventory for category: needed %s, available %s', v_band::text, v_needed, v_available))
          returning id into v_delivery_id;
        else
          update public.idea_box_deliveries set user_id = p_user_id, box_product_id = v_product.id, category_id = v_category_id, persona_id = v_persona_id, status = 'needs_inventory', allocation = v_product.allocation, failure_reason = format('insufficient %s inventory for category: needed %s, available %s', v_band::text, v_needed, v_available), delivered_at = null where id = v_delivery_id;
        end if;
        return v_delivery_id;
      end if;
    end if;
  end loop;

  if v_delivery_id is null then
    insert into public.idea_box_deliveries(user_id,purchase_id,box_product_id,category_id,persona_id,status,allocation)
    values (p_user_id,p_purchase_id,v_product.id,v_category_id,v_persona_id,'pending',v_product.allocation)
    returning id into v_delivery_id;
  else
    update public.idea_box_deliveries set user_id = p_user_id, box_product_id = v_product.id, category_id = v_category_id, persona_id = v_persona_id, status = 'pending', allocation = v_product.allocation, failure_reason = null, delivered_at = null where id = v_delivery_id;
    delete from public.idea_box_items where delivery_id = v_delivery_id;
  end if;

  for v_band in select unnest(array['low','mid','high']::public.score_band[]) loop
    v_needed := coalesce((v_product.allocation ->> v_band::text)::integer, 0);
    for v_loop_index in 1..v_needed loop
      select inv.id, inv.idea_id into v_inventory_id, v_idea_id
      from public.idea_inventory inv
      where inv.category_id = v_category_id and inv.score_band = v_band and inv.status = 'available'
        and inv.reuse_count = 0 and inv.max_reuse_count = 1 and inv.quality_floor_passed is true
        and not exists (select 1 from public.idea_box_items used where used.idea_id = inv.idea_id or used.inventory_id = inv.id)
      order by case when inv.persona_id = v_persona_id then 0 else 1 end, inv.internal_rank_score desc, inv.published_at asc
      limit 1 for update skip locked;
      if v_inventory_id is null then raise exception 'inventory changed during delivery for band %', v_band::text; end if;
      insert into public.idea_box_items(delivery_id,user_id,inventory_id,idea_id,slot_index,assigned_band)
      values (v_delivery_id,p_user_id,v_inventory_id,v_idea_id,v_slot_index,v_band);
      update public.idea_inventory set reuse_count = 1, max_reuse_count = 1, last_assigned_at = now(), status = 'retired'::public.inventory_status where id = v_inventory_id;
      v_slot_index := v_slot_index + 1;
    end loop;
  end loop;

  update public.idea_box_deliveries set status = 'delivered', delivered_at = now() where id = v_delivery_id;
  return v_delivery_id;
end;
$$;

create or replace function public.replace_reported_card(p_report_id uuid, p_replacement_inventory_id uuid, p_admin_user_id uuid, p_admin_feedback text, p_admin_private_note text default null)
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
  select * into v_report from public.card_reports where id = p_report_id for update;
  if not found then raise exception 'card report not found'; end if;
  if v_report.status <> 'under_review' then raise exception 'card report is not under review'; end if;
  select * into v_item from public.idea_box_items where id = v_report.delivery_item_id for update;
  if not found then raise exception 'delivery item not found'; end if;
  select * into v_delivery from public.idea_box_deliveries where id = v_report.delivery_id for update;
  if not found then raise exception 'delivery not found'; end if;
  select * into v_new_inventory from public.idea_inventory where id = p_replacement_inventory_id for update;
  if not found then raise exception 'replacement inventory not found'; end if;
  if v_new_inventory.status <> 'available' or v_new_inventory.quality_floor_passed is not true or v_new_inventory.reuse_count <> 0 or v_new_inventory.max_reuse_count <> 1 then raise exception 'replacement inventory is not available'; end if;
  if exists (select 1 from public.idea_box_items used where used.idea_id = v_new_inventory.idea_id or used.inventory_id = v_new_inventory.id) then raise exception 'replacement inventory has already been assigned'; end if;
  if v_new_inventory.category_id <> v_delivery.category_id then raise exception 'replacement must match the same category'; end if;
  if v_new_inventory.idea_id = v_item.idea_id then raise exception 'replacement cannot be the reported card'; end if;

  insert into public.card_report_replacements(report_id,user_id,delivery_id,delivery_item_id,old_idea_id,old_inventory_id,new_idea_id,new_inventory_id,replaced_by,metadata)
  values (v_report.id,v_report.user_id,v_report.delivery_id,v_report.delivery_item_id,v_item.idea_id,v_item.inventory_id,v_new_inventory.idea_id,v_new_inventory.id,p_admin_user_id,jsonb_build_object('reason', v_report.reason, 'slot_index', v_item.slot_index));
  update public.idea_box_items set idea_id = v_new_inventory.idea_id, inventory_id = v_new_inventory.id where id = v_item.id;
  update public.idea_inventory set reuse_count = 1, max_reuse_count = 1, status = 'retired'::public.inventory_status, last_assigned_at = coalesce(last_assigned_at, v_now) where id in (v_item.inventory_id, v_new_inventory.id);
  update public.card_reports set status = 'replaced', admin_decision = 'accept_replace', admin_feedback = nullif(trim(coalesce(p_admin_feedback, '')), ''), admin_private_note = nullif(trim(coalesce(p_admin_private_note, '')), ''), replacement_idea_id = v_new_inventory.idea_id, replacement_inventory_id = v_new_inventory.id, reviewed_by = p_admin_user_id, reviewed_at = v_now, closed_at = v_now where id = v_report.id;
  insert into public.card_report_events(report_id,user_id,actor,event_type,metadata) values (v_report.id,v_report.user_id,'admin','card_replaced',jsonb_build_object('replacement_idea_id', v_new_inventory.idea_id));
  return v_new_inventory.idea_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.creator_personas enable row level security;
alter table public.creator_category_preferences enable row level security;
alter table public.box_products enable row level security;
alter table public.idea_candidates enable row level security;
alter table public.idea_cards enable row level security;
alter table public.idea_inventory enable row level security;
alter table public.purchases enable row level security;
alter table public.checkout_sessions enable row level security;
alter table public.idea_box_deliveries enable row level security;
alter table public.idea_box_items enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.linked_social_accounts enable row level security;
alter table public.notifications enable row level security;
alter table public.atelier_leads enable row level security;
alter table public.card_reports enable row level security;
alter table public.card_report_events enable row level security;
alter table public.card_report_replacements enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists creator_profiles_owner_all on public.creator_profiles;
create policy creator_profiles_owner_all on public.creator_profiles for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists categories_read_enabled on public.categories;
create policy categories_read_enabled on public.categories for select to anon, authenticated using (enabled = true);
drop policy if exists creator_personas_read_enabled on public.creator_personas;
create policy creator_personas_read_enabled on public.creator_personas for select to anon, authenticated using (enabled = true);
drop policy if exists creator_category_preferences_owner_all on public.creator_category_preferences;
create policy creator_category_preferences_owner_all on public.creator_category_preferences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists box_products_read_enabled on public.box_products;
create policy box_products_read_enabled on public.box_products for select to anon, authenticated using (enabled = true);
drop policy if exists purchases_owner_select on public.purchases;
create policy purchases_owner_select on public.purchases for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists checkout_sessions_owner_select on public.checkout_sessions;
create policy checkout_sessions_owner_select on public.checkout_sessions for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists idea_box_deliveries_owner_select on public.idea_box_deliveries;
create policy idea_box_deliveries_owner_select on public.idea_box_deliveries for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists idea_box_items_owner_select on public.idea_box_items;
create policy idea_box_items_owner_select on public.idea_box_items for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists idea_cards_delivery_select on public.idea_cards;
create policy idea_cards_delivery_select on public.idea_cards for select to authenticated using (exists (select 1 from public.idea_box_items item where item.idea_id = idea_cards.idea_id and item.user_id = (select auth.uid())));
drop policy if exists linked_social_accounts_owner_select on public.linked_social_accounts;
create policy linked_social_accounts_owner_select on public.linked_social_accounts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists linked_social_accounts_owner_delete on public.linked_social_accounts;
create policy linked_social_accounts_owner_delete on public.linked_social_accounts for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists notifications_owner_select on public.notifications;
create policy notifications_owner_select on public.notifications for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_update on public.notifications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists card_reports_owner_select on public.card_reports;
create policy card_reports_owner_select on public.card_reports for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists card_reports_owner_insert on public.card_reports;
create policy card_reports_owner_insert on public.card_reports for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists card_report_events_owner_select on public.card_report_events;
create policy card_report_events_owner_select on public.card_report_events for select to authenticated using ((select auth.uid()) = user_id);

revoke all on function public.inventory_health() from public, anon, authenticated;
grant execute on function public.inventory_health() to service_role;
revoke all on function public.deliver_idea_box(uuid, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.deliver_idea_box(uuid, text, text, text, uuid) to service_role;
revoke all on function public.replace_reported_card(uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.replace_reported_card(uuid, uuid, uuid, text, text) to service_role;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.categories to anon, authenticated;
grant select on public.creator_personas to anon, authenticated;
grant select on public.box_products to anon, authenticated;
grant select, insert, update, delete on public.creator_category_preferences to authenticated;
grant select on public.purchases to authenticated;
grant select on public.checkout_sessions to authenticated;
grant select on public.idea_box_deliveries to authenticated;
grant select on public.idea_box_items to authenticated;
grant select on public.idea_cards to authenticated;
grant select, delete on public.linked_social_accounts to authenticated;
grant select, update (read_at) on public.notifications to authenticated;
grant select, insert on public.card_reports to authenticated;
grant select on public.card_report_events to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

insert into public.categories (slug, name, family, risk_level, sort_order, metadata, enabled) values
('beauty','Beauty','creator_content','low',10,'{}'::jsonb,true),
('fashion','Fashion','creator_content','low',20,'{}'::jsonb,true),
('travel','Travel','creator_content','medium',30,'{}'::jsonb,true),
('lifestyle','Lifestyle','creator_content','low',40,'{}'::jsonb,true),
('food','Food','creator_content','low',50,'{}'::jsonb,true),
('fitness_wellness_safe','Fitness & Wellness Safe','creator_content','medium',60,'{}'::jsonb,true),
('parenting_family','Parenting & Family','creator_content','medium',70,'{}'::jsonb,true),
('creator_education','Creator Education','creator_content','low',80,'{}'::jsonb,true),
('entertainment_comedy','Entertainment Comedy','creator_content','medium',90,'{}'::jsonb,true),
('thought_leadership','Thought Leadership','creator_content','medium',100,'{}'::jsonb,true),
('commerce_affiliate','Commerce & Affiliate','creator_content','medium',110,'{}'::jsonb,true),
('luxury','Luxury','creator_content','medium',120,'{}'::jsonb,true)
on conflict (slug) do update set name = excluded.name, family = excluded.family, risk_level = excluded.risk_level, sort_order = excluded.sort_order, metadata = excluded.metadata, enabled = excluded.enabled, updated_at = now();

insert into public.creator_personas (slug, name, description, tags, sort_order, metadata, enabled) values
('luxury_editor','Luxury Editor','Premium taste, restraint, editorship, high-trust recommendations.',array['premium','curated','editorial'],10,'{}'::jsonb,true),
('relatable_lifestyle','Relatable Lifestyle','Daily-life pressure, honest routines, friendly recognition loops.',array['relatable','warm','routine'],20,'{}'::jsonb,true),
('expert_guide','Expert Guide','Teaches clearly, gives frameworks, avoids overclaiming.',array['expert','educational','saveable'],30,'{}'::jsonb,true),
('beauty_tester','Beauty Tester','Proof-led beauty creator focused on routines, tests and honest boundaries.',array['testing','proof','beauty'],40,'{}'::jsonb,true),
('travel_curator','Travel Curator','Place-aware travel creator with itinerary, mood and reality checks.',array['travel','place','itinerary'],50,'{}'::jsonb,true),
('comedy_observer','Comedy Observer','Turns everyday absurdity into safe, recognizable social jokes.',array['comedy','observation','safe_target'],60,'{}'::jsonb,true),
('product_reviewer','Product Reviewer','Commercially useful creator who balances proof, limits and conversion.',array['review','commerce','proof'],70,'{}'::jsonb,true),
('creator_teacher','Creator Teacher','Breaks down growth, content systems and creator operations.',array['creator_growth','teaching','framework'],80,'{}'::jsonb,true),
('fitness_athlete','Fitness Athlete','High-energy training, body transformations, discipline and motivation.',array['fitness','athlete','motivation','transformation'],90,'{}'::jsonb,true),
('authentic_storyteller','Authentic Storyteller','Personal vlogs, honest stories, vulnerability and real-life moments.',array['authentic','story','vlog','relatable'],100,'{}'::jsonb,true),
('niche_specialist','Niche Specialist','Deep dives into specific hobbies, subcultures and specialized expertise.',array['niche','deep','expert','community'],110,'{}'::jsonb,true),
('fashion_trendsetter','Fashion Trendsetter','Style leader, early adopter of trends and aesthetic direction.',array['fashion','style','trend','aesthetic'],120,'{}'::jsonb,true),
('family_creator','Family Creator','Parenting, family life, honest home routines and relatable chaos.',array['family','parent','home','relatable'],130,'{}'::jsonb,true),
('entertainer_performer','Entertainer','Skits, challenges, high-energy fun and performance-driven content.',array['entertain','fun','challenge','performance'],140,'{}'::jsonb,true),
('tech_reviewer','Tech Reviewer','Gadgets, apps, tech tutorials with honest reviews and clear demos.',array['tech','gadget','review','demo'],150,'{}'::jsonb,true),
('foodie_creator','Foodie Creator','Recipes, restaurant experiences, cooking and flavor storytelling.',array['food','recipe','cooking','taste'],160,'{}'::jsonb,true),
('achiever_challenger','Achiever','Ambitious challenges, big goals, giveaways and high-production content.',array['challenge','giveaway','ambition','scale'],170,'{}'::jsonb,true),
('credible_infotainer','Credible Infotainer','Educational yet entertaining content with trustworthy facts and personality.',array['education','info','entertain','trust'],180,'{}'::jsonb,true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, tags = excluded.tags, sort_order = excluded.sort_order, metadata = excluded.metadata, enabled = excluded.enabled, updated_at = now();

insert into public.box_products (slug, name, price_usd_cents, idea_count, allocation, metadata, enabled) values
('viral_box_500','Classic Red Dossier',900,2,'{"high":2}'::jsonb,'{"visible_to_creator":true,"shows_scores":false,"display_name":"Classic Red Dossier","short_description":"2 campaign-ready creative briefs calibrated to your lane, creator mode, and production style."}'::jsonb,true),
('premium_viral_box_1000','Signature Purple Dossier',1900,5,'{"high":5}'::jsonb,'{"visible_to_creator":true,"shows_scores":false,"display_name":"Signature Purple Dossier","short_description":"5 campaign-ready creative briefs with deeper production direction, brand-lift framing, and launch-ready creative angles."}'::jsonb,true)
on conflict (slug) do update set name = excluded.name, price_usd_cents = excluded.price_usd_cents, idea_count = excluded.idea_count, allocation = excluded.allocation, metadata = excluded.metadata, enabled = excluded.enabled, updated_at = now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars','profile-avatars',true,2097152,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists profile_avatars_public_select on storage.objects;
create policy profile_avatars_public_select on storage.objects for select to public using (bucket_id = 'profile-avatars');
drop policy if exists profile_avatars_owner_insert on storage.objects;
create policy profile_avatars_owner_insert on storage.objects for insert to authenticated with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists profile_avatars_owner_update on storage.objects;
create policy profile_avatars_owner_update on storage.objects for update to authenticated using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists profile_avatars_owner_delete on storage.objects;
create policy profile_avatars_owner_delete on storage.objects for delete to authenticated using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- 2026-10-16: card feedback table and client privilege hardening.
-- Same statements as supabase/production/patch_20261016_feedback_and_hardening.sql.
-- ---------------------------------------------------------------------------


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

