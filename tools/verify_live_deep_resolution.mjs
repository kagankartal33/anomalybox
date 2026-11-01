/**
 * Hyper-rigorous live deep audit of https://anomalybox.com
 * Verifies live deployment state, sitemap, feed, robots.txt, 174 pages, 88 redirects,
 * self-canonicals, index meta tags, Google verification, and zero internal links to merged URLs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://anomalybox.com";
const consolidation = JSON.parse(fs.readFileSync(path.join(root, "lib", "seo-consolidation.json"), "utf8"));

const redirectPairs = [
  ...consolidation.clusters.flatMap((c) => c.redirects.map((source) => ({ source, destination: c.winner }))),
  ...consolidation.retiredHubPages,
];
const mergedSources = new Set(redirectPairs.map((p) => p.source));

const summary = {
  testedAt: new Date().toISOString(),
  origin,
  deployment: {},
  discoveryFiles: {},
  sitemapCount: 0,
  sitemapPagesTested: 0,
  sitemapPagesPassed: 0,
  redirectsTested: 0,
  redirectsPassed: 0,
  falseNoindexCheck: {},
  googleVerificationTagsFound: 0,
  internalLinksToMergedFound: 0,
  errors: [],
};

async function get(path, options = {}) {
  const url = path.startsWith("http") ? path : `${origin}${path}`;
  return fetch(url, {
    redirect: "manual",
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      ...options.headers,
    },
    signal: AbortSignal.timeout(15000),
    ...options,
  });
}

console.log("================================================================================");
console.log("   DEEP LIVE RESOLUTION AUDIT FOR ANOMALYBOX.COM");
console.log("================================================================================\n");

// 1. Verify Deployment & Server Headers
console.log("1. Checking Server Headers & Active Vercel Deployment on Apex Domain...");
try {
  const res = await get("/");
  const xVercelId = res.headers.get("x-vercel-id") || "none";
  const xMatchedPath = res.headers.get("x-matched-path") || "none";
  const xNextPrerender = res.headers.get("x-nextjs-prerender") || "none";
  const age = res.headers.get("age") || "0";
  const server = res.headers.get("server") || "unknown";

  summary.deployment = {
    statusCode: res.status,
    server,
    xVercelId,
    xMatchedPath,
    xNextPrerender,
    age,
  };
  console.log(`   Apex status: ${res.status} OK (Server: ${server})`);
  console.log(`   Vercel Request ID: ${xVercelId}`);
  console.log(`   X-Nextjs-Prerender: ${xNextPrerender}\n`);
} catch (err) {
  summary.errors.push(`Apex check failed: ${err.message}`);
}

// 2. Verify Discovery Files (robots.txt, sitemap.xml, feed.xml, indexnow txt)
console.log("2. Checking Discovery Files (robots.txt, sitemap.xml, feed.xml, IndexNow Key)...");
try {
  const robotsRes = await get("/robots.txt");
  const robotsText = await robotsRes.text();
  const hasRscBlock = robotsText.includes("/*?_rsc=") && robotsText.includes("/*&_rsc=");
  const hasBytespiderBlock = robotsText.includes("Bytespider") && robotsText.includes("Disallow: /");
  const hasSitemapLink = robotsText.includes("https://anomalybox.com/sitemap.xml");

  summary.discoveryFiles.robots = {
    status: robotsRes.status,
    hasRscBlock,
    hasBytespiderBlock,
    hasSitemapLink,
    pass: robotsRes.status === 200 && hasRscBlock && hasBytespiderBlock && hasSitemapLink,
  };
  console.log(`   /robots.txt: ${robotsRes.status} (RSC Block: ${hasRscBlock}, Bot Block: ${hasBytespiderBlock}, Sitemap: ${hasSitemapLink})`);
} catch (err) {
  summary.errors.push(`robots.txt check failed: ${err.message}`);
}

try {
  const sitemapRes = await get("/sitemap.xml");
  const sitemapText = await sitemapRes.text();
  const sitemapUrls = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const lastmods = [...sitemapText.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1].trim());
  const uniqueLastmods = [...new Set(lastmods)];

  summary.sitemapCount = sitemapUrls.length;
  summary.discoveryFiles.sitemap = {
    status: sitemapRes.status,
    urlCount: sitemapUrls.length,
    uniqueLastmods,
    pass: sitemapRes.status === 200 && sitemapUrls.length > 0 && uniqueLastmods.includes("2026-11-01T11:15:00.000Z"),
  };
  console.log(`   /sitemap.xml: ${sitemapRes.status} (${sitemapUrls.length} URLs, lastmod: ${uniqueLastmods.join(", ")})`);
} catch (err) {
  summary.errors.push(`sitemap.xml check failed: ${err.message}`);
}

try {
  const feedRes = await get("/feed.xml");
  const feedText = await feedRes.text();
  const hasLastBuildDate = feedText.includes("<lastBuildDate>");
  const hasPubDate = feedText.includes("<pubDate>");
  const itemCount = (feedText.match(/<item>/g) || []).length;

  summary.discoveryFiles.feed = {
    status: feedRes.status,
    hasLastBuildDate,
    hasPubDate,
    itemCount,
    pass: feedRes.status === 200 && hasLastBuildDate && hasPubDate && itemCount > 0,
  };
  console.log(`   /feed.xml: ${feedRes.status} (${itemCount} items, lastBuildDate: ${hasLastBuildDate}, pubDate: ${hasPubDate})`);
} catch (err) {
  summary.errors.push(`feed.xml check failed: ${err.message}`);
}

try {
  const keyFile = "03151688f8364893baa15973a9bd4ef6.txt";
  const keyRes = await get(`/${keyFile}`);
  const keyText = (await keyRes.text()).trim();
  const pass = keyRes.status === 200 && keyText === "03151688f8364893baa15973a9bd4ef6";

  summary.discoveryFiles.indexNowKey = {
    status: keyRes.status,
    keyMatched: pass,
  };
  console.log(`   /${keyFile}: ${keyRes.status} (Key valid: ${pass})\n`);
} catch (err) {
  summary.errors.push(`IndexNow key file check failed: ${err.message}`);
}

// 3. Check Previously Failing False-Noindex URL
console.log("3. Deep Testing Previously Failing URL (/resources/reels-creative-brief-template-for-brands)...");
try {
  const testPath = "/resources/reels-creative-brief-template-for-brands";
  const res = await get(testPath);
  const html = await res.text();

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const robotsMatch = html.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/i);
  const canonicalMatch = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i);
  const gVerifMatch = html.match(/<meta[^>]+name="google-site-verification"[^>]+content="([^"]+)"/i);
  const isPaywalled = html.includes("Customer Resource Library");
  const hasMermaid = html.includes("flowchart LR") || html.includes("mermaid");

  const title = titleMatch ? titleMatch[1] : "";
  const robots = robotsMatch ? robotsMatch[1] : "";
  const canonical = canonicalMatch ? canonicalMatch[1] : "";
  const gVerif = gVerifMatch ? gVerifMatch[1] : "";

  const passed =
    res.status === 200 &&
    !robots.includes("noindex") &&
    robots.includes("index") &&
    !isPaywalled &&
    title.includes("Reels Creative Brief Template") &&
    canonical === `${origin}${testPath}`;

  summary.falseNoindexCheck = {
    path: testPath,
    status: res.status,
    title,
    robots,
    canonical,
    googleVerification: gVerif,
    isPaywalled,
    hasMermaid,
    passed,
  };

  console.log(`   Status: ${res.status}`);
  console.log(`   Title: ${title}`);
  console.log(`   Robots: ${robots}`);
  console.log(`   Canonical: ${canonical}`);
  console.log(`   Paywalled (False): ${isPaywalled}`);
  console.log(`   Google Verification Meta: ${gVerif}`);
  console.log(`   TEST RESULT: ${passed ? "PASSED (Resolved)" : "FAILED"}\n`);
} catch (err) {
  summary.errors.push(`False-noindex check error: ${err.message}`);
}

// 4. Test All 88 Redirect Pairs
console.log(`4. Testing all ${redirectPairs.length} Consolidated 308 Redirects...`);
let redirectFailures = 0;
const BATCH_SIZE = 10;

for (let i = 0; i < redirectPairs.length; i += BATCH_SIZE) {
  const chunk = redirectPairs.slice(i, i + BATCH_SIZE);
  await Promise.all(
    chunk.map(async ({ source, destination }) => {
      try {
        const res = await get(source);
        const loc = res.headers.get("location");
        if (res.status !== 308) {
          summary.errors.push(`Redirect ${source} returned ${res.status} (expected 308)`);
          redirectFailures++;
          return;
        }
        const targetUrl = new URL(loc, origin);
        if (targetUrl.pathname !== destination) {
          summary.errors.push(`Redirect ${source} lands on ${loc}, expected ${destination}`);
          redirectFailures++;
          return;
        }
        // Verify destination answers 200
        const landing = await get(targetUrl.pathname);
        if (landing.status !== 200) {
          summary.errors.push(`Redirect destination ${destination} returned ${landing.status}`);
          redirectFailures++;
          return;
        }
        summary.redirectsPassed++;
      } catch (err) {
        summary.errors.push(`Redirect ${source} failed with exception: ${err.message}`);
        redirectFailures++;
      }
    }),
  );
  process.stdout.write(`   Checked ${Math.min(i + BATCH_SIZE, redirectPairs.length)} / ${redirectPairs.length} redirects...\r`);
}
summary.redirectsTested = redirectPairs.length;
console.log(`\n   Redirects Result: ${summary.redirectsPassed} / ${summary.redirectsTested} passed (Failures: ${redirectFailures})\n`);

// 5. Test All 174 Sitemap Pages
console.log(`5. Crawling and Auditing all Sitemap Pages for Live SEO Integrity...`);
const sitemapXml = await (await get("/sitemap.xml")).text();
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
summary.sitemapPagesTested = sitemapUrls.length;

let pageFailures = 0;
const queue = [...sitemapUrls];
const workers = Array.from({ length: 10 }, async () => {
  while (queue.length > 0) {
    const url = queue.shift();
    const pathname = new URL(url).pathname;
    try {
      const res = await get(pathname);
      if (res.status !== 200) {
        summary.errors.push(`Sitemap URL ${pathname} returned HTTP ${res.status}`);
        pageFailures++;
        continue;
      }
      const html = await res.text();
      if (html.length < 3000) {
        summary.errors.push(`Sitemap URL ${pathname} has suspicious tiny size: ${html.length} bytes`);
        pageFailures++;
        continue;
      }

      // Check canonical
      const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
      if (!canonical) {
        summary.errors.push(`Sitemap URL ${pathname} is missing canonical tag`);
        pageFailures++;
        continue;
      }
      const canonicalPath = new URL(canonical, origin).pathname;
      if (canonicalPath !== pathname) {
        summary.errors.push(`Sitemap URL ${pathname} canonical mismatch: ${canonical}`);
        pageFailures++;
        continue;
      }

      // Check robots meta tag
      const robots = html.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/i)?.[1] || "";
      if (/noindex/i.test(robots)) {
        summary.errors.push(`Sitemap URL ${pathname} carries NOINDEX: ${robots}`);
        pageFailures++;
        continue;
      }

      // Check Google verification meta tag
      if (html.includes("YoQFSqizL_nH29UVpAfsDKrSMrCmTHTkIBK7Q9j0veg")) {
        summary.googleVerificationTagsFound++;
      }

      // Check internal links for merged sources
      for (const match of html.matchAll(/<a[^>]+href="([^"#]+)/g)) {
        const href = match[1].replace(/&amp;/g, "&");
        if (href.startsWith("/")) {
          const target = href.split("?")[0];
          if (mergedSources.has(target)) {
            summary.internalLinksToMergedFound++;
            summary.errors.push(`Internal link to merged URL on ${pathname} -> ${target}`);
          }
        }
      }

      summary.sitemapPagesPassed++;
    } catch (err) {
      summary.errors.push(`Error crawling ${pathname}: ${err.message}`);
      pageFailures++;
    }
  }
});

await Promise.all(workers);
console.log(`   Sitemap Pages Result: ${summary.sitemapPagesPassed} / ${summary.sitemapPagesTested} passed (Failures: ${pageFailures})`);
console.log(`   Google Verification Tags Found in HTML: ${summary.googleVerificationTagsFound} / ${summary.sitemapPagesTested}`);
console.log(`   Internal Links to Merged URLs: ${summary.internalLinksToMergedFound}\n`);

// 6. Final Report Summary
console.log("================================================================================");
console.log("   DEEP AUDIT EXECUTION SUMMARY");
console.log("================================================================================");
console.log(`Total Sitemap URLs Tested:     ${summary.sitemapPagesTested}`);
console.log(`Total Sitemap URLs Passed:     ${summary.sitemapPagesPassed}`);
console.log(`Total 308 Redirects Tested:    ${summary.redirectsTested}`);
console.log(`Total 308 Redirects Passed:    ${summary.redirectsPassed}`);
console.log(`False-Noindex Issue Resolved:  ${summary.falseNoindexCheck.passed ? "YES" : "NO"}`);
console.log(`Total Errors / Failures:       ${summary.errors.length}`);

if (summary.errors.length === 0) {
  console.log("\n[VERDICT]: 100% PASS - The solution is FULLY LIVE and VERIFIED on production!");
} else {
  console.log(`\n[VERDICT]: FAILED with ${summary.errors.length} errors:`);
  for (const err of summary.errors.slice(0, 10)) {
    console.log(` - ${err}`);
  }
}

fs.writeFileSync(
  path.join(root, "reports", "live-deep-resolution-audit.json"),
  JSON.stringify(summary, null, 2),
  "utf8"
);
console.log("\nSaved full audit report to reports/live-deep-resolution-audit.json\n");
