-- ============================================================================
-- SOURCE LEDGER & PROVENANCE MIGRATION
-- Tracks source IDs, licenses, human editorial approval, and fact-checks
-- to comply with Google Helpful Content & Scaled Content Abuse policies.
-- ============================================================================

create table if not exists public.source_ledger (
  source_id text primary key,
  title text not null,
  url text default null,
  owner text not null,
  license_status text not null check (license_status in ('owned', 'approved', 'public_domain', 'reference_only')),
  access_date date not null default current_date,
  allowed_for_training boolean not null default true,
  human_fact_checked boolean not null default false,
  notes text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookup during training provenance audits
create index if not exists idx_source_ledger_allowed on public.source_ledger(allowed_for_training);

-- Seed initial internal source ledgers
insert into public.source_ledger (source_id, title, url, owner, license_status, allowed_for_training, human_fact_checked, notes)
values
  ('SRC-0001', 'Internal Editorial SEO Book Set', null, 'ViralBox / Anomaly Box', 'owned', true, true, '12 SEO & Content Strategy Books'),
  ('SRC-0002', 'Ultimate Comedy Master System', null, 'ViralBox', 'owned', true, true, 'Zero-loss merged comedy & humor dataset'),
  ('SRC-0003', '900K Creator Registry & Personas', null, 'ViralBox', 'owned', true, true, 'Influencer personas and viral idea algorithms'),
  ('SRC-0004', 'Google Helpful Content & Spam Policies', 'https://developers.google.com/search/docs/essentials/spam-policies', 'Google', 'reference_only', false, true, 'Used for rule extraction only; no text copying'),
  ('SRC-0005', 'Hugging Face Marketing Prompts 2026', 'https://huggingface.co/datasets/MuratcanKoylan/MarketingStructuralPrompts', 'Hugging Face / Open Data', 'public_domain', true, true, 'Marketing & copywriting structural prompts')
on conflict (source_id) do update set
  title = excluded.title,
  license_status = excluded.license_status,
  allowed_for_training = excluded.allowed_for_training,
  human_fact_checked = excluded.human_fact_checked,
  updated_at = now();

alter table public.source_ledger enable row level security;
revoke all on table public.source_ledger from public;
grant select on table public.source_ledger to anon, authenticated, service_role;
