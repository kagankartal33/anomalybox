import { automaticGenerationBlockers, objectRecord } from "./automatic-policy.ts";
import { conceptPlanSchema } from "./contracts.ts";
import { creativeRecipeSchema } from "./creative-taxonomy.ts";
import type { QualityV22Options } from "../idea-card/quality-v2-2.ts";

type GenerationQualityContext = Pick<QualityV22Options, "creativeRecipe" | "concept"> & {
  additionalHardGateCodes: string[];
};

/** Preserve invalid provenance as a failure instead of silently scoring it as legacy. */
export function generationQualityContext(trace: unknown): GenerationQualityContext {
  const row = objectRecord(trace);
  const generation = objectRecord(row.generation);
  const gate = objectRecord(row.generation_gate);
  const hardGateCodes = Array.isArray(gate.hardGateCodes)
    ? gate.hardGateCodes.filter((code): code is string => typeof code === "string") : [];
  if (gate.final_decision === "reject") hardGateCodes.push("generation_rejected");
  const hasCreativeProvenance = row.import_source === "verified_generation"
    || generation.taxonomy_version !== undefined || generation.creative_recipe !== undefined;
  if (!hasCreativeProvenance) return { additionalHardGateCodes: hardGateCodes };

  const recipe = creativeRecipeSchema.safeParse(generation.creative_recipe);
  if (!recipe.success) {
    hardGateCodes.push(generation.creative_recipe == null ? "generation_recipe_missing" : "generation_recipe_invalid");
    hardGateCodes.push(...recipe.error.issues.map(issue => issue.message).filter(code => code.startsWith("recipe_")));
  }
  const concept = conceptPlanSchema.safeParse(generation.concept_plan);
  if (!concept.success) hardGateCodes.push(generation.concept_plan == null ? "generation_concept_missing" : "generation_concept_invalid");
  return {
    creativeRecipe: recipe.success ? recipe.data : null,
    concept: concept.success ? concept.data : undefined,
    additionalHardGateCodes: [...new Set(hardGateCodes)],
  };
}

/** Audit against candidate-owned lane identity, never only the card's own labels. */
export function stockAuditQualityContext(card: unknown, candidate: unknown, contentHash: string): QualityV22Options {
  const stored = objectRecord(candidate);
  const rawCard = objectRecord(card);
  const context = generationQualityContext(stored.decision_trace);
  const hardGateCodes = [...context.additionalHardGateCodes];
  const issueCodes: string[] = [];
  if (!stored.id) hardGateCodes.push("stock_candidate_missing");
  if (rawCard.schemaVersion === 2) {
    const category = objectRecord(stored.category).slug;
    const persona = objectRecord(stored.persona).slug;
    if (!category || !persona) hardGateCodes.push("stock_lane_unverified");
    else if (rawCard.category !== category || rawCard.personaSlug !== persona
      || rawCard.platform !== stored.platform) hardGateCodes.push("stock_card_lane_mismatch");
  }
  if (stored.safety_status && stored.safety_status !== "SAFE") hardGateCodes.push("stock_candidate_safety_not_safe");
  if (objectRecord(stored.decision_trace).import_source === "verified_generation") {
    issueCodes.push(...automaticGenerationBlockers(stored.decision_trace, contentHash));
  }
  return { ...context, additionalHardGateCodes: [...new Set(hardGateCodes)], additionalIssueCodes: issueCodes };
}