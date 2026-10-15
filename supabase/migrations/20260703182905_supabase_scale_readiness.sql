-- Supabase scale readiness for ViralBox:
-- - Keep creator-facing reads fast as inventory grows.
-- - Keep box delivery atomic but cheaper to plan.
-- - Prepare a durable internal job table for Railway/background workers.

create extension if not exists pg_stat_statements with schema extensions;
create schema if not exists pgmq;
create extension if not exists pgmq with schema pgmq;

create index if not exists idea_inventory_available_delivery_idx
on public.idea_inventory (
  category_id,
  persona_id,
  score_band,
  reuse_count asc,
  internal_rank_score desc,
  published_at asc
)
include (idea_id, max_reuse_count)
where status = 'available';

create index if not exists idea_inventory_stock_cards_route_idx
on public.idea_inventory (category_id, persona_id)
where (metadata ->> 'external_batch_id') like 'stock\_cards\_%' escape '\';

create index if not exists idea_inventory_recent_route_idx
on public.idea_inventory (category_id, persona_id, published_at desc)
where status = 'available';

create index if not exists idea_candidates_batch_work_idx
on public.idea_candidates (generation_batch_id, status, id)
include (category_id, persona_id, platform, language)
where generation_batch_id is not null;

create index if not exists idea_quality_checks_batch_work_idx
on public.idea_quality_checks (generation_batch_id, decision, id)
include (
  idea_id,
  category_id,
  persona_id,
  editorial_quality_score,
  premium_completeness_score,
  creator_fit_score,
  platform_fit_score,
  brand_safety_score
)
where generation_batch_id is not null;

create index if not exists idea_cards_card_gin_idx
on public.idea_cards
using gin (card jsonb_path_ops);

create index if not exists idea_box_items_idea_user_idx
on public.idea_box_items (idea_id, user_id, created_at desc);

do $$
begin
  create type public.internal_job_status as enum (
    'queued',
    'running',
    'succeeded',
    'failed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.internal_background_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  queue_name text not null default 'default',
  status public.internal_job_status not null default 'queued',
  priority integer not null default 100,
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  locked_by text,
  locked_until timestamptz,
  last_error text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint internal_background_jobs_attempts_chk check (attempts >= 0 and max_attempts >= 1),
  constraint internal_background_jobs_priority_chk check (priority >= 0)
);

create unique index if not exists internal_background_jobs_idempotency_uidx
on public.internal_background_jobs (idempotency_key)
where idempotency_key is not null;

create index if not exists internal_background_jobs_poll_idx
on public.internal_background_jobs (queue_name, status, scheduled_at, priority, created_at)
where status = 'queued';

create index if not exists internal_background_jobs_running_idx
on public.internal_background_jobs (locked_until, started_at)
where status = 'running';

drop trigger if exists internal_background_jobs_set_updated_at on public.internal_background_jobs;
create trigger internal_background_jobs_set_updated_at
before update on public.internal_background_jobs
for each row
execute function public.set_updated_at();

alter table public.internal_background_jobs enable row level security;

revoke all privileges on public.internal_background_jobs from public, anon, authenticated;
grant all privileges on public.internal_background_jobs to service_role;
