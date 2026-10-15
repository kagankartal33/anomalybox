import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { profileMatchesQualificationContract, QUALIFICATION_CATEGORIES } from "../lib/generation/qualification";
import { PROMPT_VERSION } from "../lib/generation/contracts";
import { QUALITY_GATE_VERSION } from "../lib/idea-card/quality-v2-2";

const RESTOCK_CATEGORIES = new Set<string>(QUALIFICATION_CATEGORIES);
const apply = process.argv.includes("--apply");
const profileIndex = process.argv.indexOf("--profile");
const profileSlug = profileIndex >= 0 ? process.argv[profileIndex + 1] : "";
const embeddingRevisionIndex = process.argv.indexOf("--embedding-revision");
const embeddingRevision = embeddingRevisionIndex >= 0 ? process.argv[embeddingRevisionIndex + 1] : process.env.VIRALBOX_EMBEDDING_MODEL_REVISION ?? "";
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminToken = process.env.ADMIN_API_TOKEN ?? process.env.INTERNAL_API_TOKEN;
const functionsBase = process.env.SUPABASE_FUNCTIONS_URL ?? `${supabaseUrl}/functions/v1`;
if (!supabaseUrl || !serviceKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

function safeServiceUrl(value: string, label: string) {
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error(`${label} is invalid`); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if ((parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) || parsed.username || parsed.password) {
    throw new Error(`${label} must use HTTPS and must not contain credentials`);
  }
  return parsed.toString().replace(/\/$/, "");
}

const safeSupabaseUrl = safeServiceUrl(supabaseUrl, "SUPABASE_URL");
const safeFunctionsBase = safeServiceUrl(functionsBase, "SUPABASE_FUNCTIONS_URL");
const supabase = createClient(safeSupabaseUrl, serviceKey, { auth: { persistSession: false } });

async function pausedQuarantineRows() {
  const rows: Array<{ id: string; category_id: string; persona_id: string; metadata: Record<string, unknown> | null }> = [];
  const pageSize = 1000;
  for (let from = 0;; from += pageSize) {
    const { data, error } = await supabase
      .from("idea_inventory")
      .select("id,category_id,persona_id,metadata")
      .eq("status", "paused")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as typeof rows));
    if ((data ?? []).length < pageSize) return rows;
  }
}

async function post(path: string, body: unknown) {
  if (!adminToken) throw new Error("ADMIN_API_TOKEN or INTERNAL_API_TOKEN is required with --apply");
  const attempts = path.endsWith("/generate") ? 2 : 1;
  for (let attempt = 0; attempt < attempts; attempt++) {
    let response: Response;
    try {
      response = await fetch(`${safeFunctionsBase}/admin-generation-batches${path}`, {
        method: "POST", signal: AbortSignal.timeout(120000),
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify(body), // A retry reuses the exact request_id and payload.
      });
    } catch {
      if (attempt + 1 < attempts) { await delay(1500); continue; }
      throw new Error(`Generation request interrupted: ${path}; inspect its request_id before a new run`);
    }
    if ([429, 502, 503, 504].includes(response.status) && attempt + 1 < attempts) { await response.body?.cancel(); await delay(1500); continue; }
    if (!response.ok) throw new Error(`Generation endpoint failed with HTTP ${response.status}; ${path}`);
    return await response.json() as Record<string, unknown>;
  }
  throw new Error("Generation retry budget exhausted");
}

async function get(path: string) {
  if (!adminToken) throw new Error("ADMIN_API_TOKEN or INTERNAL_API_TOKEN is required with --apply");
  const response = await fetch(`${safeFunctionsBase}/admin-generation-batches${path}`, {
    method: "GET", signal: AbortSignal.timeout(30000), headers: { "x-admin-token": adminToken },
  });
  if (!response.ok) throw new Error(`Generation status endpoint failed with HTTP ${response.status}; ${path}`);
  return await response.json() as Record<string, unknown>;
}

async function waitForRun(batchId: string, runId: string) {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const run = await get(`/${batchId}/runs/${runId}`);
    if (["completed", "partial", "failed"].includes(String(run.status))) return run;
    await delay(2000);
  }
  throw new Error(`Generation run did not finish within 10 minutes: ${runId}`);
}

async function main() {
  const [paused, { data: categories }, { data: personas }] = await Promise.all([
    pausedQuarantineRows(),
    supabase.from("categories").select("id,slug"),
    supabase.from("creator_personas").select("id,slug"),
  ]);
  const categoryById = new Map((categories ?? []).map((row) => [row.id, row.slug]));
  const personaById = new Map((personas ?? []).map((row) => [row.id, row.slug]));
  const lanes = new Map<string, { categorySlug: string; personaSlug: string; rows: Array<{ id: string; metadata: Record<string, unknown> }> }>();
  for (const row of paused) {
    if (row.metadata?.pause_reason !== "quality_quarantine_v3") continue;
    if (row.metadata?.quality_replacement_batch_id) continue;
    const categorySlug = categoryById.get(row.category_id);
    const personaSlug = personaById.get(row.persona_id);
    if (!categorySlug || !personaSlug || !RESTOCK_CATEGORIES.has(categorySlug)) continue;
    const key = `${categorySlug}/${personaSlug}`;
    const lane = lanes.get(key) ?? { categorySlug, personaSlug, rows: [] as Array<{ id: string; metadata: Record<string, unknown> }> };
    lane.rows.push({ id: row.id, metadata: row.metadata as Record<string, unknown> });
    lanes.set(key, lane);
  }
  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry_run",
    replacement_requirements: [...lanes.values()].map((lane) => ({ categorySlug: lane.categorySlug, personaSlug: lane.personaSlug, count: lane.rows.length })),
  }, null, 2));
  if (!apply) return;
  if (!profileSlug) throw new Error("--profile is required with --apply");
  if (!/^[0-9a-f]{40}$/.test(embeddingRevision)) throw new Error("--embedding-revision requires an immutable 40-character commit SHA");
  const { data: profile, error: profileError } = await supabase.from("idea_model_profiles").select("*").eq("profile_slug", profileSlug).single();
  if (profileError || !profile || !profileMatchesQualificationContract(profile, { promptVersion: PROMPT_VERSION, schemaVersion: 2, qualityGateVersion: QUALITY_GATE_VERSION })) throw new Error("Current automatic model qualification required before restock");

  for (const lane of lanes.values()) {
    let remaining = lane.rows.length;
    let compensated = 0;
    let attempt = 0;
    while (remaining > 0 && attempt < 8) {
      attempt += 1;
      const batch = await post("", {
        external_batch_id: `v3_restock_${lane.categorySlug}_${lane.personaSlug}_${Date.now()}_${attempt}`,
        category_slug: lane.categorySlug,
        persona_slug: lane.personaSlug,
        target_count: remaining,
        language: "en",
        platform: "instagram_reels",
        generator_version: "3.0-automatic",
        manifest: { purpose: "quality_quarantine_restock_v3", quarantined_count: lane.rows.length, attempt },
      });
      const batchId = String(batch.id);
      let importedCount = 0;
      let generationCalls = 0;
      const maxGenerationCalls = Math.max(4, remaining * 4);
      while (importedCount < remaining && generationCalls < maxGenerationCalls) {
        generationCalls += 1;
        const queued = await post(`/${batchId}/generate`, { profile_slug: profileSlug, target_count: 1, candidate_multiplier: 5, shadow: false, request_id: crypto.randomUUID() });
        const generated = await waitForRun(batchId, String(queued.run_id));
        importedCount += Math.max(0, Number(generated.imported_count ?? 0));
      }
      execFileSync(process.env.PYTHON_BIN ?? "python", [
        "tools/embed-card-stock-v2-2.py",
        "--apply",
        "--limit",
        "50000",
        "--revision",
        embeddingRevision,
      ], { cwd: process.cwd(), env: process.env, stdio: "inherit" });
      for (let offset = 0; offset < importedCount; offset += 250) {
        await post(`/${batchId}/score`, { offset, limit: Math.min(250, importedCount - offset), final_chunk: offset + 250 >= importedCount });
      }
      const published = await post(`/${batchId}/publish-inventory`, { quality_floor: 90, editorial_quality_floor: 90 });
      const publishedCount = Math.max(0, Number(published.published_inventory ?? 0));
      const rowsToMark = lane.rows.slice(compensated, compensated + Math.min(publishedCount, remaining));
      for (const row of rowsToMark) {
        const { error } = await supabase.from("idea_inventory").update({
          metadata: {
            ...row.metadata,
            quality_replacement_batch_id: batchId,
            quality_replacement_completed_at: new Date().toISOString(),
          },
        }).eq("id", row.id).eq("status", "paused");
        if (error) throw error;
      }
      compensated += rowsToMark.length;
      remaining -= rowsToMark.length;
    }
    if (remaining > 0) {
      throw new Error(`V3 restock could not replace ${remaining} quarantined cards in ${lane.categorySlug}/${lane.personaSlug} after 8 attempts`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
