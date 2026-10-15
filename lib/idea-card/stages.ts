import type { IdeaCardStage } from "./types";

const STAGE_LABELS: Record<Exclude<IdeaCardStage, "custom">, string> = {
  hook: "Opening",
  context: "Setup",
  demonstration: "Proof",
  takeaway: "Takeaway",
  cta: "Close",
};

export function stageLabel(stage: IdeaCardStage, customStageLabel?: string): string {
  if (stage === "custom") return customStageLabel?.trim() || "Scene";
  return STAGE_LABELS[stage] || "Scene";
}

export function mapLegacyStage(value: unknown, index: number, total: number): IdeaCardStage {
  const text = String(value ?? "").toLowerCase();

  if (/\bhook|open|opening|attention\b/.test(text)) return "hook";
  if (/\bsetup|context|premise|intro\b/.test(text)) return "context";
  if (/\bproof|demo|demonstrat|test|compare|middle|body\b/.test(text)) return "demonstration";
  if (/\btakeaway|payoff|result|reveal\b/.test(text)) return "takeaway";
  if (/\bcta|call to action|comment|save|end\b/.test(text)) return "cta";

  // Position fallback for unlabeled legacy beats
  if (index === 0) return "hook";
  if (index === total - 1) return "cta";
  if (index === 1) return "context";
  if (index >= total - 2) return "takeaway";
  return "demonstration";
}
