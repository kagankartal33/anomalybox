import type { IdeaCard } from "../lib/idea-card/types";
import {
  planCardDuration,
  plannedRuntimeProfile,
  buildProductionEstimate,
} from "../lib/idea-card/duration-planner";
import type { PurchaseLane } from "../lib/algorithmic-reason/types";

export type BuildCardOptions = {
  lane: PurchaseLane;
  personaSlug: string;
  index: number;
  slotIndex: number;
  targetCount: number;
};

export function buildCard(options: BuildCardOptions): IdeaCard {
  const { lane, personaSlug, index, slotIndex, targetCount } = options;
  const runtimeProfile = plannedRuntimeProfile(lane, slotIndex, targetCount);
  const concept = {
    conceptId: `${lane}-${personaSlug}-${index}`,
    runtimeProfile,
    proofBeatCount: 1,
    spokenWordTarget: 20,
    shotCount: 4,
    locationCount: 1,
    cameraSetupCount: 1,
    resetCount: 0,
    shootFormat: "hands_only",
  };
  const durationPlan = planCardDuration(lane, slotIndex, targetCount, concept);
  const duration = durationPlan.targetSeconds;
  const stepCount = duration >= 28 ? 5 : 4;
  const stepDuration = Math.floor(duration / stepCount);

  const steps = Array.from({ length: stepCount }, (_, i) => {
    const isFirst = i === 0;
    const isLast = i === stepCount - 1;
    const startSecond = i * stepDuration;
    const endSecond = isLast ? duration : (i + 1) * stepDuration;
    return {
      id: `s${i + 1}`,
      order: i + 1,
      stage: isFirst ? ("hook" as const) : isLast ? ("takeaway" as const) : ("demonstration" as const),
      startSecond,
      endSecond,
      purpose: isFirst ? "Introduce the comparison" : isLast ? "Deliver payoff" : "Demonstrate application",
      goal: isFirst ? "Grab viewer attention" : isLast ? "Reveal smoother texture" : "Show side by side application",
      action: isFirst
        ? "Hold both samples beside the mirror in locked frame"
        : isLast
        ? "Point to the smoother side and show the final result"
        : "Apply one measured drop on each side to compare textures",
      spokenLine: "Notice the difference in texture and finish.",
      shot: "Locked close-up",
      onScreenText: isFirst ? "Texture comparison" : undefined,
    };
  });

  const card: IdeaCard = {
    id: `card-${lane}-${personaSlug}-${index}`,
    schemaVersion: 2,
    title: `${lane.charAt(0).toUpperCase() + lane.slice(1)} Test ${index}`,
    conceptSummary: `A practical test comparing techniques and revealing observable differences for ${personaSlug}.`,
    viewerTakeaway: "Clear visible side-by-side comparison before making a decision.",
    format: "Reels",
    platform: "instagram_reels",
    category: lane,
    personaSlug,
    audience: `${lane} enthusiasts and creators`,
    durationSeconds: duration,
    difficulty: "easy",
    requiredItems: ["Mirror", "Test sample", "Measuring tool"],
    hookId: "visible_constraint",
    shootFormat: "hands_only",
    presenceMode: "editorial_insider",
    whyItWorks: "Strong hook with an observable side-by-side payoff keeps viewers engaged.",
    overallProductionNotes: [
      "Shoot original vertical 9:16 footage in natural daylight.",
      "Keep text and key demonstration elements within Instagram safe zones.",
    ],
    steps,
  };

  card.productionEstimate = buildProductionEstimate(card, {
    locationCount: 1,
    cameraSetupCount: 1,
    resetCount: 0,
  });

  return card;
}
