create table if not exists public.idea_creative_signature_reservations (
  id uuid primary key default gen_random_uuid(),
  generation_run_id uuid not null references public.idea_generation_runs(id) on delete cascade,
  generation_batch_id uuid not null references public.idea_generation_batches(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  persona_id uuid not null references public.creator_personas(id) on delete cascade,
  platform text not null,
  creative_signature text not null,
  created_at timestamptz not null default now(),
  unique (category_id, persona_id, platform, creative_signature)
);

create index if not exists idea_creative_signature_reservations_run_idx
on public.idea_creative_signature_reservations(generation_run_id);

alter table public.idea_creative_signature_reservations enable row level security;
revoke all privileges on public.idea_creative_signature_reservations from public, anon, authenticated;
grant all privileges on public.idea_creative_signature_reservations to service_role;

create or replace function public.reserve_idea_creative_signature(
  p_run_id uuid,
  p_batch_id uuid,
  p_category_id uuid,
  p_persona_id uuid,
  p_platform text,
  p_signature text
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  reserved_id uuid;
begin
  if nullif(btrim(p_platform), '') is null or nullif(btrim(p_signature), '') is null then
    raise exception 'Platform and creative signature are required' using errcode = '22023';
  end if;

  insert into public.idea_creative_signature_reservations(
    generation_run_id, generation_batch_id, category_id, persona_id, platform, creative_signature
  ) values (
    p_run_id, p_batch_id, p_category_id, p_persona_id, btrim(p_platform), btrim(p_signature)
  )
  on conflict (category_id, persona_id, platform, creative_signature) do nothing
  returning id into reserved_id;

  return reserved_id is not null;
end
$$;

revoke all on function public.reserve_idea_creative_signature(uuid, uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.reserve_idea_creative_signature(uuid, uuid, uuid, uuid, text, text) to service_role;