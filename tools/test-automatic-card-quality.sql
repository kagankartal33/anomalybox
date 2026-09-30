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
    if sqlerrm not like 'Current automatic card evidence required%' then raise; end if;
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
  values(eval_id, profile_id, 'idea-card-premium-v2.3-automatic', 2, 'quality-gate-v2.3-automatic', 250,
    '{"beauty":50,"entertainment_comedy":50,"travel":50,"fitness_wellness_safe":50,"food":50}'::jsonb,
    '{"qualification_mode":"automatic-v1","regression_version":"automatic-quality-regression-v1",
      "regression_passed":true,"regression_case_count":16,"evaluated_count":250,"embedded_count":250,
      "critic_record_count":250,"current_gate_count":250,"fresh_snapshot_count":250,
      "schema_pass_rate":1,"safe_approve_rate":1,"approved_average":99,"approved_critic_pass_rate":1,
      "duplicate_rate_078":0,"banned_residue_rate":0,"duration_fit_rate":1,
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
rollback;