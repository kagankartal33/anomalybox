import { z } from "zod";
import { ideaCardSchema } from "../idea-card/schema";

export const PROMPT_VERSION = "idea-card-premium-v2.2.0";

export const conceptPlanSchema = z.object({
  conceptId: z.string().trim().min(1),
  title: z.string().trim().min(2).max(80),
  premise: z.string().trim().min(12).max(320),
  hookId: z.string().trim().min(1),
  shootFormat: z.string().trim().min(1),
  proofPlan: z.string().trim().min(8).max(240),
  viewerTakeaway: z.string().trim().min(6).max(240),
  mechanismIds: z.array(z.string().trim().min(1)).max(8),
  riskNotes: z.array(z.string().trim().min(1).max(160)).max(6),
});

export const conceptSetSchema = z.object({ concepts: z.array(conceptPlanSchema).length(3) });

export const criticResultSchema = z.object({
  decision: z.enum(["pass", "revise", "reject"]),
  issueCodes: z.array(z.string().regex(/^[a-z0-9_]{2,64}$/)).max(12),
  editInstructions: z.array(z.string().trim().min(4).max(240)).max(8),
});

export const generatedIdeaEnvelopeSchema = z.object({
  externalIdeaId: z.string().trim().min(1),
  categorySlug: z.string().trim().min(1),
  personaSlug: z.string().trim().min(1),
  platform: z.string().trim().min(1),
  language: z.string().trim().min(2),
  concept: conceptPlanSchema,
  card: ideaCardSchema,
  critic: criticResultSchema,
  generation: z.object({
    runId: z.string().uuid(),
    profileSlug: z.string().trim().min(1),
    provider: z.string().trim().min(1),
    model: z.string().trim().min(1),
    promptVersion: z.literal(PROMPT_VERSION),
    schemaVersion: z.literal(2),
    repaired: z.boolean(),
  }),
});

export type GeneratedIdeaEnvelope = z.infer<typeof generatedIdeaEnvelopeSchema>;

const stepProperties = {
  id: { type: "string", minLength: 1 },
  order: { type: "integer", minimum: 1 },
  stage: { type: "string", enum: ["hook", "context", "demonstration", "takeaway", "cta", "custom"] },
  startSecond: { type: "integer", minimum: 0 },
  endSecond: { type: "integer", minimum: 1 },
  purpose: { type: "string", minLength: 6, maxLength: 240 },
  goal: { type: "string", minLength: 6, maxLength: 240 },
  action: { type: "string", minLength: 6, maxLength: 320 },
  spokenLine: { type: "string" },
  shot: { type: "string" },
  onScreenText: { type: "string" },
  editNote: { type: "string" },
  performanceNote: { type: "string" },
} as const;

export const ideaCardJsonSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "conceptSummary", "format", "category", "platform", "audience", "durationSeconds", "difficulty", "requiredItems", "viewerTakeaway", "steps", "overallProductionNotes", "whyItWorks", "hookId", "shootFormat", "presenceMode", "personaSlug", "schemaVersion"],
  properties: {
    id: { type: "string", minLength: 1 },
    title: { type: "string", minLength: 2, maxLength: 80 },
    conceptSummary: { type: "string", minLength: 12, maxLength: 320 },
    format: { type: "string", minLength: 2, maxLength: 80 },
    category: { type: "string", minLength: 2, maxLength: 80 },
    platform: { type: "string", minLength: 1 },
    audience: { type: "string", minLength: 1 },
    durationSeconds: { type: "integer", minimum: 10, maximum: 60 },
    difficulty: { type: "string", enum: ["easy", "medium", "advanced"] },
    requiredItems: { type: "array", maxItems: 12, items: { type: "string", minLength: 1 } },
    viewerTakeaway: { type: "string", minLength: 6, maxLength: 240 },
    steps: {
      type: "array", minItems: 3, maxItems: 8,
      items: { type: "object", additionalProperties: false, required: Object.keys(stepProperties), properties: stepProperties },
    },
    overallProductionNotes: { type: "array", maxItems: 10, items: { type: "string", minLength: 1 } },
    whyItWorks: { type: "string", minLength: 1 },
    hookId: { type: "string", minLength: 1 },
    shootFormat: { type: "string", minLength: 1 },
    presenceMode: { type: "string", minLength: 1 },
    personaSlug: { type: "string", minLength: 1 },
    schemaVersion: { type: "integer", const: 2 },
  },
};

export const conceptSetJsonSchema: Record<string, unknown> = {
  type: "object", additionalProperties: false, required: ["concepts"],
  properties: {
    concepts: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        required: ["conceptId", "title", "premise", "hookId", "shootFormat", "proofPlan", "viewerTakeaway", "mechanismIds", "riskNotes"],
        properties: {
          conceptId: { type: "string" }, title: { type: "string" }, premise: { type: "string" },
          hookId: { type: "string" }, shootFormat: { type: "string" }, proofPlan: { type: "string" },
          viewerTakeaway: { type: "string" }, mechanismIds: { type: "array", items: { type: "string" } },
          riskNotes: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

export const criticResultJsonSchema: Record<string, unknown> = {
  type: "object", additionalProperties: false, required: ["decision", "issueCodes", "editInstructions"],
  properties: {
    decision: { type: "string", enum: ["pass", "revise", "reject"] },
    issueCodes: { type: "array", maxItems: 12, items: { type: "string", pattern: "^[a-z0-9_]{2,64}$" } },
    editInstructions: { type: "array", maxItems: 8, items: { type: "string", maxLength: 240 } },
  },
};