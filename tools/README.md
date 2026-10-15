# Tools

Two production pipelines. Keep them isolated.

Full rules: [`docs/architecture/content-pipelines-separation.md`](../docs/architecture/content-pipelines-separation.md)

---

## A) SEO content (public editorial / package pages)

**Primary source of truth (112 pages):**  
`archive/source-packs/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/` → import → site routes

| Script / path | Role |
| --- | --- |
| `import_seo_package_v6.py` | **Canonical publish import** → `content/seo-package/`, `public/assets/seo-package/`, `lib/seo-package-registry.json` |
| `lib/seo-package.ts` | Registry loader for routes, sitemap, feed |
| Package canons | `/content-ideas/*`, `/reels/*`, `/resources/*`, `/templates/*`, `/creator-lanes/*`, `/creator-personas/*`, `/services/*`, `/tools/*` |

```powershell
python tools/import_seo_package_v6.py
```

**Legacy generators** (secondary / training experiments under `content/resources/`):

| Script | Role |
| --- | --- |
| `generate_unique_resources.py` | Legacy unique SEO drafts |
| `training_knowledge.py` | SEO-only offline profile loader |
| `audit_training_application.py` | Legacy uniqueness audit |

Do not mix this pipeline with viral idea-card stock generation.

---

## B) Viral idea cards (product inventory)

**Output:** `idea_candidates` / `idea_cards` / inventory (not resource markdown)  
**Training:** `viral_training_*`, pattern taxonomy, book high-value craft, HF social, real viral seeds  
**Not used:** resource SEO article templates, SCR page stamps for cards

| Script / doc | Role |
| --- | --- |
| `docs/prompts/generate-ideas-system.md` | Idea-card generation standard |
| `docs/training/viral-corpus-methodology.md` | Viral training methodology |
| `generate-category-stock.ps1` | Category stock idea generation |
| `import-generated-batch.ps1` | Import idea JSONL batches |
| `build-real-viral-examples-seed.ps1` | Real viral examples seed |
| `retrain-viral-corpus.ps1` | Recompile viral training |
| `test-generator-flow.ps1` / `test-quality-gate-v2.ps1` | Card pipeline tests |
| `harvest_local_datasets.py` | Local viral/comedy/persona harvest → `dataset/viral_card/prepared/` |
| `generate-premium-idea-cards.py` | Premium card image previews (cards, not SEO pages) |

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\test-generator-flow.ps1
# stock / import / retrain — see viral docs above
```

---

## Import Generated Batch (viral cards)

Use this when the **idea** generator creates a folder like:

```text
generated_batches/
  batch_2026_06_28_beauty_luxury_editor/
    manifest.json
    ideas_0001.jsonl
```

```powershell
$env:ADMIN_API_TOKEN = "local-admin-token"
.\tools\import-generated-batch.ps1 `
  -BatchFolder .\generated_batches\batch_2026_06_28_beauty_luxury_editor `
  -Publish
```

---

## Build Instagram Category Seed

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\build-instagram-category-seed.ps1
supabase db reset
supabase db lint --local
```

Writes `supabase/seeds/instagram_categories.sql` for the **card/category** product, not SEO articles.

---

## Build Real Viral Examples Seed (viral cards)

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\build-real-viral-examples-seed.ps1 -TargetCount 1000
supabase db reset
supabase db lint --local
```

---

## Test Quality Gate v2.1 (viral cards)

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\test-quality-gate-v2.ps1
```

---

## Test Everything Local

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\test-all.ps1
```

Covers Supabase, generator import/scoring (cards), quality gate, and training profile health — primarily the **viral card** stack plus app smoke.
