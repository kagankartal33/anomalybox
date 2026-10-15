#!/usr/bin/env node

/**
 * Measure Web Vitals & Resource Payload Breakdown
 * Inspects document size, compression efficiency, script count, inline CSS weight,
 * and font/image preload hints for a given URL.
 *
 * Usage:
 *   node tools/measure-web-vitals.mjs [url]
 */

import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";

const targetUrl = process.argv[2] || process.env.SITE_URL || "http://127.0.0.1:3000";

function analyzeUrl(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === "https:" ? https : http;
    const startTime = performance.now();

    const req = client.get(url, {
      headers: {
        "User-Agent": "ViralBox-VitalsAnalyzer/1.0",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Encoding": "gzip, deflate, br",
      },
      timeout: 10000,
    }, (res) => {
      const ttfb = performance.now() - startTime;
      const rawChunks = [];

      res.on("data", (chunk) => rawChunks.push(chunk));
      res.on("end", () => {
        const totalDuration = performance.now() - startTime;
        const compressedBuffer = Buffer.concat(rawChunks);
        const encoding = res.headers["content-encoding"];

        let decompressedBuffer = compressedBuffer;
        try {
          if (encoding === "gzip") {
            decompressedBuffer = zlib.gunzipSync(compressedBuffer);
          } else if (encoding === "br") {
            decompressedBuffer = zlib.brotliDecompressSync(compressedBuffer);
          } else if (encoding === "deflate") {
            decompressedBuffer = zlib.inflateSync(compressedBuffer);
          }
        } catch {
          // fallback to raw
        }

        const html = decompressedBuffer.toString("utf8");

        // Parse HTML metrics
        const scriptMatches = html.match(/<script\b[^>]*>/gi) || [];
        const nextScriptMatches = html.match(/<script\b[^>]*src="[^"]*\/_next\/static\/[^"]*"[^>]*>/gi) || [];
        const imageMatches = html.match(/<img\b[^>]*>/gi) || [];
        const pictureMatches = html.match(/<picture\b[^>]*>/gi) || [];
        const preloadMatches = html.match(/<link\b[^>]*rel="preload"[^>]*>/gi) || [];
        const preconnectMatches = html.match(/<link\b[^>]*rel="preconnect"[^>]*>/gi) || [];
        const fontVariable = html.includes("--font-inter");

        // Estimate DOM nodes
        const tagMatches = html.match(/<\/?[a-z0-9-]+(?:\s+[^>]*)?>/gi) || [];
        const estimatedDomNodes = Math.round(tagMatches.length / 2);

        resolve({
          url: urlStr,
          statusCode: res.statusCode,
          ttfbMs: Math.round(ttfb),
          totalDurationMs: Math.round(totalDuration),
          transferBytes: compressedBuffer.length,
          uncompressedBytes: decompressedBuffer.length,
          compressionRatio: (decompressedBuffer.length / Math.max(1, compressedBuffer.length)).toFixed(2) + "x",
          encoding: encoding || "none",
          cacheControl: res.headers["cache-control"] || "none",
          securityHeaders: {
            nosniff: res.headers["x-content-type-options"] || "missing",
            frameOptions: res.headers["x-frame-options"] || "missing",
            referrerPolicy: res.headers["referrer-policy"] || "missing",
          },
          htmlMetrics: {
            estimatedDomNodes,
            totalScripts: scriptMatches.length,
            nextJsChunks: nextScriptMatches.length,
            totalImages: imageMatches.length,
            pictureElements: pictureMatches.length,
            preloads: preloadMatches.length,
            preconnects: preconnectMatches.length,
            fontInterActive: fontVariable,
          },
        });
      });
    });

    req.on("error", (err) => reject(err));
  });
}

console.log(`\n===============================================================`);
console.log(` DEEP RESOURCE & WEB VITALS BREAKDOWN: ${targetUrl}`);
console.log(`===============================================================\n`);

analyzeUrl(targetUrl)
  .then((report) => {
    console.log(`[Response Timing]`);
    console.log(`- Status Code:       ${report.statusCode}`);
    console.log(`- TTFB:              ${report.ttfbMs} ms`);
    console.log(`- Total Duration:    ${report.totalDurationMs} ms`);

    console.log(`\n[Payload & Compression]`);
    console.log(`- Transfer Size:     ${(report.transferBytes / 1024).toFixed(1)} KB`);
    console.log(`- Uncompressed Size: ${(report.uncompressedBytes / 1024).toFixed(1)} KB`);
    console.log(`- Compression:       ${report.encoding} (${report.compressionRatio})`);
    console.log(`- Cache-Control:     ${report.cacheControl}`);

    console.log(`\n[DOM & Resource Metrics]`);
    console.log(`- Estimated DOM Nodes:   ${report.htmlMetrics.estimatedDomNodes}`);
    console.log(`- Next.js Script Chunks: ${report.htmlMetrics.nextJsChunks}`);
    console.log(`- Total Script Tags:     ${report.htmlMetrics.totalScripts}`);
    console.log(`- Preload Directives:    ${report.htmlMetrics.preloads}`);
    console.log(`- Preconnect Directives: ${report.htmlMetrics.preconnects}`);
    console.log(`- Image Elements:        ${report.htmlMetrics.totalImages} (Responsive <picture>: ${report.htmlMetrics.pictureElements})`);
    console.log(`- Inter Font Variable:   ${report.htmlMetrics.fontInterActive ? "ACTIVE (--font-inter)" : "MISSING"}`);

    console.log(`\n[Security Headers]`);
    console.log(`- X-Content-Type-Options: ${report.securityHeaders.nosniff}`);
    console.log(`- X-Frame-Options:        ${report.securityHeaders.frameOptions}`);
    console.log(`- Referrer-Policy:        ${report.securityHeaders.referrerPolicy}`);

    console.log(`\n---------------------------------------------------------------`);
    console.log(`Audit completed successfully.\n`);
  })
  .catch((err) => {
    console.error("Vitals analysis failed:", err.message);
    process.exit(1);
  });
