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
const matches = [...resPart.matchAll(/slug:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*description:\s*"([^"]+)"/g)];

const unmerged = matches
  .map((m) => ({ slug: m[1], title: m[2], description: m[3], path: `/resources/${m[1]}` }))
  .filter((r) => !merged.has(r.path));

console.log(`Unmerged resources: ${unmerged.length}`);
for (const r of unmerged.slice(0, 15)) {
  console.log(`- ${r.title} (${r.path})`);
}
