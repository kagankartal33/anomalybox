export type QualificationContract = {
  promptVersion: string;
  schemaVersion: number;
  qualityGateVersion: string;
};

export function profileMatchesQualificationContract(
  profile: Record<string, unknown>,
  contract: QualificationContract,
) {
  return profile.qualification_status === "approved" &&
    profile.enabled !== false &&
    profile.qualified_prompt_version === contract.promptVersion &&
    Number(profile.qualified_schema_version) === contract.schemaVersion &&
    profile.qualified_quality_gate_version === contract.qualityGateVersion &&
    Boolean(profile.qualification_eval_id);
}

export function isQualificationGoldEligible(
  rating: {
    source: string;
    category_slug: string;
    generation_run_id: string | null;
    provider: string | null;
    model: string | null;
    prompt_version: string | null;
  },
  expected: {
    pilotCategories: readonly string[];
    runIds: ReadonlySet<string>;
    provider: string;
    model: string;
    promptVersion: string;
  },
) {
  if (!expected.pilotCategories.includes(rating.category_slug)) return false;
  if (rating.source === "existing_stock") return true;
  return rating.source === "generated" &&
    Boolean(rating.generation_run_id) &&
    expected.runIds.has(String(rating.generation_run_id)) &&
    rating.provider === expected.provider &&
    rating.model === expected.model &&
    rating.prompt_version === expected.promptVersion;
}