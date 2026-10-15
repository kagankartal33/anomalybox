/**
 * Scan idea-card text for AI residue (lexical + template + leak + workslop).
 *
 *   npx tsx tools/scan-card-ai-residue.ts
 *   npx tsx tools/scan-card-ai-residue.ts --generate-sample 24
 *   npx tsx tools/scan-card-ai-residue.ts --json path/to/cards.json
 *
 * Pipeline: VIRAL IDEA CARDS only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { scanIdeaCardResidue, scanTextResidue } from "../lib/idea-card/ai-residue";
import { adaptLegacyIdeaCard, scoreIdeaCard, type IdeaCard } from "../lib/idea-card";
import { buildCard } from "./fill-lane-persona-stock";
import { PURCHASE_LANES } from "../lib/algorithmic-reason";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function argValue(flag: string, fallback = "") {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return fallback;
  return process.argv[idx + 1];
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

function loadJsonCards(filePath: string): IdeaCard[] {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (Array.isArray(raw)) return raw as IdeaCard[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { cards?: unknown }).cards)) {
    return (raw as { cards: IdeaCard[] }).cards;
  }
  if (raw && typeof raw === "object" && (raw as IdeaCard).schemaVersion === 2) {
    return [raw as IdeaCard];
  }
  throw new Error(`Unsupported JSON shape: ${filePath}`);
}

const PROBES = [
  { id: "clean-deliver", text: "Deliver the serum onto the wrist, then cap the bottle.", expect: 0 },
  { id: "kobak-delve", text: "We meticulously delve into the intricate tapestry.", expectMin: 1 },
  { id: "template-world", text: "In a world where creators struggle, this changes everything.", expectMin: 1 },
  { id: "pipeline-ai", text: "As an AI language model, I hope this helps.", expectMin: 1 },
  { id: "fake-viral", text: "This will go viral overnight and 10x your reach.", expectMin: 1 },
  {
    id: "workslop",
    text: "Create an engaging and captivating experience that delivers authentic impact through polished storytelling for your audience.",
    expectMin: 1,
  },
];

async function main() {
  const failures: string[] = [];

  for (const probe of PROBES) {
    const hits = scanTextResidue(probe.text);
    if ("expect" in probe && hits.length !== probe.expect) {
      failures.push(`${probe.id}: expected ${probe.expect} hits, got ${hits.length} ${JSON.stringify(hits)}`);
    }
    if ("expectMin" in probe && hits.length < (probe.expectMin ?? 0)) {
      failures.push(`${probe.id}: expected >=${probe.expectMin} hits, got ${hits.length}`);
    }
  }

  const generateRaw = argValue("--generate-sample");
  const generateN = generateRaw === "" ? 12 : Number(generateRaw);
  if (!Number.isFinite(generateN) || generateN < 0) {
    throw new Error(`Invalid --generate-sample: ${generateRaw}`);
  }
  const personas = [
    "luxury_editor",
    "beauty_tester",
    "product_reviewer",
    "food_experience_maker",
    "founder_operator",
    "travel_curator",
  ];
  const generated: Array<{ id: string; score: number; band: string; hits: number; reasons: string[] }> = [];
  let generatedFail = 0;
  for (let i = 0; i < generateN; i += 1) {
    const lane = PURCHASE_LANES[i % PURCHASE_LANES.length];
    const persona = personas[i % personas.length];
    const card = buildCard({ lane, personaSlug: persona, index: i + 40 });
    const residue = scanIdeaCardResidue(card);
    const scored = scoreIdeaCard(card);
    generated.push({
      id: `${lane}/${persona}#${i}`,
      score: scored.score,
      band: scored.band,
      hits: residue.length,
      reasons: scored.redGateFailureReasons,
    });
    if (residue.length || !scored.redGatesPassed || scored.score < 80) {
      generatedFail += 1;
      failures.push(
        `generated ${lane}/${persona}#${i}: residue=${residue.length} score=${scored.score} ${scored.redGateFailureReasons.join(" | ")}`,
      );
    }
  }

  const dbLimit = Number(argValue("--db-sample", "0")) || 0;
  let dbSummary = null;
  if (dbLimit > 0) {
    loadDotEnv(path.resolve(root, argValue("--env", ".env.local")));
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key || !/^https?:\/\//.test(url)) {
      failures.push("db-sample requested but NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
    } else {
      const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await sb.from("idea_cards").select("idea_id,title,card").limit(dbLimit);
      if (error) {
        failures.push(`db-sample: ${error.message}`);
      } else {
        const dirtyRows: Array<{ title: string; hits: string[]; score: number }> = [];
        const kindCounts: Record<string, number> = {};
        let high = 0;
        for (const row of data ?? []) {
          const adapted = adaptLegacyIdeaCard((row.card ?? {}) as Record<string, unknown>, {
            ideaId: String(row.idea_id),
            dbTitle: row.title,
          });
          const residue = scanIdeaCardResidue(adapted.card);
          const scored = scoreIdeaCard(adapted.card);
          if (scored.band === "high") high += 1;
          for (const hit of residue) {
            const key = `${hit.kind}:${hit.match}`;
            kindCounts[key] = (kindCounts[key] ?? 0) + 1;
          }
          if (residue.length) {
            dirtyRows.push({
              title: String(row.title ?? adapted.card.title),
              hits: residue.slice(0, 4).map((hit) => `${hit.kind}:${hit.match}@${hit.path}`),
              score: scored.score,
            });
          }
        }
        dbSummary = {
          scanned: (data ?? []).length,
          dirty: dirtyRows.length,
          high,
          kinds: Object.fromEntries(
            Object.entries(kindCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 16),
          ),
          sample: dirtyRows.slice(0, 8),
        };
        if (hasFlag("--fail-db") && dirtyRows.length) {
          failures.push(`db-sample: ${dirtyRows.length}/${(data ?? []).length} cards have residue`);
        }
      }
    }
  }

  const jsonPath = argValue("--json");
  let jsonSummary = null;
  if (jsonPath) {
    const cards = loadJsonCards(path.resolve(root, jsonPath));
    const rows = cards.map((card) => {
      const residue = scanIdeaCardResidue(card);
      const scored = scoreIdeaCard(card);
      return {
        id: card.id,
        title: card.title,
        hits: residue,
        score: scored.score,
        redGatesPassed: scored.redGatesPassed,
      };
    });
    const dirty = rows.filter((row) => row.hits.length > 0);
    jsonSummary = { cards: cards.length, dirty: dirty.length, sample: dirty.slice(0, 8) };
    if (dirty.length) {
      failures.push(`json ${jsonPath}: ${dirty.length}/${cards.length} cards have residue`);
    }
  }

  const report = {
    ok: failures.length === 0,
    probes: PROBES.length,
    generated: generated.length,
    generated_fail: generatedFail,
    generated_sample: generated.slice(0, 6),
    json: jsonSummary,
    db: dbSummary,
    failures: failures.slice(0, 20),
  };
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

await main();
