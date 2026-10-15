import type { DurationPlanningConcept, DurationPlan } from "../idea-card/duration-planner";

export const CONCEPT_RANKER_VERSION = "concept-ranker-v2" as const;

export type RankableConcept = DurationPlanningConcept & {
  title: string;
  premise: string;
  firstFramePlan: string;
  proofPlan: string;
  viewerTakeaway: string;
};

export type ConceptRankingDimensions = {
  originality: number;
  promiseProofCoherence: number;
  executionFit: number;
  specificity: number;
  productionPracticality: number;
};

export type RankedConcept<T extends RankableConcept> = {
  concept: T;
  candidateText: string;
  maximum: number;
  eligible: boolean;
  selectionScore: number;
  dimensions: ConceptRankingDimensions;
  durationPlan: DurationPlan | null;
};

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function tokens(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
}

export function conceptTokenSimilarity(left: string, right: string): number {
  const leftTokens = new Set(tokens(left));
  const rightTokens = new Set(tokens(right));
  if (!leftTokens.size || !rightTokens.size) return 0;
  let overlap = 0;
  for (const token of leftTokens) if (rightTokens.has(token)) overlap += 1;
  return Math.round((2 * overlap / (leftTokens.size + rightTokens.size)) * 10_000) / 10_000;
}

function boundedCoherence(overlap: number): number {
  // Related plans need a shared semantic spine, but near-copy fields are not
  // rewarded. The useful band is deliberately broad for natural paraphrases.
  if (overlap <= 0.04) return overlap / 0.04 * 0.35;
  if (overlap <= 0.42) return 0.35 + ((overlap - 0.04) / 0.38) * 0.65;
  return clamp(1 - (overlap - 0.42) / 0.45);
}

function specificityScore(concept: RankableConcept): number {
  const values = [concept.title, concept.premise, concept.firstFramePlan, concept.proofPlan, concept.viewerTakeaway];
  const allTokens = tokens(values.join(" "));
  if (!allTokens.length) return 0;
  const uniqueRatio = new Set(allTokens).size / allTokens.length;
  const fieldDetail = values.filter((value) => tokens(value).length >= 4).length / values.length;
  const observableDetail = /\b(show|reveal|compare|measure|place|open|cut|pour|apply|hold|screen|frame|map|result|before|after)\b/i.test(values.join(" ")) ? 1 : 0.35;
  return clamp(uniqueRatio * 0.45 + fieldDetail * 0.35 + observableDetail * 0.2);
}

function executionFitScore(concept: RankableConcept, targetSeconds: number): number {
  const speechRate = concept.spokenWordTarget / Math.max(1, targetSeconds);
  const speechFit = speechRate <= 2.4 ? 1 : clamp(1 - (speechRate - 2.4) / 0.8);
  const secondsPerShot = targetSeconds / Math.max(1, concept.shotCount);
  const shotFit = secondsPerShot >= 2 && secondsPerShot <= 9
    ? 1
    : clamp(1 - Math.min(Math.abs(secondsPerShot - 2), Math.abs(secondsPerShot - 9)) / 5);
  const proofDensity = concept.proofBeatCount / Math.max(1, concept.shotCount);
  const proofFit = proofDensity >= 0.18 && proofDensity <= 0.67 ? 1 : 0.45;
  return clamp(speechFit * 0.5 + shotFit * 0.3 + proofFit * 0.2);
}

function productionPracticalityScore(concept: RankableConcept): number {
  const complexity = Math.max(0, concept.locationCount - 1) * 0.24
    + Math.max(0, concept.cameraSetupCount - 1) * 0.1
    + concept.resetCount * 0.08;
  return clamp(1 - complexity);
}

export function rankConceptPlans<T extends RankableConcept>(input: {
  concepts: readonly T[];
  comparisonTexts: readonly string[];
  durationPlanFor: (concept: T) => DurationPlan;
  duplicateThreshold?: number;
}): RankedConcept<T>[] {
  const duplicateThreshold = input.duplicateThreshold ?? 0.78;
  return input.concepts.map((concept) => {
    const candidateText = `${concept.title} ${concept.premise} ${concept.firstFramePlan} ${concept.proofPlan} ${concept.viewerTakeaway}`;
    const maximum = input.comparisonTexts.reduce(
      (score, other) => Math.max(score, conceptTokenSimilarity(candidateText, other)),
      0,
    );
    let durationPlan: DurationPlan | null = null;
    try {
      durationPlan = input.durationPlanFor(concept);
    } catch {
      durationPlan = null;
    }
    const promiseProofOverlap = conceptTokenSimilarity(
      `${concept.premise} ${concept.firstFramePlan}`,
      `${concept.proofPlan} ${concept.viewerTakeaway}`,
    );
    const dimensions: ConceptRankingDimensions = {
      originality: clamp(1 - maximum / duplicateThreshold),
      promiseProofCoherence: boundedCoherence(promiseProofOverlap),
      executionFit: durationPlan ? executionFitScore(concept, durationPlan.targetSeconds) : 0,
      specificity: specificityScore(concept),
      productionPracticality: productionPracticalityScore(concept),
    };
    const selectionScore = dimensions.originality * 30
      + dimensions.promiseProofCoherence * 25
      + dimensions.executionFit * 20
      + dimensions.specificity * 15
      + dimensions.productionPracticality * 10;
    return {
      concept,
      candidateText,
      maximum,
      eligible: maximum < duplicateThreshold && durationPlan !== null,
      selectionScore: Math.round(selectionScore * 100) / 100,
      dimensions,
      durationPlan,
    };
  }).sort((left, right) => right.selectionScore - left.selectionScore || left.maximum - right.maximum || left.concept.conceptId.localeCompare(right.concept.conceptId));
}
