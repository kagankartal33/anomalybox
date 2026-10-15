import assert from "node:assert/strict";
import fs from "node:fs";
import { automaticCard, automaticConcept, automaticRecipe } from "./fixtures/automatic-card";
import { edgeHarness } from "./helpers/card-edge-harness";
import { AUTOMATIC_POLICY_VERSION, CRITIC_CHECKS, GENERATION_PIPELINE_VERSION, SEMANTIC_DOCUMENT_VERSION, automaticGenerationBlockers, cardContentHash, cardSnapshot, criticPassed, modelContract, publicationBlockers, semanticDocument, sha256, stableJson } from "../lib/generation/automatic-policy";
import { AUTOMATIC_REGRESSION_VERSION, QUALIFICATION_CATEGORIES, automaticQualificationPass } from "../lib/generation/qualification";
import { PROMPT_VERSION, criticResultSchema } from "../lib/generation/contracts";
import { QUALITY_GATE_VERSION } from "../lib/idea-card/quality-v2-2";
import { CREATIVE_SCHEDULER_VERSION } from "../lib/generation/creative-taxonomy";
import { CONCEPT_RANKER_VERSION } from "../lib/generation/concept-ranking";
import { DURATION_PLANNER_VERSION } from "../lib/idea-card/duration-planner";

const card = structuredClone(automaticCard);
const hash = await cardContentHash(card);
assert.equal(hash, await cardContentHash({ ...card, id: "db-id", one_sentence_premise: card.conceptSummary }));
assert.notEqual(hash, await cardContentHash({ ...card, steps: card.steps.map((step, i) => i === 3 ? { ...step, spokenLine: "A different conclusion." } : step) }));
const critic = { id: "critic", profile_slug: "critic", enabled: true, provider: "test", model: "critic", protocol: "json_text", features: {}, api_key_env_var: "VIRALBOX_MODEL_PROVIDER_TEST" };
const generator = { ...critic, id: "generator", profile_slug: "generator", model: "generator", features: { critic_profile_slug: "critic" }, qualification_status: "approved", qualification_eval_id: "eval", qualification_metrics: { qualification_mode: "automatic-v3", pipeline_version: GENERATION_PIPELINE_VERSION, scheduler_version: CREATIVE_SCHEDULER_VERSION, concept_ranker_version: CONCEPT_RANKER_VERSION, duration_planner_version: DURATION_PLANNER_VERSION, critic_profile_id: critic.id, critic_snapshot: modelContract(critic) }, qualified_prompt_version: PROMPT_VERSION, qualified_schema_version: 2, qualified_quality_gate_version: QUALITY_GATE_VERSION };
const criticHash = await sha256(stableJson(modelContract(critic)));
const trace = { import_source: "verified_generation", generation: { run_id: "run", pipeline_version: GENERATION_PIPELINE_VERSION, scheduler_version: CREATIVE_SCHEDULER_VERSION, concept_ranker_version: CONCEPT_RANKER_VERSION, taxonomy_version: "creative-taxonomy-v1", creative_recipe: automaticRecipe, creative_signature: "fixture", concept_plan: automaticConcept }, generation_gate: { policy_version: AUTOMATIC_POLICY_VERSION, final_decision: "approve", hardGateCodes: [], critic_result: { decision: "pass", issueCodes: [], editInstructions: [], checks: Object.fromEntries(CRITIC_CHECKS.map(key => [key, "pass"])) }, critic_verification: { passed: true, independent: true, card_hash: hash, profile_id: critic.id, profile_hash: criticHash, profile_snapshot: modelContract(critic) } } };
const embedding = { embedding_model: "test-embedding", source_text_hash: await sha256(semanticDocument(card)), metadata: { nearest_similarity: .1, model_version: "a".repeat(40), document_version: SEMANTIC_DOCUMENT_VERSION, corpus_complete: true, comparison_scope: "global", corpus_revision: "7", corpus_count: 1 } };
const quality = { idea_id: "card", decision: "approve", second_opinion_required: false, craft_score: 99, editorial_quality_score: 99, embedding_duplicate_score: .1, embedding_model: embedding.embedding_model, embedding_model_version: embedding.metadata.model_version, evaluator_version: QUALITY_GATE_VERSION, metadata: { card_hash: hash, card_snapshot: cardSnapshot(card) } };
const parameters = { card, trace, quality, embedding, contentHash: hash, semanticHash: embedding.source_text_hash, gateVersion: QUALITY_GATE_VERSION };
assert.deepEqual(publicationBlockers(parameters), []);
for (const changed of [
  { quality: { ...quality, craft_score: NaN } },
  { quality: { ...quality, embedding_duplicate_score: null } },
  { quality: { ...quality, embedding_duplicate_score: .8, human_review_decision: "approve" } },
  { quality: { ...quality, metadata: { card_hash: "stale" } } },
  { trace: { ...trace, import_source: "admin_batch_import" } },
  { trace: { ...trace, generation_gate: { ...trace.generation_gate, final_decision: "reject" } } },
  { embedding: { ...embedding, metadata: { ...embedding.metadata, corpus_complete: false } } },
  { embedding: { ...embedding, source_text_hash: "stale" } },
]) assert.ok(publicationBlockers({ ...parameters, ...changed }).length);
assert.ok(automaticGenerationBlockers({}, hash).length);
const pass = { decision: "pass", issueCodes: [], editInstructions: [], checks: Object.fromEntries(CRITIC_CHECKS.map(key => [key, "pass"])) };
assert.equal(criticPassed(pass), true);
assert.equal(criticResultSchema.safeParse({ ...pass, checks: { ...pass.checks, safety: "uncertain" } }).success, false);
assert.equal(criticResultSchema.safeParse({ ...pass, issueCodes: ["unresolved"] }).success, false);

const metrics = {
  qualification_mode: "automatic-v3", regression_version: AUTOMATIC_REGRESSION_VERSION, regression_passed: true,
  pipeline_version: GENERATION_PIPELINE_VERSION, scheduler_version: CREATIVE_SCHEDULER_VERSION, concept_ranker_version: CONCEPT_RANKER_VERSION, duration_planner_version: DURATION_PLANNER_VERSION,
  regression_case_count: 72, evaluated_count: 600, category_counts: Object.fromEntries(QUALIFICATION_CATEGORIES.map(slug => [slug, 50])),
  schema_pass_rate: 1, taxonomy_pass_rate: 1, recipe_adherence_rate: 1, safe_approve_rate: .6, approved_average: 95, duplicate_rate_078: .02, banned_residue_rate: 0, creator_residue_rate: 0,
  duration_fit_rate: .98, exact_duration_max_share: .15, timing_template_duplicate_rate: 0, approved_critic_pass_rate: 1,
  approved_hook_first_frame_rate: 1, approved_proof_payoff_rate: 1, creative_distribution_passed: true,
  embedded_count: 600, critic_record_count: 600, current_gate_count: 600, fresh_snapshot_count: 600,
  category_metrics: Object.fromEntries(QUALIFICATION_CATEGORIES.map(category => [category, {
    evaluated_count: 50, schema_pass_rate: 1, taxonomy_pass_rate: 1, recipe_adherence_rate: 1,
    safe_approve_rate: .6, approved_average: 95, duplicate_rate_078: .02, banned_residue_rate: 0, creator_residue_rate: 0,
    duration_fit_rate: .98, exact_duration_max_share: .15, timing_template_duplicate_rate: 0, approved_critic_pass_rate: 1,
    approved_hook_first_frame_rate: 1, approved_proof_payoff_rate: 1, creative_distribution_passed: true,
    embedded_count: 50, critic_record_count: 50, current_gate_count: 50, fresh_snapshot_count: 50,
  }])),
};
// Static drift checks only; executing the SQL is a separate Docker/Supabase gate.
const migration = fs.readFileSync("supabase/migrations/20260831120000_card_quality_consistency.sql", "utf8")
  + fs.readFileSync("supabase/migrations/20260831150000_card_training_curriculum.sql", "utf8")
  + fs.readFileSync("supabase/migrations/20260901090000_professional_card_generation_v3.sql", "utf8")
  + fs.readFileSync("supabase/migrations/20260904110000_qualification_integrity.sql", "utf8")
  + fs.readFileSync("supabase/migrations/20260910120000_quality_gate_v3_0_1_integrity.sql", "utf8")
  + fs.readFileSync("supabase/migrations/20260910123000_qualification_run_isolation.sql", "utf8");
const fallbackGenerator = fs.readFileSync("tools/fill-lane-persona-stock.ts", "utf8");
assert.ok(migration.includes(`q.evaluator_version = '${QUALITY_GATE_VERSION}'`));
assert.ok(migration.includes(`e.prompt_version = '${PROMPT_VERSION}'`));
assert.ok(migration.includes(`m->>'regression_version' = '${AUTOMATIC_REGRESSION_VERSION}'`));
assert.ok(migration.includes(`m->>'pipeline_version' = '${GENERATION_PIPELINE_VERSION}'`));
assert.ok(migration.includes(`m->>'scheduler_version' = '${CREATIVE_SCHEDULER_VERSION}'`));
assert.ok(migration.includes(`m->>'concept_ranker_version' = '${CONCEPT_RANKER_VERSION}'`));
assert.ok(migration.includes(`m->>'duration_planner_version' = '${DURATION_PLANNER_VERSION}'`));
assert.ok(migration.includes("automatic_card_content_hash"), "Database publication guard must recompute the content hash");
assert.ok(migration.includes("automatic_card_semantic_hash"), "Database publication guard must recompute the embedding source hash");
assert.ok(migration.includes("automatic_qualification_run_set_isolated"), "Automatic qualification must reject a mixed or still-running run set");
assert.ok(migration.includes("and public.inventory_idea_quality_allows_sale(inv.idea_id)"));
assert.ok(migration.includes("alter column viral_potential_score drop not null"));
assert.ok(fallbackGenerator.includes("Direct stock publication is disabled"));
assert.ok(fallbackGenerator.includes("publicationEnabled: false"));
assert.ok(!fallbackGenerator.includes("viral_potential_score"));
assert.ok(!fallbackGenerator.includes("SUPABASE_SERVICE_ROLE_KEY"));
assert.equal(automaticQualificationPass(metrics), true);
for (const key of ["approved_average", "schema_pass_rate", "safe_approve_rate", "duplicate_rate_078", "duration_fit_rate"]) {
  assert.equal(automaticQualificationPass({ ...metrics, [key]: NaN }), false);
}
for (const change of [{ regression_passed: false }, { qualified: true, qualification_mode: "human" }, { evaluated_count: 601 }, { regression_case_count: 73 }, { critic_record_count: 249 }, { fresh_snapshot_count: 249 }, { approved_critic_pass_rate: .99 }, { category_counts: { ...metrics.category_counts, travel: 49 } }, { category_counts: { ...metrics.category_counts, beauty: 51 } }, { category_counts: { ...metrics.category_counts, unqualified_lane: 50 } }]) assert.equal(automaticQualificationPass({ ...metrics, ...change }), false);
for (const key of ["pipeline_version", "scheduler_version", "concept_ranker_version", "duration_planner_version"]) assert.equal(automaticQualificationPass({ ...metrics, [key]: "stale" }), false);
assert.equal(automaticQualificationPass({ ...metrics, category_metrics: undefined }), false, "Aggregate-only qualifications cannot approve");
for (const [key, value] of Object.entries({ evaluated_count: 49, schema_pass_rate: .98, taxonomy_pass_rate: .98, recipe_adherence_rate: .97, safe_approve_rate: 0, approved_average: 89, duplicate_rate_078: .04, banned_residue_rate: .02, creator_residue_rate: .02, duration_fit_rate: .94, exact_duration_max_share: .21, timing_template_duplicate_rate: .01, approved_critic_pass_rate: .99, approved_hook_first_frame_rate: .99, approved_proof_payoff_rate: .99, creative_distribution_passed: false, embedded_count: 49, critic_record_count: 49, current_gate_count: 49, fresh_snapshot_count: 49 })) {
  const category_metrics = { ...metrics.category_metrics, travel: { ...metrics.category_metrics.travel, [key]: value } };
  assert.equal(automaticQualificationPass({ ...metrics, safe_approve_rate: 550 / 600, category_metrics }), false, `Passing aggregate cannot hide travel ${key} failure`);
}
assert.equal(automaticQualificationPass({ ...metrics, category_metrics: { ...metrics.category_metrics, extra_lane: metrics.category_metrics.travel } }), false);
assert.equal(automaticQualificationPass({ ...metrics, category_metrics: { ...metrics.category_metrics, travel: null } }), false);

const edge = edgeHarness();
const candidate = { id: "card", title: card.title, one_sentence_premise: card.conceptSummary, safety_notes: [], hook_options: [], decision_trace: trace, status: "ready", safety_status: "SAFE", language: "en", platform: "instagram_reels" };
assert.equal(edge.scoreCandidate(candidate).viral_potential_score, null, "V3 cannot synthesize viral probability without outcome data");
const duplicate = edge.bestDuplicate(candidate, card, [{ candidate: { ...candidate, id: "other", title: "An unrelated renamed heading" }, card: { ...card, title: "A renamed card" } }]);
assert.ok(duplicate.strictScore >= .92, "Retitling identical scenes must not bypass fingerprints");
const policy = edge.defaultLayerPolicy("beauty", "instagram_reels");
const evaluate = (payload: unknown = card, decisionTrace: unknown = trace) => edge.evaluateQualityCheck({ ...candidate, decision_trace: decisionTrace }, payload, { slug: "beauty", risk_level: "low" }, policy, "luxury_editor", "instagram_reels", { score: 0, strictScore: 0, ideaId: null }, null, null, { score: .1, model: embedding.embedding_model, version: embedding.metadata.model_version, ideaId: null }, { contentHash: hash, blockers: [] }).qualityRow;
assert.equal(evaluate().decision, "approve", "Known good card must pass the actual admin scorer");
assert.ok(evaluate({ ...card, steps: [] }).reasons.includes("schema_invalid"), "Malformed v2 must not be normalized as legacy");
assert.equal(evaluate(card, { ...trace, generation_gate: { ...trace.generation_gate, final_decision: "reject" } }).decision, "reject");
assert.equal(evaluate(card, { ...trace, generation_gate: { ...trace.generation_gate, hardGateCodes: ["timing_template_duplicate"] } }).decision, "reject");
assert.notEqual(evaluate({ ...card, steps: card.steps.map(step => ({ ...step, spokenLine: null })) }).decision, "approve");
assert.notEqual(evaluate({ ...card, overallProductionNotes: [...(card.overallProductionNotes ?? []), "This is not medical advice."], steps: card.steps.map((step, i) => i === 3 ? { ...step, spokenLine: "This skincare sample heals eczema." } : step) }).decision, "approve");
assert.equal(evaluate({ ...card, overallProductionNotes: [...(card.overallProductionNotes ?? []), "Never claim this skincare sample is a cure."] }).decision, "approve", "Negative safety instructions are not claims");
assert.equal(evaluate({ ...card, overallProductionNotes: [...(card.overallProductionNotes ?? []), "Record the customer's private medical details in the background without permission."] }).decision, "reject");
assert.equal(evaluate({ ...card, overallProductionNotes: [...(card.overallProductionNotes ?? []), "Never record the customer's private medical details without permission."] }).decision, "approve");
assert.equal(evaluate({ ...card, overallProductionNotes: [...(card.overallProductionNotes ?? []), "Record the customer's reaction with their written consent."] }).decision, "approve");
assert.notEqual(evaluate({ ...card, overallProductionNotes: [...(card.overallProductionNotes ?? []), "Show the customer's private medical details."] }).decision, "approve");
assert.equal(evaluate({ ...card, steps: card.steps.map((step, i) => ({ ...step, action: ["Hold one skincare sample beside a mirror.", "Place two bottles on the counter.", "Turn one bottle so its label faces the phone.", "Point toward the two bottles beside the mirror."][i] })) }).decision, "reject");
for (const disclosure of ["#ad", "Paid partnership", "Sponsored by Example"]) {
  const sponsored = { ...card, conceptSummary: `${card.conceptSummary} Sponsored comparison.`, steps: card.steps.map((step, i) => i === 0 ? { ...step, onScreenText: disclosure } : step) };
  assert.equal(evaluate(sponsored).decision, "approve", `Admin and shared gate must agree on ${disclosure}`);
  assert.notEqual(evaluate({ ...sponsored, steps: sponsored.steps.map((step, i) => ({ ...step, onScreenText: i === 3 ? disclosure : null })) }).decision, "approve", "Late disclosure cannot qualify as early disclosure");
}

async function publishScenario(overrides: { runs?: unknown[]; embedding?: unknown; profiles?: unknown[]; trace?: unknown; quality?: unknown; ratings?: unknown[]; conflictReplay?: boolean } = {}) {
  const writes: unknown[] = [];
  edge.mocks({
    resolveBatch: async () => ({ id: "batch", category_id: "beauty", persona_id: "luxury_editor", stats: {} }),
    getPagedRows: async (table: string) => {
      if (table === "idea_generation_runs") return overrides.runs ?? [{ id: "run", model_profile_id: generator.id, shadow: false, status: "completed", prompt_version: PROMPT_VERSION, schema_version: 2, metadata: { generator_snapshot: modelContract(generator), critic_profile_id: critic.id, critic_profile_hash: criticHash, pipeline_version: GENERATION_PIPELINE_VERSION, scheduler_version: CREATIVE_SCHEDULER_VERSION } }, { id: "unrelated-failed", status: "failed", shadow: true }];
      if (table === "idea_model_profiles") return overrides.profiles ?? [generator, critic];
      if (table === "idea_candidates") return [{ ...candidate, decision_trace: overrides.trace ?? trace }];
      if (table === "idea_quality_checks") return [overrides.quality ?? quality];
      if (table === "idea_inventory") return writes;
      return [];
    },
    getRows: async (table: string) => {
      if (table === "idea_embedding_corpus_state") return [{ card_count: 1, revision: "7" }];
      if (table === "idea_cards") return [{ idea_id: "card", card, title: card.title }];
      if (table === "idea_semantic_embeddings") return [{ idea_id: "card", ...overrides.embedding as object ?? embedding }];
      if (table === "idea_card_gold_ratings") return overrides.ratings ?? [];
      return [];
    },
    scoresForIdeas: async () => new Map([["card", { internal_rank_score: 99 }]]),
    publishedFingerprintPool: async () => new Map(),
    patchRows: async () => [],
    postRows: async (table: string, rows: unknown[]) => { if (table.startsWith("idea_inventory")) { if (overrides.conflictReplay) return []; writes.push(...rows); } return rows; },
  });
  const result = await edge.publishInventory("batch", {});
  assert.equal(result.published_inventory, writes.length, "Report actual inserts, not optimistic attempts");
  return writes.length;
}
assert.equal(await publishScenario(), 1, "Successful run publishes despite unrelated failed run");
assert.equal(await publishScenario({ conflictReplay: true }), 0, "Concurrent duplicate replay must not overcount inventory");
assert.equal(await publishScenario({ runs: [] }), 0, "Import without generation cannot publish");
assert.equal(await publishScenario({ embedding: { ...embedding, metadata: { ...embedding.metadata, corpus_revision: "6" } } }), 0);
assert.equal(await publishScenario({ profiles: [generator, { ...critic, model: "changed" }] }), 0);
assert.equal(await publishScenario({ profiles: [generator, { ...critic, profile_slug: "archived-critic" }] }), 0, "An old critic ID and matching snapshot cannot bypass the writer's current critic alias");
const reboundCritic = { ...critic, id: "replacement-critic" };
assert.equal(await publishScenario({
  profiles: [generator, reboundCritic],
  runs: [{ id: "run", model_profile_id: generator.id, shadow: false, status: "completed", prompt_version: PROMPT_VERSION, schema_version: 2, metadata: { generator_snapshot: modelContract(generator), critic_profile_id: reboundCritic.id, critic_profile_hash: criticHash, pipeline_version: GENERATION_PIPELINE_VERSION, scheduler_version: CREATIVE_SCHEDULER_VERSION } }],
  trace: { ...trace, generation_gate: { ...trace.generation_gate, critic_verification: { ...trace.generation_gate.critic_verification, profile_id: reboundCritic.id } } },
}), 0, "Rebinding a critic slug to another identity cannot reuse writer qualification, even with an identical model contract");
assert.equal(await publishScenario({ profiles: [{ ...generator, model: "changed" }, critic] }), 0);
assert.equal(await publishScenario({ ratings: [{ idea_id: "card", human_decision: "reject" }] }), 1, "V3 publication is automatic and ignores legacy human rating vetoes");
assert.equal(await publishScenario({ quality: { ...quality, human_review_decision: "approve", decision: "refine" } }), 0);
console.log("Automatic policy, actual scorer, fingerprint, qualification and publisher regressions passed");
