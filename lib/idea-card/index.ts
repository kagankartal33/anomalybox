export type {
  AdaptResult,
  IdeaCard,
  IdeaCardDifficulty,
  IdeaCardProductionEstimate,
  IdeaCardStage,
  IdeaCardStep,
  QualityIssue,
  QualityIssueSeverity,
} from "./types";

export { adaptLegacyIdeaCard } from "./adapt-legacy";
export { formatTime, formatTimeRange, parseTimeRange, parseTimeToSeconds } from "./time";
export { normalizeText, wordCount, jaccardSimilarity, canonicalizeForComparison } from "./text";
export { stageLabel, mapLegacyStage } from "./stages";
export {
  validateIdeaCardQuality,
  hasBlockingQualityIssues,
  scoreIdeaCard,
  evaluateIdeaCardV22,
  QUALITY_GATE_VERSION,
  BANNED_VAGUE_PHRASES,
} from "./quality";
export type { ScoreResult, QualityMode } from "./quality";
export type { QualityV22Result, QualityV22Options, QualityDecision, CraftDimensions } from "./quality";
export { presentIdeaCard } from "./present";
export type { PresentedCard, PresentedStep } from "./present";
export { isRenderableStockCard } from "./stock";
export {
  findBannedPhrase,
  stripBannedPhrases,
  META_DIALOGUE_PHRASES,
  GENERIC_CTA_PHRASES,
} from "./banned-phrases";
export {
  scanTextResidue,
  scanIdeaCardResidue,
  firstResidueMatch,
  stripResidue,
  hasBlockingResidue,
  LLM_STYLE_WORDS,
  RESIDUE_ISSUE_CODES,
} from "./ai-residue";
export type { ResidueHit, ResidueKind, CardResidueHit } from "./ai-residue";
export { ideaCardSchema, ideaCardStepSchema, ideaCardProductionEstimateSchema } from "./schema";
export {
  DURATION_PLANNER_VERSION,
  PRODUCTION_ESTIMATE_VERSION,
  RUNTIME_PROFILES,
  RUNTIME_PROFILE_RANGES,
  analyzeDurationDistribution,
  buildProductionEstimate,
  planCardDuration,
  plannedRuntimeProfile,
  runtimeProfileForSeconds,
  timingFingerprint,
} from "./duration-planner";
export type {
  DurationDistributionResult,
  DurationPlan,
  DurationPlanningConcept,
  RuntimeProfile,
} from "./duration-planner";
