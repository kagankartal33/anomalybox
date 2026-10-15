# Idea card gold set schema

Human-rated cards for training/eval quality. **Internal only** — never show in creator UI, never write under `content/resources/`.

## Location

Preferred (archive, large):

```text
C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\dataset\viral_card\gold\v1.jsonl
```

Sample in repo (fixtures / schema demo):

```text
docs/training/fixtures/gold_v1.sample.jsonl
```

## JSONL row schema

One JSON object per line.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Stable gold id (`gold_v1_0001`) |
| `idea_id` | string/uuid | no | Source idea if from inventory |
| `category_slug` | string | yes | e.g. `beauty` |
| `persona_slug` | string | no | e.g. `beauty_tester` |
| `platform` | string | no | e.g. `instagram_reels` |
| `language` | string | no | `en` / `tr` |
| `human_decision` | enum | yes | `approve` \| `refine` \| `reject` |
| `human_rank` | int 1–5 | yes | 5 = exceptional shoot-ready |
| `runtime_fit` | enum | yes | Blinded judgement: `rushed` \| `right` \| `padded` |
| `failure_codes` | string[] | yes | Empty if approve; see codes below |
| `rater` | string | no | Human handle |
| `rated_at` | ISO date | no | |
| `notes` | string | no | Short free text |
| `card` | object | yes | Full idea_card (legacy premium blob or schemaVersion 2) |
| `source` | string | yes | Qualification rows use `existing_stock` \| `generated`; legacy `inventory`/`finalist_export` and `batch` normalize to those values |

### failure_codes

| Code | Meaning |
|------|---------|
| `vague_language` | Banned / empty AI phrases |
| `unshootable` | Missing concrete Action/Shot/timeline |
| `meta_dialogue` | “the creator should…” style lines |
| `generic_cta` | Follow/comment spam CTA |
| `duplicate_feel` | Near-duplicate of known inventory |
| `unsafe` | Challenge / claim / privacy risk |
| `empty_layers` | Missing required category layers |
| `runtime_rushed` | The spoken/action load does not fit the proposed final runtime |
| `runtime_padded` | The proposed final runtime is longer than the proof/action load needs |

Qualification requires 200 unique cards: 40 per pilot category, with 20 existing-stock and 20 generated cards in every category. Every row must include a blinded runtime-fit judgement, and at least 85% must be marked `right`.
| `score_leak` | Internal score/VTP/training text visible |
| `weak_mechanism` | No real viral mechanism / pure template |
| `brand_risk` | Disclosure / claim boundary fail |

## Target mix (v1)

| Decision | Count | Share |
|----------|------:|------:|
| approve | 100 | 50% |
| refine | 50 | 25% |
| reject | 50 | 25% |
| **Total** | **200** | 100% |

Pilot categories first: beauty, comedy, travel, fitness, food.

## Rating rubric (quick)

1. Could a creator film this **today** without inventing steps?  
2. Is language concrete (no banned vague phrases)?  
3. Timeline continuous from 0?  
4. Distinct from stock templates?  
5. Safe for brand/high-profile?  

If 1–3 fail → `reject`. If filmable but thin/generic → `refine`. If all pass and premium → `approve` (rank 4–5).

## Commands

```powershell
# Fixtures only (CI-safe)
npm run test:idea-card-quality

# Against gold file
npx --yes tsx tools/eval-idea-card-quality.mjs --gold "C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\dataset\viral_card\gold\v1.jsonl"
```

## Policy

- Pattern-only training remains: gold teaches **quality judgment**, not copy surfaces.
- Do not put VTP ids or scores inside `card` creator-facing fields.
- Expand gold +50/month from creator feedback after pilot.
