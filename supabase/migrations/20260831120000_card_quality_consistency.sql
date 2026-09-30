-- V2.3.1: retain inventory, but never sell a subsequently rejected/stale card.
-- No bulk stock mutation. Delivered/used/reserved rows are not quarantined.

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