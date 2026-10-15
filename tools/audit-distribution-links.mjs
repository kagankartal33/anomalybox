#!/usr/bin/env node

/**
 * Audit all URLs and assets across the SEO Distribution Kit.
 * Ensures no broken links, 404s, or missing assets exist in any platform distribution files.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distributionDir = path.join(root, "distribution");
const readyToPostDir = path.join(distributionDir, "ready-to-post");

console.log("\n=======================================================");
console.log(" 🔍 SEO DISTRIBUTION PLATFORMS AUDIT");
console.log("=======================================================\n");

let errors = 0;
let checkedFiles = 0;
let checkedUrls = 0;

// 1. Check all visual assets in ready-to-post
console.log("--> Checking ready-to-post assets...");
const expectedAssets = [
  "01-ARTICLE-HERO-COVER.png",
  "02-PINTEREST-PIN-CLASSIC-RED.png",
  "02-PINTEREST-PIN-SIGNATURE-PURPLE.png",
  "03-BRAND-AVATAR-LOGO.png",
  "03-BRAND-BANNER-LOGO.png",
  "04-SLIDESHARE-ISSUU-PRESENTATION.pdf",
];

for (const asset of expectedAssets) {
  const assetPath = path.join(readyToPostDir, asset);
  if (!fs.existsSync(assetPath)) {
    console.error(`❌ Missing asset: ${asset}`);
    errors++;
  } else {
    const size = (fs.statSync(assetPath).size / 1024).toFixed(1);
    console.log(`✅ Asset verified: ${asset} (${size} KB)`);
  }
}

// 2. Scan markdown and json files in distribution/ for anomalybox.com links
console.log("\n--> Scanning all distribution copy for anomalybox.com links...");

function getFilesRecursively(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath));
    } else if (file.endsWith(".md") || file.endsWith(".json") || file.endsWith(".html")) {
      results.push(filePath);
    }
  }
  return results;
}

const files = getFilesRecursively(distributionDir);
const urlRegex = /https:\/\/anomalybox\.com[a-zA-Z0-9_\-\.\/]+/g;
const uniqueUrls = new Set();

for (const file of files) {
  checkedFiles++;
  const content = fs.readFileSync(file, "utf8");
  const matches = content.match(urlRegex) || [];
  for (const url of matches) {
    // Strip trailing markdown characters like . or ) or ]
    const cleaned = url.replace(/[.,\)\]'"]+$/, "");
    uniqueUrls.add(cleaned);
  }
}

console.log(`Found ${uniqueUrls.size} unique anomalybox.com URLs across ${checkedFiles} distribution files.\n`);

// 3. Verify URLs against the Next.js routes / registry / public assets
const registry = JSON.parse(fs.readFileSync(path.join(root, "lib", "seo-package-registry.json"), "utf8"));
const validPaths = new Set([
  "/",
  "/about",
  "/atelier",
  "/content-ideas",
  "/resources",
  "/store",
  "/pricing",
  "/methodology",
  "/legal",
  "/reels",
  "/creator-lanes",
  "/creator-personas",
  "/services",
  "/tools",
  "/tools/first-3-seconds-auditor",
  "/tools/format-utility-router",
  "/tools/creator-capacity-calculator",
  "/tools/creator-brief-scorecard",
  "/tools/creator-mode-selector",
  "/tools/brand-ready-creator-checklist",
  "/tools/content-concept-stress-test",
  "/tools/content-pillar-builder",
  "/tools/creator-decision-fatigue-report",
  "/dossiers/classic-red",
  "/dossiers/signature-purple",
  "/feed.xml",
  "/llms.txt",
  "/sitemap.xml",
  "/robots.txt",
]);

// Check public files
function scanPublicFiles(dir, prefix = "") {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const rel = `${prefix}/${item}`;
    if (fs.statSync(full).isDirectory()) {
      scanPublicFiles(full, rel);
    } else {
      validPaths.add(rel);
    }
  }
}
scanPublicFiles(path.join(root, "public"));

for (const page of registry.pages || []) {
  if (page.path) validPaths.add(page.path);
}

const legacyDir = path.join(root, "content", "resources");
if (fs.existsSync(legacyDir)) {
  for (const f of fs.readdirSync(legacyDir).filter((x) => x.endsWith(".md"))) {
    validPaths.add(`/resources/${f.replace(/\.md$/, "")}`);
  }
}

for (const url of uniqueUrls) {
  if (url.includes("...")) continue; // Skip placeholder ellipses in markdown docs
  checkedUrls++;
  const parsed = new URL(url);
  let pathname = parsed.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }
  if (!validPaths.has(pathname)) {
    console.error(`❌ Dead / Unregistered route in distribution kit: ${url}`);
    errors++;
  } else {
    console.log(`✅ URL valid: ${url}`);
  }
}

console.log("\n=======================================================");
console.log(` AUDIT SUMMARY: Checked ${checkedUrls} URLs across ${checkedFiles} files.`);
if (errors === 0) {
  console.log(" 🎉 ALL DISTRIBUTION ASSETS & URLS ARE 100% HEALTHY!");
  process.exit(0);
} else {
  console.error(` ❌ FOUND ${errors} DEFECTS.`);
  process.exit(1);
}
console.log("=======================================================\n");
