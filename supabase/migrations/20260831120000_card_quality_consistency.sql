-- V2.3.1: retain inventory, but never sell a subsequently rejected/stale card.
-- No bulk stock mutation. Delivered/used/reserved rows are not quarantined.

-- Lock first, then check reservations in a fresh statement snapshot. A single
-- UPDATE/NOT EXISTS can otherwise use a snapshot taken before a reservation
-- committed while it waited for the inventory row lock.
create or replace function public.quarantine_idea_inventory_v2_2(p_inventory_id uuid, p_reasons text[], p_score numeric)
returns boolean language plpgsql security invoker set search_path = public as $$
begin
  perform 1 from public.idea_inventory where id = p_inventory_id for update;
  update public.idea_inventory inv set status = 'paused',
    metadata = coalesce(inv.metadata, '{}'::jsonb) || jsonb_build_object(
      'pause_reason', 'quality_quarantine_v2_2', 'quality_quarantine_at', now(),
      'quality_quarantine_reasons', coalesce(to_jsonb(p_reasons), '[]'::jsonb),
      'quality_quarantine_score', p_score), updated_at = now()
    where inv.id = p_inventory_id and inv.status = 'available' and inv.reuse_count = 0
      and not exists (select 1 from public.idea_box_items d where d.inventory_id = inv.id or d.idea_id = inv.idea_id)
      and not exists (select 1 from public.checkout_inventory_reservations r where r.status = 'active' and (r.inventory_id = inv.id or r.idea_id = inv.idea_id));
  return found;
end $$;

create or replace function public.rollback_idea_inventory_v2_2(p_inventory_id uuid)
returns boolean language plpgsql security invoker set search_path = public as $$
begin
  perform 1 from public.idea_inventory where id = p_inventory_id for update;
  update public.idea_inventory inv set status = 'available',
    metadata = (coalesce(inv.metadata, '{}'::jsonb) - 'pause_reason') || jsonb_build_object('quality_quarantine_rolled_back_at', now()), updated_at = now()
    where inv.id = p_inventory_id and inv.status = 'paused' and inv.reuse_count = 0
      and inv.metadata->>'pause_reason' = 'quality_quarantine_v2_2'
      and not exists (select 1 from public.idea_box_items d where d.inventory_id = inv.id or d.idea_id = inv.idea_id)
      and not exists (select 1 from public.checkout_inventory_reservations r where r.status = 'active' and (r.inventory_id = inv.id or r.idea_id = inv.idea_id));
  return found;
end $$;

create or replace function public.inventory_idea_quality_allows_sale(p_idea_id uuid)
returns boolean language sql stable set search_path = public as $$
  select exists (
    select 1 from public.idea_candidates i
    join public.idea_cards c on c.idea_id = i.id
    left join public.idea_quality_checks q on q.idea_id = i.id
    where i.id = p_idea_id
      and i.status::text not in ('blocked', 'needs_refinement', 'human_review_required', 'archived')
      and i.safety_status::text = 'SAFE'
      and (q.idea_id is null or (
        q.decision = 'approve' and not q.second_opinion_required
        and coalesce(q.human_review_decision, '') not in ('reject', 'refine')
        and (not (q.metadata ? 'card_snapshot') or q.metadata->'card_snapshot' = (c.card - 'id' - 'one_sentence_premise'))
      ))
      -- Old stock without automatic provenance remains eligible for the shadow audit.
      and (i.decision_trace->>'import_source' is distinct from 'verified_generation' or (
        q.idea_id is not null and q.metadata->>'card_hash' is not null
        and q.metadata->'card_snapshot' = (c.card - 'id' - 'one_sentence_premise')
        and i.decision_trace#>>'{generation_gate,critic_verification,card_hash}' = q.metadata->>'card_hash'
        and i.decision_trace#>>'{generation_gate,final_decision}' = 'approve'
      ))
      and not exists (select 1 from public.idea_card_gold_ratings g where g.idea_id = i.id and g.human_decision in ('reject', 'refine'))
  );
$$;

create or replace function public.inventory_row_is_sellable(inv public.idea_inventory)
returns boolean language sql stable set search_path = public as $$
  select inv.status = 'available'::public.inventory_status
    and inv.reuse_count = 0 and inv.max_reuse_count = 1
    and inv.quality_floor_passed is true and inv.internal_rank_score >= 80
    and public.idea_has_sellable_card(inv.idea_id)
    and public.inventory_scope_matches_candidate(inv.idea_id, inv.category_id, inv.persona_id)
    and public.inventory_idea_quality_allows_sale(inv.idea_id);
$$;

create or replace function public.quarantine_inventory_after_quality_change()
returns trigger language plpgsql security invoker set search_path = public as $$
declare
  affected_id uuid;
  inventory_id uuid;
  current_score numeric;
begin
  if tg_table_name = 'idea_candidates' then
    affected_id := new.id;
  elsif tg_op = 'DELETE' then
    affected_id := old.idea_id;
  else
    affected_id := new.idea_id;
  end if;
  if tg_op = 'DELETE' or not public.inventory_idea_quality_allows_sale(affected_id) then
    select craft_score into current_score from public.idea_quality_checks where idea_id = affected_id;
    for inventory_id in select id from public.idea_inventory where idea_id = affected_id and status = 'available' and reuse_count = 0 loop
      -- The existing RPC rechecks active reservations and deliveries while updating.
      perform public.quarantine_idea_inventory_v2_2(inventory_id, array['quality_evidence_invalidated'], current_score);
    end loop;
  end if;
  return null;
end $$;

create trigger idea_quality_checks_inventory_guard after insert or update or delete on public.idea_quality_checks
for each row execute function public.quarantine_inventory_after_quality_change();
create trigger idea_cards_inventory_guard after update of card or delete on public.idea_cards
for each row execute function public.quarantine_inventory_after_quality_change();
create trigger idea_candidates_inventory_guard after update of status, safety_status, decision_trace on public.idea_candidates
for each row execute function public.quarantine_inventory_after_quality_change();
create trigger idea_gold_ratings_inventory_guard after insert or update on public.idea_card_gold_ratings
for each row execute function public.quarantine_inventory_after_quality_change();

create or replace function public.guard_inventory_quality_reactivation()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.status = 'available' and old.status is distinct from new.status
    and not public.inventory_idea_quality_allows_sale(new.idea_id) then
    raise exception 'Current card quality does not allow inventory reactivation' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger idea_inventory_quality_reactivation before update of status on public.idea_inventory
for each row execute function public.guard_inventory_quality_reactivation();

-- Resolve abandoned requests under the same batch->run lock ordering as generation.
-- Replays return this terminal result, never silently run the model again.
create or replace function public.reconcile_expired_idea_generation_run(p_run_id uuid)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  batch_id uuid;
  r public.idea_generation_runs%rowtype;
  imported_n integer;
begin
  select generation_batch_id into batch_id from public.idea_generation_runs where id = p_run_id;
  if batch_id is null then raise exception 'Generation request not found'; end if;
  perform 1 from public.idea_generation_batches where id = batch_id for update;
  select * into r from public.idea_generation_runs where id = p_run_id for update;
  if r.status = 'running' and r.started_at < now() - interval '10 minutes' then
    select count(*) into imported_n from public.idea_candidates i
      join public.idea_cards c on c.idea_id = i.id
      where i.generation_batch_id = batch_id and i.decision_trace#>>'{generation,run_id}' = r.id::text;
    update public.idea_generation_runs set
      status = case when imported_n > 0 then 'partial' else 'failed' end,
      imported_count = imported_n, generated_count = greatest(generated_count, imported_n),
      reject_count = greatest(reject_count, requested_count - imported_n), completed_at = now(),
      metadata = metadata || '{"lease_expired":true,"reconciled":true}'::jsonb
      where id = r.id returning * into r;
  end if;
  return to_jsonb(r);
end $$;

create or replace function public.guard_automatic_generation_run() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.prompt_version not in ('idea-card-premium-v2.3-automatic', 'idea-card-premium-v2.3.1-automatic') then return new; end if;
  perform 1 from public.idea_generation_batches where id = new.generation_batch_id for update;
  if new.request_key is null or new.requested_count <> 1 then
    raise exception 'Automatic generation requires request_key and requested_count=1';
  end if;
  if exists (select 1 from public.idea_generation_runs where generation_batch_id = new.generation_batch_id and request_key = new.request_key) then
    raise exception 'Generation request already exists' using errcode = '23505';
  end if;
  perform public.reconcile_expired_idea_generation_run(id) from public.idea_generation_runs
    where generation_batch_id = new.generation_batch_id and status = 'running' and started_at < now() - interval '10 minutes';
  if exists (select 1 from public.idea_generation_runs where generation_batch_id = new.generation_batch_id and status = 'running') then
    raise exception 'Generation batch is busy' using errcode = '55P03';
  end if;
  if (select count(*) from public.idea_candidates where generation_batch_id = new.generation_batch_id)
    >= (select target_count from public.idea_generation_batches where id = new.generation_batch_id) then
    raise exception 'Generation batch target already filled';
  end if;
  return new;
end $$;

-- A recovered/expired worker must not subsequently insert more candidates.
create or replace function public.guard_generation_candidate_lease() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if new.decision_trace->>'import_source' is distinct from 'verified_generation' then return new; end if;
  perform 1 from public.idea_generation_batches where id = new.generation_batch_id for update;
  perform 1 from public.idea_generation_runs r
    where r.id::text = new.decision_trace#>>'{generation,run_id}'
      and r.generation_batch_id = new.generation_batch_id and r.status = 'running'
      and r.started_at >= now() - interval '10 minutes' for update;
  if not found then raise exception 'Active generation lease required for candidate import' using errcode = '23514'; end if;
  return new;
end $$;
create trigger idea_candidates_generation_lease before insert on public.idea_candidates
for each row execute function public.guard_generation_candidate_lease();

revoke all on function public.inventory_idea_quality_allows_sale(uuid) from public, anon, authenticated;
revoke all on function public.quarantine_inventory_after_quality_change() from public, anon, authenticated;
revoke all on function public.guard_inventory_quality_reactivation() from public, anon, authenticated;
revoke all on function public.reconcile_expired_idea_generation_run(uuid) from public, anon, authenticated;
revoke all on function public.guard_generation_candidate_lease() from public, anon, authenticated;
grant execute on function public.inventory_idea_quality_allows_sale(uuid) to service_role;
grant execute on function public.reconcile_expired_idea_generation_run(uuid) to service_role;


-- Changed safety/proof/adapter rules require fresh automatic qualification.
create or replace function public.automatic_card_evidence_valid(p_idea_id uuid, p_require_approve boolean default true)
returns boolean language sql volatile security invoker set search_path = public as $$
  select coalesce((
    select
      c.card->>'schemaVersion' = '2'
      and q.evaluator_version = 'quality-gate-v2.3.1-automatic'
      and q.metadata->'card_snapshot' = (c.card - 'id' - 'one_sentence_premise')
      and q.metadata->>'card_hash' is not null
      and i.decision_trace->>'import_source' = 'verified_generation'
      and i.decision_trace#>>'{generation_gate,policy_version}' = 'automatic-card-policy-v1'
      and i.decision_trace#>>'{generation_gate,critic_verification,card_hash}' = q.metadata->>'card_hash'
      and i.decision_trace#>>'{generation_gate,critic_verification,independent}' = 'true'
      and i.decision_trace#>'{generation_gate,critic_verification,profile_snapshot}' = public.idea_model_contract(critic)
      and critic.enabled
      and (critic.provider <> generator.provider or critic.model <> generator.model)
      and generator.enabled
      and r.metadata->'generator_snapshot' = public.idea_model_contract(generator)
      and r.prompt_version = 'idea-card-premium-v2.3.1-automatic' and r.schema_version = 2
      and r.status in ('completed', 'partial')
      and e.embedding is not null
      and e.source_text_hash = q.metadata->>'semantic_hash'
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
        and q.craft_score between 88 and 100 and q.editorial_quality_score between 88 and 100
        and q.embedding_duplicate_score >= 0 and q.embedding_duplicate_score < 0.78
        and i.decision_trace#>>'{generation_gate,final_decision}' = 'approve'
        and i.decision_trace#>'{generation_gate,hardGateCodes}' = '[]'::jsonb
        and i.decision_trace#>>'{generation_gate,critic_verification,passed}' = 'true'
        and coalesce(q.human_review_decision, '') not in ('reject', 'refine')
        and not exists (select 1 from public.idea_card_gold_ratings g where g.idea_id = i.id and g.human_decision in ('reject', 'refine'))
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
    e.prompt_version = 'idea-card-premium-v2.3.1-automatic' and e.schema_version = 2
    and e.quality_gate_version = 'quality-gate-v2.3.1-automatic'
    and m->>'qualification_mode' = 'automatic-v1'
    and m->>'regression_version' = 'automatic-quality-regression-v2'
    and m->>'regression_passed' = 'true' and (m->>'regression_case_count')::integer >= 24
    and m->'generator_snapshot' = public.idea_model_contract(p)
    and (m->>'evaluated_count')::integer = e.brief_count and e.brief_count >= 250
    and (m->>'embedded_count')::integer = e.brief_count
    and (m->>'critic_record_count')::integer = e.brief_count
    and (m->>'current_gate_count')::integer = e.brief_count
    and (m->>'fresh_snapshot_count')::integer = e.brief_count
    and (m->>'schema_pass_rate')::numeric between 0.98 and 1
    and imported_n::numeric / greatest(1,requested_n) between 0.98 and 1
    and (m->>'safe_approve_rate')::numeric between 0.55 and 1
    and (m->>'approved_average')::numeric between 88 and 100
    and (m->>'approved_critic_pass_rate')::numeric = 1
    and (m->>'duplicate_rate_078')::numeric between 0 and 0.05
    and (m->>'banned_residue_rate')::numeric between 0 and 0.01
    and (m->>'duration_fit_rate')::numeric between 0.95 and 1
    and (m->>'exact_duration_max_share')::numeric between 0 and 0.2
    and (m->>'timing_template_duplicate_rate')::numeric = 0, false);
  if exists (
    select 1 from public.idea_generation_runs r where r.model_profile_id = p.id
      and r.prompt_version = 'idea-card-premium-v2.3.1-automatic'
      and r.generation_batch_id in (select generation_batch_id from public.idea_generation_runs where id = any(e.generation_run_ids))
      and (not (r.id = any(e.generation_run_ids)) or r.status = 'running'
        or r.metadata->'generator_snapshot' is distinct from public.idea_model_contract(p))
  ) then valid := false; end if;
  select count(*), count(*) filter (where q.decision = 'approve') into n, approved_n
  from public.idea_candidates i join public.idea_quality_checks q on q.idea_id = i.id
  join public.idea_generation_runs r on r.id::text = i.decision_trace#>>'{generation,run_id}'
  where r.id = any(e.generation_run_ids) and r.model_profile_id = p.id
    and public.automatic_card_evidence_valid(i.id, q.decision = 'approve');
  valid := valid and n = e.brief_count and approved_n::numeric / greatest(1,n) >= .55;
  foreach category_name in array array['beauty','entertainment_comedy','travel','fitness_wellness_safe','food'] loop
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
  return jsonb_build_object('qualified', valid, 'qualification_mode', 'automatic-v1', 'human_review_required', false);
end $$;

create or replace function public.guard_automatic_inventory_publication() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if new.status::text <> 'available' then return new; end if;
  -- Keep all evidence immutable through the insert transaction.
  perform 1 from public.idea_candidates i
    join public.idea_cards c on c.idea_id = i.id
    join public.idea_quality_checks q on q.idea_id = i.id
    join public.idea_semantic_embeddings e on e.idea_id = i.id
    join public.idea_generation_runs r on r.id::text = i.decision_trace#>>'{generation,run_id}'
    join public.idea_model_profiles p on p.id = r.model_profile_id
    join public.idea_model_profiles critic on critic.id::text = i.decision_trace#>>'{generation_gate,critic_verification,profile_id}'
    where i.id = new.idea_id for share of i, c, q, e, r, p, critic;
  -- Serialize with corpus changes until commit, avoiding a publish/check race.
  perform 1 from public.idea_embedding_corpus_revision where singleton for share;
  if not public.automatic_card_evidence_valid(new.idea_id, true) then
    raise exception 'Current automatic card evidence required for publication' using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.idea_candidates i
    join public.idea_generation_runs r on r.id::text = i.decision_trace#>>'{generation,run_id}'
    join public.idea_model_profiles p on p.id = r.model_profile_id
    where i.id = new.idea_id and not r.shadow and p.enabled and p.qualification_status = 'approved'
      and p.qualified_prompt_version = 'idea-card-premium-v2.3.1-automatic'
      and p.qualified_schema_version = 2 and p.qualified_quality_gate_version = 'quality-gate-v2.3.1-automatic'
      and p.qualification_eval_id is not null and p.qualification_metrics->>'qualification_mode' = 'automatic-v1'
  ) then raise exception 'Qualified automatic generation run required for publication' using errcode = '23514'; end if;
  return new;
end $$;

update public.idea_model_profiles set qualification_status = 'shadow', qualification_metrics = '{}'::jsonb,
  qualified_prompt_version = null, qualified_schema_version = null, qualified_quality_gate_version = null, qualification_eval_id = null
where qualification_status = 'approved';
