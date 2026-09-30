export type GoldSetSource = "existing" | "generated";

export type GoldLaneCounts = {
  existing: number;
  generated: number;
};

export const GOLD_SET_SOURCE_TARGET = 20;

export function goldLaneNeedsRatings(counts: GoldLaneCounts): boolean {
  return counts.existing < GOLD_SET_SOURCE_TARGET || counts.generated < GOLD_SET_SOURCE_TARGET;
}

export function goldSetTargetSource(counts: GoldLaneCounts): GoldSetSource {
  if (counts.existing >= GOLD_SET_SOURCE_TARGET) return "generated";
  if (counts.generated >= GOLD_SET_SOURCE_TARGET) return "existing";
  return counts.generated < counts.existing ? "generated" : "existing";
}

export function balancedGoldLaneProgress(counts: GoldLaneCounts): number {
  return Math.min(counts.existing, GOLD_SET_SOURCE_TARGET)
    + Math.min(counts.generated, GOLD_SET_SOURCE_TARGET);
}