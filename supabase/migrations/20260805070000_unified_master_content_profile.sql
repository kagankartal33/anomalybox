-- ============================================================================
-- UNIFIED MASTER CONTENT PROFILE FUNCTION
-- Combines ALL local & external dataset trainings (SEO, AEO 2026, Humor,
-- Creator Personas, Cinematography, Viral Hooks, Anti-AI Detector Humanization)
-- into a single comprehensive prompt profile for 100% original content writing.
-- ============================================================================

create or replace function public.unified_master_content_profile(
  p_seo_layer text default null,
  p_locale text default 'tr',
  p_rule_limit integer default 25,
  p_observation_limit integer default 15,
  p_glossary_limit integer default 20
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
  v_top_observations jsonb;
  v_humanization_directives jsonb;
begin
  -- 1. Gather Top SEO & AEO Rules across layers
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'rule_name', r.rule_name,
      'seo_layer', r.seo_layer,
      'rule_text', r.rule_text,
      'examples', r.examples,
      'priority', r.priority
    ) order by r.priority desc
  ), '[]'::jsonb) into v_rules
  from (
    select *
    from public.seo_content_rules
    where enabled = true
      and (p_seo_layer is null or seo_layer = p_seo_layer or seo_layer = 'answer_engine_optimization')
    order by priority desc
    limit greatest(1, least(coalesce(p_rule_limit, 25), 60))
  ) r;

  -- 2. Gather Top Observation Chunks from Comedy, Personas, Viral Hooks, Film & SEO
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'source', obs.source_book,
      'category', obs.category_slug,
      'layer', obs.seo_layer,
      'text', obs.text_signals->>'abstract_text',
      'weight', obs.training_weight
    ) order by obs.training_weight desc
  ), '[]'::jsonb) into v_top_observations
  from (
    select *
    from public.seo_training_observations
    where (p_seo_layer is null or seo_layer = p_seo_layer or category_slug in ('comedy_and_humor', 'influencer_personas', 'viral_algorithm', 'ai_search_optimization'))
    order by training_weight desc
    limit greatest(1, least(coalesce(p_observation_limit, 15), 50))
  ) obs;

  -- 3. Gather High-Importance Glossary Terms
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'term', g.term,
      'definition', g.definition,
      'category', g.category
    ) order by case g.importance when 'High' then 1 else 2 end
  ), '[]'::jsonb) into v_glossary
  from (
    select *
    from public.seo_glossary
    order by case importance when 'High' then 1 else 2 end
    limit greatest(1, least(coalesce(p_glossary_limit, 20), 50))
  ) g;

  -- 4. Anti-AI Detector & Humanization Rules
  v_humanization_directives := jsonb_build_object(
    'burstiness', 'Mix very short sentences with longer compound sentences for human rhythm.',
    'perplexity', 'Use varied, specific vocabulary; avoid repetitive AI transition words.',
    'forbidden_cliches', array[
      'in today''s digital world', 'delve into', 'tapestry of', 'testament to',
      'furthermore', 'moreover', 'in conclusion', 'lütfen unutmayın ki', 'günümüz dijital dünyasında'
    ],
    'originality_requirement', 'Must contain first-hand experience indicators, specific numbers, or concrete case studies.'
  );

  return jsonb_build_object(
    'profile_type', 'UNIFIED_FULL_STACK_TRAINING',
    'requested_layer', coalesce(p_seo_layer, 'ALL_COMBINED'),
    'locale', p_locale,
    'seo_and_aeo_rules', v_rules,
    'top_multi_domain_observations', v_top_observations,
    'glossary_reference', v_glossary,
    'humanization_directives', v_humanization_directives,
    'generated_at', now()
  );
end;
$$;

revoke all on function public.unified_master_content_profile(text, text, integer, integer, integer) from public;
grant execute on function public.unified_master_content_profile(text, text, integer, integer, integer) to anon, authenticated, service_role;
