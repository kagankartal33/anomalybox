# Automatic card quality V2.3.1

Active versions: `idea-card-premium-v2.4.0-automatic`, curriculum `card-curriculum-v1`, schema 2,
`quality-gate-v2.3.1-automatic`, qualification mode `automatic-v1`.
English / Instagram Reels only. SEO remains a separate pipeline.

## No mandatory human review

All routine generation, rewriting, scoring and publication decisions are automatic.
Uncertainty means unpublished `refine`; a hard failure or score below 78 means
`reject`. Approval requires >=88 and every blocking check passing.

Gold ratings and the existing review UI are optional historical tools. No new
human gold set or Spearman score is required. Human approval cannot bypass failed
checks; existing explicit editorial vetoes remain vetoes. Automated scores are
heuristics, not human calibration, guaranteed quality or a promise of virality.

## Generation contract

`POST /admin/generation-batches/:id/generate` takes `profile_slug`,
`target_count: 1`, `candidate_multiplier: 3`, `shadow`, and a UUID `request_id`.
Retries MUST reuse the same request ID. A database lease allows one active request
per batch, expires abandoned runs after 10 minutes and prevents duplicate replay.
Expired same-ID replays are reconciled to `failed` or `partial` using stored
imports, even when the model profile is disabled. They do not call the model
again. A genuinely new attempt uses a new request ID after the terminal result.
Expired workers cannot insert new candidates. Setup read errors close the run.
Provider calls share a 30-second total deadline including JSON repair within a
100-second request budget. The JSON fallback receives the schema on both attempts
and safe field/code validation feedback; token usage includes both attempts,
including failed outputs. Missing usage remains unknown, not fabricated zero.

The writer profile must set `features.critic_profile_slug` to an enabled,
different provider/model. Credentials stay in `VIRALBOX_MODEL_PROVIDER_*`
environment variables; profiles store variable names only.

1. Generate three concepts; select one original concept that fits its runtime.
2. Expand into the local schema, preserving lane, hook, format and exact duration.
3. Independently critique filmability, lane fit, natural speech, visible proof,
   safety and originality. Every check must pass; uncertainty cannot pass.
4. Permit one rewrite. Reject an unchanged rewrite. Changed content gets another
   independent critique and all deterministic checks again.
5. Store trusted run provenance and a SHA-256 content snapshot. Explicit critic
   rejection and generation hard gates survive rescoring.
6. Compute embeddings, score and publish only current qualified approvals.

Public import cannot supply trusted generation metadata. Imported legacy cards
remain readable but do not gain automatic publication authorization. Refine/reject
cards are retained, not silently promoted. Unrelated failed runs do not poison a
different valid card.

## Runtime and duplicate checks

Final edited runtime is separate from estimated setup/capture/editing time.
Runtime profiles are 12-18, 19-27, 28-39 and 40-60 seconds, balanced across the
batch. Speech and physical action load must fit; impossible concepts are rejected
instead of clamped. Duplicate step IDs, timeline gaps, rushed dialogue, missing
actions/camera framing/proof and impossible continuous waits block approval.
Holding a sample, timer or other prop is not a performed proof beat. A performed
comparison or visible result is required. Shared sponsor checks require `#ad`,
`Paid partnership` or `Sponsored by` in spoken/overlay text in the first two
steps. Explicit non-consensual recording rejects; ambiguous third-party private
data stays unpublished. Negative safety instructions and explicit consent are
tested separately to reduce false positives. These checks remain heuristics;
independent model critique still checks the actual meaning and safety.
Repeated timing templates reject; qualification checks runtime diversity.

Filming-minute estimates remain low-confidence and uncalibrated until sufficient
actual creator feedback exists. Quality feedback needs 20 actual-shot ratings
in the same lane and can adjust the score by at most +/-5.

The independent local embedding worker includes legacy scenes and the whole card:

```powershell
python tools/embed-card-stock-v2-2.py --limit 50000 --revision <40-character-HF-commit>
python tools/embed-card-stock-v2-2.py --apply --limit 50000 --revision <40-character-HF-commit>
```

The revision must be an immutable commit SHA. Long input is token-chunked and
pooled, not silently truncated. All cards are compared globally. The worker
refuses a partial or changing corpus. Metadata binds model revision, document
version, content hash, corpus revision/count and chunk count. Similarities round
conservatively to the database's four decimals. Embedding alone never updates
quality decisions: rescore afterward.

Fingerprint >=0.92 rejects. Semantic >=0.86 rejects; 0.78-0.8599 stays unpublished
as refine. Retitling identical actions cannot evade structural fingerprints.
Corpus changes invalidate evidence for new publication. Pairwise comparison is
quadratic: --limit is a safety cap, not sampling. Use stable corpus windows.
Semantic matching remains approximate, not a proof of perfect originality.

## Automatic qualification

Use dedicated qualification batches with at least 50 evaluated cards in each of
beauty, entertainment_comedy, travel, fitness_wellness_safe and food. Include ALL
current-contract run IDs from the selected batches, including failed attempts.
Omitting failures is rejected. Embed and score every candidate first.

```powershell
npm.cmd run model:qualify-v2.2 -- --profile <slug> --run-ids <uuid,uuid>
npm.cmd run model:qualify-v2.2 -- --profile <slug> --run-ids <uuid,uuid> --apply --approve
```

Requirements: >=250 evaluated cards; schema >=98%; SAFE approve >=55%; approved
average >=88; duplicate >=0.78 rate <=5%; banned residue <=1%; duration fit >=95%;
exact-second maximum share <=20%; no repeated timing templates. Every approved
card needs a passing independent critic. All evaluated cards need current
snapshot, gate, critic and embedding evidence. The versioned adversarial
regression suite must also pass.

The database rechecks stored evidence and actual counts. Approval binds writer,
critic and prompt/schema/gate versions. Writer changes reset qualification;
critic configuration changes invalidate dependent writers. Automated
qualification is not equivalent to human-calibrated evaluation.

## Release and stock safeguards

Apply migrations 20260829120000, 20260829170000, 20260829190000, then
`20260831090000_automatic_card_quality.sql`, then
`20260831120000_card_quality_consistency.sql` locally and test before production.
The migrations reset old model approvals to shadow. There is no bulk inventory
mutation. Updated quality/proof rules require fresh automatic qualification with
the 24-case `automatic-quality-regression-v2` suite; old approvals cannot publish.

Deploy the updated function together with its deno.json, using
[Supabase per-function dependency configuration](https://supabase.com/docs/guides/functions/dependencies).
The import map resolves shared aliases and pins Zod. Its local verification is
not a Deno runtime test.

The database rejects new available inventory without current automatic evidence,
including alternate import paths. Existing stock is not reactivated by replay.
Audit/quarantine remains dry-run by default. Legacy cards are normalized while
raw residue is still checked; stale duplicate scores cannot cause quarantine.
Atomic quarantine/rollback RPCs protect delivered, reserved and used stock.
After a subsequent quality rejection, veto, unsafe candidate status or card
snapshot change, database triggers quarantine only unused, unreserved stock.
Checkout reads current quality too, so an old inventory score cannot override a
new rejection. Reapproval does not reactivate paused stock; explicit rollback
must also pass current content/quality checks. Corpus growth alone does not
invalidate already published stock, only evidence for new publication.

Rollback is an explicit operational action: disable the profile, keep generation
in shadow and restore only named eligible quarantine rows. It is not a routine
human review stage.

## Verification and limitations

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:idea-card
npm.cmd run test:model-adapters
npm.cmd run test:idea-card-quality
npm.cmd run test:idea-card-qualification
npm.cmd run test:card-embeddings
npm.cmd run build
```

Typecheck includes the edge function, operational tools and tests. Quality tests
use local dependencies, not npx --yes or model downloads. The qualification test
script tests LOGIC, not an actual model. The old human benchmark remains optional
under `test:idea-card-gold-optional`.

Workflow tests exercise actual generator/import/scorer/publisher functions with
mocked provider/database calls. Python tests use offline fake embeddings. They
do not prove SQL execution, real model performance or live semantic quality.
Full Supabase batch, feedback, quarantine/rollback and one-use delivery tests
require running local Docker/Supabase. Unit-test success alone never qualifies a
provider or authorizes bulk restock.

With local migrations applied, run `npm.cmd run test:automatic-quality-db` for
transactional publication, corpus-revision, false-qualification, post-score stock,
protected inventory, rollback and abandoned-request recovery guards. Run
the existing single-use delivery script separately: it seeds pre-upgrade stock
with the named publication trigger temporarily disabled inside a local setup
transaction, restores it before delivery, and does not bypass delivery rules.
