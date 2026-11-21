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

console.log(`Total unmerged legacy resources: ${unmerged.length}`);

// Group by keywords
const categories = {
  "Production & Studio Setups": [],
  "Reels, Hooks & Scripts": [],
  "Content Strategy & Workflow": [],
  "Visual Direction & Formats": [],
  "Creator Business & Monetization": [],
};

for (const r of unmerged) {
  const t = r.title.toLowerCase();
  const d = r.description.toLowerCase();
  const text = `${t} ${d}`;

  if (text.includes("lighting") || text.includes("studio") || text.includes("iphone") || text.includes("b-roll") || text.includes("shot list") || text.includes("shoot plan")) {
    categories["Production & Studio Setups"].push(r);
  } else if (text.includes("hook") || text.includes("script") || text.includes("reels") || text.includes("ugc brief") || text.includes("brief template")) {
    categories["Reels, Hooks & Scripts"].push(r);
  } else if (text.includes("business") || text.includes("pricing") || text.includes("portfolio") || text.includes("retainer") || text.includes("deal") || text.includes("personal brand") || text.includes("founder")) {
    categories["Creator Business & Monetization"].push(r);
  } else if (text.includes("visual signature") || text.includes("faceless") || text.includes("aesthetic") || text.includes("format") || text.includes("lookbook") || text.includes("fashion") || text.includes("beauty")) {
    categories["Visual Direction & Formats"].push(r);
  } else {
    categories["Content Strategy & Workflow"].push(r);
  }
}

for (const [name, list] of Object.entries(categories)) {
  console.log(`\n=== ${name} (${list.length} guides) ===`);
  for (const item of list.slice(0, 5)) {
    console.log(`  - ${item.title}`);
  }
}

const totalInCategories = Object.values(categories).reduce((sum, list) => sum + list.length, 0);
console.log(`\nTotal categorized: ${totalInCategories} / ${unmerged.length}`);
