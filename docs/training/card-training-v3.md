# Idea card training V3

This is the automatic English Instagram Reels training contract. It is isolated from SEO content.

## Frozen contracts

- Curriculum: `card-curriculum-v2`
- Prompt: `idea-card-premium-v3.0.0-automatic`
- Creative taxonomy: `creative-taxonomy-v1`
- Quality gate: `quality-gate-v3.0.1-automatic`
- Generation pipeline: `generation-pipeline-v3.1.2`
- Creative scheduler: `creative-scheduler-v2.1`
- Concept ranker: `concept-ranker-v2`
- Duration planner: `duration-planner-v2`
- Automatic policy: `automatic-card-policy-v3.1`
- Dataset: `card-sft-v3`
- Creator output: schemaVersion 2

Changing any prompt, taxonomy, schema or gate contract invalidates prior model qualification.
Changing the pipeline, scheduler, concept ranker, duration planner or automatic policy also
invalidates prior qualification even when the creator-facing schema remains unchanged.
Creator cards never contain recipe IDs, scores, genre, emotion or vibe labels.

Scheduler V2 selects from independently salted axes, rewards underused pair combinations and
refuses an exact recipe signature already present in the lane window. The database reserves the
selected signature atomically before drafting, so concurrent workers cannot commit the same
category/persona/platform recipe. Concept Ranker V2 no longer chooses on lexical distance alone;
it combines originality, promise/proof coherence, execution fit, specificity and production cost.

V3.1.1 validates hook delivery, presence and filming-format compatibility with one shared
contract. Persistent signatures encode every recipe field; short hashes are not identity or
equality evidence. Pending reservations have an owner and a lease, while successfully imported
signatures remain committed. Candidate and creator-card records are imported atomically, and
ambiguous finalization failures are reconciled from persisted card evidence before replay.

## Verified dataset

Training readiness requires at least 720 independently verified, rights-safe English cards:
60 in each of the 12 lanes. Source-family hashing creates an 80/10/10 train, validation and
test split; a source family may never cross splits. Every lane needs at least eight genres,
eight hooks, six emotion arcs and eight vibes. Exact or lexical/action duplicates are rejected,
and supplied global semantic evidence must be current and below 0.78.

Each accepted record contains the scheduled CreativeRecipe, concept plan, complete schema-v2
card, independent critic result, immutable card hash and sentence-transformer evidence. Synthetic
multiplication, copied surface text, legacy card packs and SEO rows are not accepted.

## Automatic qualification

Qualification consumes 600 real outputs: 50 for every lane. All 12 lanes pass or the profile
remains shadow. Required metrics are enforced both in TypeScript and the Supabase qualification
function: schema/taxonomy at least 99%, recipe adherence at least 98%, SAFE approval at least 55%,
approved mean at least 90, critic/first-frame/proof-payoff pass at 100%, embedding coverage at
100%, duplicate rate at most 3%, creator residue at most 0.5%, and all 72 adversarial fixtures.
Each category must meet the applicable thresholds independently; a strong aggregate cannot
hide a failed category. Qualification also binds the critic profile ID and model contract,
not only its mutable profile name.

There is no human approval fallback. Uncertainty becomes refine or reject. A writer profile must
name an enabled critic profile with a different provider or model identity. Publication additionally
requires a current global embedding corpus, a non-shadow run and a currently qualified profile.

## Commands

- `npm run test:card-training`
- `npm run test:idea-card-quality`
- `npm run build:sft-idea-card -- --input verified.jsonl --audit`
- `npm run model:qualify-v3 -- --profile PROFILE --run-ids UUIDS`

The qualification command defaults to dry-run. `--apply --approve` is required to persist and
approve a passing evaluation; it cannot override a failed contract.
