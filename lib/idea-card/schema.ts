import { z } from "zod";

const optionalTrimmedString = z.string().trim().min(1).nullish().transform((value) => value ?? undefined);

export const ideaCardProductionEstimateSchema = z
  .object({
    captureMinutesLow: z.number().int().min(1).max(1440),
    captureMinutesHigh: z.number().int().min(1).max(1440),
    editMinutesLow: z.number().int().min(1).max(1440).optional(),
    editMinutesHigh: z.number().int().min(1).max(1440).optional(),
    confidence: z.enum(["low", "calibrated"]),
    version: z.string().trim().min(1).max(80),
  })
  .superRefine((estimate, ctx) => {
    if (estimate.captureMinutesHigh < estimate.captureMinutesLow) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["captureMinutesHigh"],
        message: "captureMinutesHigh must be greater than or equal to captureMinutesLow",
      });
    }
    if ((estimate.editMinutesLow === undefined) !== (estimate.editMinutesHigh === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["editMinutesHigh"],
        message: "edit minute bounds must either both be present or both be absent",
      });
    }
    if (
      estimate.editMinutesLow !== undefined &&
      estimate.editMinutesHigh !== undefined &&
      estimate.editMinutesHigh < estimate.editMinutesLow
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["editMinutesHigh"],
        message: "editMinutesHigh must be greater than or equal to editMinutesLow",
      });
    }
  });

export const ideaCardStageSchema = z.enum([
  "hook",
  "context",
  "demonstration",
  "takeaway",
  "cta",
  "custom",
]);

export const ideaCardStepSchema = z
  .object({
    id: z.string().trim().min(1),
    order: z.number().int().min(1),
    stage: ideaCardStageSchema,
    customStageLabel: optionalTrimmedString,
    startSecond: z.number().int().min(0),
    endSecond: z.number().int().positive(),
    purpose: z.string().trim().min(6).max(240),
    goal: z.string().trim().min(6).max(240),
    action: z.string().trim().min(6).max(320),
    spokenLine: optionalTrimmedString,
    shot: optionalTrimmedString,
    onScreenText: optionalTrimmedString,
    editNote: optionalTrimmedString,
    performanceNote: optionalTrimmedString,
  })
  .superRefine((step, ctx) => {
    if (step.endSecond <= step.startSecond) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endSecond"],
        message: "endSecond must be greater than startSecond",
      });
    }
    if (step.stage === "custom" && !step.customStageLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customStageLabel"],
        message: "customStageLabel is required when stage is custom",
      });
    }
    if (step.stage !== "custom" && step.customStageLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customStageLabel"],
        message: "customStageLabel is only allowed for custom stages",
      });
    }
  });

export const ideaCardSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(2).max(80),
    conceptSummary: z.string().trim().min(12).max(320),
    format: z.string().trim().min(2).max(80),
    category: z.string().trim().min(2).max(80),
    platform: optionalTrimmedString,
    audience: optionalTrimmedString,
    durationSeconds: z.number().int().min(5).max(600),
    difficulty: z.enum(["easy", "medium", "advanced"]),
    requiredItems: z.array(z.string().trim().min(1).max(120)).max(20),
    viewerTakeaway: z.string().trim().min(6).max(240),
    steps: z.array(ideaCardStepSchema).min(3).max(8),
    overallProductionNotes: z.array(z.string().trim().min(1).max(240)).max(10).optional(),
    whyItWorks: optionalTrimmedString,
    hookId: optionalTrimmedString,
    shootFormat: optionalTrimmedString,
    presenceMode: optionalTrimmedString,
    personaSlug: optionalTrimmedString,
    productionEstimate: ideaCardProductionEstimateSchema.optional(),
    schemaVersion: z.literal(2),
  })
  .superRefine((card, ctx) => {
    if (new Set(card.steps.map((step) => step.id)).size !== card.steps.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["steps"], message: "Step IDs must be unique" });
    }
    const sorted = [...card.steps].sort((a, b) => a.order - b.order);
    if (sorted[0]?.startSecond !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["steps", 0, "startSecond"],
        message: "The first step must start at 0 seconds",
      });
    }
    for (let index = 0; index < sorted.length; index += 1) {
      const step = sorted[index];
      if (step.order !== index + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["steps", index, "order"],
          message: `Expected order ${index + 1}`,
        });
      }
      const next = sorted[index + 1];
      if (next && step.endSecond !== next.startSecond) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["steps", index, "endSecond"],
          message: "Steps must be continuous with no gaps or overlaps",
        });
      }
    }
    const finalStep = sorted.at(-1);
    if (finalStep && finalStep.endSecond !== card.durationSeconds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["durationSeconds"],
        message: "durationSeconds must equal the final step end time",
      });
    }
  });

export type IdeaCardSchema = z.infer<typeof ideaCardSchema>;
