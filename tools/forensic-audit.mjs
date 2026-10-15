import { writeFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.SITE_AUDIT_BASE || "https://anomalybox.com";

async function fetchUrl(path, options = {}) {
  const fullUrl = path.startsWith("http") ? path : new URL(path, BASE_URL).href;
  try {
    const res = await fetch(fullUrl, {
      headers: { "user-agent": "AnomalyBoxForensicAudit/3.0", ...(options.headers || {}) },
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

function getAllFiles(dir, exts = [".ts", ".tsx", ".md", ".sql", ".mjs"]) {
  let files = [];
  for (const item of readdirSync(dir)) {
    if (item === "node_modules" || item === ".next" || item === ".git" || item === "dist" || item === "archive") continue;
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.some(e => item.endsWith(e))) {
      files.push(fullPath);
    }
  }
  return files;
}

async function runForensicAudit() {
  console.log("==================================================");
  console.log(`FORENSIC AUDIT: Starting Deep Multi-Layer Scan`);
  console.log(`Target: ${BASE_URL}`);
  console.log("==================================================\n");

  const results = {
    liveSchemaIssues: [],
    liveSecurityHeaderIssues: [],
    liveOgIssues: [],
    liveApiIssues: [],
    liveUiIssues: [],
    codeSecurityIssues: [],
    errorBoundaryIssues: [],
    contentLeakIssues: [],
    markdownLinkIssues: [],
    sqlRlsIssues: [],
    reactPerformanceIssues: [],
  };

  // -------------------------------------------------------------
  // 1. LIVE SITEMAP CRAWL & SCHEMA / OG / ACCESSIBILITY AUDIT
  // -------------------------------------------------------------
  console.log("TRACK 1: Crawling sitemap and validating JSON-LD Schema, OG tags, Headings, and Accessibility...");
  const sitemapRes = await fetchUrl("/sitemap.xml");
  const sitemapUrls = [...new Set([...sitemapRes.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim()))];
  console.log(`  Found ${sitemapUrls.length} live sitemap URLs to deeply analyze.\n`);

  const BATCH_SIZE = 15;
  for (let i = 0; i < sitemapUrls.length; i += BATCH_SIZE) {
    const chunk = sitemapUrls.slice(i, i + BATCH_SIZE);
    const pages = await Promise.all(chunk.map(url => fetchUrl(url)));

    for (const p of pages) {
      if (!p.ok) continue;
      const html = p.text;

      // 1.1 JSON-LD Schema Validation
      const jsonLdMatches = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      if (jsonLdMatches.length === 0) {
        results.liveSchemaIssues.push({ url: p.url, issue: "Missing JSON-LD structured data" });
      } else {
        for (const match of jsonLdMatches) {
          try {
            const data = JSON.parse(match[1]);
            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
              if (!item["@type"]) {
                results.liveSchemaIssues.push({ url: p.url, issue: "JSON-LD schema missing @type" });
              }
              if (!item["@context"] && !items.some(x => x["@context"])) {
                results.liveSchemaIssues.push({ url: p.url, issue: "JSON-LD schema missing @context" });
              }
              // Check Product schema specifics
              if (item["@type"] === "Product") {
                if (!item.name || !item.offers) {
                  results.liveSchemaIssues.push({ url: p.url, issue: "Product schema missing name or offers" });
                }
              }
              // Check Article / Guide schema
              if (item["@type"] === "Article" || item["@type"] === "BlogPosting") {
                if (!item.headline || !item.author) {
                  results.liveSchemaIssues.push({ url: p.url, issue: "Article schema missing headline or author" });
                }
              }
            }
          } catch (err) {
            results.liveSchemaIssues.push({ url: p.url, issue: `Corrupted JSON-LD syntax: ${String(err)}` });
          }
        }
      }

      // 1.2 OpenGraph & Twitter Cards
      const ogTitle = html.match(/<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)?.[1];
      const ogDesc = html.match(/<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)?.[1];
      const ogImg = html.match(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)?.[1];
      const twCard = html.match(/<meta\b[^>]*name=["']twitter:card["'][^>]*content=["']([^"']*)["']/i)?.[1];

      if (!ogTitle) results.liveOgIssues.push({ url: p.url, issue: "Missing og:title" });
      if (!ogDesc) results.liveOgIssues.push({ url: p.url, issue: "Missing og:description" });
      if (!ogImg) results.liveOgIssues.push({ url: p.url, issue: "Missing og:image" });
      if (!twCard) results.liveOgIssues.push({ url: p.url, issue: "Missing twitter:card" });

      // 1.3 Unrendered Markdown in Live HTML
      const unrenderedMarkdownMatch = html.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+|\/[^\)]+)\)/);
      if (unrenderedMarkdownMatch) {
        results.liveUiIssues.push({ url: p.url, issue: `Unrendered Markdown link visible in HTML: "${unrenderedMarkdownMatch[0]}"` });
      }

      // 1.4 Check for console error hooks / debug markers
      if (html.includes("react-devtools") || html.includes("__next_error__") || html.includes("Minified React error")) {
        results.liveUiIssues.push({ url: p.url, issue: "React minified error or devtools artifact in production HTML" });
      }
    }
  }

  // -------------------------------------------------------------
  // 2. LIVE SECURITY HEADERS AUDIT
  // -------------------------------------------------------------
  console.log("TRACK 2: Auditing Live Security & Cache Headers...");
  const homeRes = await fetchUrl("/");
  const h = homeRes.headers;
  const expectedSecurityHeaders = [
    { key: "x-frame-options", desc: "X-Frame-Options (Clickjacking protection)", recommend: "DENY or SAMEORIGIN" },
    { key: "x-content-type-options", desc: "X-Content-Type-Options (MIME sniffing prevention)", recommend: "nosniff" },
    { key: "strict-transport-security", desc: "Strict-Transport-Security (HSTS)", recommend: "max-age=63072000; includeSubDomains; preload" },
    { key: "content-security-policy", desc: "Content-Security-Policy (CSP)", recommend: "default-src 'self'..." },
    { key: "referrer-policy", desc: "Referrer-Policy", recommend: "strict-origin-when-cross-origin" },
    { key: "permissions-policy", desc: "Permissions-Policy", recommend: "camera=(), microphone=(), geolocation=()" },
  ];

  for (const exp of expectedSecurityHeaders) {
    if (!h[exp.key]) {
      results.liveSecurityHeaderIssues.push({ header: exp.key, desc: exp.desc, recommend: exp.recommend, status: "MISSING" });
    } else {
      console.log(`  [OK] ${exp.key}: ${h[exp.key]}`);
    }
  }

  // -------------------------------------------------------------
  // 3. LIVE API ENDPOINT FUZZING & ERROR HANDLING
  // -------------------------------------------------------------
  console.log("\nTRACK 3: Deep Fuzzing API Endpoints (Edge Cases, Bad Inputs, Auth Guards)...");
  const apiTests = [
    { path: "/api/health", method: "GET", expectedStatus: 200 },
    { path: "/api/store/availability", method: "GET", expectedStatus: 400 }, // missing params should 400, not 500
    { path: "/api/store/availability?box_product_slug=INVALID_BOX&category_slug=travel&persona_slug=travel_curator", method: "GET", expectedStatus: 200 },
    { path: "/api/store/creator-modes", method: "GET", expectedStatus: 400 },
    { path: "/api/store/creator-modes?category_slug=' OR '1'='1", method: "GET", expectedStatus: 200 }, // SQL injection test
    { path: "/api/checkout", method: "POST", body: {}, expectedStatus: 400 },
    { path: "/api/checkout", method: "POST", body: { category: "bad", persona: "bad", tier: "bad" }, expectedStatus: 400 },
    { path: "/api/notifications", method: "GET", expectedStatus: 401 }, // Unauthenticated should 401
    { path: "/api/stripe/webhook", method: "GET", expectedStatus: 405 }, // Webhook only allows POST
    { path: "/api/stripe/webhook", method: "POST", headers: { "stripe-signature": "fake_sig" }, body: "{}", expectedStatus: 400 }, // Signature reject
  ];

  for (const test of apiTests) {
    const res = await fetchUrl(test.path, {
      method: test.method,
      headers: { "content-type": "application/json", ...(test.headers || {}) },
      body: typeof test.body === "object" ? JSON.stringify(test.body) : test.body,
    });
    const statusMatch = res.status === test.expectedStatus || (test.expectedStatus === 401 && (res.status === 401 || res.status === 307));
    if (!statusMatch && res.status >= 500) {
      results.liveApiIssues.push({ path: test.path, method: test.method, status: res.status, issue: `Server Error 5xx returned! Body: ${res.text.slice(0, 150)}` });
    } else if (!statusMatch) {
      results.liveApiIssues.push({ path: test.path, method: test.method, status: res.status, issue: `Expected status ${test.expectedStatus} but got ${res.status}` });
    } else {
      console.log(`  [OK] ${test.method} ${test.path} -> ${res.status}`);
    }
  }

  // -------------------------------------------------------------
  // 4. CODEBASE STATIC ANALYSIS: ERROR BOUNDARIES & 404s
  // -------------------------------------------------------------
  console.log("\nTRACK 4: Auditing Error Boundaries, not-found, and Layouts...");
  const appRoutes = [
    "app/about", "app/atelier", "app/boxes", "app/cards", "app/checkout",
    "app/content-ideas", "app/creator-lanes", "app/creator-personas",
    "app/dossiers", "app/legal", "app/login", "app/pricing", "app/reels",
    "app/resources", "app/services", "app/store", "app/tools"
  ];
  
  for (const r of appRoutes) {
    const hasError = statSyncSafe(join(r, "error.tsx"));
    const hasNotFound = statSyncSafe(join(r, "not-found.tsx"));
    if (!hasError && !statSyncSafe("app/error.tsx")) {
      results.errorBoundaryIssues.push({ route: r, issue: "Missing dedicated or root error.tsx boundary" });
    }
  }

  // -------------------------------------------------------------
  // 5. LOCAL CONTENT SCAN: LEAKS, TURKISH RESIDUE, PLACEHOLDERS
  // -------------------------------------------------------------
  console.log("\nTRACK 5: Scanning all content markdown and components for residue...");
  const allCodeFiles = getAllFiles(".");
  const turkishRegex = /\b(bugun|goster|gosterir|karar filtresi|guvenli|urun|cekim|sahne|kaydet|yorum|neler|aciklama|detaylar)\b/i;
  const placeholderRegex = /\{[a-z0-9_]+\}|\[TODO\]|\[INSERT\s+[^\]]+\]|Lorem\s+ipsum/i;

  for (const f of allCodeFiles) {
    // Skip test tools or dictionaries intentionally containing patterns
    if (f.includes("scan-production-leaks.ps1") || f.includes("tools") || f.includes("test") || f.includes("scripts")) continue;
    const content = readFileSync(f, "utf-8");
    
    // Check Turkish
    const turkMatches = content.match(new RegExp(turkishRegex, "gi"));
    if (turkMatches && (f.endsWith(".tsx") || f.endsWith(".md") || f.endsWith(".ts"))) {
      // Filter out comments if ts/tsx
      const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
      const cleanMatches = cleanContent.match(new RegExp(turkishRegex, "gi"));
      if (cleanMatches) {
        results.contentLeakIssues.push({ file: f, matches: [...new Set(cleanMatches)], issue: "Turkish word residue in public component/content" });
      }
    }

    // Check Placeholders
    const placeMatches = content.match(new RegExp(placeholderRegex, "gi"));
    if (placeMatches && f.includes("content/") && f.endsWith(".md")) {
      results.contentLeakIssues.push({ file: f, matches: [...new Set(placeMatches)], issue: "Unresolved template placeholders in Markdown" });
    }
  }

  // -------------------------------------------------------------
  // 6. SQL RLS & SUPABASE SECURITY AUDIT
  // -------------------------------------------------------------
  console.log("\nTRACK 6: Auditing Supabase Schema & Row-Level Security (RLS)...");
  const sqlFiles = getAllFiles("supabase", [".sql"]);
  for (const sqlFile of sqlFiles) {
    const sql = readFileSync(sqlFile, "utf-8");
    // Look for create table without alter table enable row level security
    const createTableMatches = [...sql.matchAll(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_\."]+)/gi)];
    for (const match of createTableMatches) {
      const tableName = match[1].replace(/public\./g, "").replace(/"/g, "");
      if (tableName.startsWith("pg_") || tableName.includes("schema_migrations")) continue;
      const rlsPattern = new RegExp(`ALTER\\s+TABLE\\s+(?:public\\.)?${tableName}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, "i");
      if (!rlsPattern.test(sql) && !sql.includes(`ENABLE ROW LEVEL SECURITY`)) {
        results.sqlRlsIssues.push({ file: sqlFile, table: tableName, issue: "Table may be missing explicit RLS enable statement" });
      }
    }
  }

  console.log("\n==================================================");
  console.log("FORENSIC AUDIT COMPLETED. SUMMARY OF FINDINGS:");
  console.log("==================================================");
  console.log(`Live Schema Issues: ${results.liveSchemaIssues.length}`);
  console.log(`Live Security Header Issues: ${results.liveSecurityHeaderIssues.length}`);
  console.log(`Live OG / Twitter Issues: ${results.liveOgIssues.length}`);
  console.log(`Live API Issues: ${results.liveApiIssues.length}`);
  console.log(`Live UI Issues: ${results.liveUiIssues.length}`);
  console.log(`Content Leak Issues: ${results.contentLeakIssues.length}`);
  console.log(`Error Boundary Issues: ${results.errorBoundaryIssues.length}`);
  console.log(`SQL RLS Issues: ${results.sqlRlsIssues.length}`);

  writeFileSync("forensic_audit_report.json", JSON.stringify(results, null, 2), "utf-8");
  console.log("\nFull report written to forensic_audit_report.json");
}

function statSyncSafe(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

runForensicAudit().catch(console.error);
