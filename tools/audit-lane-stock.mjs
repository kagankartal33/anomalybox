/**
 * Audit sellable stock for purchase-lane × creator-mode checkout.
 * Usage:
 *   rtk node tools/audit-lane-stock.mjs
 *   rtk node tools/audit-lane-stock.mjs --env .env.vercel
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PURCHASE_LANES = [
  "beauty",
  "fashion",
  "commerce_affiliate",
  "creator_education",
  "entertainment_comedy",
  "fitness_wellness_safe",
  "food",
  "lifestyle",
  "luxury",
  "parenting_family",
  "thought_leadership",
  "travel",
];

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

const envFlag = process.argv.indexOf("--env");
const envFile = envFlag >= 0 ? process.argv[envFlag + 1] : ".env.local";
loadDotEnv(path.resolve(envFile));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

function isRenderable(card, title) {
  if (!card || typeof card !== "object" || Array.isArray(card)) return false;
  const resolved = String(card.title ?? title ?? "").trim();
  if (resolved.length < 2) return false;
  return (Array.isArray(card.steps) && card.steps.length >= 3)
    || (Array.isArray(card.scene_script) && card.scene_script.length >= 1);
}

const [{ data: products, error: productError }, { data: categories, error: catError }, { data: personas, error: personaError }] = await Promise.all([
  sb.from("box_products").select("slug,idea_count,allocation,enabled").eq("enabled", true),
  sb.from("categories").select("id,slug,enabled").eq("enabled", true),
  sb.from("creator_personas").select("id,slug,enabled").eq("enabled", true),
]);
if (productError || catError || personaError) {
  console.error(productError?.message || catError?.message || personaError?.message);
  process.exit(1);
}

const classicNeed = Number((products ?? []).find((row) => row.slug === "viral_box_500")?.allocation?.high ?? 2);
const premiumNeed = Number((products ?? []).find((row) => row.slug === "premium_viral_box_1000")?.allocation?.high ?? 5);

const { data: health, error: healthError } = await sb.rpc("inventory_health");
if (healthError) {
  console.error(`inventory_health failed: ${healthError.message}`);
  process.exit(1);
}

const healthRows = health ?? [];
const laneSet = new Set(PURCHASE_LANES);
const laneRows = healthRows.filter((row) => laneSet.has(row.category_slug));
const emptyLaneCells = laneRows.filter((row) => Number(row.high_count || 0) < classicNeed);
const cannotPremium = laneRows.filter((row) => Number(row.high_count || 0) < premiumNeed);

const sample = laneRows.slice(0, 12);
const sampleCounts = [];
for (const row of sample) {
  const { data, error } = await sb.rpc("available_inventory_counts", {
    p_category_slug: row.category_slug,
    p_persona_slug: row.persona_slug,
  });
  if (error) {
    sampleCounts.push({ cell: `${row.category_slug}/${row.persona_slug}`, error: error.message });
    continue;
  }
  const high = Number((data ?? []).find((item) => item.score_band === "high")?.available_count ?? 0);
  sampleCounts.push({
    cell: `${row.category_slug}/${row.persona_slug}`,
    healthHigh: Number(row.high_count || 0),
    rpcHigh: high,
  });
}

const { count: availableHigh } = await sb
  .from("idea_inventory")
  .select("id", { count: "exact", head: true })
  .eq("status", "available")
  .eq("score_band", "high")
  .eq("reuse_count", 0)
  .gte("internal_rank_score", 80)
  .eq("quality_floor_passed", true);

const { data: emptySample } = await sb
  .from("idea_inventory")
  .select("idea_id,category_id,persona_id,score_band,status,internal_rank_score")
  .eq("status", "available")
  .eq("reuse_count", 0)
  .eq("score_band", "high")
  .gte("internal_rank_score", 80)
  .limit(80);

const ideaIds = (emptySample ?? []).map((row) => row.idea_id);
const { data: cardRows } = ideaIds.length
  ? await sb.from("idea_cards").select("idea_id,title,card").in("idea_id", ideaIds)
  : { data: [] };
const cardByIdea = new Map((cardRows ?? []).map((row) => [row.idea_id, row]));
const emptyInSample = (emptySample ?? []).filter((row) => {
  const card = cardByIdea.get(row.idea_id);
  return !card || !isRenderable(card.card, card.title);
}).length;

const report = {
  target: url,
  products: (products ?? []).map((row) => ({ slug: row.slug, allocation: row.allocation, idea_count: row.idea_count })),
  enabledCategories: (categories ?? []).length,
  enabledPersonas: (personas ?? []).length,
  purchaseLaneCells: laneRows.length,
  cellsUnableClassic: emptyLaneCells.length,
  cellsUnablePremium: cannotPremium.length,
  availableHighApprox: availableHigh,
  emptyOrUnrenderableInHighSample: `${emptyInSample}/${(emptySample ?? []).length}`,
  worstLaneCells: [...laneRows]
    .sort((a, b) => Number(a.high_count || 0) - Number(b.high_count || 0))
    .slice(0, 20)
    .map((row) => ({
      category: row.category_slug,
      persona: row.persona_slug,
      high: Number(row.high_count || 0),
      needs_generation: row.needs_generation,
    })),
  sampleRpc: sampleCounts,
};

console.log(JSON.stringify(report, null, 2));
if (emptyLaneCells.length) {
  process.exitCode = 2;
}
