/**
 * Gold-set / fixture eval harness for idea-card quality.
 *
 * Usage:
 *   npm exec -- tsx tools/eval-idea-card-quality.mjs
 *   npm exec -- tsx tools/eval-idea-card-quality.mjs --gold path/to/gold_v1.jsonl
 *   npm exec -- tsx tools/eval-idea-card-quality.mjs --fixtures-only
 *
 * Exit 0 when fixtures pass and (if gold present) agreement thresholds hold.
 * Pipeline: VIRAL IDEA CARDS only.
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

async function loadModule() {
  return import(pathToFileURL(path.join(root, "lib/idea-card/index.ts")).href);
}

/** Built-in fixtures when gold file is missing — keeps CI useful. */
function builtinFixtures() {
  return [
    {
      id: "fixture-high-pass",
      human_decision: "approve",
      human_rank: 5,
      failure_codes: [],
      card: {
        id: "fixture-high-pass",
        title: "Batch trial facial oil fix",
        conceptSummary:
          "Show the raw lab workflow and trial-and-error process of testing a new facial oil formulation.",
        format: "Reels",
        category: "beauty",
        platform: "instagram_reels",
        audience: "Skincare enthusiasts looking for honest ingredient proof",
        durationSeconds: 20,
        difficulty: "medium",
        requiredItems: ["Lab beaker", "Pipette", "Facial oil sample"],
        viewerTakeaway: "Understanding that real formulation takes multiple iterations.",
        whyItWorks:
          "Reverse Prescription: four dumped batches make the viewer pause. The stable blend is the save, not a claim.",
        hookId: "reverse_prescription",
        shootFormat: "talking_head",
        presenceMode: "editorial_insider",
        personaSlug: "luxury_editor",
        overallProductionNotes: [
          "Keep lighting neutral daylight without warm filters",
          "Focus camera macro lens on liquid texture transition",
        ],
        schemaVersion: 2,
        steps: [
          {
            id: "s1",
            order: 1,
            stage: "hook",
            startSecond: 0,
            endSecond: 4,
            purpose: "Hook attention with formulation friction",
            goal: "Establish real lab test context",
            action: "Hold up pipette with cloudy mixture to camera light",
            spokenLine: "We had to throw away four batches before this worked.",
            shot: "Eye-level close-up of glass pipette with liquid, 0.5m",
            onScreenText: "Batch #4 vs Batch #5",
            performanceNote: "Direct eye contact, calm voice",
          },
          {
            id: "s2",
            order: 2,
            stage: "context",
            startSecond: 4,
            endSecond: 10,
            purpose: "Explain active ingredient separation",
            goal: "Show why ingredient separation happens",
            action: "Pour oil into beaker and stir slowly with glass rod",
            spokenLine: "The vitamin C kept separating from the oil layer.",
            shot: "Overhead shot of beaker",
            editNote: "Speed up stirring 1.5x",
          },
          {
            id: "s3",
            order: 3,
            stage: "demonstration",
            startSecond: 10,
            endSecond: 16,
            purpose: "Demonstrate final stable blend solution",
            goal: "Show visual texture proof of stable formula",
            action: "Drop finished clear oil onto wrist and blend into skin",
            spokenLine: "Adding squalane stabilized the blend instantly.",
            shot: "Macro shot of oil texture absorbing into skin",
          },
          {
            id: "s4",
            order: 4,
            stage: "takeaway",
            startSecond: 16,
            endSecond: 20,
            purpose: "Summarize formulation lesson",
            goal: "Provide saveable formula tip for viewers",
            action: "Cap the dark amber glass dropper bottle firmly",
            spokenLine: "Check the label for squalane if your facial oil feels heavy.",
            shot: "Chest-up frame while capping the bottle on linen",
          },
        ],
      },
      expect: { red_gates_passed: true, min_score: 88, decision: "approve" },
    },
    {
      id: "fixture-meta-dialogue-fail",
      human_decision: "reject",
      human_rank: 1,
      failure_codes: ["meta_dialogue", "unshootable"],
      card: {
        id: "fixture-meta-dialogue-fail",
        title: "Vague beauty tip",
        conceptSummary: "Talk about skincare in a general premium way for the feed.",
        format: "Reels",
        category: "beauty",
        durationSeconds: 12,
        difficulty: "easy",
        requiredItems: [],
        viewerTakeaway: "Think about skincare more.",
        schemaVersion: 2,
        steps: [
          {
            id: "s1",
            order: 1,
            stage: "context",
            startSecond: 1,
            endSecond: 4,
            purpose: "premium moment",
            goal: "premium moment",
            action: "stand and smile",
            spokenLine: "The creator should tell the viewer this video should feel premium.",
            shot: "wide",
          },
          {
            id: "s2",
            order: 2,
            stage: "demonstration",
            startSecond: 6,
            endSecond: 10,
            purpose: "show product",
            goal: "show product",
            action: "hold product",
            spokenLine: "What do you think? Comment below.",
            shot: "product",
          },
          {
            id: "s3",
            order: 3,
            stage: "cta",
            startSecond: 10,
            endSecond: 12,
            purpose: "cta",
            goal: "cta",
            action: "wave",
            spokenLine: "Follow for more",
            shot: "face",
          },
        ],
      },
      expect: { red_gates_passed: false, decision: "reject" },
    },
    {
      id: "fixture-llm-style-fail",
      human_decision: "reject",
      human_rank: 1,
      failure_codes: ["llm_style_residue"],
      card: {
        id: "fixture-llm-style-fail",
        title: "Batch trial facial oil fix",
        conceptSummary:
          "We meticulously delve into the intricate tapestry of formulation to showcase a pivotal, groundbreaking blend.",
        format: "Reels",
        category: "beauty",
        platform: "instagram_reels",
        audience: "Skincare testers",
        durationSeconds: 20,
        difficulty: "medium",
        requiredItems: ["Lab beaker", "Pipette", "Facial oil sample"],
        viewerTakeaway: "This multifaceted approach will unlock your full potential.",
        whyItWorks:
          "In a world where skincare is confusing, this comprehensive realm of insights plays a crucial role.",
        hookId: "reverse_prescription",
        shootFormat: "talking_head",
        schemaVersion: 2,
        steps: [
          {
            id: "s1",
            order: 1,
            stage: "hook",
            startSecond: 0,
            endSecond: 4,
            purpose: "Hook with the failed batch",
            goal: "Show the cloudy mix",
            action: "Hold up pipette with cloudy mixture to camera light",
            spokenLine: "As an AI language model, I hope this helps your skincare journey.",
            shot: "Eye-level close-up of glass pipette with liquid, 0.5m",
            onScreenText: "Batch #4",
            performanceNote: "Direct eye contact, calm voice",
          },
          {
            id: "s2",
            order: 2,
            stage: "context",
            startSecond: 4,
            endSecond: 10,
            purpose: "Explain separation",
            goal: "Show the oil layer",
            action: "Pour oil into beaker and stir slowly with glass rod",
            spokenLine: "This will go viral overnight and 10x your reach.",
            shot: "Overhead shot of beaker",
          },
          {
            id: "s3",
            order: 3,
            stage: "demonstration",
            startSecond: 10,
            endSecond: 16,
            purpose: "Show the stable blend",
            goal: "Wrist proof",
            action: "Drop finished clear oil onto wrist and blend into skin",
            spokenLine: "Adding squalane stabilized the blend instantly.",
            shot: "Macro shot of oil texture absorbing into skin",
          },
          {
            id: "s4",
            order: 4,
            stage: "takeaway",
            startSecond: 16,
            endSecond: 20,
            purpose: "Leave the rule",
            goal: "Saveable tip",
            action: "Cap the dark amber glass dropper bottle firmly",
            spokenLine: "Check the label for squalane if your facial oil feels heavy.",
            shot: "Chest-up frame while capping the bottle on linen",
          },
        ],
      },
      expect: { red_gates_passed: false, decision: "reject" },
    },
    {
      id: "fixture-workslop-fail",
      human_decision: "reject",
      human_rank: 1,
      failure_codes: ["workslop"],
      card: {
        id: "fixture-workslop-fail",
        title: "Elevated skincare storytelling",
        conceptSummary:
          "Create an engaging and captivating experience that delivers authentic impact through polished storytelling for your audience today.",
        format: "Reels",
        category: "beauty",
        durationSeconds: 20,
        difficulty: "easy",
        requiredItems: ["Product"],
        viewerTakeaway: "Feel more inspired about your unique transformative journey.",
        whyItWorks: "Viewers save because the energy is compelling and the moment feels premium.",
        hookId: "reverse_prescription",
        shootFormat: "talking_head",
        schemaVersion: 2,
        steps: [
          {
            id: "s1",
            order: 1,
            stage: "hook",
            startSecond: 0,
            endSecond: 5,
            purpose: "Open with engaging energy",
            goal: "Set a captivating tone",
            action: "Stand and smile toward the lens with confident energy",
            spokenLine: "Let's dive into this vibrant content journey together.",
            shot: "medium shot",
          },
          {
            id: "s2",
            order: 2,
            stage: "context",
            startSecond: 5,
            endSecond: 10,
            purpose: "Build authentic connection",
            goal: "Keep the engaging mood",
            action: "Gesture generally while talking about the experience",
            spokenLine: "Whether you're a beginner or a seasoned pro, this matters.",
            shot: "medium shot",
          },
          {
            id: "s3",
            order: 3,
            stage: "demonstration",
            startSecond: 10,
            endSecond: 16,
            purpose: "Deliver the premium moment",
            goal: "Show the transformative feeling",
            action: "Present the product with polished storytelling energy",
            spokenLine: "This seamless transition creates authentic impact.",
            shot: "product",
          },
          {
            id: "s4",
            order: 4,
            stage: "takeaway",
            startSecond: 16,
            endSecond: 20,
            purpose: "Close the journey",
            goal: "Leave inspired",
            action: "Wave and hold the smile",
            spokenLine: "Follow for more",
            shot: "face",
          },
        ],
      },
      expect: { red_gates_passed: false, decision: "reject" },
    },
  ];
}

function defaultGoldPath() {
  const archive = path.join(
    path.dirname(root),
    "ViralBox-training-archive",
    "dataset",
    "viral_card",
    "gold",
    "v1.jsonl",
  );
  const local = path.join(root, "docs", "training", "fixtures", "gold_v1.sample.jsonl");
  if (fs.existsSync(archive)) return archive;
  if (fs.existsSync(local)) return local;
  return "";
}

function loadGoldJsonl(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      try {
        return JSON.parse(line);
      } catch (err) {
        throw new Error(`Gold JSONL parse error line ${i + 1}: ${err.message}`);
      }
    });
}

function spearman(xs, ys) {
  if (xs.length !== ys.length || xs.length < 3) return null;
  const rank = (arr) => {
    const sorted = [...arr].map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(arr.length);
    for (let i = 0; i < sorted.length;) {
      let end = i + 1;
      while (end < sorted.length && sorted[end].v === sorted[i].v) end += 1;
      const averageRank = ((i + 1) + end) / 2;
      for (let cursor = i; cursor < end; cursor += 1) ranks[sorted[cursor].i] = averageRank;
      i = end;
    }
    return ranks;
  };
  const rx = rank(xs);
  const ry = rank(ys);
  const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const meanX = mean(rx);
  const meanY = mean(ry);
  let numerator = 0;
  let varianceX = 0;
  let varianceY = 0;
  for (let index = 0; index < rx.length; index += 1) {
    const dx = rx[index] - meanX;
    const dy = ry[index] - meanY;
    numerator += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }
  const denominator = Math.sqrt(varianceX * varianceY);
  return denominator ? numerator / denominator : null;
}

function normalizedGoldSource(value) {
  const source = String(value || "").toLowerCase();
  if (["existing_stock", "inventory", "finalist_export"].includes(source)) return "existing_stock";
  if (["generated", "batch"].includes(source)) return "generated";
  return null;
}

async function main() {
  const { evaluateIdeaCardV22, adaptLegacyIdeaCard, validateIdeaCardQuality, QUALITY_GATE_VERSION } = await loadModule();
  const { automaticCard, automaticConcept, automaticRecipe } = await import(
    pathToFileURL(path.join(root, "tests/fixtures/automatic-card.ts")).href
  );
  const fixturesOnly = hasFlag("--fixtures-only");
  const qualification = hasFlag("--qualification");
  const goldPath = fixturesOnly ? "" : argValue("--gold", defaultGoldPath());
  const minAgreement = Number(argValue("--min-agreement", "0.85"));
  const minSpearman = Number(argValue("--min-spearman", "0.6"));
  const minRuntimeFit = Number(argValue("--min-runtime-fit", "0.85"));

  const failures = [];
  const fixtureResults = [];

  const fixtures = builtinFixtures().map((fix) => fix.id === "fixture-high-pass"
    ? {
        ...fix,
        card: automaticCard,
        creativeRecipe: automaticRecipe,
        concept: automaticConcept,
        expect: { red_gates_passed: true, min_score: 90, decision: "approve" },
      }
    : fix);
  for (const fix of fixtures) {
    const score = evaluateIdeaCardV22(fix.card, {
      creativeRecipe: fix.creativeRecipe,
      concept: fix.concept,
    });
    const issues = validateIdeaCardQuality(fix.card);
    const redGatesPassed = score.hardGateCodes.length === 0;
    const band = score.decision === "approve" ? "high" : score.decision === "refine" ? "mid" : "low";
    const okRed = redGatesPassed === fix.expect.red_gates_passed;
    const okMin = fix.expect.min_score == null || score.adjustedScore >= fix.expect.min_score;
    const okMax = fix.expect.max_score == null || score.adjustedScore <= fix.expect.max_score;
    const okBand = !fix.expect.band || band === fix.expect.band;
    const okDecision = !fix.expect.decision || score.decision === fix.expect.decision;
    const passed = okRed && okMin && okMax && okBand && okDecision;
    fixtureResults.push({
      id: fix.id,
      passed,
      score: score.adjustedScore,
      band,
      decision: score.decision,
      red_gates_passed: redGatesPassed,
      issue_count: issues.length,
    });
    if (!passed) {
      failures.push({
        id: fix.id,
        reason: "fixture_expectation_miss",
        score,
        expect: fix.expect,
      });
    }
  }

  let goldSummary = null;
  if (goldPath) {
    const goldRows = loadGoldJsonl(goldPath);
    const seenGoldIds = new Set();
    const categoryCounts = {};
    const sourceCounts = {};
    const runtimeFitCounts = { rushed: 0, right: 0, padded: 0, missing_or_invalid: 0 };
    let agree = 0;
    let total = 0;
    const humanRanks = [];
    const modelScores = [];
    const confusion = { approve: {}, refine: {}, reject: {} };

    for (const row of goldRows) {
      if (!row.card) continue;
      const goldId = String(row.idea_id || row.id || "").trim();
      if (goldId && seenGoldIds.has(goldId)) continue;
      if (goldId) seenGoldIds.add(goldId);
      total += 1;
      let card = row.card;
      if (card.schemaVersion !== 2) {
        const adapted = adaptLegacyIdeaCard(card, {
          ideaId: String(row.id || row.idea_id || `gold-${total}`),
          dbTitle: row.title || card.title,
        });
        card = adapted.card;
      }
      const score = evaluateIdeaCardV22(card);
      const categorySlug = String(row.category_slug || card.category || card.category_slug || "unknown");
      categoryCounts[categorySlug] = (categoryCounts[categorySlug] || 0) + 1;
      if (!sourceCounts[categorySlug]) sourceCounts[categorySlug] = { existing_stock: 0, generated: 0 };
      const source = normalizedGoldSource(row.source);
      if (source) sourceCounts[categorySlug][source] += 1;
      const runtimeFit = String(row.runtime_fit || "").toLowerCase();
      if (["rushed", "right", "padded"].includes(runtimeFit)) runtimeFitCounts[runtimeFit] += 1;
      else runtimeFitCounts.missing_or_invalid += 1;
      const modelDecision = score.decision === "human_review_required" ? "refine" : score.decision;
      const human = String(row.human_decision || row.decision || "").toLowerCase();
      if (!confusion[human]) confusion[human] = {};
      confusion[human][modelDecision] = (confusion[human][modelDecision] || 0) + 1;
      if (human && human === modelDecision) agree += 1;
      if (typeof row.human_rank === "number") {
        humanRanks.push(row.human_rank);
        modelScores.push(score.adjustedScore);
      }
    }

    const agreement = total ? agree / total : null;
    const rho = spearman(humanRanks, modelScores);
    const runtimeRatedCount = runtimeFitCounts.rushed + runtimeFitCounts.right + runtimeFitCounts.padded;
    const humanRuntimeFitRate = runtimeRatedCount ? runtimeFitCounts.right / runtimeRatedCount : null;
    goldSummary = {
      path: path.relative(root, goldPath).replaceAll("\\", "/"),
      n: total,
      agreement,
      spearman: rho,
      confusion,
      category_counts: categoryCounts,
      source_counts: sourceCounts,
      runtime_fit_counts: runtimeFitCounts,
      human_runtime_rated_count: runtimeRatedCount,
      human_runtime_fit_rate: humanRuntimeFitRate,
      min_agreement_required: minAgreement,
      min_spearman_required: minSpearman,
      min_runtime_fit_required: minRuntimeFit,
    };
    if (total > 0 && agreement != null && agreement < minAgreement) {
      failures.push({
        id: "gold-agreement",
        reason: `agreement ${agreement.toFixed(3)} < min ${minAgreement}`,
      });
    }
    if (qualification && total < 200) {
      failures.push({ id: "gold-size", reason: `gold set ${total} < required 200` });
    }
    if (qualification) {
      for (const categorySlug of ["beauty", "entertainment_comedy", "travel", "fitness_wellness_safe", "food"]) {
        if ((categoryCounts[categorySlug] || 0) < 40) {
          failures.push({ id: `gold-lane-${categorySlug}`, reason: `${categorySlug} gold set ${categoryCounts[categorySlug] || 0} < required 40` });
        }
        for (const source of ["existing_stock", "generated"]) {
          const count = sourceCounts[categorySlug]?.[source] || 0;
          if (count < 20) {
            failures.push({ id: `gold-source-${categorySlug}-${source}`, reason: `${categorySlug}/${source} gold set ${count} < required 20` });
          }
        }
      }
      if (runtimeRatedCount < 200) {
        failures.push({ id: "gold-runtime-size", reason: `runtime-fit ratings ${runtimeRatedCount} < required 200` });
      }
      if (humanRuntimeFitRate == null || humanRuntimeFitRate < minRuntimeFit) {
        failures.push({ id: "gold-runtime-fit", reason: `runtime-fit rate ${humanRuntimeFitRate ?? "null"} < min ${minRuntimeFit}` });
      }
    }
    if (qualification && (rho == null || rho < minSpearman)) {
      failures.push({ id: "gold-spearman", reason: `spearman ${rho ?? "null"} < min ${minSpearman}` });
    }
  }
  if (qualification && !goldPath) {
    failures.push({ id: "gold-missing", reason: "qualification requires a 200-card gold JSONL file" });
  }

  const report = {
    generated_at: new Date().toISOString(),
    evaluator_version: QUALITY_GATE_VERSION,
    fixtures: fixtureResults,
    gold: goldSummary,
    failures,
    ok: failures.length === 0,
  };

  const outDir = path.join(root, "docs", "training");
  fs.mkdirSync(outDir, { recursive: true });
  const outJson = path.join(outDir, "EVAL_IDEA_CARD_QUALITY_latest.json");
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), "utf8");

  console.log(JSON.stringify({
    ok: report.ok,
    fixtures_passed: fixtureResults.filter((f) => f.passed).length,
    fixtures_total: fixtureResults.length,
    gold_n: goldSummary?.n ?? 0,
    gold_agreement: goldSummary?.agreement ?? null,
    gold_spearman: goldSummary?.spearman ?? null,
    out: path.relative(root, outJson),
    failures: failures.length,
  }, null, 2));

  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
