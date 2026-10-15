/**
 * Fail if stock generators still embed banned vague phrases in output scaffolding.
 * Ban lists inside docs/prompts (as "never use" examples) and quality fixtures are allowed.
 *
 * Usage: node tools/lint-idea-card-templates.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const banSource = fs.readFileSync(path.join(root, "lib/idea-card/banned-phrases.ts"), "utf8");
const banBlock = banSource.split("META_DIALOGUE")[0] || banSource;
const banned = [...banBlock.matchAll(/"([^"]+)"/g)].map((m) => m[1]).filter((p) => p.length >= 6);

/** Only generator scaffolding that becomes idea_card text. */
const targets = [
  "tools/generate-category-stock.ps1",
  "tools/generate-premium-idea-cards.py",
  "tools/import-generated-batch.ps1",
  "tools/top-up-missing-production-finalists.ps1",
];

const hits = [];
for (const rel of targets) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) continue;
  const lower = fs.readFileSync(full, "utf8").toLowerCase();
  for (const phrase of banned) {
    if (lower.includes(phrase.toLowerCase())) {
      hits.push({ file: rel, phrase });
    }
  }
}

if (hits.length) {
  console.error(JSON.stringify({ ok: false, hits, total: hits.length }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      phrases_checked: banned.length,
      files_scanned: targets.filter((rel) => fs.existsSync(path.join(root, rel))).length,
      message: "No banned phrases in generator scaffolding.",
    },
    null,
    2,
  ),
);
