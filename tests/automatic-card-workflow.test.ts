import assert from "node:assert/strict";
import { automaticCard } from "./fixtures/automatic-card";
import { edgeHarness } from "./helpers/card-edge-harness";
import { AUTOMATIC_POLICY_VERSION, CRITIC_CHECKS, GENERATION_PIPELINE_VERSION, cardContentHash, modelContract, sha256, stableJson } from "../lib/generation/automatic-policy";
import { PROMPT_VERSION } from "../lib/generation/contracts";
import { CONCEPT_RANKER_VERSION } from "../lib/generation/concept-ranking";
import { planCardDuration, plannedRuntimeProfile } from "../lib/idea-card/duration-planner";
import type { StructuredGenerationRequest, ModelProviderProfile } from "../lib/generation/model-provider-adapter";
import type { ModelProviderError } from "../lib/generation/model-provider-adapter";
import { CARD_TRAINING_VERSION } from "../lib/generation/card-training";
import { CREATIVE_SCHEDULER_VERSION, CREATIVE_TAXONOMY_VERSION, creativeDirectionForRecipe, scheduleCreativeRecipes, type CreativeRecipe } from "../lib/generation/creative-taxonomy";

type Row = Record<string, unknown>;
const batchId = "00000000-0000-4000-8000-000000000001", runId = "00000000-0000-4000-8000-000000000002";
const batch = { id: batchId, target_count: 1, platform: "instagram_reels", language: "en", category_id: "beauty", persona_id: "luxury_editor", manifest: {} };
const generator = { id: "generator", profile_slug: "generator", provider: "test", protocol: "json_text", model: "writer", enabled: true, api_key_env_var: "VIRALBOX_MODEL_PROVIDER_TEST", features: { critic_profile_slug: "critic" }, qualification_status: "shadow" };
const critic = { ...generator, id: "critic", profile_slug: "critic", model: "critic", features: {} };
const pass = { decision: "pass", issueCodes: [], editInstructions: [], checks: Object.fromEntries(CRITIC_CHECKS.map(key => [key, "pass"])) };
const revise = { ...pass, decision: "revise", issueCodes: ["natural_speech"], editInstructions: ["Make the takeaway more conversational."], checks: { ...pass.checks, natural_speech: "fail" } };

function cardForRecipe(recipe: CreativeRecipe, duration: number) {
  const proof: Record<string, string> = {
    controlled_side_by_side: "Compare both samples side by side.", live_demonstration: "Demonstrate the application live.", measured_readout: "Show the measured readout.", process_result: "Show the finished process result.", visible_consequence: "Show the visible change result.", reversal_callback: "Reveal the reversal callback.", source_receipt: "Show the source receipt.", route_map: "Show the route map.", sensory_result: "Show the texture and feel.", form_reference: "Show posture and alignment.", decision_matrix: "Show the decision matrix.", before_after_state: "Show the before and after difference.",
  };
  const payoff: Record<string, string> = {
    visible_result: "Show the finished result.", side_by_side_decision: "Show both sides so the choice is clear.", reversal_callback: "Reveal the reversal callback.", before_after_state: "Show the before and after difference.", answer_reveal: "Reveal the answer.", usable_artifact: "Show the checklist artifact.", sensory_finish: "Show the texture finish.", mistake_correction: "Show the corrected result.", identity_resolution: "Show the final style choice.", open_loop_close: "Reveal the resolved answer.",
  };
  const card = structuredClone(automaticCard);
  card.hookId = recipe.hookTypeId;
  card.shootFormat = recipe.shootFormat;
  card.presenceMode = recipe.presenceMode;
  card.durationSeconds = duration;
  card.steps = card.steps.map((step, index) => ({
    ...step,
    endSecond: index === card.steps.length - 1 ? duration : step.endSecond,
    action: index === 2 ? `${step.action}. ${proof[recipe.proofDeviceId]}` : index === card.steps.length - 1 ? `Show the completed comparison. ${payoff[recipe.payoffTypeId]}` : step.action,
    shot: index === 0 && recipe.hookDeliveryId === "environment" ? `${step.shot} in the bathroom studio.` : step.shot,
    editNote: index === 0 && recipe.hookDeliveryId === "edit_transition" ? "Match cut from the finished result back to the before state." : index === 0 && recipe.hookDeliveryId === "sound" ? "Let the tap sound arrive before the source is shown." : step.editNote,
  }));
  return card;
}

async function scenario(mode: "pass" | "no_change" | "fixed" | "still_bad" | "reject" | "infeasible" | "replay" | "draft_timeout" | "finalization_failure", reservations = new Set<string>()) {
  let drafts = 0, critiques = 0, concepts = 0, imports: Row[] = [];
  const profiles: string[] = [];
  const scheduledRecipes = scheduleCreativeRecipes({ lane: "beauty", seed: `${batchId}:0` });
  const conceptFor = (recipe: CreativeRecipe, conceptIndex: number) => ({
    conceptId: `test-concept-${conceptIndex}`, title: `${automaticCard.title} ${conceptIndex + 1}`, premise: `${automaticCard.conceptSummary} The setup variant is ${conceptIndex + 1}.`,
    recipe, hookId: recipe.hookTypeId, shootFormat: recipe.shootFormat,
    firstFramePlan: "Hold both skincare samples beside the mirror in a locked close-up.",
    soundPlan: creativeDirectionForRecipe(recipe).vibe.sound,
    emotionBeatPlan: { opening: "curiosity about the textures", middle: "clarity through equal application", payoff: "clarity from the visible finish" },
    proofPlan: "Apply both samples and compare their visible finishes.", viewerTakeaway: automaticCard.viewerTakeaway, mechanismIds: [recipe.hookTypeId, recipe.proofDeviceId], riskNotes: [],
    runtimeProfile: plannedRuntimeProfile("beauty", 0, 1), proofBeatCount: 1, spokenWordTarget: mode === "infeasible" ? 180 : 30,
    shotCount: 4, locationCount: 1, cameraSetupCount: 2, resetCount: 0,
  });
  const concept = conceptFor(scheduledRecipes[0], 0);
  const edge = edgeHarness(async (profile: ModelProviderProfile, request: StructuredGenerationRequest<unknown>) => {
    profiles.push(profile.model);
    assert.ok(request.prompt.includes(CARD_TRAINING_VERSION), "Every generation pass must receive the same versioned curriculum");
    assert.ok(request.prompt.includes("equal amounts"), "Beauty execution rules must survive draft, critic and rewrite passes");
    assert.ok(!request.prompt.includes("PRIVATE_EVAL_ANSWER"), "Evaluation briefs must not be fed back into generation");
    assert.ok(Number(profile.timeoutMs) <= 30000);
    let raw;
    if (request.schemaName.includes("concept_set")) {
      concepts++;
      raw = { concepts: scheduledRecipes.map(conceptFor) };
    } else if (request.schemaName.includes("critic")) {
      critiques++;
      assert.equal(profile.model, "critic");
      raw = mode === "reject" ? { ...revise, decision: "reject" } : ["pass", "finalization_failure"].includes(mode) || (mode === "fixed" && critiques === 2) ? pass : revise;
    } else {
      drafts++;
      if (mode === "draft_timeout") throw Reflect.construct(edge.ModelProviderError, ["timeout", "simulated draft timeout"]);
      const duration = planCardDuration("beauty", 0, 1, concept).targetSeconds;
      const recipeCard = cardForRecipe(concept.recipe, duration);
      raw = { ...recipeCard, steps: recipeCard.steps.map((step, i) => i === 3 ? { ...step, spokenLine: drafts === 2 && ["fixed", "still_bad"].includes(mode) ? "The finish here looks smoother in daylight." : step.spokenLine } : step) };
    }
    return { value: request.validate(raw), usage: { inputTokens: 2, outputTokens: 3, totalTokens: 5 }, repaired: false, latencyMs: 1 };
  });
  const patches: Row[] = [];
  let completionFailed = false;
  edge.mocks({
    resolveBatch: async () => batch,
    trainingContext: async () => ({ category: { slug: "beauty" }, persona: { slug: "luxury_editor" }, category_layer_policy: {}, eval_cases: [{ input_brief: "PRIVATE_EVAL_ANSWER" }] }),
    getPagedRows: async () => [],
    cardsForIdeas: async () => new Map(),
    getRows: async (table: string, query: string) => {
      if (table === "idea_model_profiles") return query.includes("profile_slug=eq.critic") ? [critic] : [generator];
      if (table === "idea_generation_runs" && mode === "replay") return [{ id: runId, profile_slug: "generator", shadow: true, status: "completed", imported_count: 1, requested_count: 1, candidate_multiplier: 5 }];
      return [];
    },
    postRows: async (table: string, body: Row) => {
      if (table === "rpc/reserve_idea_creative_signature") {
        const signature = String(body.p_signature);
        if (reservations.has(signature)) return false;
        reservations.add(signature);
        return true;
      }
      if (table === "rpc/reconcile_idea_generation_run") {
        if (!imports.length) reservations.clear();
        return { id: runId, status: imports.length ? "partial" : "failed", stage: imports.length ? "awaiting_embedding" : "failed", imported_count: imports.length, reject_count: imports.length ? 0 : 1 };
      }
      if (table === "rpc/release_pending_idea_creative_signatures") { reservations.clear(); return 1; }
      assert.equal(table, "idea_generation_runs");
      return [{ id: runId }];
    },
    patchRows: async (_table: string, _query: string, body: Row) => {
      if (mode === "finalization_failure" && !completionFailed && ["completed", "partial"].includes(String(body.status))) {
        completionFailed = true;
        throw new Error("simulated completion write failure");
      }
      patches.push(body); return [];
    },
    importBatch: async (_id: string, body: { ideas: Row[] }, verifiedId: string) => { assert.equal(verifiedId, runId); imports = body.ideas; return { imported: imports.length, rejected: 0 }; },
  });
  let error: unknown;
  const result = await edge.generateBatch(batchId, { profile_slug: "generator", request_id: batchId, target_count: 1, shadow: true }).catch((caught: unknown) => {
    if (!["draft_timeout", "finalization_failure"].includes(mode)) throw caught;
    error = caught;
    return {};
  });
  return { result, error, imports, concepts, drafts, critiques, profiles, patches };
}
const good = await scenario("pass");
assert.equal(good.imports.length, 1);
assert.equal(good.imports[0].generation_decision, "approve");
assert.equal(good.critiques, 1);
assert.equal(good.drafts, 1);
const noChange = await scenario("no_change");
assert.equal(noChange.imports[0].generation_decision, "reject");
assert.ok((noChange.imports[0].generation_gate as { hardGateCodes: string[] }).hardGateCodes.includes("rewrite_no_change"));
assert.equal(noChange.critiques, 1);
const fixed = await scenario("fixed");
assert.equal(fixed.drafts, 2);
assert.equal(fixed.critiques, 2, "Rewritten content must get a fresh independent critique");
assert.equal(fixed.imports[0].generation_decision, "approve");
const verification = (fixed.imports[0].generation_gate as { critic_verification: Row }).critic_verification;
assert.equal(verification.card_hash, await cardContentHash(fixed.imports[0].idea_card));
const stillBad = await scenario("still_bad");
assert.equal(stillBad.critiques, 2);
assert.notEqual(stillBad.imports[0].generation_decision, "approve");
const rejected = await scenario("reject");
assert.equal(rejected.imports[0].generation_decision, "reject");
assert.equal(rejected.drafts, 1, "An explicit critic rejection is terminal");
const infeasible = await scenario("infeasible");
assert.equal(infeasible.imports.length, 0);
assert.equal(infeasible.drafts, 0, "Do not clamp an impossible concept into a short runtime");
assert.ok(infeasible.patches.some((row: Row) => row.status === "failed" && row.stage === "failed"), "An all-rejected run must fail instead of pretending to have partial committed output");
const replay = await scenario("replay");
assert.equal(replay.concepts, 0);
assert.equal(replay.result.replayed, true);

const failedDraftReservations = new Set<string>();
for (let attempt = 0; attempt < 6; attempt += 1) {
  const failedDraft = await scenario("draft_timeout", failedDraftReservations);
  assert.ok(failedDraft.error, "A recovered failed draft must allow the next attempt to reach the provider");
  assert.equal(failedDraft.drafts, 1);
  assert.equal(failedDraftReservations.size, 0, "Uncommitted failed-run signatures must not poison the next batch slot");
}
const completionFailure = await scenario("finalization_failure");
assert.equal(completionFailure.imports.length, 1);
assert.ok(completionFailure.patches.some(row => row.status === "partial" && row.imported_count === 1), "Ambiguous finalization must retain actual imported-card evidence");
assert.ok(!completionFailure.patches.some(row => row.status === "failed"), "A committed card must not be stranded in a failed run");

for (const mode of ["expired", "expired_import", "active", "read_failure", "provider_failure"] as const) {
  const writes: Row[] = [];
  const runner = edgeHarness(() => {
    assert.equal(mode, "provider_failure", "No model call allowed during recovery");
    const error = Reflect.construct(runner.ModelProviderError, ["invalid_output", "Invalid repaired output"]) as ModelProviderError;
    error.usage = { inputTokens: 20, outputTokens: 10, totalTokens: 30 };
    throw error;
  });
  runner.mocks({
    resolveBatch: async () => batch,
    trainingContext: async () => ({ category: { slug: "beauty" }, persona: { slug: "luxury_editor" } }),
    getPagedRows: async () => [],
    getRows: async (table: string, query: string) => {
      if (table === "idea_model_profiles") {
        assert.ok(["read_failure", "provider_failure"].includes(mode), "Replay does not require an enabled profile");
        return query.includes("profile_slug=eq.critic") ? [critic] : [generator];
      }
      return table === "idea_generation_runs" && !["read_failure", "provider_failure"].includes(mode) ? [{ id: runId, profile_slug: "generator", shadow: true, status: "running", requested_count: 1, candidate_multiplier: 5 }] : [];
    },
    postRows: async (table: string, body: Row) => {
      writes.push({ table, ...body });
      if (table.startsWith("rpc/")) return { id: runId, status: mode === "active" ? "running" : mode === "expired_import" ? "partial" : "failed", imported_count: mode === "expired_import" ? 1 : 0 };
      return [{ id: runId }];
    },
    patchRows: async (table: string, query: string, body: Row) => { writes.push({ table, query, ...body }); return []; },
    cardsForIdeas: async () => { if (mode === "provider_failure") return new Map(); throw new Error("transient card read failure"); },
  });
  const invoke = () => runner.generateBatch(batchId, { profile_slug: "generator", request_id: batchId, target_count: 1, shadow: true });
  if (mode === "active") await assert.rejects(invoke, /already running/);
  else if (mode === "read_failure") {
    await assert.rejects(invoke, /transient card read failure/);
    assert.ok(writes.some(row => row.status === "failed" && String(row.query).includes("status=in.")), "Setup errors must reconcile and close the run");
  } else if (mode === "provider_failure") {
    await invoke();
    assert.ok(writes.some(row => (row.token_usage as Row | undefined)?.totalTokens === 30), "Rejected candidate costs must reach run metadata");
  } else {
    const result = await invoke();
    assert.equal(result.replayed, true);
    assert.equal(result.status, mode === "expired_import" ? "partial" : "failed");
    assert.equal(result.imported, mode === "expired_import" ? 1 : 0);
    assert.equal(writes.filter(row => row.table === "idea_generation_runs").length, 0, "Recovery must not create a new run");
  }
}

const queuedFailure = edgeHarness();
const queuedFailureWrites: Row[] = [];
queuedFailure.mocks({
  resolveBatch: async () => batch,
  getRows: async (table: string) => table === "idea_generation_runs"
    ? [{ id: runId, profile_slug: "generator", shadow: true, status: "queued", requested_count: 1, candidate_multiplier: 5 }]
    : [],
  patchRows: async (table: string, query: string, body: Row) => {
    queuedFailureWrites.push({ table, query, ...body });
    return [];
  },
});
await queuedFailure.processQueuedGeneration(batchId, { profile_slug: "generator", request_id: batchId, target_count: 1, shadow: true }, runId);
assert.ok(queuedFailureWrites.some(row => row.status === "failed" && String(row.query).includes("status=eq.queued")), "Pre-claim setup failures must not leave a queued run stuck forever");

// A queued job must execute the exact writer/critic contract it recorded. A
// profile edit between queueing and claiming must never produce mixed evidence.
for (const change of ["none", "writer_features", "writer_replaced", "critic_model", "critic_replaced", "pipeline", "claim_lost", "public_flags"] as const) {
  let providerCalls = 0;
  let claims = 0;
  const queued = {
    id: runId, model_profile_id: generator.id, provider: generator.provider, protocol: generator.protocol, model: generator.model,
    profile_slug: generator.profile_slug, status: "queued", shadow: true, requested_count: 1, candidate_multiplier: 5,
    prompt_version: PROMPT_VERSION, schema_version: 2, taxonomy_version: CREATIVE_TAXONOMY_VERSION,
    metadata: {
      pipeline_version: change === "pipeline" ? "outdated-pipeline" : GENERATION_PIPELINE_VERSION,
      curriculum_version: CARD_TRAINING_VERSION, scheduler_version: CREATIVE_SCHEDULER_VERSION,
      concept_ranker_version: CONCEPT_RANKER_VERSION, policy_version: AUTOMATIC_POLICY_VERSION,
      generator_snapshot: modelContract(generator), critic_profile_id: critic.id,
      critic_profile_hash: await sha256(stableJson(modelContract(critic))),
    },
  };
  const currentWriter = { ...generator, ...(change === "writer_features" ? { features: { ...generator.features, temperature: 1.5 } } : {}), ...(change === "writer_replaced" ? { id: "replacement-writer" } : {}) };
  const currentCritic = { ...critic, ...(change === "critic_model" ? { model: "replacement-model" } : {}), ...(change === "critic_replaced" ? { id: "replacement-critic" } : {}) };
  const runner = edgeHarness(() => { providerCalls++; throw new Error("Stop after proving the queue reached generation"); });
  runner.mocks({
    resolveBatch: async () => batch,
    getRows: async (table: string, query: string) => table === "idea_generation_runs" ? [queued]
      : table === "idea_model_profiles" ? [query.includes("profile_slug=eq.critic") ? currentCritic : currentWriter] : [],
    getPagedRows: async () => [],
    trainingContext: async () => ({ category: { slug: "beauty" }, persona: { slug: "luxury_editor" } }),
    cardsForIdeas: async () => new Map(),
    patchRows: async (_table: string, query: string) => {
      if (query.includes("status=eq.queued")) { claims++; return change === "claim_lost" ? [] : [{ ...queued, status: "running" }]; }
      return [{ id: runId }];
    },
    postRows: async () => [],
  });
  const input = { profile_slug: "generator", request_id: batchId, target_count: 1, shadow: true, __process_queued: true, __queue_only: true };
  const invoke = () => runner.generateBatch(batchId, input, change === "public_flags" ? {} : { processQueued: true });
  if (change === "none") {
    await invoke();
    assert.equal(providerCalls, 1, "An unchanged claimed job reaches its recorded writer");
  } else if (change === "public_flags") {
    const result = await invoke();
    assert.equal(result.status, "queued");
    assert.equal(claims, 0, "Request body cannot select internal queue execution modes");
  } else {
    await assert.rejects(invoke, change === "claim_lost" ? /already claimed/ : /queued generation contract changed/);
    assert.equal(providerCalls, 0, "Drifted or concurrently claimed jobs cannot call a provider");
    assert.equal(claims, change === "claim_lost" ? 1 : 0);
  }
}

for (const evidenceComplete of [false, true]) {
  const statusRunner = edgeHarness();
  const evidenceQueries: string[] = [];
  statusRunner.mocks({
    getRows: async (table: string, query: string) => {
      if (table === "idea_generation_runs") return [{ id: runId, generation_batch_id: batchId, status: "completed", stage: "awaiting_embedding", imported_count: 1 }];
      if (table === "idea_semantic_embeddings" || table === "idea_quality_checks") {
        evidenceQueries.push(query);
        return evidenceComplete ? [{ idea_id: batchId }] : [];
      }
      return [];
    },
    getPagedRows: async () => evidenceComplete ? [{ id: batchId }] : [],
  });
  const status = await statusRunner.generationRunStatus(batchId, runId);
  assert.equal(status.stage, evidenceComplete ? "completed" : "awaiting_embedding", "Run status must not complete until every imported candidate has both evidence rows");
  if (evidenceComplete) {
    assert.ok(evidenceQueries.some(query => query.includes("embedding=not.is.null") && query.includes("embedding_model=neq.pending")), "Pending/null embedding placeholders must not complete a run");
    assert.ok(evidenceQueries.some(query => query.includes("evaluator_version=eq.quality-gate-v3.0.1-automatic")), "Stale quality-gate rows must not complete a V3 run");
  }
}

const importer = edgeHarness();
const importErrors: Row[] = [];
importer.mocks({
  resolveBatch: async () => batch,
  lookupCategoryById: async () => ({ slug: "beauty" }), lookupById: async () => ({ slug: "luxury_editor" }),
  lookupCategoryLayerPolicy: async () => importer.defaultLayerPolicy("beauty", "instagram_reels"),
  getRows: async () => [], patchRows: async () => [],
  postRows: async (table: string, data: Row[]) => {
    assert.equal(table, "idea_import_errors", "Untrusted or invalid input must never create a candidate");
    importErrors.push(...data); return [];
  },
});
await importer.importBatch(batchId, { ideas: good.imports });
assert.ok(importErrors.some(row => String(row.error_message).includes("generation provenance cannot")));
importErrors.length = 0;
const invalid: Row = { ...good.imports[0], idea_card: { ...automaticCard, category: "travel", steps: [] } };
delete invalid.generation; delete invalid.generation_gate; delete invalid.generation_decision;
await importer.importBatch(batchId, { ideas: [invalid] });
assert.ok(importErrors.length);
const savedCandidates: Row[] = [], savedCards: Row[] = [];
importer.mocks({
  postRows: async (table: string, data: Row | Row[]) => {
    if (table === "rpc/import_generated_idea_card") {
      const input = data as Row;
      assert.equal(input.p_run_id, runId);
      savedCandidates.push(input.p_candidate as Row);
      savedCards.push({ card: input.p_card });
      return batchId;
    }
    throw new Error("Unexpected insert during verified import: " + table);
  },
});
const imported = await importer.importBatch(batchId, { ideas: fixed.imports }, runId);
assert.equal(imported.imported, 1, "Verified generated cards must actually import");
assert.equal(await cardContentHash(savedCards[0].card), verification.card_hash, "Storage normalization must preserve the verified snapshot");
assert.equal((savedCandidates[0].decision_trace as Row).import_source, "verified_generation");

let atomicAttempts = 0;
const atomicPayloads: string[] = [];
importer.mocks({ postRows: async (table: string, input: Row) => {
  assert.equal(table, "rpc/import_generated_idea_card", "A verified import must never issue split writes or orphan cleanup");
  atomicPayloads.push(JSON.stringify(input));
  if (++atomicAttempts === 1) throw new Error("response lost after commit");
  return batchId;
} });
const replayedImport = await importer.importBatch(batchId, { ideas: fixed.imports }, runId);
assert.equal(replayedImport.imported, 1);
assert.equal(atomicAttempts, 2);
assert.equal(atomicPayloads[0], atomicPayloads[1], "An ambiguous RPC retry must preserve the exact provenance and card payload");

const orphanCapacity = edgeHarness();
let repairedCapacity = false;
orphanCapacity.mocks({
  resolveBatch: async () => batch,
  getRows: async (table: string, query: string) => table === "idea_model_profiles" ? (query.includes("profile_slug=eq.critic") ? [critic] : [generator]) : [],
  getPagedRows: async () => repairedCapacity ? [] : [{ id: "incomplete-old-candidate" }],
  postRows: async (table: string) => {
    assert.equal(table, "rpc/reconcile_idea_generation_batch");
    repairedCapacity = true; return 1;
  },
  trainingContext: async () => { throw new Error("capacity recovery reached training"); },
});
await assert.rejects(() => orphanCapacity.generateBatch(batchId, { profile_slug: "generator", request_id: batchId, shadow: true }), /capacity recovery reached training/);
assert.equal(repairedCapacity, true, "Recover an orphan before rejecting a full batch");
console.log("Automatic generation: pass, rewrite recheck, no-op, rejection, runtime, replay and import regressions passed");
