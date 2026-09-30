# Idea card training V3

This is the automatic English Instagram Reels training contract. It is isolated from SEO content.

## Frozen contracts

- Curriculum: `card-curriculum-v2`
- Prompt: `idea-card-premium-v3.0.0-automatic`
- Creative taxonomy: `creative-taxonomy-v1`
- Quality gate: `quality-gate-v3.0.0-automatic`
- Dataset: `card-sft-v3`
- Creator output: schemaVersion 2

Changing any prompt, taxonomy, schema or gate contract invalidates prior model qualification.
Creator cards never contain recipe IDs, scores, genre, emotion or vibe labels.

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