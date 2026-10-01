-- ViralBox card generation and quality gate v2.2.
-- Provider credentials are intentionally represented by environment-variable names only.

alter table public.idea_quality_checks
  alter column semantic_duplicate_score drop not null,
  alter column semantic_duplicate_score drop default,
  alter column embedding_duplicate_score drop not null,
  alter column embedding_duplicate_score drop default,
  add column if not exists craft_score numeric(5,2) check (craft_score between 0 and 100),
  add column if not exists craft_scores jsonb not null default '{}'::jsonb,
  add column if not exists embedding_model text,
  add column if not exists embedding_model_version text,
  add column if not exists human_review_decision text
    check (human_review_decision in ('approve', 'refine', 'reject')),
  add column if not exists human_reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists human_reviewed_at timestamptz;

update public.idea_quality_checks
set semantic_duplicate_score = null,
    embedding_duplicate_score = null
where embedding_model is null or embedding_model_version is null;

comment on column public.idea_quality_checks.embedding_duplicate_score is
  'Null until a real sentence-transformer embedding comparison has run.';

comment on column public.idea_quality_checks.semantic_duplicate_score is
  'Null until a real semantic comparison has run; lexical similarity belongs in lexical_signature.';

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
  updated_at timestamptz not null default now(),
  constraint idea_model_profiles_safe_base_url_check check (
    base_url is null or (
      (base_url ~ '^https://' or base_url ~ '^http://(localhost|127\\\\.0\\\\.0\\\\.1|\\\\[::1\\\\])(?::[0-9]+)?(?:/|$)') and
      base_url !~ '://[^/]*@' and
      base_url !~* '[?&](api[_-]?key|key|token|secret|password|authorization)='
    )
  ),
  constraint idea_model_profiles_safe_features_check check (
    features::text !~* '"(api[_-]?key|secret|password|authorization|bearer[_-]?token|access[_-]?token)"\\\\s*:'
  )
);

comment on column public.idea_model_profiles.api_key_env_var is
  'Environment variable name only. Never store the secret value.';

create trigger idea_model_profiles_set_updated_at
before update on public.idea_model_profiles
for each row execute function public.set_updated_at();

create or replace function public.reset_model_profile_qualification_on_contract_change()
returns trigger
language plpgsql
as $$
begin
  if row(new.provider, new.protocol, new.model, new.base_url, new.api_key_env_var, new.features)
     is distinct from
     row(old.provider, old.protocol, old.model, old.base_url, old.api_key_env_var, old.features) then
    new.qualification_status := 'shadow';
    new.qualification_metrics := '{}'::jsonb;
  end if;
  return new;
end;
$$;

create trigger idea_model_profiles_reset_qualification
before update on public.idea_model_profiles
for each row execute function public.reset_model_profile_qualification_on_contract_change();

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

create table if not exists public.idea_model_qualification_evals (
  id uuid primary key default gen_random_uuid(),
  model_profile_id uuid not null references public.idea_model_profiles(id) on delete cascade,
  prompt_version text not null,
  schema_version integer not null default 2,
  brief_count integer not null check (brief_count >= 0),
  category_counts jsonb not null default '{}'::jsonb,
  generation_run_ids uuid[] not null default '{}',
  gold_rating_ids uuid[] not null default '{}',
  metrics jsonb not null,
  status text not null default 'completed' check (status in ('running', 'completed', 'invalid')),
  created_at timestamptz not null default now()
);

create index if not exists idea_model_qualification_evals_profile_idx
on public.idea_model_qualification_evals(model_profile_id, created_at desc);

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
on public.idea_card_gold_ratings(rater_id, idea_id);

create index if not exists idea_card_gold_ratings_lane_idx
on public.idea_card_gold_ratings(category_slug, persona_slug, platform, language);

create trigger idea_card_gold_ratings_set_updated_at
before update on public.idea_card_gold_ratings
for each row execute function public.set_updated_at();

alter table public.idea_card_feedback
  add column if not exists idea_id uuid references public.idea_candidates(id) on delete cascade,
  add column if not exists shot_status text;

update public.idea_card_feedback f
set idea_id = c.id
from public.idea_candidates c
where f.idea_id is null and f.card_id = c.id::text;

create table if not exists public.idea_card_feedback_duplicates_archive
(like public.idea_card_feedback including defaults including constraints);

alter table public.idea_card_feedback_duplicates_archive
  add column if not exists archived_at timestamptz not null default now();

insert into public.idea_card_feedback_duplicates_archive
select f.*, now()
from public.idea_card_feedback f
where f.idea_id is null or f.user_id is null;

delete from public.idea_card_feedback
where idea_id is null or user_id is null;

with ranked as (
  select id, row_number() over (
    partition by user_id, idea_id order by updated_at desc, created_at desc, id desc
  ) as duplicate_rank
  from public.idea_card_feedback
  where user_id is not null and idea_id is not null
)
insert into public.idea_card_feedback_duplicates_archive
select f.*, now()
from public.idea_card_feedback f
join ranked r on r.id = f.id
where r.duplicate_rank > 1;

with ranked as (
  select id, row_number() over (
    partition by user_id, idea_id order by updated_at desc, created_at desc, id desc
  ) as duplicate_rank
  from public.idea_card_feedback
  where user_id is not null and idea_id is not null
)
delete from public.idea_card_feedback f
using ranked r
where r.id = f.id and r.duplicate_rank > 1;

update public.idea_card_feedback
set shot_status = case when was_shot then 'shot' else 'planned' end
where shot_status is null;

update public.idea_card_feedback
set rating = null
where shot_status <> 'shot';

alter table public.idea_card_feedback
  alter column idea_id set not null,
  alter column user_id set not null,
  alter column shot_status set default 'planned',
  alter column shot_status set not null,
  add constraint idea_card_feedback_shot_status_check
    check (shot_status in ('shot', 'planned', 'skipped')),
  add constraint idea_card_feedback_shot_consistency_check
    check (was_shot = (shot_status = 'shot')),
  add constraint idea_card_feedback_rating_requires_shot_check
    check (shot_status = 'shot' or rating is null),
  add constraint idea_card_feedback_card_identity_check
    check (card_id = idea_id::text);

create unique index if not exists idea_card_feedback_user_idea_uidx
on public.idea_card_feedback(user_id, idea_id);

drop policy if exists "Users can submit own card feedback" on public.idea_card_feedback;
create policy "Users can submit delivered card feedback"
  on public.idea_card_feedback
  for insert
  with check (
    auth.uid() = user_id and
    card_id = idea_id::text and
    exists (
      select 1 from public.idea_box_items item
      where item.user_id = auth.uid() and item.idea_id = idea_card_feedback.idea_id
    )
  );

drop policy if exists "Users can update own card feedback" on public.idea_card_feedback;
create policy "Users can update own card feedback"
  on public.idea_card_feedback
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id and
    card_id = idea_id::text and
    exists (
      select 1 from public.idea_box_items item
      where item.user_id = auth.uid() and item.idea_id = idea_card_feedback.idea_id
    )
  );

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
alter table public.idea_model_qualification_evals enable row level security;
alter table public.idea_card_gold_ratings enable row level security;

revoke all privileges on public.idea_model_profiles from public, anon, authenticated;
revoke all privileges on public.idea_generation_runs from public, anon, authenticated;
revoke all privileges on public.idea_model_qualification_evals from public, anon, authenticated;
revoke all privileges on public.idea_card_gold_ratings from public, anon, authenticated;
revoke all privileges on public.idea_creator_feedback_lane_summary from public, anon, authenticated;

grant all privileges on public.idea_model_profiles to service_role;
grant all privileges on public.idea_generation_runs to service_role;
grant all privileges on public.idea_model_qualification_evals to service_role;
grant all privileges on public.idea_card_gold_ratings to service_role;
grant select on public.idea_creator_feedback_lane_summary to service_role;

alter table public.idea_card_feedback_duplicates_archive enable row level security;
revoke all privileges on public.idea_card_feedback_duplicates_archive from public, anon, authenticated;
grant all privileges on public.idea_card_feedback_duplicates_archive to service_role;

create or replace function public.resolve_idea_quality_human_review(
  p_idea_id uuid,
  p_rater_id uuid,
  p_decision text
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_decision not in ('approve', 'refine', 'reject') then
    raise exception 'invalid human review decision';
  end if;

  update public.idea_quality_checks
  set human_review_decision = p_decision,
      human_reviewed_by = p_rater_id,
      human_reviewed_at = now()
  where idea_id = p_idea_id and decision = 'human_review_required';
  if not found then return false; end if;

  update public.idea_candidates
  set status = case p_decision
    when 'approve' then 'ready'::public.idea_status
    when 'refine' then 'needs_refinement'::public.idea_status
    else 'blocked'::public.idea_status
  end
  where id = p_idea_id and status = 'human_review_required';
  if not found then
    raise exception 'candidate is not awaiting human review';
  end if;
  return true;
end;
$$;

revoke all on function public.resolve_idea_quality_human_review(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.resolve_idea_quality_human_review(uuid, uuid, text) to service_role;

create or replace function public.qualify_idea_model_profile(p_profile_slug text, p_eval_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pass boolean;
  v_profile_id uuid;
  v_eval public.idea_model_qualification_evals%rowtype;
  v_metrics jsonb;
begin
  select id into v_profile_id
  from public.idea_model_profiles
  where profile_slug = p_profile_slug and enabled = true;
  if v_profile_id is null then raise exception 'enabled model profile not found: %', p_profile_slug; end if;

  select * into v_eval
  from public.idea_model_qualification_evals
  where id = p_eval_id and model_profile_id = v_profile_id and status = 'completed';
  if not found then raise exception 'completed qualification eval not found for profile: %', p_profile_slug; end if;
  v_metrics := v_eval.metrics;

  v_pass :=
    v_eval.prompt_version = 'idea-card-premium-v2.2.0' and
    v_eval.schema_version = 2 and
    v_eval.brief_count >= 250 and
    coalesce((v_eval.category_counts->>'beauty')::integer, 0) >= 50 and
    coalesce((v_eval.category_counts->>'entertainment_comedy')::integer, 0) >= 50 and
    coalesce((v_eval.category_counts->>'travel')::integer, 0) >= 50 and
    coalesce((v_eval.category_counts->>'fitness_wellness_safe')::integer, 0) >= 50 and
    coalesce((v_eval.category_counts->>'food')::integer, 0) >= 50 and
    coalesce((v_metrics->>'schema_pass_rate')::numeric, 0) >= 0.98 and
    coalesce((v_metrics->>'safe_approve_rate')::numeric, 0) >= 0.55 and
    coalesce((v_metrics->>'approved_average')::numeric, 0) >= 88 and
    coalesce((v_metrics->>'duplicate_rate_078')::numeric, 1) <= 0.05 and
    coalesce((v_metrics->>'banned_residue_rate')::numeric, 1) <= 0.01 and
    coalesce((v_metrics->>'gold_gate_agreement')::numeric, 0) >= 0.85 and
    coalesce((v_metrics->>'human_rank_spearman')::numeric, 0) >= 0.60;

  update public.idea_model_profiles
  set qualification_status = case when v_pass then 'approved' else 'shadow' end,
      qualification_metrics = v_metrics || jsonb_build_object('qualification_eval_id', p_eval_id),
      updated_at = now()
  where id = v_profile_id;
  return jsonb_build_object('profile_slug', p_profile_slug, 'qualified', v_pass, 'status', case when v_pass then 'approved' else 'shadow' end);
end;
$$;

revoke all on function public.qualify_idea_model_profile(text, uuid) from public, anon, authenticated;
grant execute on function public.qualify_idea_model_profile(text, uuid) to service_role;

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