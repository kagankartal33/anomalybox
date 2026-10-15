# ViralBox Audit Report

Date: 2026-07-13

## Scope

Checked the current app, Store category search, authenticated creator access, environment readiness, card presentation layer, creator-facing leak rules, Supabase schema lint, build pipeline, route smoke, and main regression scripts.

## Fixes Completed

- Removed stale unused card UI helpers from `components/CardSections.tsx`.
- Restored creator card range presentation so each range clearly separates Action, Camera, Say, On-screen text, Creator touch, and Edit.
- Reintroduced creator-personalization highlights.
- Fixed malformed JSX and visible malformed time separators in card timeline fallbacks.
- Kept creator/admin separation intact: creator sections stay focused on Scene Flow and Edit Assembly Guide while admin review context remains available in admin surfaces.
- Added keyboard accessibility for box reveal modal and card execution boards.
- Added fixture coverage for placeholder/run-id cleanup: `npm run test:card-cleanup`.
- Added HTTP route smoke for public pages and protected route gating: `npm run test:route-smoke`.
- Added Store category search helper and regression coverage: `npm run test:store-search`.
- Store search now maps Turkish yacht/boat intent (`yat`, `tekne`, `mavi tur`, `gulet`) and typo `yatch` to the premium label `Yacht Luxury Travel`.
- Added authenticated creator smoke coverage: `npm run test:auth-smoke` signs in through Supabase SSR cookies, renders `/boxes`, finds or creates an assigned smoke card, and verifies `/cards/:ideaId`.
- Added env preflight coverage: `npm run audit:env` for local and `npm run audit:env:production` for strict deploy gating.
- Added missing local `LINKED_ACCOUNT_TOKEN_SECRET` so local token crypto paths do not fail at runtime.
- Production readiness wrapper now includes env preflight, store search, and authenticated creator smoke coverage.
- Production readiness wrapper now fails on non-zero external command exit codes.
- Fast readiness now skips the long finalist export dry run by default via `-SkipExportDryRun`.

## Current Automated Check Status

- `npm run audit:readiness`: passed on 2026-07-13, including env preflight and authenticated creator smoke.
- `npm run test:route-smoke`: passed on 2026-07-13 against `http://127.0.0.1:3000`.
- `npm run test:auth-smoke`: passed on 2026-07-13.
- `npm run test:store-search`: passed on 2026-07-13.
- `npm run audit:env`: passed on 2026-07-13 in local mode with expected localhost/test placeholder warnings.
- `npm run audit:env:production`: failed on 2026-07-13 against `.env.local`, as expected, because production HTTPS URLs and real deploy secrets are not configured locally.
- `npm run typecheck`: passed on 2026-07-13.
- `npm run lint`: passed on 2026-07-13.
- `npm run build`: passed on 2026-07-13.
- `npm run audit:leaks`: passed on 2026-07-13.
- `npm run test:card-cleanup`: passed on 2026-07-13.
- `supabase db lint --local`: passed inside `npm run audit:readiness`.
- `npm run audit:export-size`: passed inside `npm run audit:readiness` with 35 cards / 0.55 MB.

## Notes

- Broad source scan still finds internal terms in sanitizer/admin/internal files, but creator leak scanner passes.
- `internal_rank_score` appears only in admin card report replacement selection and smoke setup internals.
- `score_band` appears in internal inventory logic.
- `Quality Gate` and `run_` appear in sanitizer/title cleanup code, not as creator-facing copy.
- Production-only checks remain: strict production env preflight with real variables, deployed URL browser smoke, production Supabase env/migrations, Stripe live/test checkout, and OAuth credentials.
