\set ON_ERROR_STOP on
-- Local Supabase only. Fixtures and all state changes are rolled back.
begin;

do $qualification$
declare
  good jsonb := '{"evaluated_count":50,"schema_pass_rate":1,"taxonomy_pass_rate":1,"recipe_adherence_rate":1,
    "safe_approve_rate":1,"approved_average":99,"duplicate_rate_078":0,"banned_residue_rate":0,
    "creator_residue_rate":0,"duration_fit_rate":1,"exact_duration_max_share":0.1,
    "timing_template_duplicate_rate":0,"approved_critic_pass_rate":1,"approved_hook_first_frame_rate":1,
    "approved_proof_payoff_rate":1,"creative_distribution_passed":true,"embedded_count":50,
    "critic_record_count":50,"current_gate_count":50,"fresh_snapshot_count":50}'::jsonb;
  metrics jsonb;
  key text;
  writer_id uuid := gen_random_uuid();
  critic_id uuid := gen_random_uuid();
  replacement_id uuid := gen_random_uuid();
  evaluation_id uuid := gen_random_uuid();
  alias_name text := 'critic-' || replace(critic_id::text,'-','');
  writer public.idea_model_profiles;
  critic public.idea_model_profiles;
begin
  select jsonb_build_object('category_metrics',jsonb_object_agg(lane,good)) into metrics
    from unnest(array['beauty','fashion','commerce_affiliate','creator_education','entertainment_comedy',
      'fitness_wellness_safe','food','lifestyle','luxury','parenting_family','thought_leadership','travel']) lane;
  if not public.automatic_qualification_categories_valid(metrics) then raise exception 'Valid category controls failed'; end if;
  if public.automatic_qualification_categories_valid(jsonb_set(metrics,'{category_metrics,travel,safe_approve_rate}','0')) then
    raise exception 'Other lanes masked zero travel approvals'; end if;
  if public.automatic_qualification_categories_valid(metrics #- '{category_metrics,travel}') then raise exception 'Missing category passed'; end if;
  if public.automatic_qualification_categories_valid(jsonb_set(metrics,'{category_metrics,unknown}',good)) then raise exception 'Unknown category passed'; end if;
  for key in select jsonb_object_keys(good) loop
    if public.automatic_qualification_categories_valid(jsonb_set(metrics,'{category_metrics,travel}',good-key)) then
      raise exception 'Missing per-lane metric passed: %',key; end if;
  end loop;
  if public.automatic_qualification_quality_metrics_valid(good || '{"safe_approve_rate":"1"}',50) then raise exception 'String metric passed'; end if;

  insert into public.idea_model_profiles(id,profile_slug,provider,protocol,model,api_key_env_var)
    values(critic_id,alias_name,'fixture','json_text','critic-a','VIRALBOX_MODEL_PROVIDER_TEST'),
      (replacement_id,'replacement-'||replace(replacement_id::text,'-',''),'fixture','json_text','critic-b','VIRALBOX_MODEL_PROVIDER_TEST');
  insert into public.idea_model_profiles(id,profile_slug,provider,protocol,model,api_key_env_var,features)
    values(writer_id,'writer-'||replace(writer_id::text,'-',''),'fixture','json_text','writer','VIRALBOX_MODEL_PROVIDER_TEST',jsonb_build_object('critic_profile_slug',alias_name));
  insert into public.idea_model_qualification_evals(id,model_profile_id,prompt_version,schema_version,quality_gate_version,brief_count,status)
    values(evaluation_id,writer_id,'idea-card-premium-v3.0.0-automatic',2,'quality-gate-v3.0.0-automatic',600,'completed');
  select * into critic from public.idea_model_profiles where id=critic_id;
  -- A prior approved-profile fixture exercises invalidation, not real qualification.
  update public.idea_model_profiles set qualification_status='approved',qualified_prompt_version='idea-card-premium-v3.0.0-automatic',
    qualified_schema_version=2,qualified_quality_gate_version='quality-gate-v3.0.0-automatic',qualification_eval_id=evaluation_id,
    qualification_metrics=jsonb_build_object('critic_profile_id',critic_id,'critic_snapshot',public.idea_model_contract(critic))
    where id=writer_id returning * into writer;
  if not public.qualified_critic_matches(writer,critic) then raise exception 'Bound critic fixture failed'; end if;
  select * into critic from public.idea_model_profiles where id=replacement_id;
  if public.qualified_critic_matches(writer,critic) then raise exception 'Replacement critic passed old qualification'; end if;
  update public.idea_model_profiles set profile_slug=alias_name||'-old' where id=critic_id;
  if (select qualification_status from public.idea_model_profiles where id=writer_id)<>'shadow' then raise exception 'Critic rename did not invalidate writer'; end if;
  update public.idea_model_profiles set profile_slug=alias_name where id=replacement_id;
  if (select qualification_status from public.idea_model_profiles where id=writer_id)<>'shadow' then raise exception 'Alias reuse resurrected writer'; end if;
  raise notice 'Per-category metrics and critic identity regressions passed';
end $qualification$;

do $recovery$
declare
  category_id uuid := gen_random_uuid();
  persona_id uuid := gen_random_uuid();
  batch_id uuid := gen_random_uuid();
  run_a uuid := gen_random_uuid();
  run_b uuid := gen_random_uuid();
  run_c uuid := gen_random_uuid();
  orphan_id uuid := gen_random_uuid();
  card_id uuid;
  category_slug text := 'integrity-'||replace(category_id::text,'-','');
  persona_slug text := 'integrity-'||replace(persona_id::text,'-','');
  recipe jsonb := '{"taxonomyVersion":"creative-taxonomy-v1","hookTypeId":"visible_constraint","genreId":"controlled_comparison", "hookDeliveryId":"visual_action","promiseTypeId":"compare_choices","emotionArcId":"curiosity_to_clarity","vibePresetId":"clean_editorial","proofDeviceId":"controlled_side_by_side","payoffTypeId":"side_by_side_decision","audienceActionId":"save_reference","shootFormat":"talking_head","presenceMode":"editorial_insider"}'::jsonb;
  signature text;
  candidate jsonb;
  card jsonb;
  result jsonb;
begin
  signature:=public.creative_signature_from_recipe_v2(recipe);
  if signature is distinct from 'creative-signature-v2:["creative-taxonomy-v1","visible_constraint","controlled_comparison","visual_action","compare_choices","curiosity_to_clarity","clean_editorial","controlled_side_by_side","side_by_side_decision","save_reference","talking_head","editorial_insider"]' then
    raise exception 'SQL and TypeScript canonical identities drifted'; end if;
  insert into public.categories(id,slug,name,family) values(category_id,category_slug,'Integrity fixture','fixture');
  insert into public.creator_personas(id,slug,name) values(persona_id,persona_slug,'Integrity fixture');
  insert into public.idea_generation_batches(id,external_batch_id,category_id,persona_id,target_count,language)
    values(batch_id,'integrity-'||batch_id,category_id,persona_id,1,'en');
  insert into public.idea_generation_runs(id,generation_batch_id,profile_slug,provider,protocol,model,prompt_version,taxonomy_version,requested_count,candidate_multiplier,request_key,lease_expires_at)
    select r,batch_id,'fixture','fixture','json_text','fixture','idea-card-premium-v3.0.0-automatic','creative-taxonomy-v1',1,5,gen_random_uuid(),now()+interval '10 minutes'
    from unnest(array[run_a,run_b,run_c]) r;
  if not public.reserve_idea_creative_signature(run_a,batch_id,category_id,persona_id,'instagram_reels',signature) then raise exception 'Initial claim failed'; end if;
  if not public.reserve_idea_creative_signature(run_a,batch_id,category_id,persona_id,'instagram_reels',signature) then raise exception 'Owner replay failed'; end if;
  if public.reserve_idea_creative_signature(run_b,batch_id,category_id,persona_id,'instagram_reels',signature) then raise exception 'Live ownership stolen'; end if;
  if public.release_pending_idea_creative_signatures(run_a)<>0 then raise exception 'Live ownership released'; end if;
  update public.idea_generation_runs set status='failed' where id=run_a;
  if public.release_pending_idea_creative_signatures(run_a)<>1 then raise exception 'Failed draft reservation leaked'; end if;
  if not public.reserve_idea_creative_signature(run_b,batch_id,category_id,persona_id,'instagram_reels',signature) then raise exception 'Retry could not reclaim signature'; end if;

  candidate:=jsonb_build_object('user_id',null,'generation_batch_id',batch_id,'category_id',category_id,'persona_id',persona_id,
    'platform','instagram_reels','format','Reels','language','en','locale','US','title','Integrity comparison','one_sentence_premise','Compare two objects fairly.',
    'mechanism_ids','[]'::jsonb,'hook_options','[]'::jsonb,'story_beats','[]'::jsonb,'comedy_remix','{}'::jsonb,'human_awareness','{}'::jsonb,
    'production_requirements','{}'::jsonb,'safety_status','SAFE','perspective_prism_status','PASS','confidence_band','MEDIUM','status','draft',
    'external_idea_id',run_b::text||'_001','content_style_layers','[]'::jsonb,'candidate_source','admin_direct',
    'decision_trace',jsonb_build_object('import_source','verified_generation','generation',jsonb_build_object('run_id',run_b,
      'prompt_version','idea-card-premium-v3.0.0-automatic','pipeline_version','generation-pipeline-v3.1.1','creative_recipe',recipe,'creative_signature',signature),
      'generation_gate',jsonb_build_object('final_decision','approve')));
  card:=jsonb_build_object('schemaVersion',2,'title','Integrity comparison','category',category_slug,'personaSlug',persona_slug,
    'platform','instagram_reels','hookId',recipe->>'hookTypeId','shootFormat',recipe->>'shootFormat','presenceMode',recipe->>'presenceMode',
    'steps','[{"action":"Show both objects"},{"action":"Compare both objects"},{"action":"Show the result"}]'::jsonb);
  begin
    perform public.import_generated_idea_card(run_b,candidate,jsonb_set(card,'{category}','"wrong-lane"'));
    raise exception 'Wrong-lane card imported';
  exception when check_violation then null; end;
  if exists(select 1 from public.idea_candidates where generation_batch_id=batch_id) then raise exception 'Failed atomic import left candidate'; end if;
  card_id:=public.import_generated_idea_card(run_b,candidate,card);
  if public.import_generated_idea_card(run_b,candidate,card)<>card_id then raise exception 'Atomic replay created second card'; end if;
  if (select count(*) from public.idea_cards where idea_id=card_id)<>1 then raise exception 'Atomic card missing'; end if;
  begin
    perform public.import_generated_idea_card(run_b,candidate,card||'{"title":"Changed replay"}');
    raise exception 'Changed replay accepted';
  exception when check_violation then null; end;
  update public.idea_generation_runs set status='failed',imported_count=0 where id=run_b;
  result:=public.reconcile_idea_generation_run(run_b,false);
  if result->>'status'<>'partial' or (result->>'imported_count')::integer<>1 then raise exception 'Post-import failure lost committed evidence'; end if;
  if public.reconcile_idea_generation_run(run_b,false) is distinct from result then raise exception 'Recovery replay changed result'; end if;
  if public.release_pending_idea_creative_signatures(run_b)<>0 then raise exception 'Committed signature released'; end if;
  if public.reserve_idea_creative_signature(run_c,batch_id,category_id,persona_id,'instagram_reels',signature) then raise exception 'Committed signature reused'; end if;

  insert into public.idea_candidates(id,generation_batch_id,category_id,persona_id,platform,format,language,title,one_sentence_premise,decision_trace)
    values(orphan_id,batch_id,category_id,persona_id,'instagram_reels','Reels','en','Interrupted import','Interrupted fixture',
      jsonb_build_object('import_source','verified_generation','generation',jsonb_build_object('run_id',run_c)));
  update public.idea_generation_runs set status='failed' where id=run_c;
  perform public.reconcile_idea_generation_batch(batch_id);
  if exists(select 1 from public.idea_candidates where id=orphan_id) then raise exception 'Orphan still consumes capacity'; end if;
  if not exists(select 1 from public.idea_candidates where id=card_id) then raise exception 'Recovery removed complete card'; end if;
  if has_function_privilege('authenticated','public.import_generated_idea_card(uuid,jsonb,jsonb)','EXECUTE') then raise exception 'Creator can call private import RPC'; end if;
  raise notice 'Leased reservations, atomic import/replay, recovery and orphan regressions passed';
end $recovery$;
rollback;