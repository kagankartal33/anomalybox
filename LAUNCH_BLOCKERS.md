# ViralBox Launch Blockers

Date: 2026-07-11

## P0 Blockers Found In This Pass

None from local automated checks after the fixes in this pass.

## Still Required Before Real Production Launch

- Run a real browser smoke test with an authenticated creator account.
- Verify production Supabase environment variables and migrations.
- Verify Stripe dashboard products/prices and live webhook endpoint.
- Run a real Stripe test checkout through the deployed URL.
- Confirm production finalist inventory import size stays within Supabase Free limits.
- Confirm creator review video storage retention policy is active.
- Confirm Google and Meta OAuth credentials in the target production environment.

## Recommended P1 Follow-Ups

- Add a Playwright/browser smoke test that opens:
  - `/`
  - `/store`
  - `/pricing`
  - `/boxes`
  - `/cards/[ideaId]`
  - `/profile`
  - `/admin`
- Add a card visual regression snapshot for Scene Flow and Edit Assembly Guide.
- Add a small fixture card test for raw placeholder cleanup.
- Add an export scan in CI with `tools/scan-production-leaks.ps1 -ScanLatestExport` once finalist export exists.
