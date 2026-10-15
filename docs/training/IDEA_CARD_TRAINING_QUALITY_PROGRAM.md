# Idea card training quality program

World-class quality for the **viral idea card** pipeline only.  
SEO resources stay separate — see `docs/architecture/content-pipelines-separation.md`.

## Status

| Phase | Name | Status |
|-------|------|--------|
| 0 | Baseline measurement | **Done** — 2026-08-10 finalist scan: v2 red-gate pass **0%**, editorial mean **~88** |
| 1 | Gold set + eval harness | Fixtures + sample gold + eval runner green; **200 human ratings pending** |
| C1–C3 | Ban list hard errors + template purge + lint | **Done** — `banned-phrases.ts`, ban = error, stock templates cleaned, `lint:idea-card-templates` |
| B1–B2 | Site presentation layer | **Done** — `present.ts`, StorySpine, clearer header/Shoot Plan; cards sanitize toxic copy on serve |
| C6 | Adapt Action/spoken de-dupe | **Done** (soft scrub + clone split) |
| 2 | Craft-aware rank scorer | Pending |
| 3 | Corpus `2026-v10-6h-secure` | **Done 2026-08-10** — HF abstract → 57,596 examples; active compile |
| 3b | Deep audit + LoRA gen eval | **Done** — deep audit grade C (pass critical); **LoRA gen FAIL → do not wire** |
| 4 | Multi-pass generator | Pending |
| 5 | Quality Gate v2.2 (server hard reject) | Partial on client quality; admin-generation-batches still next |
| 6 | Pilot restock + monitoring | Pending |

## Commands

```powershell
# Phase 0 — measure latest finalist export
npm run audit:idea-card-baseline

# Phase 1 — fixture + optional gold eval
npm run test:idea-card-quality

# Existing structural tests
npm run test:idea-card
```

## Artifacts

| Path | Role |
|------|------|
| `docs/training/QUALITY_BASELINE_latest.json` | Latest offline metrics |
| `docs/training/QUALITY_BASELINE_latest.md` | Human summary |
| `docs/training/EVAL_IDEA_CARD_QUALITY_latest.json` | Last eval run |
| `docs/training/gold-set-schema.md` | Gold JSONL contract |
| `docs/training/fixtures/gold_v1.sample.jsonl` | Tiny sample gold |
| `docs/training/viral-corpus-methodology.md` | Corpus methodology |
| `docs/prompts/generate-ideas-system.md` | Generator system prompt |

Archive gold (preferred for full 200):

```text
ViralBox-training-archive/dataset/viral_card/gold/v1.jsonl
```

## Critical known gaps (do not forget)

1. **`scoreCandidate`** in `admin-generation-batches` uses field counts + **hash bonus** — not true craft quality.  
2. Schema v2 `patternDepth` scores stage labels, not VTP mechanism quality.  
3. Stock templates may still contain banned vague phrases.  
4. No full 200-card human gold yet.  
5. Long-tail categories use training profile global fallback.

## Success targets

| Metric | Target |
|--------|--------|
| QG approve rate (SAFE, pilot cats) | ≥ 55% |
| Editorial mean (approved) | ≥ 88 |
| Semantic dupe ≥ 0.78 | ≤ 5% |
| Banned phrase rate | ≤ 1% |
| Gold ↔ gate agreement | ≥ 85% |
| Scorer ↔ human Spearman | ≥ 0.6 |

## Next implementation order

1. Run baseline → fill `QUALITY_BASELINE_*.md` numbers.  
2. Rate 200 gold cards into archive path.  
3. Replace `scoreCandidate` with craft-aware v2 (shadow then cutover).  
4. Retrain compile `2026-v10-quality` + hygiene audit.  
5. Prompt modularization + stock template purge.  
6. Pilot regen: beauty, comedy, travel, fitness, food.
