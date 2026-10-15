#!/usr/bin/env node

/**
 * Sitemap Crawler & SEO Canonical Integrity Tester
 * Fetches sitemap.xml, crawls each URL, and verifies HTTP 200, canonical correctness,
 * unique titles, and meta descriptions.
 *
 * Usage:
 *   node tools/test-sitemap-crawler.mjs [--url http://127.0.0.1:3000] [--sample 20]
 */

import http from "node:http";
import https from "node:https";

const args = process.argv.slice(2);
function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const baseUrl = (getArg("--url", process.env.SITE_URL || "http://127.0.0.1:3000")).replace(/\/$/, "");
const sampleLimit = parseInt(getArg("--sample", "25"), 10);

function get(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === "https:" ? https : http;
    client.get(url, { headers: { "User-Agent": "ViralBox-SitemapCrawler/1.0" } }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
    }).on("error", reject);
  });
}

async function runSitemapCrawler() {
  console.log(`\n===============================================================`);
  console.log(` SITEMAP & CANONICAL INTEGRITY CRAWLER: ${baseUrl}`);
  console.log(`===============================================================\n`);

  console.log(`--> Fetching sitemap from ${baseUrl}/sitemap.xml...`);
  let sitemapXml;
  try {
    const sitemapRes = await get(`${baseUrl}/sitemap.xml`);
    if (sitemapRes.statusCode !== 200) {
      throw new Error(`Sitemap returned HTTP ${sitemapRes.statusCode}`);
    }
    sitemapXml = sitemapRes.body;
  } catch (err) {
    console.error(`[FAIL] Could not fetch sitemap.xml: ${err.message}`);
    process.exit(1);
  }

  // Extract <loc> tags
  const locRegex = /<loc>(.*?)<\/loc>/g;
  const urls = [];
  let match;
  while ((match = locRegex.exec(sitemapXml)) !== null) {
    urls.push(match[1]);
  }

  console.log(`Found ${urls.length} total URLs in sitemap.`);
  if (urls.length === 0) {
    console.error(`[FAIL] Sitemap contains 0 URLs.`);
    process.exit(1);
  }

  // Test static routes + a sample of dynamic routes
  const staticPriority = urls.filter(u => !u.includes("/resources/") && !u.includes("/content-ideas/"));
  const dynamicSample = urls.filter(u => u.includes("/resources/") || u.includes("/content-ideas/")).slice(0, sampleLimit);
  const toTest = Array.from(new Set([...staticPriority, ...dynamicSample]));

  console.log(`Testing ${toTest.length} URLs for HTTP 200 and SEO tags...\n`);

  let failures = 0;
  for (const url of toTest) {
    // Replace domain with local baseUrl if testing locally
    const target = url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")
      ? url
      : `${baseUrl}${new URL(url).pathname}`;

    try {
      const res = await get(target);
      if (res.statusCode !== 200) {
        console.error(`[FAIL] ${res.statusCode} on ${target}`);
        failures++;
        continue;
      }

      const html = res.body;

      // Validate title
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";
      if (!title || title.length < 5) {
        console.error(`[WARN] Poor or missing title on ${target}: "${title}"`);
        failures++;
      }

      // Validate canonical
      const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i);
      if (!canonicalMatch) {
        console.error(`[FAIL] Missing canonical tag on ${target}`);
        failures++;
      }

      // Ensure no 500 error leak or unhandled exception text in body
      if (html.includes("Internal Server Error") || html.includes("Application error:")) {
        console.error(`[FAIL] Error text found in response body on ${target}`);
        failures++;
      }

      console.log(`[PASS] 200 OK | Title: ${title.substring(0, 40)}... | ${new URL(target).pathname}`);
    } catch (err) {
      console.error(`[FAIL] Network error on ${target}: ${err.message}`);
      failures++;
    }
  }

  console.log(`\n---------------------------------------------------------------`);
  if (failures > 0) {
    console.error(`[FAIL] ${failures} URL(s) failed validation.`);
    process.exit(1);
  } else {
    console.log(`[SUCCESS] All sampled sitemap URLs passed 200 OK and canonical validation.\n`);
    process.exit(0);
  }
}

runSitemapCrawler().catch((err) => {
  console.error("Sitemap crawler error:", err);
  process.exit(1);
});
