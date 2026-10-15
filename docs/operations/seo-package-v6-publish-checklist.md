# SEO Package V6 — Website Publish Checklist

Source package: `archive/source-packs/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/`

## What was integrated

| Site path | Count | Source |
|---|---:|---|
| `/content-ideas/*` | 13 | package |
| `/reels/*` | 3 | package |
| `/resources/*` (section articles) | 35 | package |
| `/templates/*` | 13 | package |
| `/creator-lanes/*` | 24 | package |
| `/creator-personas/*` | 8 | package |
| `/services/*` | 8 | package |
| `/tools/*` | 8 | package |
| **Total** | **112** | |

Master hub: `/resources` lists all 112 pages.

## Import command

```powershell
python tools/import_seo_package_v6.py
```

Writes:

- `content/seo-package/{slug}.md`
- `public/assets/seo-package/{slug}.webp`
- `lib/seo-package-registry.json`

## SEO coverage on site

- Per-page `title`, `meta description`, `keywords`, `canonical`
- Open Graph + Twitter cards with package featured image
- JSON-LD `Article`/`Service` + `BreadcrumbList` (domain from `NEXT_PUBLIC_SITE_URL`)
- `sitemap.ts` includes all 112 pages + section hubs
- `feed.xml` lists all package pages
- `llms.txt` lists section hubs
- Unique featured image per page (no shared hero)

## Before go-live (human)

Package policy still requires:

1. Named human factual review (claims, product screenshots, examples).
2. Confirm `NEXT_PUBLIC_SITE_URL` is the live domain (schemas/sitemap use it).
3. Spot-check internal links in a few articles (`/store`, cross-notes).
4. Optional: Search Console URL inspection on 5–10 pillars.
5. Do **not** re-run legacy `generate_unique_resources.py` over these pages — package is the editorial source of truth.

## Note on word counts

Package standard is **400–1200** body words (validated in V6.4). Some guides are intentionally short (templates / checklists). That is accepted for this package; do not pad with filler for a 600-word floor.
