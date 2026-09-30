-- Duration planning and production-time calibration for card quality v2.2.1.

alter table public.idea_card_feedback
  add column if not exists actual_capture_minutes integer;

alter table public.idea_card_feedback
  drop constraint if exists idea_card_feedback_capture_minutes_requires_shot_check;

alter table public.idea_card_feedback
  add constraint idea_card_feedback_capture_minutes_requires_shot_check
  check (
    actual_capture_minutes is null or
    (shot_status = 'shot' and actual_capture_minutes between 1 and 1440)
  );

create or replace view public.idea_creator_feedback_lane_summary
with (security_invoker = true)
as
select
  c.category_id,
  c.persona_id,
  c.platform,
  c.language,
  count(*) filter (where f.shot_status = 'shot' and f.rating is not null) as shot_rating_count,
  avg(f.rating) filter (where f.shot_status = 'shot' and f.rating is not null) as average_shot_rating,
  count(*) filter (where f.shot_status = 'shot' and f.actual_capture_minutes is not null) as capture_time_sample_count,
  avg(f.actual_capture_minutes) filter (where f.shot_status = 'shot' and f.actual_capture_minutes is not null) as average_capture_minutes,
  case
    when count(*) filter (where f.shot_status = 'shot' and f.rating is not null) < 20 then 0::numeric
    else greatest(-5::numeric, least(5::numeric,
      (avg(f.rating) filter (where f.shot_status = 'shot' and f.rating is not null) - 3) * 2.5
    ))
  end as quality_adjustment
from public.idea_card_feedback f
join public.idea_candidates c on c.id = f.idea_id
group by c.category_id, c.persona_id, c.platform, c.language;

revoke all privileges on public.idea_creator_feedback_lane_summary from public, anon, authenticated;
grant select on public.idea_creator_feedback_lane_summary to service_role;

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
    coalesce((v_metrics->>'exact_duration_max_share')::numeric, 1) <= 0.20 and
    coalesce((v_metrics->>'timing_template_duplicate_rate')::numeric, 1) = 0;

  update public.idea_model_profiles
  set qualification_status = case when v_pass then 'approved' else 'shadow' end,
      qualification_metrics = v_metrics || jsonb_build_object('qualification_eval_id', p_eval_id),
      updated_at = now()
  where id = v_profile_id;
  return jsonb_build_object('profile_slug', p_profile_slug, 'qualified', v_pass, 'status', case when v_pass then 'approved' else 'shadow' end);
end;
$$;

revoke all on function public.qualify_idea_model_profile(text, uuid) from public, anon, authenticated;
grant execute on function public.qualify_idea_model_profile(text, uuid) to service_role;

insert into public.admin_configs(namespace, version, config, enabled)
values (
  'quality.duration',
  '2.2.1',
  '{
    "planner_version": "duration-planner-v1",
    "production_estimate_version": "production-estimate-v1-uncalibrated",
    "runtime_seconds_min": 10,
    "runtime_seconds_max": 60,
    "duration_fit_rate_min": 0.95,
    "exact_duration_max_share": 0.20,
    "capture_calibration_min_samples": 20
  }'::jsonb,
  true
)
on conflict (namespace, version) do update
set config = excluded.config, enabled = excluded.enabled;