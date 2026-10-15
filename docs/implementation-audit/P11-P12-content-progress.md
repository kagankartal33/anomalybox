# P11 Link Graph + P12 Render QA + Content Polish

## Commands

```text
python tools/quantum/dedupe_warn_pairs.py
python tools/import_seo_package_v6.py
python tools/quantum/build_internal_link_graph.py
python tools/quantum/render_qa_seo_package.py
python tools/quantum/evaluate_seo_package.py
python -m unittest discover -s tests/quantum -v
```

## Results

### QUANTUM evaluate (112 SEO package pages)

| Metric | Previous | Now |
|---|---:|---:|
| hard gate fails | 0 | **0** |
| reject_score | 0 | **0** |
| approve | 34 | **57** |
| approve_with_minor_repairs | 78 | **55** |
| avg score | 85.76 | **86.64** |

### P11 Internal links

- Output: `lib/seo-package-links.json`
- 112 pages, **avg 4.05** relevance-ranked links each
- UI: `SeoPackageArticle` renders “Related guides” (not random)

### P12 Render QA (file-level)

- Output: `quantum/data/evaluations/seo_package_render_qa.json`
- **pass=112 fail=0**
- Checks: markdown, image file, alt text, H2 structure, bot dates, meta length, link graph density

### Baseline fix

- `lib/cluster-links.ts`: `str` → `string` (pre-existing tsc error)

## Next options

1. Lift remaining 55 minor pages (mostly soft near-dup warns)
2. P13 human review dashboard stub
3. Wire evaluate results into CI (`make evaluate-seo` gate)
