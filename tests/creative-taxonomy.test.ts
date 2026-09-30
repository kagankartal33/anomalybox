import assert from "node:assert/strict";
import { ALL_HOOKS } from "../lib/algorithmic-reason/taxonomy";
import { PURCHASE_LANES } from "../lib/algorithmic-reason/compatibility";
import {
  CREATIVE_TAXONOMY_VERSION,
  HOOK_TYPE_IDS,
  analyzeCreativeDistribution,
  creativeRecipeId,
  hookAutomationStatus,
  recipeDistance,
  scheduleCreativeRecipes,
  validateRecipeSet,
} from "../lib/generation/creative-taxonomy";

assert.equal(CREATIVE_TAXONOMY_VERSION, "creative-taxonomy-v1");
assert.equal(ALL_HOOKS.length, 66);
assert.equal(new Set(HOOK_TYPE_IDS).size, HOOK_TYPE_IDS.length, "hook IDs must be unique");
assert.equal(new Set(ALL_HOOKS.map((hook) => hook.code)).size, ALL_HOOKS.length, "hook numeric codes must be unique");

for (const lane of PURCHASE_LANES) {
  const first = scheduleCreativeRecipes({ lane, seed: `${lane}:slot-7` });
  const replay = scheduleCreativeRecipes({ lane, seed: `${lane}:slot-7` });
  assert.deepEqual(replay, first, `${lane} schedule must replay deterministically`);
  assert.deepEqual(validateRecipeSet(first), [], `${lane} must produce five valid distant recipes`);
  assert.equal(new Set(first.map(creativeRecipeId)).size, 5);
  for (let left = 0; left < first.length; left += 1) {
    for (let right = left + 1; right < first.length; right += 1) {
      assert.ok(recipeDistance(first[left], first[right]) >= 4, `${lane} pair distance must be at least four axes`);
    }
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

console.log("creative taxonomy v1 fixtures passed");