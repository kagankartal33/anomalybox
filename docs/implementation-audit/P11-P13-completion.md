# P11–P13 + Content Lift Completion

## Commands

```text
python tools/quantum/lift_minor_pages.py
python tools/quantum/lift_minor_pass2.py
python tools/import_seo_package_v6.py
python tools/quantum/build_internal_link_graph.py
python tools/quantum/render_qa_seo_package.py
python tools/quantum/evaluate_seo_package.py
python tools/quantum/ci_seo_gates.py
python -m unittest discover -s tests/quantum -v
make human-review-queue
make human-review-export
```

## Final QUANTUM evaluation (112 pages)

| Metric | Start of session | After pass1 | **Final** |
|---|---:|---:|---:|
| hard gate fails | 0 | 0 | **0** |
| reject_score | 0 | 0 | **0** |
| approve | 57 | 101 | **112** |
| approve_with_minor_repairs | 55 | 11 | **0** |
| avg score | 86.64 | 87.31 | **87.42** |
| near_duplicate_warn | 16 | 0 | **0** |
| render QA pass | 112 | 112 | **112** |

## 1) Soft near-dup / minor lift

- `tools/quantum/lift_minor_pages.py` — signature protocols, missing FAQs, word-count pad
- `tools/quantum/lift_minor_pass2.py` — anti-overlap locks for last 11 pages
- Package source updated under `ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/.../pages`
- Site corpus re-imported via `import_seo_package_v6.py`

## 2) CI gates

- Workflow: `.github/workflows/quantum-seo-gates.yml`
- Runner: `tools/quantum/ci_seo_gates.py`
- Fails CI on: render QA fails, `reject_hard_gate`, `reject_score`, hard near-dup flags
- Soft minor does **not** fail default CI (use `STRICT_APPROVE=1` for pure-approve)
- Makefile: `make ci-seo`

## 3) P13 human review stub

| Piece | Path |
|---|---|
| Domain store | `quantum/human_review.py` |
| CLI | `tools/quantum/human_review_cli.py` |
| Tests | `tests/quantum/test_human_review.py` (roles, double-submit, enqueue, audit) |
| Snapshot | `quantum/data/human_review/queue_snapshot.json` |
| Admin UI | removed (not needed; CLI-only) |

Behaviours:

- Risk-based role routing (`editor` / `senior_editor` / `legal` / `admin`)
- Permission checks on decision actions
- Idempotency key double-submit protection
- JSONL audit trail
- Queue built from evaluation decisions (minor/reject); empty when all approve

## Next options

1. P14 publish / read-back / rollback adapter
2. STRICT sampling of approve pages into review queue
3. Live browser render QA beyond file-level P12
