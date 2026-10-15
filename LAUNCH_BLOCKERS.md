# ViralBox Launch Blockers

Date: 2026-07-13

## P0 Blockers Found In This Pass

None from local automated checks after the current fixes.

## Local Launch Evidence (2026-07-13)

| Check | Result |
|-------|--------|
| `npm run audit:readiness` | PASS (typecheck, lint, build, Supabase lint, leak scan, card cleanup, store search, env preflight, authenticated creator smoke, export size) |
| `npm run test:route-smoke` | PASS on production server at `http://127.0.0.1:3000` |
| `npm run test:auth-smoke` | PASS (Supabase SSR login cookie -> `/boxes` -> assigned `/cards/:ideaId`) |
| `npm run test:store-search` | PASS (`yat`, `tekne`, `yatch`, `yacht`, `mavi tur`, `gulet`, `private yacht charter` -> `Yacht Luxury Travel`) |
| `npm run audit:env` | PASS in local mode; warns about localhost/test placeholders as expected |
| `npm run audit:env:production` | FAILS against `.env.local` as expected because production URL/secrets are not configured locally |
| `npm run build` | PASS |
| `npm run audit:export-size` | PASS - 35 cards / 0.55 MB |

## Still Required Before Real Production Launch

- Run `npm run audit:env:production -- --env-file <production env file>` or equivalent in the deploy environment and resolve all failures.
- Run a deployed-URL browser smoke with production environment: Store search -> checkout -> Creator Vault -> card detail.
- Verify production Supabase environment variables and apply migrations.
- Verify Stripe dashboard products/prices and live webhook endpoint.
- Run a real Stripe test checkout through the deployed URL.
- Confirm Google and Meta OAuth credentials in the target production environment.

## Recommended P1 Follow-Ups

### Done

- Public HTTP route smoke: `npm run test:route-smoke`.
- Authenticated creator smoke: `npm run test:auth-smoke`.
- Placeholder fixtures: `npm run test:card-cleanup`.
- Store category search fixtures: `npm run test:store-search`.
- Local env preflight: `npm run audit:env`.
- Strict production env preflight: `npm run audit:env:production`.
- Export size guard: `npm run audit:export-size`.
- Production readiness wrapper includes env preflight, authenticated creator smoke, and store search coverage.
- Production readiness wrapper can skip the long finalist export dry run for fast local readiness.
- Production readiness wrapper fails on non-zero external command exit codes instead of continuing after a failed build.
- Keyboard a11y: box reveal dialog, card accordions, timeline/edit stages.
- Stronger empty states: Creator Vault + notifications inbox.
- Admin inventory health filters, Atelier lead status updates, Stripe webhook replay smoke, demo account reset, finalist editorial sample.
### Still Open

- Deployed production browser visual smoke.
- Production env strict preflight with real deployment variables.
- Optional card visual regression snapshot with Playwright or Browser connector when available.
- Production env / Stripe live / OAuth verification.
