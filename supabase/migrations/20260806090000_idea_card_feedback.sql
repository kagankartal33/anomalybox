-- Migration: 20260806090000_idea_card_feedback.sql
-- Description: Creator Feedback Loop for Schema v2 IdeaCards (Master Engine V4)

create table if not exists public.idea_card_feedback (
  id uuid primary key default gen_random_uuid(),
  card_id text not null,
  user_id uuid references auth.users(id) on delete cascade,
  was_shot boolean not null default false,
  rating integer check (rating between 1 and 5),
  modified_sections text[] default '{}',
  feedback_text text check (length(feedback_text) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for analytics and retraining aggregation
create index if not exists idx_idea_card_feedback_card_id on public.idea_card_feedback(card_id);
create index if not exists idx_idea_card_feedback_user_id on public.idea_card_feedback(user_id);
create index if not exists idx_idea_card_feedback_was_shot on public.idea_card_feedback(was_shot);

-- Row Level Security (RLS)
alter table public.idea_card_feedback enable row level security;

-- Policy: Users can insert feedback for their own account
create policy "Users can submit own card feedback"
  on public.idea_card_feedback
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can read their own feedback
create policy "Users can view own card feedback"
  on public.idea_card_feedback
  for select
  using (auth.uid() = user_id);

-- Service role bypasses RLS for training analysis
