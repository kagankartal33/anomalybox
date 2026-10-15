import { ideaCardSchema } from "../idea-card/schema";

export const AUTOMATIC_POLICY_VERSION = "automatic-card-policy-v3.1";
// Bump whenever an automatic acceptance or publication invariant changes.
// Qualifications are deliberately bound to this value and must be rerun.
export const GENERATION_PIPELINE_VERSION = "generation-pipeline-v3.1.2";
export const AUTOMATIC_QUALIFICATION_MODE = "automatic-v3";
export const SEMANTIC_DOCUMENT_VERSION = "card-semantic-v2";
export const CRITIC_CHECKS = [
  "filmability",
  "first_frame_hook",
  "lane_fit",
  "emotion_vibe",
  "natural_speech",
  "proof_payoff",
  "duration",
  "safety",
  "originality",
] as const;

export function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** Exclude only storage identity, never creator-facing content. */
export function cardSnapshot(value: unknown): Record<string, unknown> {
  const { id: _id, one_sentence_premise: _premise, ...content } = objectRecord(value);
  void _id; void _premise;
  return content;
}

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    return `{${Object.keys(row).filter((key) => row[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${stableJson(row[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function cardContentHash(value: unknown): Promise<string> {
  return sha256(stableJson(cardSnapshot(value)));
}

/** Same field order and whitespace contract as the local embedding worker. */
export function semanticDocument(value: unknown): string {
  const card = objectRecord(value);
  const summary = objectRecord(card.idea_summary);
  const fields: unknown[] = [card.title ?? summary.title, card.conceptSummary ?? card.one_sentence_premise ?? summary.premise ?? summary.one_sentence_premise, card.viewerTakeaway ?? summary.creator_takeaway ?? summary.viewer_takeaway];
  const steps = Array.isArray(card.steps) ? card.steps : Array.isArray(card.scene_script) ? card.scene_script : [];
  for (const item of steps) {
    const step = objectRecord(item);
    fields.push(step.purpose, step.goal, step.action ?? step.visual_action, step.spokenLine ?? step.voiceover ?? step.spoken_line, step.shot ?? step.shot_type, step.onScreenText ?? step.on_screen_text, step.editNote ?? step.edit_note);
  }
  const flatten = (item: unknown): string[] => Array.isArray(item) ? item.flatMap(flatten) : typeof item === "string" ? [item.trim()] : [];
  return fields.flatMap(flatten).filter(Boolean).join("\n");
}

export function modelContract(row: unknown): Record<string, unknown> {
  const profile = objectRecord(row);
  return Object.fromEntries(["provider", "protocol", "model", "base_url", "api_key_env_var", "features"].map((key) => [key, profile[key] ?? null]));
}

export function independentCritic(generator: unknown, critic: unknown): boolean {
  const a = objectRecord(generator); const b = objectRecord(critic);
  return Boolean(b.id && b.enabled === true && (a.provider !== b.provider || a.model !== b.model));
}

export function criticPassed(value: unknown): boolean {
  const critic = objectRecord(value); const checks = objectRecord(critic.checks);
  return critic.decision === "pass" && Array.isArray(critic.issueCodes) && critic.issueCodes.length === 0
    && CRITIC_CHECKS.every((key) => checks[key] === "pass");
}

export function automaticGenerationBlockers(trace: unknown, contentHash: string): string[] {
  const row = objectRecord(trace); const generation = objectRecord(row.generation); const gate = objectRecord(row.generation_gate);
  const verification = objectRecord(gate.critic_verification);
  const blockers: string[] = [];
  if (!generation.run_id || row.import_source !== "verified_generation") blockers.push("unverified_generation_source");
  if (generation.pipeline_version !== GENERATION_PIPELINE_VERSION) blockers.push("stale_generation_pipeline");
  if (generation.pipeline_version !== GENERATION_PIPELINE_VERSION) blockers.push("stale_generation_pipeline");
  if (gate.policy_version !== AUTOMATIC_POLICY_VERSION) blockers.push("stale_generation_policy");
  if (gate.final_decision !== "approve") blockers.push(gate.final_decision === "reject" ? "generation_rejected" : "generation_unresolved");
  if (!Array.isArray(gate.hardGateCodes) || gate.hardGateCodes.length) blockers.push("generation_hard_gate_unresolved");
  if (verification.passed !== true || verification.independent !== true || verification.card_hash !== contentHash || !verification.profile_id || !verification.profile_hash) blockers.push("critic_verification_missing_or_stale");
  return blockers;
}

export function publicationBlockers(params: {
  card: unknown; trace: unknown; quality: unknown; contentHash: string; semanticHash: string;
  gateVersion: string; embedding: unknown;
}): string[] {
  const q = objectRecord(params.quality); const meta = objectRecord(q.metadata);
  const embedding = objectRecord(params.embedding); const em = objectRecord(embedding.metadata);
  const blockers = automaticGenerationBlockers(params.trace, params.contentHash);
  if (!ideaCardSchema.safeParse(params.card).success) blockers.push("schema_invalid");
  if (q.decision !== "approve" || q.second_opinion_required === true) blockers.push("quality_not_approved");

  if (q.evaluator_version !== params.gateVersion || meta.card_hash !== params.contentHash) blockers.push("quality_stale");
  if (!Number.isFinite(q.craft_score) || Number(q.craft_score) < 90 || !Number.isFinite(q.editorial_quality_score) || Number(q.editorial_quality_score) < 90) blockers.push("quality_below_floor");
  if (!Number.isFinite(q.embedding_duplicate_score) || Number(q.embedding_duplicate_score) >= 0.78 || Number(q.embedding_duplicate_score) < 0) blockers.push("semantic_not_clear");
  if (embedding.source_text_hash !== params.semanticHash || !embedding.embedding_model || !em.model_version || em.document_version !== SEMANTIC_DOCUMENT_VERSION || em.corpus_complete !== true || em.comparison_scope !== "global") blockers.push("embedding_missing_or_stale");
  if (q.embedding_model !== embedding.embedding_model || q.embedding_model_version !== em.model_version || q.embedding_duplicate_score !== em.nearest_similarity) blockers.push("embedding_score_stale");
  return [...new Set(blockers)];
}