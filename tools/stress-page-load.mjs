#!/usr/bin/env node

/**
 * High-Concurrency HTTP Page Load Stress Test
 * Sends batches of concurrent requests to public pages and measures throughput,
 * latency percentiles (p50, p95, p99), and error rates.
 *
 * Usage:
 *   node tools/stress-page-load.mjs [--url http://127.0.0.1:3000] [--requests 100] [--concurrency 10]
 */

import http from "node:http";
import https from "node:https";

const args = process.argv.slice(2);
function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const baseUrl = (getArg("--url", process.env.SITE_URL || "http://127.0.0.1:3000")).replace(/\/$/, "");
const totalRequests = parseInt(getArg("--requests", "100"), 10);
const concurrency = parseInt(getArg("--concurrency", "10"), 10);

function sendRequest(path) {
  return new Promise((resolve) => {
    const start = performance.now();
    const url = new URL(`${baseUrl}${path}`);
    const client = url.protocol === "https:" ? https : http;

    const req = client.get(url, {
      headers: { "User-Agent": "ViralBox-LoadTester/1.0" },
      timeout: 10000,
    }, (res) => {
      res.on("data", () => {});
      res.on("end", () => {
        resolve({
          path,
          status: res.statusCode,
          duration: performance.now() - start,
          error: null,
        });
      });
    });

    req.on("error", (err) => {
      resolve({
        path,
        status: 0,
        duration: performance.now() - start,
        error: err.message,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        path,
        status: 0,
        duration: performance.now() - start,
        error: "TIMEOUT",
      });
    });
  });
}

async function runLoadTest() {
  console.log(`\n===============================================================`);
  console.log(` HIGH-CONCURRENCY PAGE LOAD BENCHMARK`);
  console.log(` Target: ${baseUrl}`);
  console.log(` Total Requests: ${totalRequests} | Concurrency: ${concurrency}`);
  console.log(`===============================================================\n`);

  const paths = ["/", "/store", "/pricing"];
  const latencies = [];
  let successCount = 0;
  let failCount = 0;

  const testStart = performance.now();
  let completed = 0;

  async function worker() {
    while (completed < totalRequests) {
      completed++;
      const path = paths[completed % paths.length];
      const res = await sendRequest(path);
      latencies.push(res.duration);
      if (res.status === 200) {
        successCount++;
      } else {
        failCount++;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const testDurationSec = (performance.now() - testStart) / 1000;
  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = (totalRequests / testDurationSec).toFixed(1);

  console.log(`--- RESULTS ---`);
  console.log(`Completed Requests: ${completed}`);
  console.log(`Success (200 OK):   ${successCount}`);
  console.log(`Failed/Timeouts:    ${failCount}`);
  console.log(`Total Time:         ${testDurationSec.toFixed(2)}s`);
  console.log(`Throughput:         ${rps} req/sec`);
  console.log(`Latency p50:        ${Math.round(p50)} ms`);
  console.log(`Latency p95:        ${Math.round(p95)} ms`);
  console.log(`Latency p99:        ${Math.round(p99)} ms`);

  console.log(`\n---------------------------------------------------------------`);
  if (failCount > 0) {
    console.error(`[FAIL] ${failCount} request(s) failed during load test.\n`);
    process.exit(1);
  } else {
    console.log(`[SUCCESS] 100% of requests succeeded under load.\n`);
    process.exit(0);
  }
}

runLoadTest().catch((err) => {
  console.error("Load test error:", err);
  process.exit(1);
});
