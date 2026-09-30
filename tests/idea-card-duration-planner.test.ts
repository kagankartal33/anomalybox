import assert from "node:assert/strict";
import {
  RUNTIME_PROFILE_RANGES,
  analyzeDurationDistribution,
  buildProductionEstimate,
  planCardDuration,
  plannedRuntimeProfile,
  timingFingerprint,
  type DurationPlanningConcept,
} from "../lib/idea-card/duration-planner";
import { ideaCardSchema } from "../lib/idea-card/schema";

const lanes = ["beauty", "entertainment_comedy", "travel", "fitness_wellness_safe", "food"];

for (const lane of lanes) {
  const durations: number[] = [];
  for (let index = 0; index < 25; index += 1) {
    const runtimeProfile = plannedRuntimeProfile(lane, index, 25);
    const concept: DurationPlanningConcept = {
      conceptId: `${lane}-${index}`,
      runtimeProfile,
      proofBeatCount: 1 + (index % 4),
      spokenWordTarget: 16 + (index % 7) * 7,
      shotCount: 3 + (index % 6),
      locationCount: 1 + (index % 3),
      cameraSetupCount: 1 + (index % 4),
      resetCount: index % 3,
      shootFormat: index % 2 ? "talking_head" : "hands_only",
    };
    const plan = planCardDuration(lane, index, 25, concept);
    const repeated = planCardDuration(lane, index, 25, concept);
    assert.deepEqual(plan, repeated, "duration allocation must be replay-safe");
    assert.equal(plan.runtimeProfile, runtimeProfile);
    assert.ok(plan.targetSeconds >= RUNTIME_PROFILE_RANGES[runtimeProfile].min);
    assert.ok(plan.targetSeconds <= RUNTIME_PROFILE_RANGES[runtimeProfile].max);
    durations.push(plan.targetSeconds);
  }
  const distribution = analyzeDurationDistribution(durations);
  assert.ok(distribution.distinctProfiles >= 3, `${lane} must use at least three runtime profiles`);
  assert.ok(distribution.maxExactSecondShare <= 0.2, `${lane} must not collapse onto one exact second`);
  assert.deepEqual(distribution.issueCodes, []);
}

const baseCard = {
  id: "duration-card",
  title: "Window Light Texture Reveal",
  conceptSummary: "Compare two finishes in window light and reveal the visible difference.",
  format: "Reels",
  category: "beauty",
  platform: "instagram_reels",
  audience: "Beauty buyers",
  durationSeconds: 24,
  difficulty: "easy" as const,
  requiredItems: ["Mirror", "Sample"],
  viewerTakeaway: "Choose the finish after seeing a direct texture comparison.",
  hookId: "texture_proof",
  shootFormat: "hands_only",
  personaSlug: "beauty_editor",
  steps: [
    { id: "s1", order: 1, stage: "hook" as const, startSecond: 0, endSecond: 4, purpose: "Open with both finishes", goal: "Create a visible question", action: "Hold both samples beside the mirror" },
    { id: "s2", order: 2, stage: "context" as const, startSecond: 4, endSecond: 9, purpose: "Set equal sample sizes", goal: "Keep the comparison fair", action: "Place one drop on each hand" },
    { id: "s3", order: 3, stage: "demonstration" as const, startSecond: 9, endSecond: 18, purpose: "Show the texture proof", goal: "Reveal absorption differences", action: "Press each sample and tilt toward the window" },
    { id: "s4", order: 4, stage: "takeaway" as const, startSecond: 18, endSecond: 24, purpose: "Resolve the comparison", goal: "Name the smoother finish", action: "Point to the smoother side" },
  ],
  overallProductionNotes: ["Lock exposure"],
  schemaVersion: 2 as const,
};

const simpleEstimate = buildProductionEstimate(baseCard, { locationCount: 1, cameraSetupCount: 1, resetCount: 0 });
const complexEstimate = buildProductionEstimate(
  { ...baseCard, difficulty: "advanced", requiredItems: [...baseCard.requiredItems, "Tripod", "Light", "Reflector"] },
  { locationCount: 3, cameraSetupCount: 4, resetCount: 3 },
);
assert.ok(simpleEstimate.captureMinutesHigh > simpleEstimate.captureMinutesLow);
assert.ok(complexEstimate.captureMinutesLow > simpleEstimate.captureMinutesLow);
assert.equal(simpleEstimate.confidence, "low");

const validWithEstimate = ideaCardSchema.parse({ ...baseCard, productionEstimate: simpleEstimate });
assert.equal(validWithEstimate.productionEstimate?.captureMinutesLow, simpleEstimate.captureMinutesLow);
assert.equal(ideaCardSchema.safeParse(baseCard).success, true, "legacy schema-v2 cards remain valid without an estimate");
assert.equal(ideaCardSchema.safeParse({
  ...baseCard,
  productionEstimate: { ...simpleEstimate, captureMinutesLow: 40, captureMinutesHigh: 20 },
}).success, false);

const fingerprint = timingFingerprint(baseCard);
const duplicateDistribution = analyzeDurationDistribution([24, 31], [fingerprint, fingerprint]);
assert.ok(duplicateDistribution.issueCodes.includes("batch_timing_template_duplicate"));

console.log("duration planner and production estimate fixtures passed");