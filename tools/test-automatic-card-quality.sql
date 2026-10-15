\set ON_ERROR_STOP on
-- Local PostgreSQL/Supabase only. Every fixture and corpus change rolls back.
begin;
do $test$
declare
  profile_id uuid := gen_random_uuid();
  eval_id uuid := gen_random_uuid();
  profile_slug text := 'automatic-test-' || profile_id::text;
  contract jsonb;
  result jsonb;
  revision_before bigint;
  revision_after bigint;
begin
  if not exists (select 1 from pg_trigger where tgname = 'idea_inventory_automatic_publication'
    and tgrelid = 'public.idea_inventory'::regclass and tgenabled = 'O') then
    raise exception 'Automatic publication migration is not active';
  end if;
  if public.automatic_card_evidence_valid(gen_random_uuid(), true) then
    raise exception 'Missing evidence must never pass';
  end if;
  begin
    insert into public.idea_inventory(idea_id, category_id, persona_id, platform, language, status)
    values (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'instagram_reels', 'en', 'available');
    raise exception 'Unverified inventory insertion unexpectedly succeeded';
  exception when check_violation then
    if sqlerrm not like 'Current V3 automatic card evidence required%' then raise; end if;
  end;
  select revision::bigint into revision_before from public.idea_embedding_corpus_state;
  update public.idea_cards set title = title where false;
  select revision::bigint into revision_after from public.idea_embedding_corpus_state;
  if revision_after <= revision_before then raise exception 'Corpus revision did not advance'; end if;

  insert into public.idea_model_profiles(id, profile_slug, provider, protocol, model, api_key_env_var, enabled)
  values(profile_id, profile_slug, 'test', 'json_text', 'test', 'VIRALBOX_MODEL_PROVIDER_TEST', true);
  select public.idea_model_contract(p) into contract from public.idea_model_profiles p where id = profile_id;
  insert into public.idea_model_qualification_evals(id, model_profile_id, prompt_version, schema_version,
    quality_gate_version, brief_count, category_counts, metrics, status)
  values(eval_id, profile_id, 'idea-card-premium-v3.0.0-automatic', 2, 'quality-gate-v3.0.1-automatic', 600,
    '{"beauty":50,"fashion":50,"commerce_affiliate":50,"creator_education":50,"entertainment_comedy":50,"fitness_wellness_safe":50,"food":50,"lifestyle":50,"luxury":50,"parenting_family":50,"thought_leadership":50,"travel":50}'::jsonb,
    '{"qualification_mode":"automatic-v3","pipeline_version":"generation-pipeline-v3.1.2","scheduler_version":"creative-scheduler-v2.1","concept_ranker_version":"concept-ranker-v2","duration_planner_version":"duration-planner-v2","regression_version":"automatic-quality-regression-v3",
      "regression_passed":true,"regression_case_count":72,"evaluated_count":600,"embedded_count":600,
      "critic_record_count":600,"current_gate_count":600,"fresh_snapshot_count":600,
      "schema_pass_rate":1,"taxonomy_pass_rate":1,"recipe_adherence_rate":1,"safe_approve_rate":1,"approved_average":99,"approved_critic_pass_rate":1,
      "approved_hook_first_frame_rate":1,"approved_proof_payoff_rate":1,"creative_distribution_passed":true,
      "duplicate_rate_078":0,"banned_residue_rate":0,"creator_residue_rate":0,"duration_fit_rate":1,
      "exact_duration_max_share":0.1,"timing_template_duplicate_rate":0}'::jsonb
      || jsonb_build_object('generator_snapshot', contract), 'completed');
  result := public.qualify_idea_model_profile(profile_slug, eval_id);
  if result->>'qualified' is distinct from 'false' then
    raise exception 'Perfect claimed metrics without real runs must not qualify';
  end if;
  if exists (select 1 from public.idea_model_profiles where id = profile_id and qualification_status <> 'shadow') then
    raise exception 'Invalid evaluation must leave profile shadow';
  end if;
  update public.idea_model_profiles set enabled = false, api_key_env_var = 'LEGACY_PROVIDER_KEY' where id = profile_id;
  raise notice 'Automatic database guard checks passed; transaction will roll back';
end $test$;

do $consistency$
declare
  category_id uuid := gen_random_uuid();
  persona_id uuid := gen_random_uuid();
  product_id uuid := gen_random_uuid();
  user_id uuid := gen_random_uuid();
  checkout_id uuid := gen_random_uuid();
  delivery_id uuid := gen_random_uuid();
  batch_id uuid := gen_random_uuid();
  run_id uuid := gen_random_uuid();
  imported_idea uuid := gen_random_uuid();
  ideas uuid[] := array[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  stocks uuid[] := array[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  payload jsonb := '{"title":"Consistency fixture","steps":[{"action":"Open the bag"},{"action":"Compare both items"},{"action":"Show the result"}]}'::jsonb;
  result jsonb;
  slot integer;
begin
  insert into public.categories(id,slug,name,family)
    values(category_id,'consistency_'||replace(category_id::text,'-',''),'Test','test');
  insert into public.creator_personas(id,slug,name)
    values(persona_id,'consistency_'||replace(persona_id::text,'-',''),'Test');
  insert into public.box_products(id,slug,name,price_usd_cents,idea_count,allocation)
    values(product_id,'consistency_'||replace(product_id::text,'-',''),'Test',100,1,'{"high":1}');
  insert into auth.users(id,aud,role,email,raw_app_meta_data,raw_user_meta_data)
    values(user_id,'authenticated','authenticated',user_id||'@example.test','{}','{}');
  insert into public.profiles(id) values(user_id) on conflict (id) do nothing;
  insert into public.checkout_sessions(id,user_id,box_product_id) values(checkout_id,user_id,product_id);
  insert into public.idea_box_deliveries(id,user_id,box_product_id,category_id,persona_id,status)
    values(delivery_id,user_id,product_id,category_id,persona_id,'delivered');
  -- Only seed historical stock past the NEW-publication guard. All change/checkout
  -- guards stay enabled. Trigger state and all fixtures roll back with this file.
  alter table public.idea_inventory disable trigger idea_inventory_automatic_publication;
  for slot in 1..4 loop
    insert into public.idea_candidates(id,platform,format,language,title,one_sentence_premise,status,category_id,persona_id)
      values(ideas[slot],'instagram_reels','Reels','en','Test','Test comparison','ready',category_id,persona_id);
    insert into public.idea_cards(idea_id,title,card) values(ideas[slot],'Test',payload);
    insert into public.idea_quality_checks(idea_id,decision,craft_score,metadata)
      values(ideas[slot],'approve',99,jsonb_build_object('card_snapshot',payload));
    insert into public.idea_inventory(id,idea_id,category_id,persona_id,internal_rank_score,score_band,max_reuse_count)
      values(stocks[slot],ideas[slot],category_id,persona_id,99,'high',1);
  end loop;
  alter table public.idea_inventory enable trigger idea_inventory_automatic_publication;
  if not (select public.inventory_row_is_sellable(inv) from public.idea_inventory inv where id = stocks[1]) then raise exception 'Control stock must be sellable'; end if;

  update public.idea_quality_checks set decision = 'reject' where idea_id = ideas[1];
  if (select status from public.idea_inventory where id = stocks[1]) <> 'paused' then raise exception 'Reject did not quarantine stock'; end if;
  if (select public.inventory_row_is_sellable(inv) from public.idea_inventory inv where id = stocks[1]) then raise exception 'Rejected stock is sellable'; end if;
  begin
    perform public.rollback_idea_inventory_v3(stocks[1]);
    raise exception 'Rejected stock reactivated';
  exception when check_violation then null;
  end;
  update public.idea_quality_checks set decision = 'approve' where idea_id = ideas[1];
  if (select status from public.idea_inventory where id = stocks[1]) <> 'paused' then raise exception 'Rescore must not implicitly restore stock'; end if;
  if not public.rollback_idea_inventory_v3(stocks[1]) then raise exception 'Eligible rollback failed'; end if;
  update public.idea_cards set card = card || '{"title":"Changed after approval"}'::jsonb where idea_id = ideas[1];
  if (select status from public.idea_inventory where id = stocks[1]) <> 'paused' then raise exception 'Stale snapshot did not quarantine stock'; end if;

  insert into public.checkout_inventory_reservations(checkout_session_id,user_id,inventory_id,idea_id,assigned_band,slot_index,expires_at)
    values(checkout_id,user_id,stocks[2],ideas[2],'high',1,now()+interval '1 hour');
  insert into public.idea_box_items(delivery_id,user_id,inventory_id,idea_id,slot_index,assigned_band)
    values(delivery_id,user_id,stocks[3],ideas[3],1,'high');
  update public.idea_inventory set status = 'retired', reuse_count = 1 where id = stocks[4];
  update public.idea_quality_checks set decision = 'reject' where idea_id = any(ideas[2:4]);
  if (select status from public.idea_inventory where id = stocks[2]) <> 'available' then raise exception 'Active reservation was mutated'; end if;
  if (select status from public.idea_inventory where id = stocks[3]) <> 'available' then raise exception 'Delivered stock was mutated'; end if;
  if (select status from public.idea_inventory where id = stocks[4]) <> 'retired' then raise exception 'Used stock was mutated'; end if;
  if (select public.inventory_row_is_sellable(inv) from public.idea_inventory inv where id = stocks[2]) then raise exception 'Rejected reserved row may not be sold again'; end if;

  insert into public.idea_generation_batches(id,external_batch_id,category_id,persona_id,target_count,language)
    values(batch_id,'consistency-'||batch_id,category_id,persona_id,10,'en');
  insert into public.idea_generation_runs(id,generation_batch_id,profile_slug,provider,protocol,model,prompt_version,taxonomy_version,requested_count,candidate_multiplier,request_key,started_at)
    values(run_id,batch_id,'test','test','json_text','test','idea-card-premium-v3.0.0-automatic','creative-taxonomy-v1',1,5,gen_random_uuid(),now()-interval '11 minutes');
  update public.idea_generation_runs set lease_expires_at = now()-interval '1 minute' where id = run_id;
  result := public.reconcile_expired_idea_generation_run(run_id);
  if result->>'status' <> 'failed' or (result->>'imported_count')::integer <> 0 then raise exception 'Empty expired run was not reconciled'; end if;
  if public.reconcile_expired_idea_generation_run(run_id) is distinct from result then raise exception 'Recovery is not idempotent'; end if;

  run_id := gen_random_uuid();
  insert into public.idea_generation_runs(id,generation_batch_id,profile_slug,provider,protocol,model,prompt_version,taxonomy_version,requested_count,candidate_multiplier,request_key)
    values(run_id,batch_id,'test','test','json_text','test','idea-card-premium-v3.0.0-automatic','creative-taxonomy-v1',1,5,gen_random_uuid());
  if not public.reserve_idea_creative_signature(run_id,batch_id,category_id,persona_id,'instagram_reels','creative-taxonomy-v1:test-signature') then
    raise exception 'First creative signature reservation failed';
  end if;
  if not public.reserve_idea_creative_signature(run_id,batch_id,category_id,persona_id,'instagram_reels','creative-taxonomy-v1:test-signature') then
    raise exception 'Same-owner creative signature replay failed';
  end if;
  begin
    perform public.reserve_idea_creative_signature(run_id,batch_id,gen_random_uuid(),persona_id,'instagram_reels','creative-taxonomy-v1:wrong-lane');
    raise exception 'Mismatched reservation scope succeeded';
  exception when check_violation then null;
  end;
  result := public.reconcile_expired_idea_generation_run(run_id);
  if result->>'status' <> 'running' then raise exception 'Active run was expired'; end if;
  insert into public.idea_candidates(id,generation_batch_id,platform,format,title,one_sentence_premise,decision_trace)
    values(imported_idea,batch_id,'instagram_reels','Reels','Test','Test',jsonb_build_object('import_source','verified_generation','generation',jsonb_build_object('run_id',run_id)));
  insert into public.idea_cards(idea_id,title,card) values(imported_idea,'Test',payload);
  update public.idea_generation_runs set started_at = now()-interval '11 minutes', lease_expires_at = now()-interval '1 minute' where id = run_id;
  result := public.reconcile_expired_idea_generation_run(run_id);
  if result->>'status' <> 'partial' or (result->>'imported_count')::integer <> 1 then raise exception 'Recovered imported card was lost'; end if;
  begin
    insert into public.idea_candidates(generation_batch_id,platform,format,title,one_sentence_premise,decision_trace)
      values(batch_id,'instagram_reels','Reels','Late','Late',jsonb_build_object('import_source','verified_generation','generation',jsonb_build_object('run_id',run_id)));
    raise exception 'Expired worker imported another candidate';
  exception when check_violation then null;
  end;
  raise notice 'Stock consistency, protected inventory, recovery and lease checks passed';
end $consistency$;
rollback;
