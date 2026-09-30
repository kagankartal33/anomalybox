export type QualityDecision = "approve" | "refine" | "reject" | "human_review_required";

export type SafetySeverity = "clear" | "watch" | "refine" | "human_review";

function clampQuality(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

/**
 * Schema-v2 cards express safety through the local classifier and claim gates.
 * They must not be penalized for omitting the legacy `brand_safety` mega-payload.
 */
export function schemaV2BrandSafetyScore(params: {
  flagCount: number;
  severity: SafetySeverity;
  categoryRiskLevel?: string;
}) {
  const severityPenalty = {
    clear: 0,
    watch: 4,
    refine: 12,
    human_review: 30,
  }[params.severity];
  const restrictedPenalty = params.categoryRiskLevel === "restricted" ? 30 : 0;
  return clampQuality(100 - Math.max(0, params.flagCount) * 10 - severityPenalty - restrictedPenalty);
}

export function resolveQualityDecision(
  decision: QualityDecision,
  secondOpinionRequired: boolean,
): QualityDecision {
  if (decision === "reject") return "reject";
  return secondOpinionRequired ? "human_review_required" : decision;
}

export function candidateStatusForQualityDecision(decision: QualityDecision) {
  if (decision === "approve") return "ready";
  if (decision === "refine") return "needs_refinement";
  if (decision === "reject") return "blocked";
  return "human_review_required";
}