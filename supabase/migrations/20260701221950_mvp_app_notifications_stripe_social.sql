alter table public.purchases
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists persona_id uuid references public.creator_personas(id) on delete set null,
  add column if not exists fulfillment_source text not null default 'stripe' check (fulfillment_source in ('stripe', 'admin_gift')),
  add column if not exists completed_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.checkout_sessions
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists persona_id uuid references public.creator_personas(id) on delete set null;

create table if not exists public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz,
  processing_status text not null default 'processing' check (processing_status in ('processing', 'processed', 'failed')),
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.linked_social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('instagram', 'google', 'meta')),
  provider_account_id text,
  handle text,
  display_name text,
  avatar_url text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'both')),
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists purchases_provider_session_idx
on public.purchases(provider, provider_checkout_session_id);

create index if not exists purchases_fulfillment_source_idx
on public.purchases(fulfillment_source, created_at desc);

create index if not exists linked_social_accounts_user_idx
on public.linked_social_accounts(user_id, provider);

create index if not exists notifications_user_unread_idx
on public.notifications(user_id, read_at, created_at desc);

drop trigger if exists linked_social_accounts_set_updated_at on public.linked_social_accounts;
create trigger linked_social_accounts_set_updated_at
before update on public.linked_social_accounts
for each row execute function public.set_updated_at();

alter table public.stripe_webhook_events enable row level security;
alter table public.linked_social_accounts enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "linked_social_accounts_owner_select" on public.linked_social_accounts;
create policy "linked_social_accounts_owner_select" on public.linked_social_accounts
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "linked_social_accounts_owner_delete" on public.linked_social_accounts;
create policy "linked_social_accounts_owner_delete" on public.linked_social_accounts
for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "notifications_owner_select" on public.notifications;
create policy "notifications_owner_select" on public.notifications
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "notifications_owner_update" on public.notifications;
create policy "notifications_owner_update" on public.notifications
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.stripe_webhook_events from public, anon, authenticated;
revoke all on public.linked_social_accounts from public, anon, authenticated;
revoke all on public.notifications from public, anon, authenticated;

grant select (
  id,
  user_id,
  provider,
  provider_account_id,
  handle,
  display_name,
  avatar_url,
  scopes,
  metadata,
  connected_at,
  updated_at
) on public.linked_social_accounts to authenticated;

grant delete on public.linked_social_accounts to authenticated;

grant select (
  id,
  user_id,
  type,
  title,
  body,
  href,
  channel,
  read_at,
  metadata,
  created_at
) on public.notifications to authenticated;

grant update (read_at) on public.notifications to authenticated;

grant all on public.stripe_webhook_events to service_role;
grant all on public.linked_social_accounts to service_role;
grant all on public.notifications to service_role;
