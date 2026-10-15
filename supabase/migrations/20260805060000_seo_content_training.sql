-- SEO Content Training tables
-- Extends the ViralBox training infrastructure with SEO-specific knowledge layers.
-- This migration creates 5 new tables for SEO content training data.

-- ============================================================================
-- 1. SEO Training Observations (kitaplardan çıkarılan SEO bilgi chunk'ları)
-- ============================================================================
create table if not exists public.seo_training_observations (
  id uuid primary key default gen_random_uuid(),
  content_hash text not null unique,
  source_book text not null,
  source_chapter text,
  source_page integer,
  seo_layer text not null check (seo_layer in (
    'on_page_seo', 'technical_seo', 'content_strategy', 'keyword_research',
    'link_building', 'content_writing', 'seo_analytics', 'local_seo',
    'ecommerce_seo', 'answer_engine_optimization', 'general_seo'
  )),
  category_slug text,
  locale text not null default 'en',
  title_algorithmic text,
  text_signals jsonb not null default '{}'::jsonb,
  metric_signals jsonb not null default '{}'::jsonb,
  derived_concepts text[] not null default '{}',
  training_weight numeric(8,4) not null default 0.5
    check (training_weight >= 0 and training_weight <= 1),
  training_use text not null default 'pattern_only'
    check (training_use in ('pattern_only', 'negative_example', 'eval_only')),
  risk_level public.viral_training_risk_level not null default 'low',
  metadata jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. SEO Glossary (terim sözlüğü — hızlı lookup)
-- ============================================================================
create table if not exists public.seo_glossary (
  id uuid primary key default gen_random_uuid(),
  term text not null unique,
  definition text not null,
  category text not null,
  importance text not null default 'Medium'
    check (importance in ('High', 'Medium', 'Low')),
  related_terms text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 3. SEO Q&A Bank (soru-cevap bilgi bankası)
-- ============================================================================
create table if not exists public.seo_qa_bank (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  keywords text[] not null default '{}',
  source_url text,
  seo_layer text,
  training_weight numeric(8,4) not null default 0.5
    check (training_weight >= 0 and training_weight <= 1),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 4. SEO Content Rules (generator'ın kullanacağı yazım kuralları)
-- ============================================================================
create table if not exists public.seo_content_rules (
  id text primary key,
  rule_name text not null,
  seo_layer text not null,
  rule_text text not null,
  when_to_apply text[] not null default '{}',
  avoid_when text[] not null default '{}',
  examples jsonb not null default '[]'::jsonb,
  priority integer not null default 50
    check (priority >= 1 and priority <= 100),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (id ~ '^SCR-[0-9]{3}$')
);

-- ============================================================================
-- 5. SEO Training Compilations (versiyonlama)
-- ============================================================================
create table if not exists public.seo_training_compilations (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  observation_count integer not null default 0
    check (observation_count >= 0),
  glossary_count integer not null default 0
    check (glossary_count >= 0),
  qa_count integer not null default 0
    check (qa_count >= 0),
  rule_count integer not null default 0
    check (rule_count >= 0),
  layer_distribution jsonb not null default '{}'::jsonb,
  source_distribution jsonb not null default '{}'::jsonb,
  quality_report jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================
create index if not exists seo_training_obs_layer_idx
  on public.seo_training_observations(seo_layer, training_weight desc);
create index if not exists seo_training_obs_book_idx
  on public.seo_training_observations(source_book);
create index if not exists seo_training_obs_concepts_idx
  on public.seo_training_observations using gin (derived_concepts);
create index if not exists seo_training_obs_use_idx
  on public.seo_training_observations(training_use, risk_level);

create index if not exists seo_glossary_category_idx
  on public.seo_glossary(category);
create index if not exists seo_glossary_importance_idx
  on public.seo_glossary(importance);

create index if not exists seo_qa_bank_layer_idx
  on public.seo_qa_bank(seo_layer);
create index if not exists seo_qa_bank_weight_idx
  on public.seo_qa_bank(training_weight desc);

create index if not exists seo_content_rules_layer_idx
  on public.seo_content_rules(seo_layer, enabled, priority desc);

create index if not exists seo_training_compilations_active_idx
  on public.seo_training_compilations(active, created_at desc);

-- ============================================================================
-- Triggers (updated_at)
-- ============================================================================
drop trigger if exists seo_training_observations_set_updated_at on public.seo_training_observations;
create trigger seo_training_observations_set_updated_at
  before update on public.seo_training_observations
  for each row execute function public.set_updated_at();

drop trigger if exists seo_content_rules_set_updated_at on public.seo_content_rules;
create trigger seo_content_rules_set_updated_at
  before update on public.seo_content_rules
  for each row execute function public.set_updated_at();

drop trigger if exists seo_training_compilations_set_updated_at on public.seo_training_compilations;
create trigger seo_training_compilations_set_updated_at
  before update on public.seo_training_compilations
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS & Grants (service_role only — no public access)
-- ============================================================================
alter table public.seo_training_observations enable row level security;
alter table public.seo_glossary enable row level security;
alter table public.seo_qa_bank enable row level security;
alter table public.seo_content_rules enable row level security;
alter table public.seo_training_compilations enable row level security;

revoke all on public.seo_training_observations from public, anon, authenticated;
revoke all on public.seo_glossary from public, anon, authenticated;
revoke all on public.seo_qa_bank from public, anon, authenticated;
revoke all on public.seo_content_rules from public, anon, authenticated;
revoke all on public.seo_training_compilations from public, anon, authenticated;

grant all on public.seo_training_observations to service_role;
grant all on public.seo_glossary to service_role;
grant all on public.seo_qa_bank to service_role;
grant all on public.seo_content_rules to service_role;
grant all on public.seo_training_compilations to service_role;

-- ============================================================================
-- Query function: seo_content_profile_for_layer
-- Returns relevant SEO rules + glossary terms + Q&A for a given SEO layer.
-- Used by the content generator pipeline.
-- ============================================================================
create or replace function public.seo_content_profile_for_layer(
  p_seo_layer text default null,
  p_locale text default 'en',
  p_rule_limit integer default 20,
  p_glossary_limit integer default 30,
  p_qa_limit integer default 10
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_rules jsonb;
  v_glossary jsonb;
  v_qa jsonb;
  v_obs_stats jsonb;
begin
  -- Gather applicable rules
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'rule_name', r.rule_name,
      'seo_layer', r.seo_layer,
      'rule_text', r.rule_text,
      'when_to_apply', r.when_to_apply,
      'avoid_when', r.avoid_when,
      'examples', r.examples,
      'priority', r.priority
    ) order by r.priority desc
  ), '[]'::jsonb) into v_rules
  from (
    select *
    from public.seo_content_rules
    where enabled = true
      and (p_seo_layer is null or seo_layer = p_seo_layer)
    order by priority desc
    limit greatest(1, least(coalesce(p_rule_limit, 20), 50))
  ) r;

  -- Gather glossary terms relevant to the layer
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'term', g.term,
      'definition', g.definition,
      'category', g.category,
      'importance', g.importance,
      'related_terms', g.related_terms
    ) order by
      case g.importance when 'High' then 1 when 'Medium' then 2 else 3 end
  ), '[]'::jsonb) into v_glossary
  from (
    select *
    from public.seo_glossary
    where p_seo_layer is null
       or lower(category) like '%' || replace(p_seo_layer, '_', ' ') || '%'
       or lower(category) like '%' || replace(p_seo_layer, '_', '%') || '%'
    order by
      case importance when 'High' then 1 when 'Medium' then 2 else 3 end
    limit greatest(1, least(coalesce(p_glossary_limit, 30), 100))
  ) g;

  -- Gather Q&A pairs
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'question', q.question,
      'answer', q.answer,
      'keywords', q.keywords,
      'training_weight', q.training_weight
    ) order by q.training_weight desc
  ), '[]'::jsonb) into v_qa
  from (
    select *
    from public.seo_qa_bank
    where p_seo_layer is null or seo_layer = p_seo_layer
    order by training_weight desc
    limit greatest(1, least(coalesce(p_qa_limit, 10), 50))
  ) q;

  -- Observation stats per layer
  select coalesce(jsonb_object_agg(
    obs.seo_layer,
    jsonb_build_object(
      'count', obs.cnt,
      'avg_weight', obs.avg_w,
      'top_concepts', obs.top_concepts
    )
  ), '{}'::jsonb) into v_obs_stats
  from (
    select
      o.seo_layer,
      count(*) as cnt,
      round(avg(o.training_weight)::numeric, 4) as avg_w,
      (
        select coalesce(jsonb_agg(c), '[]'::jsonb)
        from (
          select unnest(o2.derived_concepts) as c
          from public.seo_training_observations o2
          where o2.seo_layer = o.seo_layer
          group by c
          order by count(*) desc
          limit 10
        ) sub
      ) as top_concepts
    from public.seo_training_observations o
    where p_seo_layer is null or o.seo_layer = p_seo_layer
    group by o.seo_layer
  ) obs;

  return jsonb_build_object(
    'seo_layer', coalesce(p_seo_layer, 'all'),
    'locale', p_locale,
    'rules', v_rules,
    'glossary', v_glossary,
    'qa_pairs', v_qa,
    'observation_stats', v_obs_stats,
    'generated_at', now()
  );
end;
$$;

revoke all on function public.seo_content_profile_for_layer(text, text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.seo_content_profile_for_layer(text, text, integer, integer, integer)
  to service_role;
