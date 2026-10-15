create table if not exists public.atelier_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  instagram_handle text,
  desired_effect text not null,
  project_context text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists atelier_leads_status_created_idx
on public.atelier_leads(status, created_at desc);

drop trigger if exists atelier_leads_set_updated_at on public.atelier_leads;
create trigger atelier_leads_set_updated_at
before update on public.atelier_leads
for each row execute function public.set_updated_at();

alter table public.atelier_leads enable row level security;

revoke all privileges on public.atelier_leads from public, anon, authenticated;
grant all privileges on public.atelier_leads to service_role;
