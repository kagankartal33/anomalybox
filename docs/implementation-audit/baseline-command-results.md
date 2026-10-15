# Baseline Command Results

> **Task:** P00-T001  
> **Date:** 2026-08-05

| Command | Exit | Notes |
|---|---:|---|
| `python --version` | 0 | Python 3.14.3 |
| `node --version` | 0 | v24.14.1 |
| `npm --version` | 0 | 11.11.0 |
| `npx tsc --noEmit` | 1 | **Pre-existing** errors in `lib/cluster-links.ts` (`str` undefined) — baseline failure, not a QUANTUM regression |
| `npm run build` / `next build` | 0 (prior session) | SSG of SEO package routes succeeded (286 routes) |
| `python tools/quantum/extract_requirement_candidates.py ...` | 0 | 244 candidates |
| `python tools/quantum/bootstrap_ledgers_from_candidates.py` | 0 | 244 requirements |
| `python tools/quantum/validate_agent_ledgers.py ...` | 0 | LEDGER VALIDATION PASSED |

## Distinction

- Baseline failures (tsc cluster-links) must not be used to block unrelated QUANTUM work, but also must not be “fixed” by deleting tests or ignoring allowlists without a task.
- QUANTUM engine features are not present; SEO package publish is a separate parallel capability.
