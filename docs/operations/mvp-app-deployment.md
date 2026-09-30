# ViralBox MVP App Deployment

## Railway Web App

Deploy the repository root as a Next.js app. Railway should run:

```powershell
npm install
npm run build
npm run start
```

Required Railway env:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=
ADMIN_INTERNAL_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY`, Stripe secrets, Resend key and Meta app secret must remain server-only. Do not expose them with `NEXT_PUBLIC_`.

## Supabase Production

Apply migrations and deploy existing Edge Functions:

```powershell
supabase link --project-ref <project-ref>
supabase db push
supabase functions deploy admin-generation-batches
supabase functions deploy deliver-idea-box
supabase functions deploy inventory-health
supabase functions deploy creator-video-reviews
```

Set Auth redirect URLs to the Railway domain:

```text
https://<railway-domain>/auth/callback
https://<railway-domain>/api/auth/instagram/callback
```

## Stripe

Create a webhook endpoint:

```text
https://<railway-domain>/api/stripe/webhook
```

Subscribe at minimum to:

```text
checkout.session.completed
```

The checkout route checks inventory before creating a Stripe session. If a category/persona does not have enough low/mid/high stock, payment is not started.

## Admin Setup

Create a normal Supabase Auth user, then set:

```sql
update public.profiles
set role = 'admin'
where id = '<user-id>';
```

Admin dashboard routes:

```text
/admin
/admin/inventory
/admin/users
/admin/reviews/:reviewId
```

## Local Verification

```powershell
npm run typecheck
npm run build
npm audit --omit=dev
supabase migration up --local --yes
supabase db lint --local
powershell -ExecutionPolicy Bypass -File .\tools\test-generator-flow.ps1
powershell -ExecutionPolicy Bypass -File .\tools\test-creator-video-review.ps1
powershell -ExecutionPolicy Bypass -File .\tools\test-dataset-training.ps1 `
  -CompileVersion 2026-v7-book-train-cinema `
  -SourceSlug book_train_cinema_v1 `
  -TrendSource book_train_cinema_v1 `
  -EvalPrefix book_train_eval `
  -ProfileCategories entertainment_comedy,creator_education,lifestyle `
  -MinObservations 1000 `
  -MinDatasetExamples 500
```

`tools/test-all.ps1 -SkipQualityGate` covers the same fast backend regression flow. On Windows it can occasionally finish all assertions and still wait on Supabase process cleanup; check the log before treating a timeout as a product failure.