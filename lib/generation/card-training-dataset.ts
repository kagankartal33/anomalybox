import { z } from "zod";
import { ideaCardSchema } from "../idea-card/schema.ts";
import { evaluateIdeaCardV22, QUALITY_GATE_VERSION } from "../idea-card/quality-v2-2.ts";
import { runtimeProfileForSeconds } from "../idea-card/duration-planner.ts";
import { conceptPlanSchema, criticResultSchema, ideaCardJsonSchema, PROMPT_VERSION } from "./contracts.ts";
import { cardContentHash, criticPassed, objectRecord, semanticDocument, SEMANTIC_DOCUMENT_VERSION, sha256, stableJson } from "./automatic-policy.ts";
import { CARD_TRAINING_VERSION, CARD_WRITER_SYSTEM, buildCardTrainingContext, cardDraftPrompt } from "./card-training.ts";
import { PILOT_CATEGORIES } from "./qualification.ts";

export const CARD_DATASET_VERSION = "card-sft-v2";
const identifier = z.string().regex(/^[a-zA-Z0-9_.:/-]{1,160}$/);
const modelIdentity = z.object({ provider: identifier, model: identifier }).strict();
export const cardTrainingRecordSchema = z.object({
  source: z.object({
    id: identifier,
    familyId: identifier,
    origin: z.enum(["original", "permissioned", "synthetic"]),
    rights: z.enum(["owned", "licensed", "synthetic_original"]),
    language: z.literal("en"),
    pipeline: z.literal("idea_card_only"),
  }).strict(),
  context: z.object({
    category: z.object({ slug: identifier }).strict(),
    persona: z.object({ slug: identifier }).strict(),
    platform: z.literal("instagram_reels"),
  }).strict(),
  concept: conceptPlanSchema.strict(),
  card: z.unknown(),
  verification: z.object({
    cardHash: z.string().regex(/^[a-f0-9]{64}$/),
    promptVersion: z.literal(PROMPT_VERSION),
    qualityGateVersion: z.literal(QUALITY_GATE_VERSION),
    generator: modelIdentity,
    critic: z.object({ identity: modelIdentity, result: criticResultSchema }).strict(),
    semantic: z.object({
      maxSimilarity: z.number().min(0).max(1),
      model: identifier,
      revision: z.string().regex(/^[a-f0-9]{40}$/),
      documentVersion: z.literal(SEMANTIC_DOCUMENT_VERSION),
      scope: z.literal("global"),
      corpusComplete: z.literal(true),
    }).strict(),
  }).strict(),
}).strict();

type Split = "train" | "validation" | "test";
type PreparedCard = { record: z.infer<typeof cardTrainingRecordSchema>; card: z.infer<typeof ideaCardSchema>; hash: string; tokens: Set<string>; actionTokens: Set<string> };
export type CardSftRow = {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  meta: { source_id: string; family_id: string; category: string; split: Split; content_hash: string; origin: string; curriculum_version: string; prompt_version: string };
};

function tokens(value: string): Set<string> {
  return new Set(value.toLowerCase().normalize("NFKC").match(/[\p{L}\p{N}]+/gu) ?? []);
}
function similarity(left: Set<string>, right: Set<string>): number {
  let overlap = 0;
  for (const word of left) if (right.has(word)) overlap++;
  return left.size + right.size ? 2 * overlap / (left.size + right.size) : 0;
}

/** Storage includes optional computed fields; model targets must not. */
export function cardTrainingTarget(input: unknown): Record<string, unknown> {
  const parsed = ideaCardSchema.parse(input);
  const raw = objectRecord(input);
  const properties = objectRecord(ideaCardJsonSchema.properties);
  const allowed = new Set([...Object.keys(properties), "productionEstimate", "one_sentence_premise"]);
  if (Object.keys(raw).some(key => !allowed.has(key))) throw new Error("legacy_or_unknown_fields");
  const target = Object.fromEntries(Object.keys(properties).map(key => [key, objectRecord(parsed)[key]]));
  if ((ideaCardJsonSchema.required as string[]).some(key => target[key] === undefined || target[key] === "")) throw new Error("incomplete_generation_contract");
  if (parsed.durationSeconds < 12 || parsed.durationSeconds > 60 || !parsed.requiredItems.length || parsed.requiredItems.length > 12 || !parsed.overallProductionNotes?.length) throw new Error("invalid_production_contract");
  const stepKeys = Object.keys(objectRecord(objectRecord(objectRecord(properties.steps).items).properties));
  target.steps = parsed.steps.map((step, index) => {
    if (step.stage === "custom" || Object.keys(objectRecord((raw.steps as unknown[])[index])).some(key => !stepKeys.includes(key))) throw new Error("unsupported_step_contract");
    return Object.fromEntries(stepKeys.map(key => [key, objectRecord(step)[key] ?? null]));
  });
  return target;
}

export async function compileCardTrainingDataset(inputs: unknown[]) {
  if (inputs.length > 10000) throw new Error("Dataset exceeds the 10000-row audit limit; audit bounded source batches first");
  const rejected: { row: number; codes: string[] }[] = [];
  const candidates: PreparedCard[] = [];
  for (const [index, input] of inputs.entries()) {
    const parsed = cardTrainingRecordSchema.safeParse(input);
    if (!parsed.success) { rejected.push({ row: index + 1, codes: ["invalid_record_contract"] }); continue; }
    const record = parsed.data;
    const codes: string[] = [];
    const expectedRights = { original: "owned", permissioned: "licensed", synthetic: "synthetic_original" };
    if (record.source.rights !== expectedRights[record.source.origin]) codes.push("source_rights_mismatch");
    let card: z.infer<typeof ideaCardSchema>;
    try { cardTrainingTarget(record.card); card = ideaCardSchema.parse(record.card); }
    catch { rejected.push({ row: index + 1, codes: ["invalid_card_contract"] }); continue; }
    const hash = await cardContentHash(card);
    const evidence = record.verification;
    if (hash !== evidence.cardHash) codes.push("stale_card_verification");
    if (!criticPassed(evidence.critic.result) || (evidence.generator.provider === evidence.critic.identity.provider && evidence.generator.model === evidence.critic.identity.model)) codes.push("independent_critic_required");
    if (card.category !== record.context.category.slug || card.personaSlug !== record.context.persona.slug || card.platform !== record.context.platform) codes.push("lane_mismatch");
    if (card.hookId !== record.concept.hookId || card.shootFormat !== record.concept.shootFormat || record.concept.runtimeProfile !== runtimeProfileForSeconds(card.durationSeconds)) codes.push("concept_contract_mismatch");
    const gate = evaluateIdeaCardV22(card, { rawInput: record.card, semanticScore: evidence.semantic.maxSimilarity });
    if (gate.decision !== "approve") codes.push("quality_not_approved", ...gate.hardGateCodes, ...gate.issueCodes, ...gate.humanReviewReasons);
    if (codes.length) { rejected.push({ row: index + 1, codes: [...new Set(codes)] }); continue; }
    candidates.push({ record, card, hash, tokens: tokens(semanticDocument(card)), actionTokens: tokens(card.steps.map(step => step.action).join(" ")) });
  }
  // Sort before dedup so input order cannot select which duplicate survives.
  candidates.sort((a, b) => a.record.source.id.localeCompare(b.record.source.id, "en") || a.hash.localeCompare(b.hash));
  const accepted: PreparedCard[] = [];
  const ids = new Set<string>();
  for (const candidate of candidates) {
    const duplicate = ids.has(candidate.record.source.id) || accepted.some(other => other.hash === candidate.hash
      || similarity(other.tokens, candidate.tokens) >= .78 || similarity(other.actionTokens, candidate.actionTokens) >= .86);
    if (duplicate) { rejected.push({ row: inputs.indexOf(candidate.record) + 1, codes: ["duplicate_content_or_actions"] }); continue; }
    ids.add(candidate.record.source.id);
    accepted.push(candidate);
  }
  const splits: Record<Split, CardSftRow[]> = { train: [], validation: [], test: [] };
  const laneCounts: Record<string, Record<Split, number>> = {};
  const durations: Record<string, number> = {};
  const profiles = new Map<string, Set<string>>();
  for (const { record, card, hash } of accepted) {
    // All variants of a source family, including cross-category variants, remain
    // in one split. A stable hash makes appending data reproducible.
    const bucket = parseInt((await sha256(`card-sft-split-v1:${record.source.familyId}`)).slice(0, 8), 16) % 100;
    const split: Split = bucket < 80 ? "train" : bucket < 90 ? "validation" : "test";
    const training = buildCardTrainingContext(record.context);
    splits[split].push({
      messages: [
        { role: "system", content: CARD_WRITER_SYSTEM },
        { role: "user", content: cardDraftPrompt(training, record.concept, card.durationSeconds) },
        { role: "assistant", content: stableJson(cardTrainingTarget(card)) },
      ],
      meta: { source_id: record.source.id, family_id: record.source.familyId, category: card.category, split, content_hash: hash, origin: record.source.origin, curriculum_version: CARD_TRAINING_VERSION, prompt_version: PROMPT_VERSION },
    });
    laneCounts[card.category] ??= { train: 0, validation: 0, test: 0 };
    laneCounts[card.category][split]++;
    durations[card.durationSeconds] = (durations[card.durationSeconds] ?? 0) + 1;
    if (!profiles.has(card.category)) profiles.set(card.category, new Set());
    profiles.get(card.category)!.add(record.concept.runtimeProfile);
  }
  const blockers: string[] = [];
  if (accepted.length < 200) blockers.push("fewer_than_200_unique_cards");
  for (const lane of PILOT_CATEGORIES) {
    const count = laneCounts[lane];
    if (!count || count.train < 20 || count.validation < 5 || count.test < 5) blockers.push(`insufficient_split_coverage:${lane}`);
    if ((profiles.get(lane)?.size ?? 0) < 3) blockers.push(`insufficient_runtime_diversity:${lane}`);
  }
  if (Math.max(0, ...Object.values(durations)) / Math.max(1, accepted.length) > .2) blockers.push("fixed_duration_overrepresented");
  return { splits, manifest: {
    version: CARD_DATASET_VERSION, curriculum_version: CARD_TRAINING_VERSION, prompt_version: PROMPT_VERSION,
    quality_gate_version: QUALITY_GATE_VERSION, pipeline: "idea_card_only", language: "en",
    source_count: inputs.length, accepted_count: accepted.length, rejected_count: rejected.length,
    split_counts: Object.fromEntries(Object.entries(splits).map(([key, rows]) => [key, rows.length])),
    category_counts: laneCounts, duration_counts: durations, blockers, training_ready: blockers.length === 0,
    model_qualified: false, dedup_method: "lexical_and_action_overlap_plus_supplied_semantic_evidence",
    split_method: "source_family_sha256_80_10_10_v1", rejected,
  } };
}