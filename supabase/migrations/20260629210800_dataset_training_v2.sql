alter table public.viral_training_example_features
  drop constraint if exists viral_training_example_features_pkey;

alter table public.viral_training_example_features
  add constraint viral_training_example_features_pkey primary key (example_id, training_version);

create table public.dataset_training_observations (
  id uuid primary key default gen_random_uuid(),
  content_hash text not null unique,
  source_path text not null,
  source_kind text not null check (source_kind in ('markdown', 'notebook', 'csv', 'csv_summary', 'unknown')),
  row_number integer,
  chunk_index integer,
  platform text not null default 'internet',
  category_slug text references public.categories(slug) on delete set null,
  locale text not null default 'GLOBAL',
  title_algorithmic text,
  text_signals jsonb not null default '{}'::jsonb,
  metric_signals jsonb not null default '{}'::jsonb,
  derived_pattern_ids text[] not null default '{}',
  named_entity_refs text[] not null default '{}',
  training_weight numeric(8,4) not null default 0 check (training_weight >= 0 and training_weight <= 1),
  copy_risk text not null default 'medium' check (copy_risk in ('low', 'medium', 'high')),
  risk_level public.viral_training_risk_level not null default 'low',
  training_use text not null default 'pattern_only' check (training_use in ('pattern_only', 'negative_example', 'eval_only', 'trend_signal_only', 'category_discovery')),
  quarantine_reason text,
  metadata jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dataset_training_observations_scope_idx
on public.dataset_training_observations(platform, category_slug, training_use, training_weight desc);

create index dataset_training_observations_patterns_idx
on public.dataset_training_observations using gin (derived_pattern_ids);

create index dataset_training_observations_entities_idx
on public.dataset_training_observations using gin (named_entity_refs);

create index dataset_training_observations_source_idx
on public.dataset_training_observations(source_path, row_number, chunk_index);

create table public.dataset_named_entity_provenance (
  id uuid primary key default gen_random_uuid(),
  entity_ref text not null unique,
  entity_type text not null check (entity_type in ('creator', 'celebrity', 'channel', 'brand', 'public_figure', 'unknown')),
  entity_hash text not null,
  source_path text not null,
  category_slug text references public.categories(slug) on delete set null,
  platform text not null default 'internet',
  viral_context text,
  training_policy text not null default 'internal_provenance_only',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dataset_named_entity_provenance_scope_idx
on public.dataset_named_entity_provenance(entity_type, category_slug, platform);

create table public.dataset_category_candidates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  source_path text not null,
  source_count integer not null default 1 check (source_count > 0),
  risk_level public.viral_training_risk_level not null default 'low',
  status text not null default 'approved' check (status in ('candidate', 'approved', 'rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slug = lower(slug)),
  check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$')
);

create trigger dataset_training_observations_set_updated_at
before update on public.dataset_training_observations
for each row execute function public.set_updated_at();

create trigger dataset_named_entity_provenance_set_updated_at
before update on public.dataset_named_entity_provenance
for each row execute function public.set_updated_at();

create trigger dataset_category_candidates_set_updated_at
before update on public.dataset_category_candidates
for each row execute function public.set_updated_at();

alter table public.dataset_training_observations enable row level security;
alter table public.dataset_named_entity_provenance enable row level security;
alter table public.dataset_category_candidates enable row level security;

revoke all privileges on public.dataset_training_observations from public, anon, authenticated;
revoke all privileges on public.dataset_named_entity_provenance from public, anon, authenticated;
revoke all privileges on public.dataset_category_candidates from public, anon, authenticated;

grant all privileges on public.dataset_training_observations to service_role;
grant all privileges on public.dataset_named_entity_provenance to service_role;
grant all privileges on public.dataset_category_candidates to service_role;
