-- ViralBox professional automatic card generation V3.
-- Existing cards remain readable and no inventory row is deleted or reactivated.

alter table public.idea_generation_runs add column if not exists taxonomy_version text;
alter table public.idea_generation_runs add column if not exists stage text not null default 'normalize';
alter table public.idea_generation_runs add column if not exists heartbeat_at timestamptz;
alter table public.idea_generation_runs add column if not exists lease_expires_at timestamptz;

alter table public.idea_generation_runs drop constraint if exists idea_generation_runs_status_check;
alter table public.idea_generation_runs add constraint idea_generation_runs_status_check
  check (status in ('queued', 'running', 'completed', 'partial', 'failed'));
alter table public.idea_generation_runs drop constraint if exists idea_generation_runs_stage_check;
alter table public.idea_generation_runs add constraint idea_generation_runs_stage_check check (stage in (
  'queued', 'normalize', 'recipes', 'concepts', 'draft', 'critic', 'rewrite',
  'import', 'awaiting_embedding', 'completed', 'failed'
));

update public.idea_generation_runs
set stage = case when status = 'failed' then 'failed' when status in ('completed', 'partial') then 'completed' else 'normalize' end
where stage is null or stage not in ('queued','normalize','recipes','concepts','draft','critic','rewrite','import','awaiting_embedding','completed','failed');

create index if not exists idea_generation_runs_active_lease_idx
  on public.idea_generation_runs(generation_batch_id, lease_expires_at)
  where status in ('queued', 'running');

create unique index if not exists idea_candidates_batch_creative_signature_uidx
  on public.idea_candidates(generation_batch_id, (decision_trace#>>'{generation,creative_signature}'))
  where decision_trace#>>'{generation,creative_signature}' is not null;

create or replace function public.reconcile_expired_idea_generation_run(p_run_id uuid)
returns public.idea_generation_runs language plpgsql security invoker set search_path = public as $$
declare result public.idea_generation_runs%rowtype;
begin
  select * into result from public.idea_generation_runs where id = p_run_id for update;
  if not found then raise exception 'Generation run not found'; end if;
  if result.status = 'running' and coalesce(result.lease_expires_at, result.started_at + interval '10 minutes') < now() then
    update public.idea_generation_runs set status = 'failed', stage = 'failed', completed_at = now(),
      metadata = metadata || '{"lease_expired":true}'::jsonb
    where id = p_run_id returning * into result;
  end if;
  return result;
end $$;

create or replace function public.guard_automatic_generation_run() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.prompt_version <> 'idea-card-premium-v3.0.0-automatic' then return new; end if;
  perform 1 from public.idea_generation_batches where id = new.generation_batch_id for update;
  if new.request_key is null or new.requested_count <> 1 or new.candidate_multiplier <> 5 then
    raise exception 'V3 generation requires request_key, requested_count=1 and candidate_multiplier=5';
  end if;
  if new.taxonomy_version <> 'creative-taxonomy-v1' then
    raise exception 'V3 generation requires creative-taxonomy-v1';
  end if;
  if exists (select 1 from public.idea_generation_runs where generation_batch_id = new.generation_batch_id and request_key = new.request_key) then
    raise exception 'Generation request already exists' using errcode = '23505';
  end if;
  update public.idea_generation_runs set status = 'failed', stage = 'failed', completed_at = now(),
    metadata = metadata || '{"lease_expired":true}'::jsonb
  where generation_batch_id = new.generation_batch_id and status in ('queued','running')
    and coalesce(lease_expires_at, created_at + interval '10 minutes') < now();
  if exists (select 1 from public.idea_generation_runs where generation_batch_id = new.generation_batch_id and status in ('queued','running')) then
    raise exception 'Generation batch is busy' using errcode = '55P03';
  end if;
  if (select count(*) from public.idea_candidates where generation_batch_id = new.generation_batch_id)
    >= (select target_count from public.idea_generation_batches where id = new.generation_batch_id) then
    raise exception 'Generation batch target already filled';
  end if;
  new.stage := case when new.status = 'queued' then 'queued' else 'normalize' end;
  new.heartbeat_at := now();
  new.lease_expires_at := now() + interval '10 minutes';
  return new;
end $$;

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
      and i.decision_trace#>>'{generation,creative_signature}' is not null
      and i.decision_trace#>>'{generation_gate,policy_version}' = 'automatic-card-policy-v3'
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
    and m->>'regression_version' = 'automatic-quality-regression-v3'
    and m->>'regression_passed' = 'true' and (m->>'regression_case_count')::integer >= 72
    and m->'generator_snapshot' = public.idea_model_contract(p)
    and (m->>'evaluated_count')::integer = e.brief_count and e.brief_count >= 600
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
        or r.metadata->'generator_snapshot' is distinct from public.idea_model_contract(p))
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
    select count(*) into n from public.idea_candidates i
    join public.categories c on c.id = i.category_id
    join public.idea_generation_runs r on r.id::text = i.decision_trace#>>'{generation,run_id}'
    where r.id = any(e.generation_run_ids) and r.model_profile_id = p.id and c.slug = category_name;
    valid := valid and n >= 50 and coalesce((e.category_counts->>category_name)::integer,0) = n;
  end loop;
  if not exists (select 1 from public.idea_model_profiles critic where critic.id::text = m->>'critic_profile_id'
    and critic.enabled and public.idea_model_contract(critic) = m->'critic_snapshot'
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
    where i.id = new.idea_id and not r.shadow and p.enabled and p.qualification_status = 'approved'
      and p.qualified_prompt_version = 'idea-card-premium-v3.0.0-automatic'
      and p.qualified_schema_version = 2 and p.qualified_quality_gate_version = 'quality-gate-v3.0.0-automatic'
      and p.qualification_eval_id is not null and p.qualification_metrics->>'qualification_mode' = 'automatic-v3'
  ) then raise exception 'Qualified V3 automatic generation run required for publication' using errcode = '23514'; end if;
  return new;
end $$;

update public.idea_model_profiles set qualification_status = 'shadow', qualification_metrics = '{}'::jsonb,
  qualified_prompt_version = null, qualified_schema_version = null,
  qualified_quality_gate_version = null, qualification_eval_id = null
where qualification_status = 'approved';