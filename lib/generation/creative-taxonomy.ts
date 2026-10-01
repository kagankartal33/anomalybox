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
export const CREATIVE_SCHEDULER_VERSION = "creative-scheduler-v2.1" as const;
export const CREATIVE_SIGNATURE_VERSION = "creative-signature-v2" as const;

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

type VibePreset = {
  energy: "low" | "measured" | "high";
  tempo: string;
  tone: string;
  light: string;
  sound: string;
  editBoundary: string;
};

export const VIBE_PRESETS: Readonly<Record<(typeof VIBE_PRESET_IDS)[number], VibePreset>> = {
  clean_editorial: { energy: "measured", tempo: "deliberate", tone: "clear and composed", light: "soft neutral key light", sound: "clean speech and restrained room tone", editBoundary: "straight cuts; no decorative effects" },
  quiet_luxury: { energy: "low", tempo: "unhurried", tone: "specific and understated", light: "soft directional light with controlled highlights", sound: "close natural detail with minimal music", editBoundary: "hold material details; avoid status spectacle" },
  warm_confessional: { energy: "measured", tempo: "conversational", tone: "candid and humane", light: "warm practical light", sound: "intimate natural voice", editBoundary: "few cuts; retain believable pauses" },
  dry_deadpan: { energy: "low", tempo: "precise", tone: "literal and restrained", light: "even observational light", sound: "dry delivery with real object sounds", editBoundary: "hard cuts only where the consequence changes" },
  playful_chaos: { energy: "high", tempo: "brisk but readable", tone: "playful, never humiliating", light: "bright available light", sound: "layered real reactions without clipping", editBoundary: "controlled escalation; preserve continuity" },
  tactile_asmr: { energy: "low", tempo: "patient", tone: "sensory and concrete", light: "raking light that reveals texture", sound: "licensed or original close-mic object sound", editBoundary: "long enough holds to perceive texture" },
  cinematic_wonder: { energy: "measured", tempo: "expansive", tone: "observant, not grandiose", light: "motivated environmental light", sound: "original ambience with restrained score", editBoundary: "reveal scale through shot progression, not effects" },
  documentary_observational: { energy: "measured", tempo: "event-led", tone: "factual and present", light: "available natural light", sound: "location sound and intelligible speech", editBoundary: "chronology stays honest; label time jumps" },
  raw_bts: { energy: "measured", tempo: "working pace", tone: "direct and transparent", light: "available work light", sound: "real setup sound", editBoundary: "keep useful imperfections; disclose resets" },
  bright_utility: { energy: "measured", tempo: "efficient", tone: "helpful and concrete", light: "bright even task light", sound: "crisp instruction and real action sound", editBoundary: "cut on completed actions, not every word" },
  precise_neutral: { energy: "low", tempo: "methodical", tone: "bounded and exact", light: "matched controlled light", sound: "neutral voice with low ambience", editBoundary: "comparison conditions must remain identical" },
  cozy_domestic: { energy: "low", tempo: "comfortable", tone: "familiar and grounded", light: "soft home practicals", sound: "gentle room tone and natural speech", editBoundary: "preserve spatial and prop continuity" },
  high_energy_challenge: { energy: "high", tempo: "fast with action room", tone: "committed but safe", light: "clear high-output task light", sound: "original rhythm and audible action", editBoundary: "no dangerous compression or fake countdown" },
  minimal_suspense: { energy: "low", tempo: "progressive", tone: "curious without fear", light: "controlled contrast with visible detail", sound: "subtle original tension bed or room tone", editBoundary: "open loop must close; no fake threat" },
  street_spontaneous: { energy: "high", tempo: "responsive", tone: "present and consent-aware", light: "available exterior light", sound: "clear location sound", editBoundary: "avoid identifiable bystanders and private details" },
  calm_expert: { energy: "low", tempo: "assured", tone: "specific, sourced and non-absolute", light: "soft functional light", sound: "clean natural voice", editBoundary: "use inserts only to show evidence" },
};

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

export const HOOK_TYPE_IDS = Array.from(new Set([
  ...ALL_HOOKS.map((hook) => hook.id),
  ...ADDITIONAL_HOOKS.map((hook) => hook.id),
])) as [string, ...string[]];

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

const creativeRecipeShapeSchema = z.object({
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
  shootFormat: z.enum([...CREATOR_MODES] as [CreatorMode, ...CreatorMode[]]),
  presenceMode: z.enum([...CREATOR_PERSONAS] as [CreatorPersona, ...CreatorPersona[]]),
}).strict();

export type CreativeRecipe = z.infer<typeof creativeRecipeShapeSchema>;

export const creativeRecipeSchema = creativeRecipeShapeSchema.superRefine((recipe, context) => {
  for (const code of validateRecipeCompatibility(recipe)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: code });
  }
});

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

const HOOKS: HookDefinition[] = [...new Map([
  ...ALL_HOOKS.map((hook) => ({
    id: hook.id,
    category: hook.category,
    compatibleLanes: hook.compatibleLanes,
    compatibleModes: hook.compatibleModes,
    compatiblePersonas: hook.compatiblePersonas,
  })),
  ...ADDITIONAL_HOOKS,
].map((hook) => [hook.id, hook])).values()];

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

/** Prompt-safe execution direction. It contains no scores or performance claims. */
export function creativeDirectionForRecipe(recipe: CreativeRecipe) {
  return {
    firstFrame: `${recipe.hookDeliveryId} delivery must visibly establish the ${recipe.promiseTypeId} promise immediately`,
    emotionBeats: recipe.emotionArcId.split("_to_"),
    vibe: VIBE_PRESETS[recipe.vibePresetId],
    evidence: `${recipe.proofDeviceId} must occur on camera before the ${recipe.payoffTypeId} payoff`,
    audienceAction: recipe.audienceActionId,
    production: { shootFormat: recipe.shootFormat, presenceMode: recipe.presenceMode },
  };
  const pairUniqueCounts = {
    genreVibe: new Set(recipes.map((recipe) => `${recipe.genreId}|${recipe.vibePresetId}`)).size,
    hookGenre: new Set(recipes.map((recipe) => `${recipe.hookTypeId}|${recipe.genreId}`)).size,
    emotionPayoff: new Set(recipes.map((recipe) => `${recipe.emotionArcId}|${recipe.payoffTypeId}`)).size,
    formatProof: new Set(recipes.map((recipe) => `${recipe.shootFormat}|${recipe.proofDeviceId}`)).size,
  };
  const pairUniqueCounts = {
    genreVibe: new Set(recipes.map((recipe) => `${recipe.genreId}|${recipe.vibePresetId}`)).size,
    hookGenre: new Set(recipes.map((recipe) => `${recipe.hookTypeId}|${recipe.genreId}`)).size,
    emotionPayoff: new Set(recipes.map((recipe) => `${recipe.emotionArcId}|${recipe.payoffTypeId}`)).size,
    formatProof: new Set(recipes.map((recipe) => `${recipe.shootFormat}|${recipe.proofDeviceId}`)).size,
  };
}
  return hash >>> 0;
}

function hookFamily(recipe: CreativeRecipe): string {
  return HOOKS.find((hook) => hook.id === recipe.hookTypeId)?.category ?? "unknown";
}

/** Only for recognizing already stored V1 reservation IDs, never recipe equality. */
export function legacyCreativeRecipeId(recipe: CreativeRecipe): string {
  const signature = [
    hookFamily(recipe), recipe.hookTypeId, recipe.genreId, recipe.hookDeliveryId,
    recipe.promiseTypeId, recipe.emotionArcId, recipe.vibePresetId, recipe.proofDeviceId,
    recipe.payoffTypeId, recipe.audienceActionId, recipe.shootFormat, recipe.presenceMode,
  ].join(":");
  return `${CREATIVE_TAXONOMY_VERSION}:${stableHash(signature).toString(16).padStart(8, "0")}`;
}

/** Fixed-field canonical identity is synchronous and lossless in browsers and Deno. */
export function creativeRecipeId(recipe: CreativeRecipe): string {
  return `${CREATIVE_SIGNATURE_VERSION}:${JSON.stringify([
    recipe.taxonomyVersion, recipe.hookTypeId, recipe.genreId, recipe.hookDeliveryId,
    recipe.promiseTypeId, recipe.emotionArcId, recipe.vibePresetId, recipe.proofDeviceId,
    recipe.payoffTypeId, recipe.audienceActionId, recipe.shootFormat, recipe.presenceMode,
  ])}`;
}

const REQUIRED_HOOK_DELIVERIES: Partial<Record<string, readonly HookDeliveryId[]>> = {
  text_first_silent_hook: ["on_screen_text"],
  sound_before_source: ["sound"],
};

/** Hard execution constraints; a valid enum alone does not make a recipe usable. */
export function validateRecipeCompatibility(recipe: CreativeRecipe, lane?: PurchaseLane): string[] {
  const issues: string[] = [];
  const hook = HOOKS.find((item) => item.id === recipe.hookTypeId);
  if (!hook) return ["unknown_hook_taxonomy_id"];
  if (!hook.compatibleModes.includes(recipe.shootFormat)) issues.push("recipe_hook_format_incompatible");
  if (!hook.compatiblePersonas.includes(recipe.presenceMode)) issues.push("recipe_hook_presence_incompatible");
  if (recipe.presenceMode === "faceless_curator" && ["talking_head", "interview"].includes(recipe.shootFormat)) {
    issues.push("recipe_presence_format_incompatible");
  }
  const deliveries = REQUIRED_HOOK_DELIVERIES[recipe.hookTypeId];
  if (deliveries && !deliveries.includes(recipe.hookDeliveryId)) issues.push("recipe_hook_delivery_incompatible");
  if (recipe.hookDeliveryId === "sound" && !["voiceover", "hands_only", "pov", "object_led"].includes(recipe.shootFormat)) {
    issues.push("recipe_delivery_format_incompatible");
  }
  if (lane) {
    if (!hook.compatibleLanes.includes(lane)) issues.push("recipe_hook_lane_incompatible");
    if (!GENRES_BY_LANE[lane]?.includes(recipe.genreId)) issues.push("recipe_genre_lane_incompatible");
    if (!PROOF_BY_LANE[lane]?.includes(recipe.proofDeviceId)) issues.push("recipe_proof_lane_incompatible");
    if (!VIBES_BY_LANE[lane]?.includes(recipe.vibePresetId)) issues.push("recipe_vibe_lane_incompatible");
    if (recipe.audienceActionId === "disclosed_commercial_action" && lane !== "commerce_affiliate") {
      issues.push("recipe_commercial_action_lane_incompatible");
    }
  }
  return issues;
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

type RecipeGetter = (recipe: CreativeRecipe) => string;

const COVERAGE_AXES: readonly RecipeGetter[] = [
  (value) => value.hookTypeId,
  (value) => hookFamily(value),
  (value) => value.genreId,
  (value) => value.emotionArcId,
  (value) => value.vibePresetId,
  (value) => value.proofDeviceId,
  (value) => value.payoffTypeId,
  (value) => value.shootFormat,
];

const COVERAGE_PAIRS: readonly [RecipeGetter, RecipeGetter][] = [
  [(value) => value.genreId, (value) => value.vibePresetId],
  [(value) => hookFamily(value), (value) => value.genreId],
  [(value) => value.hookTypeId, (value) => value.genreId],
  [(value) => value.emotionArcId, (value) => value.payoffTypeId],
  [(value) => value.shootFormat, (value) => value.proofDeviceId],
];

type CoverageStats = {
  total: number;
  signatures: Set<string>;
  axes: Map<string, number>[];
  pairs: Map<string, number>[];
};

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function coverageStats(recipes: CreativeRecipe[]): CoverageStats {
  const stats: CoverageStats = {
    total: recipes.length,
    signatures: new Set<string>(),
    axes: COVERAGE_AXES.map(() => new Map<string, number>()),
    pairs: COVERAGE_PAIRS.map(() => new Map<string, number>()),
  };
  for (const recipe of recipes) {
    stats.signatures.add(creativeRecipeId(recipe));
    COVERAGE_AXES.forEach((getter, index) => increment(stats.axes[index], getter(recipe)));
    COVERAGE_PAIRS.forEach(([left, right], index) => increment(stats.pairs[index], `${left(recipe)}|${right(recipe)}`));
  }
  return stats;
}

function coveragePenalty(recipe: CreativeRecipe, stats: CoverageStats): number {
  if (stats.signatures.has(creativeRecipeId(recipe))) return 1_000_000;
  const denominator = Math.max(1, stats.total);
  const axisPenalty = COVERAGE_AXES.reduce(
    (score, getter, index) => score + (stats.axes[index].get(getter(recipe)) ?? 0) / denominator,
    0,
  );
  const pairPenalty = COVERAGE_PAIRS.reduce(
    (score, [left, right], index) => score + (stats.pairs[index].get(`${left(recipe)}|${right(recipe)}`) ?? 0) / denominator,
    0,
  );
  return axisPenalty + pairPenalty * 2;
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
  const candidates: CreativeRecipe[] = [];
  const pick = <T>(values: readonly T[], index: number, axis: string): T =>
    values[stableHash(`${input.lane}:${input.seed}:${index}:${axis}`) % values.length];
  // Independent, axis-salted sampling prevents the modular correlations that
  // made marginal distributions look healthy while pair combinations repeated.
  for (let index = 0; index < 256; index += 1) {
    const hook = pick(hooks, index, "hook");
    const modes = hook.compatibleModes.length ? hook.compatibleModes : CREATOR_MODES;
    const personas = hook.compatiblePersonas.length ? hook.compatiblePersonas : CREATOR_PERSONAS;
    const recipe: CreativeRecipe = {
      taxonomyVersion: CREATIVE_TAXONOMY_VERSION,
      genreId: pick(genres, index, "genre"),
      hookTypeId: hook.id,
      hookDeliveryId: pick(REQUIRED_HOOK_DELIVERIES[hook.id] ?? HOOK_DELIVERY_IDS, index, "delivery"),
      promiseTypeId: pick(PROMISE_TYPE_IDS, index, "promise"),
      emotionArcId: pick(EMOTION_ARC_IDS, index, "emotion"),
      vibePresetId: pick(vibes, index, "vibe"),
      proofDeviceId: pick(proofs, index, "proof"),
      payoffTypeId: pick(PAYOFF_TYPE_IDS, index, "payoff"),
      audienceActionId: pick(actions, index, "audience_action"),
      shootFormat: pick(modes, index, "shoot_format"),
      presenceMode: pick(personas, index, "presence"),
    };
    if (validateRecipeCompatibility(recipe, input.lane).length) continue;
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
  const candidates = candidateRecipes(input);
  while (selected.length < count) {
    const stats = coverageStats([...recent, ...selected]);
    let next: CreativeRecipe | undefined;
    let nextPenalty = Number.POSITIVE_INFINITY;
    let nextTie = Number.POSITIVE_INFINITY;
    for (const candidate of candidates) {
      if (stats.signatures.has(creativeRecipeId(candidate))) continue;
      if (!selected.every((existing) => recipeDistance(existing, candidate) >= 4)) continue;
      if (!selected.every((existing) => !(
        hookFamily(existing) === hookFamily(candidate) &&
        existing.genreId === candidate.genreId &&
        existing.payoffTypeId === candidate.payoffTypeId
      ))) continue;
      const penalty = coveragePenalty(candidate, stats);
      const tie = stableHash(`${input.seed}:${creativeRecipeId(candidate)}`);
      if (penalty < nextPenalty || (penalty === nextPenalty && tie < nextTie)) {
        next = candidate;
        nextPenalty = penalty;
        nextTie = tie;
      }
    }
    if (!next) break;
    selected.push(next);
  }
  const issues = validateRecipeSet(selected, count);
  if (issues.length) throw new Error(`creative_recipe_schedule_failed:${issues.join(",")}`);
  return selected;
}

export type CreativeDistribution = {
  total: number;
  uniqueSignatures: number;
  maxShares: { hookType: number; hookFamily: number; genre: number; emotionArc: number; vibe: number; payoff: number };
  pairUniqueCounts: { genreVibe: number; hookGenre: number; emotionPayoff: number; formatProof: number };
  issueCodes: string[];
};

function maxShare(values: string[]): number {
  if (!values.length) return 0;
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
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
  if (total >= 50 && pairUniqueCounts.genreVibe < 20) issueCodes.push("genre_vibe_pair_coverage_low");
  if (total >= 50 && pairUniqueCounts.emotionPayoff < 24) issueCodes.push("emotion_payoff_pair_coverage_low");
  if (total >= 50 && pairUniqueCounts.formatProof < 12) issueCodes.push("format_proof_pair_coverage_low");
  if (total >= 500 && pairUniqueCounts.genreVibe < 60) issueCodes.push("genre_vibe_pair_coverage_low");
  if (total >= 500 && pairUniqueCounts.emotionPayoff < 100) issueCodes.push("emotion_payoff_pair_coverage_low");
  if (total >= 500 && pairUniqueCounts.formatProof < 20) issueCodes.push("format_proof_pair_coverage_low");
  return { total, uniqueSignatures, maxShares, pairUniqueCounts, issueCodes };
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