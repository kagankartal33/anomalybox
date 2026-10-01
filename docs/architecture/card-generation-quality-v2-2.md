# Card Generation and Quality Gate V2.2

This pipeline is English-first and Instagram Reels-only. SEO resource generation remains separate.

## Release order

1. Apply `supabase/migrations/20260829120000_card_quality_v2_2.sql`, `supabase/migrations/20260829170000_card_duration_v2_2_1.sql`, and `supabase/migrations/20260829190000_card_generation_pilot_blockers.sql` in order in the target environment.
2. Deploy `admin-generation-batches`.
3. Create a disabled or `shadow` model profile. `api_key_env_var` must use the dedicated `VIRALBOX_MODEL_PROVIDER_*` namespace; set its value as an Edge Function secret.
4. Run shadow generation for 50 briefs in each pilot category: `beauty`, `entertainment_comedy`, `travel`, `fitness_wellness_safe`, and `food`.
5. Compute embeddings before scoring:

   ```powershell
   python tools/embed-card-stock-v2-2.py --apply --limit 50000 --revision <immutable-model-revision>
   ```

6. Score the batches and complete the blind 200-card gold set at `/admin/card-quality` (40 unique cards per pilot category: 20 existing-stock and 20 V2.2-generated cards). Reviewers must also mark the proposed runtime as `rushed`, `right`, or `padded` while automated scores remain hidden.
7. Build a qualification evaluation from explicit generation run IDs. Dry-run first:

   ```powershell
   npm.cmd run model:qualify-v2.2 -- --profile <profile-slug> --run-ids <uuid,uuid>
   npm.cmd run model:qualify-v2.2 -- --profile <profile-slug> --run-ids <uuid,uuid> --apply --approve
   ```

The qualification RPC rechecks the stored evaluation. It cannot approve a profile from caller-supplied metric JSON. Approval is bound to the exact provider/model, prompt version, schema version, quality-gate version, and evaluation ID. Contract changes to provider, protocol, model, URL, credential-variable name, or features automatically return the profile to `shadow`; a prompt or gate release also prevents non-shadow generation and publication until requalification.

## Generation and publication

`POST /admin/generation-batches/:id/generate` accepts `profile_slug`, `target_count` (1–25 per call), `candidate_multiplier: 3`, and `shadow`. Each slot produces three concepts, selects for lexical originality, expands one schema-v2 card, runs a separate critic, performs at most one rewrite, and then applies deterministic V2.2 gates. Operational restock deliberately requests one card per call so one Edge invocation does not accumulate provider latency; the runtime schedule still advances on the batch-global slot index.

### Runtime and filming-time policy

`durationSeconds` always means final edited runtime. It never means creator setup or filming time. Newly generated cards also receive a locally calculated `productionEstimate`; `captureMinutesLow/High` includes setup, takes, and resets while editing remains a separate range. Legacy schema-v2 cards remain valid without this optional field, and legacy `production_plan.shoot_time_minutes` is presented as a low-confidence compatibility estimate.

The model does not choose runtime freely. `duration-planner-v1` allocates a deterministic lane-balanced runtime profile (`quick_payoff` 12–18s, `single_proof` 19–27s, `story_proof` 28–39s, or `deep_process` 40–60s), then calculates the exact target from proof, speech, shot, location, and reset load. The slot index and distribution check include cards already generated in the batch, so repeated one-card requests cannot reset every card to the same profile. Expansion and the single rewrite must preserve that exact target. Batches with fewer than three profiles at 12+ cards or more than 20% of cards on one exact second cannot retain approved decisions. An identical normalized timing template is rejected on its second occurrence, including matches against earlier requests in the same batch.

The production estimate is deliberately marked `low` confidence until at least 20 real `actual_capture_minutes` samples exist in the same lane. Creator UI labels final runtime as `Final video` and reports filming as an estimated minute range, never as a guaranteed duration. Model qualification requires at least 200 blinded runtime-fit judgements and at least 85% `right`. Existing-stock gold cards form the shared baseline; every `generated` gold card used for provider qualification must belong to one of the candidate profile's explicit run IDs and match its provider, model, and prompt version. All gold comparisons must have been rescored by the active quality-gate version.

Publication rejects shadow runs, unapproved or disabled profiles, unfinished provenance, non-approved quality decisions, score floors, missing embedding provenance, semantic similarity at or above 0.78 without human approval, and exact published fingerprints. Existing inventory rows are ignored rather than reactivated or overwritten.

## Stock transition and rollback

Audit, quarantine preview, and rollback preview are dry-run commands. Commands ending in `:apply` and restock with `--apply` are explicit mutation steps and must run only after reviewing their dry-run output:

```powershell
npm.cmd run stock:audit-v2.2
npm.cmd run stock:quarantine-v2.2
npm.cmd run stock:quarantine-v2.2:apply
npm.cmd run stock:restock-pilot-v2.2 -- --apply --profile <profile-slug> --embedding-revision <immutable-model-revision>
npm.cmd run stock:rollback-v2.2
npm.cmd run stock:rollback-v2.2:apply -- --idea-ids <approved-uuid,approved-uuid>
```

Quarantine only touches unused, unreserved `available` inventory and preserves rows as `paused` with `metadata.pause_reason=quality_quarantine_v2_2`. Reads are paginated, and the final status change is an atomic database function that rechecks delivery and active reservation state, closing the audit-to-update race. Rollback requires an explicit admin-approved idea ID list and performs the same atomic checks before restoration. The old `generate-category-stock.ps1` tool requires `-FixtureMode` and is restricted to localhost. `fill-lane-persona-stock.ts` is also dry-run/fixture-only; both `--apply` and SQL publication output are rejected so fixed-duration fallback cards cannot bypass qualification.

The stock audit reports overall and per-lane runtime histograms plus repeated timing fingerprints. Common durations are evidence for review, not a standalone quarantine reason; only hard-gate failures trigger the reversible quarantine path.

## Required local gates

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:idea-card
npm.cmd run test:model-adapters
npm.cmd run test:idea-card-quality
npm.cmd run test:idea-card-qualification
npm.cmd run build
```

`test:idea-card-qualification` must remain red until the complete, lane-balanced 200-card gold set exists and agreement/rank thresholds pass. Local Supabase integration also requires a running Docker engine.