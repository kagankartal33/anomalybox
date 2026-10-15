import { hookFits, LANE_MATRIX, MODE_MATRIX } from "./compatibility";
import { ALL_HOOKS, getHookById } from "./taxonomy";
import type { CreatorMode, CreatorPersona, HookTypeDefinition, PurchaseLane } from "./types";

export function recommendHooks(input: {
  lane?: PurchaseLane;
  mode?: CreatorMode;
  persona?: CreatorPersona;
  limit?: number;
}): HookTypeDefinition[] {
  const limit = input.limit ?? 3;
  const ranked = ALL_HOOKS.map((hook) => ({
    hook,
    ...hookFits(hook, input),
  }))
    .filter((row) => row.ok)
    .sort((a, b) => b.score - a.score);

  const preferredIds = [
    ...(input.lane ? LANE_MATRIX[input.lane].topHookIds : []),
    ...(input.mode ? MODE_MATRIX[input.mode].bestHookIds : []),
  ];

  const preferred = preferredIds
    .map((id) => getHookById(id))
    .filter((hook): hook is HookTypeDefinition => Boolean(hook))
    .filter((hook) => hookFits(hook, input).ok);

  const merged: HookTypeDefinition[] = [];
  for (const hook of [...preferred, ...ranked.map((row) => row.hook)]) {
    if (!merged.some((item) => item.id === hook.id)) merged.push(hook);
    if (merged.length >= limit) break;
  }
  return merged;
}

export function evaluateHookFit(
  hookId: string | undefined,
  ctx: { lane?: PurchaseLane; mode?: CreatorMode; persona?: CreatorPersona },
) {
  const hook = hookId ? getHookById(hookId) : undefined;
  if (!hook) {
    return { ok: false, score: 0, reasons: hookId ? [`Unknown hook: ${hookId}`] : ["No hookId"], hook: undefined };
  }
  return { ...hookFits(hook, ctx), hook };
}
