import type { IdeaCard, IdeaCardProductionEstimate } from "./types";
import type { PurchaseLane } from "../algorithmic-reason/types";

export const DURATION_PLANNER_VERSION = "duration-planner-v2";
export const PRODUCTION_ESTIMATE_VERSION = "production-estimate-v1-uncalibrated";

export const RUNTIME_PROFILES = ["quick_payoff", "single_proof", "story_proof", "deep_process"] as const;
export type RuntimeProfile = (typeof RUNTIME_PROFILES)[number];

export const RUNTIME_PROFILE_RANGES: Record<RuntimeProfile, { min: number; max: number }> = {
  quick_payoff: { min: 12, max: 18 },
  single_proof: { min: 19, max: 27 },
  story_proof: { min: 28, max: 39 },
  deep_process: { min: 40, max: 60 },
};

const PROFILE_ORDER = [...RUNTIME_PROFILES];

const DEFAULT_MIX: Record<RuntimeProfile, number> = {
  quick_payoff: 0.2,
  single_proof: 0.4,
  story_proof: 0.3,
  deep_process: 0.1,
};

export const RUNTIME_PROFILE_MIXES_BY_LANE: Record<PurchaseLane, Record<RuntimeProfile, number>> = {
  beauty: { quick_payoff: 0.2, single_proof: 0.4, story_proof: 0.3, deep_process: 0.1 },
  fashion: { quick_payoff: 0.25, single_proof: 0.4, story_proof: 0.25, deep_process: 0.1 },
  commerce_affiliate: { quick_payoff: 0.25, single_proof: 0.45, story_proof: 0.25, deep_process: 0.05 },
  creator_education: { quick_payoff: 0.15, single_proof: 0.35, story_proof: 0.35, deep_process: 0.15 },
  entertainment_comedy: { quick_payoff: 0.45, single_proof: 0.35, story_proof: 0.15, deep_process: 0.05 },
  fitness_wellness_safe: { quick_payoff: 0.15, single_proof: 0.4, story_proof: 0.35, deep_process: 0.1 },
  food: { quick_payoff: 0.2, single_proof: 0.4, story_proof: 0.3, deep_process: 0.1 },
  lifestyle: { quick_payoff: 0.25, single_proof: 0.4, story_proof: 0.25, deep_process: 0.1 },
  luxury: { quick_payoff: 0.15, single_proof: 0.35, story_proof: 0.35, deep_process: 0.15 },
  parenting_family: { quick_payoff: 0.2, single_proof: 0.4, story_proof: 0.3, deep_process: 0.1 },
  thought_leadership: { quick_payoff: 0.1, single_proof: 0.3, story_proof: 0.4, deep_process: 0.2 },
  travel: { quick_payoff: 0.1, single_proof: 0.25, story_proof: 0.45, deep_process: 0.2 },
};

export type DurationPlanningConcept = {
  conceptId: string;
  runtimeProfile: RuntimeProfile;
  proofBeatCount: number;
  spokenWordTarget: number;
  shotCount: number;
  locationCount: number;
  cameraSetupCount: number;
  resetCount: number;
  shootFormat: string;
};

export type DurationPlan = {
  runtimeProfile: RuntimeProfile;
  targetSeconds: number;
  plannerVersion: typeof DURATION_PLANNER_VERSION;
};

export type DurationDistributionResult = {
  profileCounts: Record<RuntimeProfile, number>;
  exactSecondCounts: Record<string, number>;
  distinctProfiles: number;
  maxExactSecondShare: number;
  issueCodes: string[];
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  // Avalanche the low bits before modulo allocation. Raw FNV low bits formed
  // visible exact-second clusters for similarly suffixed concept IDs.
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

function allocationCounts(categorySlug: string, targetCount: number): Record<RuntimeProfile, number> {
  const count = Math.max(1, Math.floor(targetCount));
  const mix = RUNTIME_PROFILE_MIXES_BY_LANE[categorySlug as PurchaseLane] ?? DEFAULT_MIX;
  const counts = Object.fromEntries(PROFILE_ORDER.map((profile) => [profile, Math.floor(mix[profile] * count)])) as Record<RuntimeProfile, number>;
  let assigned = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const remainderOrder = [...PROFILE_ORDER].sort((left, right) => {
    const rightRemainder = mix[right] * count - Math.floor(mix[right] * count);
    const leftRemainder = mix[left] * count - Math.floor(mix[left] * count);
    return rightRemainder - leftRemainder || PROFILE_ORDER.indexOf(left) - PROFILE_ORDER.indexOf(right);
  });
  for (let index = 0; assigned < count; index += 1) {
    counts[remainderOrder[index % remainderOrder.length]] += 1;
    assigned += 1;
  }

  if (count >= 12) {
    for (const profile of PROFILE_ORDER) {
      if (counts[profile] > 0) continue;
      const donor = [...PROFILE_ORDER].sort((left, right) => counts[right] - counts[left])[0];
      if (counts[donor] > 1) {
        counts[donor] -= 1;
        counts[profile] += 1;
      }
    }
  }
  return counts;
}

function runtimeSchedule(categorySlug: string, targetCount: number): RuntimeProfile[] {
  const count = Math.max(1, Math.floor(targetCount));
  const target = allocationCounts(categorySlug, count);
  const assigned = Object.fromEntries(PROFILE_ORDER.map((profile) => [profile, 0])) as Record<RuntimeProfile, number>;
  const schedule: RuntimeProfile[] = [];
  const rotation = stableHash(categorySlug) % PROFILE_ORDER.length;
  const tieOrder = [...PROFILE_ORDER.slice(rotation), ...PROFILE_ORDER.slice(0, rotation)];

  for (let slot = 0; slot < count; slot += 1) {
    const eligible = tieOrder.filter((profile) => assigned[profile] < target[profile]);
    eligible.sort((left, right) => {
      const leftNeed = target[left] * ((slot + 1) / count) - assigned[left];
      const rightNeed = target[right] * ((slot + 1) / count) - assigned[right];
      return rightNeed - leftNeed || tieOrder.indexOf(left) - tieOrder.indexOf(right);
    });
    const selected = eligible[0] ?? PROFILE_ORDER[0];
    assigned[selected] += 1;
    schedule.push(selected);
  }
  return schedule;
}

export function plannedRuntimeProfile(categorySlug: string, slotIndex: number, targetCount: number): RuntimeProfile {
  const schedule = runtimeSchedule(categorySlug, targetCount);
  return schedule[clamp(Math.floor(slotIndex), 0, schedule.length - 1)];
}

export function runtimeProfileForSeconds(durationSeconds: number): RuntimeProfile | null {
  return PROFILE_ORDER.find((profile) => {
    const range = RUNTIME_PROFILE_RANGES[profile];
    return durationSeconds >= range.min && durationSeconds <= range.max;
  }) ?? null;
}

export function planCardDuration(
  categorySlug: string,
  slotIndex: number,
  targetCount: number,
  concept: DurationPlanningConcept,
): DurationPlan {
  const runtimeProfile = plannedRuntimeProfile(categorySlug, slotIndex, targetCount);
  const range = RUNTIME_PROFILE_RANGES[runtimeProfile];
  const speechSeconds = Math.ceil(clamp(concept.spokenWordTarget, 0, 180) / 2.4);
  const visualSeconds = 7
    + clamp(concept.proofBeatCount, 1, 4) * 4
    + Math.max(0, clamp(concept.shotCount, 3, 8) - 3) * 2
    + Math.max(0, clamp(concept.locationCount, 1, 3) - 1) * 3
    + clamp(concept.resetCount, 0, 4) * 2;
  const contentMinimum = Math.max(speechSeconds + 3, visualSeconds);
  if (contentMinimum > range.max) {
    throw new Error("concept_exceeds_runtime_profile");
  }
  const spreadTarget = range.min
    + (stableHash(`${categorySlug}:${slotIndex}:${concept.conceptId}`) % (range.max - range.min + 1));
  return {
    runtimeProfile,
    targetSeconds: clamp(Math.max(contentMinimum, spreadTarget), range.min, range.max),
    plannerVersion: DURATION_PLANNER_VERSION,
  };
}

function floorFive(value: number): number {
  return Math.floor(value / 5) * 5;
}

function ceilFive(value: number): number {
  return Math.ceil(value / 5) * 5;
}

export function buildProductionEstimate(
  card: Pick<IdeaCard, "durationSeconds" | "difficulty" | "requiredItems" | "steps" | "shootFormat">,
  concept: Pick<DurationPlanningConcept, "locationCount" | "cameraSetupCount" | "resetCount">,
): IdeaCardProductionEstimate {
  const formatBase: Record<string, number> = {
    talking_head: 4,
    voiceover: 5,
    hands_only: 5,
    pov: 6,
    screen_recording: 4,
    object_led: 5,
    text_led: 3,
    interview: 10,
  };
  const base = formatBase[String(card.shootFormat ?? "").toLowerCase()] ?? 6;
  const locations = clamp(concept.locationCount, 1, 3);
  const setups = clamp(concept.cameraSetupCount, 1, 5);
  const resets = clamp(concept.resetCount, 0, 4);
  const propOverhead = Math.max(0, card.requiredItems.length - 2);
  const difficultyMultiplier = card.difficulty === "advanced" ? 1.3 : card.difficulty === "medium" ? 1.15 : 1;
  const lowRaw = (base + card.steps.length * 1.5 + (setups - 1) * 2 + (locations - 1) * 6 + resets * 2 + propOverhead + card.durationSeconds * 2 / 60) * difficultyMultiplier;
  const highRaw = (base + card.steps.length * 2.75 + (setups - 1) * 4 + (locations - 1) * 10 + resets * 4 + propOverhead * 2 + card.durationSeconds * 4 / 60) * difficultyMultiplier;
  const captureMinutesLow = Math.max(10, floorFive(lowRaw));
  const captureMinutesHigh = Math.max(captureMinutesLow + 5, ceilFive(highRaw));
  const editMinutesLow = Math.max(10, floorFive(6 + card.steps.length * 2 + card.durationSeconds * 0.25));
  const editMinutesHigh = Math.max(editMinutesLow + 5, ceilFive(10 + card.steps.length * 4 + card.durationSeconds * 0.5));
  return {
    captureMinutesLow,
    captureMinutesHigh,
    editMinutesLow,
    editMinutesHigh,
    confidence: "low",
    version: PRODUCTION_ESTIMATE_VERSION,
  };
}

export function timingFingerprint(card: Pick<IdeaCard, "durationSeconds" | "steps" | "shootFormat">): string {
  if (!card.durationSeconds) return "invalid";
  const beats = card.steps
    .map((step) => `${step.stage}:${Math.round((step.endSecond / card.durationSeconds) * 100) / 100}`)
    .join("|");
  return `${card.shootFormat ?? "unknown"}|${beats}`;
}

export function analyzeDurationDistribution(
  durations: number[],
  timingFingerprints: string[] = [],
): DurationDistributionResult {
  const profileCounts = Object.fromEntries(PROFILE_ORDER.map((profile) => [profile, 0])) as Record<RuntimeProfile, number>;
  const exactSecondCounts: Record<string, number> = {};
  for (const duration of durations) {
    const profile = runtimeProfileForSeconds(duration);
    if (profile) profileCounts[profile] += 1;
    exactSecondCounts[String(duration)] = (exactSecondCounts[String(duration)] ?? 0) + 1;
  }
  const maxExactCount = Math.max(0, ...Object.values(exactSecondCounts));
  const distinctProfiles = Object.values(profileCounts).filter((count) => count > 0).length;
  const maxExactSecondShare = durations.length ? maxExactCount / durations.length : 0;
  const issueCodes: string[] = [];
  if (durations.length >= 12 && distinctProfiles < 3) issueCodes.push("batch_duration_profiles_collapsed");
  if (durations.length >= 10 && maxExactSecondShare > 0.2) issueCodes.push("batch_exact_duration_concentration");
  const usableFingerprints = timingFingerprints.filter(Boolean);
  if (new Set(usableFingerprints).size < usableFingerprints.length) issueCodes.push("batch_timing_template_duplicate");
  return { profileCounts, exactSecondCounts, distinctProfiles, maxExactSecondShare, issueCodes };
}