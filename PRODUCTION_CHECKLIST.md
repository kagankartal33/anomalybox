# ViralBox Production Checklist

Date: 2026-07-11

## Local Readiness

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run audit:leaks`
- `supabase db lint --local`
- `tools/test-generator-flow.ps1`
- `tools/test-creator-video-review.ps1`
- `tools/test-quality-gate-v2.ps1 -IdeaCount 200`

## Production Environment

- Set `NEXT_PUBLIC_SUPABASE_URL`.
- Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Set `SUPABASE_SERVICE_ROLE_KEY` only on the server/deploy environment.
- Set `STRIPE_SECRET_KEY`.
- Set `STRIPE_WEBHOOK_SECRET`.
- Set `RESEND_API_KEY` and `EMAIL_FROM` if email notifications are enabled.
- Set `NEXT_PUBLIC_SITE_URL` to the production URL.
- Set OAuth credentials for Google and Meta if those login flows are enabled.

## Production Smoke

- Create/login as a creator.
- Open public Store without login.
- Select box, lane, and creator mode.
- Confirm unavailable stock disables checkout.
- Complete Stripe test checkout.
- Confirm purchased box appears sealed in Creator Vault.
- Open one sealed box and verify cards appear.
- Open card detail and confirm:
  - Long Story Short appears.
  - Scene Flow is range-based.
  - Edit Assembly Guide is range-based.
  - No visual shooting guide appears.
  - No score, band, training, dataset, or raw placeholder appears.
- Submit manual video review.
- Save admin review feedback.
- Submit card report.
- Accept/reject report from admin.
