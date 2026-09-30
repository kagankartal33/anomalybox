import { z } from "zod";
import { ALL_HOOKS } from "../algorithmic-reason/taxonomy";
import {
  CREATOR_MODES,
  CREATOR_PERSONAS,
  PURCHASE_LANES,
} from "../algorithmic-reason/compatibility";
import type {
  CreatorMode,
  CreatorPersona,
  HookCategory,
  PurchaseLane,
} from "../algorithmic-reason/types";

export const CREATIVE_TAXONOMY_VERSION = "creative-taxonomy-v1" as const;

export const CONTENT_GENRE_IDS = [
  "controlled_comparison",
  "demonstration_tutorial",
  "experiment_test",
  "before_after_process",
  "decision_guide",
  "myth_reframe",
  "micro_story",
  "confession_lesson",
  "pov_scenario",
  "sketch_reversal",
  "mini_vlog",
  "sensory_process",
  "ranked_selection",
  "interview_exchange",
] as const;

export const HOOK_DELIVERY_IDS = [
  "visual_action",
  "spoken",
  "on_screen_text",
  "sound",
  "dialogue",
  "prop",
  "environment",
  "edit_transition",
] as const;

export const PROMISE_TYPE_IDS = [
  "show_result",
  "answer_question",
  "resolve_problem",
  "compare_choices",
  "complete_test",
  "reverse_expectation",
  "teach_decision",
  "finish_story",
] as const;

export const EMOTION_ARC_IDS = [
  "curiosity_to_clarity",
  "tension_to_relief",
  "recognition_to_amusement",
  "frustration_to_control",
  "uncertainty_to_confidence",
  "anticipation_to_reveal",
  "desire_to_satisfaction",
  "skepticism_to_trust",
  "empathy_to_hope",
  "surprise_to_understanding",
  "calm_to_inspiration",
  "wonder_to_reflection",
] as const;

export const VIBE_PRESET_IDS = [
  "clean_editorial",
  "quiet_luxury",
  "warm_confessional",
  "dry_deadpan",
  "playful_chaos",
  "tactile_asmr",
  "cinematic_wonder",
  "documentary_observational",
  "raw_bts",
  "bright_utility",
  "precise_neutral",
  "cozy_domestic",
  "high_energy_challenge",
  "minimal_suspense",
  "street_spontaneous",
  "calm_expert",
] as const;

export const PROOF_DEVICE_IDS = [
  "controlled_side_by_side",
  "live_demonstration",
  "measured_readout",
  "process_result",
  "visible_consequence",
  "reversal_callback",
  "source_receipt",
  "route_map",
  "sensory_result",
  "form_reference",
  "decision_matrix",
  "before_after_state",
] as const;

export const PAYOFF_TYPE_IDS = [
  "visible_result",
  "side_by_side_decision",
  "reversal_callback",
  "before_after_state",
  "answer_reveal",
  "usable_artifact",
  "sensory_finish",
  "mistake_correction",
  "identity_resolution",
  "open_loop_close",
] as const;

export const AUDIENCE_ACTION_IDS = [
  "none",
  "save_reference",
  "share_recognition",
  "comment_choice",
  "try_step",
  "profile_context",
  "disclosed_commercial_action",
] as const;

export const ADDITIONAL_HOOKS = [
  {
    id: "result_then_rewind",
    category: "timing_structural",
    audienceResponseHypothesis: "A visible result creates a bounded question that the following process can answer.",
    compatibleLanes: [...PURCHASE_LANES],
    compatibleModes: ["voiceover", "hands_only", "pov", "object_led"],
    compatiblePersonas: [...CREATOR_PERSONAS],
  },
  {
    id: "frame_expansion_reveal",
    category: "visual_kinesthetic",
    audienceResponseHypothesis: "Expanding a tight frame can reveal necessary context without inventing a surprise.",
    compatibleLanes: ["beauty", "fashion", "food", "lifestyle", "luxury", "travel"],
    compatibleModes: ["voiceover", "pov", "object_led"],
    compatiblePersonas: ["editorial_insider", "high_status_minimalist", "faceless_curator"],
  },
  {
    id: "sound_before_source",
    category: "auditory_vibe",
    audienceResponseHypothesis: "A real sound heard before its source is shown can create a fair sensory question.",
    compatibleLanes: ["beauty", "fashion", "entertainment_comedy", "food", "lifestyle", "luxury", "travel"],
    compatibleModes: ["voiceover", "hands_only", "pov", "object_led"],
    compatiblePersonas: ["editorial_insider", "relatable_confidant", "high_status_minimalist", "faceless_curator"],
  },
  {
    id: "visible_constraint",
    category: "curiosity_open_loop",
    audienceResponseHypothesis: "Showing the real constraint before the solution gives the demonstration a concrete question.",
    compatibleLanes: [...PURCHASE_LANES],
    compatibleModes: [...CREATOR_MODES],
    compatiblePersonas: [...CREATOR_PERSONAS],
  },
] as const satisfies readonly {
  id: string;
  category: HookCategory;
  audienceResponseHypothesis: string;
  compatibleLanes: readonly PurchaseLane[];
  compatibleModes: readonly CreatorMode[];
  compatiblePersonas: readonly CreatorPersona[];
}[];

export const HOOK_TYPE_IDS = [
  ...ALL_HOOKS.map((hook) => hook.id),
  ...ADDITIONAL_HOOKS.map((hook) => hook.id),
] as [string, ...string[]];

export const EVIDENCE_REQUIRED_HOOK_IDS = [
  "statistic_shock",
  "quotation_anchor",
  "specific_number_confession",
  "expensive_lesson",
  "forbidden_knowledge",
  "gatekept_filter",
  "audio_trend_hijack",
] as const;

export const AUTOMATICALLY_BLOCKED_HOOK_IDS = ["polarizing_dichotomy"] as const;

export type ContentGenreId = (typeof CONTENT_GENRE_IDS)[number];
export type HookDeliveryId = (typeof HOOK_DELIVERY_IDS)[number];
export type PromiseTypeId = (typeof PROMISE_TYPE_IDS)[number];
export type EmotionArcId = (typeof EMOTION_ARC_IDS)[number];
export type VibePresetId = (typeof VIBE_PRESET_IDS)[number];
export type ProofDeviceId = (typeof PROOF_DEVICE_IDS)[number];
export type PayoffTypeId = (typeof PAYOFF_TYPE_IDS)[number];
export type AudienceActionId = (typeof AUDIENCE_ACTION_IDS)[number];

const hookTypeIdSchema = z.string().refine((value) => HOOK_TYPE_IDS.includes(value), "unknown_hook_type");

export const creativeRecipeSchema = z.object({
  taxonomyVersion: z.literal(CREATIVE_TAXONOMY_VERSION),
  genreId: z.enum(CONTENT_GENRE_IDS),
  hookTypeId: hookTypeIdSchema,
  hookDeliveryId: z.enum(HOOK_DELIVERY_IDS),
  promiseTypeId: z.enum(PROMISE_TYPE_IDS),
  emotionArcId: z.enum(EMOTION_ARC_IDS),
  vibePresetId: z.enum(VIBE_PRESET_IDS),
  proofDeviceId: z.enum(PROOF_DEVICE_IDS),
  payoffTypeId: z.enum(PAYOFF_TYPE_IDS),
  audienceActionId: z.enum(AUDIENCE_ACTION_IDS),
  shootFormat: z.enum(CREATOR_MODES as [CreatorMode, ...CreatorMode[]]),
  presenceMode: z.enum(CREATOR_PERSONAS as [CreatorPersona, ...CreatorPersona[]]),
}).strict();

export type CreativeRecipe = z.infer<typeof creativeRecipeSchema>;

export type RecipeEvidence = {
  factualEvidence?: boolean;
  audioLicense?: boolean;
  sponsorDisclosure?: boolean;
};

export type RecipeScheduleInput = {
  lane: PurchaseLane;
  seed: string;
  count?: number;
  recentRecipes?: CreativeRecipe[];
  evidence?: RecipeEvidence;
};

type HookDefinition = {
  id: string;
  category: HookCategory;
  compatibleLanes: readonly PurchaseLane[];
  compatibleModes: readonly CreatorMode[];
  compatiblePersonas: readonly CreatorPersona[];
};

const HOOKS: HookDefinition[] = [
  ...ALL_HOOKS.map((hook) => ({
    id: hook.id,
    category: hook.category,
    compatibleLanes: hook.compatibleLanes,
    compatibleModes: hook.compatibleModes,
    compatiblePersonas: hook.compatiblePersonas,
  })),
  ...ADDITIONAL_HOOKS,
];

const GENRES_BY_LANE: Record<PurchaseLane, readonly ContentGenreId[]> = {
  beauty: ["controlled_comparison", "demonstration_tutorial", "experiment_test", "before_after_process", "decision_guide", "myth_reframe", "sensory_process", "mini_vlog"],
  fashion: ["controlled_comparison", "demonstration_tutorial", "before_after_process", "decision_guide", "myth_reframe", "mini_vlog", "sensory_process", "ranked_selection"],
  commerce_affiliate: ["controlled_comparison", "demonstration_tutorial", "experiment_test", "decision_guide", "myth_reframe", "mini_vlog", "ranked_selection", "interview_exchange"],
  creator_education: ["demonstration_tutorial", "experiment_test", "decision_guide", "myth_reframe", "micro_story", "confession_lesson", "ranked_selection", "interview_exchange"],
  entertainment_comedy: ["micro_story", "confession_lesson", "pov_scenario", "sketch_reversal", "mini_vlog", "sensory_process", "ranked_selection", "interview_exchange"],
  fitness_wellness_safe: ["controlled_comparison", "demonstration_tutorial", "experiment_test", "before_after_process", "decision_guide", "myth_reframe", "mini_vlog", "interview_exchange"],
  food: ["controlled_comparison", "demonstration_tutorial", "experiment_test", "before_after_process", "decision_guide", "mini_vlog", "sensory_process", "ranked_selection"],
  lifestyle: ["controlled_comparison", "demonstration_tutorial", "before_after_process", "decision_guide", "micro_story", "confession_lesson", "pov_scenario", "mini_vlog", "sensory_process"],
  luxury: ["controlled_comparison", "demonstration_tutorial", "decision_guide", "myth_reframe", "micro_story", "mini_vlog", "sensory_process", "interview_exchange"],
  parenting_family: ["demonstration_tutorial", "decision_guide", "micro_story", "confession_lesson", "pov_scenario", "sketch_reversal", "mini_vlog", "interview_exchange"],
  thought_leadership: ["controlled_comparison", "experiment_test", "decision_guide", "myth_reframe", "micro_story", "confession_lesson", "ranked_selection", "interview_exchange"],
  travel: ["controlled_comparison", "demonstration_tutorial", "experiment_test", "decision_guide", "micro_story", "pov_scenario", "mini_vlog", "sensory_process"],
};

const PROOF_BY_LANE: Record<PurchaseLane, readonly ProofDeviceId[]> = {
  beauty: ["controlled_side_by_side", "live_demonstration", "process_result", "sensory_result", "before_after_state"],
  fashion: ["controlled_side_by_side", "live_demonstration", "process_result", "decision_matrix", "before_after_state"],
  commerce_affiliate: ["controlled_side_by_side", "live_demonstration", "measured_readout", "process_result", "decision_matrix"],
  creator_education: ["live_demonstration", "measured_readout", "source_receipt", "decision_matrix", "before_after_state"],
  entertainment_comedy: ["visible_consequence", "reversal_callback", "before_after_state"],
  fitness_wellness_safe: ["controlled_side_by_side", "live_demonstration", "form_reference", "process_result", "before_after_state"],
  food: ["controlled_side_by_side", "live_demonstration", "process_result", "sensory_result", "before_after_state"],
  lifestyle: ["controlled_side_by_side", "live_demonstration", "process_result", "visible_consequence", "before_after_state"],
  luxury: ["controlled_side_by_side", "live_demonstration", "process_result", "sensory_result", "decision_matrix"],
  parenting_family: ["live_demonstration", "process_result", "visible_consequence", "reversal_callback", "decision_matrix"],
  thought_leadership: ["measured_readout", "source_receipt", "visible_consequence", "decision_matrix", "before_after_state"],
  travel: ["controlled_side_by_side", "live_demonstration", "route_map", "process_result", "visible_consequence"],
};

const VIBES_BY_LANE: Record<PurchaseLane, readonly VibePresetId[]> = {
  beauty: ["clean_editorial", "quiet_luxury", "tactile_asmr", "bright_utility", "precise_neutral", "raw_bts", "minimal_suspense", "calm_expert"],
  fashion: ["clean_editorial", "quiet_luxury", "playful_chaos", "cinematic_wonder", "documentary_observational", "raw_bts", "street_spontaneous", "calm_expert"],
  commerce_affiliate: ["clean_editorial", "warm_confessional", "documentary_observational", "raw_bts", "bright_utility", "precise_neutral", "street_spontaneous", "calm_expert"],
  creator_education: ["clean_editorial", "warm_confessional", "dry_deadpan", "documentary_observational", "raw_bts", "bright_utility", "precise_neutral", "calm_expert"],
  entertainment_comedy: ["warm_confessional", "dry_deadpan", "playful_chaos", "raw_bts", "high_energy_challenge", "minimal_suspense", "street_spontaneous", "cozy_domestic"],
  fitness_wellness_safe: ["clean_editorial", "documentary_observational", "raw_bts", "bright_utility", "precise_neutral", "high_energy_challenge", "street_spontaneous", "calm_expert"],
  food: ["clean_editorial", "warm_confessional", "playful_chaos", "tactile_asmr", "documentary_observational", "bright_utility", "cozy_domestic", "calm_expert"],
  lifestyle: ["clean_editorial", "warm_confessional", "dry_deadpan", "documentary_observational", "raw_bts", "bright_utility", "cozy_domestic", "calm_expert"],
  luxury: ["clean_editorial", "quiet_luxury", "tactile_asmr", "cinematic_wonder", "documentary_observational", "precise_neutral", "minimal_suspense", "calm_expert"],
  parenting_family: ["warm_confessional", "dry_deadpan", "documentary_observational", "raw_bts", "bright_utility", "cozy_domestic", "street_spontaneous", "calm_expert"],
  thought_leadership: ["clean_editorial", "warm_confessional", "dry_deadpan", "documentary_observational", "raw_bts", "bright_utility", "precise_neutral", "calm_expert"],
  travel: ["clean_editorial", "warm_confessional", "cinematic_wonder", "documentary_observational", "raw_bts", "bright_utility", "minimal_suspense", "street_spontaneous"],
};

const AXES: (keyof Pick<CreativeRecipe, "genreId" | "emotionArcId" | "vibePresetId" | "proofDeviceId" | "payoffTypeId" | "shootFormat">)[] = [
  "genreId", "emotionArcId", "vibePresetId", "proofDeviceId", "payoffTypeId", "shootFormat",
];

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hookFamily(recipe: CreativeRecipe): string {
  return HOOKS.find((hook) => hook.id === recipe.hookTypeId)?.category ?? "unknown";
}

export function creativeRecipeId(recipe: CreativeRecipe): string {
  const signature = [
    hookFamily(recipe), recipe.hookTypeId, recipe.genreId, recipe.hookDeliveryId,
    recipe.promiseTypeId, recipe.emotionArcId, recipe.vibePresetId, recipe.proofDeviceId,
    recipe.payoffTypeId, recipe.audienceActionId, recipe.shootFormat, recipe.presenceMode,
  ].join(":");
  return `${CREATIVE_TAXONOMY_VERSION}:${stableHash(signature).toString(16).padStart(8, "0")}`;
}

export function recipeDistance(left: CreativeRecipe, right: CreativeRecipe): number {
  let distance = hookFamily(left) === hookFamily(right) ? 0 : 1;
  for (const axis of AXES) if (left[axis] !== right[axis]) distance += 1;
  return distance;
}

export function validateRecipeSet(recipes: CreativeRecipe[], expectedCount = 5): string[] {
  const issues: string[] = [];
  if (recipes.length !== expectedCount) issues.push("recipe_count_invalid");
  if (recipes.some((recipe) => !creativeRecipeSchema.safeParse(recipe).success)) issues.push("recipe_schema_invalid");
  if (new Set(recipes.map(creativeRecipeId)).size !== recipes.length) issues.push("recipe_signature_duplicate");
  for (let left = 0; left < recipes.length; left += 1) {
    for (let right = left + 1; right < recipes.length; right += 1) {
      if (recipeDistance(recipes[left], recipes[right]) < 4) issues.push("recipe_axis_distance_low");
      if (
        hookFamily(recipes[left]) === hookFamily(recipes[right]) &&
        recipes[left].genreId === recipes[right].genreId &&
        recipes[left].payoffTypeId === recipes[right].payoffTypeId
      ) issues.push("recipe_spine_duplicate");
    }
  }
  return [...new Set(issues)];
}

function valueCount(recipes: CreativeRecipe[], getter: (recipe: CreativeRecipe) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const recipe of recipes) counts.set(getter(recipe), (counts.get(getter(recipe)) ?? 0) + 1);
  return counts;
}

function leastUsedScore(recipe: CreativeRecipe, recent: CreativeRecipe[]): number {
  const getters = [
    (value: CreativeRecipe) => value.hookTypeId,
    (value: CreativeRecipe) => hookFamily(value),
    (value: CreativeRecipe) => value.genreId,
    (value: CreativeRecipe) => value.emotionArcId,
    (value: CreativeRecipe) => value.vibePresetId,
    (value: CreativeRecipe) => value.proofDeviceId,
    (value: CreativeRecipe) => value.payoffTypeId,
    (value: CreativeRecipe) => value.shootFormat,
  ];
  return getters.reduce((score, getter) => score + (valueCount(recent, getter).get(getter(recipe)) ?? 0), 0);
}

function eligibleHooks(lane: PurchaseLane, evidence: RecipeEvidence): HookDefinition[] {
  return HOOKS.filter((hook) => {
    if (!hook.compatibleLanes.includes(lane)) return false;
    if ((AUTOMATICALLY_BLOCKED_HOOK_IDS as readonly string[]).includes(hook.id)) return false;
    if (!(EVIDENCE_REQUIRED_HOOK_IDS as readonly string[]).includes(hook.id)) return true;
    if (hook.id === "audio_trend_hijack") return evidence.audioLicense === true;
    return evidence.factualEvidence === true;
  });
}

function candidateRecipes(input: RecipeScheduleInput): CreativeRecipe[] {
  const hooks = eligibleHooks(input.lane, input.evidence ?? {});
  const genres = GENRES_BY_LANE[input.lane];
  const vibes = VIBES_BY_LANE[input.lane];
  const proofs = PROOF_BY_LANE[input.lane];
  const actions = input.lane === "commerce_affiliate"
    ? AUDIENCE_ACTION_IDS
    : AUDIENCE_ACTION_IDS.filter((value) => value !== "disclosed_commercial_action");
  const seed = stableHash(`${input.lane}:${input.seed}`);
  const candidates: CreativeRecipe[] = [];
  for (let index = 0; index < 480; index += 1) {
    const hook = hooks[(seed + index * 17) % hooks.length];
    const modes = hook.compatibleModes.length ? hook.compatibleModes : CREATOR_MODES;
    const personas = hook.compatiblePersonas.length ? hook.compatiblePersonas : CREATOR_PERSONAS;
    const recipe = creativeRecipeSchema.parse({
      taxonomyVersion: CREATIVE_TAXONOMY_VERSION,
      genreId: genres[(seed + index * 5) % genres.length],
      hookTypeId: hook.id,
      hookDeliveryId: HOOK_DELIVERY_IDS[(seed + index * 3) % HOOK_DELIVERY_IDS.length],
      promiseTypeId: PROMISE_TYPE_IDS[(seed + index * 7) % PROMISE_TYPE_IDS.length],
      emotionArcId: EMOTION_ARC_IDS[(seed + index * 5) % EMOTION_ARC_IDS.length],
      vibePresetId: vibes[(seed + index * 7) % vibes.length],
      proofDeviceId: proofs[(seed + index * 3) % proofs.length],
      payoffTypeId: PAYOFF_TYPE_IDS[(seed + index * 7) % PAYOFF_TYPE_IDS.length],
      audienceActionId: actions[(seed + index * 5) % actions.length],
      shootFormat: modes[(seed + index * 3) % modes.length],
      presenceMode: personas[(seed + index * 7) % personas.length],
    });
    if (recipe.hookDeliveryId === "sound" && !["voiceover", "hands_only", "pov", "object_led"].includes(recipe.shootFormat)) continue;
    candidates.push(recipe);
  }
  return [...new Map(candidates.map((recipe) => [creativeRecipeId(recipe), recipe])).values()];
}

export function scheduleCreativeRecipes(input: RecipeScheduleInput): CreativeRecipe[] {
  if (!PURCHASE_LANES.includes(input.lane)) throw new Error("unsupported_recipe_lane");
  const count = input.count ?? 5;
  if (count !== 5) throw new Error("creative_recipe_count_must_be_five");
  const selected: CreativeRecipe[] = [];
  const recent = (input.recentRecipes ?? []).filter((recipe) => creativeRecipeSchema.safeParse(recipe).success);
  const candidates = candidateRecipes(input).sort((left, right) => {
    const coverage = leastUsedScore(left, recent) - leastUsedScore(right, recent);
    return coverage || stableHash(`${input.seed}:${creativeRecipeId(left)}`) - stableHash(`${input.seed}:${creativeRecipeId(right)}`);
  });
  for (const candidate of candidates) {
    if (selected.every((existing) => recipeDistance(existing, candidate) >= 4) &&
      selected.every((existing) => !(
        hookFamily(existing) === hookFamily(candidate) &&
        existing.genreId === candidate.genreId &&
        existing.payoffTypeId === candidate.payoffTypeId
      ))) selected.push(candidate);
    if (selected.length === count) break;
  }
  const issues = validateRecipeSet(selected, count);
  if (issues.length) throw new Error(`creative_recipe_schedule_failed:${issues.join(",")}`);
  return selected;
}

export type CreativeDistribution = {
  total: number;
  uniqueSignatures: number;
  maxShares: { hookType: number; hookFamily: number; genre: number; emotionArc: number; vibe: number; payoff: number };
  issueCodes: string[];
};

function maxShare(values: string[]): number {
  if (!values.length) return 0;
  const counts = valueCount(values.map((value) => ({ value })) as never[], (row) => (row as never as { value: string }).value);
  return Math.max(...counts.values()) / values.length;
}

export function analyzeCreativeDistribution(recipes: CreativeRecipe[]): CreativeDistribution {
  const total = recipes.length;
  const maxShares = {
    hookType: maxShare(recipes.map((recipe) => recipe.hookTypeId)),
    hookFamily: maxShare(recipes.map(hookFamily)),
    genre: maxShare(recipes.map((recipe) => recipe.genreId)),
    emotionArc: maxShare(recipes.map((recipe) => recipe.emotionArcId)),
    vibe: maxShare(recipes.map((recipe) => recipe.vibePresetId)),
    payoff: maxShare(recipes.map((recipe) => recipe.payoffTypeId)),
  };
  const issueCodes: string[] = [];
  if (total >= 50 && maxShares.hookType > 0.12) issueCodes.push("hook_type_concentration");
  if (total >= 50 && maxShares.hookFamily > 0.25) issueCodes.push("hook_family_concentration");
  if (total >= 50 && maxShares.genre > 0.2) issueCodes.push("genre_concentration");
  if (total >= 50 && maxShares.emotionArc > 0.25) issueCodes.push("emotion_arc_concentration");
  if (total >= 50 && maxShares.vibe > 0.2) issueCodes.push("vibe_concentration");
  if (total >= 50 && maxShares.payoff > 0.2) issueCodes.push("payoff_concentration");
  const uniqueSignatures = new Set(recipes.map(creativeRecipeId)).size;
  if (uniqueSignatures !== total) issueCodes.push("creative_signature_duplicate");
  return { total, uniqueSignatures, maxShares, issueCodes };
}

export function hookAutomationStatus(hookId: string, evidence: RecipeEvidence = {}): "allowed" | "evidence_required" | "blocked" | "unknown" {
  if (!HOOK_TYPE_IDS.includes(hookId)) return "unknown";
  if ((AUTOMATICALLY_BLOCKED_HOOK_IDS as readonly string[]).includes(hookId)) return "blocked";
  if (!(EVIDENCE_REQUIRED_HOOK_IDS as readonly string[]).includes(hookId)) return "allowed";
  if (hookId === "audio_trend_hijack") return evidence.audioLicense ? "allowed" : "evidence_required";
  return evidence.factualEvidence ? "allowed" : "evidence_required";
}

export function recipeMatchesConcept(recipe: CreativeRecipe, concept: { hookId?: string; shootFormat?: string; recipe?: unknown }): boolean {
  const parsed = creativeRecipeSchema.safeParse(concept.recipe);
  return parsed.success && creativeRecipeId(parsed.data) === creativeRecipeId(recipe) &&
    concept.hookId === recipe.hookTypeId && concept.shootFormat === recipe.shootFormat;
}