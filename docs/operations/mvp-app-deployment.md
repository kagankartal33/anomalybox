# Anomaly Box MVP App Deployment

## Vercel Web App

Deploy the repository root as a Next.js app on **Vercel**.

```powershell
npx vercel login
npx vercel link
npx vercel deploy --prod --yes
```

Required Vercel Production env:

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

Verify production env:

```powershell
node tools/check-vercel-production-env.mjs
npm run audit:env:production
```

## Supabase Production

Apply the stock-only production schema (not the full training migration tree):

```powershell
npx supabase db query --linked --file supabase\production\schema_stock_only.sql
supabase functions deploy deliver-idea-box
supabase functions deploy inventory-health
```

Set Auth redirect URLs to the production domain:

```text
https://anomalybox.com/auth/callback
https://anomalybox.com/api/auth/instagram/callback
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
https://anomalybox.com/api/stripe/webhook
```

Or the durable Supabase function endpoint:

```text
https://psqqqhcfmfojrqsvzzzb.supabase.co/functions/v1/stripe-webhook
```

Subscribe at minimum to:

```text
checkout.session.completed
```

The checkout route checks inventory before creating a Stripe session. If a category/persona does not have enough low/mid/high stock, payment is not started.

Stripe production helper:

```powershell
npm run stripe:setup
# after live activation:
npm run stripe:setup:live
```

## Google And Meta OAuth

Google login uses Supabase Auth. Configure Google as an external provider in the Supabase dashboard and add this authorized redirect/callback:

```text
https://anomalybox.com/auth/callback
```

Instagram connect (optional) uses:

```text
https://anomalybox.com/api/auth/instagram/callback
```
