-- Incremental V3.1.1 upgrade. Never rely on rerunning an already-applied V3 migration.
-- Every category must pass independently; a strong category cannot subsidize a failed one.
create or replace function public.automatic_qualification_metric_between(
  p_metrics jsonb, p_key text, p_min numeric, p_max numeric
) returns boolean language sql immutable set search_path = public as $$
  select case when jsonb_typeof(p_metrics->p_key) = 'number'
    then (p_metrics->>p_key)::numeric between p_min and p_max
    else false end
$$;

create or replace function public.automatic_qualification_quality_metrics_valid(
  p_metrics jsonb, p_expected_count integer
) returns boolean language sql immutable set search_path = public as $$
  select coalesce(
    public.automatic_qualification_metric_between(p_metrics, 'evaluated_count', p_expected_count, p_expected_count)
    and public.automatic_qualification_metric_between(p_metrics, 'schema_pass_rate', .99, 1)
    and public.automatic_qualification_metric_between(p_metrics, 'taxonomy_pass_rate', .99, 1)
    and public.automatic_qualification_metric_between(p_metrics, 'recipe_adherence_rate', .98, 1)
    and public.automatic_qualification_metric_between(p_metrics, 'safe_approve_rate', .55, 1)
    and public.automatic_qualification_metric_between(p_metrics, 'approved_average', 90, 100)
    and public.automatic_qualification_metric_between(p_metrics, 'duplicate_rate_078', 0, .03)
    and public.automatic_qualification_metric_between(p_metrics, 'banned_residue_rate', 0, .005)
    and public.automatic_qualification_metric_between(p_metrics, 'creator_residue_rate', 0, .005)
    and public.automatic_qualification_metric_between(p_metrics, 'duration_fit_rate', .95, 1)
    and public.automatic_qualification_metric_between(p_metrics, 'exact_duration_max_share', 0, .2)
    and public.automatic_qualification_metric_between(p_metrics, 'timing_template_duplicate_rate', 0, 0)
    and public.automatic_qualification_metric_between(p_metrics, 'approved_critic_pass_rate', 1, 1)
    and public.automatic_qualification_metric_between(p_metrics, 'approved_hook_first_frame_rate', 1, 1)
    and public.automatic_qualification_metric_between(p_metrics, 'approved_proof_payoff_rate', 1, 1)
    and p_metrics->'creative_distribution_passed' = 'true'::jsonb
    and public.automatic_qualification_metric_between(p_metrics, 'embedded_count', p_expected_count, p_expected_count)
    and public.automatic_qualification_metric_between(p_metrics, 'critic_record_count', p_expected_count, p_expected_count)
    and public.automatic_qualification_metric_between(p_metrics, 'current_gate_count', p_expected_count, p_expected_count)
    and public.automatic_qualification_metric_between(p_metrics, 'fresh_snapshot_count', p_expected_count, p_expected_count), false)
$$;

create or replace function public.automatic_qualification_categories_valid(p_metrics jsonb)
returns boolean language plpgsql immutable set search_path = public as $$
declare
  category_name text;
  category_metrics jsonb := p_metrics->'category_metrics';
begin
  if jsonb_typeof(category_metrics) is distinct from 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(category_metrics)) <> 12 then return false; end if;
  foreach category_name in array array[
    'beauty','fashion','commerce_affiliate','creator_education','entertainment_comedy','fitness_wellness_safe',
    'food','lifestyle','luxury','parenting_family','thought_leadership','travel'
  ] loop
    if not public.automatic_qualification_quality_metrics_valid(category_metrics->category_name, 50) then return false; end if;
  end loop;
  return true;
end $$;

create or replace function public.qualified_critic_matches(
  p_generator public.idea_model_profiles, p_critic public.idea_model_profiles
) returns boolean language sql stable set search_path = public as $$
  select coalesce(p_critic.enabled
    and (p_critic.provider <> p_generator.provider or p_critic.model <> p_generator.model)
    and p_critic.profile_slug = p_generator.features->>'critic_profile_slug'
    and p_generator.qualification_metrics->>'critic_profile_id' = p_critic.id::text
    and p_generator.qualification_metrics->'critic_snapshot' = public.idea_model_contract(p_critic), false)
$$;

-- Renaming or removing a critic changes the writer's alias binding even when its model is unchanged.
create or replace function public.invalidate_dependent_critic_qualifications() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    update public.idea_model_profiles set qualification_status = 'shadow', qualification_metrics = '{}'::jsonb,
      qualified_prompt_version = null, qualified_schema_version = null, qualified_quality_gate_version = null, qualification_eval_id = null
    where features->>'critic_profile_slug' = old.profile_slug and id <> old.id;
    return old;
  end if;
  if public.idea_model_contract(new) is distinct from public.idea_model_contract(old)
    or new.enabled is distinct from old.enabled or new.profile_slug is distinct from old.profile_slug then
    update public.idea_model_profiles set qualification_status = 'shadow', qualification_metrics = '{}'::jsonb,
      qualified_prompt_version = null, qualified_schema_version = null, qualified_quality_gate_version = null, qualification_eval_id = null
    where features->>'critic_profile_slug' in (old.profile_slug, new.profile_slug) and id <> new.id;
  end if;
  return new;
end $$;
drop trigger if exists idea_model_profiles_critic_invalidation on public.idea_model_profiles;
create trigger idea_model_profiles_critic_invalidation after update or delete on public.idea_model_profiles
for each row execute function public.invalidate_dependent_critic_qualifications();

create or replace function public.automatic_card_evidence_valid(p_idea_id uuid, p_require_approve boolean default true)
returns boolean language sql volatile security invoker set search_path = public as $$
  select coalesce((
    select
      c.card->>'schemaVersion' = '2'
      and q.evaluator_version = 'quality-gate-v3.0.0-automatic'
      and q.metadata->'card_snapshot' = (c.card - 'id' - 'one_sentence_premise')
      and q.metadata->>'card_hash' is not null
      and i.decision_trace->>'import_source' = 'verified_generation'
      and i.decision_trace#>>'{generation,taxonomy_version}' = 'creative-taxonomy-v1'
      and i.decision_trace#>>'{generation,pipeline_version}' = 'generation-pipeline-v3.1.1'
      and i.decision_trace#>>'{generation,scheduler_version}' = 'creative-scheduler-v2.1'
      and r.metadata->>'pipeline_version' = 'generation-pipeline-v3.1.1'
      and r.metadata->>'scheduler_version' = 'creative-scheduler-v2.1'
      and r.metadata->>'critic_profile_id' = critic.id::text
      and r.metadata->>'critic_profile_hash' = i.decision_trace#>>'{generation_gate,critic_verification,profile_hash}'
      and i.decision_trace#>>'{generation,creative_signature}' is not null
      and i.decision_trace#>>'{generation_gate,policy_version}' = 'automatic-card-policy-v3.1'
      and i.decision_trace#>>'{generation_gate,critic_verification,card_hash}' = q.metadata->>'card_hash'
      and i.decision_trace#>>'{generation_gate,critic_verification,independent}' = 'true'
      and i.decision_trace#>'{generation_gate,critic_verification,profile_snapshot}' = public.idea_model_contract(critic)
      and critic.enabled and (critic.provider <> generator.provider or critic.model <> generator.model)
      and generator.enabled and r.metadata->'generator_snapshot' = public.idea_model_contract(generator)
      and r.prompt_version = 'idea-card-premium-v3.0.0-automatic' and r.schema_version = 2
      and r.taxonomy_version = 'creative-taxonomy-v1' and r.status in ('completed', 'partial')
      and e.embedding is not null and e.source_text_hash = q.metadata->>'semantic_hash'
      and e.metadata->>'document_version' = 'card-semantic-v2'
      and e.metadata->>'comparison_scope' = 'global' and e.metadata->>'corpus_complete' = 'true'
      and e.metadata->>'corpus_revision' = corpus.revision
      and (e.metadata->>'corpus_count')::bigint = corpus.card_count
      and e.embedding_model = q.embedding_model and e.metadata->>'model_version' = q.embedding_model_version
      and q.embedding_model_version ~ '^[0-9a-f]{40}$'
      and (e.metadata->>'nearest_similarity')::numeric = q.embedding_duplicate_score
      and (not p_require_approve or (
        i.status::text = 'ready' and i.safety_status::text = 'SAFE'
        and i.language = 'en' and i.platform = 'instagram_reels'
        and q.decision = 'approve' and not q.second_opinion_required
        and q.craft_score between 90 and 100 and q.editorial_quality_score between 90 and 100
        and q.embedding_duplicate_score >= 0 and q.embedding_duplicate_score < 0.78
        and i.decision_trace#>>'{generation_gate,final_decision}' = 'approve'
        and i.decision_trace#>'{generation_gate,hardGateCodes}' = '[]'::jsonb
        and i.decision_trace#>>'{generation_gate,critic_verification,passed}' = 'true'
      ))
    from public.idea_candidates i
    join public.idea_cards c on c.idea_id = i.id
    join public.idea_quality_checks q on q.idea_id = i.id
    join public.idea_semantic_embeddings e on e.idea_id = i.id
    join public.idea_generation_runs r on r.id::text = i.decision_trace#>>'{generation,run_id}'
    join public.idea_model_profiles generator on generator.id = r.model_profile_id
    join public.idea_model_profiles critic on critic.id::text = i.decision_trace#>>'{generation_gate,critic_verification,profile_id}'
    cross join public.idea_embedding_corpus_state corpus
    where i.id = p_idea_id
  ), false)
$$;

create or replace function public.qualify_idea_model_profile(p_profile_slug text, p_eval_id uuid)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  p public.idea_model_profiles%rowtype;
  e public.idea_model_qualification_evals%rowtype;
  m jsonb;
  n integer;
  approved_n integer;
  requested_n bigint;
  imported_n bigint;
  category_name text;
  average_score numeric;
  duplicate_n integer;
  residue_n integer;
  duration_valid_n integer;
  valid boolean := false;
begin
  select * into p from public.idea_model_profiles where profile_slug = p_profile_slug and enabled for update;
  if not found then raise exception 'Enabled model profile not found'; end if;
  select * into e from public.idea_model_qualification_evals where id = p_eval_id and model_profile_id = p.id and status = 'completed';
  if not found then raise exception 'Completed automatic qualification not found'; end if;
  m := e.metrics;
  select sum(requested_count), sum(imported_count) into requested_n, imported_n
  from public.idea_generation_runs where id = any(e.generation_run_ids) and model_profile_id = p.id;
  valid := coalesce(
    e.prompt_version = 'idea-card-premium-v3.0.0-automatic' and e.schema_version = 2
    and e.quality_gate_version = 'quality-gate-v3.0.0-automatic'
    and m->>'qualification_mode' = 'automatic-v3'
    and m->>'pipeline_version' = 'generation-pipeline-v3.1.1'
    and m->>'scheduler_version' = 'creative-scheduler-v2.1'
    and m->>'concept_ranker_version' = 'concept-ranker-v2'
    and m->>'duration_planner_version' = 'duration-planner-v2'
    and m->>'regression_version' = 'automatic-quality-regression-v3'
    and m->>'regression_passed' = 'true' and (m->>'regression_case_count')::integer = 72
    and m->'generator_snapshot' = public.idea_model_contract(p)
    and (m->>'evaluated_count')::integer = e.brief_count and e.brief_count = 600
    and case when jsonb_typeof(e.category_counts) = 'object'
      then (select count(*) from jsonb_object_keys(e.category_counts)) = 12
      else false end
    and m->'category_counts' = e.category_counts
    and public.automatic_qualification_quality_metrics_valid(m, 600)
    and public.automatic_qualification_categories_valid(m)
    and (m->>'embedded_count')::integer = e.brief_count
    and (m->>'critic_record_count')::integer = e.brief_count
    and (m->>'current_gate_count')::integer = e.brief_count
    and (m->>'fresh_snapshot_count')::integer = e.brief_count
    and (m->>'schema_pass_rate')::numeric between .99 and 1
    and (m->>'taxonomy_pass_rate')::numeric between .99 and 1
    and (m->>'recipe_adherence_rate')::numeric between .98 and 1
    and imported_n::numeric / greatest(1,requested_n) between .99 and 1
    and (m->>'safe_approve_rate')::numeric between .55 and 1
    and (m->>'approved_average')::numeric between 90 and 100
    and (m->>'approved_critic_pass_rate')::numeric = 1
    and (m->>'approved_hook_first_frame_rate')::numeric = 1
    and (m->>'approved_proof_payoff_rate')::numeric = 1
    and m->>'creative_distribution_passed' = 'true'
    and (m->>'duplicate_rate_078')::numeric between 0 and .03
    and (m->>'banned_residue_rate')::numeric between 0 and .005
    and (m->>'creator_residue_rate')::numeric between 0 and .005
    and (m->>'duration_fit_rate')::numeric between .95 and 1
    and (m->>'exact_duration_max_share')::numeric between 0 and .2
    and (m->>'timing_template_duplicate_rate')::numeric = 0, false);
  if exists (
    select 1 from public.idea_generation_runs r where r.model_profile_id = p.id
      and r.prompt_version = 'idea-card-premium-v3.0.0-automatic'
      and r.generation_batch_id in (select generation_batch_id from public.idea_generation_runs where id = any(e.generation_run_ids))
      and (not (r.id = any(e.generation_run_ids)) or r.status in ('queued','running')
        or r.metadata->'generator_snapshot' is distinct from public.idea_model_contract(p)
        or r.metadata->>'pipeline_version' is distinct from 'generation-pipeline-v3.1.1'
        or r.metadata->>'scheduler_version' is distinct from 'creative-scheduler-v2.1'
        or r.metadata->>'critic_profile_id' is distinct from m->>'critic_profile_id')
  ) then valid := false; end if;
  select count(*), count(*) filter (where q.decision = 'approve') into n, approved_n
  from public.idea_candidates i join public.idea_quality_checks q on q.idea_id = i.id
  join public.idea_generation_runs r on r.id::text = i.decision_trace#>>'{generation,run_id}'
  where r.id = any(e.generation_run_ids) and r.model_profile_id = p.id
    and public.automatic_card_evidence_valid(i.id, q.decision = 'approve');
  valid := valid and n = e.brief_count and approved_n::numeric / greatest(1,n) >= .55;
  foreach category_name in array array[
    'beauty','fashion','commerce_affiliate','creator_education','entertainment_comedy','fitness_wellness_safe',
    'food','lifestyle','luxury','parenting_family','thought_leadership','travel'
  ] loop
    select count(*), count(*) filter (where q.decision = 'approve'),
      avg(q.craft_score) filter (where q.decision = 'approve'),
      count(*) filter (where q.embedding_duplicate_score >= .78),
      count(*) filter (where 'creator_facing_residue' = any(q.reasons)),
      count(*) filter (where not exists (
        select 1 from unnest(q.reasons) reason where reason ~ 'duration|runtime|spoken_delivery|physical_action_exceeds'
      ))
      into n, approved_n, average_score, duplicate_n, residue_n, duration_valid_n
    from public.idea_candidates i
    join public.idea_quality_checks q on q.idea_id = i.id
    join public.categories c on c.id = i.category_id
    join public.idea_generation_runs r on r.id::text = i.decision_trace#>>'{generation,run_id}'
    where r.id = any(e.generation_run_ids) and r.model_profile_id = p.id and c.slug = category_name;
    select sum(r.requested_count), sum(r.imported_count) into requested_n, imported_n
    from public.idea_generation_runs r
    join public.idea_generation_batches b on b.id = r.generation_batch_id
    join public.categories c on c.id = b.category_id
    where r.id = any(e.generation_run_ids) and r.model_profile_id = p.id and c.slug = category_name;
    valid := valid and coalesce(
      n = 50 and (e.category_counts->>category_name)::integer = 50
      and approved_n::numeric / greatest(1,n) >= .55 and average_score between 90 and 100
      and duplicate_n::numeric / greatest(1,n) <= .03
      and residue_n::numeric / greatest(1,n) <= .005
      and duration_valid_n::numeric / greatest(1,n) >= .95
      and imported_n::numeric / greatest(1,requested_n) between .99 and 1, false);
  end loop;
  if not exists (select 1 from public.idea_model_profiles critic where critic.id::text = m->>'critic_profile_id'
    and critic.enabled and public.idea_model_contract(critic) = m->'critic_snapshot'
    and critic.profile_slug = p.features->>'critic_profile_slug'
    and (critic.provider <> p.provider or critic.model <> p.model)) then valid := false; end if;
  update public.idea_model_profiles set qualification_status = case when valid then 'approved' else 'shadow' end,
    qualification_metrics = m,
    qualified_prompt_version = case when valid then e.prompt_version end,
    qualified_schema_version = case when valid then e.schema_version end,
    qualified_quality_gate_version = case when valid then e.quality_gate_version end,
    qualification_eval_id = case when valid then e.id end
  where id = p.id;
  return jsonb_build_object('qualified', valid, 'qualification_mode', 'automatic-v3', 'human_review_required', false);
end $$;

create or replace function public.guard_automatic_inventory_publication() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if new.status::text <> 'available' then return new; end if;
  perform 1 from public.idea_candidates i
    join public.idea_cards c on c.idea_id = i.id
    join public.idea_quality_checks q on q.idea_id = i.id
    join public.idea_semantic_embeddings e on e.idea_id = i.id
    join public.idea_generation_runs r on r.id::text = i.decision_trace#>>'{generation,run_id}'
    join public.idea_model_profiles p on p.id = r.model_profile_id
    join public.idea_model_profiles critic on critic.id::text = i.decision_trace#>>'{generation_gate,critic_verification,profile_id}'
    where i.id = new.idea_id for share of i, c, q, e, r, p, critic;
  perform 1 from public.idea_embedding_corpus_revision where singleton for share;
  if not public.automatic_card_evidence_valid(new.idea_id, true) then
    raise exception 'Current V3 automatic card evidence required for publication' using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.idea_candidates i
    join public.idea_generation_runs r on r.id::text = i.decision_trace#>>'{generation,run_id}'
    join public.idea_model_profiles p on p.id = r.model_profile_id
    join public.idea_model_profiles critic on critic.id::text = i.decision_trace#>>'{generation_gate,critic_verification,profile_id}'
    where public.qualified_critic_matches(p, critic) and i.id = new.idea_id and not r.shadow and p.enabled and p.qualification_status = 'approved'
      and p.qualified_prompt_version = 'idea-card-premium-v3.0.0-automatic'
      and p.qualified_schema_version = 2 and p.qualified_quality_gate_version = 'quality-gate-v3.0.0-automatic'
      and p.qualification_eval_id is not null and p.qualification_metrics->>'qualification_mode' = 'automatic-v3'
      and p.qualification_metrics->>'pipeline_version' = 'generation-pipeline-v3.1.1'
      and p.qualification_metrics->>'scheduler_version' = 'creative-scheduler-v2.1'
      and p.qualification_metrics->>'concept_ranker_version' = 'concept-ranker-v2'
      and p.qualification_metrics->>'duration_planner_version' = 'duration-planner-v2'
  ) then raise exception 'Qualified V3 automatic generation run required for publication' using errcode = '23514'; end if;
  return new;
end $$;

revoke all on function public.automatic_qualification_metric_between(jsonb, text, numeric, numeric) from public, anon, authenticated;
revoke all on function public.automatic_qualification_quality_metrics_valid(jsonb, integer) from public, anon, authenticated;
revoke all on function public.automatic_qualification_categories_valid(jsonb) from public, anon, authenticated;
revoke all on function public.qualified_critic_matches(public.idea_model_profiles, public.idea_model_profiles) from public, anon, authenticated;
grant execute on function public.automatic_qualification_metric_between(jsonb, text, numeric, numeric) to service_role;
grant execute on function public.automatic_qualification_quality_metrics_valid(jsonb, integer) to service_role;
grant execute on function public.automatic_qualification_categories_valid(jsonb) to service_role;
grant execute on function public.qualified_critic_matches(public.idea_model_profiles, public.idea_model_profiles) to service_role;

-- Old aggregate-only qualification evidence cannot authorize the upgraded pipeline.
update public.idea_model_profiles set qualification_status = 'shadow', qualification_metrics = '{}'::jsonb,
  qualified_prompt_version = null, qualified_schema_version = null,
  qualified_quality_gate_version = null, qualification_eval_id = null
where qualification_status = 'approved';
