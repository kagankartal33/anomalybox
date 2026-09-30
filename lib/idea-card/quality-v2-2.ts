export const QUALITY_GATE_VERSION = "quality-gate-v2.2.0";

export type QualityDecision = "approve" | "refine" | "reject" | "human_review_required";

export type CraftDimensions = {
  filmability: number;
  narrativeIntegrity: number;
  laneSpecificity: number;
  naturalLanguage: number;
  originality: number;
  safetyAndEvidence: number;
  productionPracticality: number;
};

export type QualityV22Options = {
  fingerprintScore?: number | null;
  semanticScore?: number | null;
  embeddingModel?: string | null;
  embeddingModelVersion?: string | null;
  safetyFlags?: string[];
  feedbackAdjustment?: number;
};

export type QualityV22Result = {
  version: typeof QUALITY_GATE_VERSION;
  craftScore: number;
  adjustedScore: number;
  dimensions: CraftDimensions;
  decision: QualityDecision;
  hardGateCodes: string[];
  issueCodes: string[];
  humanReviewReasons: string[];
  fingerprintScore: number | null;
  semanticScore: number | null;
  embeddingModel: string | null;
  embeddingModelVersion: string | null;
};

type Step = {
  start: number;
  end: number;
  purpose: string;
  goal: string;
  action: string;
  spokenLine: string;
  shot: string;
  onScreenText: string;
};

type NormalizedCard = {
  title: string;
  concept: string;
  category: string;
  persona: string;
  duration: number;
  takeaway: string;
  why: string;
  hookId: string;
  shootFormat: string;
  requiredItems: string[];
  notes: string[];
  steps: Step[];
  rawText: string;
};

const META_LANGUAGE = /\b(viral|algorithm|engagement bait|watch time|retention hack|content strategy|this reel|the viewer|creator-facing|quality score|training data|decision trace)\b/i;
const GUARANTEE_LANGUAGE = /\b(guaranteed|cure|treats?\b|diagnos(?:e|is)|risk[- ]free|no side effects|lose \d+|make money fast|instant results?|always works?)\b/i;
const GENERIC_CTA = /\b(follow for more|like and subscribe|smash (?:that )?like|save this for later|comment below)\b/i;
const PHYSICAL_ACTION = /\b(open|close|place|pour|cut|slice|mix|hold|turn|walk|step|lift|lower|show|reveal|point|tap|press|wipe|swap|taste|bend|write|measure|compare|apply|remove|enter|exit|frame|pan|tilt|zoom|rack focus|capture)\b/i;
const PROOF_LANGUAGE = /\b(proof|show|reveal|compare|before|after|result|measure|close-up|texture|receipt|timer|screen|test|demonstrat|side by side)\b/i;
const CAMERA_LANGUAGE = /\b(close-up|wide|medium|macro|overhead|handheld|tripod|static|tracking|pov|rack focus|push-in|locked)\b/i;
const SECOND_PERSON = /\b(you|your|we|I|my|let's|here's|watch|look)\b/i;
const BANNED_RESIDUE = /\b(lorem ipsum|insert (?:hook|cta|product)|placeholder|as an ai|category_layer_pack|premium completeness|human awareness score)\b/i;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function texts(value: unknown): string[] {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function number(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeStep(value: unknown, index: number): Step {
  const row = record(value);
  const timing = record(row.timing);
  const start = number(row.start ?? row.startSeconds ?? timing.start, index * 4);
  const end = number(row.end ?? row.endSeconds ?? timing.end, start + 4);
  return {
    start,
    end,
    purpose: text(row.purpose ?? row.stage),
    goal: text(row.goal),
    action: text(row.action ?? row.visual_action ?? row.direction),
    spokenLine: text(row.spokenLine ?? row.spoken_line ?? row.dialogue ?? row.voiceover),
    shot: text(row.shot ?? row.shot_type ?? row.camera),
    onScreenText: text(row.onScreenText ?? row.on_screen_text ?? row.overlay),
  };
}

function normalizeCard(input: unknown): NormalizedCard {
  const card = record(input);
  const scenes = Array.isArray(card.steps)
    ? card.steps
    : Array.isArray(card.scene_script)
      ? card.scene_script
      : [];
  const summary = record(card.idea_summary);
  const why = record(card.why_it_can_work);
  const production = record(card.production_plan);
  const normalized: Omit<NormalizedCard, "rawText"> = {
    title: text(card.title ?? summary.title),
    concept: text(card.conceptSummary ?? card.concept_summary ?? summary.one_sentence_premise ?? summary.summary),
    category: text(card.category ?? card.category_slug),
    persona: text(card.personaSlug ?? card.persona_slug),
    duration: number(card.durationSeconds ?? card.duration_seconds ?? production.duration_seconds, 0),
    takeaway: text(card.viewerTakeaway ?? card.viewer_takeaway ?? summary.viewer_takeaway),
    why: text(card.whyItWorks ?? card.why_it_works ?? why.summary ?? why.reason),
    hookId: text(card.hookId ?? card.hook_id),
    shootFormat: text(card.shootFormat ?? card.shoot_format ?? card.format),
    requiredItems: texts(card.requiredItems ?? card.required_items ?? production.required_items),
    notes: texts(card.overallProductionNotes ?? card.overall_production_notes ?? production.notes),
    steps: scenes.map(normalizeStep),
  };
  return { ...normalized, rawText: JSON.stringify(input) };
}

function timelineIsContinuous(card: NormalizedCard): boolean {
  if (card.steps.length < 3) return false;
  for (let index = 0; index < card.steps.length; index += 1) {
    const step = card.steps[index];
    if (step.end <= step.start) return false;
    if (index === 0 && Math.abs(step.start) > 0.05) return false;
    if (index > 0 && Math.abs(step.start - card.steps[index - 1].end) > 0.05) return false;
  }
  return card.duration > 0 && Math.abs(card.steps.at(-1)!.end - card.duration) <= 0.05;
}

function tokenSet(value: string): Set<string> {
  return new Set(value.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
}

function overlap(left: string, right: string): number {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.min(a.size, b.size);
}

function uniqueRatio(values: string[]): number {
  if (!values.length) return 0;
  return new Set(values.map((value) => value.toLowerCase().replace(/\s+/g, " "))).size / values.length;
}

function hasConcreteDetail(value: string): boolean {
  return /\b\d+(?:\.\d+)?\b/.test(value) || /\b(mirror|counter|kitchen|studio|street|hotel|trail|gym|pan|bowl|brush|shoe|plate|window|door|bench|table|phone|camera|product|ingredient)\b/i.test(value);
}

export function evaluateIdeaCardV22(input: unknown, options: QualityV22Options = {}): QualityV22Result {
  const card = normalizeCard(input);
  const hardGateCodes: string[] = [];
  const issueCodes: string[] = [];
  const humanReviewReasons: string[] = [];
  const fingerprintScore = options.fingerprintScore ?? null;
  const semanticScore = options.semanticScore ?? null;

  if (!card.title || !card.concept || !card.takeaway || card.steps.length < 3) hardGateCodes.push("schema_incomplete");
  if (!timelineIsContinuous(card)) hardGateCodes.push("timeline_invalid");
  if (BANNED_RESIDUE.test(card.rawText)) hardGateCodes.push("creator_facing_residue");
  if (GENERIC_CTA.test(card.rawText)) hardGateCodes.push("generic_cta");
  if (fingerprintScore !== null && fingerprintScore >= 0.92) hardGateCodes.push("fingerprint_duplicate");
  if (semanticScore !== null && semanticScore >= 0.86) hardGateCodes.push("semantic_duplicate");
  if (semanticScore !== null && semanticScore >= 0.78 && semanticScore < 0.86) humanReviewReasons.push("semantic_similarity_review");

  const actionCount = card.steps.filter((step) => PHYSICAL_ACTION.test(step.action)).length;
  const shotCount = card.steps.filter((step) => CAMERA_LANGUAGE.test(step.shot)).length;
  const proofCount = card.steps.filter((step) => PROOF_LANGUAGE.test(`${step.purpose} ${step.goal} ${step.action} ${step.shot} ${step.onScreenText}`)).length;
  const spoken = card.steps.map((step) => step.spokenLine).filter(Boolean);
  const spokenWordCounts = spoken.map((line) => line.split(/\s+/).filter(Boolean).length);

  let filmability = 25;
  if (actionCount < Math.ceil(card.steps.length * 0.65)) { filmability -= 9; issueCodes.push("weak_physical_actions"); }
  if (shotCount < Math.ceil(card.steps.length * 0.5)) { filmability -= 6; issueCodes.push("underspecified_shots"); }
  if (!timelineIsContinuous(card)) filmability -= 10;

  let narrativeIntegrity = 20;
  if (!card.hookId) { narrativeIntegrity -= 4; issueCodes.push("missing_hook_taxonomy"); }
  if (!proofCount) { narrativeIntegrity -= 8; hardGateCodes.push("missing_proof_beat"); }
  if (overlap(`${card.title} ${card.concept}`, `${card.takeaway} ${card.steps.at(-1)?.goal ?? ""}`) < 0.08) {
    narrativeIntegrity -= 6;
    issueCodes.push("hook_payoff_mismatch");
  }

  let laneSpecificity = 15;
  const laneText = `${card.category} ${card.persona} ${card.title} ${card.concept} ${card.steps.map((step) => step.action).join(" ")}`;
  if (!card.category) { laneSpecificity -= 5; issueCodes.push("missing_category"); }
  if (!card.persona) { laneSpecificity -= 3; issueCodes.push("missing_persona"); }
  if (!hasConcreteDetail(laneText)) { laneSpecificity -= 6; issueCodes.push("generic_lane_execution"); }

  let naturalLanguage = 15;
  if (META_LANGUAGE.test(spoken.join(" "))) { naturalLanguage -= 8; hardGateCodes.push("meta_dialogue"); }
  if (spoken.length && spokenWordCounts.some((count) => count > 22)) { naturalLanguage -= 4; issueCodes.push("dialogue_too_long"); }
  if (spoken.length && !spoken.some((line) => SECOND_PERSON.test(line))) { naturalLanguage -= 2; issueCodes.push("stilted_dialogue"); }
  if (uniqueRatio(spoken) < 0.75) { naturalLanguage -= 5; issueCodes.push("repeated_dialogue"); }

  let originality = 10;
  const comparisonScore = Math.max(fingerprintScore ?? 0, semanticScore ?? 0);
  originality -= comparisonScore * 10;
  if (uniqueRatio(card.steps.map((step) => step.action)) < 0.8) { originality -= 3; issueCodes.push("repeated_action_pattern"); }

  let safetyAndEvidence = 10;
  const explicitSafetyFlags = options.safetyFlags ?? [];
  if (GUARANTEE_LANGUAGE.test(card.rawText)) { safetyAndEvidence -= 8; hardGateCodes.push("unsafe_or_unbounded_claim"); }
  if (explicitSafetyFlags.some((flag) => flag.startsWith("hard_"))) hardGateCodes.push(...explicitSafetyFlags);
  if (explicitSafetyFlags.some((flag) => flag.includes("review"))) humanReviewReasons.push(...explicitSafetyFlags);
  if (/\b(sponsored|paid partnership|ad)\b/i.test(card.rawText) && !/\b(disclos|paid partnership label|sponsor tag)\b/i.test(card.rawText)) {
    safetyAndEvidence -= 5;
    humanReviewReasons.push("sponsor_disclosure_review");
  }

  let productionPracticality = 5;
  if (card.requiredItems.length > 8) { productionPracticality -= 2; issueCodes.push("too_many_props"); }
  if (card.duration < 10 || card.duration > 60) { productionPracticality -= 2; issueCodes.push("duration_impractical"); }
  if (!card.notes.length) { productionPracticality -= 1; issueCodes.push("missing_production_notes"); }

  const dimensions: CraftDimensions = {
    filmability: round(clamp(filmability, 0, 25)),
    narrativeIntegrity: round(clamp(narrativeIntegrity, 0, 20)),
    laneSpecificity: round(clamp(laneSpecificity, 0, 15)),
    naturalLanguage: round(clamp(naturalLanguage, 0, 15)),
    originality: round(clamp(originality, 0, 10)),
    safetyAndEvidence: round(clamp(safetyAndEvidence, 0, 10)),
    productionPracticality: round(clamp(productionPracticality, 0, 5)),
  };
  const craftScore = round(Object.values(dimensions).reduce((sum, score) => sum + score, 0));
  const feedbackAdjustment = clamp(options.feedbackAdjustment ?? 0, -5, 5);
  const adjustedScore = round(clamp(craftScore + feedbackAdjustment));
  const uniqueHardGates = [...new Set(hardGateCodes)];
  const uniqueReviews = [...new Set(humanReviewReasons)];

  let decision: QualityDecision;
  if (uniqueHardGates.length) decision = "reject";
  else if (uniqueReviews.length) decision = "human_review_required";
  else if (adjustedScore >= 88) decision = "approve";
  else if (adjustedScore >= 78) decision = "refine";
  else decision = "reject";

  return {
    version: QUALITY_GATE_VERSION,
    craftScore,
    adjustedScore,
    dimensions,
    decision,
    hardGateCodes: uniqueHardGates,
    issueCodes: [...new Set(issueCodes)],
    humanReviewReasons: uniqueReviews,
    fingerprintScore,
    semanticScore,
    embeddingModel: options.embeddingModel ?? null,
    embeddingModelVersion: options.embeddingModelVersion ?? null,
  };
}