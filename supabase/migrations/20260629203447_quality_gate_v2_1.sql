create extension if not exists vector;

alter table public.idea_quality_checks
  add column if not exists embedding_duplicate_score numeric(5,4) not null default 0 check (embedding_duplicate_score >= 0 and embedding_duplicate_score <= 1),
  add column if not exists lexical_signature jsonb not null default '{}'::jsonb,
  add column if not exists claim_evidence_status text not null default 'not_required'
    check (claim_evidence_status in ('not_required', 'missing', 'provided', 'needs_review')),
  add column if not exists performance_calibrated_score numeric(5,2) not null default 50 check (performance_calibrated_score between 0 and 100),
  add column if not exists second_opinion_required boolean not null default false,
  add column if not exists second_opinion_reasons text[] not null default '{}';

create table if not exists public.idea_semantic_embeddings (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null unique references public.idea_candidates(id) on delete cascade,
  embedding_model text not null default 'pending',
  embedding vector(384),
  source_text_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idea_semantic_embeddings_idea_idx
on public.idea_semantic_embeddings(idea_id);

create index if not exists idea_semantic_embeddings_vector_idx
on public.idea_semantic_embeddings
using hnsw (embedding vector_cosine_ops)
where embedding is not null;

create trigger idea_semantic_embeddings_set_updated_at
before update on public.idea_semantic_embeddings
for each row execute function public.set_updated_at();

alter table public.idea_semantic_embeddings enable row level security;

revoke all privileges on public.idea_semantic_embeddings from public, anon, authenticated;
grant all privileges on public.idea_semantic_embeddings to service_role;

create table if not exists public.idea_claim_evidence (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.idea_candidates(id) on delete cascade,
  generation_batch_id uuid references public.idea_generation_batches(id) on delete cascade,
  claim_type text not null,
  claim_text text not null,
  evidence_url text,
  evidence_status text not null default 'missing'
    check (evidence_status in ('missing', 'provided', 'needs_review')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idea_claim_evidence_idea_claim_uidx
on public.idea_claim_evidence(idea_id, claim_type, claim_text);

create index if not exists idea_claim_evidence_batch_status_idx
on public.idea_claim_evidence(generation_batch_id, evidence_status);

create trigger idea_claim_evidence_set_updated_at
before update on public.idea_claim_evidence
for each row execute function public.set_updated_at();

alter table public.idea_claim_evidence enable row level security;

revoke all privileges on public.idea_claim_evidence from public, anon, authenticated;
grant all privileges on public.idea_claim_evidence to service_role;

create table if not exists public.idea_performance_feedback (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.idea_candidates(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  persona_id uuid references public.creator_personas(id) on delete set null,
  platform text not null default 'instagram_reels',
  posted_at timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  creator_rating integer check (creator_rating between 1 and 5),
  qualitative_feedback text,
  outcome_label text not null default 'unknown'
    check (outcome_label in ('unknown', 'underperformed', 'met_expectation', 'outperformed', 'viral')),
  created_at timestamptz not null default now()
);

create index if not exists idea_performance_feedback_segment_idx
on public.idea_performance_feedback(category_id, persona_id, platform, outcome_label, created_at desc);

create index if not exists idea_performance_feedback_idea_idx
on public.idea_performance_feedback(idea_id, created_at desc);

alter table public.idea_performance_feedback enable row level security;

revoke all privileges on public.idea_performance_feedback from public, anon, authenticated;
grant all privileges on public.idea_performance_feedback to service_role;

insert into public.admin_configs(namespace, version, config, enabled)
values (
  'quality.gate',
  '2.1.0',
  '{
    "version": "2.1.0",
    "embedding_ready": true,
    "semantic_embedding_dimension": 384,
    "claim_evidence_statuses": ["not_required", "missing", "provided", "needs_review"],
    "second_opinion_triggers": ["restricted_category", "dangerous_challenge", "missing_claim_evidence", "missing_sponsor_disclosure", "low_brand_safety", "semantic_duplicate_high"],
    "performance_feedback_default_score": 50
  }'::jsonb,
  true
)
on conflict (namespace, version) do update
set config = excluded.config,
    enabled = true;
