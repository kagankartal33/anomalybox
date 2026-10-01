-- V3.1.2: bind every publisher-side evidence hash to the stored card bytes.
-- This is deliberately incremental: previous migrations are immutable audit history.

create or replace function public.automatic_stable_json_text(p_value jsonb)
returns text language sql immutable set search_path = public as $$
  select case jsonb_typeof(p_value)
    when 'object' then '{' || coalesce((
      select string_agg(to_jsonb(key)::text || ':' || public.automatic_stable_json_text(value), ',' order by key)
      from jsonb_each(p_value)
    ), '') || '}'
    when 'array' then '[' || coalesce((
      select string_agg(public.automatic_stable_json_text(value), ',' order by ordinality)
      from jsonb_array_elements(p_value) with ordinality as values_(value, ordinality)
    ), '') || ']'
    else coalesce(p_value::text, 'null')
  end
$$;

create or replace function public.automatic_json_trimmed_string(p_value jsonb)
returns text language sql immutable set search_path = public as $$
  select case when jsonb_typeof(p_value) = 'string' then nullif(btrim(p_value #>> '{}'), '') end
$$;

create or replace function public.automatic_card_content_hash(p_card jsonb)
returns text language sql immutable set search_path = public as $$
  select encode(extensions.digest(convert_to(public.automatic_stable_json_text(p_card - 'id' - 'one_sentence_premise'), 'UTF8'), 'sha256'), 'hex')
$$;

-- Keep the database pre-publication check byte-for-byte compatible with the
-- semantic document used by the local embedding worker.
create or replace function public.automatic_card_semantic_document(p_card jsonb)
returns text language sql immutable set search_path = public as $$
  with card as (
    select coalesce(p_card, '{}'::jsonb) as value
  ), summary as (
    select coalesce(card.value->'idea_summary', '{}'::jsonb) as value from card
  ), selected_steps as (
    select case
      when jsonb_typeof(card.value->'steps') = 'array' then card.value->'steps'
      when jsonb_typeof(card.value->'scene_script') = 'array' then card.value->'scene_script'
      else '[]'::jsonb
    end as value from card
  ), fields as (
    select 1::bigint as position, public.automatic_json_trimmed_string(card.value->'title') as value from card
    union all select 2, coalesce(
      public.automatic_json_trimmed_string(card.value->'conceptSummary'),
      public.automatic_json_trimmed_string(card.value->'one_sentence_premise'),
      public.automatic_json_trimmed_string(summary.value->'premise'),
      public.automatic_json_trimmed_string(summary.value->'one_sentence_premise')
    ) from card cross join summary
    union all select 3, coalesce(
      public.automatic_json_trimmed_string(card.value->'viewerTakeaway'),
      public.automatic_json_trimmed_string(summary.value->'creator_takeaway'),
      public.automatic_json_trimmed_string(summary.value->'viewer_takeaway')
    ) from card cross join summary
    union all
    select 3 + (step.ordinality - 1) * 7 + field.ordinality,
      public.automatic_json_trimmed_string(field.value)
    from selected_steps
    cross join lateral jsonb_array_elements(selected_steps.value) with ordinality as step(value, ordinality)
    cross join lateral (values
      (1::bigint, step.value->'purpose'),
      (2::bigint, step.value->'goal'),
      (3::bigint, coalesce(step.value->'action', step.value->'visual_action')),
      (4::bigint, coalesce(step.value->'spokenLine', step.value->'voiceover', step.value->'spoken_line')),
      (5::bigint, coalesce(step.value->'shot', step.value->'shot_type')),
      (6::bigint, coalesce(step.value->'onScreenText', step.value->'on_screen_text')),
      (7::bigint, coalesce(step.value->'editNote', step.value->'edit_note'))
    ) as field(ordinality, value)
  )
  select coalesce(string_agg(value, E'
$$;

create or replace function public.automatic_card_semantic_hash(p_card jsonb)
returns text language sql immutable set search_path = public as $$
  select encode(extensions.digest(convert_to(public.automatic_card_semantic_document(p_card), 'UTF8'), 'sha256'), 'hex')
$$;

create or replace function public.automatic_card_evidence_valid(p_idea_id uuid, p_require_approve boolean default true)
returns boolean language sql volatile security invoker set search_path = public as $$
  select coalesce((
    select
      c.card->>'schemaVersion' = '2'
      and q.evaluator_version = 'quality-gate-v3.0.1-automatic'
      and q.metadata->'card_snapshot' = (c.card - 'id' - 'one_sentence_premise')
      and q.metadata->>'card_hash' = public.automatic_card_content_hash(c.card)
      and q.metadata->>'semantic_hash' = public.automatic_card_semantic_hash(c.card)
      and i.decision_trace->>'import_source' = 'verified_generation'
      and i.decision_trace#>>'{generation,taxonomy_version}' = 'creative-taxonomy-v1'
      and i.decision_trace#>>'{generation,pipeline_version}' = 'generation-pipeline-v3.1.2'
      and i.decision_trace#>>'{generation,scheduler_version}' = 'creative-scheduler-v2.1'
      and r.metadata->>'pipeline_version' = 'generation-pipeline-v3.1.2'
      and r.metadata->>'scheduler_version' = 'creative-scheduler-v2.1'
      and r.metadata->>'critic_profile_id' = critic.id::text
      and r.metadata->>'critic_profile_hash' = i.decision_trace#>>'{generation_gate,critic_verification,profile_hash}'
      and i.decision_trace#>>'{generation,creative_signature}' is not null
      and i.decision_trace#>>'{generation_gate,policy_version}' = 'automatic-card-policy-v3.1'
      and i.decision_trace#>>'{generation_gate,critic_verification,card_hash}' = public.automatic_card_content_hash(c.card)
      and i.decision_trace#>>'{generation_gate,critic_verification,independent}' = 'true'
      and i.decision_trace#>'{generation_gate,critic_verification,profile_snapshot}' = public.idea_model_contract(critic)
      and critic.enabled and (critic.provider <> generator.provider or critic.model <> generator.model)
      and generator.enabled and r.metadata->'generator_snapshot' = public.idea_model_contract(generator)
      and r.prompt_version = 'idea-card-premium-v3.0.0-automatic' and r.schema_version = 2
      and r.taxonomy_version = 'creative-taxonomy-v1' and r.status in ('completed', 'partial')
      and e.embedding is not null and e.source_text_hash = public.automatic_card_semantic_hash(c.card)
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
  category_name text;
  average_score numeric;
  duplicate_n integer;
  residue_n integer;
  duration_valid_n integer;
  requested_n bigint;
  imported_n bigint;
  valid boolean := false;
begin
  select * into p from public.idea_model_profiles where profile_slug = p_profile_slug and enabled for update;
  if not found then raise exception 'Enabled model profile not found'; end if;
  select * into e from public.idea_model_qualification_evals where id = p_eval_id and model_profile_id = p.id and status = 'completed';
  if not found then raise exception 'Completed automatic qualification not found'; end if;
  m := e.metrics;
  valid := coalesce(
    e.prompt_version = 'idea-card-premium-v3.0.0-automatic' and e.schema_version = 2
    and e.quality_gate_version = 'quality-gate-v3.0.1-automatic'
    and e.brief_count = 600 and m->>'qualification_mode' = 'automatic-v3'
    and m->>'pipeline_version' = 'generation-pipeline-v3.1.2'
    and m->>'scheduler_version' = 'creative-scheduler-v2.1'
    and m->>'concept_ranker_version' = 'concept-ranker-v2'
    and m->>'duration_planner_version' = 'duration-planner-v2'
    and m->>'regression_version' = 'automatic-quality-regression-v3'
    and m->>'regression_passed' = 'true' and (m->>'regression_case_count')::integer = 72
    and m->'generator_snapshot' = public.idea_model_contract(p)
    and (m->>'evaluated_count')::integer = e.brief_count
    and m->'category_counts' = e.category_counts
    and public.automatic_qualification_quality_metrics_valid(m, 600)
    and public.automatic_qualification_categories_valid(m), false);
  select sum(requested_count), sum(imported_count) into requested_n, imported_n
    from public.idea_generation_runs where id = any(e.generation_run_ids) and model_profile_id = p.id
      and prompt_version = 'idea-card-premium-v3.0.0-automatic' and taxonomy_version = 'creative-taxonomy-v1'
      and metadata->>'pipeline_version' = 'generation-pipeline-v3.1.2';
  valid := valid and coalesce(imported_n::numeric / greatest(1, requested_n) between .99 and 1, false);
  select count(*), count(*) filter (where q.decision = 'approve') into n, approved_n
    from public.idea_candidates i join public.idea_quality_checks q on q.idea_id = i.id
    join public.idea_generation_runs r on r.id::text = i.decision_trace#>>'{generation,run_id}'
    where r.id = any(e.generation_run_ids) and r.model_profile_id = p.id
      and public.automatic_card_evidence_valid(i.id, q.decision = 'approve');
  valid := valid and n = e.brief_count and approved_n::numeric / greatest(1, n) >= .55;
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
      )) into n, approved_n, average_score, duplicate_n, residue_n, duration_valid_n
    from public.idea_candidates i
    join public.idea_quality_checks q on q.idea_id = i.id
    join public.categories c on c.id = i.category_id
    join public.idea_generation_runs r on r.id::text = i.decision_trace#>>'{generation,run_id}'
    where r.id = any(e.generation_run_ids) and r.model_profile_id = p.id and c.slug = category_name;
    select sum(r.requested_count), sum(r.imported_count) into requested_n, imported_n
      from public.idea_generation_runs r join public.idea_generation_batches b on b.id = r.generation_batch_id
      join public.categories c on c.id = b.category_id
      where r.id = any(e.generation_run_ids) and r.model_profile_id = p.id and c.slug = category_name;
    valid := valid and coalesce(
      n = 50 and (e.category_counts->>category_name)::integer = 50
      and approved_n::numeric / greatest(1, n) >= .55 and average_score between 90 and 100
      and duplicate_n::numeric / greatest(1, n) <= .03 and residue_n::numeric / greatest(1, n) <= .005
      and duration_valid_n::numeric / greatest(1, n) >= .95
      and imported_n::numeric / greatest(1, requested_n) between .99 and 1, false);
  end loop;
  if not exists (
    select 1 from public.idea_model_profiles critic where critic.id::text = m->>'critic_profile_id'
      and critic.enabled and public.idea_model_contract(critic) = m->'critic_snapshot'
      and critic.profile_slug = p.features->>'critic_profile_slug'
      and (critic.provider <> p.provider or critic.model <> p.model)
  ) then valid := false; end if;
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
      and p.qualified_schema_version = 2 and p.qualified_quality_gate_version = 'quality-gate-v3.0.1-automatic'
      and p.qualification_eval_id is not null and p.qualification_metrics->>'qualification_mode' = 'automatic-v3'
      and p.qualification_metrics->>'pipeline_version' = 'generation-pipeline-v3.1.2'
      and p.qualification_metrics->>'scheduler_version' = 'creative-scheduler-v2.1'
      and p.qualification_metrics->>'concept_ranker_version' = 'concept-ranker-v2'
      and p.qualification_metrics->>'duration_planner_version' = 'duration-planner-v2'
  ) then raise exception 'Qualified V3 automatic generation run required for publication' using errcode = '23514'; end if;
  return new;
end $$;

revoke all on function public.automatic_stable_json_text(jsonb) from public, anon, authenticated;
revoke all on function public.automatic_json_trimmed_string(jsonb) from public, anon, authenticated;
revoke all on function public.automatic_card_content_hash(jsonb) from public, anon, authenticated;
revoke all on function public.automatic_card_semantic_document(jsonb) from public, anon, authenticated;
revoke all on function public.automatic_card_semantic_hash(jsonb) from public, anon, authenticated;
revoke all on function public.automatic_card_evidence_valid(uuid, boolean) from public, anon, authenticated;
grant execute on function public.automatic_stable_json_text(jsonb) to service_role;
grant execute on function public.automatic_json_trimmed_string(jsonb) to service_role;
grant execute on function public.automatic_card_content_hash(jsonb) to service_role;
grant execute on function public.automatic_card_semantic_document(jsonb) to service_role;
grant execute on function public.automatic_card_semantic_hash(jsonb) to service_role;
grant execute on function public.automatic_card_evidence_valid(uuid, boolean) to service_role;

-- Changed deterministic gates invalidate every prior approval. No card is deleted.
update public.idea_model_profiles set qualification_status = 'shadow', qualification_metrics = '{}'::jsonb,
  qualified_prompt_version = null, qualified_schema_version = null,
  qualified_quality_gate_version = null, qualification_eval_id = null
where qualification_status = 'approved';