# P07–P10 Reference Slice Evidence

## Commands

```text
python -m unittest discover -s tests/quantum -v
# exit 0 — 7 tests OK

python tools/quantum/evaluate_seo_package.py
# exit 0 — 112 pages evaluated
# approve=10 minor=19 reject_score=59 hard=24 avg=80.74

python tools/quantum/validate_agent_ledgers.py --requirements .agent/REQUIREMENTS.json --tasks .agent/TASKS.json --candidates .agent/REQUIREMENT_CANDIDATES.json
# exit 0 — LEDGER VALIDATION PASSED
```

## Artifacts

| Path | Purpose |
|---|---|
| `quantum/evidence_ledger.py` | Source/claim ledger + hard gates |
| `quantum/page_justification.py` | Distinct-value / near-dup gate |
| `quantum/quality_gates.py` | Section 15 weighted score + hard gates |
| `quantum/state_machine.py` | Content job states + idempotent create |
| `quantum/data/evaluations/seo_package_eval.json` | Evaluation of 112 SEO package pages |
| `tests/quantum/test_evidence_ledger.py` | Unit tests |
| `tests/quantum/test_state_machine.py` | Unit tests |
| `Makefile` | bootstrap/test/evaluate-seo/ledger-validate/build |

## Findings for produced SEO content

QUANTUM gates applied to the 112-page package:

1. **24 hard near-duplicates** (Jaccard ≥ 0.80) — cluster of strategy/persona/burnout/template siblings need editorial differentiation.
2. **59 score rejects** — often evidence dimension low because **no material claims registered** yet (`register_material_claims_in_evidence_ledger` repair).
3. **29 approve / approve_with_minor_repairs** — structurally strong, unique enough, dates/images present.

This is expected: the engine is doing its job. Next content work should reduce near-dups and attach first-party evidence records for product claims.
