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
LINKED_ACCOUNT_TOKEN_SECRET=
ADMIN_INTERNAL_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY`, Stripe secrets, Resend key, Meta app secret, `LINKED_ACCOUNT_TOKEN_SECRET`, and internal tokens must remain server-only. Do not expose them with `NEXT_PUBLIC_`.

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

The app creates Stripe Checkout sessions with dynamic `price_data`, so no Stripe Price ID is required in code. Still create/maintain dashboard products for clean reporting:

| Stripe product | Amount | App slug |
|---|---:|---|
| Classic Red Box | USD 500.00 | `viral_box_500` |
| SIGNATURE PURPLE BOX | USD 1000.00 | `premium_viral_box_1000` |

Do not create ATELIER BLACK BOX as a checkout product for MVP. It is contact-only.

Create a webhook endpoint:

```text
https://<railway-domain>/api/stripe/webhook
```

Subscribe at minimum to:

```text
checkout.session.completed
```

The checkout route checks inventory before creating a Stripe session. If a category/persona does not have enough low/mid/high stock, payment is not started.

## Google And Meta OAuth

Google login uses Supabase Auth. Configure Google as an external provider in the Supabase dashboard and add this authorized redirect/callback:

```text
https://<your-domain>/auth/callback
```

Meta/Instagram is not the primary login method. It is a connected social account flow. Configure a Meta app and set:

```text
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=https://<your-domain>/api/auth/instagram/callback
LINKED_ACCOUNT_TOKEN_SECRET=<long random production secret>
```

Meta OAuth redirect URI in the Meta dashboard must exactly match `META_REDIRECT_URI`. Requested scopes in code are:

```text
instagram_basic,pages_show_list
```

Instagram access tokens are stored encrypted with AES-256-GCM. If `LINKED_ACCOUNT_TOKEN_SECRET` is missing, the Instagram connect callback fails safely instead of storing a plaintext token.

## ATELIER BLACK BOX Leads

`ATELIER BLACK BOX` is contact-only. Requests are saved to `public.atelier_leads` through the server-side form on `/atelier`.

Admin route:

```text
/admin/atelier-leads
```

The leads table is not exposed to `anon` or `authenticated`; admin reads use server-side service role after `profiles.role = 'admin'` is verified.

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
/admin/atelier-leads
/admin/reviews/:reviewId
```

## Review Video Retention

Creator review videos are not training data. Raw storage objects are intended to expire after 30 days.

Dry run:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\cleanup-review-videos.ps1
```

Apply:

```powershell
powershell -ExecutionPolicy Bypass -File .\\tools\\cleanup-review-videos.ps1 -Apply
```

## Local Verification

```powershell
npm run typecheck
npm run lint
npm run build
npm run audit:leaks
npm run audit:readiness
npm audit --omit=dev
supabase migration up --local --yes
supabase db lint --local
powershell -ExecutionPolicy Bypass -File .\\tools\\test-generator-flow.ps1
powershell -ExecutionPolicy Bypass -File .\\tools\\test-creator-video-review.ps1
powershell -ExecutionPolicy Bypass -File .\\tools\\test-dataset-training.ps1 `
  -CompileVersion 2026-v7-book-train-cinema `
  -SourceSlug book_train_cinema_v1 `
  -TrendSource book_train_cinema_v1 `
  -EvalPrefix book_train_eval `
  -ProfileCategories entertainment_comedy,creator_education,lifestyle `
  -MinObservations 1000 `
  -MinDatasetExamples 500
```

`tools/test-all.ps1 -SkipQualityGate` covers the same fast backend regression flow. On Windows it can occasionally finish all assertions and still wait on Supabase process cleanup; check the log before treating a timeout as a product failure.