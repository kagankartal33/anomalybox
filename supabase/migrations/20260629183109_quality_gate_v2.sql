create extension if not exists pg_trgm;

create type public.quality_gate_decision as enum (
  'approve',
  'refine',
  'reject',
  'human_review_required'
);

create table public.idea_quality_checks (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null unique references public.idea_candidates(id) on delete cascade,
  generation_batch_id uuid references public.idea_generation_batches(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  persona_id uuid references public.creator_personas(id) on delete set null,
  semantic_duplicate_score numeric(5,4) not null default 0 check (semantic_duplicate_score >= 0 and semantic_duplicate_score <= 1),
  duplicate_of_idea_id uuid references public.idea_candidates(id) on delete set null,
  safety_classifier jsonb not null default '{}'::jsonb,
  premium_completeness_score numeric(5,2) not null default 0 check (premium_completeness_score between 0 and 100),
  creator_fit_score numeric(5,2) not null default 0 check (creator_fit_score between 0 and 100),
  platform_fit_score numeric(5,2) not null default 0 check (platform_fit_score between 0 and 100),
  brand_safety_score numeric(5,2) not null default 0 check (brand_safety_score between 0 and 100),
  editorial_quality_score numeric(5,2) not null default 0 check (editorial_quality_score between 0 and 100),
  decision public.quality_gate_decision not null default 'refine',
  reasons text[] not null default '{}',
  evaluator_version text not null default 'quality-gate-v2.0.0',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idea_quality_checks_batch_decision_idx
on public.idea_quality_checks(generation_batch_id, decision, editorial_quality_score desc);

create index idea_quality_checks_category_persona_idx
on public.idea_quality_checks(category_id, persona_id, decision);

create index idea_quality_checks_duplicate_idx
on public.idea_quality_checks(semantic_duplicate_score desc)
where semantic_duplicate_score >= 0.78;

create trigger idea_quality_checks_set_updated_at
before update on public.idea_quality_checks
for each row execute function public.set_updated_at();

alter table public.idea_quality_checks enable row level security;

revoke all privileges on public.idea_quality_checks from public, anon, authenticated;
grant all privileges on public.idea_quality_checks to service_role;
