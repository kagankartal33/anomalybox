# Idea card quality baseline

- Generated: 2026-08-10T01:26:39.378Z
- Source: `production_exports/mvp_finalists_20260705_222400/finalist_cards.jsonl`
- Cards scanned: **35**

## Rates

| Metric | Value |
|---|---:|
| Red gates passed | 0.0% |
| Schema v2 high band | 0.0% |
| Blocking quality errors | 100.0% |
| Red gate failures | 100.0% |
| Leak signal | 0.0% |
| Banned phrase (v2 issues) | 100.0% |
| Legacy adapted | 100.0% |

## Schema v2 score

- mean: 50.0
- p50: 50
- p90: 50
- min/max: 50 / 50

## Top issue codes

- `BANNED_VAGUE_PHRASE`: 266
- `DUPLICATE_FIELD_TEXT`: 170
- `UNSUPPORTED_SCHEMA_VERSION`: 35

## Top banned phrases (blob + v2)

- “proof detail”: 105
- “here is the proof detail”: 105
- “carry the energy”: 70
- “let the proof carry”: 70
- “hidden decision”: 35
- “content moment”: 35
- “beauty moment”: 21
- “for this beauty moment”: 21
- “food moment”: 21
- “for this food moment”: 21

## By category

- beauty: 7
- fashion: 7
- travel: 7
- lifestyle: 7
- food: 7

## North-star targets

| Metric | Target |
|---|---:|
| Approve rate (SAFE) | ≥ 55% |
| Editorial mean (approved) | ≥ 88 |
| Semantic dupe ≥ 0.78 | ≤ 5% |
| Banned phrase rate | ≤ 1% |
| Gold ↔ gate agreement | ≥ 85% |
| Scorer ↔ human Spearman | ≥ 0.6 |

## Interpretation (critical)

1. **Old Quality Gate editorial mean ≈ 88** on these finalists — they passed inventory selection heuristics.
2. **Schema v2 language/structure red gates: 0% pass.** Every card hit banned vague phrases and Action/Say-this clones after `adaptLegacyIdeaCard`.
3. Dominant template phrases (`proof detail`, `carry the energy`, `hidden decision`, `* moment`) come from stock generation scaffolding, not random LLM drift.
4. Implication: **rank/inventory quality ≠ creator language quality.** Phase 2 (craft scorer) + Phase 4 (template purge) are mandatory before restock.
5. Sample size is small (35 finalists / 5 categories). Re-run on full batch exports when available.

Raw JSON: `docs/training/QUALITY_BASELINE_latest.json`
