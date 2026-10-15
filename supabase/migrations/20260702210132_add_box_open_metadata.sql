alter table public.idea_box_deliveries
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idea_box_deliveries_opened_idx
on public.idea_box_deliveries(user_id, ((metadata ->> 'opened_at')), created_at desc);
