# ViralBox Audit Report

Date: 2026-07-11

## Scope

Checked the current app, card presentation layer, creator-facing leak rules, Supabase schema lint, build pipeline, and main regression scripts.

## Fixes Completed In This Pass

- Removed stale unused card UI helpers from `components/CardSections.tsx`.
- Removed the unused visual shooting guide component and all card-facing "Watch How To Shoot" remnants.
- Hid the legacy video/preview flow inside `CardSections` when the modern range board exists.
- Restored creator card range presentation so each range clearly separates:
  - Action
  - Camera
  - Say
  - On-screen text
  - Creator touch
  - Edit
- Reintroduced creator-personalization highlights:
  - Creator touch uses a soft yellow highlight.
  - Optional on-screen text uses a soft teal highlight.
  - Voice/tone guidance uses a soft lavender highlight.
- Fixed broken JSX caused by an encoding cleanup attempt in the card timeline bar.
- Replaced malformed timeline dashes with simple ASCII hyphens in visible card time labels.
- Replaced a remaining encoded dash in the card detail source comment.
- Kept creator/admin separation intact:
  - Creator sections stay focused on Scene Flow and Edit Assembly Guide.
  - Admin-only report/review context remains available in admin surfaces.

## Current Automated Check Status

- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run build`: passed
- `npm run audit:leaks`: passed
- `supabase db lint --local`: passed
- `tools/test-generator-flow.ps1`: passed
- `tools/test-creator-video-review.ps1`: passed
- `tools/test-quality-gate-v2.ps1 -IdeaCount 200`: passed

## Notes

- Broad source scan still finds internal terms in sanitizer/admin/internal files, but creator leak scanner passes.
- `internal_rank_score` appears only in admin card report replacement selection.
- `score_band` appears in internal inventory logic.
- `Quality Gate` and `run_` appear in sanitizer/title cleanup code, not as creator-facing copy.
- `Caption & Comment`, `Brand Lift`, and `Brand Safety` remain available in admin normalization, while creator normalization returns only execution-focused sections.
