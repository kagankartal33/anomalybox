# Card training V2 — current operating contract

> Archived V2 contract. Superseded by [card-training-v3.md](card-training-v3.md); retained only for legacy reader compatibility.

Updated 2026-08-31. English / Instagram Reels only. No mandatory human review.
SEO resources, book excerpts and raw social posts are not SFT card targets.

## What changed

The production writer, concept planner, independent critic and rewrite all receive
the same versioned curriculum from `lib/generation/card-training.ts`.
Five pilot lanes have distinct narrative and evidence objectives, plus a small
contrastive lesson. These lessons are not reusable scripts or proven viral formulas.
The shared curriculum covers continuity, dialogue, quantities, props, truthful
results, realistic timing and privacy/sponsorship boundaries.

The old `build-secure-sft-idea-cards.py` no longer multiplies a few templates into
tens of thousands of rows. It delegates to the local TypeScript data compiler.
Old archives and adapters are preserved, not silently approved or deleted.

## Current versions

- Production prompt: `idea-card-premium-v2.4.0-automatic`.
- Curriculum: `card-curriculum-v1`.
- SFT format: `card-sft-v2`.
- Shared scoring gate remains `quality-gate-v2.3.1-automatic`; this change improves
  training and prompt context, not the deterministic scoring formula.
- SQL migration: `20260831150000_card_training_curriculum.sql`. Previous prompt
  approvals cannot approve this prompt. Existing automatic critic, embedding,
  qualification and delivery restrictions remain in place.

Code tests, corpus validation, GPU training, model qualification and production
deployment are separate outcomes. Passing one does not imply the others.

## Input data contract

Each JSONL row must satisfy `cardTrainingRecordSchema` in
`lib/generation/card-training-dataset.ts`:

- `source`: stable `id`, `familyId`, `origin`, `rights`, `language: en`,
  `pipeline: idea_card_only`. Origin/rights must be original/owned,
  permissioned/licensed or synthetic/synthetic_original. These are provenance
  declarations; the compiler does not independently establish a license.
- `context`: category slug, persona slug and `platform: instagram_reels`.
- `concept`: the full current concept plan, including runtime/production planning.
- `card`: the current stored schema-v2 card. Mandatory generation fields must be
  present. Computed production estimates are excluded from assistant targets.
- `verification`: current prompt/gate versions, a matching `cardHash`, generator
  identity, independent critic identity and passing structured result. Semantic
  evidence includes a finite `maxSimilarity`, matching `sourceTextHash`, embedding model and full pinned
  revision, `documentVersion: card-semantic-v2`, `scope: global`, and
  `corpusComplete: true`.

Use verified internal generation records, not arbitrary user uploads. Snapshot
hashes detect stale evidence, not fabricated provenance. The compiler does not
call a critic or calculate embeddings; it validates supplied internal evidence and
re-runs the shared deterministic gate. Missing evidence is rejected, not guessed.
No self-reported model score is used. No secret or private reasoning field is part
of the training record contract. Synthetic fixtures in tests are not production evidence.

New generation traces retain the compact selected `generation.concept_plan` and
`generation_gate.critic_result` (decision/check enums, short issue codes and edit
instructions only) so later approved exports can recover their actual planning
input and critic result. These are internal metadata, not creator-facing copy or
private chain-of-thought. Older records missing this evidence cannot be upgraded
by inventing it.

## Data gates and reproducibility

Only currently approved, schema-valid, lane-consistent cards with an independent
passing critic and global semantic similarity below 0.78 are eligible.
Hard failures, uncertain safety, stale snapshots and undocumented rights are excluded.
No legacy adaptation or placeholder filling is performed to make bad targets pass.

Before splitting, remove duplicate IDs, exact content, lexical overlap at 0.78 and
action overlap at 0.86. These are lexical checks, not pretend embeddings. Supplied
real semantic evidence is a separate requirement. IDs or timestamps do not establish
novelty. Retiming a copied scenario does not make it a new example.

All members of a source family share a stable hash-based 80/10/10 train/validation/test
assignment, including cross-category variants. Row ordering cannot choose the
surviving duplicate. Appending new families does not reshuffle existing assignments.
Percentages are approximate, so small corpora can have empty held-out splits.

Training readiness requires at least 200 unique eligible cards; each pilot lane
needs at least 20 train, 5 validation and 5 test cards, with at least three runtime
profiles. No exact video duration may exceed 20% of the corpus; a category cannot
exceed 35% or a source family 10%. These are automated coverage floors, not a human
gold set or proof of premium model performance.

Each export writes train/validation/test JSONL, source-family metadata and a
manifest with SHA-256 file hashes, rejection codes, coverage and readiness blockers.
The destination must be new; the manifest is written last. Rejected prose is not logged.

## Commands

Use local dependencies; no `npx --yes` or live registry is needed for tests/export.

```powershell
npm.cmd run build:sft-idea-card -- --help
npm.cmd run build:sft-idea-card -- --input approved-card-records.jsonl --audit
npm.cmd run build:sft-idea-card -- --input approved-card-records.jsonl --out NEW_DATASET_DIRECTORY --require-ready
python tools/train-lora-idea-card-secure.py --data DATASET_DIRECTORY --audit-data
```

`--audit` does not write files. `--require-ready` exits nonzero if coverage is
insufficient; an exported manifest can still explain why the dataset is blocked.
The default CLI does not generate new cards, download models, train weights or publish inventory.

## GPU training safeguards

Before starting a GPU run, supply a ready dataset, a new output directory and a
full base-model commit using `--revision`. The existing small-model default is not
a recommendation or assurance of premium quality. Every model must qualify separately.

```powershell
python tools/train-lora-idea-card-secure.py --data DATASET_DIRECTORY --revision PINNED_40_HEX_COMMIT --preflight-only
python tools/train-lora-idea-card-secure.py --data DATASET_DIRECTORY --revision PINNED_40_HEX_COMMIT --out NEW_ADAPTER_DIRECTORY
```

No download is allowed unless `--allow-download` is explicitly supplied.
`--preflight-only` checks all targets with the cached model tokenizer without model
weights or GPU execution. The complete chat sequence must fit; otherwise it fails
with the required token count. Increasing sequence length can increase VRAM use;
do not respond to an overflow by truncating the JSON or dropping long cards.

Training uses the model's real chat template. Only assistant tokens contribute
to loss; system/user tokens and batch padding have label -100. Complete responses,
including the template's end token, are retained. Padding is dynamic. QLoRA prepares
the quantized model for training before attaching adapters. A failed quantized load
does not silently switch memory/cost regimes; `--fp16` is explicit.

The callback uses `on_step_end` for the time bound. Validation loss chooses a
checkpoint; the frozen test split never drives gradient updates or checkpoint
selection. Training reports remain `model_qualified: false`.

Compiler caches are process-local under `.cache/card-training` by default, fixing
inherited cache paths on unavailable external drives without changing system settings.

## Evaluation

Generate one actual output for every frozen test row, using only its system/user
messages, never its assistant target. Save `{source_id, output}` JSONL, including
refusals or invalid output; do not cherry-pick successes.

```powershell
npm.cmd run eval:lora-idea-card -- --dataset DATASET_DIRECTORY --samples GENERATED_JSONL
npm.cmd run test:card-training
```

The evaluator counts missing, duplicate, unexpected, malformed and off-brief
outputs as failures. It uses the shared production gate, not a substring search
for `schemaVersion` and `steps`. It is a held-out generation diagnostic: semantic
duplicate rate stays null and it cannot qualify or publish a model.

For release, run the existing independent critic, real global embeddings and
automatic provider qualification on the fixed multi-category benchmark. Compare
the old and new models on identical briefs and report failures, cost and latency.
Do not tune repeatedly against the frozen test set; revise the training/validation
set, and reserve a new untouched test set for the next release cycle.

## Archive audit evidence

On 2026-08-31, a read-only audit of the **first 1,000 rows**, not the entire archive,
of `runs/idea_card_v11/sft_idea_card_v11_master.jsonl` found 14 unique titles and
42 distinct content documents after ignoring storage IDs and timing. Durations:
18s: 200 rows, 28s: 400, 38s: 400. All 1,000 failed the current deterministic gate.
All lacked a performed proof beat, hook taxonomy and persona; 928 had unfilmably
fast dialogue, 357 had unsafe/unbounded claims. These are software audit results,
not human ratings. The archive was not modified.

## Research basis

Data consistency, targeted examples, representative coverage and matching the
inference format follow [OpenAI's fine-tuning data guidance](https://developers.openai.com/api/docs/guides/fine-tuning-best-practices).
The code uses model-native [Hugging Face chat templates](https://huggingface.co/docs/transformers/chat_templating),
the documented [Trainer callback lifecycle](https://huggingface.co/docs/transformers/main_classes/callback),
and [PEFT quantized-model preparation](https://huggingface.co/docs/peft/developer_guides/quantization).
This implementation is provider-independent and does not create a hosted fine-tuning job.

## Verification of this implementation

Local typecheck, lint, production build (316 generated pages), card tests, 24-case
quality regression, adapter/qualification contract tests, training tests and
offline embedding-worker tests passed. The cached Qwen tokenizer at revision
`989aa7980e4cf806f80c7fef2b1adb7bc71aa306` encoded the complete test example as 1,381
tokens: 876 prompt tokens masked from loss, 505 assistant tokens retained. This is
one tokenizer smoke test, not trained-model performance or a CUDA training test.

The Supabase SQL test could not connect to the local Docker Linux engine. The new
migration has not been applied to production. No new weights were trained and no
model was qualified or promoted in this implementation run; a sufficiently broad
verified corpus and a successful live shadow benchmark are still required.
