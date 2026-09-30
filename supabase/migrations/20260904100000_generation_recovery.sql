-- Incremental V3 recovery: pending signatures are leased; a generated candidate,
-- its card and its committed creative signature are one database transaction.
alter table public.idea_creative_signature_reservations
  add column if not exists state text not null default 'pending',
  add column if not exists lease_expires_at timestamptz not null default (now() + interval '10 minutes'),
  add column if not exists idea_id uuid references public.idea_candidates(id) on delete set null;
alter table public.idea_creative_signature_reservations
  add constraint idea_creative_signature_reservations_state_check check (state in ('pending', 'committed'));

create or replace function public.creative_signature_from_recipe_v2(p_recipe jsonb)
returns text language sql immutable set search_path = public as $$
  select case when jsonb_typeof(p_recipe) = 'object'
    and not exists (select 1 from unnest(array[
      'taxonomyVersion','hookTypeId','genreId','hookDeliveryId','promiseTypeId','emotionArcId',
      'vibePresetId','proofDeviceId','payoffTypeId','audienceActionId','shootFormat','presenceMode'
    ]) k where jsonb_typeof(p_recipe->k) is distinct from 'string' or (p_recipe->>k) !~ '^[a-z0-9_-]+$')
  then 'creative-signature-v2:' || array_to_json(array[
    p_recipe->>'taxonomyVersion',p_recipe->>'hookTypeId',p_recipe->>'genreId',p_recipe->>'hookDeliveryId',
    p_recipe->>'promiseTypeId',p_recipe->>'emotionArcId',p_recipe->>'vibePresetId',p_recipe->>'proofDeviceId',
    p_recipe->>'payoffTypeId',p_recipe->>'audienceActionId',p_recipe->>'shootFormat',p_recipe->>'presenceMode'
  ])::text else null end
$$;

-- Keep every pre-upgrade committed signature, including shadow and rejected cards.
-- The canonical recipe, not the old 32-bit hash, establishes cross-version identity.
update public.idea_creative_signature_reservations s set state = 'committed', idea_id = i.id
from public.idea_candidates i join public.idea_cards c on c.idea_id = i.id
where i.decision_trace#>>'{generation,run_id}' = s.generation_run_id::text;
insert into public.idea_creative_signature_reservations
  (generation_run_id,generation_batch_id,category_id,persona_id,platform,creative_signature,state,idea_id)
select distinct on (i.category_id,i.persona_id,i.platform,public.creative_signature_from_recipe_v2(i.decision_trace#>'{generation,creative_recipe}'))
  r.id,i.generation_batch_id,i.category_id,i.persona_id,i.platform,
  public.creative_signature_from_recipe_v2(i.decision_trace#>'{generation,creative_recipe}'),'committed',i.id
from public.idea_candidates i join public.idea_cards c on c.idea_id = i.id
join public.idea_generation_runs r on r.id::text = i.decision_trace#>>'{generation,run_id}'
where i.decision_trace->>'import_source' = 'verified_generation'
  and public.creative_signature_from_recipe_v2(i.decision_trace#>'{generation,creative_recipe}') is not null
on conflict (category_id,persona_id,platform,creative_signature)
do update set state = 'committed', idea_id = excluded.idea_id;

create or replace function public.release_pending_idea_creative_signatures(p_run_id uuid)
returns integer language plpgsql security invoker set search_path = public as $$
declare owner public.idea_generation_runs%rowtype; released integer;
begin
  perform 1 from public.idea_generation_batches b join public.idea_generation_runs r
    on r.generation_batch_id=b.id where r.id=p_run_id for update of b;
  select * into owner from public.idea_generation_runs where id=p_run_id for update;
  if not found then raise exception 'Generation run not found'; end if;
  if owner.status in ('queued','running') and coalesce(owner.lease_expires_at,owner.started_at+interval '10 minutes',owner.created_at+interval '10 minutes') >= now() then
    return 0;
  end if;
  delete from public.idea_creative_signature_reservations s
  where s.generation_run_id=p_run_id and s.state='pending' and s.idea_id is null
    and not exists (select 1 from public.idea_candidates i join public.idea_cards c on c.idea_id=i.id
      where i.decision_trace#>>'{generation,run_id}'=p_run_id::text);
  get diagnostics released = row_count;
  return released;
end $$;

create or replace function public.reconcile_idea_generation_run(p_run_id uuid, p_force boolean default false)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare result public.idea_generation_runs%rowtype; imported_n integer; refined_n integer; rejected_n integer;
begin
  perform 1 from public.idea_generation_batches b join public.idea_generation_runs r
    on r.generation_batch_id=b.id where r.id=p_run_id for update of b;
  select * into result from public.idea_generation_runs where id=p_run_id for update;
  if not found then raise exception 'Generation run not found'; end if;
  if not p_force and result.status in ('queued','running')
    and coalesce(result.lease_expires_at,result.started_at+interval '10 minutes',result.created_at+interval '10 minutes') >= now() then
    return to_jsonb(result);
  end if;
  -- Only incomplete verified imports are disposable. Never touch complete cards,
  -- inventory, reservations held for checkout, or anything already delivered.
  delete from public.idea_candidates i where i.generation_batch_id=result.generation_batch_id
    and i.decision_trace->>'import_source'='verified_generation'
    and i.decision_trace#>>'{generation,run_id}'=p_run_id::text
    and not exists(select 1 from public.idea_cards c where c.idea_id=i.id)
    and not exists(select 1 from public.idea_inventory v where v.idea_id=i.id)
    and not exists(select 1 from public.idea_box_items d where d.idea_id=i.id)
    and not exists(select 1 from public.checkout_inventory_reservations q where q.idea_id=i.id);
  select count(*),count(*) filter(where i.decision_trace#>>'{generation_gate,final_decision}'='refine'),
    count(*) filter(where i.decision_trace#>>'{generation_gate,final_decision}'='reject')
  into imported_n,refined_n,rejected_n
  from public.idea_candidates i join public.idea_cards c on c.idea_id=i.id
  where i.generation_batch_id=result.generation_batch_id and i.decision_trace#>>'{generation,run_id}'=p_run_id::text;
  update public.idea_generation_runs set
    status=case when imported_n>0 then case when result.status='completed' then 'completed' else 'partial' end else 'failed' end,
    stage=case when imported_n>0 then case when result.stage='completed' then 'completed' else 'awaiting_embedding' end else 'failed' end,
    imported_count=imported_n,generated_count=greatest(generated_count,imported_n),refine_count=refined_n,
    reject_count=greatest(reject_count,rejected_n,requested_count-imported_n),
    completed_at=coalesce(completed_at,now()),
    metadata=metadata || jsonb_build_object('recovery_reconciled',true)
  where id=p_run_id returning * into result;
  perform public.release_pending_idea_creative_signatures(p_run_id);
  return to_jsonb(result);
end $$;

create or replace function public.reconcile_expired_idea_generation_run(p_run_id uuid)
returns jsonb language sql security invoker set search_path = public as $$
  select public.reconcile_idea_generation_run(p_run_id,false)
$$;

create or replace function public.reconcile_idea_generation_batch(p_batch_id uuid)
returns integer language plpgsql security invoker set search_path = public as $$
declare run_id uuid; reconciled integer := 0;
begin
  perform 1 from public.idea_generation_batches where id=p_batch_id for update;
  if not found then raise exception 'Generation batch not found'; end if;
  for run_id in select id from public.idea_generation_runs where generation_batch_id=p_batch_id
    and (status in ('failed','partial') or (status in ('queued','running')
      and coalesce(lease_expires_at,started_at+interval '10 minutes',created_at+interval '10 minutes')<now()))
  loop
    perform public.reconcile_idea_generation_run(run_id,false);
    reconciled:=reconciled+1;
  end loop;
  return reconciled;
end $$;

create or replace function public.reserve_idea_creative_signature(
  p_run_id uuid,p_batch_id uuid,p_category_id uuid,p_persona_id uuid,p_platform text,p_signature text
) returns boolean language plpgsql security invoker set search_path = public as $$
declare owner public.idea_generation_runs%rowtype; reserved_id uuid;
begin
  perform 1 from public.idea_generation_batches where id=p_batch_id and category_id=p_category_id
    and persona_id=p_persona_id and platform=p_platform for update;
  if not found then raise exception 'Generation run and lane reservation scope do not match' using errcode='23514'; end if;
  select * into owner from public.idea_generation_runs where id=p_run_id and generation_batch_id=p_batch_id for update;
  if not found or owner.status<>'running' or coalesce(owner.lease_expires_at,owner.started_at+interval '10 minutes')<now() then
    raise exception 'Active generation lease required for creative reservation' using errcode='23514';
  end if;
  if nullif(btrim(p_signature),'') is null then raise exception 'Creative signature is required' using errcode='22023'; end if;
  -- Protect pre-upgrade cards even if their historic reservation was absent.
  if exists(select 1 from public.idea_candidates i join public.idea_cards c on c.idea_id=i.id
    where i.category_id=p_category_id and i.persona_id=p_persona_id and i.platform=p_platform
      and public.creative_signature_from_recipe_v2(i.decision_trace#>'{generation,creative_recipe}')=p_signature) then
    return false;
  end if;
  insert into public.idea_creative_signature_reservations as current
    (generation_run_id,generation_batch_id,category_id,persona_id,platform,creative_signature,state,lease_expires_at)
  values(p_run_id,p_batch_id,p_category_id,p_persona_id,p_platform,p_signature,'pending',owner.lease_expires_at)
  on conflict(category_id,persona_id,platform,creative_signature) do update
    set generation_run_id=excluded.generation_run_id,generation_batch_id=excluded.generation_batch_id,
      lease_expires_at=excluded.lease_expires_at
    where current.state='pending' and current.idea_id is null
      and (current.generation_run_id=p_run_id or (
        current.lease_expires_at<now()
        and not exists(select 1 from public.idea_generation_runs r where r.id=current.generation_run_id
          and r.status in ('queued','running') and coalesce(r.lease_expires_at,r.started_at+interval '10 minutes',r.created_at+interval '10 minutes')>=now())
        and not exists(select 1 from public.idea_candidates i join public.idea_cards c on c.idea_id=i.id
          where i.decision_trace#>>'{generation,run_id}'=current.generation_run_id::text)))
  returning id into reserved_id;
  return reserved_id is not null;
end $$;

create or replace function public.import_generated_idea_card(p_run_id uuid,p_candidate jsonb,p_card jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare owner public.idea_generation_runs%rowtype; batch public.idea_generation_batches%rowtype;
  incoming public.idea_candidates%rowtype; existing public.idea_candidates%rowtype;
  card_id uuid; canonical_signature text; normalized_card jsonb; held public.idea_creative_signature_reservations%rowtype;
begin
  if jsonb_typeof(p_candidate) is distinct from 'object' or jsonb_typeof(p_card) is distinct from 'object' then
    raise exception 'Candidate and card must be JSON objects' using errcode='22023';
  end if;
  incoming:=jsonb_populate_record(null::public.idea_candidates,p_candidate);
  select * into batch from public.idea_generation_batches where id=incoming.generation_batch_id for update;
  if not found then raise exception 'Generation batch not found'; end if;
  select * into owner from public.idea_generation_runs where id=p_run_id for update;
  if not found or owner.generation_batch_id is distinct from batch.id
    or incoming.category_id is distinct from batch.category_id or incoming.persona_id is distinct from batch.persona_id
    or incoming.platform is distinct from batch.platform or incoming.language is distinct from batch.language
    or incoming.user_id is not null or incoming.id is not null
    or incoming.decision_trace->>'import_source' is distinct from 'verified_generation'
    or incoming.decision_trace#>>'{generation,run_id}' is distinct from p_run_id::text
    or incoming.decision_trace#>>'{generation,prompt_version}' is distinct from owner.prompt_version
    or nullif(incoming.external_idea_id,'') is null then
    raise exception 'Verified generation provenance and lane must match the run' using errcode='23514';
  end if;
  canonical_signature:=public.creative_signature_from_recipe_v2(incoming.decision_trace#>'{generation,creative_recipe}');
  if canonical_signature is null or incoming.decision_trace#>>'{generation,creative_signature}' is distinct from canonical_signature
    or p_card->>'schemaVersion' is distinct from '2' or nullif(btrim(p_card->>'title'),'') is null
    or jsonb_typeof(p_card->'steps') is distinct from 'array'
    or p_card->>'category' is distinct from (select slug from public.categories where id=batch.category_id)
    or p_card->>'personaSlug' is distinct from (select slug from public.creator_personas where id=batch.persona_id)
    or p_card->>'platform' is distinct from batch.platform
    or p_card->>'hookId' is distinct from incoming.decision_trace#>>'{generation,creative_recipe,hookTypeId}'
    or p_card->>'shootFormat' is distinct from incoming.decision_trace#>>'{generation,creative_recipe,shootFormat}'
    or p_card->>'presenceMode' is distinct from incoming.decision_trace#>>'{generation,creative_recipe,presenceMode}' then
    raise exception 'Generated card contract or creative signature is invalid' using errcode='23514';
  end if;
  if jsonb_array_length(p_card->'steps')=0 then raise exception 'Generated card needs steps' using errcode='23514'; end if;
  select * into existing from public.idea_candidates
    where generation_batch_id=batch.id and external_idea_id=incoming.external_idea_id for update;
  if found then
    normalized_card:=p_card || jsonb_build_object('id',existing.id,'title',coalesce(p_card->>'title',incoming.title),
      'one_sentence_premise',coalesce(p_card->>'one_sentence_premise',incoming.one_sentence_premise));
    if not (to_jsonb(existing) @> p_candidate) or not exists(select 1 from public.idea_cards c where c.idea_id=existing.id and c.card=normalized_card) then
      raise exception 'Generation replay does not match the committed candidate and card' using errcode='23514';
    end if;
    return existing.id;
  end if;
  if owner.status<>'running' or coalesce(owner.lease_expires_at,owner.started_at+interval '10 minutes')<now() then
    raise exception 'Active generation lease required for candidate import' using errcode='23514';
  end if;
  select * into held from public.idea_creative_signature_reservations where generation_run_id=p_run_id
    and category_id=batch.category_id and persona_id=batch.persona_id and platform=batch.platform
    and creative_signature=canonical_signature and state='pending' for update;
  if not found then raise exception 'Owned pending creative signature required' using errcode='23514'; end if;
  insert into public.idea_candidates(user_id,platform,format,language,locale,title,one_sentence_premise,
    core_insight,opportunity_statement,mechanism_ids,hook_options,story_beats,comedy_remix,human_awareness,
    production_requirements,safety_status,perspective_prism_status,confidence_band,status,decision_trace,
    external_idea_id,generation_batch_id,category_id,persona_id,content_style_layers,candidate_source)
  values(null,incoming.platform,incoming.format,incoming.language,incoming.locale,incoming.title,incoming.one_sentence_premise,
    incoming.core_insight,incoming.opportunity_statement,incoming.mechanism_ids,incoming.hook_options,incoming.story_beats,
    incoming.comedy_remix,incoming.human_awareness,incoming.production_requirements,incoming.safety_status,
    incoming.perspective_prism_status,incoming.confidence_band,incoming.status,incoming.decision_trace,
    incoming.external_idea_id,incoming.generation_batch_id,incoming.category_id,incoming.persona_id,
    incoming.content_style_layers,incoming.candidate_source) returning id into card_id;
  normalized_card:=p_card || jsonb_build_object('id',card_id,'title',coalesce(p_card->>'title',incoming.title),
    'one_sentence_premise',coalesce(p_card->>'one_sentence_premise',incoming.one_sentence_premise));
  insert into public.idea_cards(idea_id,title,card,markdown)
    values(card_id,incoming.title,normalized_card,case when jsonb_typeof(p_card->'markdown')='string' then p_card->>'markdown' else null end);
  update public.idea_creative_signature_reservations set state='committed',idea_id=card_id where id=held.id;
  return card_id;
end $$;

-- Refreshes use the current lease, not the obsolete absolute start-time cutoff.
create or replace function public.guard_generation_candidate_lease() returns trigger
language plpgsql security invoker set search_path=public as $$
begin
  if new.decision_trace->>'import_source' is distinct from 'verified_generation' then return new; end if;
  perform 1 from public.idea_generation_batches where id=new.generation_batch_id for update;
  perform 1 from public.idea_generation_runs r where r.id::text=new.decision_trace#>>'{generation,run_id}'
    and r.generation_batch_id=new.generation_batch_id and r.status='running'
    and coalesce(r.lease_expires_at,r.started_at+interval '10 minutes')>=now() for update;
  if not found then raise exception 'Active generation lease required for candidate import' using errcode='23514'; end if;
  return new;
end $$;

revoke all on function public.creative_signature_from_recipe_v2(jsonb), public.release_pending_idea_creative_signatures(uuid),
  public.reconcile_idea_generation_run(uuid,boolean),public.reconcile_idea_generation_batch(uuid),
  public.import_generated_idea_card(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.creative_signature_from_recipe_v2(jsonb),public.release_pending_idea_creative_signatures(uuid),
  public.reconcile_idea_generation_run(uuid,boolean),public.reconcile_idea_generation_batch(uuid),
  public.import_generated_idea_card(uuid,jsonb,jsonb) to service_role;