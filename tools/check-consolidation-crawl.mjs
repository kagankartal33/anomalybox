/**
 * Crawl a running build (`next start`) and verify the content consolidation:
 * every sitemap URL returns 200 with a self canonical and no noindex, every
 * merged URL answers 308 in one hop to a 200 winner, and no crawled page,
 * feed or llms.txt still points at a merged URL.
 *
 * Usage: node tools/check-consolidation-crawl.mjs [origin]   (default http://localhost:3000)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const origin = process.argv[2] ?? "http://localhost:3000";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const consolidation = JSON.parse(fs.readFileSync(path.join(root, "lib", "seo-consolidation.json"), "utf8"));

const failures = [];
const fail = (message) => failures.push(message);

async function get(path) {
  return fetch(`${origin}${path}`, { redirect: "manual", headers: { "user-agent": "consolidation-crawl" } });
}

const sitemapXml = await (await get("/sitemap.xml")).text();
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]));
const sitemapPaths = sitemapUrls.map((url) => url.pathname + url.search);
const redirectPairs = [
  ...consolidation.clusters.flatMap((cluster) =>
    cluster.redirects.map((source) => ({ source, destination: cluster.winner })),
  ),
  ...consolidation.retiredHubPages,
];
const sources = new Set(redirectPairs.map((pair) => pair.source));

if (new Set(sitemapPaths).size !== sitemapPaths.length) fail("sitemap contains duplicate URLs");
const linkedSources = new Map();

async function checkIndexable(path, label) {
  const response = await get(path);
  if (response.status !== 200) {
    fail(`${label} ${path} -> ${response.status} ${response.headers.get("location") ?? ""}`);
    return;
  }
  const html = await response.text();
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1];
  if (!canonical) fail(`${label} ${path} has no canonical`);
  else {
    const canonicalUrl = new URL(canonical, origin);
    if (canonicalUrl.pathname + canonicalUrl.search !== path) fail(`${label} ${path} canonical is ${canonical}`);
  }
  const robots = html.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/)?.[1] ?? "";
  if (/noindex/i.test(robots)) fail(`${label} ${path} is noindex`);
  if (/noindex/i.test(response.headers.get("x-robots-tag") ?? "")) fail(`${label} ${path} X-Robots-Tag noindex`);
  for (const match of html.matchAll(/<a[^>]+href="([^"#]+)/g)) {
    const href = match[1].replace(/&amp;/g, "&");
    if (!href.startsWith("/")) continue;
    const target = href.split("?")[0];
    if (sources.has(target)) linkedSources.set(`${path} -> ${target}`, true);
  }
}

const queue = [...sitemapPaths];
const workers = Array.from({ length: 8 }, async () => {
  while (queue.length) await checkIndexable(queue.shift(), "sitemap");
});
await Promise.all(workers);

for (const path of sitemapPaths) {
  if (sources.has(path)) fail(`sitemap still lists merged URL ${path}`);
}

for (const { source, destination } of redirectPairs) {
  const response = await get(source);
  const location = response.headers.get("location");
  if (response.status !== 308) {
    fail(`redirect ${source} -> ${response.status} (expected 308)`);
    continue;
  }
  const target = new URL(location, origin);
  if (target.pathname !== destination || target.search) fail(`redirect ${source} lands on ${location}, expected ${destination}`);
  const landing = await get(target.pathname);
  if (landing.status !== 200) fail(`redirect ${source} -> ${destination} answers ${landing.status} (not one hop to 200)`);
}

for (const path of ["/feed.xml", "/llms.txt"]) {
  const body = await (await get(path)).text();
  for (const source of sources) {
    if (body.includes(`${source}<`) || body.includes(`${source}:`) || body.includes(`${source}"`)) fail(`${path} still lists ${source}`);
  }
}
for (const key of linkedSources.keys()) fail(`internal link to merged URL: ${key}`);

console.log(
  JSON.stringify(
    {
      sitemapUrls: sitemapPaths.length,
      redirectsChecked: redirectPairs.length,
      failures: failures.length,
    },
    null,
    2,
  ),
);
for (const message of failures) console.log(`FAIL ${message}`);
process.exit(failures.length ? 1 : 0);
