# ViralBox Production Checklist

Date: 2026-07-13

## Local Readiness

- `npm run audit:readiness` (fast local readiness: typecheck, lint, build, Supabase lint, leak scan, card cleanup, store search, env preflight, authenticated creator smoke, export size)
- `npm run audit:env`
- `npm run audit:env:production` against the real deployment env before launch
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run audit:leaks`
- `npm run test:card-cleanup`
- `npm run test:store-search`
- `npm run test:auth-smoke` (requires local app server; signs in with Supabase SSR cookies and creates a minimal smoke card if needed)
- `npm run test:route-smoke` (requires a running app server, or pass `-StartDevServer` to the underlying script)
- `npm run audit:export-size`
- `tools/scan-production-leaks.ps1 -ScanLatestExport`
- `tools/test-card-report-flow.ps1`
- `tools/test-single-use-card-delivery.ps1`
- `npm run test:stripe-webhook` (requires local app server + `STRIPE_WEBHOOK_SECRET`)
- `npm run audit:finalist-sample`
- `npm run demo:reset` (optional local QA account)
- `supabase db lint --local`
- `tools/test-generator-flow.ps1`
- `tools/test-quality-gate-v2.ps1 -IdeaCount 200`
- Optional full export dry-run: `powershell -ExecutionPolicy Bypass -File .\tools\test-production-readiness.ps1 -SkipSlow` (can be slow because it scans every enabled route)

## Production Environment

- Set `NEXT_PUBLIC_SUPABASE_URL` to the production HTTPS Supabase URL.
- Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Set `SUPABASE_SERVICE_ROLE_KEY` only on the server/deploy environment.
- Set `STRIPE_SECRET_KEY`.
- Set `STRIPE_WEBHOOK_SECRET`.
- Set `LINKED_ACCOUNT_TOKEN_SECRET` to a long random secret (32+ chars).
- Set `INTERNAL_API_TOKEN` and `ADMIN_API_TOKEN` or `ADMIN_INTERNAL_SECRET` to non-placeholder secrets.
- Set `RESEND_API_KEY` and `EMAIL_FROM` if email notifications are enabled.
- Set `NEXT_PUBLIC_SITE_URL` to the production HTTPS URL.
- Set OAuth credentials for Google and Meta if those login flows are enabled.

## Production Smoke

- Create/login as a creator.
- Open public Store without login.
- Search Store lanes with creator-language terms such as `yat`, `tekne`, `yacht`, and confirm `Yacht Luxury Travel` appears first.
- Select box, lane, and creator mode.
- Confirm unavailable stock disables checkout.
- Complete Stripe test checkout.
- Confirm purchased box appears sealed in Creator Vault.
- Open one sealed box and verify cards appear.
- Run `npm run test:auth-smoke` locally, then manually repeat against the deployed URL and confirm:
  - Long Story Short appears.
  - Scene Flow is range-based.
  - Edit Assembly Guide is range-based.
  - No visual shooting guide appears.
  - No score, band, training, dataset, or raw placeholder appears.
- Submit card report.
- Accept/reject report from admin.
