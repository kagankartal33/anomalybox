import { createClient } from "@supabase/supabase-js";

const PILOT = new Set(["beauty", "entertainment_comedy", "travel", "fitness_wellness_safe", "food"]);
const apply = process.argv.includes("--apply");
const profileIndex = process.argv.indexOf("--profile");
const profileSlug = profileIndex >= 0 ? process.argv[profileIndex + 1] : "";
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminToken = process.env.ADMIN_API_TOKEN ?? process.env.INTERNAL_API_TOKEN;
const functionsBase = process.env.SUPABASE_FUNCTIONS_URL ?? `${supabaseUrl}/functions/v1`;
if (!supabaseUrl || !serviceKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function post(path: string, body: unknown) {
  if (!adminToken) throw new Error("ADMIN_API_TOKEN or INTERNAL_API_TOKEN is required with --apply");
  const response = await fetch(`${functionsBase}/admin-generation-batches${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`generation endpoint ${path} failed: ${response.status} ${JSON.stringify(payload)}`);
  return payload as Record<string, unknown>;
}

async function main() {
  const [{ data: paused, error: pausedError }, { data: categories }, { data: personas }] = await Promise.all([
    supabase.from("idea_inventory").select("id,category_id,persona_id,metadata").eq("status", "paused"),
    supabase.from("categories").select("id,slug"),
    supabase.from("creator_personas").select("id,slug"),
  ]);
  if (pausedError) throw pausedError;
  const categoryById = new Map((categories ?? []).map((row) => [row.id, row.slug]));
  const personaById = new Map((personas ?? []).map((row) => [row.id, row.slug]));
  const lanes = new Map<string, { categorySlug: string; personaSlug: string; count: number }>();
  for (const row of paused ?? []) {
    if (row.metadata?.pause_reason !== "quality_quarantine_v2_2") continue;
    const categorySlug = categoryById.get(row.category_id);
    const personaSlug = personaById.get(row.persona_id);
    if (!categorySlug || !personaSlug || !PILOT.has(categorySlug)) continue;
    const key = `${categorySlug}/${personaSlug}`;
    const lane = lanes.get(key) ?? { categorySlug, personaSlug, count: 0 };
    lane.count += 1;
    lanes.set(key, lane);
  }
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry_run", replacement_requirements: [...lanes.values()] }, null, 2));
  if (!apply) return;
  if (!profileSlug) throw new Error("--profile is required with --apply");

  for (const lane of lanes.values()) {
    const batch = await post("", {
      external_batch_id: `v22_restock_${lane.categorySlug}_${lane.personaSlug}_${Date.now()}`,
      category_slug: lane.categorySlug,
      persona_slug: lane.personaSlug,
      target_count: lane.count,
      language: "en",
      platform: "instagram_reels",
      generator_version: "2.2.0",
      manifest: { purpose: "quality_quarantine_restock_v2_2", quarantined_count: lane.count },
    });
    const batchId = String(batch.id);
    let remaining = lane.count;
    while (remaining > 0) {
      const chunk = Math.min(25, remaining);
      await post(`/${batchId}/generate`, { profile_slug: profileSlug, target_count: chunk, candidate_multiplier: 3, shadow: false });
      remaining -= chunk;
    }
    await post(`/${batchId}/score`, { offset: 0, limit: Math.max(lane.count, 1), final_chunk: true });
    await post(`/${batchId}/publish-inventory`, { quality_floor: 88, max_reuse_count: 1 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});