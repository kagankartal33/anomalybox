import assert from "node:assert/strict";
import { automaticCard, automaticConcept, automaticRecipe } from "./fixtures/automatic-card";
import { AUTOMATIC_POLICY_VERSION, GENERATION_PIPELINE_VERSION, cardContentHash } from "../lib/generation/automatic-policy";
import { generationQualityContext, stockAuditQualityContext } from "../lib/generation/stock-audit-context";
import { evaluateIdeaCardV22 } from "../lib/idea-card/quality-v2-2";

const card = structuredClone(automaticCard);
const hash = await cardContentHash(card);
const trace = {
  import_source: "verified_generation",
  generation: { run_id: "fixture-run", pipeline_version: GENERATION_PIPELINE_VERSION, taxonomy_version: "creative-taxonomy-v1", creative_recipe: automaticRecipe, concept_plan: automaticConcept },
  generation_gate: { policy_version: AUTOMATIC_POLICY_VERSION, final_decision: "approve", hardGateCodes: [], critic_verification: { passed: true, independent: true, card_hash: hash, profile_id: "critic", profile_hash: "fixture-profile-hash" } },
};
const candidate = { id: "fixture-card", decision_trace: trace, safety_status: "SAFE", platform: "instagram_reels", language: "en", category: { slug: "beauty" }, persona: { slug: "luxury_editor" } };
const semantic = { semanticScore: .1, embeddingModel: "fixture", embeddingModelVersion: "a".repeat(40), requireOriginalityEvidence: true };
const evaluate = (payload: unknown = card, stored: unknown = candidate) => evaluateIdeaCardV22(payload, { ...semantic, ...stockAuditQualityContext(payload, stored, hash) });
assert.deepEqual(stockAuditQualityContext(card, candidate, hash).additionalHardGateCodes, []);
assert.deepEqual(stockAuditQualityContext(card, candidate, hash).additionalIssueCodes, []);
assert.equal(evaluate().decision, "approve");

// Previously the audit omitted the trace: known hook/persona/format drift was invisible.
const changedPresence = { ...card, presenceMode: "faceless" };
assert.ok(!evaluateIdeaCardV22(changedPresence, semantic).hardGateCodes.includes("recipe_card_mismatch"));
assert.ok(evaluate(changedPresence).hardGateCodes.includes("recipe_card_mismatch"));
const changedConcept = { ...automaticConcept, recipe: { ...automaticRecipe, vibePresetId: "bright_utility" } };
assert.ok(evaluate(card, { ...candidate, decision_trace: { ...trace, generation: { ...trace.generation, concept_plan: changedConcept } } }).hardGateCodes.includes("recipe_concept_mismatch"));

for (const creative_recipe of [undefined, null, { ...automaticRecipe, vibePresetId: "unknown" }]) {
  const context = generationQualityContext({ ...trace, generation: { ...trace.generation, creative_recipe } });
  assert.ok(context.additionalHardGateCodes.some(code => code === "generation_recipe_missing" || code === "generation_recipe_invalid"));
}
assert.ok(generationQualityContext({ ...trace, generation: { ...trace.generation, concept_plan: undefined } }).additionalHardGateCodes.includes("generation_concept_missing"));
assert.ok(evaluate(card, { ...candidate, category: { slug: "travel" } }).hardGateCodes.includes("stock_card_lane_mismatch"));
assert.ok(evaluate(card, { ...candidate, persona: null }).hardGateCodes.includes("stock_lane_unverified"));
assert.ok(evaluate(card, undefined).hardGateCodes.length === 0); // evaluate's default is the valid fixture.
assert.ok(stockAuditQualityContext(card, null, hash).additionalHardGateCodes?.includes("stock_candidate_missing"));
assert.ok(evaluate(card, { ...candidate, safety_status: "UNSAFE" }).hardGateCodes.includes("stock_candidate_safety_not_safe"));
assert.ok(stockAuditQualityContext(card, candidate, "stale").additionalIssueCodes?.includes("critic_verification_missing_or_stale"));

// Structural sound/emotion instructions are part of the stored recipe, not optional audit hints.
const unlicensedSound = { ...automaticConcept, soundPlan: "Use trending audio from the chart track." };
assert.ok(evaluate(card, { ...candidate, decision_trace: { ...trace, generation: { ...trace.generation, concept_plan: unlicensedSound } } }).hardGateCodes.includes("audio_license_unverified"));
const evidenceRecipe = { ...automaticRecipe, hookTypeId: "statistic_shock" };
const evidenceConcept = { ...automaticConcept, recipe: evidenceRecipe, hookId: "statistic_shock" };
const evidenceTrace = { ...trace, generation: { ...trace.generation, creative_recipe: evidenceRecipe, concept_plan: evidenceConcept } };
assert.ok(evaluate({ ...card, hookId: "statistic_shock" }, { ...candidate, decision_trace: evidenceTrace }).hardGateCodes.includes("hook_evidence_missing"));

// Legacy stock keeps its existing contract; absence of V3 metadata alone is not drift.
assert.deepEqual(generationQualityContext({ import_source: "legacy" }).additionalHardGateCodes, []);
assert.deepEqual(stockAuditQualityContext({ title: "Legacy card" }, { ...candidate, decision_trace: {} }, hash).additionalHardGateCodes, []);
console.log("Stock audit provenance, creative recipe, evidence and lane regressions passed.");
