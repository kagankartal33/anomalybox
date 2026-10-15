create table public.viral_training_compilations (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  example_count integer not null check (example_count >= 0),
  pattern_count integer not null check (pattern_count >= 0),
  source_count integer not null check (source_count >= 0),
  real_example_count integer not null check (real_example_count >= 0),
  quality_report jsonb not null default '{}'::jsonb,
  pattern_distribution jsonb not null default '{}'::jsonb,
  category_distribution jsonb not null default '{}'::jsonb,
  platform_distribution jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.viral_training_example_features (
  example_id uuid primary key references public.viral_training_examples(id) on delete cascade,
  training_version text not null,
  derived_pattern_ids text[] not null default '{}',
  quality_vector jsonb not null default '{}'::jsonb,
  generator_fit jsonb not null default '{}'::jsonb,
  risk_flags text[] not null default '{}',
  compiled_at timestamptz not null default now(),
  check (cardinality(derived_pattern_ids) > 0),
  check (training_version = lower(training_version)),
  check (training_version ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.viral_training_pattern_affinity (
  compilation_id uuid not null references public.viral_training_compilations(id) on delete cascade,
  pattern_id text not null references public.viral_pattern_rules(id) on delete cascade,
  category_slug text not null references public.categories(slug) on delete cascade,
  platform text not null,
  example_count integer not null check (example_count > 0),
  signal_weight numeric(8,4) not null check (signal_weight >= 0 and signal_weight <= 1),
  quality_vector jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (compilation_id, pattern_id, category_slug, platform),
  check (platform = lower(platform)),
  check (platform ~ '^[a-z0-9]+(_[a-z0-9]+)*$')
);

create index viral_training_compilations_active_idx
on public.viral_training_compilations(active, created_at desc);

create index viral_training_example_features_patterns_idx
on public.viral_training_example_features using gin (derived_pattern_ids);

create index viral_training_example_features_risk_flags_idx
on public.viral_training_example_features using gin (risk_flags);

create index viral_training_pattern_affinity_scope_idx
on public.viral_training_pattern_affinity(category_slug, platform, signal_weight desc);

create index viral_training_pattern_affinity_pattern_idx
on public.viral_training_pattern_affinity(pattern_id, signal_weight desc);

create trigger viral_training_compilations_set_updated_at
before update on public.viral_training_compilations
for each row execute function public.set_updated_at();

create or replace function public.training_profile_for_scope(
  p_category_slug text,
  p_platform text default 'instagram_reels',
  p_limit integer default 12
)
returns table (
  pattern_id text,
  pattern_name text,
  pattern_family text,
  signal_weight numeric,
  example_count integer,
  quality_vector jsonb
)
language sql
security invoker
set search_path = public, pg_temp
as $$
  with active_affinity as (
    select
      affinity.pattern_id,
      rule.name as pattern_name,
      rule.family as pattern_family,
      affinity.category_slug,
      affinity.platform,
      affinity.signal_weight,
      affinity.example_count,
      affinity.quality_vector
    from public.viral_training_pattern_affinity affinity
    join public.viral_training_compilations compilation
      on compilation.id = affinity.compilation_id
    join public.viral_pattern_rules rule
      on rule.id = affinity.pattern_id
    where compilation.active = true
      and rule.enabled = true
      and affinity.platform in (p_platform, 'internet')
  ),
  exact_scope as (
    select
      active_affinity.pattern_id,
      active_affinity.pattern_name,
      active_affinity.pattern_family,
      active_affinity.signal_weight,
      active_affinity.example_count,
      active_affinity.quality_vector || jsonb_build_object('scope', 'exact_category') as quality_vector,
      0 as scope_rank
    from active_affinity
    where active_affinity.category_slug = p_category_slug
  ),
  global_fallback as (
    select
      active_affinity.pattern_id,
      max(active_affinity.pattern_name) as pattern_name,
      max(active_affinity.pattern_family) as pattern_family,
      round((avg(active_affinity.signal_weight) * 0.92)::numeric, 4) as signal_weight,
      sum(active_affinity.example_count)::integer as example_count,
      jsonb_build_object(
        'scope', 'global_platform_fallback',
        'avg_signal_weight', round(avg(active_affinity.signal_weight)::numeric, 4),
        'source_affinity_rows', count(*),
        'source_categories', jsonb_agg(distinct active_affinity.category_slug),
        'creator_visible', false
      ) as quality_vector,
      1 as scope_rank
    from active_affinity
    group by active_affinity.pattern_id
  ),
  ranked as (
    select
      scoped.*,
      row_number() over (
        partition by scoped.pattern_id
        order by scoped.scope_rank, scoped.signal_weight desc, scoped.example_count desc
      ) as pattern_rank
    from (
      select * from exact_scope
      union all
      select * from global_fallback
    ) scoped
  )
  select
    ranked.pattern_id,
    ranked.pattern_name,
    ranked.pattern_family,
    ranked.signal_weight,
    ranked.example_count,
    ranked.quality_vector
  from ranked
  where ranked.pattern_rank = 1
  order by
    ranked.scope_rank,
    ranked.signal_weight desc,
    ranked.example_count desc,
    ranked.pattern_id
  limit greatest(1, least(coalesce(p_limit, 12), 50));
$$;

alter table public.viral_training_compilations enable row level security;
alter table public.viral_training_example_features enable row level security;
alter table public.viral_training_pattern_affinity enable row level security;

revoke all on public.viral_training_compilations from public, anon, authenticated;
revoke all on public.viral_training_example_features from public, anon, authenticated;
revoke all on public.viral_training_pattern_affinity from public, anon, authenticated;

grant all on public.viral_training_compilations to service_role;
grant all on public.viral_training_example_features to service_role;
grant all on public.viral_training_pattern_affinity to service_role;

revoke all on function public.training_profile_for_scope(text, text, integer) from public, anon, authenticated;
grant execute on function public.training_profile_for_scope(text, text, integer) to service_role;
