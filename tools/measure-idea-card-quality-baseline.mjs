/**
 * Offline idea-card quality baseline over production finalist exports.
 *
 * Usage:
 *   npx --yes tsx tools/measure-idea-card-quality-baseline.mjs
 *   npx --yes tsx tools/measure-idea-card-quality-baseline.mjs --export production_exports/mvp_finalists_.../finalist_cards.jsonl
 *   npx --yes tsx tools/measure-idea-card-quality-baseline.mjs --out docs/training/QUALITY_BASELINE_latest.json
 *
 * Pipeline: VIRAL IDEA CARDS only. Does not touch SEO content.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function argValue(flag, fallback = "") {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return fallback;
  return process.argv[idx + 1];
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function resolveLatestFinalistJsonl() {
  const exportRoot = path.join(root, "production_exports");
  if (!fs.existsSync(exportRoot)) return "";
  const dirs = fs
    .readdirSync(exportRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("mvp_finalists_"))
    .map((d) => ({
      name: d.name,
      full: path.join(exportRoot, d.name),
      mtime: fs.statSync(path.join(exportRoot, d.name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  for (const dir of dirs) {
    const candidate = path.join(dir.full, "finalist_cards.jsonl");
    if (fs.existsSync(candidate)) return candidate;
  }
  return "";
}

function loadModule() {
  return import(pathToFileURL(path.join(root, "lib/idea-card/index.ts")).href);
}

function extractInnerCard(row) {
  if (!row || typeof row !== "object") return null;
  if (row.card?.card && typeof row.card.card === "object") return row.card.card;
  if (row.card && typeof row.card === "object" && !row.card.markdown) return row.card;
  if (row.idea_card && typeof row.idea_card === "object") return row.idea_card;
  return row.card ?? null;
}

function textBlob(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function mean(nums) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function countBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item) || "unknown";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Object.fromEntries([...map.entries()].sort((a, b) => b[1] - a[1]));
}

const LEAK_RE =
  /\b(quality gate|score_band|internal_rank|viral_potential|VTP-\d{3}|training\.|compiled_profile|generator_version|idea_inventory)\b/i;

async function main() {
  const {
    adaptLegacyIdeaCard,
    scoreIdeaCard,
    BANNED_VAGUE_PHRASES,
  } = await loadModule();

  const exportPath =
    argValue("--export") ||
    (hasFlag("--scan-latest") || !argValue("--export") ? resolveLatestFinalistJsonl() : "");

  if (!exportPath || !fs.existsSync(exportPath)) {
    console.error(
      "No finalist export found. Pass --export <path/to/finalist_cards.jsonl> or place files under production_exports/mvp_finalists_*/",
    );
    process.exit(2);
  }

  const limit = Number(argValue("--limit", "0")) || 0;
  const outPath =
    argValue("--out") ||
    path.join(root, "docs", "training", "QUALITY_BASELINE_latest.json");

  const lines = fs
    .readFileSync(exportPath, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const selected = limit > 0 ? lines.slice(0, limit) : lines;

  const rows = [];
  const parseErrors = [];
  const issueCodeCounts = new Map();
  const bannedPhraseHits = new Map();
  let adaptLegacyCount = 0;
  let blockingCount = 0;
  let redGateFailCount = 0;
  let leakCount = 0;
  let bannedCardCount = 0;

  for (let i = 0; i < selected.length; i += 1) {
    const lineNumber = i + 1;
    let raw;
    try {
      raw = JSON.parse(selected[i]);
    } catch (err) {
      parseErrors.push({ line: lineNumber, error: String(err?.message || err) });
      continue;
    }

    const category = String(raw.category_slug || raw.category || "unknown");
    const persona = String(raw.persona_slug || raw.persona || "unknown");
    const inventoryBand = raw.score_band ?? raw.inventory?.score_band ?? null;
    const editorial =
      raw.quality?.editorial_quality_score ??
      raw.quality?.editorialQualityScore ??
      null;
    const decision = raw.quality?.decision ?? null;
    const rankScore =
      raw.inventory?.internal_rank_score ??
      raw.rank ??
      raw.quality?.editorial_quality_score ??
      null;

    const inner = extractInnerCard(raw);
    const blob = textBlob(inner) + " " + textBlob(raw.title) + " " + textBlob(raw.one_sentence_premise);
    const leak = LEAK_RE.test(blob);
    if (leak) leakCount += 1;

    let adapted = null;
    let score = null;
    let issues = [];
    try {
      const id = String(raw.idea_id || raw.id || `line-${lineNumber}`);
      adapted = adaptLegacyIdeaCard(inner ?? {}, { ideaId: id, dbTitle: raw.title ?? inner?.title });
      if (adapted.legacy) adaptLegacyCount += 1;
      issues = adapted.issues || [];
      score = scoreIdeaCard(adapted.card);
    } catch (err) {
      parseErrors.push({ line: lineNumber, error: `adapt/score: ${String(err?.message || err)}` });
      continue;
    }

    for (const issue of issues) {
      issueCodeCounts.set(issue.code, (issueCodeCounts.get(issue.code) || 0) + 1);
    }
    const bannedIssues = issues.filter((x) => x.code === "BANNED_VAGUE_PHRASE");
    if (bannedIssues.length) {
      bannedCardCount += 1;
      for (const issue of bannedIssues) {
        const m = issue.message.match(/“([^”]+)”|"([^"]+)"/);
        const phrase = (m?.[1] || m?.[2] || "unknown").toLowerCase();
        bannedPhraseHits.set(phrase, (bannedPhraseHits.get(phrase) || 0) + 1);
      }
    }
    if (issues.some((x) => x.severity === "error")) blockingCount += 1;
    if (score && !score.redGatesPassed) redGateFailCount += 1;

    // Also scan full blob for ban list (catches fields not mapped into v2 steps)
    const lower = blob.toLowerCase();
    for (const phrase of BANNED_VAGUE_PHRASES) {
      if (lower.includes(phrase)) {
        bannedPhraseHits.set(phrase, (bannedPhraseHits.get(phrase) || 0) + 1);
      }
    }

    rows.push({
      line: lineNumber,
      idea_id: raw.idea_id || null,
      category,
      persona,
      inventory_band: inventoryBand,
      editorial_quality_score: editorial,
      quality_decision: decision,
      inventory_rank: rankScore,
      schema_v2_score: score?.score ?? null,
      schema_v2_band: score?.band ?? null,
      red_gates_passed: score?.redGatesPassed ?? false,
      red_gate_failures: score?.redGateFailureReasons ?? [],
      issue_count: issues.length,
      error_issue_count: issues.filter((x) => x.severity === "error").length,
      warning_issue_count: issues.filter((x) => x.severity === "warning").length,
      leak_signal: leak,
      legacy_adapted: Boolean(adapted?.legacy),
      breakdown: score?.breakdown ?? null,
    });
  }

  const v2Scores = rows.map((r) => r.schema_v2_score).filter((n) => typeof n === "number").sort((a, b) => a - b);
  const editorials = rows
    .map((r) => Number(r.editorial_quality_score))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  const report = {
    generated_at: new Date().toISOString(),
    pipeline: "viral_idea_cards",
    source_export: path.relative(root, exportPath).replaceAll("\\", "/"),
    cards_scanned: rows.length,
    parse_errors: parseErrors.length,
    parse_error_samples: parseErrors.slice(0, 10),
    rates: {
      legacy_adapted: rows.length ? adaptLegacyCount / rows.length : 0,
      blocking_quality_errors: rows.length ? blockingCount / rows.length : 0,
      red_gate_failures: rows.length ? redGateFailCount / rows.length : 0,
      leak_signal: rows.length ? leakCount / rows.length : 0,
      banned_phrase_cards_v2: rows.length ? bannedCardCount / rows.length : 0,
      red_gates_passed: rows.length ? rows.filter((r) => r.red_gates_passed).length / rows.length : 0,
      schema_v2_band_high: rows.length ? rows.filter((r) => r.schema_v2_band === "high").length / rows.length : 0,
      schema_v2_band_mid: rows.length ? rows.filter((r) => r.schema_v2_band === "mid").length / rows.length : 0,
      schema_v2_band_low: rows.length ? rows.filter((r) => r.schema_v2_band === "low").length / rows.length : 0,
    },
    schema_v2_score: {
      mean: mean(v2Scores),
      p50: percentile(v2Scores, 50),
      p90: percentile(v2Scores, 90),
      min: v2Scores[0] ?? null,
      max: v2Scores[v2Scores.length - 1] ?? null,
    },
    editorial_quality_score: {
      mean: mean(editorials),
      p50: percentile(editorials, 50),
      p90: percentile(editorials, 90),
      min: editorials[0] ?? null,
      max: editorials[editorials.length - 1] ?? null,
      present: editorials.length,
    },
    by_category: countBy(rows, (r) => r.category),
    by_inventory_band: countBy(rows, (r) => String(r.inventory_band ?? "n/a")),
    by_schema_v2_band: countBy(rows, (r) => String(r.schema_v2_band ?? "n/a")),
    top_issue_codes: Object.fromEntries(
      [...issueCodeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25),
    ),
    top_banned_phrases: Object.fromEntries(
      [...bannedPhraseHits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25),
    ),
    north_star_targets: {
      approve_rate_safe_candidates: 0.55,
      editorial_mean_approved: 88,
      semantic_dupe_ge_0_78_share: 0.05,
      banned_phrase_hit_rate: 0.01,
      gold_gate_agreement: 0.85,
      scorer_human_spearman: 0.6,
    },
    notes: [
      "schema_v2_score uses lib/idea-card/quality.scoreIdeaCard after adaptLegacyIdeaCard.",
      "inventory rank / QG editorial come from export metadata when present.",
      "scoreCandidate hash bonus is NOT re-simulated here; see admin-generation-batches scoreCandidate for production rank path.",
      "This baseline is offline finalist-only unless --export points elsewhere.",
    ],
    sample_red_gate_failures: rows
      .filter((r) => !r.red_gates_passed)
      .slice(0, 15)
      .map((r) => ({
        line: r.line,
        idea_id: r.idea_id,
        category: r.category,
        failures: r.red_gate_failures,
      })),
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  // Human-readable markdown companion
  const mdPath = outPath.replace(/\.json$/i, ".md");
  const md = [
    `# Idea card quality baseline`,
    ``,
    `- Generated: ${report.generated_at}`,
    `- Source: \`${report.source_export}\``,
    `- Cards scanned: **${report.cards_scanned}**`,
    ``,
    `## Rates`,
    ``,
    `| Metric | Value |`,
    `|---|---:|`,
    `| Red gates passed | ${(report.rates.red_gates_passed * 100).toFixed(1)}% |`,
    `| Schema v2 high band | ${(report.rates.schema_v2_band_high * 100).toFixed(1)}% |`,
    `| Blocking quality errors | ${(report.rates.blocking_quality_errors * 100).toFixed(1)}% |`,
    `| Red gate failures | ${(report.rates.red_gate_failures * 100).toFixed(1)}% |`,
    `| Leak signal | ${(report.rates.leak_signal * 100).toFixed(1)}% |`,
    `| Banned phrase (v2 issues) | ${(report.rates.banned_phrase_cards_v2 * 100).toFixed(1)}% |`,
    `| Legacy adapted | ${(report.rates.legacy_adapted * 100).toFixed(1)}% |`,
    ``,
    `## Schema v2 score`,
    ``,
    `- mean: ${report.schema_v2_score.mean?.toFixed?.(1) ?? "n/a"}`,
    `- p50: ${report.schema_v2_score.p50 ?? "n/a"}`,
    `- p90: ${report.schema_v2_score.p90 ?? "n/a"}`,
    `- min/max: ${report.schema_v2_score.min ?? "n/a"} / ${report.schema_v2_score.max ?? "n/a"}`,
    ``,
    `## Top issue codes`,
    ``,
    ...Object.entries(report.top_issue_codes).map(([k, v]) => `- \`${k}\`: ${v}`),
    ``,
    `## Top banned phrases (blob + v2)`,
    ``,
    ...(Object.keys(report.top_banned_phrases).length
      ? Object.entries(report.top_banned_phrases).map(([k, v]) => `- “${k}”: ${v}`)
      : ["- (none detected)"]),
    ``,
    `## By category`,
    ``,
    ...Object.entries(report.by_category).map(([k, v]) => `- ${k}: ${v}`),
    ``,
    `## North-star targets`,
    ``,
    `| Metric | Target |`,
    `|---|---:|`,
    `| Approve rate (SAFE) | ≥ 55% |`,
    `| Editorial mean (approved) | ≥ 88 |`,
    `| Semantic dupe ≥ 0.78 | ≤ 5% |`,
    `| Banned phrase rate | ≤ 1% |`,
    `| Gold ↔ gate agreement | ≥ 85% |`,
    `| Scorer ↔ human Spearman | ≥ 0.6 |`,
    ``,
    `Raw JSON: \`${path.relative(root, outPath).replaceAll("\\", "/")}\``,
    ``,
  ].join("\n");
  fs.writeFileSync(mdPath, md, "utf8");

  console.log(JSON.stringify({
    ok: true,
    cards_scanned: report.cards_scanned,
    red_gates_passed_pct: Number((report.rates.red_gates_passed * 100).toFixed(1)),
    schema_v2_mean: report.schema_v2_score.mean,
    out_json: path.relative(root, outPath),
    out_md: path.relative(root, mdPath),
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
