import { PROMPT_VERSION } from "./contracts";

export type GenerationProvenance = {
  isV22Generated: boolean;
  runId: string | null;
  provider: string | null;
  model: string | null;
  promptVersion: string | null;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function generationProvenance(decisionTrace: unknown): GenerationProvenance {
  const generation = record(record(decisionTrace).generation);
  const promptVersion = optionalString(generation.prompt_version ?? generation.promptVersion);
  const runId = optionalString(generation.run_id ?? generation.runId);
  return {
    isV22Generated: promptVersion === PROMPT_VERSION && Boolean(runId),
    runId,
    provider: optionalString(generation.provider),
    model: optionalString(generation.model),
    promptVersion,
  };
}