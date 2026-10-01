import { z } from "zod";
import { ideaCardSchema } from "../idea-card/schema";
import { RUNTIME_PROFILES } from "../idea-card/duration-planner";
import { CRITIC_CHECKS } from "./automatic-policy";
import {
  AUDIENCE_ACTION_IDS,
  CONTENT_GENRE_IDS,
  CREATIVE_TAXONOMY_VERSION,
  creativeRecipeId,
  creativeRecipeSchema,
  EMOTION_ARC_IDS,
  HOOK_DELIVERY_IDS,
  HOOK_TYPE_IDS,
  PAYOFF_TYPE_IDS,
  PROMISE_TYPE_IDS,
  PROOF_DEVICE_IDS,
  validateRecipeSet,
  validateRecipeCompatibility,
  VIBE_PRESET_IDS,
} from "./creative-taxonomy";
import { CREATOR_MODES, CREATOR_PERSONAS, parsePurchaseLane } from "../algorithmic-reason/compatibility";

export const PROMPT_VERSION = "idea-card-premium-v3.0.0-automatic";

export const conceptPlanSchema = z.object({
  conceptId: z.string().trim().min(1),
  title: z.string().trim().min(2).max(80),
  premise: z.string().trim().min(12).max(320),
  recipe: creativeRecipeSchema,
  hookId: z.string().trim().min(1),
  shootFormat: z.string().trim().min(1),
  firstFramePlan: z.string().trim().min(8).max(240),
  soundPlan: z.string().trim().min(8).max(240),
  emotionBeatPlan: z.object({
    opening: z.string().trim().min(4).max(160),
    middle: z.string().trim().min(4).max(160),
    payoff: z.string().trim().min(4).max(160),
  }).strict(),
  proofPlan: z.string().trim().min(8).max(240),
  viewerTakeaway: z.string().trim().min(6).max(240),
  mechanismIds: z.array(z.string().trim().min(1)).max(8),
  riskNotes: z.array(z.string().trim().min(1).max(160)).max(6),
  runtimeProfile: z.enum(RUNTIME_PROFILES),
  proofBeatCount: z.number().int().min(1).max(4),
  spokenWordTarget: z.number().int().min(0).max(180),
  shotCount: z.number().int().min(3).max(8),
  locationCount: z.number().int().min(1).max(3),
  cameraSetupCount: z.number().int().min(1).max(5),
  resetCount: z.number().int().min(0).max(4),
}).strict().superRefine((concept, ctx) => {
  if (concept.hookId !== concept.recipe.hookTypeId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["hookId"], message: "hookId must match the scheduled recipe" });
  }
  if (concept.shootFormat !== concept.recipe.shootFormat) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["shootFormat"], message: "shootFormat must match the scheduled recipe" });
  }
});

export const conceptSetSchema = z.object({ concepts: z.array(conceptPlanSchema).length(5) }).strict().superRefine((set, ctx) => {
  for (const issue of validateRecipeSet(set.concepts.map((concept) => concept.recipe), 5)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["concepts"], message: issue });
  }
});

export const criticResultSchema = z.object({
  decision: z.enum(["pass", "revise", "reject"]),
  issueCodes: z.array(z.string().regex(/^[a-z0-9_]{2,64}$/)).max(12),
  editInstructions: z.array(z.string().trim().min(4).max(240)).max(8),
  checks: z.object(Object.fromEntries(CRITIC_CHECKS.map((key) => [key, z.enum(["pass", "fail", "uncertain"])])) as Record<(typeof CRITIC_CHECKS)[number], z.ZodEnum<["pass", "fail", "uncertain"]>>).strict(),
}).superRefine((result, ctx) => {
  if (result.decision === "pass" && (result.issueCodes.length || CRITIC_CHECKS.some((key) => result.checks[key] !== "pass"))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A passing critic must clear every check and have no unresolved issues" });
  }
});

export const generatedIdeaEnvelopeSchema = z.object({
  externalIdeaId: z.string().trim().min(1),
  categorySlug: z.string().trim().min(1),
  personaSlug: z.string().trim().min(1),
  platform: z.string().trim().min(1),
  language: z.string().trim().min(2),
  concept: conceptPlanSchema,
  creativeRecipe: creativeRecipeSchema,
  card: ideaCardSchema,
  critic: criticResultSchema,
  generation: z.object({
    runId: z.string().uuid(),
    profileSlug: z.string().trim().min(1),
    provider: z.string().trim().min(1),
    model: z.string().trim().min(1),
    promptVersion: z.literal(PROMPT_VERSION),
    taxonomyVersion: z.literal(CREATIVE_TAXONOMY_VERSION),
    creativeSignature: z.string().trim().min(1),
    schemaVersion: z.literal(2),
    repaired: z.boolean(),
    durationPlan: z.object({
      runtimeProfile: z.enum(RUNTIME_PROFILES),
      targetSeconds: z.number().int().min(10).max(60),
      plannerVersion: z.string().trim().min(1),
    }),
  }).strict(),
}).strict().superRefine((envelope, ctx) => {
  const conceptId = creativeRecipeId(envelope.concept.recipe);
  const envelopeId = creativeRecipeId(envelope.creativeRecipe);
  if (conceptId !== envelopeId || envelope.generation.creativeSignature !== envelopeId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["creativeRecipe"], message: "creative recipe signature mismatch" });
  }
  if (envelope.card.hookId !== envelope.creativeRecipe.hookTypeId || envelope.card.shootFormat !== envelope.creativeRecipe.shootFormat || envelope.card.presenceMode !== envelope.creativeRecipe.presenceMode) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["card"], message: "card diverges from its creative recipe" });
  }
  const lane = parsePurchaseLane(envelope.categorySlug);
  if (!lane || parsePurchaseLane(envelope.card.category) !== lane) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["categorySlug"], message: "recipe lane is missing or inconsistent" });
  } else {
    for (const code of validateRecipeCompatibility(envelope.creativeRecipe, lane)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["creativeRecipe"], message: code });
    }
  }
});

export type GeneratedIdeaEnvelope = z.infer<typeof generatedIdeaEnvelopeSchema>;

const stepProperties = {
  id: { type: "string", minLength: 1 },
  order: { type: "integer", minimum: 1 },
  stage: { type: "string", enum: ["hook", "context", "demonstration", "takeaway", "cta"] },
  startSecond: { type: "integer", minimum: 0 },
  endSecond: { type: "integer", minimum: 1 },
  purpose: { type: "string", minLength: 6, maxLength: 240 },
  goal: { type: "string", minLength: 6, maxLength: 240 },
  action: { type: "string", minLength: 6, maxLength: 320 },
  spokenLine: { type: ["string", "null"], minLength: 1 },
  shot: { type: ["string", "null"], minLength: 1 },
  onScreenText: { type: ["string", "null"], minLength: 1 },
  editNote: { type: ["string", "null"], minLength: 1 },
  performanceNote: { type: ["string", "null"], minLength: 1 },
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
    requiredItems: { type: "array", minItems: 1, maxItems: 12, items: { type: "string", minLength: 1 } },
    viewerTakeaway: { type: "string", minLength: 6, maxLength: 240 },
    steps: {
      type: "array", minItems: 3, maxItems: 8,
      items: { type: "object", additionalProperties: false, required: Object.keys(stepProperties), properties: stepProperties },
    },
    overallProductionNotes: { type: "array", minItems: 1, maxItems: 10, items: { type: "string", minLength: 1 } },
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
      type: "array", minItems: 5, maxItems: 5,
      items: {
        type: "object", additionalProperties: false,
        required: ["conceptId", "title", "premise", "recipe", "hookId", "shootFormat", "firstFramePlan", "soundPlan", "emotionBeatPlan", "proofPlan", "viewerTakeaway", "mechanismIds", "riskNotes", "runtimeProfile", "proofBeatCount", "spokenWordTarget", "shotCount", "locationCount", "cameraSetupCount", "resetCount"],
        properties: {
          conceptId: { type: "string" }, title: { type: "string" }, premise: { type: "string" },
          recipe: {
            type: "object", additionalProperties: false,
            required: ["taxonomyVersion", "genreId", "hookTypeId", "hookDeliveryId", "promiseTypeId", "emotionArcId", "vibePresetId", "proofDeviceId", "payoffTypeId", "audienceActionId", "shootFormat", "presenceMode"],
            properties: {
              taxonomyVersion: { type: "string", const: CREATIVE_TAXONOMY_VERSION },
              genreId: { type: "string", enum: CONTENT_GENRE_IDS },
              hookTypeId: { type: "string", enum: HOOK_TYPE_IDS },
              hookDeliveryId: { type: "string", enum: HOOK_DELIVERY_IDS },
              promiseTypeId: { type: "string", enum: PROMISE_TYPE_IDS },
              emotionArcId: { type: "string", enum: EMOTION_ARC_IDS },
              vibePresetId: { type: "string", enum: VIBE_PRESET_IDS },
              proofDeviceId: { type: "string", enum: PROOF_DEVICE_IDS },
              payoffTypeId: { type: "string", enum: PAYOFF_TYPE_IDS },
              audienceActionId: { type: "string", enum: AUDIENCE_ACTION_IDS },
              shootFormat: { type: "string", enum: CREATOR_MODES },
              presenceMode: { type: "string", enum: CREATOR_PERSONAS },
            },
          },
          hookId: { type: "string" }, shootFormat: { type: "string" }, proofPlan: { type: "string" },
          firstFramePlan: { type: "string", minLength: 8, maxLength: 240 },
          soundPlan: { type: "string", minLength: 8, maxLength: 240 },
          emotionBeatPlan: {
            type: "object", additionalProperties: false, required: ["opening", "middle", "payoff"],
            properties: { opening: { type: "string" }, middle: { type: "string" }, payoff: { type: "string" } },
          },
          viewerTakeaway: { type: "string" }, mechanismIds: { type: "array", minItems: 1, items: { type: "string" } },
          riskNotes: { type: "array", items: { type: "string" } },
          runtimeProfile: { type: "string", enum: RUNTIME_PROFILES },
          proofBeatCount: { type: "integer", minimum: 1, maximum: 4 },
          spokenWordTarget: { type: "integer", minimum: 0, maximum: 180 },
          shotCount: { type: "integer", minimum: 3, maximum: 8 },
          locationCount: { type: "integer", minimum: 1, maximum: 3 },
          cameraSetupCount: { type: "integer", minimum: 1, maximum: 5 },
          resetCount: { type: "integer", minimum: 0, maximum: 4 },
        },
      },
    },
  },
};

export const criticResultJsonSchema: Record<string, unknown> = {
  type: "object", additionalProperties: false, required: ["decision", "issueCodes", "editInstructions", "checks"],
  properties: {
    decision: { type: "string", enum: ["pass", "revise", "reject"] },
    issueCodes: { type: "array", maxItems: 12, items: { type: "string", pattern: "^[a-z0-9_]{2,64}$" } },
    editInstructions: { type: "array", maxItems: 8, items: { type: "string", maxLength: 240 } },
    checks: { type: "object", additionalProperties: false, required: [...CRITIC_CHECKS], properties: Object.fromEntries(CRITIC_CHECKS.map((key) => [key, { type: "string", enum: ["pass", "fail", "uncertain"] }])) },
  },
};