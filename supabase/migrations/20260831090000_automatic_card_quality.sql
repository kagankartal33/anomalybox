-- Fully automatic, fail-closed card generation. No inventory is deleted or restored.
alter table public.idea_model_profiles drop constraint if exists idea_model_profiles_provider_secret_allowlist_check;
alter table public.idea_model_profiles add constraint idea_model_profiles_provider_secret_allowlist_check
  check (not enabled or api_key_env_var ~ '^VIRALBOX_MODEL_PROVIDER_[A-Z0-9_]{2,96}$');

alter table public.idea_generation_runs add column if not exists request_key uuid;
create unique index if not exists idea_generation_runs_request_uidx
  on public.idea_generation_runs(generation_batch_id, request_key) where request_key is not null;

-- Serialise generation in a batch, including concurrent replay. Old abandoned leases expire.
create or replace function public.guard_automatic_generation_run() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.prompt_version <> 'idea-card-premium-v2.3-automatic' then return new; end if;
  perform 1 from public.idea_generation_batches where id = new.generation_batch_id for update;
  if (select count(*) from public.idea_candidates where generation_batch_id = new.generation_batch_id)
    >= (select target_count from public.idea_generation_batches where id = new.generation_batch_id) then
    raise exception 'Generation batch target already filled';
  end if;
  if new.request_key is null or new.requested_count <> 1 then
    raise exception 'Automatic generation requires request_key and requested_count=1';
  end if;
  if exists (select 1 from public.idea_generation_runs where generation_batch_id = new.generation_batch_id and request_key = new.request_key) then
    raise exception 'Generation request already exists' using errcode = '23505';
  end if;
  update public.idea_generation_runs set status = 'failed', completed_at = now(),
    metadata = metadata || '{"lease_expired":true}'::jsonb
    where generation_batch_id = new.generation_batch_id and status = 'running' and started_at < now() - interval '10 minutes';
  if exists (select 1 from public.idea_generation_runs where generation_batch_id = new.generation_batch_id and status = 'running') then
    raise exception 'Generation batch is busy' using errcode = '55P03';
  end if;
  return new;
end $$;
create trigger idea_generation_runs_automatic_guard before insert on public.idea_generation_runs
for each row execute function public.guard_automatic_generation_run();

-- A monotonic corpus revision catches updates AND deletions, including same-count replacement.
create table public.idea_embedding_corpus_revision (
  singleton boolean primary key default true check (singleton),
  revision bigint not null default 1
);
insert into public.idea_embedding_corpus_revision(singleton) values (true);
alter table public.idea_embedding_corpus_revision enable row level security;
revoke all on public.idea_embedding_corpus_revision from public, anon, authenticated;
grant select, update on public.idea_embedding_corpus_revision to service_role;
create or replace function public.bump_idea_embedding_corpus_revision() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.idea_embedding_corpus_revision set revision = revision + 1 where singleton;
  return null;
end $$;
revoke all on function public.bump_idea_embedding_corpus_revision() from public, anon, authenticated;
create trigger idea_cards_corpus_revision after insert or update or delete or truncate on public.idea_cards
for each statement execute function public.bump_idea_embedding_corpus_revision();
create view public.idea_embedding_corpus_state with (security_invoker = true) as
select (select count(*) from public.idea_cards) as card_count, revision::text as revision
from public.idea_embedding_corpus_revision where singleton;
revoke all on public.idea_embedding_corpus_state from public, anon, authenticated;
grant select on public.idea_embedding_corpus_state to service_role;

create or replace function public.idea_model_contract(p public.idea_model_profiles) returns jsonb
language sql immutable set search_path = public as $$
  select jsonb_build_object('provider', p.provider, 'protocol', p.protocol, 'model', p.model,
    'base_url', p.base_url, 'api_key_env_var', p.api_key_env_var, 'features', p.features)
$$;

-- Optional past editorial vetoes are respected; no new human rating is required.
-- This predicate is also reused when verifying model-qualification evidence.
create or replace function public.automatic_card_evidence_valid(p_idea_id uuid, p_require_approve boolean default true)
returns boolean language sql volatile security invoker set search_path = public as $$
  select coalesce((
    select
      c.card->>'schemaVersion' = '2'
      and q.evaluator_version = 'quality-gate-v2.3-automatic'
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
      and r.prompt_version = 'idea-card-premium-v2.3-automatic' and r.schema_version = 2
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
revoke all on function public.idea_model_contract(public.idea_model_profiles) from public, anon, authenticated;
revoke all on function public.automatic_card_evidence_valid(uuid, boolean) from public, anon, authenticated;
grant execute on function public.idea_model_contract(public.idea_model_profiles) to service_role;
grant execute on function public.automatic_card_evidence_valid(uuid, boolean) to service_role;

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
    e.prompt_version = 'idea-card-premium-v2.3-automatic' and e.schema_version = 2
    and e.quality_gate_version = 'quality-gate-v2.3-automatic'
    and m->>'qualification_mode' = 'automatic-v1'
    and m->>'regression_version' = 'automatic-quality-regression-v1'
    and m->>'regression_passed' = 'true' and (m->>'regression_case_count')::integer >= 12
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
      and r.prompt_version = 'idea-card-premium-v2.3-automatic'
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
revoke all on function public.qualify_idea_model_profile(text, uuid) from public, anon, authenticated;
grant execute on function public.qualify_idea_model_profile(text, uuid) to service_role;

create or replace function public.invalidate_dependent_critic_qualifications() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if public.idea_model_contract(new) is distinct from public.idea_model_contract(old) or new.enabled is distinct from old.enabled then
    update public.idea_model_profiles set qualification_status = 'shadow', qualification_metrics = '{}'::jsonb,
      qualified_prompt_version = null, qualified_schema_version = null, qualified_quality_gate_version = null, qualification_eval_id = null
    where features->>'critic_profile_slug' in (old.profile_slug, new.profile_slug) and id <> new.id;
  end if;
  return new;
end $$;
create trigger idea_model_profiles_critic_invalidation after update on public.idea_model_profiles
for each row execute function public.invalidate_dependent_critic_qualifications();
update public.idea_model_profiles set qualification_status = 'shadow', qualification_metrics = '{}'::jsonb,
  qualified_prompt_version = null, qualified_schema_version = null, qualified_quality_gate_version = null, qualification_eval_id = null
where qualification_status = 'approved';

-- Defense in depth: all new available inventory, including alternate import paths, must pass.
-- Existing deliveries, reservations and available/paused stock are intentionally untouched.
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
      and p.qualified_prompt_version = 'idea-card-premium-v2.3-automatic'
      and p.qualified_schema_version = 2 and p.qualified_quality_gate_version = 'quality-gate-v2.3-automatic'
      and p.qualification_eval_id is not null and p.qualification_metrics->>'qualification_mode' = 'automatic-v1'
  ) then raise exception 'Qualified automatic generation run required for publication' using errcode = '23514'; end if;
  return new;
end $$;
create trigger idea_inventory_automatic_publication before insert on public.idea_inventory
for each row execute function public.guard_automatic_inventory_publication();
