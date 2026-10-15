# Data Flow Map (P00)

## SEO package publish path (current)

1. Source package under `archive/source-packs/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/.../pages/*`
2. `tools/import_seo_package_v6.py` → `content/seo-package/*.md` + images + registry JSON
3. Next.js routes (`app/resources`, `content-ideas`, `templates`, …) read registry + markdown
4. Metadata/JSON-LD/sitemap/feed consume `datePublished` / `dateModified`

## Viral card path (current, separate)

1. Training tables / generator prompts
2. Admin generation batches
3. Quality gate / inventory
4. Creator delivery of idea cards

## QUANTUM path (target)

Opportunity → Evidence Ledger → Claim verification → Quality hard gates → Approval → Immutable publish version.

**Integration strategy:** Attach QUANTUM gates as evaluation/publish controls **around** existing SEO package corpus and future generation, without merging viral training into SEO.
