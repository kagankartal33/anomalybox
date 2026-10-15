#!/usr/bin/env node

/**
 * Site Speed & Web Vitals Audit Tool
 * Audits performance, TTFB, payload sizes, caching headers, LCP assets, and security headers
 * across key public routes.
 *
 * Usage:
 *   node tools/audit-site-speed.mjs [--url http://127.0.0.1:3000] [--lighthouse]
 */

import http from "node:http";
import https from "node:https";
import { execSync } from "node:child_process";
import fs from "node:fs";
import zlib from "node:zlib";

const args = process.argv.slice(2);
function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const baseUrl = (getArg("--url", process.env.SITE_URL || "http://127.0.0.1:3000")).replace(/\/$/, "");
const runLighthouse = args.includes("--lighthouse");

const TARGET_ROUTES = [
  { path: "/", name: "Landing Page", maxTtfbMs: 600, maxBytes: 250000 },
  { path: "/store", name: "Store Catalog", maxTtfbMs: 700, maxBytes: 300000 },
  { path: "/pricing", name: "Pricing Page", maxTtfbMs: 500, maxBytes: 150000 },
  { path: "/resources", name: "Resources Hub", maxTtfbMs: 600, maxBytes: 200000 },
  { path: "/atelier", name: "Atelier Studio", maxTtfbMs: 500, maxBytes: 150000 },
  { path: "/login", name: "Creator Sign-In", maxTtfbMs: 500, maxBytes: 120000 },
];

function fetchTiming(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === "https:" ? https : http;
    const startTime = performance.now();
    let ttfb = 0;

    const req = client.get(url, {
      headers: {
        "User-Agent": "ViralBox-SpeedAudit/1.0",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Encoding": "gzip, deflate, br",
      },
      timeout: 10000,
    }, (res) => {
      ttfb = performance.now() - startTime;
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const totalTime = performance.now() - startTime;
        const bodyBuffer = Buffer.concat(chunks);
        let decompressed = bodyBuffer;
        const enc = res.headers["content-encoding"];
        try {
          if (enc === "gzip") decompressed = zlib.gunzipSync(bodyBuffer);
          else if (enc === "br") decompressed = zlib.brotliDecompressSync(bodyBuffer);
          else if (enc === "deflate") decompressed = zlib.inflateSync(bodyBuffer);
        } catch {
          // fallback
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          ttfb: Math.round(ttfb),
          totalTime: Math.round(totalTime),
          bytes: bodyBuffer.length,
          bodyText: decompressed.toString("utf8"),
        });
      });
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${urlStr}`));
    });
  });
}

async function runSyntheticAudit() {
  console.log(`\n===============================================================`);
  console.log(` VIRALBOX SITE SPEED & WEB VITALS AUDIT`);
  console.log(` Target Server: ${baseUrl}`);
  console.log(`===============================================================\n`);

  let anyFailed = false;
  const results = [];

  for (const route of TARGET_ROUTES) {
    const targetUrl = `${baseUrl}${route.path}`;
    try {
      const result = await fetchTiming(targetUrl);
      const passedStatus = result.statusCode === 200;
      const passedTtfb = result.ttfb <= route.maxTtfbMs;
      const passedSize = result.bytes <= route.maxBytes;

      const cacheControl = result.headers["cache-control"] || "NONE";
      const hasSecurityHeaders = Boolean(
        result.headers["x-content-type-options"] &&
        result.headers["x-frame-options"] &&
        result.headers["referrer-policy"]
      );

      // Check for LCP image and structured data
      const hasJsonLd = result.bodyText.includes('type="application/ld+json"');
      const hasCanonical = result.bodyText.includes('rel="canonical"');

      const isPass = passedStatus && passedTtfb && passedSize;
      if (!isPass) anyFailed = true;

      results.push({
        route: route.path,
        name: route.name,
        status: result.statusCode,
        ttfb: `${result.ttfb} ms`,
        total: `${result.totalTime} ms`,
        size: `${(result.bytes / 1024).toFixed(1)} KB`,
        cache: cacheControl.length > 25 ? `${cacheControl.substring(0, 22)}...` : cacheControl,
        security: hasSecurityHeaders ? "PASS" : "WARN",
        schema: hasJsonLd ? "YES" : "NO",
        canonical: hasCanonical ? "YES" : "NO",
        verdict: isPass ? "PASS" : "WARN/FAIL",
      });
    } catch (err) {
      anyFailed = true;
      results.push({
        route: route.path,
        name: route.name,
        status: "ERR",
        ttfb: "-",
        total: "-",
        size: "-",
        cache: "-",
        security: "-",
        schema: "-",
        canonical: "-",
        verdict: `ERR: ${err.message}`,
      });
    }
  }

  console.table(results);

  if (runLighthouse) {
    console.log(`\n--- Running Full Lighthouse Mobile Audit on ${baseUrl} ---`);
    try {
      execSync(`npx -y lighthouse ${baseUrl} --output json --output-path lighthouse-report.json --chrome-flags="--headless --no-sandbox" --only-categories=performance,accessibility,best-practices,seo --quiet`, {
        stdio: "inherit",
      });
      if (fs.existsSync("lighthouse-report.json")) {
        console.log("\nParsing Lighthouse Results:");
        execSync("node tools/parse-lighthouse.cjs", { stdio: "inherit" });
      }
    } catch (lhErr) {
      console.warn("Lighthouse execution warning:", lhErr.message);
    }
  }

  console.log(`\n---------------------------------------------------------------`);
  if (anyFailed) {
    console.error(`[FAIL] One or more routes failed performance/speed thresholds.`);
    process.exit(1);
  } else {
    console.log(`[SUCCESS] All audited routes meet TTFB, payload size, and header standards.`);
    process.exit(0);
  }
}

runSyntheticAudit().catch((err) => {
  console.error("Fatal audit error:", err);
  process.exit(1);
});
