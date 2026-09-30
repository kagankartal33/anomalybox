# Card Generation and Quality Gate V2.2

This pipeline is English-first and Instagram Reels-only. SEO resource generation remains separate.

## Release order

1. Apply `supabase/migrations/20260829120000_card_quality_v2_2.sql` in the target environment.
2. Deploy `admin-generation-batches`.
3. Create a disabled or `shadow` model profile. Store only the environment-variable name in `api_key_env_var`; set the credential as an Edge Function secret.
4. Run shadow generation for 50 briefs in each pilot category: `beauty`, `entertainment_comedy`, `travel`, `fitness_wellness_safe`, and `food`.
5. Compute embeddings before scoring:

   ```powershell
   python tools/embed-card-stock-v2-2.py --apply --limit 50000 --revision <immutable-model-revision>
   ```

6. Score the batches and complete the blind 200-card gold set at `/admin/card-quality` (40 unique cards per pilot category, balanced between existing and V2.2-generated stock).
7. Build a qualification evaluation from explicit generation run IDs. Dry-run first:

   ```powershell
   npm.cmd run model:qualify-v2.2 -- --profile <profile-slug> --run-ids <uuid,uuid>
   npm.cmd run model:qualify-v2.2 -- --profile <profile-slug> --run-ids <uuid,uuid> --apply --approve
   ```

The qualification RPC rechecks the stored evaluation. It cannot approve a profile from caller-supplied metric JSON. Contract changes to provider, protocol, model, URL, credential-variable name, or features automatically return the profile to `shadow`.

## Generation and publication

`POST /admin/generation-batches/:id/generate` accepts `profile_slug`, `target_count` (1–25 per call), `candidate_multiplier: 3`, and `shadow`. Each slot produces three concepts, selects for lexical originality, expands one schema-v2 card, runs a separate critic, performs at most one rewrite, and then applies deterministic V2.2 gates.

Publication rejects shadow runs, unapproved or disabled profiles, unfinished provenance, non-approved quality decisions, score floors, missing embedding provenance, semantic similarity at or above 0.78 without human approval, and exact published fingerprints. Existing inventory rows are ignored rather than reactivated or overwritten.

## Stock transition and rollback

All stock commands are dry-run by default:

```powershell
npm.cmd run stock:audit-v2.2
npm.cmd run stock:quarantine-v2.2
npm.cmd run stock:restock-pilot-v2.2 -- --apply --profile <profile-slug> --embedding-revision <immutable-model-revision>
npm.cmd run stock:rollback-v2.2
npm.cmd run stock:rollback-v2.2:apply -- --idea-ids <approved-uuid,approved-uuid>
```

Quarantine only touches unused `available` inventory and preserves rows as `paused` with `metadata.pause_reason=quality_quarantine_v2_2`. Rollback requires an explicit admin-approved idea ID list and never restores delivered or used cards. The old `generate-category-stock.ps1` tool requires `-FixtureMode` and is restricted to localhost.

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