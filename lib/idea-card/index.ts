export * from "./types";
export * from "./schema";
export * from "./duration-planner";
export * from "./review-policy";
export * from "./content-safety";

export function formatTimeRange(startSecond: number, endSecond: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const formatSec = (s: number) => `${Math.floor(s / 60)}:${pad(s % 60)}`;
  return `${formatSec(startSecond)} - ${formatSec(endSecond)}`;
}

export function stageLabel(stage: string, customLabel?: string | null): string {
  if (customLabel && customLabel.trim()) return customLabel.trim();
  switch (stage) {
    case "hook": return "Opening Hook";
    case "context": return "Context Setup";
    case "demonstration": return "Demonstration";
    case "takeaway": return "Core Takeaway";
    case "cta": return "Call To Action";
    default: return stage.charAt(0).toUpperCase() + stage.slice(1);
  }
}

