import { automaticCard, automaticConcept, automaticRecipe } from "../tests/fixtures/automatic-card";
import { evaluateIdeaCardV22 } from "../lib/idea-card/quality-v2-2";
import { AUTOMATIC_REGRESSION_VERSION } from "../lib/generation/qualification";

export function runAutomaticQualityRegression() {
  const base = automaticCard;
  const cases: Array<{ name: string; card: unknown; approve: boolean; options?: Parameters<typeof evaluateIdeaCardV22>[1] }> = [
    { name: "filmable_control", card: base, approve: true },
    { name: "missing_dialogue", card: { ...base, steps: base.steps.map((s) => ({ ...s, spokenLine: null })) }, approve: false },
    { name: "missing_camera", card: { ...base, steps: base.steps.map((s) => ({ ...s, shot: null })) }, approve: false },
    { name: "abstract_actions", card: { ...base, steps: base.steps.map((s, i) => ({ ...s, action: ["Be relatable and authentic", "Embody calm elegance", "Express a strong feeling", "Create a memorable atmosphere"][i] })) }, approve: false },
    { name: "category_copy", card: { ...base, category: "travel" }, approve: false },
    { name: "invalid_schema", card: { ...base, difficulty: "invalid" }, approve: false },
    { name: "duplicate_step_ids", card: { ...base, steps: base.steps.map((s) => ({ ...s, id: "same" })) }, approve: false },
    { name: "unfilmable_wait", card: { ...base, steps: base.steps.map((s, i) => i === 2 ? { ...s, action: "Hold the samples for thirty seconds in one continuous shot" } : s) }, approve: false },
    { name: "missing_visible_proof", card: { ...base, steps: base.steps.map((s, i) => ({ ...s, purpose: "Promise a comparison", goal: "Tease a test", action: ["Hold the unopened samples", "Place the sealed containers on a table", "Turn the unopened packaging", "Point to both sealed samples without testing"][i], onScreenText: "Proof soon" })) }, approve: false },
    { name: "prop_is_not_proof", card: { ...base, steps: base.steps.map((s, i) => ({ ...s, action: ["Hold one skincare sample beside a mirror.", "Place two bottles on the counter.", "Turn one bottle so its label faces the phone.", "Point toward the two bottles beside the mirror."][i] })) }, approve: false },
    { name: "privacy_without_permission", card: { ...base, overallProductionNotes: [...(base.overallProductionNotes ?? []), "Record the customer's private medical details in the background without permission."] }, approve: false },
    { name: "privacy_negative_instruction", card: { ...base, overallProductionNotes: [...(base.overallProductionNotes ?? []), "Never record the customer's private medical details without permission."] }, approve: true },
    { name: "privacy_explicit_consent", card: { ...base, overallProductionNotes: [...(base.overallProductionNotes ?? []), "Record the customer's reaction with their written consent."] }, approve: true },
    { name: "medical_disclaimer_bypass", card: { ...base, steps: base.steps.map((s, i) => i === 3 ? { ...s, spokenLine: "This skincare sample heals eczema." } : s), overallProductionNotes: [...(base.overallProductionNotes ?? []), "This is not medical advice."] }, approve: false },
    { name: "safe_negative_instruction", card: { ...base, overallProductionNotes: [...(base.overallProductionNotes ?? []), "Never claim this skincare sample is a cure."] }, approve: true },
    { name: "sponsor_without_disclosure", card: { ...base, conceptSummary: `${base.conceptSummary} Sponsored comparison.`, overallProductionNotes: [...(base.overallProductionNotes ?? []), "Do not add disclosure."] }, approve: false },
    ...["#ad", "Paid partnership", "Sponsored by Example"].map(disclosure => ({ name: `sponsor_disclosed_${disclosure}`, card: { ...base, conceptSummary: `${base.conceptSummary} Sponsored comparison.`, steps: base.steps.map((s, i) => i === 0 ? { ...s, onScreenText: disclosure } : s) }, approve: true })),
    { name: "sponsor_negative_disclosure", card: { ...base, conceptSummary: `${base.conceptSummary} Sponsored comparison.`, steps: base.steps.map((s, i) => i === 0 ? { ...s, onScreenText: "Do not show #ad" } : s) }, approve: false },
    { name: "semantic_uncertainty", card: base, options: { semanticScore: 0.8 }, approve: false },
    { name: "semantic_duplicate", card: base, options: { semanticScore: 0.9 }, approve: false },
    { name: "creator_leak", card: { ...base, viewerTakeaway: "Use the internal score to improve the result." }, approve: false },
    { name: "rushed_dialogue", card: { ...base, steps: base.steps.map((s, i) => i === 0 ? { ...s, spokenLine: "Here are all the very important details you need to know about both different skincare textures before this opening shot finishes now." } : s) }, approve: false },
  ];
  for (const residue of ["creative recipe", "taxonomy version", "genre id", "vibe preset", "emotion arc", "proof device", "payoff type", "generator run"]) {
    cases.push({ name: `creator_residue_${residue.replaceAll(" ", "_")}`, card: { ...base, viewerTakeaway: `Use the ${residue} when choosing the sample.` }, approve: false });
  }
  for (const manipulation of ["shame", "humiliate", "panic", "rage bait", "terrify", "body anxiety", "medical fear", "fake scarcity"]) {
    cases.push({ name: `manipulation_${manipulation.replaceAll(" ", "_")}`, card: { ...base, conceptSummary: `Use ${manipulation} to force attention during this skincare comparison.` }, approve: false });
  }
  for (const [name, options] of [
    ["fingerprint_negative", { fingerprintScore: -0.1 }],
    ["fingerprint_over_one", { fingerprintScore: 1.1 }],
    ["fingerprint_nan", { fingerprintScore: Number.NaN }],
    ["semantic_negative", { semanticScore: -0.1 }],
    ["semantic_over_one", { semanticScore: 1.1 }],
    ["semantic_nan", { semanticScore: Number.NaN }],
  ] as const) cases.push({ name, card: base, options, approve: false });
  cases.push(
    { name: "timeline_starts_late", card: { ...base, steps: base.steps.map((step, index) => index === 0 ? { ...step, startSecond: 1 } : step) }, approve: false },
    { name: "timeline_gap", card: { ...base, steps: base.steps.map((step, index) => index === 1 ? { ...step, startSecond: 5 } : step) }, approve: false },
    { name: "timeline_overlap", card: { ...base, steps: base.steps.map((step, index) => index === 1 ? { ...step, startSecond: 3 } : step) }, approve: false },
    { name: "timeline_zero_length", card: { ...base, steps: base.steps.map((step, index) => index === 1 ? { ...step, endSecond: step.startSecond } : step) }, approve: false },
    { name: "timeline_ends_early", card: { ...base, steps: base.steps.map((step, index) => index === 3 ? { ...step, endSecond: 19 } : step) }, approve: false },
    { name: "duration_below_contract", card: { ...base, durationSeconds: 9 }, approve: false },
    { name: "too_many_steps", card: { ...base, steps: [...base.steps, ...base.steps.map((step, index) => ({ ...step, id: `extra-${index}`, order: index + 5 }))] }, approve: false },
    { name: "too_few_steps", card: { ...base, steps: base.steps.slice(0, 2) }, approve: false },
  );
  for (const flag of ["hard_health_claim", "hard_child_privacy", "privacy_consent_review", "missing_sponsor_disclosure", "missing_claim_boundary", "missing_claim_evidence", "dangerous_challenge_review", "restricted_category_review"]) {
    cases.push({ name: `safety_flag_${flag}`, card: base, options: { safetyFlags: [flag] }, approve: false });
  }
  cases.push(
    { name: "schema_empty_title", card: { ...base, title: "" }, approve: false },
    { name: "schema_empty_concept", card: { ...base, conceptSummary: "" }, approve: false },
    { name: "schema_empty_takeaway", card: { ...base, viewerTakeaway: "" }, approve: false },
    { name: "schema_empty_items", card: { ...base, requiredItems: [] }, approve: false },
    { name: "schema_bad_difficulty", card: { ...base, difficulty: "impossible" }, approve: false },
    { name: "schema_bad_version", card: { ...base, schemaVersion: 3 }, approve: false },
    { name: "schema_duration_too_long", card: { ...base, durationSeconds: 61 }, approve: false },
    { name: "schema_unknown_step_stage", card: { ...base, steps: base.steps.map((step, index) => index === 0 ? { ...step, stage: "internal" } : step) }, approve: false },
    { name: "recipe_unknown_hook", card: base, options: { creativeRecipe: { ...automaticRecipe, hookTypeId: "not_a_hook" } }, approve: false },
    { name: "recipe_blocked_hook", card: base, options: { creativeRecipe: { ...automaticRecipe, hookTypeId: "polarizing_dichotomy" } }, approve: false },
  );
  const results = cases.map((item) => {
    const gate = evaluateIdeaCardV22(item.card, { creativeRecipe: automaticRecipe, concept: automaticConcept, ...item.options });
    return { name: item.name, passed: (gate.decision === "approve") === item.approve && gate.decision !== "human_review_required", decision: gate.decision, reasons: [...gate.hardGateCodes, ...gate.issueCodes, ...gate.humanReviewReasons] };
  });
  return { version: AUTOMATIC_REGRESSION_VERSION, passed: results.every((row) => row.passed), case_count: results.length, results };
}