create extension if not exists pgcrypto;

create type public.idea_status as enum (
  'draft',
  'ready',
  'needs_refinement',
  'human_review_required',
  'blocked',
  'published',
  'archived'
);

create type public.review_decision as enum (
  'PASS',
  'REFINE',
  'HUMAN_REVIEW_REQUIRED',
  'BLOCK'
);

create type public.safety_status as enum (
  'SAFE',
  'NEEDS_REVIEW',
  'BLOCKED'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'creator' check (role in ('creator', 'admin')),
  plan text not null default 'free',
  locale text not null default 'tr-TR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  handle text,
  niche text,
  default_platforms text[] not null default '{}',
  production_capacity jsonb not null default '{}'::jsonb,
  voice_guidelines jsonb not null default '{}'::jsonb,
  constraints jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  tone jsonb not null default '{}'::jsonb,
  safety_rules jsonb not null default '{}'::jsonb,
  commercial_goals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audience_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  language text not null default 'tr',
  locale text not null default 'TR',
  needs jsonb not null default '[]'::jsonb,
  tensions jsonb not null default '[]'::jsonb,
  share_motives jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.algorithm_definitions (
  id text primary key,
  family text not null,
  name_tr text not null,
  name_en text,
  operator text not null,
  formula text,
  primary_triggers text[] not null default '{}',
  ideal_platforms text[] not null default '{}',
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'restricted')),
  evidence_requirement text not null default 'none' check (evidence_requirement in ('none', 'light', 'strong')),
  comedy_engine_tags text[] not null default '{}',
  prompt_template text,
  guardrails jsonb not null default '[]'::jsonb,
  definition jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_configs (
  id uuid primary key default gen_random_uuid(),
  namespace text not null,
  version text not null,
  config jsonb not null,
  enabled boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (namespace, version)
);

create table public.trend_signals (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  platform text not null,
  locale text not null default 'TR',
  signal text not null,
  metadata jsonb not null default '{}'::jsonb,
  freshness_score numeric(5,2) not null default 0,
  confidence_score numeric(5,2) not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.idea_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  creator_profile_id uuid references public.creator_profiles(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  audience_profile_id uuid references public.audience_profiles(id) on delete set null,
  platform text not null,
  format text not null,
  language text not null default 'tr',
  locale text not null default 'TR',
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
  safety_status public.safety_status not null default 'SAFE',
  perspective_prism_status public.review_decision not null default 'PASS',
  confidence_band text not null default 'MEDIUM',
  status public.idea_status not null default 'draft',
  decision_trace jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.idea_scores (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.idea_candidates(id) on delete cascade,
  viral_potential_score numeric(5,2) not null default 0,
  psychology_fit_score numeric(5,2) not null default 0,
  human_awareness_score numeric(5,2) not null default 0,
  feasibility_score numeric(5,2) not null default 0,
  novelty_score numeric(5,2) not null default 0,
  comedy_remix_fit numeric(5,2) not null default 0,
  demand_opportunity_score numeric(5,2) not null default 0,
  saturation_penalty numeric(5,2) not null default 0,
  trust_sustainability_score numeric(5,2) not null default 0,
  score_breakdown jsonb not null default '{}'::jsonb,
  config_version text,
  created_at timestamptz not null default now()
);

create table public.human_awareness_assessments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.idea_candidates(id) on delete cascade,
  human_moment_map jsonb not null default '{}'::jsonb,
  perspective_prism jsonb not null default '[]'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  decision public.review_decision not null default 'PASS',
  required_revisions jsonb not null default '[]'::jsonb,
  config_version text,
  created_at timestamptz not null default now()
);

create table public.idea_cards (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.idea_candidates(id) on delete cascade,
  title text not null,
  card jsonb not null,
  markdown text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idea_id)
);

create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  hypothesis text not null,
  target_metric text not null,
  status text not null default 'draft' check (status in ('draft', 'running', 'completed', 'stopped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experiment_variants (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  idea_id uuid references public.idea_candidates(id) on delete set null,
  label text not null,
  variant_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.performance_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  idea_id uuid references public.idea_candidates(id) on delete set null,
  platform text not null,
  published_at timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  qualitative_feedback jsonb not null default '{}'::jsonb,
  contextual_notes jsonb not null default '[]'::jsonb,
  data_source text not null default 'creator_manual',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idea_candidates_user_status_idx on public.idea_candidates(user_id, status, created_at desc);
create index idea_candidates_platform_idx on public.idea_candidates(platform, locale, created_at desc);
create index idea_scores_idea_idx on public.idea_scores(idea_id, created_at desc);
create index performance_events_user_platform_idx on public.performance_events(user_id, platform, created_at desc);
create index algorithm_definitions_enabled_idx on public.algorithm_definitions(enabled, family);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger creator_profiles_set_updated_at
before update on public.creator_profiles
for each row execute function public.set_updated_at();

create trigger brands_set_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

create trigger audience_profiles_set_updated_at
before update on public.audience_profiles
for each row execute function public.set_updated_at();

create trigger idea_candidates_set_updated_at
before update on public.idea_candidates
for each row execute function public.set_updated_at();

create trigger idea_cards_set_updated_at
before update on public.idea_cards
for each row execute function public.set_updated_at();

create trigger experiments_set_updated_at
before update on public.experiments
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.brands enable row level security;
alter table public.audience_profiles enable row level security;
alter table public.algorithm_definitions enable row level security;
alter table public.admin_configs enable row level security;
alter table public.trend_signals enable row level security;
alter table public.idea_candidates enable row level security;
alter table public.idea_scores enable row level security;
alter table public.human_awareness_assessments enable row level security;
alter table public.idea_cards enable row level security;
alter table public.experiments enable row level security;
alter table public.experiment_variants enable row level security;
alter table public.performance_events enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "creator_profiles_owner_all" on public.creator_profiles
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "brands_owner_all" on public.brands
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "audience_profiles_owner_all" on public.audience_profiles
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "algorithm_definitions_read_enabled" on public.algorithm_definitions
for select to anon, authenticated
using (enabled = true);

create policy "trend_signals_read" on public.trend_signals
for select to authenticated
using (true);

create policy "idea_candidates_owner_all" on public.idea_candidates
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "idea_scores_owner_select" on public.idea_scores
for select to authenticated
using (
  exists (
    select 1 from public.idea_candidates i
    where i.id = idea_scores.idea_id
      and i.user_id = (select auth.uid())
  )
);

create policy "human_awareness_owner_select" on public.human_awareness_assessments
for select to authenticated
using (
  exists (
    select 1 from public.idea_candidates i
    where i.id = human_awareness_assessments.idea_id
      and i.user_id = (select auth.uid())
  )
);

create policy "idea_cards_owner_select" on public.idea_cards
for select to authenticated
using (
  exists (
    select 1 from public.idea_candidates i
    where i.id = idea_cards.idea_id
      and i.user_id = (select auth.uid())
  )
);

create policy "experiments_owner_all" on public.experiments
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "experiment_variants_owner_select" on public.experiment_variants
for select to authenticated
using (
  exists (
    select 1 from public.experiments e
    where e.id = experiment_variants.experiment_id
      and e.user_id = (select auth.uid())
  )
);

create policy "performance_events_owner_all" on public.performance_events
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "audit_logs_owner_select" on public.audit_logs
for select to authenticated
using ((select auth.uid()) = user_id);
