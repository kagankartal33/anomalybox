import { writeFileSync } from "node:fs";

const BASE_URL = process.env.SITE_AUDIT_BASE || "https://anomalybox.com";

async function fetchUrl(path, options = {}) {
  const fullUrl = path.startsWith("http") ? path : new URL(path, BASE_URL).href;
  try {
    const res = await fetch(fullUrl, {
      headers: { "user-agent": "AnomalyBoxDeepAudit/2.0", ...(options.headers || {}) },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      ...options,
    });
    const text = await res.text();
    return { url: fullUrl, status: res.status, ok: res.ok, headers: Object.fromEntries(res.headers.entries()), text };
  } catch (err) {
    return { url: fullUrl, status: 0, ok: false, error: String(err), headers: {}, text: "" };
  }
}

async function runAudit() {
  console.log(`Starting deep audit against: ${BASE_URL}\n`);
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    staticAssets: {},
    apiEndpoints: {},
    sitemapStats: {},
    pageAudits: [],
    brokenLinks: [],
    brokenImages: [],
    metaIssues: [],
    securityHeaders: {},
    findings: [],
  };

  // 1. Check special root files
  console.log("1. Checking core static endpoints (robots, sitemap, llms, rss, manifest, security)...");
  const coreFiles = [
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/feed.xml",
    "/site.webmanifest",
    "/.well-known/security.txt",
    "/favicon.ico",
  ];

  for (const file of coreFiles) {
    const res = await fetchUrl(file);
    report.staticAssets[file] = {
      status: res.status,
      contentType: res.headers["content-type"] || "unknown",
      size: res.text.length,
      ok: res.ok,
    };
    console.log(`  ${file}: ${res.status} (${res.headers["content-type"] || "no-type"}, ${res.text.length} bytes)`);
    if (!res.ok) {
      report.findings.push({ category: "Static Assets", severity: "HIGH", message: `${file} returned HTTP ${res.status}` });
    }
  }

  // 2. Check API endpoints
  console.log("\n2. Checking public API endpoints...");
  const apis = [
    { path: "/api/health", method: "GET" },
    { path: "/api/store/availability", method: "GET" },
    { path: "/api/store/categories", method: "GET" },
    { path: "/api/checkout", method: "POST", body: JSON.stringify({ category: "travel", persona: "travel_curator", tier: "classic" }), headers: { "content-type": "application/json" } },
  ];

  for (const api of apis) {
    const res = await fetchUrl(api.path, { method: api.method, body: api.body, headers: api.headers });
    report.apiEndpoints[api.path] = {
      status: res.status,
      bodyPreview: res.text.slice(0, 300),
    };
    console.log(`  ${api.method} ${api.path}: ${res.status} -> ${res.text.slice(0, 100)}`);
  }

  // 3. Parse sitemap and crawl all pages
  console.log("\n3. Crawling all sitemap URLs...");
  const sitemapRes = await fetchUrl("/sitemap.xml");
  const sitemapUrls = [...new Set([...sitemapRes.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim()))];
  console.log(`  Found ${sitemapUrls.length} URLs in sitemap.xml`);
  report.sitemapStats.totalUrls = sitemapUrls.length;

  const internalLinksToCheck = new Set();
  const imagesToCheck = new Set();

  const BATCH_SIZE = 12;
  for (let i = 0; i < sitemapUrls.length; i += BATCH_SIZE) {
    const chunk = sitemapUrls.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(chunk.map(url => fetchUrl(url)));

    for (const page of results) {
      if (!page.ok) {
        report.pageAudits.push({ url: page.url, status: page.status, error: "HTTP Error" });
        report.findings.push({ category: "Page Reachability", severity: "CRITICAL", message: `Page failed with HTTP ${page.status}: ${page.url}` });
        continue;
      }

      // Check security headers on first page
      if (i === 0 && Object.keys(report.securityHeaders).length === 0) {
        report.securityHeaders = {
          "x-frame-options": page.headers["x-frame-options"],
          "x-content-type-options": page.headers["x-content-type-options"],
          "strict-transport-security": page.headers["strict-transport-security"],
          "content-security-policy": page.headers["content-security-policy"],
          "referrer-policy": page.headers["referrer-policy"],
          "permissions-policy": page.headers["permissions-policy"],
        };
      }

      // Parse HTML
      const html = page.text;
      const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";
      
      const metaDescMatch = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                             html.match(/<meta\b[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
      const description = metaDescMatch ? metaDescMatch[1].trim() : "";

      const canonicalMatch = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i) ||
                             html.match(/<link\b[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
      const canonical = canonicalMatch ? canonicalMatch[1].trim() : "";

      const ogTitleMatch = html.match(/<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
      const ogDescMatch = html.match(/<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
      const ogImageMatch = html.match(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);

      const h1Matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
      
      const pageInfo = {
        url: page.url,
        status: page.status,
        title,
        titleLength: title.length,
        description,
        descLength: description.length,
        canonical,
        h1Count: h1Matches.length,
        h1Text: h1Matches[0] ? h1Matches[0][1].replace(/<[^>]+>/g, "").trim() : "",
        hasOgTitle: Boolean(ogTitleMatch),
        hasOgDesc: Boolean(ogDescMatch),
        hasOgImage: Boolean(ogImageMatch),
        ogImage: ogImageMatch ? ogImageMatch[1] : "",
      };

      if (!title) {
        report.findings.push({ category: "SEO Title", severity: "HIGH", message: `Missing title: ${page.url}` });
      } else if (title.length < 20 || title.length > 78) {
        report.findings.push({ category: "SEO Title", severity: "LOW", message: `Title length (${title.length} chars) suboptimal on: ${page.url} -> "${title}"` });
      }

      if (!description) {
        report.findings.push({ category: "SEO Description", severity: "HIGH", message: `Missing meta description: ${page.url}` });
      } else if (description.length < 80 || description.length > 170) {
        report.findings.push({ category: "SEO Description", severity: "LOW", message: `Meta description length (${description.length} chars) out of standard [80-170]: ${page.url}` });
      }

      if (h1Matches.length !== 1) {
        report.findings.push({ category: "Semantic HTML", severity: "MEDIUM", message: `Found ${h1Matches.length} <h1> tags on: ${page.url}` });
      }

      if (!canonical) {
        report.findings.push({ category: "Canonical Link", severity: "MEDIUM", message: `Missing canonical link: ${page.url}` });
      }

      if (ogImageMatch && ogImageMatch[1]) {
        imagesToCheck.add(ogImageMatch[1]);
      }

      // Collect images
      const imgMatches = [...html.matchAll(/<img\b[^>]*src=["']([^"']*)["'][^>]*>/gi)];
      for (const m of imgMatches) {
        const src = m[1];
        if (src && !src.startsWith("data:")) {
          imagesToCheck.add(src.startsWith("http") ? src : new URL(src, page.url).href);
        }
      }

      // Collect links
      const aMatches = [...html.matchAll(/<a\b[^>]*href=["']([^"']*)["'][^>]*>/gi)];
      for (const m of aMatches) {
        const href = m[1];
        if (href && !href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("tel:") && !href.startsWith("javascript:")) {
          const target = href.startsWith("http") ? href : new URL(href, page.url).href;
          if (target.startsWith(BASE_URL)) {
            internalLinksToCheck.add(target.split("#")[0]);
          }
        }
      }

      // Check for Turkish leak words or leftover test words in rendered page
      const visibleText = html.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
      const turkishMatches = visibleText.match(/\b(Bugun|goster|gosterir|karar filtresi|guvenli|urun|cekim|sahne|kaydet|yorum)\b/gi);
      if (turkishMatches && turkishMatches.length > 0) {
        report.findings.push({ category: "Content Residue", severity: "MEDIUM", message: `Turkish remnant words [${[...new Set(turkishMatches)].join(", ")}] found in: ${page.url}` });
      }

      const placeholderMatches = visibleText.match(/\{[a-z_0-9]+\}/gi);
      if (placeholderMatches) {
        report.findings.push({ category: "Content Residue", severity: "HIGH", message: `Unresolved template placeholders [${[...new Set(placeholderMatches)].join(", ")}] on: ${page.url}` });
      }

      report.pageAudits.push(pageInfo);
    }
    process.stdout.write(`  Crawled ${Math.min(i + BATCH_SIZE, sitemapUrls.length)} / ${sitemapUrls.length} pages...\r`);
  }
  console.log(`\n  Crawled all ${sitemapUrls.length} sitemap pages successfully.`);

  // 4. Check extra internal links
  console.log(`\n4. Verifying ${internalLinksToCheck.size} discovered internal links...`);
  const internalUrls = Array.from(internalLinksToCheck);
  for (let i = 0; i < internalUrls.length; i += BATCH_SIZE) {
    const chunk = internalUrls.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(chunk.map(url => fetchUrl(url)));
    for (const res of results) {
      if (!res.ok && res.status !== 401 && res.status !== 307 && res.status !== 308) {
        report.brokenLinks.push({ url: res.url, status: res.status });
        report.findings.push({ category: "Broken Link", severity: "HIGH", message: `Broken internal link HTTP ${res.status}: ${res.url}` });
      }
    }
  }

  // 5. Sample check images
  console.log(`\n5. Checking ${imagesToCheck.size} image assets...`);
  const imageSample = Array.from(imagesToCheck).slice(0, 100);
  for (let i = 0; i < imageSample.length; i += BATCH_SIZE) {
    const chunk = imageSample.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(chunk.map(url => fetchUrl(url, { method: "HEAD" })));
    for (const res of results) {
      if (!res.ok && res.status !== 405) {
        // Retry with GET if HEAD 405
        const getRes = await fetchUrl(res.url);
        if (!getRes.ok) {
          report.brokenImages.push({ url: res.url, status: getRes.status });
          report.findings.push({ category: "Broken Image", severity: "MEDIUM", message: `Image asset failed HTTP ${getRes.status}: ${res.url}` });
        }
      }
    }
  }

  console.log("\n--- AUDIT SUMMARY ---");
  console.log(`Total Pages Crawled: ${report.pageAudits.length}`);
  console.log(`Total Findings: ${report.findings.length}`);
  console.log(`Broken Links: ${report.brokenLinks.length}`);
  console.log(`Broken Images: ${report.brokenImages.length}`);
  console.log("\nTop Findings:");
  for (const f of report.findings.slice(0, 25)) {
    console.log(`  [${f.severity}] [${f.category}] ${f.message}`);
  }

  writeFileSync("deep_live_audit_results.json", JSON.stringify(report, null, 2), "utf-8");
  console.log("\nWrote detailed results to deep_live_audit_results.json");
}

runAudit().catch(console.error);
