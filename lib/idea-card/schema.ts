import { z } from "zod";

const nullableOptionalString = z.preprocess((val) => {
  if (val === null || val === undefined || (typeof val === "string" && !val.trim())) {
    return undefined;
  }
  return typeof val === "string" ? val.trim() : val;
}, z.string().optional());

export const ideaCardStepSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().min(1),
  stage: z.enum(["hook", "context", "demonstration", "takeaway", "cta"]),
  startSecond: z.number().int().min(0),
  endSecond: z.number().int().min(1),
  purpose: z.string().min(1),
  goal: z.string().min(1),
  action: z.string().min(1),
  spokenLine: nullableOptionalString,
  shot: nullableOptionalString,
  onScreenText: nullableOptionalString,
  editNote: nullableOptionalString,
  performanceNote: nullableOptionalString,
});

export const productionEstimateSchema = z.object({
  version: z.string().min(1),
  captureMinutesLow: z.number().min(0),
  captureMinutesHigh: z.number().min(0),
  editMinutesLow: z.number().min(0),
  editMinutesHigh: z.number().min(0),
  totalProductionMinutesLow: z.number().min(0).optional(),
  totalProductionMinutesHigh: z.number().min(0).optional(),
  confidence: z.enum(["low", "medium", "high"]).or(z.string()),
  riskDrivers: z.array(z.string()).optional(),
}).refine(
  (estimate) => estimate.captureMinutesLow <= estimate.captureMinutesHigh,
  { message: "captureMinutesLow must be less than or equal to captureMinutesHigh" }
).refine(
  (estimate) => estimate.editMinutesLow <= estimate.editMinutesHigh,
  { message: "editMinutesLow must be less than or equal to editMinutesHigh" }
);

export const ideaCardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  schemaVersion: z.number().int().min(2),
  conceptSummary: z.string().min(1),
  viewerTakeaway: z.string().min(1),
  format: z.string().min(1),
  platform: z.string().min(1),
  category: z.string().min(1),
  personaSlug: z.string().optional(),
  audience: z.string().min(1),
  durationSeconds: z.number().int().min(10).max(60),
  difficulty: z.enum(["easy", "medium", "advanced"]),
  requiredItems: z.array(z.string().min(1)).min(1),
  hookId: z.string().min(1),
  shootFormat: z.string().min(1),
  presenceMode: z.string().optional(),
  whyItWorks: z.string().optional(),
  overallProductionNotes: z.array(z.string().min(1)).min(1),
  steps: z.array(ideaCardStepSchema).min(3).max(8),
  productionEstimate: productionEstimateSchema.optional(),
});

export type IdeaCardSchema = z.infer<typeof ideaCardSchema>;
