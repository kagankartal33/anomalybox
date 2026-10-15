/**
 * Ping search engines (Google, Bing, IndexNow) to accelerate indexing.
 * Usage: node tools/ping-search-engines.mjs [optional-base-url]
 */
import { siteUrl } from "../lib/env.js";
import { resources, segments } from "../lib/seo-content.js";

const base = (process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || "https://anomalybox.com").replace(/\/$/, "");
const host = new URL(base).hostname;
const sitemapUrl = `${base}/sitemap.xml`;
const feedUrl = `${base}/feed.xml`;

const urls = [
  base,
  `${base}/store`,
  `${base}/pricing`,
  `${base}/reels`,
  `${base}/content-ideas`,
  `${base}/resources`,
  `${base}/methodology`,
  `${base}/atelier`,
  `${base}/about`,
  `${base}/dossiers/classic-red`,
  `${base}/dossiers/signature-purple`,
  `${base}/resources/reels-creative-brief-template-for-brands`,
  ...segments.map((s) => `${base}/content-ideas/${s.slug}`),
  ...resources.map((r) => `${base}/resources/${r.slug}`),
];

console.log(`\n========================================================`);
console.log(`  ANOMALY BOX - SEARCH ENGINE INDEXING TRIGGER`);
console.log(`========================================================`);
console.log(`Base URL:     ${base}`);
console.log(`Sitemap:      ${sitemapUrl}`);
console.log(`Feed:         ${feedUrl}`);
console.log(`Total URLs:   ${urls.length}`);
console.log(`--------------------------------------------------------\n`);

async function pingUrl(serviceName, url) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AnomalyBoxIndexer/1.0)" },
    });
    console.log(`[${serviceName}] Ping response: ${res.status} ${res.statusText}`);
  } catch (err) {
    console.log(`[${serviceName}] Ping notice: ${err.message}`);
  }
}

async function pingIndexNow(key) {
  if (!key) {
    console.log("[IndexNow] Notice: No INDEXNOW_KEY provided. Skipping IndexNow direct API push.");
    return;
  }

  const payload = {
    host,
    key,
    keyLocation: `${base}/${key}.txt`,
    urlList: urls,
  };

  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
    "https://yandex.com/indexnow",
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });
      console.log(`[IndexNow -> ${new URL(endpoint).hostname}] Submitted ${urls.length} URLs: ${res.status} ${res.statusText}`);
    } catch (err) {
      console.log(`[IndexNow -> ${new URL(endpoint).hostname}] Notice: ${err.message}`);
    }
  }
}

async function main() {
  console.log("1. Pinging Search Engine Sitemaps...");
  await pingUrl("Google Sitemap Ping", `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
  await pingUrl("Bing Sitemap Ping", `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);

  console.log("\n2. Pushing to IndexNow (Bing / Yandex / Seznam / Naver)...");
  let indexNowKey = process.env.INDEXNOW_KEY?.trim();
  if (!indexNowKey) {
    try {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const publicFiles = fs.readdirSync(path.join(process.cwd(), "public"));
      const keyFile = publicFiles.find((f) => /^[a-fA-F0-9]{20,64}\.txt$/.test(f));
      if (keyFile) {
        indexNowKey = keyFile.replace(/\.txt$/, "");
        console.log(`[IndexNow] Auto-detected public key file: ${keyFile}`);
      }
    } catch {
      // ignore
    }
  }
  await pingIndexNow(indexNowKey);

  console.log("\n--------------------------------------------------------");
  console.log("All search engine indexing notifications completed.");
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("Fatal error during indexing ping:", err);
  process.exit(1);
});
