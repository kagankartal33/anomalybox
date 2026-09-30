import { automaticCard } from "../tests/fixtures/automatic-card";
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
    { name: "medical_disclaimer_bypass", card: { ...base, steps: base.steps.map((s, i) => i === 3 ? { ...s, spokenLine: "This skincare sample heals eczema." } : s), overallProductionNotes: ["This is not medical advice."] }, approve: false },
    { name: "safe_negative_instruction", card: { ...base, overallProductionNotes: ["Never claim this skincare sample is a cure."] }, approve: true },
    { name: "sponsor_without_disclosure", card: { ...base, conceptSummary: `${base.conceptSummary} Sponsored comparison.`, overallProductionNotes: ["Do not add disclosure."] }, approve: false },
    { name: "semantic_uncertainty", card: base, options: { semanticScore: 0.8 }, approve: false },
    { name: "semantic_duplicate", card: base, options: { semanticScore: 0.9 }, approve: false },
    { name: "creator_leak", card: { ...base, viewerTakeaway: "Use the internal score to improve the result." }, approve: false },
    { name: "rushed_dialogue", card: { ...base, steps: base.steps.map((s, i) => i === 0 ? { ...s, spokenLine: "Here are all the very important details you need to know about both different skincare textures before this opening shot finishes now." } : s) }, approve: false },
  ];
  const results = cases.map((item) => {
    const gate = evaluateIdeaCardV22(item.card, item.options);
    return { name: item.name, passed: (gate.decision === "approve") === item.approve && gate.decision !== "human_review_required", decision: gate.decision, reasons: [...gate.hardGateCodes, ...gate.issueCodes] };
  });
  return { version: AUTOMATIC_REGRESSION_VERSION, passed: results.every((row) => row.passed), case_count: results.length, results };
}