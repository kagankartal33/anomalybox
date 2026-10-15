-- Qualification evidence must be an isolated, frozen run set. A selected good
-- subset cannot hide another run from the same qualification batch.
create or replace function public.automatic_qualification_run_set_isolated(
  p_profile public.idea_model_profiles, p_eval_id uuid
) returns boolean language sql stable set search_path = public as $$
  select coalesce((
    select
      e.model_profile_id = p_profile.id
      and e.prompt_version = 'idea-card-premium-v3.0.0-automatic'
      and e.schema_version = 2
      and e.quality_gate_version = 'quality-gate-v3.0.1-automatic'
      and cardinality(e.generation_run_ids) > 0
      and not exists (
        select 1 from public.idea_generation_runs r
        where r.model_profile_id = p_profile.id
          and r.prompt_version = 'idea-card-premium-v3.0.0-automatic'
          and r.generation_batch_id in (
            select selected.generation_batch_id from public.idea_generation_runs selected
            where selected.id = any(e.generation_run_ids)
          )
          and (
            not (r.id = any(e.generation_run_ids))
            or r.status in ('queued', 'running')
            or r.metadata->'generator_snapshot' is distinct from public.idea_model_contract(p_profile)
            or r.metadata->>'pipeline_version' is distinct from 'generation-pipeline-v3.1.2'
            or r.metadata->>'scheduler_version' is distinct from 'creative-scheduler-v2.1'
            or r.metadata->>'critic_profile_id' is distinct from p_profile.qualification_metrics->>'critic_profile_id'
          )
      )
    from public.idea_model_qualification_evals e
    where e.id = p_eval_id
  ), false)
$$;

create or replace function public.guard_automatic_profile_qualification_isolation()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.qualification_status = 'approved'
    and new.qualification_metrics->>'qualification_mode' = 'automatic-v3'
    and new.qualification_metrics->>'pipeline_version' = 'generation-pipeline-v3.1.2'
    and not public.automatic_qualification_run_set_isolated(new, new.qualification_eval_id) then
    raise exception 'Automatic qualification requires an isolated current run set' using errcode = '23514';
  end if;
  return new;
end $$;

drop trigger if exists idea_model_profiles_automatic_qualification_isolation on public.idea_model_profiles;
create trigger idea_model_profiles_automatic_qualification_isolation
before insert or update of qualification_status, qualification_metrics, qualification_eval_id on public.idea_model_profiles
for each row execute function public.guard_automatic_profile_qualification_isolation();

revoke all on function public.automatic_qualification_run_set_isolated(public.idea_model_profiles, uuid) from public, anon, authenticated;
grant execute on function public.automatic_qualification_run_set_isolated(public.idea_model_profiles, uuid) to service_role;
