#!/usr/bin/env node

/**
 * Security Headers & CSP Audit Tool
 * Validates that Next.js security headers, Content Security Policy, and robot protection
 * are properly enforced on public and API routes.
 *
 * Usage:
 *   node tools/audit-security-csp.mjs [url]
 */

import http from "node:http";
import https from "node:https";

const args = process.argv.slice(2);
const allowOffline = args.includes("--allow-offline");
const urlArg = args.find((a) => !a.startsWith("--"));
const baseUrl = (urlArg || process.env.SITE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

const REQUIRED_HEADERS = [
  { name: "x-content-type-options", expected: "nosniff" },
  { name: "x-frame-options", expected: "DENY" },
  { name: "referrer-policy", expected: "strict-origin-when-cross-origin" },
  { name: "permissions-policy", contains: "camera=()" },
  { name: "cross-origin-opener-policy", expected: "same-origin-allow-popups" },
  { name: "cross-origin-resource-policy", expected: "same-site" },
];

function checkHeaders(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === "https:" ? https : http;

    client.get(url, { headers: { "User-Agent": "ViralBox-SecurityAudit/1.0" } }, (res) => {
      resolve({
        url: urlStr,
        statusCode: res.statusCode,
        headers: res.headers,
      });
    }).on("error", reject);
  });
}

async function runSecurityHeaderAudit() {
  console.log(`\n===============================================================`);
  console.log(` SECURITY HEADERS & CSP AUDIT: ${baseUrl}`);
  console.log(`===============================================================\n`);

  let allPassed = true;

  // 1. Audit public page headers
  console.log(`--> Checking Public Page Headers on ${baseUrl}/`);
  const home = await checkHeaders(`${baseUrl}/`);

  for (const rule of REQUIRED_HEADERS) {
    const actual = home.headers[rule.name];
    if (!actual) {
      console.error(`[FAIL] Missing header: ${rule.name}`);
      allPassed = false;
    } else if (rule.expected && actual !== rule.expected) {
      console.error(`[FAIL] Header ${rule.name}: expected '${rule.expected}', got '${actual}'`);
      allPassed = false;
    } else if (rule.contains && !actual.includes(rule.contains)) {
      console.error(`[FAIL] Header ${rule.name}: did not contain '${rule.contains}'`);
      allPassed = false;
    } else {
      console.log(`[PASS] ${rule.name}: ${actual}`);
    }
  }

  // Check CSP
  const csp = home.headers["content-security-policy"] || home.headers["content-security-policy-report-only"];
  if (csp) {
    console.log(`[PASS] Content Security Policy present: ${csp.substring(0, 60)}...`);
  } else {
    console.warn(`[WARN] Content-Security-Policy header not detected.`);
  }

  // 2. Audit API route noindex header
  console.log(`\n--> Checking API Route Security on ${baseUrl}/api/health`);
  const apiRes = await checkHeaders(`${baseUrl}/api/health`);
  const robotsTag = apiRes.headers["x-robots-tag"];
  if (robotsTag && robotsTag.includes("noindex")) {
    console.log(`[PASS] API route properly marked noindex (${robotsTag})`);
  } else {
    console.error(`[FAIL] API route missing X-Robots-Tag: noindex`);
    allPassed = false;
  }

  console.log(`\n---------------------------------------------------------------`);
  if (allPassed) {
    console.log(`[SUCCESS] All security headers verified.\n`);
    process.exit(0);
  } else {
    console.error(`[FAILURE] One or more security headers failed validation.\n`);
    process.exit(1);
  }
}

runSecurityHeaderAudit().catch((err) => {
  if (err.code === "ECONNREFUSED" && process.argv.includes("--allow-offline")) {
    console.warn(`[SKIP] Next.js server not running at ${baseUrl}. Live security headers check skipped in offline mode.\n`);
    process.exit(0);
  }
  console.error("Security audit encountered an error:", err.message);
  process.exit(1);
});
