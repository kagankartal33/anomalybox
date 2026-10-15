# Idea card quality baseline

- Generated: 2026-08-13T23:55:42.099Z
- Source: `production_exports/mvp_finalists_20260705_222400/finalist_cards.jsonl`
- Cards scanned: **35**

## Rates

| Metric | Value |
|---|---:|
| Red gates passed | 100.0% |
| Schema v2 high band | 100.0% |
| Blocking quality errors | 0.0% |
| Red gate failures | 0.0% |
| Leak signal | 0.0% |
| Banned phrase (v2 issues) | 0.0% |
| Legacy adapted | 100.0% |

## Schema v2 score

- mean: 94.0
- p50: 94
- p90: 94
- min/max: 94 / 94

## Top issue codes

- `UNSUPPORTED_SCHEMA_VERSION`: 35
- `WEAK_ACTION`: 35

## Top banned phrases (blob + v2)

- “proof detail”: 35
- “carry the energy”: 35
- “hidden decision”: 35
- “content moment”: 35
- “let the proof carry”: 35
- “here is the proof detail”: 35
- “beauty moment”: 7
- “for this beauty moment”: 7
- “food moment”: 7
- “for this food moment”: 7

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

Raw JSON: `docs/training/QUALITY_BASELINE_latest.json`
