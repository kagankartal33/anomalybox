-- Bind provider approval to the exact prompt, schema and quality-gate contract.

alter table public.idea_model_qualification_evals
  add column if not exists quality_gate_version text;

alter table public.idea_model_profiles
  add column if not exists qualified_prompt_version text,
  add column if not exists qualified_schema_version integer,
  add column if not exists qualified_quality_gate_version text,
  add column if not exists qualification_eval_id uuid
    references public.idea_model_qualification_evals(id) on delete set null;

update public.idea_model_profiles
set enabled = false,
    qualification_status = 'shadow',
    qualification_metrics = '{}'::jsonb,
    qualified_prompt_version = null,
    qualified_schema_version = null,
    qualified_quality_gate_version = null,
    qualification_eval_id = null,
    updated_at = now()
where api_key_env_var !~ '^VIRALBOX_MODEL_PROVIDER_[A-Z0-9_]{2,96}$';

alter table public.idea_model_profiles
  drop constraint if exists idea_model_profiles_api_key_env_var_check;

alter table public.idea_model_profiles
  drop constraint if exists idea_model_profiles_provider_secret_allowlist_check;

alter table public.idea_model_profiles
  add constraint idea_model_profiles_provider_secret_allowlist_check
  check (not enabled or api_key_env_var ~ '^VIRALBOX_MODEL_PROVIDER_[A-Z0-9_]{2,96}$');

-- Older approvals did not prove the full v2.2.1 runtime contract.
update public.idea_model_profiles
set qualification_status = 'shadow',
    qualification_metrics = '{}'::jsonb,
    qualified_prompt_version = null,
    qualified_schema_version = null,
    qualified_quality_gate_version = null,
    qualification_eval_id = null,
    updated_at = now()
where qualification_status = 'approved'
  and (
    qualified_prompt_version is distinct from 'idea-card-premium-v2.2.1-duration' or
    qualified_schema_version is distinct from 2 or
    qualified_quality_gate_version is distinct from 'quality-gate-v2.2.1-duration' or
    qualification_eval_id is null
  );

alter table public.idea_model_profiles
  drop constraint if exists idea_model_profiles_approved_contract_check;

alter table public.idea_model_profiles
  add constraint idea_model_profiles_approved_contract_check check (
    qualification_status <> 'approved' or (
      qualified_prompt_version is not null and
      qualified_schema_version is not null and
      qualified_quality_gate_version is not null and
      qualification_eval_id is not null
    )
  );

create or replace function public.reset_model_profile_qualification_on_contract_change()
returns trigger
language plpgsql
as $$
begin
  if row(new.provider, new.protocol, new.model, new.base_url, new.api_key_env_var, new.features)
     is distinct from
     row(old.provider, old.protocol, old.model, old.base_url, old.api_key_env_var, old.features) then
    new.qualification_status := 'shadow';
    new.qualification_metrics := '{}'::jsonb;
    new.qualified_prompt_version := null;
    new.qualified_schema_version := null;
    new.qualified_quality_gate_version := null;
    new.qualification_eval_id := null;
  end if;
  return new;
end;
$$;

create or replace function public.qualify_idea_model_profile(p_profile_slug text, p_eval_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pass boolean;
  v_profile_id uuid;
  v_eval public.idea_model_qualification_evals%rowtype;
  v_metrics jsonb;
begin
  select id into v_profile_id
  from public.idea_model_profiles
  where profile_slug = p_profile_slug and enabled = true;
  if v_profile_id is null then raise exception 'enabled model profile not found: %', p_profile_slug; end if;

  select * into v_eval
  from public.idea_model_qualification_evals
  where id = p_eval_id and model_profile_id = v_profile_id and status = 'completed';
  if not found then raise exception 'completed qualification eval not found for profile: %', p_profile_slug; end if;
  v_metrics := v_eval.metrics;

  v_pass :=
    v_eval.prompt_version = 'idea-card-premium-v2.2.1-duration' and
    v_eval.schema_version = 2 and
    v_eval.quality_gate_version = 'quality-gate-v2.2.1-duration' and
    v_eval.brief_count >= 250 and
    coalesce((v_eval.category_counts->>'beauty')::integer, 0) >= 50 and
    coalesce((v_eval.category_counts->>'entertainment_comedy')::integer, 0) >= 50 and
    coalesce((v_eval.category_counts->>'travel')::integer, 0) >= 50 and
    coalesce((v_eval.category_counts->>'fitness_wellness_safe')::integer, 0) >= 50 and
    coalesce((v_eval.category_counts->>'food')::integer, 0) >= 50 and
    coalesce((v_metrics->>'schema_pass_rate')::numeric, 0) >= 0.98 and
    coalesce((v_metrics->>'safe_approve_rate')::numeric, 0) >= 0.55 and
    coalesce((v_metrics->>'approved_average')::numeric, 0) >= 88 and
    coalesce((v_metrics->>'duplicate_rate_078')::numeric, 1) <= 0.05 and
    coalesce((v_metrics->>'banned_residue_rate')::numeric, 1) <= 0.01 and
    coalesce((v_metrics->>'gold_gate_agreement')::numeric, 0) >= 0.85 and
    coalesce((v_metrics->>'human_rank_spearman')::numeric, 0) >= 0.60 and
    coalesce((v_metrics->>'duration_fit_rate')::numeric, 0) >= 0.95 and
    coalesce((v_metrics->>'human_runtime_fit_rate')::numeric, 0) >= 0.85 and
    coalesce((v_metrics->>'human_runtime_rated_count')::integer, 0) >= 200 and
    coalesce((v_metrics->>'exact_duration_max_share')::numeric, 1) <= 0.20 and
    coalesce((v_metrics->>'timing_template_duplicate_rate')::numeric, 1) = 0 and
    coalesce((v_metrics#>>'{gold_category_counts,beauty}')::integer, 0) >= 40 and
    coalesce((v_metrics#>>'{gold_category_counts,entertainment_comedy}')::integer, 0) >= 40 and
    coalesce((v_metrics#>>'{gold_category_counts,travel}')::integer, 0) >= 40 and
    coalesce((v_metrics#>>'{gold_category_counts,fitness_wellness_safe}')::integer, 0) >= 40 and
    coalesce((v_metrics#>>'{gold_category_counts,food}')::integer, 0) >= 40 and
    coalesce((v_metrics#>>'{gold_source_counts,beauty,existing_stock}')::integer, 0) >= 20 and
    coalesce((v_metrics#>>'{gold_source_counts,beauty,generated}')::integer, 0) >= 20 and
    coalesce((v_metrics#>>'{gold_source_counts,entertainment_comedy,existing_stock}')::integer, 0) >= 20 and
    coalesce((v_metrics#>>'{gold_source_counts,entertainment_comedy,generated}')::integer, 0) >= 20 and
    coalesce((v_metrics#>>'{gold_source_counts,travel,existing_stock}')::integer, 0) >= 20 and
    coalesce((v_metrics#>>'{gold_source_counts,travel,generated}')::integer, 0) >= 20 and
    coalesce((v_metrics#>>'{gold_source_counts,fitness_wellness_safe,existing_stock}')::integer, 0) >= 20 and
    coalesce((v_metrics#>>'{gold_source_counts,fitness_wellness_safe,generated}')::integer, 0) >= 20 and
    coalesce((v_metrics#>>'{gold_source_counts,food,existing_stock}')::integer, 0) >= 20 and
    coalesce((v_metrics#>>'{gold_source_counts,food,generated}')::integer, 0) >= 20;

  update public.idea_model_profiles
  set qualification_status = case when v_pass then 'approved' else 'shadow' end,
      qualification_metrics = v_metrics || jsonb_build_object(
        'qualification_eval_id', p_eval_id,
        'qualified_prompt_version', v_eval.prompt_version,
        'qualified_schema_version', v_eval.schema_version,
        'qualified_quality_gate_version', v_eval.quality_gate_version
      ),
      qualified_prompt_version = case when v_pass then v_eval.prompt_version else null end,
      qualified_schema_version = case when v_pass then v_eval.schema_version else null end,
      qualified_quality_gate_version = case when v_pass then v_eval.quality_gate_version else null end,
      qualification_eval_id = case when v_pass then p_eval_id else null end,
      updated_at = now()
  where id = v_profile_id;

  return jsonb_build_object(
    'profile_slug', p_profile_slug,
    'qualified', v_pass,
    'status', case when v_pass then 'approved' else 'shadow' end,
    'prompt_version', v_eval.prompt_version,
    'schema_version', v_eval.schema_version,
    'quality_gate_version', v_eval.quality_gate_version
  );
end;
$$;

revoke all on function public.qualify_idea_model_profile(text, uuid) from public, anon, authenticated;
grant execute on function public.qualify_idea_model_profile(text, uuid) to service_role;

create or replace function public.quarantine_idea_inventory_v2_2(
  p_inventory_id uuid,
  p_reasons text[],
  p_score numeric
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.idea_inventory inventory
  set status = 'paused'::public.inventory_status,
      metadata = coalesce(inventory.metadata, '{}'::jsonb) || jsonb_build_object(
        'pause_reason', 'quality_quarantine_v2_2',
        'quality_quarantine_at', now(),
        'quality_quarantine_reasons', coalesce(to_jsonb(p_reasons), '[]'::jsonb),
        'quality_quarantine_score', p_score
      ),
      updated_at = now()
  where inventory.id = p_inventory_id
    and inventory.status = 'available'::public.inventory_status
    and inventory.reuse_count = 0
    and not exists (
      select 1 from public.idea_box_items delivered
      where delivered.inventory_id = inventory.id or delivered.idea_id = inventory.idea_id
    )
    and not exists (
      select 1 from public.checkout_inventory_reservations reserved
      where reserved.status = 'active'
        and (reserved.inventory_id = inventory.id or reserved.idea_id = inventory.idea_id)
    );
  return found;
end;
$$;

create or replace function public.rollback_idea_inventory_v2_2(p_inventory_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.idea_inventory inventory
  set status = 'available'::public.inventory_status,
      metadata = (coalesce(inventory.metadata, '{}'::jsonb) - 'pause_reason') || jsonb_build_object(
        'quality_quarantine_rolled_back_at', now()
      ),
      updated_at = now()
  where inventory.id = p_inventory_id
    and inventory.status = 'paused'::public.inventory_status
    and inventory.reuse_count = 0
    and inventory.metadata->>'pause_reason' = 'quality_quarantine_v2_2'
    and not exists (
      select 1 from public.idea_box_items delivered
      where delivered.inventory_id = inventory.id or delivered.idea_id = inventory.idea_id
    )
    and not exists (
      select 1 from public.checkout_inventory_reservations reserved
      where reserved.status = 'active'
        and (reserved.inventory_id = inventory.id or reserved.idea_id = inventory.idea_id)
    );
  return found;
end;
$$;

revoke all on function public.quarantine_idea_inventory_v2_2(uuid, text[], numeric) from public, anon, authenticated;
revoke all on function public.rollback_idea_inventory_v2_2(uuid) from public, anon, authenticated;
grant execute on function public.quarantine_idea_inventory_v2_2(uuid, text[], numeric) to service_role;
grant execute on function public.rollback_idea_inventory_v2_2(uuid) to service_role;
