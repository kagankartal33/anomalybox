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

function optionalUuid(value: unknown): string | null {
  const candidate = optionalString(value);
  return candidate && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)
    ? candidate
    : null;
}

export function generationProvenance(decisionTrace: unknown): GenerationProvenance {
  const generation = record(record(decisionTrace).generation);
  const promptVersion = optionalString(generation.prompt_version ?? generation.promptVersion);
  const runId = optionalUuid(generation.run_id ?? generation.runId);
  return {
    isV22Generated: [PROMPT_VERSION, "idea-card-premium-v2.3.1-automatic", "idea-card-premium-v2.3-automatic", "idea-card-premium-v2.2.0"].includes(promptVersion ?? "") && Boolean(runId),
    runId,
    provider: optionalString(generation.provider),
    model: optionalString(generation.model),
    promptVersion,
  };
}
