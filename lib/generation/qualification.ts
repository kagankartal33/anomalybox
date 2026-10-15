import { DURATION_PLANNER_VERSION } from "../idea-card/duration-planner";
import { AUTOMATIC_QUALIFICATION_MODE, GENERATION_PIPELINE_VERSION, independentCritic, modelContract, objectRecord, stableJson } from "./automatic-policy.ts";
import { CONCEPT_RANKER_VERSION } from "./concept-ranking";
import { CREATIVE_SCHEDULER_VERSION } from "./creative-taxonomy";

export type QualificationContract = {
  promptVersion: string;
  schemaVersion: number;
  qualityGateVersion: string;
};

export function profileMatchesQualificationContract(
  profile: Record<string, unknown>,
  contract: QualificationContract,
) {
  return profile.qualification_status === "approved" &&
    (profile.qualification_metrics as Record<string, unknown> | undefined)?.qualification_mode === AUTOMATIC_QUALIFICATION_MODE &&
    (profile.qualification_metrics as Record<string, unknown> | undefined)?.pipeline_version === GENERATION_PIPELINE_VERSION &&
    (profile.qualification_metrics as Record<string, unknown> | undefined)?.scheduler_version === CREATIVE_SCHEDULER_VERSION &&
    (profile.qualification_metrics as Record<string, unknown> | undefined)?.concept_ranker_version === CONCEPT_RANKER_VERSION &&
    (profile.qualification_metrics as Record<string, unknown> | undefined)?.duration_planner_version === DURATION_PLANNER_VERSION &&
    profile.enabled === true &&
    profile.qualified_prompt_version === contract.promptVersion &&
    Number(profile.qualified_schema_version) === contract.schemaVersion &&
    profile.qualified_quality_gate_version === contract.qualityGateVersion &&
    Boolean(profile.qualification_eval_id);
}

/** A slug is a lookup alias, not proof that this critic participated in qualification. */
export function criticMatchesQualificationContract(generator: Record<string, unknown>, critic: unknown): boolean {
  const metrics = objectRecord(generator.qualification_metrics);
  const currentCritic = objectRecord(critic);
  const configuredSlug = objectRecord(generator.features).critic_profile_slug;
  return independentCritic(generator, currentCritic)
    && typeof configuredSlug === "string" && configuredSlug.length > 0
    && currentCritic.profile_slug === configuredSlug
    && metrics.critic_profile_id === currentCritic.id
    && stableJson(metrics.critic_snapshot) === stableJson(modelContract(currentCritic));
}

export function isQualificationGoldEligible(
  rating: {
    source: string;
    category_slug: string;
    generation_run_id: string | null;
    provider: string | null;
    model: string | null;
    prompt_version: string | null;
  },
  expected: {
    pilotCategories: readonly string[];
    runIds: ReadonlySet<string>;
    provider: string;
    model: string;
    promptVersion: string;
  },
) {
  if (!expected.pilotCategories.includes(rating.category_slug)) return false;
  if (rating.source === "existing_stock") return true;
  return rating.source === "generated" &&
    Boolean(rating.generation_run_id) &&
    expected.runIds.has(String(rating.generation_run_id)) &&
    rating.provider === expected.provider &&
    rating.model === expected.model &&
    rating.prompt_version === expected.promptVersion;
}
export const AUTOMATIC_REGRESSION_VERSION = "automatic-quality-regression-v3";
export const QUALIFICATION_CATEGORIES = [
  "beauty",
  "fashion",
  "commerce_affiliate",
  "creator_education",
  "entertainment_comedy",
  "fitness_wellness_safe",
  "food",
  "lifestyle",
  "luxury",
  "parenting_family",
  "thought_leadership",
  "travel",
] as const;

/** @deprecated Use QUALIFICATION_CATEGORIES. Kept for V2 tooling compatibility. */
export const PILOT_CATEGORIES = QUALIFICATION_CATEGORIES;

function automaticQualityThresholdsPass(metrics: Record<string, unknown>, expectedCount: number): boolean {
  const finite = (name: string, min: number, max = Number.MAX_SAFE_INTEGER) => typeof metrics[name] === "number" && Number.isFinite(metrics[name]) && Number(metrics[name]) >= min && Number(metrics[name]) <= max;
  return finite("evaluated_count", expectedCount, expectedCount)
    && finite("schema_pass_rate", 0.99, 1) && finite("taxonomy_pass_rate", 0.99, 1)
    && finite("recipe_adherence_rate", 0.98, 1) && finite("safe_approve_rate", 0.55, 1)
    && finite("approved_average", 90, 100) && finite("duplicate_rate_078", 0, 0.03)
    && finite("banned_residue_rate", 0, 0.005) && finite("creator_residue_rate", 0, 0.005)
    && finite("duration_fit_rate", 0.95, 1)
    && finite("exact_duration_max_share", 0, 0.2) && finite("timing_template_duplicate_rate", 0, 0)
    && finite("approved_critic_pass_rate", 1, 1)
    && finite("approved_hook_first_frame_rate", 1, 1) && finite("approved_proof_payoff_rate", 1, 1)
    && metrics.creative_distribution_passed === true
    && metrics.embedded_count === metrics.evaluated_count && metrics.critic_record_count === metrics.evaluated_count
    && metrics.current_gate_count === metrics.evaluated_count && metrics.fresh_snapshot_count === metrics.evaluated_count;
}

export function automaticQualificationPass(metrics: Record<string, unknown>): boolean {
  const counts = objectRecord(metrics.category_counts);
  const categoryKeys = Object.keys(counts);
  const categoryMetrics = objectRecord(metrics.category_metrics);
  return metrics.qualification_mode === AUTOMATIC_QUALIFICATION_MODE
    && metrics.pipeline_version === GENERATION_PIPELINE_VERSION
    && metrics.scheduler_version === CREATIVE_SCHEDULER_VERSION
    && metrics.concept_ranker_version === CONCEPT_RANKER_VERSION
    && metrics.duration_planner_version === DURATION_PLANNER_VERSION
    && metrics.regression_version === AUTOMATIC_REGRESSION_VERSION && metrics.regression_passed === true
    && metrics.regression_case_count === 72
    && automaticQualityThresholdsPass(metrics, 600)
    && categoryKeys.length === QUALIFICATION_CATEGORIES.length
    && categoryKeys.every((category) => (QUALIFICATION_CATEGORIES as readonly string[]).includes(category))
    && Object.keys(categoryMetrics).length === QUALIFICATION_CATEGORIES.length
    && QUALIFICATION_CATEGORIES.every((category) => counts[category] === 50
      && automaticQualityThresholdsPass(objectRecord(categoryMetrics[category]), 50));
}
