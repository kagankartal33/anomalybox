import { ideaCardSchema } from "./schema.ts";
import { hasEarlySponsorDisclosure, needsSponsorDisclosure, privacySafetyFlags } from "./content-safety.ts";
import { parsePurchaseLane } from "../algorithmic-reason/compatibility.ts";
import {
  creativeRecipeSchema,
  hookAutomationStatus,
  recipeMatchesConcept,
  validateRecipeCompatibility,
  type RecipeEvidence,
  type CreativeRecipe,
} from "../generation/creative-taxonomy.ts";

export const QUALITY_GATE_VERSION = "quality-gate-v3.0.1-automatic";

export type QualityDecision = "approve" | "refine" | "reject" | "human_review_required";

export type CraftDimensions = {
  filmability: number;
  hookExecution: number;
  proofPayoffIntegrity: number;
  laneSpecificity: number;
  emotionVibeCoherence: number;
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
  additionalHardGateCodes?: string[];
  additionalIssueCodes?: string[];
  rawInput?: unknown;
  creativeRecipe?: CreativeRecipe | null;
  concept?: unknown;
  requireOriginalityEvidence?: boolean;
  recipeEvidence?: RecipeEvidence;
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
  feedbackAdjustment: number;
};

type Step = {
  start: number;
  end: number;
  stage: string;
  purpose: string;
  goal: string;
  action: string;
  spokenLine: string;
  shot: string;
  onScreenText: string;
  editNote: string;
  performanceNote: string;
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

const META_LANGUAGE = /\\\\b(viral|algorithm|engagement bait|watch time|retention hack|content strategy|this reel|the viewer|creator-facing|quality score|training data|decision trace|creative recipe|taxonomy|genre id|vibe preset|emotion arc|proof device|payoff type)\\\\b/i;
const GUARANTEE_LANGUAGE = /\\\\b(guaranteed|cures?|treats?\\\\b|diagnos(?:e|is)|risk[- ]free|no side effects|lose \\\\d+|make money fast|instant results?|always works?)\\\\b/i;
const GENERIC_CTA = /\\\\b(follow for more|like and subscribe|smash (?:that )?like|save this for later|comment below)\\\\b/i;
const PHYSICAL_ACTION = /\\\\b(open|close|place|pour|drop|cap|uncap|cut|slice|mix|blend|stir|hold|turn|walk|step|lift|lower|show|reveal|point|tap|press|wipe|swap|taste|bend|write|measure|compare|apply|remove|enter|exit|frame|pan|tilt|zoom|rack focus|capture)\\\\b/i;

const CAMERA_LANGUAGE = /\\\\b(close-up|wide|medium|macro|overhead|handheld|tripod|static|tracking|pov|rack focus|push-in|locked)\\\\b/i;
const SECOND_PERSON = /\\\\b(you|your|we|I|my|let's|here's|watch|look)\\\\b/i;
const BANNED_RESIDUE = /\\\\b(lorem ipsum|insert (?:hook|cta|product)|placeholder|as an ai|category_layer_pack|premium completeness|human awareness score|quality gate|score_band|internal score|decision trace|training (?:data|profile|source)|dataset|inventory id|generator run|creative[-_ ]recipe|taxonomy[-_ ]version|genre[-_ ]id|vibe[-_ ]preset|emotion[-_ ]arc|proof[-_ ]device|payoff[-_ ]type)\\\\b/i;
const VERTICAL_FRAME_DIRECTION = /\\\\b(9\\\\s*:\\\\s*16|vertical|portrait)\\\\b/i;
const SAFE_ZONE_DIRECTION = /\\\\b(safe[- ]zone|interface[- ]safe|ui[- ]safe|keep (?:text|captions?|titles?|key action) (?:inside|within|clear of)|avoid (?:the )?(?:top|bottom|right) (?:ui|interface|controls?))\\\\b/i;
const THIRD_PARTY_MEDIA_DIRECTION = /\\\\b(repost|re-upload|download(?:ed)? (?:clip|video|reel|audio)|reuse (?:a |the )?(?:viral|creator|someone else(?:'s)?) (?:clip|video|reel|audio)|rip(?:ped)? (?:audio|music)|use someone else(?:'s)? footage)\\\\b/i;
const LICENSE_SENSITIVE_SOUND = /\\\\b(trending|viral|commercial|copyright(?:ed)?|licensed|chart|popular) (?:audio|sound|song|music|track)\\\\b/i;
const SOUND_EXECUTION = /\\\\b(sound|audio|room tone|sizzle|click|tap|crack|pour|rustle|whisper|voice(?:over)?|listen|hear)\\\\b/i;
const ENVIRONMENT_EXECUTION = /\\\\b(kitchen|bathroom|bedroom|studio|street|home|hotel|airport|gym|restaurant|office|desk|window|outdoor|indoor|workshop|store)\\\\b/i;
const EDIT_TRANSITION_EXECUTION = /\\\\b(cut|transition|match cut|whip(?:-pan)?|speed ramp|wipe|split screen|jump cut|zoom|reveal)\\\\b/i;
const SOUND_EXECUTION = /\\\\b(sound|audio|room tone|sizzle|click|tap|crack|pour|rustle|whisper|voice(?:over)?|listen|hear)\\\\b/i;
const ENVIRONMENT_EXECUTION = /\\\\b(kitchen|bathroom|bedroom|studio|street|home|hotel|airport|gym|restaurant|office|desk|window|outdoor|indoor|workshop|store)\\\\b/i;
const EDIT_TRANSITION_EXECUTION = /\\\\b(cut|transition|match cut|whip(?:-pan)?|speed ramp|wipe|split screen|jump cut|zoom|reveal)\\\\b/i;
const SOUND_EXECUTION = /\\\\b(sound|audio|room tone|sizzle|click|tap|crack|pour|rustle|whisper|voice(?:over)?|listen|hear)\\\\b/i;
const ENVIRONMENT_EXECUTION = /\\\\b(kitchen|bathroom|bedroom|studio|street|home|hotel|airport|gym|restaurant|office|desk|window|outdoor|indoor|workshop|store)\\\\b/i;
const EDIT_TRANSITION_EXECUTION = /\\\\b(cut|transition|match cut|whip(?:-pan)?|speed ramp|wipe|split screen|jump cut|zoom|reveal)\\\\b/i;
const SOUND_EXECUTION = /\\\\b(sound|audio|room tone|sizzle|click|tap|crack|pour|rustle|whisper|voice(?:over)?|listen|hear)\\\\b/i;
const ENVIRONMENT_EXECUTION = /\\\\b(kitchen|bathroom|bedroom|studio|street|home|hotel|airport|gym|restaurant|office|desk|window|outdoor|indoor|workshop|store)\\\\b/i;
const EDIT_TRANSITION_EXECUTION = /\\\\b(cut|transition|match cut|whip(?:-pan)?|speed ramp|wipe|split screen|jump cut|zoom|reveal)\\\\b/i;

const LANE_TERMS: Record<string, RegExp> = {
  beauty: /\\\\b(skincare|makeup|skin|lipstick|foundation|mascara|swatch|blush|serum|concealer|hair|nail)\\\\b/i,
  food: /\\\\b(food|cook|bake|recipe|ingredient|flavou?r|taste|sauce|bread|meal|oven|pan|dough|pasta)\\\\b/i,
  travel: /\\\\b(travel|trip|destination|hotel|flight|airport|luggage|tour|itinerary|passport|trail|station|museum)\\\\b/i,
  entertainment_comedy: /\\\\b(joke|comedy|punchline|sketch|parody|absurd|misunderstanding|awkward|exaggerat\\\\w*|comic|character|reversal)\\\\b/i,
  fitness_wellness_safe: /\\\\b(fitness|workout|exercise|stretch|mobility|squat|gym|dumbbell|reps|posture|breath|wellness|warm.up)\\\\b/i,
  fashion: /\\\\b(fashion|outfit|garment|fabric|fit|cut|seam|hem|waist|sleeve|layer|drape|shoe|jacket|shirt|dress)\\\\b/i,
  commerce_affiliate: /\\\\b(product|compare|test|use|feature|tradeoff|affiliate|sponsor|disclosure|checkout|device|tool)\\\\b/i,
  creator_education: /\\\\b(camera|shot|frame|edit|timeline|caption|script|creator|record|clip|audio|lighting|brief)\\\\b/i,
  lifestyle: /\\\\b(routine|home|desk|room|morning|evening|organize|habit|schedule|space|setup|daily)\\\\b/i,
  luxury: /\\\\b(craft|material|finish|construction|leather|metal|stitch|detail|texture|service|object|fabric)\\\\b/i,
  parenting_family: /\\\\b(parent|family|adult|child|home|routine|prepare|school|meal|play|bedtime|caregiver)\\\\b/i,
  thought_leadership: /\\\\b(decision|source|evidence|tradeoff|framework|record|strategy|research|team|business|leadership|matrix)\\\\b/i,
};

function affirmativeSentences(value: string): string {
  return value.split(/(?<=[.!?;])\\\\s+|
}

function visualContentOverlap(plan: string, action: string): number {
  // Shared camera boilerplate, pronouns, and overlay copy are not evidence
  // that the scheduled objects or scene actually appear in the first image.
  const boilerplate = /\\\\b(?:a|an|the|and|or|with|without|in|on|at|to|of|for|from|into|toward|beside|next|both|each|this|that|these|those|it|its|their|them|you|your|one|two|hold|show|place|frame|shot|camera|locked|static|wide|medium|close|up|macro|overhead|handheld|tripod|pov)\\\\b/gi;
  return overlap(plan.replace(boilerplate, " "), action.replace(boilerplate, " "));
}

function hookDeliveryExecuted(step: Step | undefined, delivery: string): boolean {
  if (!step) return false;
  const opening = `${step.action}
  if (delivery === "visual_action") return Boolean(step.action && PHYSICAL_ACTION.test(step.action));
  if (["spoken", "dialogue"].includes(delivery)) return Boolean(step.spokenLine);
  if (delivery === "on_screen_text") return Boolean(step.onScreenText);
  if (delivery === "sound") return SOUND_EXECUTION.test(opening);
  if (delivery === "prop") return PHYSICAL_ACTION.test(step.action) && hasConcreteDetail(step.action);
  if (delivery === "environment") return ENVIRONMENT_EXECUTION.test(opening);
  if (delivery === "edit_transition") return EDIT_TRANSITION_EXECUTION.test(step.editNote);
  return false;
}

function proofDeviceExecuted(steps: Step[], proofDeviceId: string): boolean {
  const execution = steps.map((step) => affirmativeSentences(`${step.action}
  const visible = steps.some(visibleProof);
  const patterns: Record<string, RegExp> = {
    controlled_side_by_side: /\\\\b(compare|both|side by side|split screen|versus|vs\\\\.)\\\\b/i,
    live_demonstration: /\\\\b(apply|demonstrate|test|show|make|assemble|perform|use)\\\\b/i,
    measured_readout: /\\\\b(measure|timer|readout|scale|number|receipt|count|temperature)\\\\b/i,
    process_result: /\\\\b(process|finish(?:ed)?|result|after|reveal|show)\\\\b/i,
    visible_consequence: /\\\\b(consequence|reaction|response|result|change|effect)\\\\b/i,
    reversal_callback: /\\\\b(reverse|reversal|turn(?:ed)?|flip|callback|instead)\\\\b/i,
    source_receipt: /\\\\b(source|receipt|document|citation|record|reference)\\\\b/i,
    route_map: /\\\\b(route|map|itinerary|direction|stop|station)\\\\b/i,
    sensory_result: /\\\\b(taste|texture|smell|sound|crisp|sizzle|feel)\\\\b/i,
    form_reference: /\\\\b(form|posture|alignment|range|rep(?:s)?|mobility)\\\\b/i,
    decision_matrix: /\\\\b(matrix|criteria|checklist|compare|tradeoff|decision)\\\\b/i,
    before_after_state: /\\\\b(before|after|state|difference|change)\\\\b/i,
  };
  return visible && Boolean(patterns[proofDeviceId]?.test(execution));
}

function payoffTypeExecuted(step: Step | undefined, payoffTypeId: string): boolean {
  if (!step || !visiblyCompletesPayoff(step)) return false;
  const execution = affirmativeSentences(`${step.action}
  const patterns: Record<string, RegExp> = {
    visible_result: /\\\\b(result|finish(?:ed)?|show|reveal|display|difference)\\\\b/i,
    side_by_side_decision: /\\\\b(side by side|both|compare|choice|choose|smoother|better|decision)\\\\b/i,
    reversal_callback: /\\\\b(reverse|reversal|turn(?:ed)?|flip|instead)\\\\b/i,
    before_after_state: /\\\\b(before|after|state|difference|change)\\\\b/i,
    answer_reveal: /\\\\b(answer|reveal|resolve|correct)\\\\b/i,
    usable_artifact: /\\\\b(checklist|template|plan|matrix|list|artifact|decision)\\\\b/i,
    sensory_finish: /\\\\b(taste|texture|smell|sound|finish|feel)\\\\b/i,
    mistake_correction: /\\\\b(correct|fix|replace|mistake|instead)\\\\b/i,
    identity_resolution: /\\\\b(choose|decision|fit|style|identity|preference)\\\\b/i,
    open_loop_close: /\\\\b(answer|resolve|reveal|close|result)\\\\b/i,
  };
  return Boolean(patterns[payoffTypeId]?.test(execution));
}

function highConfidenceSafetyCodes(value: string): string[] {
  const codes: string[] = [];
  const childCapture = /\\\\b(record|film|capture|show|display|reveal|share|publish|post)\\\\b/i.test(value)
    && /\\\\b(child|kid|toddler|minor|student)\\\\b/i.test(value);
  const privateChildDetail = /\\\\b(full face|name|school|location|address|bedroom|medical|health record|private message)\\\\b/i.test(value);
  const childSafeguard = /\\\\b(parent(?:al)?|guardian) (?:permission|consent)\\\\b|\\\\b(blur|redact|fictional)\\\\b/i.test(value);
  if (childCapture && privateChildDetail && !childSafeguard) codes.push("hard_child_privacy");
  if (/\\\\b(child|kid|toddler|minor)\\\\b/i.test(value) && /\\\\b(distress|crying|meltdown|tantrum|humiliate|shame|scare)\\\\b/i.test(value)) codes.push("hard_child_distress");
  if (/\\\\b(blindfold(?:ed)?|without (?:a )?spotter|hold (?:your )?breath|choke|strangle|set .{0,30} on fire|drive (?:as )?fast|jump from|dangerous challenge|eat (?:a )?(?:nonfood|detergent)|ingest (?:detergent|cleaner))\\\\b/i.test(value)) {
    codes.push("dangerous_physical_direction");
  }
  return codes;
}

function hookDeliveryExecuted(step: Step | undefined, delivery: string): boolean {
  if (!step) return false;
  const opening = `${step.action}
  if (delivery === "visual_action") return Boolean(step.action && PHYSICAL_ACTION.test(step.action));
  if (["spoken", "dialogue"].includes(delivery)) return Boolean(step.spokenLine);
  if (delivery === "on_screen_text") return Boolean(step.onScreenText);
  if (delivery === "sound") return SOUND_EXECUTION.test(opening);
  if (delivery === "prop") return PHYSICAL_ACTION.test(step.action) && hasConcreteDetail(step.action);
  if (delivery === "environment") return ENVIRONMENT_EXECUTION.test(opening);
  if (delivery === "edit_transition") return EDIT_TRANSITION_EXECUTION.test(step.editNote);
  return false;
}

function proofDeviceExecuted(steps: Step[], proofDeviceId: string): boolean {
  const execution = steps.map((step) => affirmativeSentences(`${step.action}
  const visible = steps.some(visibleProof);
  const patterns: Record<string, RegExp> = {
    controlled_side_by_side: /\\\\b(compare|both|side by side|split screen|versus|vs\\\\.)\\\\b/i,
    live_demonstration: /\\\\b(apply|demonstrate|test|show|make|assemble|perform|use)\\\\b/i,
    measured_readout: /\\\\b(measure|timer|readout|scale|number|receipt|count|temperature)\\\\b/i,
    process_result: /\\\\b(process|finish(?:ed)?|result|after|reveal|show)\\\\b/i,
    visible_consequence: /\\\\b(consequence|reaction|response|result|change|effect)\\\\b/i,
    reversal_callback: /\\\\b(reverse|reversal|turn(?:ed)?|flip|callback|instead)\\\\b/i,
    source_receipt: /\\\\b(source|receipt|document|citation|record|reference)\\\\b/i,
    route_map: /\\\\b(route|map|itinerary|direction|stop|station)\\\\b/i,
    sensory_result: /\\\\b(taste|texture|smell|sound|crisp|sizzle|feel)\\\\b/i,
    form_reference: /\\\\b(form|posture|alignment|range|rep(?:s)?|mobility)\\\\b/i,
    decision_matrix: /\\\\b(matrix|criteria|checklist|compare|tradeoff|decision)\\\\b/i,
    before_after_state: /\\\\b(before|after|state|difference|change)\\\\b/i,
  };
  return visible && Boolean(patterns[proofDeviceId]?.test(execution));
}

function payoffTypeExecuted(step: Step | undefined, payoffTypeId: string): boolean {
  if (!step || !visiblyCompletesPayoff(step)) return false;
  const execution = affirmativeSentences(`${step.action}
  const patterns: Record<string, RegExp> = {
    visible_result: /\\\\b(result|finish(?:ed)?|show|reveal|display|difference)\\\\b/i,
    side_by_side_decision: /\\\\b(side by side|both|compare|choice|choose|smoother|better|decision)\\\\b/i,
    reversal_callback: /\\\\b(reverse|reversal|turn(?:ed)?|flip|instead)\\\\b/i,
    before_after_state: /\\\\b(before|after|state|difference|change)\\\\b/i,
    answer_reveal: /\\\\b(answer|reveal|resolve|correct)\\\\b/i,
    usable_artifact: /\\\\b(checklist|template|plan|matrix|list|artifact|decision)\\\\b/i,
    sensory_finish: /\\\\b(taste|texture|smell|sound|finish|feel)\\\\b/i,
    mistake_correction: /\\\\b(correct|fix|replace|mistake|instead)\\\\b/i,
    identity_resolution: /\\\\b(choose|decision|fit|style|identity|preference)\\\\b/i,
    open_loop_close: /\\\\b(answer|resolve|reveal|close|result)\\\\b/i,
  };
  return Boolean(patterns[payoffTypeId]?.test(execution));
}

function highConfidenceSafetyCodes(value: string): string[] {
  const codes: string[] = [];
  const childCapture = /\\\\b(record|film|capture|show|display|reveal|share|publish|post)\\\\b/i.test(value)
    && /\\\\b(child|kid|toddler|minor|student)\\\\b/i.test(value);
  const privateChildDetail = /\\\\b(full face|name|school|location|address|bedroom|medical|health record|private message)\\\\b/i.test(value);
  const childSafeguard = /\\\\b(parent(?:al)?|guardian) (?:permission|consent)\\\\b|\\\\b(blur|redact|fictional)\\\\b/i.test(value);
  if (childCapture && privateChildDetail && !childSafeguard) codes.push("hard_child_privacy");
  if (/\\\\b(child|kid|toddler|minor)\\\\b/i.test(value) && /\\\\b(distress|crying|meltdown|tantrum|humiliate|shame|scare)\\\\b/i.test(value)) codes.push("hard_child_distress");
  if (/\\\\b(blindfold(?:ed)?|without (?:a )?spotter|hold (?:your )?breath|choke|strangle|set .{0,30} on fire|drive (?:as )?fast|jump from|dangerous challenge|eat (?:a )?(?:nonfood|detergent)|ingest (?:detergent|cleaner))\\\\b/i.test(value)) {
    codes.push("dangerous_physical_direction");
  }
  return codes;
}

function minimumActionSeconds(value: string): number {
  const words: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, ten: 10, fifteen: 15, twenty: 20, thirty: 30, sixty: 60 };
  const matches = [...value.matchAll(/\\\\b(\\\\d+(?:\\\\.\\\\d+)?|one|two|three|four|five|ten|fifteen|twenty|thirty|sixty)\\\\s*(seconds?|minutes?)\\\\b/gi)];
  if (/time.?lapse|jump cut|cut ahead|speed.?up|pre.?recorded/i.test(value)) return 0;
  return Math.max(0, ...matches.map((match) => (words[match[1].toLowerCase()] ?? Number(match[1])) * (/minute/i.test(match[2]) ? 60 : 1)));
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function durationProfile(duration: number): "quick" | "single" | "story" | "deep" | null {
  if (duration >= 12 && duration <= 18) return "quick";
  if (duration >= 19 && duration <= 27) return "single";
  if (duration >= 28 && duration <= 39) return "story";
  if (duration >= 40 && duration <= 60) return "deep";
  return null;
}

function expectedStepRange(duration: number): { min: number; max: number } | null {
  const profile = durationProfile(duration);
  if (profile === "quick") return { min: 3, max: 4 };
  if (profile === "single") return { min: 4, max: 5 };
  if (profile === "story") return { min: 5, max: 6 };
  if (profile === "deep") return { min: 6, max: 8 };
  return null;
}

function wordCount(value: string): number {
  return value.split(/\\\\s+/).filter(Boolean).length;
}

function visibleProof(step: Step): boolean {
  const action = affirmativeSentences(step.action);
  if (/\\\\b(without (?:testing|showing)|unopened|sealed|guess|might|later|tomorrow|soon|never show)\\\\b/i.test(action)) return false;
  // A prop (sample, timer, receipt) or promise of a test is not a performed test.
  const performedTest = /\\\\b(compare|measure|test|demonstrate)\\\\b/i.test(action)
    && !/\\\\b(?:promise|tease|announce|plan|prepare|pretend|describe|say|talk about)\\\\b/i.test(action);
  const visibleResult = /\\\\b(?:show|reveal|capture|frame)\\\\b/i.test(action)
    && /\\\\b(?:results?|finish(?:es)?|textures?|readout|receipt|cross.section|inside|difference|reversal|reaction|before.and.after|side by side|split screen)\\\\b/i.test(action);
  return PHYSICAL_ACTION.test(action) && (performedTest || visibleResult);
}

function visiblyCompletesPayoff(step: Step): boolean {
  const action = affirmativeSentences(step.action);
  if (/\\\\b(without (?:showing|revealing|comparing)|(?:promise|tease|withhold|hide) (?:the |a )?(?:result|answer|finish|comparison)|(?:result|answer|comparison) (?:later|tomorrow|soon))\\\\b/i.test(action)) return false;
  return /\\\\b(show|reveal|compare|finish|choose|resolve|correct|complete|taste|display)\\\\b/i.test(action)
    || (/\\\\b(hold|point)\\\\b/i.test(action) && /\\\\b(finish(?:ed)?|result|completed|comparison|answer|artifact|checklist|decision|texture|side by side)\\\\b/i.test(action));
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

function feedbackAdjustmentWithinCraftCapacity(dimensions: CraftDimensions, requested: number): number {
  const bounded = clamp(Number.isFinite(requested) ? requested : 0, -5, 5);
  if (bounded >= 0) {
    const available = (15 - dimensions.filmability) + (10 - dimensions.naturalLanguage);
    return round(Math.min(bounded, available));
  }
  const removable = dimensions.filmability + dimensions.naturalLanguage;
  return round(Math.max(bounded, -removable));
}

function feedbackAdjustmentWithinCraftCapacity(dimensions: CraftDimensions, requested: number): number {
  const bounded = clamp(Number.isFinite(requested) ? requested : 0, -5, 5);
  if (bounded >= 0) {
    const available = (15 - dimensions.filmability) + (10 - dimensions.naturalLanguage);
    return round(Math.min(bounded, available));
  }
  const removable = dimensions.filmability + dimensions.naturalLanguage;
  return round(Math.max(bounded, -removable));
}

function normalizeStep(value: unknown, index: number): Step {
  const row = record(value);
  const timing = record(row.timing);
  const start = number(row.start ?? row.startSecond ?? row.startSeconds ?? timing.start, index * 4);
  const end = number(row.end ?? row.endSecond ?? row.endSeconds ?? timing.end, start + 4);
  return {
    start,
    end,
    stage: text(row.stage),
    purpose: text(row.purpose ?? row.stage),
    goal: text(row.goal),
    action: text(row.action ?? row.visual_action ?? row.direction),
    spokenLine: text(row.spokenLine ?? row.spoken_line ?? row.dialogue ?? row.voiceover),
    shot: text(row.shot ?? row.shot_type ?? row.camera),
    onScreenText: text(row.onScreenText ?? row.on_screen_text ?? row.overlay),
    editNote: text(row.editNote ?? row.edit_note),
    performanceNote: text(row.performanceNote ?? row.performance_note),
  };
}

function normalizeCard(input: unknown): NormalizedCard {
  const card = record(input);
  const scenes = Array.isArray(card.steps)
    ? [...card.steps].sort((a, b) => number(record(a).order) - number(record(b).order))
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
  const aliases: Record<string, string> = {
    formula: "formula",
    formulate: "formula",
    formulation: "formula",
    formulations: "formula",
    formulated: "formula",
  };
  return new Set((value.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).map((token) => aliases[token] ?? token));
}

function overlap(left: string, right: string): number {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  // One shared noun such as “mirror” can be incidental. The first-frame plan
  // must establish at least two planned visual details in the actual action.
  return hits < 2 ? 0 : hits / Math.min(a.size, b.size);
}

function uniqueRatio(values: string[]): number {
  if (!values.length) return 0;
  return new Set(values.map((value) => value.toLowerCase().replace(/\\\\s+/g, " "))).size / values.length;
}

function hasConcreteDetail(value: string): boolean {
  return /\\\\b\\\\d+(?:\\\\.\\\\d+)?\\\\b/.test(value) || /\\\\b(mirror|counter|kitchen|studio|street|hotel|trail|gym|pan|bowl|brush|shoe|plate|window|door|bench|table|phone|camera|product|ingredient|boat|yacht|deck|room|restaurant|oven|glass|towel|mat|dumbbell|bottle|bag|screen|sample|swatch)\\\\b/i.test(value);
}

export function evaluateIdeaCardV22(input: unknown, options: QualityV22Options = {}): QualityV22Result {
  const card = normalizeCard(input);
  const hardGateCodes: string[] = [];
  const issueCodes: string[] = [];
  const humanReviewReasons: string[] = [];
  const fingerprintScore = options.fingerprintScore ?? null;
  const semanticScore = options.semanticScore ?? null;
  const recipe = options.creativeRecipe ? creativeRecipeSchema.safeParse(options.creativeRecipe) : null;
  const concept = record(options.concept);

  hardGateCodes.push(...(options.additionalHardGateCodes ?? []));
  issueCodes.push(...(options.additionalIssueCodes ?? []));

  if (!ideaCardSchema.safeParse(input).success) hardGateCodes.push("schema_invalid");
  if ([fingerprintScore, semanticScore].some((score) => score !== null && (!Number.isFinite(score) || score < 0 || score > 1))) hardGateCodes.push("invalid_quality_evidence");

  if (!card.title || !card.concept || !card.takeaway || card.steps.length < 3) hardGateCodes.push("schema_incomplete");
  if (!card.requiredItems.length) hardGateCodes.push("required_items_missing");
  if (!timelineIsContinuous(card)) hardGateCodes.push("timeline_invalid");
  if (BANNED_RESIDUE.test(JSON.stringify(options.rawInput ?? input))) hardGateCodes.push("creator_facing_residue");
  if (GENERIC_CTA.test(card.rawText)) hardGateCodes.push("generic_cta");
  if (fingerprintScore !== null && fingerprintScore >= 0.92) hardGateCodes.push("fingerprint_duplicate");
  if (semanticScore !== null && semanticScore >= 0.86) hardGateCodes.push("semantic_duplicate");
  if (semanticScore !== null && semanticScore >= 0.78 && semanticScore < 0.86) issueCodes.push("semantic_similarity_refine");
  if (options.requireOriginalityEvidence && semanticScore === null) issueCodes.push("originality_unverified");
  if (options.requireOriginalityEvidence && (!options.embeddingModel || !options.embeddingModelVersion)) issueCodes.push("embedding_identity_unverified");
  if (options.creativeRecipe && !recipe?.success) {
    const compatibilityCodes = recipe?.error.issues.map((issue) => issue.message).filter((message) => message.startsWith("recipe_")) ?? [];
    hardGateCodes.push(...(compatibilityCodes.length ? compatibilityCodes : ["unknown_taxonomy_id"]));
  }
  if (recipe?.success) {
    const lane = parsePurchaseLane(card.category);
    if (!lane) hardGateCodes.push("recipe_lane_unknown");
    else hardGateCodes.push(...validateRecipeCompatibility(recipe.data, lane));
    if (!recipeMatchesConcept(recipe.data, { ...concept, recipe: concept.recipe })) hardGateCodes.push("recipe_concept_mismatch");
    if (card.hookId !== recipe.data.hookTypeId || card.shootFormat !== recipe.data.shootFormat || record(input).presenceMode !== recipe.data.presenceMode) hardGateCodes.push("recipe_card_mismatch");
    const hookStatus = hookAutomationStatus(recipe.data.hookTypeId, options.recipeEvidence);
    if (hookStatus === "unknown") hardGateCodes.push("unknown_hook_taxonomy_id");
    if (hookStatus === "blocked") hardGateCodes.push("automatic_hook_blocked");
    if (hookStatus === "evidence_required") hardGateCodes.push("hook_evidence_missing");
  } else if (!card.hookId || hookAutomationStatus(card.hookId) === "unknown") {
    hardGateCodes.push("unknown_hook_taxonomy_id");
  }

  const actionCount = card.steps.filter((step) => PHYSICAL_ACTION.test(step.action)).length;
  const shotCount = card.steps.filter((step) => CAMERA_LANGUAGE.test(step.shot)).length;
  const proofCount = card.steps.filter(visibleProof).length;
  const spoken = card.steps.map((step) => step.spokenLine).filter(Boolean);
  const spokenWordCounts = spoken.map((line) => line.split(/\\\\s+/).filter(Boolean).length);
  const spokenRates = card.steps
    .filter((step) => step.spokenLine)
    .map((step) => wordCount(step.spokenLine) / Math.max(1, step.end - step.start));
  const stepRange = expectedStepRange(card.duration);
  const firstStepDuration = card.steps.length ? card.steps[0].end - card.steps[0].start : 0;
  const firstProofIndex = card.steps.findIndex(visibleProof);

  let filmability = 15;
  if (actionCount < card.steps.length) { filmability -= 5; issueCodes.push("weak_physical_actions"); }
  if (shotCount < card.steps.length) { filmability -= 4; issueCodes.push("underspecified_shots"); }
  if (card.steps.some((step) => minimumActionSeconds(step.action, step.editNote) > step.end - step.start)) hardGateCodes.push("physical_action_exceeds_runtime");
  if (!timelineIsContinuous(card)) filmability -= 6;
  if (spokenRates.some((rate) => rate > 3.2)) {
    filmability -= 5;
    hardGateCodes.push("spoken_delivery_unfilmable");
  } else if (spokenRates.some((rate) => rate > 2.7)) {
    filmability -= 3;
    issueCodes.push("spoken_delivery_rushed");
  }
  if (stepRange && (card.steps.length < stepRange.min || card.steps.length > stepRange.max)) {
    filmability -= 3;
    issueCodes.push("duration_step_density_mismatch");
  }

  let hookExecution = 15;
  const firstStep = card.steps[0];
  if (!card.hookId) { hookExecution -= 5; hardGateCodes.push("missing_hook_taxonomy"); }
  if (!firstStep?.action || !firstStep?.shot) { hookExecution -= 7; hardGateCodes.push("first_frame_not_executable"); }
  if (firstStepDuration > Math.max(5, card.duration * 0.2)) {
    hookExecution -= 5;
    issueCodes.push("hook_too_slow_for_runtime");
  }
  const firstFramePlan = text(concept.firstFramePlan);
  if (firstFramePlan && firstStep && visualContentOverlap(firstFramePlan, firstStep.action) < 0.04) {
    hookExecution -= 5;
    hardGateCodes.push("first_frame_plan_mismatch");
  }
  if (recipe?.success && firstStep && (
    (["spoken", "dialogue"].includes(recipe.data.hookDeliveryId) && !firstStep.spokenLine)
    || (recipe.data.hookDeliveryId === "on_screen_text" && !firstStep.onScreenText)
  )) {
    hookExecution -= 5;
    hardGateCodes.push("hook_delivery_missing");
  }

  let proofPayoffIntegrity = 15;
  if (!proofCount) { proofPayoffIntegrity -= 8; hardGateCodes.push("missing_proof_beat"); }
  if (recipe?.success && !proofDeviceExecuted(card.steps, recipe.data.proofDeviceId)) {
    proofPayoffIntegrity -= 6;
    hardGateCodes.push("recipe_proof_not_executed");
  }
  if (recipe?.success && !proofDeviceExecuted(card.steps, recipe.data.proofDeviceId)) {
    proofPayoffIntegrity -= 6;
    hardGateCodes.push("recipe_proof_not_executed");
  }
  if (firstProofIndex >= 0 && card.steps[firstProofIndex].start >= card.duration * 0.75) {
    proofPayoffIntegrity -= 6;
    hardGateCodes.push("proof_arrives_after_payoff_window");
  }
  if (overlap(`${card.title} ${card.concept}`, `${card.takeaway} ${card.steps.at(-1)?.goal ?? ""}`) < 0.08) {
    proofPayoffIntegrity -= 7;
    hardGateCodes.push("hook_payoff_mismatch");
  }
  const finalStep = card.steps.filter((step) => step.stage !== "cta").at(-1);
  if (!finalStep || !visiblyCompletesPayoff(finalStep)) {
    proofPayoffIntegrity -= 6;
    hardGateCodes.push("payoff_not_visibly_completed");
  }

  let laneSpecificity = 12;
  const laneText = `${card.category} ${card.persona} ${card.title} ${card.concept} ${card.steps.map((step) => step.action).join(" ")}`;
  if (!card.category) { laneSpecificity -= 5; issueCodes.push("missing_category"); }
  if (!card.persona) { laneSpecificity -= 3; issueCodes.push("missing_persona"); }
  if (!hasConcreteDetail(laneText)) { laneSpecificity -= 5; issueCodes.push("generic_lane_execution"); }
  const laneTerms = LANE_TERMS[card.category];
  if (laneTerms && !laneTerms.test(`${card.title} ${card.concept} ${card.takeaway} ${card.steps.map((step) => step.action).join(" ")}`)) {
    laneSpecificity -= 8; issueCodes.push("category_content_mismatch");
  }

  let emotionVibeCoherence = 10;
  if (recipe?.success) {
    const emotionPlan = record(concept.emotionBeatPlan);
    if (!text(emotionPlan.opening) || !text(emotionPlan.middle) || !text(emotionPlan.payoff)) {
      emotionVibeCoherence -= 5;
      hardGateCodes.push("emotion_beat_plan_missing");
    }
    const executionDirection = card.steps.map((step) => `${step.performanceNote} ${step.editNote}`).join(" ");
    const soundPlan = text(concept.soundPlan);
    if (!soundPlan || !executionDirection.trim()) {
      emotionVibeCoherence -= 4;
      issueCodes.push("vibe_execution_underspecified");
    }
    const audioDirection = affirmativeSentences([soundPlan, ...card.notes, ...card.steps.flatMap((step) => [step.action, step.shot, step.editNote, step.performanceNote])].join("
    if (LICENSE_SENSITIVE_SOUND.test(audioDirection) && options.recipeEvidence?.audioLicense !== true) {
      hardGateCodes.push("audio_license_unverified");
    }
  } else {
    emotionVibeCoherence -= 3;
    issueCodes.push("creative_recipe_unscored");
  }

  let naturalLanguage = 10;
  if (/talking|interview|dialogue|voiceover/i.test(card.shootFormat) && spoken.length < 2) {
    naturalLanguage -= 5;
    issueCodes.push("missing_spoken_delivery");
  }
  if (META_LANGUAGE.test(spoken.join(" "))) { naturalLanguage -= 7; hardGateCodes.push("meta_dialogue"); }
  if (spoken.length && spokenWordCounts.some((count) => count > 22)) { naturalLanguage -= 3; issueCodes.push("dialogue_too_long"); }
  if (spoken.length && !spoken.some((line) => SECOND_PERSON.test(line))) { naturalLanguage -= 2; issueCodes.push("stilted_dialogue"); }
  if (spoken.length > 1 && uniqueRatio(spoken) < 0.75) { naturalLanguage -= 10; issueCodes.push("repeated_dialogue"); }

  let originality = 10;
  const comparisonScore = Math.max(fingerprintScore ?? 0, semanticScore ?? 0);
  originality -= comparisonScore * 10;
  if (uniqueRatio(card.steps.map((step) => step.action)) < 0.8) { originality -= 3; issueCodes.push("repeated_action_pattern"); }

  let safetyAndEvidence = 8;
  const explicitSafetyFlags = [...(options.safetyFlags ?? []), ...privacySafetyFlags(input)];
  const claims = affirmativeSentences([card.title, card.concept, card.takeaway, card.why, ...card.requiredItems, ...card.steps.flatMap((step) => [step.purpose, step.goal, step.action, step.shot, step.spokenLine, step.onScreenText, step.editNote, step.performanceNote]), ...card.notes].join("
  if (GUARANTEE_LANGUAGE.test(claims) || /\\\\b(heals?|reverses?|prevents?|clinically proven|burns? fat)\\\\b/i.test(claims)) { safetyAndEvidence -= 8; hardGateCodes.push("unsafe_or_unbounded_claim"); }
  hardGateCodes.push(...explicitSafetyFlags.filter((flag) => flag.startsWith("hard_") || flag.includes("review") || flag === "missing_sponsor_disclosure" || flag === "missing_claim_boundary" || flag === "missing_claim_evidence"));
  if (needsSponsorDisclosure(input) && !hasEarlySponsorDisclosure(input)) {
    safetyAndEvidence -= 5;
    hardGateCodes.push("sponsor_disclosure_missing");
  }
  if (/\\\\b(shame|humiliate|panic|rage bait|make them angry|terrify|body anxiety|medical fear|fake scarcity|only \\\\d+ left|child distress)\\\\b/i.test(claims)) {
    safetyAndEvidence -= 8;
    hardGateCodes.push("manipulative_emotion_or_harm");
  }
  const highConfidenceSafety = highConfidenceSafetyCodes(claims);
  if (highConfidenceSafety.length) {
    safetyAndEvidence -= 8;
    hardGateCodes.push(...highConfidenceSafety);
  }
  const highConfidenceSafety = highConfidenceSafetyCodes(claims);
  if (highConfidenceSafety.length) {
    safetyAndEvidence -= 8;
    hardGateCodes.push(...highConfidenceSafety);
  }

  let productionPracticality = 5;
  const productionDirection = card.notes.join(" ");
  // These are V3 Instagram production gates. Legacy schema-v2 cards are still
  // readable, but they cannot satisfy a V3 recipe-qualified publication run.
  if (recipe?.success) {
    if (!VERTICAL_FRAME_DIRECTION.test(productionDirection)) {
      productionPracticality -= 2;
      hardGateCodes.push("instagram_vertical_format_missing");
    }
    if (!SAFE_ZONE_DIRECTION.test(productionDirection)) {
      productionPracticality -= 2;
      hardGateCodes.push("instagram_safe_zone_missing");
    }
    if (THIRD_PARTY_MEDIA_DIRECTION.test(`${card.rawText} ${text(concept.soundPlan)}`)) {
      productionPracticality -= 3;
      hardGateCodes.push("unoriginal_third_party_media_direction");
    }
  }
  if (card.requiredItems.length > 8) { productionPracticality -= 2; issueCodes.push("too_many_props"); }
  if (card.duration < 10 || card.duration > 60) { productionPracticality -= 2; issueCodes.push("duration_impractical"); }
  if (card.steps.some((step) => step.end - step.start > card.duration * 0.45 && !/demonstrat/i.test(step.purpose))) {
    productionPracticality -= 1;
    issueCodes.push("runtime_padding_risk");
  }
  if (!card.notes.length) { productionPracticality -= 1; issueCodes.push("missing_production_notes"); }

  const dimensions: CraftDimensions = {
    filmability: round(clamp(filmability, 0, 15)),
    hookExecution: round(clamp(hookExecution, 0, 15)),
    proofPayoffIntegrity: round(clamp(proofPayoffIntegrity, 0, 15)),
    laneSpecificity: round(clamp(laneSpecificity, 0, 12)),
    emotionVibeCoherence: round(clamp(emotionVibeCoherence, 0, 10)),
    naturalLanguage: round(clamp(naturalLanguage, 0, 10)),
    originality: round(clamp(originality, 0, 10)),
    safetyAndEvidence: round(clamp(safetyAndEvidence, 0, 8)),
    productionPracticality: round(clamp(productionPracticality, 0, 5)),
  };
  const craftScore = round(Object.values(dimensions).reduce((sum, score) => sum + score, 0));
  // Creator feedback calibrates only the two observable execution dimensions.
  // It cannot manufacture points once filmability and natural language are full.
  const feedbackAdjustment = feedbackAdjustmentWithinCraftCapacity(dimensions, options.feedbackAdjustment ?? 0);
  const adjustedScore = round(clamp(craftScore + feedbackAdjustment));
  const uniqueHardGates = [...new Set(hardGateCodes)];
  const uniqueReviews = [...new Set(humanReviewReasons)];

  let decision: QualityDecision;
  if (uniqueHardGates.length || adjustedScore < 80) decision = "reject";
  else if (uniqueReviews.length || issueCodes.length) decision = "refine";
  else if (adjustedScore >= 90) decision = "approve";
  else if (adjustedScore >= 80) decision = "refine";
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
    feedbackAdjustment,
  };
}