import assert from "node:assert/strict";
import { ALL_HOOKS } from "../lib/algorithmic-reason/taxonomy";
import { PURCHASE_LANES } from "../lib/algorithmic-reason/compatibility";
import {
  CREATIVE_SCHEDULER_VERSION,
  CREATIVE_SIGNATURE_VERSION,
  CREATIVE_TAXONOMY_VERSION,
  HOOK_TYPE_IDS,
  analyzeCreativeDistribution,
  creativeRecipeId,
  creativeRecipeSchema,
  legacyCreativeRecipeId,
  hookAutomationStatus,
  recipeMatchesConcept,
  recipeDistance,
  scheduleCreativeRecipes,
  validateRecipeSet,
  validateRecipeCompatibility,
  type CreativeRecipe,
} from "../lib/generation/creative-taxonomy";
import { evaluateIdeaCardV22 } from "../lib/idea-card/quality-v2-2";

assert.equal(CREATIVE_TAXONOMY_VERSION, "creative-taxonomy-v1");
assert.equal(CREATIVE_SCHEDULER_VERSION, "creative-scheduler-v2.1");
assert.equal(CREATIVE_SIGNATURE_VERSION, "creative-signature-v2");
assert.equal(ALL_HOOKS.length, 66);
assert.equal(new Set(HOOK_TYPE_IDS).size, HOOK_TYPE_IDS.length, "hook IDs must be unique");
assert.equal(new Set(ALL_HOOKS.map((hook) => hook.code)).size, ALL_HOOKS.length, "hook numeric codes must be unique");

for (const lane of PURCHASE_LANES) {
  const first = scheduleCreativeRecipes({ lane, seed: `${lane}:slot-7` });
  const replay = scheduleCreativeRecipes({ lane, seed: `${lane}:slot-7` });
  assert.deepEqual(replay, first, `${lane} schedule must replay deterministically`);
  assert.deepEqual(validateRecipeSet(first), [], `${lane} must produce five valid distant recipes`);
  assert.equal(new Set(first.map(creativeRecipeId)).size, 5);
  for (const recipe of first) assert.deepEqual(validateRecipeCompatibility(recipe, lane), []);
  for (let left = 0; left < first.length; left += 1) {
    for (let right = left + 1; right < first.length; right += 1) {
      assert.ok(recipeDistance(first[left], first[right]) >= 4, `${lane} pair distance must be at least four axes`);
    }

const collisionA: CreativeRecipe = {
  taxonomyVersion: CREATIVE_TAXONOMY_VERSION,
  hookTypeId: "micro_silence_drop",
  hookDeliveryId: "visual_action",
  proofDeviceId: "process_result",
  audienceActionId: "none",
  shootFormat: "object_led",
  presenceMode: "high_status_minimalist",
  genreId: "mini_vlog",
  promiseTypeId: "complete_test",
  emotionArcId: "empathy_to_hope",
  vibePresetId: "calm_expert",
  payoffTypeId: "visible_result",
};
const collisionB: CreativeRecipe = {
  ...collisionA,
  genreId: "demonstration_tutorial",
  promiseTypeId: "reverse_expectation",
  emotionArcId: "surprise_to_understanding",
  vibePresetId: "clean_editorial",
  payoffTypeId: "mistake_correction",
};
assert.equal(legacyCreativeRecipeId(collisionA), "creative-taxonomy-v1:5609873e");
assert.equal(legacyCreativeRecipeId(collisionA), legacyCreativeRecipeId(collisionB), "Fixture reproduces the old 32-bit collision");
assert.notEqual(creativeRecipeId(collisionA), creativeRecipeId(collisionB), "Different recipes must never share a persistent identity");
assert.equal(creativeRecipeId({ ...collisionA, ...{ hookTypeId: collisionA.hookTypeId } }), creativeRecipeId(collisionA));
assert.equal(recipeMatchesConcept(collisionA, { hookId: collisionB.hookTypeId, shootFormat: collisionB.shootFormat, recipe: collisionB }), false, "A hash collision cannot authorize recipe drift");

const facelessTalkingHead: CreativeRecipe = { ...collisionA, shootFormat: "talking_head", presenceMode: "faceless_curator" };
const spokenSilentHook: CreativeRecipe = { ...collisionA, hookTypeId: "text_first_silent_hook", hookDeliveryId: "spoken", shootFormat: "text_led", presenceMode: "faceless_curator" };
for (const [recipe, code] of [
  [facelessTalkingHead, "recipe_presence_format_incompatible"],
  [spokenSilentHook, "recipe_hook_delivery_incompatible"],
] as const) {
  assert.ok(validateRecipeCompatibility(recipe, "beauty").includes(code));
  assert.equal(creativeRecipeSchema.safeParse(recipe).success, false, "Contracts must reject contradictory valid-enum recipes");
  assert.ok(evaluateIdeaCardV22({ category: "beauty" }, { creativeRecipe: recipe }).hardGateCodes.includes(code), "Quality gate must fail closed on incompatible recipes");
}
for (const seed of ["beauty:review:5", "beauty:review:7"]) {
  const recipes = scheduleCreativeRecipes({ lane: "beauty", seed });
  assert.deepEqual(validateRecipeSet(recipes), []);
  for (const recipe of recipes) assert.deepEqual(validateRecipeCompatibility(recipe, "beauty"), []);
}
const wrongLaneProof: CreativeRecipe = { ...collisionA, proofDeviceId: "route_map" };
assert.equal(creativeRecipeSchema.safeParse(wrongLaneProof).success, true, "Structural recipe parsing has no lane context");
assert.ok(validateRecipeCompatibility(wrongLaneProof, "beauty").includes("recipe_proof_lane_incompatible"));
assert.ok(evaluateIdeaCardV22({ category: "beauty" }, { creativeRecipe: wrongLaneProof }).hardGateCodes.includes("recipe_proof_lane_incompatible"));
  }
}

assert.equal(hookAutomationStatus("polarizing_dichotomy"), "blocked");
assert.equal(hookAutomationStatus("statistic_shock"), "evidence_required");
assert.equal(hookAutomationStatus("statistic_shock", { factualEvidence: true }), "allowed");
assert.equal(hookAutomationStatus("audio_trend_hijack"), "evidence_required");
assert.equal(hookAutomationStatus("audio_trend_hijack", { audioLicense: true }), "allowed");
assert.equal(hookAutomationStatus("not_a_hook"), "unknown");

const beautyWindow = Array.from({ length: 20 }, (_, slot) => scheduleCreativeRecipes({ lane: "beauty", seed: `beauty:${slot}` })[0]);
const distribution = analyzeCreativeDistribution(beautyWindow);
assert.equal(distribution.total, 20);
assert.equal(distribution.uniqueSignatures, 20);
assert.ok(!distribution.issueCodes.includes("creative_signature_duplicate"));

for (const lane of PURCHASE_LANES) {
  const window = [];
  for (let slot = 0; slot < 100; slot += 1) {
    const next = scheduleCreativeRecipes({ lane, seed: `${lane}:stress:${slot}`, recentRecipes: window });
    for (const recipe of next) assert.deepEqual(validateRecipeCompatibility(recipe, lane), []);
    window.push(...next);
  }
  const stress = analyzeCreativeDistribution(window);
  assert.equal(stress.total, 500);
  assert.equal(stress.uniqueSignatures, 500, `${lane} scheduler must not repeat an exact recipe in a 500-card window`);
  assert.ok(stress.pairUniqueCounts.genreVibe >= 60, `${lane} must cover compatible genre/vibe pairs`);
  assert.ok(stress.pairUniqueCounts.emotionPayoff >= 100, `${lane} must cover emotion/payoff pairs`);
  assert.ok(stress.pairUniqueCounts.formatProof >= 20, `${lane} must cover format/proof pairs`);
  assert.deepEqual(stress.issueCodes, [], `${lane} scheduler distribution must stay inside concentration gates`);
}

console.log("creative taxonomy v1 fixtures passed");