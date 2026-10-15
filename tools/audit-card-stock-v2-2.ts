import { createClient } from "@supabase/supabase-js";
import { evaluateIdeaCardV22, QUALITY_GATE_VERSION } from "../lib/idea-card/quality-v2-2";
import { cardContentHash, objectRecord, SEMANTIC_DOCUMENT_VERSION, semanticDocument, sha256 } from "../lib/generation/automatic-policy";
import { stockAuditQualityContext } from "../lib/generation/stock-audit-context";
import { adaptLegacyIdeaCard } from "../lib/idea-card/adapt-legacy";
import { analyzeDurationDistribution, timingFingerprint } from "../lib/idea-card/duration-planner";

const apply = process.argv.includes("--apply");
const rollback = process.argv.includes("--rollback");
const ideaIdsIndex = process.argv.indexOf("--idea-ids");
const approvedRollbackIds = new Set(
  ideaIdsIndex >= 0
    ? String(process.argv[ideaIdsIndex + 1] ?? "").split(",").map((value) => value.trim()).filter(Boolean)
    : [],
);
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

function safeServiceUrl(value: string) {
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error("SUPABASE_URL is invalid"); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if ((parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) || parsed.username || parsed.password) {
    throw new Error("SUPABASE_URL must use HTTPS and must not contain credentials");
  }
  return parsed.toString().replace(/\/$/, "");
}

const supabase = createClient(safeServiceUrl(supabaseUrl), serviceKey, { auth: { persistSession: false } });

type InventoryRow = { id: string; idea_id: string; status: string; metadata: Record<string, unknown> | null };

function chunks<T>(rows: T[], size = 100): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < rows.length; index += size) output.push(rows.slice(index, index + size));
  return output;
}

async function inventoryByStatus(status: "available" | "paused") {
  const rows: InventoryRow[] = [];
  const pageSize = 1000;
  for (let from = 0;; from += pageSize) {
    const { data, error } = await supabase
      .from("idea_inventory")
      .select("id,idea_id,status,metadata")
      .eq("status", status)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as InventoryRow[]));
    if ((data ?? []).length < pageSize) return rows;
  }
}

async function protectedInventoryIds() {
  const ideaIds = new Set<string>();
  const inventoryIds = new Set<string>();
  const pageSize = 1000;
  for (let from = 0;; from += pageSize) {
    const { data, error } = await supabase
      .from("idea_box_items")
      .select("idea_id,inventory_id")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.idea_id) ideaIds.add(String(row.idea_id));
      if (row.inventory_id) inventoryIds.add(String(row.inventory_id));
    }
    if ((data ?? []).length < pageSize) break;
  }
  for (let from = 0;; from += pageSize) {
    const { data, error } = await supabase
      .from("checkout_inventory_reservations")
      .select("idea_id,inventory_id")
      .eq("status", "active")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.idea_id) ideaIds.add(String(row.idea_id));
      if (row.inventory_id) inventoryIds.add(String(row.inventory_id));
    }
    if ((data ?? []).length < pageSize) break;
  }
  return { ideaIds, inventoryIds };
}

function fingerprintScore(check: Record<string, unknown> | undefined): number | null {
  const lexical = check?.lexical_signature;
  if (!lexical || typeof lexical !== "object" || Array.isArray(lexical)) return null;
  const duplicateMatch = (lexical as Record<string, unknown>).duplicate_match;
  if (!duplicateMatch || typeof duplicateMatch !== "object" || Array.isArray(duplicateMatch)) return null;
  const score = Number((duplicateMatch as Record<string, unknown>).strict_score);
  return Number.isFinite(score) ? score : null;
}

async function main() {
  if (rollback) {
    if (apply && !approvedRollbackIds.size) {
      throw new Error("Rollback apply requires an explicit admin-approved --idea-ids uuid1,uuid2 list");
    }
    const [pausedInventory, protectedIds] = await Promise.all([inventoryByStatus("paused"), protectedInventoryIds()]);
    const eligibleRows = pausedInventory.filter((row) =>
      row.metadata?.pause_reason === "quality_quarantine_v3" &&
      !protectedIds.ideaIds.has(row.idea_id) &&
      !protectedIds.inventoryIds.has(row.id)
    );
    const rows = apply ? eligibleRows.filter((row) => approvedRollbackIds.has(row.idea_id)) : eligibleRows;
    console.log(JSON.stringify({ mode: apply ? "rollback_apply" : "rollback_dry_run", eligible: eligibleRows.length, selected: rows.length }, null, 2));
    if (apply) {
      let restored = 0;
      let conflictSkipped = 0;
      for (const row of rows) {
        const { data: restoredRow, error: updateError } = await supabase.rpc("rollback_idea_inventory_v3", {
          p_inventory_id: row.id,
        });
        if (updateError) throw updateError;
        if (restoredRow === true) restored += 1;
        else conflictSkipped += 1;
      }
      console.log(JSON.stringify({ restored, conflict_skipped: conflictSkipped }, null, 2));
    }
    return;
  }

  const [inventory, protectedIds] = await Promise.all([inventoryByStatus("available"), protectedInventoryIds()]);
  const available = inventory.filter((row) =>
    !protectedIds.ideaIds.has(row.idea_id) && !protectedIds.inventoryIds.has(row.id)
  );
  const ideaIds = available.map((row) => row.idea_id);
  const cards: Array<{ idea_id: string; card: unknown }> = [];
  const checks: Array<Record<string, unknown> & { idea_id: string }> = [];
  const embeddings: Array<Record<string, unknown> & { idea_id: string }> = [];
  const candidates: Array<Record<string, unknown> & { id: string }> = [];
  for (const idChunk of chunks(ideaIds)) {
    const [{ data: cardRows, error: cardError }, { data: checkRows, error: checkError }, { data: embeddingRows, error: embeddingError }, { data: candidateRows, error: candidateError }] = await Promise.all([
      supabase.from("idea_cards").select("idea_id,card").in("idea_id", idChunk),
      supabase.from("idea_quality_checks").select("idea_id,embedding_duplicate_score,semantic_duplicate_score,embedding_model,embedding_model_version,lexical_signature,metadata,evaluator_version").in("idea_id", idChunk),
      supabase.from("idea_semantic_embeddings").select("idea_id,embedding_model,source_text_hash,metadata").in("idea_id", idChunk),
      supabase.from("idea_candidates").select("id,decision_trace,safety_status,platform,language,category:categories!category_id(slug),persona:creator_personas!persona_id(slug)").in("id", idChunk),
    ]);
    if (cardError) throw cardError;
    if (checkError) throw checkError;
    if (embeddingError) throw embeddingError;
    if (candidateError) throw candidateError;
    cards.push(...(cardRows ?? []));
    checks.push(...((checkRows ?? []) as typeof checks));
    embeddings.push(...((embeddingRows ?? []) as typeof embeddings));
    candidates.push(...((candidateRows ?? []) as typeof candidates));
  }
  const cardByIdea = new Map((cards ?? []).map((row) => [row.idea_id, row.card]));
  const checkByIdea = new Map((checks ?? []).map((row) => [row.idea_id, row]));
  const embeddingByIdea = new Map((embeddings ?? []).map((row) => [row.idea_id, row]));
  const candidateByIdea = new Map(candidates.map((row) => [row.id, row]));
  const quarantines: Array<{ inventory: InventoryRow; reasons: string[]; score: number }> = [];
  const durationAuditRows: Array<{ ideaId: string; lane: string; duration: number; timing: string }> = [];
  const { data: corpus, error: corpusError } = await supabase.from("idea_embedding_corpus_state").select("*").maybeSingle();
  if (corpusError) throw corpusError;
  if (!corpus) throw new Error("Embedding corpus state unavailable; stock audit cannot establish originality");

  for (const row of available) {
    const card = cardByIdea.get(row.idea_id);
    if (!card) {
      quarantines.push({ inventory: row, reasons: ["missing_card_payload"], score: 0 });
      continue;
    }
    const check = checkByIdea.get(row.idea_id);
    const embedding = embeddingByIdea.get(row.idea_id);
    const candidate = candidateByIdea.get(row.idea_id);
    const contentHash = await cardContentHash(card);
    const generationContext = stockAuditQualityContext(card, candidate, contentHash);
    const adapted = adaptLegacyIdeaCard(card, { ideaId: row.idea_id });
    durationAuditRows.push({
      ideaId: row.idea_id,
      lane: String(row.metadata?.category_slug ?? adapted.card.category ?? "unknown"),
      duration: adapted.card.durationSeconds,
      timing: timingFingerprint(adapted.card),
    });
    const meta = objectRecord(check?.metadata);
    const fresh = check?.evaluator_version === QUALITY_GATE_VERSION && meta.card_hash === contentHash;
    const embeddingMeta = objectRecord(embedding?.metadata);
    const semanticFresh = Boolean(embedding?.source_text_hash === await sha256(semanticDocument(card)) && embeddingMeta.document_version === SEMANTIC_DOCUMENT_VERSION && embeddingMeta.corpus_revision === corpus.revision && Number(embeddingMeta.corpus_count) === Number(corpus.card_count) && embeddingMeta.corpus_complete === true && embeddingMeta.comparison_scope === "global" && typeof embeddingMeta.model_version === "string" && /^[0-9a-f]{40}$/.test(embeddingMeta.model_version));
    const rawSemanticScore = semanticFresh && typeof embeddingMeta.nearest_similarity === "number" ? embeddingMeta.nearest_similarity : null;
    const quality = evaluateIdeaCardV22(objectRecord(card).schemaVersion === 2 ? card : adapted.card, {
      ...generationContext,
      rawInput: card,
      semanticScore: typeof rawSemanticScore === "number" ? rawSemanticScore : null,
      fingerprintScore: fresh ? fingerprintScore(check) : null,
      embeddingModel: semanticFresh && typeof embedding?.embedding_model === "string" ? embedding.embedding_model : null,
      embeddingModelVersion: semanticFresh && typeof embeddingMeta.model_version === "string" ? embeddingMeta.model_version : null,
      requireOriginalityEvidence: true,
    });
    const reasons = [...quality.hardGateCodes, ...(generationContext.additionalIssueCodes ?? []), ...quality.issueCodes.filter((code) => code === "originality_unverified" || code === "embedding_identity_unverified")];
    if (reasons.length) {
      quarantines.push({ inventory: row, reasons: [...new Set(reasons)], score: quality.craftScore });
    }
  }

  const laneDurationAudit = Object.fromEntries(
    [...new Set(durationAuditRows.map((row) => row.lane))].sort().map((lane) => {
      const rows = durationAuditRows.filter((row) => row.lane === lane);
      return [lane, analyzeDurationDistribution(rows.map((row) => row.duration), rows.map((row) => row.timing))];
    }),
  );
  const timingCounts = new Map<string, number>();
  for (const row of durationAuditRows) {
    const key = `${row.lane}:${row.timing}`;
    timingCounts.set(key, (timingCounts.get(key) ?? 0) + 1);
  }
  const repeatedTimingTemplates = [...timingCounts.entries()]
    .filter(([, count]) => count > 1)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 20)
    .map(([fingerprint, count]) => ({ fingerprint, count }));

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry_run",
    scanned_available_unused: available.length,
    quarantine_count: quarantines.length,
    duration_audit: {
      overall: analyzeDurationDistribution(durationAuditRows.map((row) => row.duration)),
      by_lane: laneDurationAudit,
      repeated_timing_template_count: repeatedTimingTemplates.length,
      top_repeated_timing_templates: repeatedTimingTemplates,
    },
    sample: quarantines.slice(0, 20).map((row) => ({ idea_id: row.inventory.idea_id, score: row.score, reasons: row.reasons })),
  }, null, 2));

  if (apply) {
    let quarantined = 0;
    let conflictSkipped = 0;
    for (const item of quarantines) {
      const { data: quarantinedRow, error } = await supabase.rpc("quarantine_idea_inventory_v3", {
        p_inventory_id: item.inventory.id,
        p_reasons: item.reasons,
        p_score: item.score,
      });
      if (error) throw error;
      if (quarantinedRow === true) quarantined += 1;
      else conflictSkipped += 1;
    }
    console.log(JSON.stringify({ quarantined, conflict_skipped: conflictSkipped }, null, 2));
  }
}

main().catch((error) => {
  const details = error && typeof error === "object"
    ? Object.fromEntries(["name", "code", "message", "details", "hint"].flatMap((key) => key in error ? [[key, String((error as Record<string, unknown>)[key])]] : []))
    : { message: String(error) };
  console.error(JSON.stringify(details));
  process.exitCode = 1;
});
