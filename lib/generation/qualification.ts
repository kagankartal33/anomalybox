import { DURATION_PLANNER_VERSION } from "../idea-card/duration-planner";
import { AUTOMATIC_QUALIFICATION_MODE, GENERATION_PIPELINE_VERSION, independentCritic, modelContract, objectRecord, stableJson } from "./automatic-policy";
import { CONCEPT_RANKER_VERSION } from "./concept-ranking";
import { CREATIVE_SCHEDULER_VERSION } from "./creative-taxonomy";

export const QUALIFICATION_CATEGORIES = [
  "beauty",
  "entertainment_comedy",
  "travel",
  "fitness_wellness_safe",
  "food",
] as const;

export type QualificationCategory = typeof QUALIFICATION_CATEGORIES[number];

export function automaticQualificationPass(metrics: Record<string, unknown>): boolean {
  if (!metrics || typeof metrics !== "object") return false;
  if (metrics.qualification_mode !== AUTOMATIC_QUALIFICATION_MODE) return false;
  if (!metrics.regression_passed) return false;
  if (Number(metrics.evaluated_count ?? 0) <= 0) return false;
  if (Number(metrics.safe_approve_rate ?? 0) < 0.6) return false;
  if (Number(metrics.banned_residue_rate ?? 1) > 0.05) return false;
  if (Number(metrics.duplicate_rate_078 ?? 1) > 0.1) return false;
  if (Number(metrics.exact_duration_max_share ?? 1) > 0.25) return false;
  return true;
}

export type QualificationContract = {
  promptVersion: string;
  schemaVersion: number;
  qualityGateVersion: string;
};

export function profileMatchesQualificationContract(
  profile: Record<string, unknown>,
  contract: QualificationContract,
) {
  const metrics = profile.qualification_metrics as Record<string, unknown> | undefined;
  return profile.qualification_status === "approved" &&
    metrics?.qualification_mode === AUTOMATIC_QUALIFICATION_MODE &&
    metrics?.pipeline_version === GENERATION_PIPELINE_VERSION &&
    metrics?.scheduler_version === CREATIVE_SCHEDULER_VERSION &&
    metrics?.concept_ranker_version === CONCEPT_RANKER_VERSION &&
    metrics?.duration_planner_version === DURATION_PLANNER_VERSION &&
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