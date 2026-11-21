import { getCategorizedLegacyGuides } from "../lib/legacy-guides-directory.js";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const consolidation = JSON.parse(fs.readFileSync(path.join(root, "lib", "seo-consolidation.json"), "utf8"));
const merged = new Set([
  ...consolidation.clusters.flatMap((c) => c.redirects),
  ...consolidation.retiredHubPages.map((r) => r.source),
]);

const content = fs.readFileSync(path.join(root, "lib", "seo-content.ts"), "utf8");
const resPart = content.split("export const resources = [")[1];
const legacySlugs = [...resPart.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
const legacyPaths = legacySlugs.map((s) => `/resources/${s}`).filter((p) => !merged.has(p));

const cats = getCategorizedLegacyGuides();
const linkedPaths = new Set(cats.flatMap((c) => c.guides.map((g) => g.path)));

const missing = legacyPaths.filter((p) => !linkedPaths.has(p));
console.log(`Legacy paths in sitemap: ${legacyPaths.length}`);
console.log(`Legacy paths linked in directory on /resources: ${linkedPaths.size}`);
console.log(`Missing from directory: ${missing.length}`);
if (missing.length === 0) {
  console.log("SUCCESS: 100% of unmerged legacy resources are linked directly on /resources!");
} else {
  console.log("Missing:", missing);
}
