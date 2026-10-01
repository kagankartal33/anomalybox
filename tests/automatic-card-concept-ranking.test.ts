import assert from "node:assert/strict";
import { rankConceptPlans, CONCEPT_RANKER_VERSION, type RankableConcept } from "../lib/generation/concept-ranking";
import type { DurationPlan } from "../lib/idea-card/duration-planner";

const base: RankableConcept = {
  conceptId: "base",
  runtimeProfile: "single_proof",
  title: "Compare two jacket cuffs",
  premise: "Hold both jacket cuffs under the same light and compare the stitching.",
  firstFramePlan: "Place both cuffs side by side in a locked close-up.",
  proofPlan: "Trace the stitch spacing on both cuffs before showing the cleaner finish.",
  viewerTakeaway: "Use consistent stitch spacing as one visible construction check.",
  proofBeatCount: 2,
  spokenWordTarget: 38,
  shotCount: 5,
  locationCount: 1,
  cameraSetupCount: 1,
  resetCount: 0,
  shootFormat: "hands_only",
};

const weak: RankableConcept = {
  ...base,
  conceptId: "weak",
  title: "A completely different object",
  premise: "Discuss a choice in abstract terms without showing the exact decision.",
  firstFramePlan: "Stand somewhere and begin talking about it.",
  proofPlan: "Mention that a result exists later.",
  viewerTakeaway: "Remember the general lesson.",
  spokenWordTarget: 64,
  shotCount: 8,
  locationCount: 3,
  cameraSetupCount: 5,
  resetCount: 4,
};

const plan: DurationPlan = { runtimeProfile: "single_proof", targetSeconds: 24, plannerVersion: "duration-planner-v2" };
const input = {
  concepts: [weak, base],
  comparisonTexts: ["A familiar jacket comparison with two sleeves"],
  durationPlanFor: (concept: RankableConcept) => {
    if (concept.conceptId === "weak") throw new Error("concept_exceeds_runtime_profile");
    return plan;
  },
};

const ranked = rankConceptPlans(input);
assert.equal(CONCEPT_RANKER_VERSION, "concept-ranker-v2");
assert.equal(ranked[0].concept.conceptId, "base", "Executable proof should beat superficial lexical difference");
assert.equal(ranked[0].eligible, true);
assert.equal(ranked.find((row) => row.concept.conceptId === "weak")?.eligible, false);
assert.deepEqual(rankConceptPlans(input), ranked, "Concept ranking must replay deterministically");

const duplicate = rankConceptPlans({
  concepts: [base],
  comparisonTexts: [`${base.title} ${base.premise} ${base.firstFramePlan} ${base.proofPlan} ${base.viewerTakeaway}`],
  durationPlanFor: () => plan,
});
assert.equal(duplicate[0].eligible, false, "Lexical duplicates must remain ineligible regardless of craft score");

console.log("automatic concept ranking fixtures passed");