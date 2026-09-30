-- ViralBox card generation and quality gate v2.2.
-- Provider credentials are intentionally represented by environment-variable names only.

alter table public.idea_quality_checks
  alter column embedding_duplicate_score drop not null,
  alter column embedding_duplicate_score drop default,
  add column if not exists craft_score numeric(5,2) check (craft_score between 0 and 100),
  add column if not exists craft_scores jsonb not null default '{}'::jsonb,
  add column if not exists embedding_model text,
  add column if not exists embedding_model_version text;

comment on column public.idea_quality_checks.embedding_duplicate_score is
  'Null until a real sentence-transformer embedding comparison has run.';

create table if not exists public.idea_model_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_slug text not null unique check (profile_slug ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  provider text not null,
  protocol text not null check (protocol in ('openai_compatible', 'gemini', 'anthropic', 'json_text')),
  model text not null,
  base_url text,
  api_key_env_var text not null check (api_key_env_var ~ '^[A-Z][A-Z0-9_]{2,127}$'),
  timeout_ms integer not null default 45000 check (timeout_ms between 1000 and 120000),
  features jsonb not null default '{}'::jsonb,
  qualification_status text not null default 'shadow'
    check (qualification_status in ('shadow', 'approved', 'blocked')),
  qualification_metrics jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.idea_model_profiles.api_key_env_var is
  'Environment variable name only. Never store the secret value.';

create trigger idea_model_profiles_set_updated_at
before update on public.idea_model_profiles
for each row execute function public.set_updated_at();

create table if not exists public.idea_generation_runs (
  id uuid primary key default gen_random_uuid(),
  generation_batch_id uuid not null references public.idea_generation_batches(id) on delete cascade,
  model_profile_id uuid references public.idea_model_profiles(id) on delete set null,
  profile_slug text not null,
  provider text not null,
  protocol text not null,
  model text not null,
  prompt_version text not null,
  schema_version integer not null default 2,
  status text not null default 'running'
    check (status in ('running', 'completed', 'partial', 'failed')),
  shadow boolean not null default true,
  requested_count integer not null check (requested_count > 0),
  candidate_multiplier integer not null default 3 check (candidate_multiplier between 1 and 5),
  generated_count integer not null default 0,
  imported_count integer not null default 0,
  refine_count integer not null default 0,
  reject_count integer not null default 0,
  token_usage jsonb not null default '{}'::jsonb,
  latency_ms integer,
  gate_results jsonb not null default '{}'::jsonb,
  issue_counts jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idea_generation_runs_batch_idx
on public.idea_generation_runs(generation_batch_id, created_at desc);

create index if not exists idea_generation_runs_profile_idx
on public.idea_generation_runs(profile_slug, status, created_at desc);

create table if not exists public.idea_card_gold_ratings (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.idea_candidates(id) on delete set null,
  generation_run_id uuid references public.idea_generation_runs(id) on delete set null,
  rater_id uuid not null references public.profiles(id) on delete cascade,
  source text not null check (source in ('existing_stock', 'generated', 'manual', 'creator_escalation')),
  category_slug text not null,
  persona_slug text not null,
  platform text not null default 'instagram_reels',
  language text not null default 'en',
  provider text,
  model text,
  prompt_version text,
  card_snapshot jsonb not null,
  human_decision text not null check (human_decision in ('approve', 'refine', 'reject')),
  human_rank integer not null check (human_rank between 1 and 5),
  failure_codes text[] not null default '{}',
  notes text check (length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idea_card_gold_ratings_rater_idea_uidx
on public.idea_card_gold_ratings(rater_id, idea_id)
where idea_id is not null;

create index if not exists idea_card_gold_ratings_lane_idx
on public.idea_card_gold_ratings(category_slug, persona_slug, platform, language);

create trigger idea_card_gold_ratings_set_updated_at
before update on public.idea_card_gold_ratings
for each row execute function public.set_updated_at();

alter table public.idea_card_feedback
  add column if not exists idea_id uuid references public.idea_candidates(id) on delete cascade,
  add column if not exists shot_status text;

update public.idea_card_feedback
set shot_status = case when was_shot then 'shot' else 'planned' end
where shot_status is null;

alter table public.idea_card_feedback
  alter column shot_status set default 'planned',
  alter column shot_status set not null,
  add constraint idea_card_feedback_shot_status_check
    check (shot_status in ('shot', 'planned', 'skipped'));

create unique index if not exists idea_card_feedback_user_idea_uidx
on public.idea_card_feedback(user_id, idea_id)
where user_id is not null and idea_id is not null;

create or replace view public.idea_creator_feedback_lane_summary
with (security_invoker = true)
as
select
  c.category_id,
  c.persona_id,
  c.platform,
  c.language,
  count(*) filter (where f.shot_status = 'shot' and f.rating is not null) as shot_rating_count,
  avg(f.rating) filter (where f.shot_status = 'shot' and f.rating is not null) as average_shot_rating,
  case
    when count(*) filter (where f.shot_status = 'shot' and f.rating is not null) < 20 then 0::numeric
    else greatest(-5::numeric, least(5::numeric,
      (avg(f.rating) filter (where f.shot_status = 'shot' and f.rating is not null) - 3) * 2.5
    ))
  end as quality_adjustment
from public.idea_card_feedback f
join public.idea_candidates c on c.id = f.idea_id
group by c.category_id, c.persona_id, c.platform, c.language;

alter table public.idea_model_profiles enable row level security;
alter table public.idea_generation_runs enable row level security;
alter table public.idea_card_gold_ratings enable row level security;

revoke all privileges on public.idea_model_profiles from public, anon, authenticated;
revoke all privileges on public.idea_generation_runs from public, anon, authenticated;
revoke all privileges on public.idea_card_gold_ratings from public, anon, authenticated;
revoke all privileges on public.idea_creator_feedback_lane_summary from public, anon, authenticated;

grant all privileges on public.idea_model_profiles to service_role;
grant all privileges on public.idea_generation_runs to service_role;
grant all privileges on public.idea_card_gold_ratings to service_role;
grant select on public.idea_creator_feedback_lane_summary to service_role;

insert into public.admin_configs(namespace, version, config, enabled)
values (
  'quality.gate',
  '2.2.0',
  '{
    "version": "2.2.0",
    "approve_floor": 88,
    "refine_floor": 78,
    "fingerprint_reject": 0.92,
    "semantic_reject": 0.86,
    "semantic_human_review": 0.78,
    "feedback_min_shot_ratings": 20,
    "feedback_adjustment_cap": 5,
    "embedding_model": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    "embedding_dimension": 384
  }'::jsonb,
  true
)
on conflict (namespace, version) do update
set config = excluded.config, enabled = excluded.enabled;