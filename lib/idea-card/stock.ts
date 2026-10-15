export function isRenderableStockCard(card: unknown, title?: string): boolean {
  if (!card || typeof card !== "object" || Array.isArray(card)) return false;
  const record = card as Record<string, unknown>;
  const resolvedTitle = String(record.title ?? title ?? "").trim();
  if (resolvedTitle.length < 2) return false;
  const steps = record.steps;
  const scenes = record.scene_script;
  const hasSteps = Array.isArray(steps) && steps.length >= 3;
  const hasScenes = Array.isArray(scenes) && scenes.length >= 1;
  return hasSteps || hasScenes;
}
