import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { compileCardTrainingDataset } from "../lib/generation/card-training-dataset";

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("--help")) {
    console.log("Usage: npm run build:sft-idea-card -- --input approved-card-records.jsonl [--audit | --out NEW_DIRECTORY] [--require-ready]");
    return;
  }
  const option = (key: string) => { const i = args.indexOf(key); return i < 0 ? undefined : args[i + 1]; };
  for (let i = 0; i < args.length; i++) {
    if (["--input", "--out"].includes(args[i])) {
      if (!args[i + 1] || args[i + 1].startsWith("--")) throw new Error("Missing option value");
      i++;
    } else if (!["--audit", "--require-ready"].includes(args[i])) throw new Error("Unsupported option; use --help");
  }
  const input = option("--input"), out = option("--out");
  if (!input || (!out && !args.includes("--audit")) || (out && args.includes("--audit"))) throw new Error("Choose --input and exactly one of --audit / --out");
  if (fs.statSync(input).size > 64 * 1024 * 1024) throw new Error("Input exceeds the 64MB offline audit limit");
  const rows: unknown[] = fs.readFileSync(input, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean).map((line, i) => {
    try { return JSON.parse(line); } catch { throw new Error(`Invalid JSON at record ${i + 1}`); }
  });
  const { splits, manifest } = await compileCardTrainingDataset(rows);
  if (out) {
    const resolved = path.resolve(out);
    fs.mkdirSync(resolved, { recursive: false });
    const fileHashes: Record<string, string> = {};
    for (const [split, records] of Object.entries(splits)) {
      const file = `${split}.jsonl`;
      const text = records.map(row => JSON.stringify(row)).join("\n") + (records.length ? "\n" : "");
      fs.writeFileSync(path.join(resolved, file), text, { encoding: "utf8", flag: "wx" });
      fileHashes[file] = createHash("sha256").update(text).digest("hex");
    }
    // Written last: interrupted exports cannot look like a valid training corpus.
    fs.writeFileSync(path.join(resolved, "manifest.json"), JSON.stringify({ ...manifest, file_hashes: fileHashes }, null, 2) + "\n");
  }
  console.log(JSON.stringify(manifest, null, 2));
  if (args.includes("--require-ready") && !manifest.training_ready) process.exitCode = 2;
}

main().catch(() => { console.error("Card training export failed. No model was trained or qualified. Check --help, the input contract, and a new output directory."); process.exitCode = 1; });