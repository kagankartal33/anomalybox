import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { CARD_DATASET_VERSION, type CardSftRow } from "../lib/generation/card-training-dataset";
import { PROMPT_VERSION } from "../lib/generation/contracts";
import { evaluateCardTrainingSamples } from "../lib/generation/card-training-eval";

function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("--help")) {
    console.log("Usage: npm run eval:lora-idea-card -- --dataset VERIFIED_DIRECTORY --samples GENERATED_JSONL
    return;
  }
  if (args.length !== 4 || args[0] !== "--dataset" || args[2] !== "--samples") throw new Error("Invalid options");
  const manifest = JSON.parse(fs.readFileSync(path.join(args[1], "manifest.json"), "utf8"));
  if (manifest.version !== CARD_DATASET_VERSION || manifest.prompt_version !== PROMPT_VERSION || manifest.pipeline !== "idea_card_only") throw new Error("Stale dataset");
  const test = fs.readFileSync(path.join(args[1], "test.jsonl"), "utf8");
  if (createHash("sha256").update(test).digest("hex") !== manifest.file_hashes?.["test.jsonl"]) throw new Error("Frozen test file changed");
  const readLines = (text: string) => text.replace(/^\\\\uFEFF/, "").split(/
?
  const expected = readLines(test) as CardSftRow[];
  if (expected.length !== manifest.split_counts.test || expected.some(row => row.meta.split !== "test") || new Set(expected.map(row => row.meta.source_id)).size !== expected.length) throw new Error("Invalid test split");
  const report = evaluateCardTrainingSamples(expected, readLines(fs.readFileSync(args[3], "utf8")));
  console.log(JSON.stringify(report, null, 2));
  if (!report.diagnostic_passed) process.exitCode = 2;
}
try { main(); } catch { console.error("Generation eval failed. Check the frozen dataset and actual generated samples; model qualification has not been granted."); process.exitCode = 1; }