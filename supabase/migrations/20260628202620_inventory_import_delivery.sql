create type public.generation_source_mode as enum (
  'admin_direct',
  'jsonl_import'
);

create type public.generation_batch_status as enum (
  'draft',
  'generating',
  'generated',
  'importing',
  'imported',
  'scoring',
  'scored',
  'publishing',
  'published',
  'failed',
  'archived'
);

create type public.score_band as enum (
  'low',
  'mid',
  'high'
);

create type public.inventory_status as enum (
  'available',
  'paused',
  'retired'
);

create type public.purchase_status as enum (
  'pending',
  'paid',
  'failed',
  'refunded',
  'canceled'
);

create type public.checkout_session_status as enum (
  'created',
  'open',
  'paid',
  'expired',
  'canceled'
);

create type public.box_delivery_status as enum (
  'pending',
  'delivered',
  'needs_inventory',
  'failed',
  'refunded'
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  family text not null default 'creator_content',
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'restricted')),
  enabled boolean not null default true,
  sort_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slug = lower(slug)),
  check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$')
);

create table public.creator_personas (
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

create table public.creator_category_preferences (
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

create unique index creator_category_preferences_user_category_persona_uidx
on public.creator_category_preferences (
  user_id,
  category_id,
  coalesce(persona_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create table public.box_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  price_usd_cents integer not null check (price_usd_cents > 0),
  idea_count integer not null check (idea_count > 0),
  allocation jsonb not null,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slug = lower(slug)),
  check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  check (jsonb_typeof(allocation) = 'object')
);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  box_product_id uuid not null references public.box_products(id) on delete restrict,
  provider text not null default 'stripe',
  provider_checkout_session_id text unique,
  provider_payment_intent_id text,
  amount_usd_cents integer not null check (amount_usd_cents > 0),
  currency text not null default 'usd',
  status public.purchase_status not null default 'pending',
  raw_event jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  box_product_id uuid not null references public.box_products(id) on delete restrict,
  purchase_id uuid references public.purchases(id) on delete set null,
  provider text not null default 'stripe',
  provider_session_id text unique,
  status public.checkout_session_status not null default 'created',
  checkout_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.idea_generation_batches (
  id uuid primary key default gen_random_uuid(),
  external_batch_id text not null unique,
  category_id uuid not null references public.categories(id) on delete restrict,
  persona_id uuid not null references public.creator_personas(id) on delete restrict,
  target_count integer not null check (target_count between 1 and 50000),
  language text not null default 'tr',
  platform text not null default 'instagram_reels',
  generator_version text not null default '1.0.0',
  source_mode public.generation_source_mode not null default 'admin_direct',
  status public.generation_batch_status not null default 'draft',
  manifest jsonb not null default '{}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.idea_import_errors (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.idea_generation_batches(id) on delete cascade,
  source_file text,
  line_number integer,
  external_idea_id text,
  error_code text not null,
  error_message text not null,
  raw_payload jsonb,
  raw_line text,
  created_at timestamptz not null default now()
);

alter table public.idea_candidates
  alter column user_id drop not null,
  add column external_idea_id text,
  add column generation_batch_id uuid references public.idea_generation_batches(id) on delete set null,
  add column category_id uuid references public.categories(id) on delete restrict,
  add column persona_id uuid references public.creator_personas(id) on delete restrict,
  add column content_style_layers text[] not null default '{}',
  add column candidate_source public.generation_source_mode;

create unique index idea_candidates_batch_external_idea_uidx
on public.idea_candidates(generation_batch_id, external_idea_id)
where generation_batch_id is not null and external_idea_id is not null;

create table public.idea_inventory (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null unique references public.idea_candidates(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  persona_id uuid not null references public.creator_personas(id) on delete restrict,
  platform text not null default 'instagram_reels',
  language text not null default 'tr',
  content_style_layers text[] not null default '{}',
  internal_rank_score numeric(5,2) not null check (internal_rank_score between 0 and 100),
  score_band public.score_band not null,
  quality_floor_passed boolean not null default true,
  status public.inventory_status not null default 'available',
  reuse_count integer not null default 0 check (reuse_count >= 0),
  max_reuse_count integer not null default 999999 check (max_reuse_count > 0),
  published_at timestamptz not null default now(),
  last_assigned_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.idea_box_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  purchase_id uuid unique references public.purchases(id) on delete set null,
  box_product_id uuid not null references public.box_products(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  persona_id uuid not null references public.creator_personas(id) on delete restrict,
  status public.box_delivery_status not null default 'pending',
  allocation jsonb not null default '{}'::jsonb,
  failure_reason text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.idea_box_items (
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

create index categories_enabled_sort_idx on public.categories(enabled, sort_order, slug);
create index creator_personas_enabled_sort_idx on public.creator_personas(enabled, sort_order, slug);
create index creator_category_preferences_user_idx on public.creator_category_preferences(user_id, priority);
create index purchases_user_status_idx on public.purchases(user_id, status, created_at desc);
create index checkout_sessions_user_status_idx on public.checkout_sessions(user_id, status, created_at desc);
create index idea_generation_batches_status_idx on public.idea_generation_batches(status, created_at desc);
create index idea_generation_batches_category_persona_idx on public.idea_generation_batches(category_id, persona_id, status);
create index idea_import_errors_batch_idx on public.idea_import_errors(batch_id, created_at desc);
create index idea_candidates_batch_idx on public.idea_candidates(generation_batch_id, status, created_at desc);
create index idea_candidates_category_persona_idx on public.idea_candidates(category_id, persona_id, platform);
create index idea_inventory_stock_idx on public.idea_inventory(category_id, persona_id, score_band, status, reuse_count, internal_rank_score desc);
create index idea_box_deliveries_user_status_idx on public.idea_box_deliveries(user_id, status, created_at desc);
create index idea_box_items_user_delivery_idx on public.idea_box_items(user_id, delivery_id, slot_index);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger creator_personas_set_updated_at
before update on public.creator_personas
for each row execute function public.set_updated_at();

create trigger creator_category_preferences_set_updated_at
before update on public.creator_category_preferences
for each row execute function public.set_updated_at();

create trigger box_products_set_updated_at
before update on public.box_products
for each row execute function public.set_updated_at();

create trigger purchases_set_updated_at
before update on public.purchases
for each row execute function public.set_updated_at();

create trigger checkout_sessions_set_updated_at
before update on public.checkout_sessions
for each row execute function public.set_updated_at();

create trigger idea_generation_batches_set_updated_at
before update on public.idea_generation_batches
for each row execute function public.set_updated_at();

create trigger idea_inventory_set_updated_at
before update on public.idea_inventory
for each row execute function public.set_updated_at();

create trigger idea_box_deliveries_set_updated_at
before update on public.idea_box_deliveries
for each row execute function public.set_updated_at();

create or replace function public.prevent_profile_role_client_update()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if old.role is distinct from new.role and current_user in ('anon', 'authenticated') then
    raise exception 'profile role cannot be changed from client context';
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_role_client_update
before update of role on public.profiles
for each row execute function public.prevent_profile_role_client_update();

alter table public.categories enable row level security;
alter table public.creator_personas enable row level security;
alter table public.creator_category_preferences enable row level security;
alter table public.box_products enable row level security;
alter table public.purchases enable row level security;
alter table public.checkout_sessions enable row level security;
alter table public.idea_generation_batches enable row level security;
alter table public.idea_import_errors enable row level security;
alter table public.idea_inventory enable row level security;
alter table public.idea_box_deliveries enable row level security;
alter table public.idea_box_items enable row level security;

create policy "categories_read_enabled" on public.categories
for select to anon, authenticated
using (enabled = true);

create policy "creator_personas_read_enabled" on public.creator_personas
for select to anon, authenticated
using (enabled = true);

create policy "creator_category_preferences_owner_all" on public.creator_category_preferences
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "box_products_read_enabled" on public.box_products
for select to anon, authenticated
using (enabled = true);

create policy "purchases_owner_select" on public.purchases
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "checkout_sessions_owner_select" on public.checkout_sessions
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "idea_box_deliveries_owner_select" on public.idea_box_deliveries
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "idea_box_items_owner_select" on public.idea_box_items
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "idea_candidates_delivery_select" on public.idea_candidates
for select to authenticated
using (
  exists (
    select 1
    from public.idea_box_items item
    where item.idea_id = idea_candidates.id
      and item.user_id = (select auth.uid())
  )
);

create policy "idea_cards_delivery_select" on public.idea_cards
for select to authenticated
using (
  exists (
    select 1
    from public.idea_box_items item
    where item.idea_id = idea_cards.idea_id
      and item.user_id = (select auth.uid())
  )
);

create or replace function public.inventory_health()
returns table (
  category_slug text,
  persona_slug text,
  low_count bigint,
  mid_count bigint,
  high_count bigint,
  low_target integer,
  mid_target integer,
  high_target integer,
  low_threshold integer,
  mid_threshold integer,
  high_threshold integer,
  needs_generation boolean
)
language sql
security invoker
set search_path = public, pg_temp
as $$
  with pairs as (
    select c.id as category_id, p.id as persona_id
    from public.categories c
    cross join public.creator_personas p
    where c.enabled = true
      and p.enabled = true
    union
    select inv.category_id, inv.persona_id
    from public.idea_inventory inv
  ),
  counts as (
    select
      pairs.category_id,
      pairs.persona_id,
      count(inv.id) filter (
        where inv.score_band = 'low'
          and inv.status = 'available'
          and inv.reuse_count < inv.max_reuse_count
      ) as low_count,
      count(inv.id) filter (
        where inv.score_band = 'mid'
          and inv.status = 'available'
          and inv.reuse_count < inv.max_reuse_count
      ) as mid_count,
      count(inv.id) filter (
        where inv.score_band = 'high'
          and inv.status = 'available'
          and inv.reuse_count < inv.max_reuse_count
      ) as high_count
    from pairs
    left join public.idea_inventory inv
      on inv.category_id = pairs.category_id
     and inv.persona_id = pairs.persona_id
    group by pairs.category_id, pairs.persona_id
  )
  select
    c.slug as category_slug,
    p.slug as persona_slug,
    counts.low_count,
    counts.mid_count,
    counts.high_count,
    200 as low_target,
    100 as mid_target,
    100 as high_target,
    60 as low_threshold,
    30 as mid_threshold,
    30 as high_threshold,
    counts.low_count < 60
      or counts.mid_count < 30
      or counts.high_count < 30 as needs_generation
  from counts
  join public.categories c on c.id = counts.category_id
  join public.creator_personas p on p.id = counts.persona_id
  order by needs_generation desc, c.sort_order, p.sort_order, c.slug, p.slug;
$$;

create or replace function public.deliver_idea_box(
  p_user_id uuid,
  p_box_product_slug text,
  p_category_slug text,
  p_persona_slug text,
  p_purchase_id uuid default null
)
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
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_purchase_id is not null then
    select id, status
    into v_delivery_id, v_existing_status
    from public.idea_box_deliveries
    where purchase_id = p_purchase_id
    for update;

    if v_delivery_id is not null and v_existing_status = 'delivered' then
      return v_delivery_id;
    end if;
  end if;

  select *
  into v_product
  from public.box_products
  where slug = p_box_product_slug
    and enabled = true;

  if not found then
    raise exception 'box product not found: %', p_box_product_slug;
  end if;

  select id
  into v_category_id
  from public.categories
  where slug = p_category_slug
    and enabled = true;

  if v_category_id is null then
    raise exception 'category not found: %', p_category_slug;
  end if;

  select id
  into v_persona_id
  from public.creator_personas
  where slug = p_persona_slug
    and enabled = true;

  if v_persona_id is null then
    raise exception 'persona not found: %', p_persona_slug;
  end if;

  for v_band in
    select unnest(array['low', 'mid', 'high']::public.score_band[])
  loop
    v_needed := coalesce((v_product.allocation ->> v_band::text)::integer, 0);

    if v_needed > 0 then
      select count(*)::integer
      into v_available
      from public.idea_inventory inv
      where inv.category_id = v_category_id
        and inv.persona_id = v_persona_id
        and inv.score_band = v_band
        and inv.status = 'available'
        and inv.reuse_count < inv.max_reuse_count;

      if v_available < v_needed then
        if v_delivery_id is null then
          insert into public.idea_box_deliveries (
            user_id,
            purchase_id,
            box_product_id,
            category_id,
            persona_id,
            status,
            allocation,
            failure_reason
          ) values (
            p_user_id,
            p_purchase_id,
            v_product.id,
            v_category_id,
            v_persona_id,
            'needs_inventory',
            v_product.allocation,
            format('insufficient %s inventory: needed %s, available %s', v_band::text, v_needed, v_available)
          )
          returning id into v_delivery_id;
        else
          update public.idea_box_deliveries
          set user_id = p_user_id,
              box_product_id = v_product.id,
              category_id = v_category_id,
              persona_id = v_persona_id,
              status = 'needs_inventory',
              allocation = v_product.allocation,
              failure_reason = format('insufficient %s inventory: needed %s, available %s', v_band::text, v_needed, v_available),
              delivered_at = null
          where id = v_delivery_id;
        end if;

        return v_delivery_id;
      end if;
    end if;
  end loop;

  if v_delivery_id is null then
    insert into public.idea_box_deliveries (
      user_id,
      purchase_id,
      box_product_id,
      category_id,
      persona_id,
      status,
      allocation
    ) values (
      p_user_id,
      p_purchase_id,
      v_product.id,
      v_category_id,
      v_persona_id,
      'pending',
      v_product.allocation
    )
    returning id into v_delivery_id;
  else
    update public.idea_box_deliveries
    set user_id = p_user_id,
        box_product_id = v_product.id,
        category_id = v_category_id,
        persona_id = v_persona_id,
        status = 'pending',
        allocation = v_product.allocation,
        failure_reason = null,
        delivered_at = null
    where id = v_delivery_id;

    delete from public.idea_box_items
    where delivery_id = v_delivery_id;
  end if;

  for v_band in
    select unnest(array['low', 'mid', 'high']::public.score_band[])
  loop
    v_needed := coalesce((v_product.allocation ->> v_band::text)::integer, 0);

    for v_loop_index in 1..v_needed loop
      v_inventory_id := null;
      v_idea_id := null;

      select inv.id, inv.idea_id
      into v_inventory_id, v_idea_id
      from public.idea_inventory inv
      where inv.category_id = v_category_id
        and inv.persona_id = v_persona_id
        and inv.score_band = v_band
        and inv.status = 'available'
        and inv.reuse_count < inv.max_reuse_count
        and not exists (
          select 1
          from public.idea_box_items existing_item
          where existing_item.delivery_id = v_delivery_id
            and existing_item.inventory_id = inv.id
        )
      order by inv.reuse_count asc, inv.internal_rank_score desc, inv.published_at asc
      limit 1
      for update skip locked;

      if v_inventory_id is null then
        raise exception 'inventory changed during delivery for band %', v_band::text;
      end if;

      insert into public.idea_box_items (
        delivery_id,
        user_id,
        inventory_id,
        idea_id,
        slot_index,
        assigned_band
      ) values (
        v_delivery_id,
        p_user_id,
        v_inventory_id,
        v_idea_id,
        v_slot_index,
        v_band
      );

      update public.idea_inventory
      set reuse_count = reuse_count + 1,
          last_assigned_at = now(),
          status = case
            when reuse_count + 1 >= max_reuse_count then 'retired'::public.inventory_status
            else status
          end
      where id = v_inventory_id;

      v_slot_index := v_slot_index + 1;
    end loop;
  end loop;

  update public.idea_box_deliveries
  set status = 'delivered',
      delivered_at = now()
  where id = v_delivery_id;

  return v_delivery_id;
end;
$$;

revoke all on function public.inventory_health() from public, anon, authenticated;
grant execute on function public.inventory_health() to service_role;

revoke all on function public.deliver_idea_box(uuid, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.deliver_idea_box(uuid, text, text, text, uuid) to service_role;

grant usage on schema public to anon, authenticated, service_role;

grant select on public.categories to anon, authenticated;
grant select on public.creator_personas to anon, authenticated;

revoke all on public.box_products from public, anon, authenticated;
revoke all on public.purchases from public, anon, authenticated;
revoke all on public.checkout_sessions from public, anon, authenticated;
revoke all on public.idea_generation_batches from public, anon, authenticated;
revoke all on public.idea_import_errors from public, anon, authenticated;
revoke all on public.idea_inventory from public, anon, authenticated;
revoke all on public.idea_box_deliveries from public, anon, authenticated;
revoke all on public.idea_box_items from public, anon, authenticated;

grant select (
  id,
  slug,
  name,
  price_usd_cents,
  idea_count,
  enabled,
  metadata,
  created_at,
  updated_at
) on public.box_products to anon, authenticated;

grant select, insert, update, delete on public.creator_category_preferences to authenticated;
grant select (
  id,
  user_id,
  box_product_id,
  amount_usd_cents,
  currency,
  status,
  created_at,
  updated_at
) on public.purchases to authenticated;
grant select (
  id,
  user_id,
  box_product_id,
  purchase_id,
  status,
  checkout_url,
  created_at,
  updated_at
) on public.checkout_sessions to authenticated;
grant select (
  id,
  user_id,
  purchase_id,
  box_product_id,
  category_id,
  persona_id,
  status,
  delivered_at,
  created_at,
  updated_at
) on public.idea_box_deliveries to authenticated;
grant select (
  id,
  delivery_id,
  user_id,
  idea_id,
  slot_index,
  created_at
) on public.idea_box_items to authenticated;
grant select on public.idea_candidates to authenticated;
grant select on public.idea_cards to authenticated;
grant select on public.idea_scores to authenticated;

grant all on public.categories to service_role;
grant all on public.creator_personas to service_role;
grant all on public.creator_category_preferences to service_role;
grant all on public.box_products to service_role;
grant all on public.purchases to service_role;
grant all on public.checkout_sessions to service_role;
grant all on public.idea_generation_batches to service_role;
grant all on public.idea_import_errors to service_role;
grant all on public.idea_candidates to service_role;
grant all on public.idea_scores to service_role;
grant all on public.idea_cards to service_role;
grant all on public.idea_inventory to service_role;
grant all on public.idea_box_deliveries to service_role;
grant all on public.idea_box_items to service_role;
