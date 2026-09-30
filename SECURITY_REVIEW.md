# ViralBox Security Review

Date: 2026-07-04

## Current Security Posture

ViralBox uses Supabase Auth, RLS-protected creator data, server-side service role access for privileged operations, private review-video storage, and Stripe webhook signature validation.

## Implemented Hardening

- `linked_social_accounts.access_token_encrypted` now stores encrypted Meta tokens using AES-256-GCM.
- `LINKED_ACCOUNT_TOKEN_SECRET` is required before Instagram token storage succeeds.
- Admin server actions validate UUIDs, product slugs, category/persona slugs, enum values, and text lengths.
- ATELIER BLACK BOX leads are written server-side and are not exposed to anon/authenticated roles.
- Review-video cleanup metadata tracks whether raw video objects are active, deleted, or delete-failed.

## Supabase Checks

Required before launch:

- Run `supabase db lint --local`.
- Confirm every exposed public table has RLS enabled.
- Confirm new public tables include explicit grants where Data API access is intended.
- Confirm internal tables do not grant creator-readable score, inventory, training, or quality history fields.
- Confirm `creator-review-videos` bucket is private.
- Confirm storage object paths are user-owned.

Important Supabase changelog note:

Supabase is moving toward explicit grants for new public tables. ViralBox migrations should keep explicit grants/revokes paired with RLS policies.

## Secret Handling

Server-only env vars:

```text
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
META_APP_SECRET
LINKED_ACCOUNT_TOKEN_SECRET
ADMIN_INTERNAL_SECRET
INTERNAL_API_TOKEN
```

Allowed public env vars:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```

Never add a secret to a `NEXT_PUBLIC_` variable.

## Stripe Security

Current route validates:

- `stripe-signature` header exists.
- webhook body is verified with `STRIPE_WEBHOOK_SECRET`.
- event ID is inserted into `stripe_webhook_events`.
- duplicate event ID returns without consuming more inventory.

Production must verify:

- same event replay does not create a second delivery.
- checkout cannot start when inventory is unavailable.
- webhook failure is visible in logs.

## Creator Video Privacy

Rules:

- Creator videos are review-only.
- Creator videos are not training data.
- Creator videos are private storage objects.
- Raw videos expire by policy after 30 days.
- Cleanup must be run manually or scheduled with:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\cleanup-review-videos.ps1 -Apply
```

## Open Risks

- Production Supabase DB size is not known until finalist import is applied.
- Meta scopes may require app review depending on production use.
- No centralized error monitoring is active yet.
- Expired review-video cleanup is a manual/scripted operation until scheduled.