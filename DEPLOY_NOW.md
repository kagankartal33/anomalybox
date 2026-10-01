# Anomaly Box Production Deployment

Anomaly Box is a server-rendered Next.js application. Uploading only HTML files is
not sufficient. Deploy the repository root to Netlify and deploy only the
production app database surface to a hosted Supabase project.

## 1. Authenticate the deployment tools

Netlify is already linked for this workspace:

- Project URL: `https://anomaly-box.netlify.app`
- Admin URL: `https://app.netlify.com/projects/anomaly-box`
- Supabase URL: `https://psqqqhcfmfojrqsvzzzb.supabase.co`
- Supabase project ref: `psqqqhcfmfojrqsvzzzb`

Netlify and Supabase CLI are logged in and linked.

```powershell
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
npx supabase db query --linked --file supabase\\production\\schema_stock_only.sql
```

Deploy only runtime Edge Functions:

```powershell
supabase functions deploy deliver-idea-box
supabase functions deploy inventory-health
```

The training/generation functions are intentionally not part of production.

## 3. Deploy the app to Netlify

Create a Netlify project from this repository root. Netlify detects Next.js and
uses its OpenNext adapter for App Router, API routes, Server Actions, and image
optimization. The repository's `netlify.toml` runs `npm run build` on Node 22.

Set these Netlify environment variables using values from the production services:

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

`RESEND_*` and `META_*` can remain unset if those optional features will not be
enabled at launch. `STRIPE_WEBHOOK_SECRET` is created after the Stripe webhook is
added. All non-optional values must pass:

```powershell
npm run audit:env:production
```

## 4. Connect production callbacks

- Stripe webhook: `https://<domain>/api/stripe/webhook`
- Supabase Auth callback: `https://<domain>/auth/callback`
- Instagram callback: `https://<domain>/api/auth/instagram/callback`

Subscribe the Stripe endpoint to `checkout.session.completed`.

## 5. Launch smoke

Keep Stripe in test mode first. Verify Store, login, test checkout, Creator
Vault delivery, dossier unlock, card detail, admin access, and the Stripe
webhook. Switch to live Stripe keys only after this flow passes.