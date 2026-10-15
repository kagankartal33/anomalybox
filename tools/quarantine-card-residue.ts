/**
 * Re-score available unused high inventory with scoreIdeaCard + AI-residue gate.
 * Failures become unsellable (quality_floor_passed=false, score_band=low).
 * Skips reserved, delivered, and reused rows.
 *
 *   npx tsx tools/quarantine-card-residue.ts --dry-run
 *   npx tsx tools/quarantine-card-residue.ts --apply
 *   npx tsx tools/quarantine-card-residue.ts --apply --env .env.local
 *   npx tsx tools/quarantine-card-residue.ts --sql-out tmp/quarantine.sql
 *
 * Pipeline: VIRAL IDEA CARDS only.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { adaptLegacyIdeaCard, scanIdeaCardResidue, scoreIdeaCard } from "../lib/idea-card";

const PAGE = 200;

type InventoryRow = {
  id: string;
  idea_id: string;
  score_band: string;
  internal_rank_score: number;
  quality_floor_passed: boolean;
  status: string;
  reuse_count: number;
  metadata: Record<string, unknown> | null;
};

type Verdict = {
  id: string;
  idea_id: string;
  title: string;
  previous_score: number;
  previous_band: string;
  previous_metadata: Record<string, unknown>;
  score: number;
  red_gates: boolean;
  hits: string[];
  quarantine: boolean;
  reason: string;
};

function argValue(flag: string, fallback = "") {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return fallback;
  return process.argv[idx + 1];
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function loadDotEnv(filePath: string) {
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

function sqlQuote(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}

function chunks<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function fetchReservedIds(sb: SupabaseClient) {
  const reserved = new Set<string>();
  const { data, error } = await sb
    .from("checkout_inventory_reservations")
    .select("inventory_id,idea_id,status,expires_at")
    .eq("status", "active");
  if (error) {
    console.warn(JSON.stringify({ warn: "reservation_lookup_failed", message: error.message }));
    return reserved;
  }
  const now = Date.now() - 15 * 60 * 1000;
  for (const row of data ?? []) {
    const expires = row.expires_at ? Date.parse(String(row.expires_at)) : 0;
    if (expires && expires < now) continue;
    if (row.inventory_id) reserved.add(String(row.inventory_id));
    if (row.idea_id) reserved.add(`idea:${row.idea_id}`);
  }
  return reserved;
}

async function fetchSellablePage(sb: SupabaseClient, from: number, pageSize: number) {
  const to = from + pageSize - 1;
  const { data, error } = await sb
    .from("idea_inventory")
    .select("id,idea_id,score_band,internal_rank_score,quality_floor_passed,status,reuse_count,metadata")
    .eq("status", "available")
    .eq("reuse_count", 0)
    .eq("quality_floor_passed", true)
    .eq("score_band", "high")
    .gte("internal_rank_score", 80)
    .order("id", { ascending: true })
    .range(from, to);
  if (error) throw new Error(error.message);
  return (data ?? []) as InventoryRow[];
}

async function fetchCards(sb: SupabaseClient, ideaIds: string[]) {
  const map = new Map<string, { title: string; card: Record<string, unknown> }>();
  for (const group of chunks(ideaIds, 80)) {
    const { data, error } = await sb.from("idea_cards").select("idea_id,title,card").in("idea_id", group);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      map.set(String(row.idea_id), {
        title: String(row.title ?? ""),
        card: (row.card ?? {}) as Record<string, unknown>,
      });
    }
  }
  return map;
}

function judge(row: InventoryRow, cardRow: { title: string; card: Record<string, unknown> } | undefined): Verdict {
  const previous_metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  if (!cardRow) {
    return {
      id: row.id,
      idea_id: row.idea_id,
      title: "",
      previous_score: Number(row.internal_rank_score),
      previous_band: row.score_band,
      previous_metadata,
      score: 0,
      red_gates: false,
      hits: ["missing_card"],
      quarantine: true,
      reason: "missing_card",
    };
  }
  try {
    const adapted = adaptLegacyIdeaCard(cardRow.card, {
      ideaId: row.idea_id,
      dbTitle: cardRow.title,
    });
    const hits = scanIdeaCardResidue(adapted.card);
    const scored = scoreIdeaCard(adapted.card);
    const residue = hits.filter((hit) => hit.blocking).map((hit) => `${hit.kind}:${hit.match}`);
    const quarantine = !scored.redGatesPassed || scored.score < 80 || residue.length > 0 || scored.band !== "high";
    return {
      id: row.id,
      idea_id: row.idea_id,
      title: cardRow.title,
      previous_score: Number(row.internal_rank_score),
      previous_band: row.score_band,
      previous_metadata,
      score: scored.score,
      red_gates: scored.redGatesPassed,
      hits: residue.slice(0, 6),
      quarantine,
      reason: quarantine
        ? residue[0] || scored.redGateFailureReasons[0] || `score_${scored.score}`
        : "pass",
    };
  } catch (error) {
    return {
      id: row.id,
      idea_id: row.idea_id,
      title: cardRow.title,
      previous_score: Number(row.internal_rank_score),
      previous_band: row.score_band,
      previous_metadata,
      score: 0,
      red_gates: false,
      hits: ["adapt_error"],
      quarantine: true,
      reason: error instanceof Error ? error.message : "adapt_error",
    };
  }
}

function quarantineSql(verdicts: Verdict[]) {
  if (!verdicts.length) return "-- no rows to quarantine\n";
  const statements = verdicts.map((item) => {
    const meta = JSON.stringify({
      residue_quarantine: true,
      residue_reason: item.reason,
      residue_hits: item.hits,
      previous_score: item.previous_score,
      previous_band: item.previous_band,
      rescored_score: item.score,
      quarantined_at: new Date().toISOString(),
    }).replace(/'/g, "''");
    return `update public.idea_inventory
set score_band = 'low'::public.score_band,
    quality_floor_passed = false,
    internal_rank_score = ${Math.min(item.score, 50)},
    metadata = coalesce(metadata, '{}'::jsonb) || '${meta}'::jsonb,
    updated_at = now()
where id = ${sqlQuote(item.id)}
  and status = 'available'::public.inventory_status
  and reuse_count = 0;`;
  });
  return `begin;\n${statements.join("\n")}\ncommit;\n`;
}

async function applyQuarantine(sb: SupabaseClient, verdicts: Verdict[]) {
  let updated = 0;
  for (const item of verdicts) {
    const metadata = {
      ...item.previous_metadata,
      residue_quarantine: true,
      residue_reason: item.reason,
      residue_hits: item.hits,
      previous_score: item.previous_score,
      previous_band: item.previous_band,
      rescored_score: item.score,
      quarantined_at: new Date().toISOString(),
    };
    const { error } = await sb
      .from("idea_inventory")
      .update({
        score_band: "low",
        quality_floor_passed: false,
        internal_rank_score: Math.min(item.score, 50),
        metadata,
      })
      .eq("id", item.id)
      .eq("status", "available")
      .eq("reuse_count", 0);
    if (error) throw new Error(`${item.id}: ${error.message}`);
    updated += 1;
  }
  return updated;
}

async function main() {
  const apply = hasFlag("--apply");
  const sqlOut = argValue("--sql-out");
  const envFile = argValue("--env", ".env.local");
  const limit = Number(argValue("--limit", "100000")) || 100000;
  loadDotEnv(path.resolve(envFile));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key || !/^https?:\/\//.test(url)) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const reserved = await fetchReservedIds(sb);
  const dirty: Verdict[] = [];
  const clean: Verdict[] = [];
  let scanned = 0;
  let skippedReserved = 0;
  let from = 0;
  const pageSize = 500;

  while (scanned + skippedReserved < limit) {
    const page = await fetchSellablePage(sb, from, pageSize);
    if (!page.length) break;
    const candidates = page.filter(
      (row) => !reserved.has(row.id) && !reserved.has(`idea:${row.idea_id}`),
    );
    skippedReserved += page.length - candidates.length;
    const cards = await fetchCards(sb, [...new Set(candidates.map((row) => row.idea_id))]);
    for (const row of candidates) {
      if (scanned >= limit) break;
      const verdict = judge(row, cards.get(row.idea_id));
      scanned += 1;
      if (verdict.quarantine) dirty.push(verdict);
      else clean.push(verdict);
    }
    process.stderr.write(`scanned=${scanned} dirty=${dirty.length} clean=${clean.length}\n`);
    if (page.length < pageSize) break;
    from += pageSize;
  }
  const kinds: Record<string, number> = {};
  for (const item of dirty) {
    const key = item.hits[0] || item.reason;
    kinds[key] = (kinds[key] ?? 0) + 1;
  }

  if (sqlOut) {
    fs.writeFileSync(path.resolve(sqlOut), quarantineSql(dirty), "utf8");
  }

  let updated = 0;
  if (apply && dirty.length) {
    updated = await applyQuarantine(sb, dirty);
  }

  const report = {
    host: hostOf(url),
    apply,
    scanned,
    skipped_reserved: skippedReserved,
    clean: clean.length,
    dirty: dirty.length,
    updated,
    sql_out: sqlOut || null,
    kinds: Object.fromEntries(Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 16)),
    dirty_sample: dirty.slice(0, 8).map((item) => ({
      title: item.title,
      previous: item.previous_score,
      now: item.score,
      hits: item.hits,
    })),
    clean_sample: clean.slice(0, 4).map((item) => ({
      title: item.title,
      score: item.score,
    })),
  };
  console.log(JSON.stringify(report, null, 2));
  if (dirty.length && !apply && !sqlOut) {
    process.exitCode = 2;
  }
}

await main();
