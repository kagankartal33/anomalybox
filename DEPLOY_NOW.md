# Anomaly Box Production Deployment

Anomaly Box is a server-rendered Next.js application. Uploading only HTML files is
not sufficient. Deploy the repository root to **Vercel** and deploy only the
production app database surface to a hosted Supabase project.

## 1. Authenticate the deployment tools

Production stack for this workspace:

- App host: **Vercel** (Next.js)
- Site URL: `https://anomalybox.com`
- Supabase URL: `https://psqqqhcfmfojrqsvzzzb.supabase.co`
- Supabase project ref: `psqqqhcfmfojrqsvzzzb`

```powershell
npx vercel login
npx vercel link
supabase login
```

Do not paste access tokens or production secrets into chat or commit them to
the repository.

## 2. Deploy Supabase

Important: do not run `supabase db push` against the current migration folder
for production. The repository migrations include training/research tables and
seeds. Production should receive only:

- Core app/auth tables and RLS.
- Public catalog tables: `categories`, `creator_personas`, `box_products`.
- Purchase, checkout, webhook, notification, Vault delivery and card report tables.
- `idea_candidates`, `idea_cards`, and `idea_inventory` for approved stock.
- RPCs: `deliver_idea_box`, `replace_reported_card`, `inventory_health`.
- Storage bucket/policies for `profile-avatars`.
- Atelier lead table.

Do not deploy:

- `viral_training_*`
- `dataset_training_*`
- training/eval seeds
- raw research or generated training outputs
- generation Edge Functions

The stock-only schema lives at:

```text
supabase/production/schema_stock_only.sql
```

It was deployed with:

```powershell
npx supabase db query --linked --file supabase\production\schema_stock_only.sql
```

Deploy only runtime Edge Functions:

```powershell
supabase functions deploy deliver-idea-box
supabase functions deploy inventory-health
```

The training/generation functions are intentionally not part of production.

## 3. Deploy the app to Vercel

Link and deploy the repository root as a Next.js project. Vercel auto-detects
the App Router. `vercel.json` sets production security/cache headers and
`npm run build`.

Set these Vercel **Production** environment variables using values from the
production services:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
LINKED_ACCOUNT_TOKEN_SECRET
RESEND_API_KEY
EMAIL_FROM
META_APP_ID
META_APP_SECRET
META_REDIRECT_URI
```

Optional bulk sync from a local shell (values must already be set in the process
environment or `.env.local`):

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\push-env.ps1
```

`RESEND_*` and `META_*` can remain unset if those optional features will not be
enabled at launch. `STRIPE_WEBHOOK_SECRET` is created after the Stripe webhook is
added. All non-optional values must pass:

```powershell
npm run audit:env:production
node tools/check-vercel-production-env.mjs
```

Deploy:

```powershell
npx vercel deploy --prod --yes
```

## 4. Connect production callbacks

- Stripe webhook: `https://anomalybox.com/api/stripe/webhook`
- Supabase Auth callback: `https://anomalybox.com/auth/callback`
- Instagram callback: `https://anomalybox.com/api/auth/instagram/callback`

Subscribe the Stripe endpoint to `checkout.session.completed` (and the async
payment / refund events configured by `tools/setup-stripe-production.mjs`).

## 5. Stripe production keys

Use the Stripe CLI account linked to `anomalybox.com` and run:

```powershell
# Test mode (safe for launch smoke)
npm run stripe:setup

# Live mode (only after Stripe account activation enables charges)
# 1) Complete https://dashboard.stripe.com/account/onboarding
# 2) stripe login
# 3) npm run stripe:setup:live
```

`tools/setup-stripe-production.mjs` will:

- create/replace the production webhook
- set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` on **Vercel** production
- update local `.env.local`
- optionally redeploy (`--redeploy` / `stripe:setup:live`)

Primary production webhook (independent of Vercel redeploys):

```text
https://psqqqhcfmfojrqsvzzzb.supabase.co/functions/v1/stripe-webhook
```

Deploy/update with:

```powershell
npx supabase functions deploy stripe-webhook --project-ref psqqqhcfmfojrqsvzzzb --no-verify-jwt
npx supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... --project-ref psqqqhcfmfojrqsvzzzb
```

Live mode is blocked until Stripe reports `charges_enabled=true`. Until then
production correctly stays on `paymentMode: "test"`.

## 6. Launch smoke

Keep Stripe in test mode first. Verify Store, login, test checkout, Creator
Vault delivery, dossier unlock, card detail, admin access, and the Stripe
webhook. Switch to live Stripe keys only after this flow passes and the Stripe
account is fully activated.
