import { createClient } from "@supabase/supabase-js";
import { PROMPT_VERSION } from "../lib/generation/contracts";
import { QUALITY_GATE_VERSION } from "../lib/idea-card/quality-v2-2";
import { AUTOMATIC_QUALIFICATION_MODE, GENERATION_PIPELINE_VERSION, SEMANTIC_DOCUMENT_VERSION, cardContentHash, independentCritic, modelContract, objectRecord, semanticDocument, sha256, stableJson } from "../lib/generation/automatic-policy";
import { automaticQualificationPass, QUALIFICATION_CATEGORIES } from "../lib/generation/qualification";
import { DURATION_PLANNER_VERSION, analyzeDurationDistribution, timingFingerprint } from "../lib/idea-card/duration-planner";
import { CREATIVE_SCHEDULER_VERSION, CREATIVE_TAXONOMY_VERSION, analyzeCreativeDistribution, creativeRecipeSchema, recipeMatchesConcept, type CreativeRecipe } from "../lib/generation/creative-taxonomy";
import { CONCEPT_RANKER_VERSION } from "../lib/generation/concept-ranking";
import { runAutomaticQualityRegression } from "./automatic-quality-regression";
import type { IdeaCard } from "../lib/idea-card/types";

const argument = (name: string) => process.argv[process.argv.indexOf(name) + 1];
const profileSlug = process.argv.includes("--profile") ? argument("--profile") : "";
const runIds = [...new Set((process.argv.includes("--run-ids") ? argument("--run-ids") : "").split(",").filter(Boolean))];
const apply = process.argv.includes("--apply");
const approve = process.argv.includes("--approve");
type Row = Record<string, unknown>;

function chunks<T>(rows: T[], size = 100) {
  return Array.from({ length: Math.ceil(rows.length / size) }, (_, i) => rows.slice(i * size, (i + 1) * size));
}

async function main() {
  if (!profileSlug || !runIds.length || runIds.some(id => !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))) throw new Error("--profile and UUID --run-ids are required");
  if (approve && !apply) throw new Error("--approve requires --apply");
  const base = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  const url = new URL(base);
  if (url.username || url.password || (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) throw new Error("Unsafe SUPABASE_URL");
  const db = createClient(base, key, { auth: { persistSession: false } });
  const regression = runAutomaticQualityRegression();
  if (!regression.passed) throw new Error("Automatic regression failed");
  const { data: profile, error: profileError } = await db.from("idea_model_profiles").select("*").eq("profile_slug", profileSlug).eq("enabled", true).single();
  if (profileError || !profile) throw new Error("Enabled model profile not found");
  const { data: critic } = await db.from("idea_model_profiles").select("*").eq("profile_slug", String(objectRecord(profile.features).critic_profile_slug ?? "")).eq("enabled", true).single();
  if (!critic || !independentCritic(profile, critic)) throw new Error("Enabled independent critic required");
  const criticHash = await sha256(stableJson(modelContract(critic)));
  const runs: Row[] = [];
  for (const ids of chunks(runIds)) {
    const { data, error } = await db.from("idea_generation_runs").select("*").in("id", ids);
    if (error) throw new Error("Cannot read qualification runs");
    runs.push(...(data ?? []));
  }
  if (runs.length !== runIds.length || runs.some(run => {
    const metadata = objectRecord(run.metadata);
    return run.model_profile_id !== profile.id || run.prompt_version !== PROMPT_VERSION || run.taxonomy_version !== CREATIVE_TAXONOMY_VERSION || run.schema_version !== 2
      || !["completed", "partial", "failed"].includes(String(run.status))
      || metadata.pipeline_version !== GENERATION_PIPELINE_VERSION || metadata.scheduler_version !== CREATIVE_SCHEDULER_VERSION
      || metadata.concept_ranker_version !== CONCEPT_RANKER_VERSION || metadata.critic_profile_hash !== criticHash
      || stableJson(metadata.generator_snapshot) !== stableJson(modelContract(profile));
  })) throw new Error("Runs must be terminal and match the current generator, critic and pipeline contract");
  const batchIds = [...new Set(runs.map(run => String(run.generation_batch_id)))];
  for (const ids of chunks(batchIds)) {
    for (let from = 0;; from += 1000) {
      const { data, error } = await db.from("idea_generation_runs").select("id").in("generation_batch_id", ids).eq("model_profile_id", profile.id).eq("prompt_version", PROMPT_VERSION).order("id").range(from, from + 999);
      if (error || (data ?? []).some(run => !runIds.includes(run.id))) throw new Error("Include every current-contract attempt from the selected batches, including failures");
      if ((data ?? []).length < 1000) break;
    }
  }
  const { data: categories, error: categoryError } = await db.from("categories").select("id,slug").in("slug", [...QUALIFICATION_CATEGORIES]);
  if (categoryError) throw new Error("Cannot read categories");
  const categoryById = new Map((categories ?? []).map(row => [row.id, row.slug]));
  const categoryByBatchId = new Map<string, string>();
  for (const ids of chunks(batchIds)) {
    const { data, error } = await db.from("idea_generation_batches").select("id,category_id").in("id", ids);
    if (error) throw new Error("Cannot read qualification batch categories");
    for (const batch of data ?? []) {
      const category = categoryById.get(batch.category_id);
      if (!category) throw new Error("Qualification batch is outside the 12 supported categories");
      categoryByBatchId.set(batch.id, category);
    }
  }
  if (categoryByBatchId.size !== batchIds.length) throw new Error("Qualification batch category evidence is incomplete");
  const candidates: Row[] = [];
  for (const ids of chunks(batchIds)) {
    for (let from = 0;; from += 1000) {
      const { data, error } = await db.from("idea_candidates").select("id,category_id,decision_trace").in("generation_batch_id", ids).order("id").range(from, from + 999);
      if (error) throw new Error("Cannot read candidates");
      candidates.push(...(data ?? []).filter(row => runIds.includes(String(objectRecord(objectRecord(row.decision_trace).generation).run_id))));
      if ((data ?? []).length < 1000) break;
    }
  }
  const cards = new Map<string, Row>(), qualities = new Map<string, Row>(), embeddings = new Map<string, Row>();
  for (const ids of chunks(candidates.map(row => String(row.id)))) {
    for (const [table, destination] of [["idea_cards", cards], ["idea_quality_checks", qualities], ["idea_semantic_embeddings", embeddings]] as const) {
      const { data, error } = await db.from(table).select("*").in("idea_id", ids);
      if (error) throw new Error("Cannot read qualification evidence");
      for (const row of data ?? []) destination.set(String(row.idea_id), row);
    }
  }
  const { data: corpus, error: corpusError } = await db.from("idea_embedding_corpus_state").select("*").single();
  if (corpusError || !corpus) throw new Error("Cannot verify embedding corpus");
  const categoryCounts: Record<string, number> = Object.fromEntries(QUALIFICATION_CATEGORIES.map(slug => [slug, 0]));
  const evidence: { id: string; category: string | undefined; fresh: boolean; embedded: boolean; criticRecord: boolean; approvedCritic: boolean; taxonomyValid: boolean; recipeAdherent: boolean; hookFirstFrame: boolean; proofPayoff: boolean }[] = [];
  const recipes: CreativeRecipe[] = [];
  const recipesByCategory = new Map<string, CreativeRecipe[]>(QUALIFICATION_CATEGORIES.map((category) => [category, []]));
  for (const candidate of candidates) {
    const id = String(candidate.id), card = objectRecord(cards.get(id)?.card), quality = qualities.get(id) ?? {}, embedding = embeddings.get(id) ?? {};
    const category = categoryById.get(candidate.category_id);
    if (category && category in categoryCounts) categoryCounts[category]++;
    const hash = await cardContentHash(card);
    const verification = objectRecord(objectRecord(objectRecord(candidate.decision_trace).generation_gate).critic_verification);
    const generation = objectRecord(objectRecord(candidate.decision_trace).generation);
    const parsedRecipe = creativeRecipeSchema.safeParse(generation.creative_recipe);
    let recipeAdherent = false;
    if (generation.taxonomy_version === CREATIVE_TAXONOMY_VERSION && parsedRecipe.success) {
      recipes.push(parsedRecipe.data);
      if (category) recipesByCategory.get(category)?.push(parsedRecipe.data);
      const concept = objectRecord(generation.concept_plan);
      recipeAdherent = recipeMatchesConcept(parsedRecipe.data, concept) && card.hookId === parsedRecipe.data.hookTypeId && card.shootFormat === parsedRecipe.data.shootFormat && card.presenceMode === parsedRecipe.data.presenceMode;
    }
    const criticResult = objectRecord(objectRecord(objectRecord(candidate.decision_trace).generation_gate).critic_result);
    const criticChecks = objectRecord(criticResult.checks);
    const validCritic = verification.independent === true && verification.card_hash === hash && verification.profile_id === critic.id && verification.profile_hash === criticHash;
    const approvedCritic = validCritic && verification.passed === true && quality.decision === "approve";
    const meta = objectRecord(embedding.metadata);
    const embedded = embedding.source_text_hash === await sha256(semanticDocument(card)) && meta.document_version === SEMANTIC_DOCUMENT_VERSION && meta.corpus_complete === true && meta.comparison_scope === "global" && meta.corpus_revision === corpus.revision && Number(meta.corpus_count) === Number(corpus.card_count) && embedding.embedding_model === quality.embedding_model && meta.model_version === quality.embedding_model_version && typeof meta.nearest_similarity === "number" && meta.nearest_similarity === quality.embedding_duplicate_score;
    evidence.push({ id, category, fresh: objectRecord(quality.metadata).card_hash === hash, embedded, criticRecord: validCritic, approvedCritic, taxonomyValid: generation.taxonomy_version === CREATIVE_TAXONOMY_VERSION && parsedRecipe.success, recipeAdherent, hookFirstFrame: approvedCritic && criticChecks.first_frame_hook === "pass", proofPayoff: approvedCritic && criticChecks.proof_payoff === "pass" });
  }
  const creativeDistribution = analyzeCreativeDistribution(recipes);
  const creativeDistributionByCategory = Object.fromEntries(
    QUALIFICATION_CATEGORIES.map((category) => [category, analyzeCreativeDistribution(recipesByCategory.get(category) ?? [])]),
  );
  const qualityMetrics = (category?: string) => {
    const subset = evidence.filter(row => !category || row.category === category);
    const rows = subset.flatMap(row => qualities.has(row.id) ? [qualities.get(row.id)!] : []);
    const approved = rows.filter(row => row.decision === "approve");
    const approvedCards = approved.map(row => objectRecord(cards.get(String(row.idea_id))?.card) as unknown as IdeaCard);
    const fingerprints = approvedCards.map(timingFingerprint);
    const durations = analyzeDurationDistribution(approvedCards.map(card => card.durationSeconds), fingerprints);
    // Include failed attempts with no imported candidate in the category denominator.
    const attempts = runs.filter(run => !category || categoryByBatchId.get(String(run.generation_batch_id)) === category);
    const count = (key: keyof typeof subset[number]) => subset.filter(row => row[key] === true).length;
    return {
      evaluated_count: rows.length,
      schema_pass_rate: attempts.reduce((sum, run) => sum + Number(run.imported_count), 0) / Math.max(1, attempts.reduce((sum, run) => sum + Number(run.requested_count), 0)),
      taxonomy_pass_rate: count("taxonomyValid") / Math.max(1, subset.length),
      recipe_adherence_rate: count("recipeAdherent") / Math.max(1, subset.length),
      safe_approve_rate: approved.length / Math.max(1, rows.length),
      approved_average: approved.reduce((sum, row) => sum + Number(row.craft_score), 0) / Math.max(1, approved.length),
      approved_critic_pass_rate: count("approvedCritic") / Math.max(1, approved.length),
      approved_hook_first_frame_rate: count("hookFirstFrame") / Math.max(1, approved.length),
      approved_proof_payoff_rate: count("proofPayoff") / Math.max(1, approved.length),
      creative_distribution_passed: (category ? creativeDistributionByCategory[category] : creativeDistribution).issueCodes.length === 0,
      duplicate_rate_078: rows.filter(row => Number(row.embedding_duplicate_score) >= .78).length / Math.max(1, rows.length),
      banned_residue_rate: rows.filter(row => Array.isArray(row.reasons) && row.reasons.includes("creator_facing_residue")).length / Math.max(1, rows.length),
      creator_residue_rate: rows.filter(row => Array.isArray(row.reasons) && row.reasons.includes("creator_facing_residue")).length / Math.max(1, rows.length),
      duration_fit_rate: rows.filter(row => Array.isArray(row.reasons) && !row.reasons.some(reason => /duration|runtime|spoken_delivery|physical_action_exceeds/.test(String(reason)))).length / Math.max(1, rows.length),
      exact_duration_max_share: durations.maxExactSecondShare,
      timing_template_duplicate_rate: (fingerprints.length - new Set(fingerprints).size) / Math.max(1, fingerprints.length),
      embedded_count: count("embedded"), critic_record_count: count("criticRecord"), fresh_snapshot_count: count("fresh"),
      current_gate_count: rows.filter(row => row.evaluator_version === QUALITY_GATE_VERSION).length,
    };
  };
  const metrics = {
    qualification_mode: AUTOMATIC_QUALIFICATION_MODE,
    pipeline_version: GENERATION_PIPELINE_VERSION,
    scheduler_version: CREATIVE_SCHEDULER_VERSION,
    concept_ranker_version: CONCEPT_RANKER_VERSION,
    duration_planner_version: DURATION_PLANNER_VERSION,
    regression_version: regression.version, regression_passed: regression.passed, regression_case_count: regression.case_count,
    ...qualityMetrics(),
    category_counts: categoryCounts,
    category_metrics: Object.fromEntries(QUALIFICATION_CATEGORIES.map(category => [category, qualityMetrics(category)])),
    creative_distribution: creativeDistribution,
    creative_distribution_by_category: creativeDistributionByCategory,
    generator_snapshot: modelContract(profile), critic_snapshot: modelContract(critic),
    critic_profile_id: critic.id, critic_profile_hash: criticHash,
  };
  const passed = candidates.length === qualities.size && automaticQualificationPass(metrics);
  const evaluation = {
    model_profile_id: profile.id, prompt_version: PROMPT_VERSION, schema_version: 2, quality_gate_version: QUALITY_GATE_VERSION,
    brief_count: candidates.length, category_counts: categoryCounts, generation_run_ids: runIds, gold_rating_ids: [],
    metrics, status: passed ? "completed" : "invalid",
  };
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry_run", passed, human_review_required: false, evaluation }, null, 2));
  if (!passed) process.exitCode = 1;
  if (!apply) return;
  const { data: inserted, error } = await db.from("idea_model_qualification_evals").insert(evaluation).select("id").single();
  if (error || !inserted) throw new Error("Cannot save qualification evaluation");
  if (approve) {
    if (!passed) throw new Error("Invalid automatic qualification; profile remains shadow");
    const { data, error: qualificationError } = await db.rpc("qualify_idea_model_profile", { p_profile_slug: profileSlug, p_eval_id: inserted.id });
    if (qualificationError) throw new Error("Qualification approval failed");
    console.log(JSON.stringify({ qualification_eval_id: inserted.id, result: data }));
    if (!objectRecord(data).qualified) process.exitCode = 1;
  }
}

main().catch(() => {
  console.error("Automatic qualification failed. Check arguments, current evidence and database migrations; no profile was force-approved.");
  process.exitCode = 1;
});
