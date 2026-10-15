create type public.viral_training_risk_level as enum (
  'low',
  'medium',
  'restricted'
);

create table public.viral_training_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  source_type text not null check (source_type in ('local_markdown', 'external_research', 'admin_note')),
  uri text,
  coverage_start_year integer check (coverage_start_year between 1990 and 2100),
  coverage_end_year integer check (coverage_end_year between 1990 and 2100),
  reliability_notes text,
  metadata jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slug = lower(slug)),
  check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$')
);

create table public.viral_training_examples (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.viral_training_sources(id) on delete cascade,
  external_ref text,
  year integer not null check (year between 1990 and 2100),
  platform text not null,
  category_slug text references public.categories(slug) on delete set null,
  title text not null,
  phenomenon_type text not null check (
    phenomenon_type in (
      'challenge',
      'meme',
      'platform_shift',
      'marketing_case',
      'ai_format',
      'social_movement',
      'commerce_format',
      'localization_case'
    )
  ),
  abstracted_mechanism text not null,
  reusable_pattern text not null,
  participation_mode text,
  emotional_triggers text[] not null default '{}',
  format_signals text[] not null default '{}',
  safety_risks text[] not null default '{}',
  copy_risk text not null default 'medium' check (copy_risk in ('low', 'medium', 'high')),
  training_use text not null default 'pattern_only' check (training_use in ('pattern_only', 'negative_example', 'eval_only')),
  risk_level public.viral_training_risk_level not null default 'low',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_ref)
);

create table public.viral_pattern_rules (
  id text primary key,
  name text not null,
  family text not null,
  pattern_formula text not null,
  when_to_use text[] not null default '{}',
  avoid_when text[] not null default '{}',
  required_safety_checks text[] not null default '{}',
  scoring_signals jsonb not null default '{}'::jsonb,
  generator_instructions text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (id = upper(id)),
  check (id ~ '^VTP-[0-9]{3}$')
);

create table public.generator_eval_cases (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category_slug text references public.categories(slug) on delete set null,
  persona_slug text references public.creator_personas(slug) on delete set null,
  input_brief jsonb not null,
  expected_patterns text[] not null default '{}',
  forbidden_patterns text[] not null default '{}',
  quality_rubric jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slug = lower(slug)),
  check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$')
);

create index viral_training_examples_year_idx on public.viral_training_examples(year);
create index viral_training_examples_platform_idx on public.viral_training_examples(platform);
create index viral_training_examples_category_idx on public.viral_training_examples(category_slug);
create index viral_training_examples_type_idx on public.viral_training_examples(phenomenon_type);
create index viral_pattern_rules_family_idx on public.viral_pattern_rules(family, enabled);
create index generator_eval_cases_enabled_idx on public.generator_eval_cases(enabled, category_slug, persona_slug);

create trigger viral_training_sources_set_updated_at
before update on public.viral_training_sources
for each row execute function public.set_updated_at();

create trigger viral_training_examples_set_updated_at
before update on public.viral_training_examples
for each row execute function public.set_updated_at();

create trigger viral_pattern_rules_set_updated_at
before update on public.viral_pattern_rules
for each row execute function public.set_updated_at();

create trigger generator_eval_cases_set_updated_at
before update on public.generator_eval_cases
for each row execute function public.set_updated_at();

alter table public.viral_training_sources enable row level security;
alter table public.viral_training_examples enable row level security;
alter table public.viral_pattern_rules enable row level security;
alter table public.generator_eval_cases enable row level security;

revoke all on public.viral_training_sources from anon, authenticated;
revoke all on public.viral_training_examples from anon, authenticated;
revoke all on public.viral_pattern_rules from anon, authenticated;
revoke all on public.generator_eval_cases from anon, authenticated;

grant all on public.viral_training_sources to service_role;
grant all on public.viral_training_examples to service_role;
grant all on public.viral_pattern_rules to service_role;
grant all on public.generator_eval_cases to service_role;
