/**
 * Persist hookId / shootFormat / presenceMode / whyItWorks onto idea_cards.card.
 * Usage:
 *   npx tsx tools/backfill-algorithmic-reason.mjs
 *   npx tsx tools/backfill-algorithmic-reason.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PURCHASE_LANES } from "../lib/algorithmic-reason/compatibility.ts";
import { enrichAlgorithmicFields } from "../lib/algorithmic-reason/enrich-card.ts";
import { adaptLegacyIdeaCard } from "../lib/idea-card/adapt-legacy.ts";

function loadDotEnv(filePath = ".env.local") {
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

loadDotEnv(path.resolve(".env.local"));

const apply = process.argv.includes("--apply");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: laneRows, error: laneErr } = await sb
  .from("categories")
  .select("id,slug")
  .in("slug", [...PURCHASE_LANES]);
if (laneErr) {
  console.error(laneErr.message);
  process.exit(1);
}
const laneIds = (laneRows ?? []).map((c) => c.id);
if (!laneIds.length) {
  console.error("No canonical purchase lanes found");
  process.exit(1);
}

const candidateMeta = [];
for (let from = 0; from < 5000; from += 200) {
  const { data, error } = await sb
    .from("idea_candidates")
    .select("id,category_id,persona_id")
    .in("category_id", laneIds)
    .range(from, from + 199);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (!data?.length) break;
  candidateMeta.push(...data);
  if (data.length < 200) break;
}
const candidateIds = candidateMeta.map((row) => row.id);
const candById = new Map(candidateMeta.map((row) => [row.id, row]));
process.stderr.write(`lanes=${laneIds.length} candidates=${candidateIds.length}\n`);

const rows = [];
for (let i = 0; i < candidateIds.length; i += 100) {
  const chunk = candidateIds.slice(i, i + 100);
  const { data, error } = await sb.from("idea_cards").select("idea_id,title,card").in("idea_id", chunk);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  rows.push(...(data ?? []));
}
process.stderr.write(`12-lane cards=${rows.length}\n`);

const { data: personas } = await sb.from("creator_personas").select("id,slug").limit(200);
const catById = new Map((laneRows ?? []).map((c) => [c.id, c.slug]));
const personaById = new Map((personas ?? []).map((p) => [p.id, p.slug]));

let updated = 0;
let skipped = 0;
const samples = [];

console.log(`scanned fetch=${rows.length}`);
for (const row of rows) {
  const raw = row.card && typeof row.card === "object" ? { ...row.card } : {};
  const cand = candById.get(row.idea_id);
  if (cand?.category_id) raw.category = catById.get(cand.category_id) ?? raw.category;
  if (cand?.persona_id) {
    raw.personaSlug = personaById.get(cand.persona_id) ?? raw.personaSlug;
    raw.persona_slug = raw.personaSlug;
  }

  const adapted = adaptLegacyIdeaCard(raw, { ideaId: row.idea_id, dbTitle: row.title });
  const laneSlug = cand?.category_id ? catById.get(cand.category_id) : adapted.card.category;
  const personaSlug = cand?.persona_id ? personaById.get(cand.persona_id) : adapted.card.personaSlug;
  const forced = enrichAlgorithmicFields({
    ...adapted.card,
    category: laneSlug,
    personaSlug,
    hookId: undefined,
  });
  const card = {
    ...adapted.card,
    category: laneSlug ?? adapted.card.category,
    personaSlug,
    hookId: forced.hookId,
    shootFormat: forced.shootFormat,
    presenceMode: forced.presenceMode,
    whyItWorks: forced.whyItWorks,
  };
  if (!card.hookId && !card.shootFormat && !card.whyItWorks) {
    skipped += 1;
    continue;
  }

  const next = {
    ...raw,
    schemaVersion: Array.isArray(raw.steps) && raw.steps.length >= 3 ? 2 : raw.schemaVersion,
    whyItWorks: card.whyItWorks,
    why_it_works: card.whyItWorks,
    hookId: card.hookId,
    hook_id: card.hookId,
    shootFormat: card.shootFormat,
    shoot_format: card.shootFormat,
    presenceMode: card.presenceMode,
    personaSlug: card.personaSlug ?? raw.persona_slug,
  };

  const changed =
    raw.hook_id !== next.hook_id ||
    raw.shoot_format !== next.shoot_format ||
    raw.why_it_works !== next.why_it_works ||
    raw.presenceMode !== next.presenceMode;

  if (!changed) {
    skipped += 1;
    continue;
  }

  updated += 1;
  if (samples.length < 8) {
    samples.push({
      idea_id: row.idea_id,
      hasCand: Boolean(cand),
      categoryId: cand?.category_id ?? null,
      category: laneSlug ?? null,
      hookId: card.hookId,
      shootFormat: card.shootFormat,
      presenceMode: card.presenceMode ?? null,
    });
  }

  if (apply) {
    const { error: upErr } = await sb.from("idea_cards").update({ card: next }).eq("idea_id", row.idea_id);
    if (upErr) {
      console.error("update failed", row.idea_id, upErr.message);
      process.exit(1);
    }
  }
}

console.log(
  JSON.stringify(
    { apply, scanned: rows?.length ?? 0, updated, skipped, samples },
    null,
    2,
  ),
);
