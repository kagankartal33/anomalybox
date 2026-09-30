# ViralBox Production Deployment

ViralBox is a server-rendered Next.js application. Uploading only HTML files is
not sufficient. Deploy the repository root to Railway and the `supabase`
directory to a hosted Supabase project.

## 1. Authenticate the deployment tools

Run these from the project root:

```powershell
npx --yes @railway/cli login
supabase login
```

Do not paste access tokens or production secrets into chat or commit them to
the repository.

## 2. Deploy Supabase

Create or choose a production project in the Supabase dashboard, then run:

```powershell
supabase link --project-ref <production-project-ref>
supabase db push
supabase functions deploy admin-generation-batches
supabase functions deploy deliver-idea-box
supabase functions deploy generate-ideas
supabase functions deploy inventory-health
supabase functions deploy score-idea
```

Before `db push`, inspect the migration preview shown by the CLI. The project
contains 26 ordered migrations under `supabase/migrations`.

## 3. Deploy the app to Railway

Create a Railway project from this repository root. Railway uses
`railway.json`, runs `npm ci && npm run build`, starts with `npm run start`, and
checks `/` for health.

Set these Railway variables using values from the production services:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
LINKED_ACCOUNT_TOKEN_SECRET
INTERNAL_API_TOKEN
ADMIN_INTERNAL_SECRET
RESEND_API_KEY
EMAIL_FROM
META_APP_ID
META_APP_SECRET
META_REDIRECT_URI
```

`RESEND_*` and `META_*` can remain unset if those optional features will not be
enabled at launch. All other values must pass:

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