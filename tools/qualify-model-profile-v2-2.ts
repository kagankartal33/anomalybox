/** Automatic qualification. Dry-run by default; never consumes human gold ratings. */
import { createClient } from "@supabase/supabase-js";
import { PROMPT_VERSION } from "../lib/generation/contracts";
import { QUALITY_GATE_VERSION } from "../lib/idea-card/quality-v2-2";
import { AUTOMATIC_QUALIFICATION_MODE, cardContentHash, modelContract, objectRecord, semanticDocument, sha256, stableJson } from "../lib/generation/automatic-policy";
import { automaticQualificationPass, PILOT_CATEGORIES } from "../lib/generation/qualification";
import { analyzeDurationDistribution, timingFingerprint } from "../lib/idea-card/duration-planner";
import { runAutomaticQualityRegression } from "./automatic-quality-regression";
import type { IdeaCard } from "../lib/idea-card/types";

const arg = (name: string) => { const index = process.argv.indexOf(name); return index < 0 ? "" : process.argv[index + 1] ?? ""; };
const profileSlug = arg("--profile");
const runIds = [...new Set(arg("--run-ids").split(",").map((v) => v.trim()).filter(Boolean))];
const apply = process.argv.includes("--apply");
const approve = process.argv.includes("--approve");
const base = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
const url = new URL(base);
if (url.username || url.password || (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) throw new Error("Invalid Supabase service URL");
if (!profileSlug || !runIds.length || runIds.some((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) throw new Error("--profile and explicit UUID --run-ids are required");
if (approve && !apply) throw new Error("--approve requires --apply");
const supabase = createClient(base, key, { auth: { persistSession: false } });
const chunks = <T,>(rows: T[], size = 100): T[][] => Array.from({ length: Math.ceil(rows.length / size) }, (_, i) => rows.slice(i * size, (i + 1) * size));
const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

async function main() {
  const regression = runAutomaticQualityRegression();
  if (!regression.passed) throw new Error("Automatic regression suite failed; no model can be qualified");
  const { data: profile, error: profileError } = await supabase.from("idea_model_profiles").select("*").eq("profile_slug", profileSlug).single();
  if (profileError || !profile?.enabled) throw new Error("Enabled model profile not found");
  const { data: critic, error: criticError } = await supabase.from("idea_model_profiles").select("*").eq("profile_slug", objectRecord(profile.features).critic_profile_slug).eq("enabled", true).single();
  if (criticError || !critic || (critic.model === profile.model && critic.provider === profile.provider)) throw new Error("Independent enabled critic not found");
  const criticHash = await sha256(stableJson(modelContract(critic)));
  const runs: Record<string, unknown>[] = [];
  for (const ids of chunks(runIds)) {
    const { data, error } = await supabase.from("idea_generation_runs").select("*").in("id", ids);
    if (error) throw error; runs.push(...data ?? []);
  }
  if (runs.length !== runIds.length || runs.some((run) => run.model_profile_id !== profile.id || !["completed", "partial"].includes(String(run.status)) || run.prompt_version !== PROMPT_VERSION || run.schema_version !== 2 || objectRecord(run.metadata).critic_profile_hash !== criticHash)) throw new Error("Runs must use this generator, current contract and current critic");
  const batchIds = [...new Set(runs.map((r) => String(r.generation_batch_id)))];
  const candidates: Record<string, unknown>[] = [];
  for (const ids of chunks(batchIds)) {
    for (let offset = 0;; offset += 1000) {
      const { data, error } = await supabase.from("idea_candidates").select("id,category_id,decision_trace").in("generation_batch_id", ids).order("id").range(offset, offset + 999);
      if (error) throw error;
      candidates.push(...(data ?? []).filter((row) => runIds.includes(String(objectRecord(objectRecord(row.decision_trace).generation).run_id))));
      if ((data ?? []).length < 1000) break;
    }
  }
  const { data: categories, error: categoriesError } = await supabase.from("categories").select("id,slug").in("slug", [...PILOT_CATEGORIES]);
  if (categoriesError) throw categoriesError;
  const categoryById = new Map((categories ?? []).map((c) => [c.id, c.slug]));
  const categoryCounts: Record<string, number> = Object.fromEntries(PILOT_CATEGORIES.map((slug) => [slug, 0]));
  candidates.forEach((c) => { const slug = categoryById.get(String(c.category_id)); if (slug) categoryCounts[slug]++; });
  const qualityRows: Record<string, unknown>[] = []; const cards = new Map<string, IdeaCard>(); const embeddings = new Map<string, Record<string, unknown>>();
  for (const ids of chunks(candidates.map((c) => String(c.id)))) {
    const [q, c, e] = await Promise.all([
      supabase.from("idea_quality_checks").select("*").in("idea_id", ids),
      supabase.from("idea_cards").select("idea_id,card").in("idea_id", ids),
      supabase.from("idea_semantic_embeddings").select("idea_id,source_text_hash,metadata,embedding_model").in("idea_id", ids),
    ]);
    if (q.error || c.error || e.error) throw q.error ?? c.error ?? e.error;
    qualityRows.push(...q.data ?? []);
    c.data?.forEach((row) => cards.set(row.idea_id, row.card as IdeaCard));
    e.data?.forEach((row) => embeddings.set(row.idea_id, row));
  }
  const { data: corpus, error: corpusError } = await supabase.from("idea_embedding_corpus_state").select("card_count,revision").single();
  if (corpusError) throw corpusError;
  const qById = new Map(qualityRows.map((q) => [String(q.idea_id), q]));
  let embedded = 0; let criticRecords = 0; let fresh = 0; let approvedCritics = 0;
  for (const candidate of candidates) {
    const id = String(candidate.id); const card = cards.get(id); const q = qById.get(id); if (!card || !q) continue;
    const contentHash = await cardContentHash(card);
    const v = objectRecord(objectRecord(objectRecord(candidate.decision_trace).generation_gate).critic_verification);
    const criticCurrent = v.card_hash === contentHash && v.independent === true && v.profile_id === critic.id && v.profile_hash === criticHash;
    if (criticCurrent) criticRecords++;
    if (criticCurrent && v.passed === true && q.decision === "approve") approvedCritics++;
    if (objectRecord(q.metadata).card_hash === contentHash) fresh++;
    const em = objectRecord(embeddings.get(id)?.metadata);
    if (embeddings.get(id)?.source_text_hash === await sha256(semanticDocument(card)) && em.document_version === "card-semantic-v2" && em.comparison_scope === "global" && em.corpus_complete === true && em.corpus_revision === corpus.revision && Number(em.corpus_count) === Number(corpus.card_count) && q.embedding_duplicate_score === em.nearest_similarity && q.embedding_model === embeddings.get(id)?.embedding_model && q.embedding_model_version === em.model_version) embedded++;
  }
  const approved = qualityRows.filter((q) => q.decision === "approve");
  const approvedCards = approved.map((q) => cards.get(String(q.idea_id))).filter((c): c is IdeaCard => Boolean(c));
  const fingerprints = approvedCards.map(timingFingerprint);
  const duration = analyzeDurationDistribution(approvedCards.map((c) => c.durationSeconds), fingerprints);
  const durationCodes = /duration|runtime|spoken_delivery|physical_action_exceeds/;
  const n = qualityRows.length;
  const requested = runs.reduce((sum, run) => sum + Number(run.requested_count), 0);
  const metrics = {
    qualification_mode: AUTOMATIC_QUALIFICATION_MODE, regression_version: regression.version, regression_passed: regression.passed, regression_case_count: regression.case_count,
    category_counts: categoryCounts, evaluated_count: n, embedded_count: embedded, critic_record_count: criticRecords, fresh_snapshot_count: fresh,
    current_gate_count: qualityRows.filter((q) => q.evaluator_version === QUALITY_GATE_VERSION).length,
    schema_pass_rate: requested ? runs.reduce((sum, r) => sum + Number(r.imported_count), 0) / requested : 0,
    safe_approve_rate: n ? approved.length / n : 0,
    approved_average: mean(approved.map((q) => Number(q.craft_score))),
    approved_critic_pass_rate: approved.length ? approvedCritics / approved.length : 0,
    duplicate_rate_078: n ? qualityRows.filter((q) => Number(q.embedding_duplicate_score) >= 0.78).length / n : 1,
    banned_residue_rate: n ? qualityRows.filter((q) => Array.isArray(q.reasons) && q.reasons.includes("creator_facing_residue")).length / n : 1,
    duration_fit_rate: n ? qualityRows.filter((q) => Array.isArray(q.reasons) && !q.reasons.some((reason) => durationCodes.test(String(reason)))).length / n : 0,
    exact_duration_max_share: duration.maxExactSecondShare,
    timing_template_duplicate_rate: fingerprints.length ? (fingerprints.length - new Set(fingerprints).size) / fingerprints.length : 1,
  };
  const passed = candidates.length === n && automaticQualificationPass(metrics);
  const evaluation = { model_profile_id: profile.id, prompt_version: PROMPT_VERSION, schema_version: 2, quality_gate_version: QUALITY_GATE_VERSION, brief_count: candidates.length, category_counts: categoryCounts, generation_run_ids: runIds, gold_rating_ids: [], metrics, status: passed ? "completed" : "invalid" };
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry_run", passed, evaluation, human_review_required: false }, null, 2));
  if (!apply) { if (!passed) process.exitCode = 1; return; }
  const { data: saved, error } = await supabase.from("idea_model_qualification_evals").insert(evaluation).select("id").single();
  if (error) throw error;
  if (approve) {
    if (!passed) throw new Error("Automatic qualification failed; profile remains unapproved");
    const { data, error: approvalError } = await supabase.rpc("qualify_idea_model_profile", { p_profile_slug: profileSlug, p_eval_id: saved.id });
    if (approvalError) throw approvalError;
    console.log(JSON.stringify(data));
    if (!objectRecord(data).qualified) process.exitCode = 1;
  }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Automatic qualification failed"); process.exitCode = 1; });