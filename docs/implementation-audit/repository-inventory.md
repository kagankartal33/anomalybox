# Repository Inventory & Baseline Audit

> **Specification Reference:** QUANTUM_WORLD_CLASS_ENGINE_GAP_AUDIT_V4_GEMINI_EXECUTION_EDITION.md (Section 47 / 60.1)  
> **Pack Reference:** QUANTUM_GEMINI_IMPLEMENTATION_PACK  
> **Task ID:** P00-T001  
> **Repository Root:** `C:/Users/Kagan/OneDrive/Desktop/ViralBox`  
> **Date:** 2026-08-05

## 1. Runtime Inventory

| Component | Status |
|---|---|
| OS | Windows |
| Languages | TypeScript/Next.js (app), Python (tools) |
| Package managers | npm (`package.json`), pip (ad-hoc for tools) |
| Frontend | Next.js App Router |
| Backend/data | Supabase (auth, inventory, viral training tables) |
| Payments | Stripe |
| Content (SEO) | `content/seo-package/*` (112 pages from V6 package) + legacy `content/resources/*` |
| Content (product) | Idea cards / viral generation via Supabase functions |
| Tests | Scattered `tools/test-*.ps1`, `tools/test-*.mjs`; no unified quantum test suite yet |
| CI | Vercel config present; no QUANTUM Makefile suite yet |
| Infrastructure | Vercel, Supabase, Stripe |

## 2. Key Paths

| Path | Purpose | QUANTUM relevance |
|---|---|---|
| `app/` | Next.js routes including SEO package hubs | Publish surface |
| `content/seo-package/` | 112 imported editorial articles | Existing content corpus for gates |
| `lib/seo-package.ts` + registry | SEO package loader | Site graph input |
| `tools/originality_gate.py` | Jaccard/hash near-dup | Partial G-04 |
| `tools/import_seo_package_v6.py` | Package → site import | Publish pipeline (manual) |
| `tools/quantum/` | Implementation pack tooling | Pack install |
| `supabase/` | Migrations, seeds, edge functions | Product + viral training |
| `.agent/` | Requirements/tasks/candidates ledgers | Mandatory agent state |

## 3. Product Behaviors to Protect

- Viral idea-card generation and inventory fulfillment
- Stripe checkout and webhooks
- Auth / onboarding / admin
- SEO package routes and metadata (canonical, OG, JSON-LD, staggered dates)
- Separation of SEO content pipeline from viral card training

## 4. Existing Gaps vs QUANTUM V4 (honest)

| Area | Status |
|---|---|
| Evidence ledger | Missing |
| Multi-stage content job state machine | Missing |
| Page justification gate | Missing |
| Durable orchestration / DLQ | Missing |
| Human review router | Missing |
| Publish read-back / rollback | Missing |
| Full requirement compliance matrix | Not yet (ledgers seeded) |
| Production graduation (Section 45) | Not passed |

## 5. P00 Product-Code Rule

P00-T001 does **not** modify product code. Only audit docs and `.agent/*` / pack tooling.
