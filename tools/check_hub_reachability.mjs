import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const consolidation = JSON.parse(fs.readFileSync(path.join(root, "lib", "seo-consolidation.json"), "utf8"));
const merged = new Set([
  ...consolidation.clusters.flatMap((c) => c.redirects),
  ...consolidation.retiredHubPages.map((r) => r.source),
]);

// Read legacy resources
const content = fs.readFileSync(path.join(root, "lib", "seo-content.ts"), "utf8");
const resPart = content.split("export const resources = [")[1];
const legacySlugs = [...resPart.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
const legacyPaths = legacySlugs.map((s) => `/resources/${s}`).filter((p) => !merged.has(p));

console.log(`Total unmerged legacy resource paths: ${legacyPaths.length}`);

// Crawl starting from homepage and public hubs
const visited = new Set();
const queue = [
  "/",
  "/resources",
  "/content-ideas",
  "/tools",
  "/reels",
  "/creator-lanes",
  "/creator-personas",
  "/services",
  "/pricing",
  "/store",
  "/atelier",
  "/about",
  "/methodology",
];

// Add all hub pagination pages
for (let p = 2; p <= 7; p++) {
  queue.push(`/resources/p/${p}`);
  queue.push(`/content-ideas/p/${p}`);
  queue.push(`/creator-lanes/p/${p}`);
}

const discovered = new Set();

while (queue.length > 0) {
  const currentPath = queue.shift();
  if (visited.has(currentPath)) continue;
  visited.add(currentPath);

  try {
    const res = await fetch(`https://anomalybox.com${currentPath}`, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
    });
    if (!res.ok) continue;
    const html = await res.text();
    const links = [...html.matchAll(/href=["'](\/[^"'#\s]+)["']/g)].map((m) => m[1]);
    for (const l of links) {
      discovered.add(l);
      // If it's a paginated link or section link, enqueue
      if (l.includes("/p/") && !visited.has(l)) {
        queue.push(l);
      }
    }
  } catch (err) {
    console.error(`Error on ${currentPath}: ${err.message}`);
  }
}

console.log(`Discovered ${discovered.size} unique paths from traversing all hubs and pages.`);

const reachableLegacy = legacyPaths.filter((p) => discovered.has(p));
const unreachableLegacy = legacyPaths.filter((p) => !discovered.has(p));

console.log(`Legacy resources REACHABLE directly from hubs: ${reachableLegacy.length} / ${legacyPaths.length}`);
console.log(`Legacy resources UNREACHABLE (Orphaned from hubs): ${unreachableLegacy.length} / ${legacyPaths.length}`);

if (unreachableLegacy.length > 0) {
  console.log("\nSample unreachable legacy resources (first 10):");
  for (const p of unreachableLegacy.slice(0, 10)) {
    console.log(`  ${p}`);
  }
}
