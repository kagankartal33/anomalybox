# Content Pipelines Separation

Two production systems. **Do not mix training, generators, or outputs.**

| | **A) SEO Content** | **B) Viral Idea Cards** |
|---|---|---|
| **Purpose** | Public marketing/resource articles for search & AEO | Creator-facing shoot-ready idea cards sold in boxes |
| **Primary output** | `content/resources/*.md` → `/resources/[slug]` | `idea_cards` JSON → app card UI |
| **Metadata** | `lib/seo-content.ts` | Categories, batches, inventory, scores |
| **Training** | SEO/AEO books & rules only | Viral corpus, cinema/story craft, personas, comedy refs |
| **Training paths** | `seo_content_rules.sql`, `dataset/seo_content/prepared/` | `viral_training_*`, `book_train/high_value`, HF social, real viral seeds |
| **Generators** | `tools/generate_unique_resources.py` (+ SEO audits) | Edge/admin generation, `generate-category-stock.ps1`, `docs/prompts/generate-ideas-system.md` |
| **Quality gate** | Originality among resource articles + SEO structure | Quality Gate v2, score bands, category layers (internal) |
| **Must never** | Load viral VTP patterns, invent idea cards, copy viral surfaces | Write `content/resources`, use SCR SEO article templates, mix book prose into cards |

## Hard rules

1. **SEO content training ≠ viral card training.**  
   SEO loaders must not import `viral_training_*`, VTP taxonomy, comedy master systems, or high-value cinema craft as article engines.

2. **Viral card training ≠ SEO article training.**  
   Idea generators must not call `generate_unique_resources`, write resource markdown, or treat SCR article rules as card fields.

3. **Shared utilities only** (allowed): hashing, env helpers, Supabase clients, design tokens.  
   Shared **does not** mean shared training profiles.

4. **Harvest destinations stay separate.**  
   - SEO books → `dataset/seo_content/prepared/`  
   - Viral/comedy/persona local md → `dataset/viral_card/prepared/` (not under `seo_content/`)

5. **Prompts stay separate.**  
   - SEO: article structure, zero-click, FAQ/PAA, E-E-A-T, intent  
   - Viral: `docs/prompts/generate-ideas-system.md`, idea_card schema, pattern_only mechanisms

## Commands (SEO only)

```powershell
python tools/generate_unique_resources.py
python tools/audit_training_application.py
python tools/train-seo-content.ps1   # optional re-extract/import SEO books
```

## Commands (Viral cards only)

```powershell
# See docs/prompts/generate-ideas-system.md and docs/training/viral-corpus-methodology.md
powershell -ExecutionPolicy Bypass -File .\tools\test-generator-flow.ps1
powershell -ExecutionPolicy Bypass -File .\tools\generate-category-stock.ps1 ...
powershell -ExecutionPolicy Bypass -File .\tools\retrain-viral-corpus.ps1
```

## Ownership checklist before merging

- [ ] Change touches only one pipeline’s files, or documents both explicitly.
- [ ] No new import from SEO generator into viral card path (or reverse).
- [ ] No viral corpus rows written into `seo_content/prepared/`.
- [ ] Resource articles still unique after title-strip; cards still pass quality gate.
