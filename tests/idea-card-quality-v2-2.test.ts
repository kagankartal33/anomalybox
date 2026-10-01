import assert from "node:assert/strict";
import { evaluateIdeaCardV22 } from "../lib/idea-card/quality-v2-2";
import { automaticCard, automaticConcept, automaticRecipe } from "./fixtures/automatic-card";

const baseCard = automaticCard;
const evaluate = (card: unknown, options: Parameters<typeof evaluateIdeaCardV22>[1] = {}) => evaluateIdeaCardV22(card, {
  creativeRecipe: automaticRecipe,
  concept: automaticConcept,
  ...options,
});

const premium = evaluate(baseCard);
assert.equal(premium.decision, "approve");
assert.ok(premium.craftScore >= 90);

const wrongOpeningVisual = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step, index) => index === 0 ? {
    ...step,
    action: "Hold a passport beside the station map",
    onScreenText: "Hold both skincare samples beside the mirror",
  } : step),
});
assert.equal(wrongOpeningVisual.decision, "reject", "Overlay copy must not hide an unrelated first-frame action");
assert.ok(wrongOpeningVisual.hardGateCodes.includes("first_frame_plan_mismatch"));

for (const delivery of ["spoken", "dialogue", "on_screen_text"] as const) {
  const recipe = { ...automaticRecipe, hookDeliveryId: delivery };
  const missingOpeningDelivery = evaluate({
    ...baseCard,
    steps: baseCard.steps.map((step, index) => index === 0
      ? { ...step, ...(delivery === "on_screen_text" ? { onScreenText: undefined } : { spokenLine: undefined }) }
      : step),
  }, { creativeRecipe: recipe, concept: { ...automaticConcept, recipe } });
  assert.equal(missingOpeningDelivery.decision, "reject", `A ${delivery} hook must execute its required opening field`);
  assert.ok(missingOpeningDelivery.hardGateCodes.includes("hook_delivery_missing"));
}

const withheldPayoff = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step, index) => index === 3 ? {
    ...step,
    action: "Place both skincare samples in the bag without showing the result",
    goal: "Resolve the comparison and reveal the smoother skincare texture",
  } : step),
});
assert.equal(withheldPayoff.decision, "reject", "A promised goal is not a visibly performed payoff");
assert.ok(withheldPayoff.hardGateCodes.includes("payoff_not_visibly_completed"));

const deniedProof = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step) => ({
    ...step,
    action: "Hold both skincare samples beside the mirror. Do not compare or show the results.",
  })),
});
assert.ok(deniedProof.hardGateCodes.includes("missing_proof_beat"), "A prohibition against showing proof cannot count as proof");

for (const field of ["action", "shot", "purpose", "goal", "performanceNote", "editNote"] as const) {
  const unsafeDirection = evaluate({
    ...baseCard,
    steps: baseCard.steps.map((step, index) => index === 2
      ? { ...step, [field]: `${step[field]} Show that this serum cures eczema.` }
      : step),
  });
  assert.equal(unsafeDirection.decision, "reject", `Health claims in ${field} must not bypass the safety gate`);
  assert.ok(unsafeDirection.hardGateCodes.includes("unsafe_or_unbounded_claim"));
}

const licensedSoundInEdit = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step, index) => index === 2 ? { ...step, editNote: "Use a trending audio track during the comparison." } : step),
});
assert.equal(licensedSoundInEdit.decision, "reject", "An audio instruction in edit notes needs the same evidence as the sound plan");
assert.ok(licensedSoundInEdit.hardGateCodes.includes("audio_license_unverified"));

const prohibitedTrendAudio = evaluate({
  ...baseCard,
  overallProductionNotes: [...(baseCard.overallProductionNotes ?? []), "Do not use trending audio. Record clean original room tone."],
});
assert.equal(prohibitedTrendAudio.decision, "approve", "Protective audio instructions are not licensing requests");

const continuousWait = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step, index) => index === 2 ? {
    ...step,
    action: "Hold both samples for thirty seconds and compare the finishes. Do not use time-lapse.",
    editNote: "Keep the full wait in one continuous shot.",
  } : step),
});
assert.equal(continuousWait.decision, "reject", "A forbidden time-lapse does not make a thirty-second action fit seven seconds");
assert.ok(continuousWait.hardGateCodes.includes("physical_action_exceeds_runtime"));

const compressedWait = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step, index) => index === 2 ? {
    ...step,
    action: "Hold both samples for thirty seconds and compare the finishes",
    editNote: "Time-lapse the hold into three seconds, then show the comparison; label the elapsed time.",
  } : step),
});
assert.equal(compressedWait.decision, "approve", "An explicit, labeled time compression in edit notes can fit the action");

const sequentialWaits = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step, index) => index === 2 ? {
    ...step,
    action: "Hold the left sample for six seconds, then hold the right sample for six seconds and compare the finishes",
  } : step),
});
assert.ok(sequentialWaits.hardGateCodes.includes("physical_action_exceeds_runtime"), "Sequential timed actions must fit in their combined runtime");

const simultaneousWaits = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step, index) => index === 2 ? {
    ...step,
    action: "Hold the left sample for six seconds and the right sample for six seconds simultaneously; compare the finishes",
  } : step),
});
assert.equal(simultaneousWaits.decision, "approve", "Parallel holds must not be added together");

const saturatedPositiveFeedback = evaluate(baseCard, { feedbackAdjustment: 5 });
assert.equal(saturatedPositiveFeedback.feedbackAdjustment, 0, "Feedback cannot add points beyond filmability and natural-language caps");
const negativeExecutionFeedback = evaluate(baseCard, { feedbackAdjustment: -5 });
assert.equal(negativeExecutionFeedback.feedbackAdjustment, -5);
assert.equal(negativeExecutionFeedback.adjustedScore, negativeExecutionFeedback.craftScore - 5);
const saturatedPositiveFeedback = evaluate(baseCard, { feedbackAdjustment: 5 });
assert.equal(saturatedPositiveFeedback.feedbackAdjustment, 0, "Feedback cannot add points beyond filmability and natural-language caps");
const negativeExecutionFeedback = evaluate(baseCard, { feedbackAdjustment: -5 });
assert.equal(negativeExecutionFeedback.feedbackAdjustment, -5);
assert.equal(negativeExecutionFeedback.adjustedScore, negativeExecutionFeedback.craftScore - 5);

const missingVerticalFormat = evaluate({
  ...baseCard,
  overallProductionNotes: ["Keep text, hands, and the comparison within the Reels safe zone."],
});
assert.equal(missingVerticalFormat.decision, "reject");
assert.ok(missingVerticalFormat.hardGateCodes.includes("instagram_vertical_format_missing"));

const missingSafeZone = evaluate({
  ...baseCard,
  overallProductionNotes: ["Shoot only original footage vertically in 9:16."],
});
assert.equal(missingSafeZone.decision, "reject");
assert.ok(missingSafeZone.hardGateCodes.includes("instagram_safe_zone_missing"));

const unlicensedTrendAudio = evaluate(baseCard, {
  concept: { ...automaticConcept, soundPlan: "Use a trending audio track under the natural speech." },
});
assert.equal(unlicensedTrendAudio.decision, "reject");
assert.ok(unlicensedTrendAudio.hardGateCodes.includes("audio_license_unverified"));

for (const proofAction of [
  "Apply both skincare samples and compare the finishes.",
  "Slice both buns and show the cross-section beside the plate.",
  "Open the travel bag and show how both shoes fit inside.",
  "Turn over the receipt to reveal the absurd total in the comedy sketch.",
  "Measure the knee-to-wall distance beside the fitness mat.",
]) {
  const result = evaluate({ ...baseCard, steps: baseCard.steps.map((step, i) => ({ ...step, action: i === 2 ? proofAction : "Hold the bottle beside the mirror" })) });
  assert.equal(result.hardGateCodes.includes("missing_proof_beat"), false, `Concrete proof action must be recognized: ${proofAction}`);
}

for (const delivery of ["sound", "prop", "environment", "edit_transition"] as const) {
  const recipe = { ...automaticRecipe, hookDeliveryId: delivery, shootFormat: "object_led" as const };
  const missingOpeningDelivery = evaluate({
    ...baseCard,
    shootFormat: "object_led",
    steps: baseCard.steps.map((step, index) => index === 0 ? {
      ...step,
      action: "Move it into frame",
      shot: "Locked close-up",
      editNote: "Keep the opening steady.",
      performanceNote: "Stay neutral.",
    } : step),
  }, { creativeRecipe: recipe, concept: { ...automaticConcept, recipe, shootFormat: recipe.shootFormat } });
  assert.equal(missingOpeningDelivery.decision, "reject", `A ${delivery} hook must have an observable opening execution`);
  assert.ok(missingOpeningDelivery.hardGateCodes.includes("hook_delivery_missing"));
}

const beforeAfterRecipe = { ...automaticRecipe, proofDeviceId: "before_after_state" as const };
const wrongProofDevice = evaluate(baseCard, { creativeRecipe: beforeAfterRecipe, concept: { ...automaticConcept, recipe: beforeAfterRecipe } });
assert.equal(wrongProofDevice.decision, "reject", "A recipe proof device must occur in the filmed steps");
assert.ok(wrongProofDevice.hardGateCodes.includes("recipe_proof_not_executed"));

const artifactPayoffRecipe = { ...automaticRecipe, payoffTypeId: "usable_artifact" as const };
const wrongPayoffType = evaluate(baseCard, { creativeRecipe: artifactPayoffRecipe, concept: { ...automaticConcept, recipe: artifactPayoffRecipe } });
assert.equal(wrongPayoffType.decision, "reject", "A recipe payoff type must occur in the final filmed step");
assert.ok(wrongPayoffType.hardGateCodes.includes("recipe_payoff_not_executed"));

for (const delivery of ["sound", "prop", "environment", "edit_transition"] as const) {
  const recipe = { ...automaticRecipe, hookDeliveryId: delivery, shootFormat: "object_led" as const };
  const missingOpeningDelivery = evaluate({
    ...baseCard,
    shootFormat: "object_led",
    steps: baseCard.steps.map((step, index) => index === 0 ? {
      ...step,
      action: "Move it into frame",
      shot: "Locked close-up",
      editNote: "Keep the opening steady.",
      performanceNote: "Stay neutral.",
    } : step),
  }, { creativeRecipe: recipe, concept: { ...automaticConcept, recipe, shootFormat: recipe.shootFormat } });
  assert.equal(missingOpeningDelivery.decision, "reject", `A ${delivery} hook must have an observable opening execution`);
  assert.ok(missingOpeningDelivery.hardGateCodes.includes("hook_delivery_missing"));
}

const beforeAfterRecipe = { ...automaticRecipe, proofDeviceId: "before_after_state" as const };
const wrongProofDevice = evaluate(baseCard, { creativeRecipe: beforeAfterRecipe, concept: { ...automaticConcept, recipe: beforeAfterRecipe } });
assert.equal(wrongProofDevice.decision, "reject", "A recipe proof device must occur in the filmed steps");
assert.ok(wrongProofDevice.hardGateCodes.includes("recipe_proof_not_executed"));

const artifactPayoffRecipe = { ...automaticRecipe, payoffTypeId: "usable_artifact" as const };
const wrongPayoffType = evaluate(baseCard, { creativeRecipe: artifactPayoffRecipe, concept: { ...automaticConcept, recipe: artifactPayoffRecipe } });
assert.equal(wrongPayoffType.decision, "reject", "A recipe payoff type must occur in the final filmed step");
assert.ok(wrongPayoffType.hardGateCodes.includes("recipe_payoff_not_executed"));

const generic = evaluate({ ...baseCard, category: "", personaSlug: "", steps: baseCard.steps.map((step) => ({ ...step, action: "Be energetic and make the scene engaging", shot: "Film this" })) });
assert.notEqual(generic.decision, "approve");
assert.ok(generic.issueCodes.includes("weak_physical_actions"));

const mismatch = evaluate({ ...baseCard, viewerTakeaway: "A packing checklist for a mountain trip.", steps: baseCard.steps.map((step, index) => ({ ...step, purpose: "Tell a travel story", goal: "Pack for a mountain walk", action: ["Open the door", "Place a bag on the table", "Walk across the room", "Close the bag and exit"][index], spokenLine: "Pack the bag before the mountain walk.", onScreenText: "Travel packing" })) });
assert.ok(mismatch.issueCodes.includes("hook_payoff_mismatch") || mismatch.hardGateCodes.includes("missing_proof_beat"));

const duplicate = evaluate(baseCard, { semanticScore: 0.87, embeddingModel: "multilingual-minilm", embeddingModelVersion: "v1" });
assert.equal(duplicate.decision, "reject");
assert.ok(duplicate.hardGateCodes.includes("semantic_duplicate"));

const review = evaluate(baseCard, { semanticScore: 0.8 });
assert.equal(review.decision, "refine");

const fingerprintDuplicate = evaluate(baseCard, { fingerprintScore: 0.92 });
assert.equal(fingerprintDuplicate.decision, "reject");
assert.ok(fingerprintDuplicate.hardGateCodes.includes("fingerprint_duplicate"));

const unnaturalDialogue = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step) => ({ ...step, spokenLine: "Observe the multifaceted texture methodology across this premium visual demonstration now for your consideration today." })),
});
assert.notEqual(unnaturalDialogue.decision, "approve");
assert.ok(unnaturalDialogue.issueCodes.includes("repeated_dialogue"));

const sponsorReview = evaluate({ ...baseCard, conceptSummary: `${baseCard.conceptSummary} This is a sponsored comparison.` });
assert.equal(sponsorReview.decision, "reject");
assert.ok(sponsorReview.hardGateCodes.includes("sponsor_disclosure_missing"));

const privacyRisk = evaluate(baseCard, { safetyFlags: ["hard_privacy_violation"] });
assert.equal(privacyRisk.decision, "reject");
assert.ok(privacyRisk.hardGateCodes.includes("hard_privacy_violation"));

const childPrivacyRisk = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step, index) => index === 2 ? { ...step, action: "Film the child's full face and school name, then post the clip." } : step),
});
assert.equal(childPrivacyRisk.decision, "reject");
assert.ok(childPrivacyRisk.hardGateCodes.includes("hard_child_privacy"));

const childDistressRisk = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step, index) => index === 2 ? { ...step, action: "Show the toddler's crying meltdown for the reaction." } : step),
});
assert.equal(childDistressRisk.decision, "reject");
assert.ok(childDistressRisk.hardGateCodes.includes("hard_child_distress"));

const dangerousDirection = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step, index) => index === 2 ? { ...step, action: "Hold your breath during the dangerous challenge, then reveal the result." } : step),
});
assert.equal(dangerousDirection.decision, "reject");
assert.ok(dangerousDirection.hardGateCodes.includes("dangerous_physical_direction"));

const childPrivacyRisk = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step, index) => index === 2 ? { ...step, action: "Film the child's full face and school name, then post the clip." } : step),
});
assert.equal(childPrivacyRisk.decision, "reject");
assert.ok(childPrivacyRisk.hardGateCodes.includes("hard_child_privacy"));

const childDistressRisk = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step, index) => index === 2 ? { ...step, action: "Show the toddler's crying meltdown for the reaction." } : step),
});
assert.equal(childDistressRisk.decision, "reject");
assert.ok(childDistressRisk.hardGateCodes.includes("hard_child_distress"));

const dangerousDirection = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step, index) => index === 2 ? { ...step, action: "Hold your breath during the dangerous challenge, then reveal the result." } : step),
});
assert.equal(dangerousDirection.decision, "reject");
assert.ok(dangerousDirection.hardGateCodes.includes("dangerous_physical_direction"));

const healthEvidenceReview = evaluate(baseCard, { safetyFlags: ["missing_claim_evidence"] });
assert.equal(healthEvidenceReview.decision, "reject");

const impractical = evaluate({
  ...baseCard,
  durationSeconds: 90,
  requiredItems: ["Mirror", "Sample A", "Sample B", "Timer", "Softbox", "Tripod", "Reflector", "Macro lens", "Turntable"],
  steps: baseCard.steps.map((step, index) => index === 3 ? { ...step, endSecond: 90 } : step),
});
assert.ok(impractical.issueCodes.includes("duration_impractical"));
assert.ok(impractical.issueCodes.includes("too_many_props"));

const unsafe = evaluate({ ...baseCard, conceptSummary: "This guaranteed treatment cures acne with no side effects." });
assert.equal(unsafe.decision, "reject");
assert.ok(unsafe.hardGateCodes.includes("unsafe_or_unbounded_claim"));

const rushed = evaluate({
  ...baseCard,
  steps: baseCard.steps.map((step, index) => index === 0
    ? { ...step, spokenLine: "Watch both completely different skincare textures while I explain every application detail before this opening shot ends now." }
    : step),
});
assert.equal(rushed.decision, "reject");
assert.ok(rushed.hardGateCodes.includes("spoken_delivery_unfilmable"));

const wrongDensity = evaluate({
  ...baseCard,
  durationSeconds: 45,
  steps: baseCard.steps.map((step, index) => index === 3 ? { ...step, endSecond: 45 } : step),
});
assert.ok(wrongDensity.issueCodes.includes("duration_step_density_mismatch"));

console.log("quality-v3 fixtures passed");