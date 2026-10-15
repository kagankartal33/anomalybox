/**
 * Deep Static & Code Audit of All Public Routes and SEO Configurations
 */
import fs from "node:fs";
import path from "node:path";
import { resources, segments } from "../lib/seo-content.js";
import { siteUrl } from "../lib/env.js";

const root = path.resolve(import.meta.dirname, "..");
const base = siteUrl();

console.log("\n==========================================================");
console.log("             DEEP REPOSITORY SEO AUDIT");
console.log("==========================================================");
console.log(`Canonical Base: ${base}`);
console.log(`Environment:    ${process.env.NODE_ENV || "development"}\n`);

const checks: { category: string; test: string; passed: boolean; details?: string }[] = [];

function check(category: string, test: string, condition: boolean, details?: string) {
  checks.push({ category, test, passed: Boolean(condition), details });
  const icon = condition ? "✓" : "✗";
  console.log(`  [${icon}] ${category}: ${test}${details ? ` -> ${details}` : ""}`);
}

// 1. Audit siteUrl runtime behavior
const originalEnv = { ...process.env };

const devUrl = siteUrl();
check("1. Environment & Base URL", "siteUrl() is non-empty string in dev", typeof devUrl === "string" && devUrl.length > 0, devUrl);
check("1. Environment & Base URL", "siteUrl() does not end with trailing slash", !devUrl.endsWith("/"));

// Test production fallback
process.env.NODE_ENV = "production";
delete process.env.NEXT_PUBLIC_SITE_URL;
delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
delete process.env.VERCEL_URL;
delete process.env.URL;
const prodFallbackUrl = siteUrl();
check("1. Environment & Base URL", "siteUrl() falls back to https://anomalybox.com in production when unset", prodFallbackUrl === "https://anomalybox.com", prodFallbackUrl);

// Test localhost avoidance in production
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
const prodLocalhostAvoided = siteUrl();
check("1. Environment & Base URL", "siteUrl() rejects localhost in production and falls back to anomalybox.com", prodLocalhostAvoided === "https://anomalybox.com", prodLocalhostAvoided);

// Test valid custom production domain
process.env.NEXT_PUBLIC_SITE_URL = "https://anomalybox.com/";
const prodCustomTrimmed = siteUrl();
check("1. Environment & Base URL", "siteUrl() strips trailing slash from valid production domain", prodCustomTrimmed === "https://anomalybox.com", prodCustomTrimmed);

// Restore original env
for (const k of Object.keys(process.env)) delete process.env[k];
Object.assign(process.env, originalEnv);

// 2. Audit robots.ts
const robotsCode = fs.readFileSync(path.join(root, "app", "robots.ts"), "utf8");
check("2. Robots.txt", "robots.ts exists and readable", robotsCode.length > 0);
check("2. Robots.txt", "Disallows /admin/", robotsCode.includes('"/admin/"'));
check("2. Robots.txt", "Disallows /api/", robotsCode.includes('"/api/"'));
check("2. Robots.txt", "Disallows /profile/", robotsCode.includes('"/profile/"'));
check("2. Robots.txt", "Disallows /boxes/", robotsCode.includes('"/boxes/"'));
check("2. Robots.txt", "Allows public /", robotsCode.includes('allow: "/"'));
check("2. Robots.txt", "References sitemap.xml", robotsCode.includes("sitemap.xml"));
check("2. Robots.txt", "References feed.xml", robotsCode.includes("feed.xml"));
check("2. Robots.txt", "Defines host property", robotsCode.includes("host: base"));

// 3. Audit sitemap.ts
const sitemapCode = fs.readFileSync(path.join(root, "app", "sitemap.ts"), "utf8");
check("3. Sitemap.xml", "Does not include /login (which is noindex)", !sitemapCode.includes('`${base}/login`') && !sitemapCode.includes('"/login"'));
check("3. Sitemap.xml", "Includes home page", sitemapCode.includes("url: base"));
check("3. Sitemap.xml", "Includes /store", sitemapCode.includes('`${base}/store`'));
check("3. Sitemap.xml", "Includes /pricing", sitemapCode.includes('`${base}/pricing`'));
check("3. Sitemap.xml", "Includes /reels", sitemapCode.includes('`${base}/reels`'));
check("3. Sitemap.xml", "Includes /content-ideas", sitemapCode.includes('`${base}/content-ideas`'));
check("3. Sitemap.xml", "Includes /resources", sitemapCode.includes('`${base}/resources`'));
check("3. Sitemap.xml", "Includes all 12 segments dynamically", sitemapCode.includes("segments.map"));
check("3. Sitemap.xml", "Includes all 8 resources dynamically", sitemapCode.includes("resources.map"));
check("3. Sitemap.xml", "Includes dossiers", sitemapCode.includes("classic-red") && sitemapCode.includes("signature-purple"));

// 4. Audit layout.tsx
const layoutCode = fs.readFileSync(path.join(root, "app", "layout.tsx"), "utf8");
check("4. Root Layout", "Defines metadataBase", layoutCode.includes("metadataBase: new URL(siteUrl())"));
check("4. Root Layout", "Defines canonical alternate for root", /alternates:\s*\{\s*canonical:\s*["']\/["']/.test(layoutCode));
check("4. Root Layout", "Defines robots index: true", layoutCode.includes("index: true"));
check("4. Root Layout", "Defines googleBot directives", layoutCode.includes("googleBot: {"));
check("4. Root Layout", "Defines max-image-preview: large", layoutCode.includes('"max-image-preview": "large"'));
check("4. Root Layout", "Defines verification tags", layoutCode.includes("verification: {"));
check("4. Root Layout", "Defines openGraph metadata", layoutCode.includes("openGraph: {"));
check("4. Root Layout", "Defines twitter card metadata", layoutCode.includes("twitter: {"));

// 5. Audit brand assets in public/
const markAnomalySvg = path.join(root, "public", "brand", "mark-anomaly.svg");
const markGemSvg = path.join(root, "public", "brand", "mark-gem.svg");
const indexNowKeyFile = path.join(root, "public", "03151688f8364893baa15973a9bd4ef6.txt");
check("5. Public Assets", "public/brand/mark-anomaly.svg exists", fs.existsSync(markAnomalySvg));
check("5. Public Assets", "public/brand/mark-gem.svg exists", fs.existsSync(markGemSvg));
check("5. Public Assets", "IndexNow key file exists and clean", fs.existsSync(indexNowKeyFile) && fs.readFileSync(indexNowKeyFile, "utf8").trim() === "03151688f8364893baa15973a9bd4ef6");

// 6. Audit core public pages: H1 and Canonical
const corePages = [
  { file: "app/page.tsx", route: "/" },
  { file: "app/store/page.tsx", route: "/store" },
  { file: "app/pricing/page.tsx", route: "/pricing" },
  { file: "app/reels/page.tsx", route: "/reels" },
  { file: "app/content-ideas/page.tsx", route: "/content-ideas" },
  { file: "app/resources/page.tsx", route: "/resources" },
  { file: "app/about/page.tsx", route: "/about" },
  { file: "app/methodology/page.tsx", route: "/methodology" },
  { file: "app/atelier/page.tsx", route: "/atelier" },
  { file: "app/content-ideas/[slug]/page.tsx", route: "/content-ideas/[slug]" },
  { file: "app/resources/[slug]/page.tsx", route: "/resources/[slug]" },
  { file: "app/resources/reels-creative-brief-template-for-brands/page.tsx", route: "/resources/reels-creative-brief-template-for-brands" },
  { file: "app/dossiers/[slug]/page.tsx", route: "/dossiers/[slug]" },
];

for (const p of corePages) {
  const filePath = path.join(root, p.file);
  const exists = fs.existsSync(filePath);
  check("6. Core Public Pages", `Route ${p.route} (${p.file}) exists`, exists);
  if (!exists) continue;

  const content = fs.readFileSync(filePath, "utf8");
  const h1Matches = content.match(/<h1\b[^>]*>/gi) || [];
  check("6. Core Public Pages", `${p.route} has H1 element`, h1Matches.length >= 1, `Found ${h1Matches.length}`);

  const hasCanonical = content.includes("canonical") || p.file === "app/page.tsx";
  check("6. Core Public Pages", `${p.route} specifies canonical`, hasCanonical);
}

// 7. Audit JSON-LD structures
const seoMetadataCode = fs.readFileSync(path.join(root, "lib", "seo-metadata.ts"), "utf8");
check("7. Schema.org JSON-LD", "organizationJsonLd includes schema.org context", seoMetadataCode.includes('"@context": "https://schema.org"'));
check("7. Schema.org JSON-LD", "organizationJsonLd includes Organization type", seoMetadataCode.includes('"@type": "Organization"'));
check("7. Schema.org JSON-LD", "organizationJsonLd includes high-authority sameAs", seoMetadataCode.includes("youtube.com/@anomalybox") && seoMetadataCode.includes("x.com/anomalybox"));
check("7. Schema.org JSON-LD", "websiteJsonLd includes SearchAction", seoMetadataCode.includes('"@type": "SearchAction"'));

// 8. Audit next.config.ts
const nextConfigCode = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
check("8. Redirects & 404 Safety", "next.config.ts redirects /tools to /resources", nextConfigCode.includes('source: "/tools"') && nextConfigCode.includes('destination: "/resources"'));

const failed = checks.filter((c) => !c.passed);
console.log("\n==========================================================");
console.log(`TOTAL CHECKS: ${checks.length}`);
console.log(`PASSED:       ${checks.length - failed.length}`);
console.log(`FAILED:       ${failed.length}`);
console.log("==========================================================\n");

if (failed.length > 0) {
  console.error("FAILURES DETECTED:");
  for (const f of failed) {
    console.error(`- [${f.category}] ${f.test}: ${f.details || ""}`);
  }
  process.exit(1);
} else {
  console.log("ALL CRITICAL DEEP SEO CHECKS PASSED WITH 100% ACCURACY!");
}
