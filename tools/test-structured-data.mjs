#!/usr/bin/env node

/**
 * Schema.org & JSON-LD Structured Data Validator
 * Extracts and validates Schema.org specifications on key routes to ensure
 * Google Rich Results compliance.
 *
 * Usage:
 *   node tools/test-structured-data.mjs [baseUrl]
 */

import http from "node:http";
import https from "node:https";

const baseUrl = (process.argv[2] || process.env.SITE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

const PAGES_TO_TEST = [
  { path: "/", expectedTypes: ["Organization", "WebSite", "FAQPage"] },
  { path: "/store", expectedTypes: ["Organization"] },
  { path: "/pricing", expectedTypes: ["Organization"] },
];

function fetchHtml(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === "https:" ? https : http;
    client.get(url, { headers: { "User-Agent": "ViralBox-SchemaValidator/1.0" } }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    }).on("error", reject);
  });
}

function extractJsonLd(html) {
  const regex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const schemas = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        schemas.push(...parsed);
      } else {
        schemas.push(parsed);
      }
    } catch (err) {
      console.error(`[ERR] Failed to parse JSON-LD block:`, err.message);
    }
  }
  return schemas;
}

async function runStructuredDataAudit() {
  console.log(`\n===============================================================`);
  console.log(` SCHEMA.ORG JSON-LD STRUCTURED DATA AUDIT: ${baseUrl}`);
  console.log(`===============================================================\n`);

  let allValid = true;

  for (const page of PAGES_TO_TEST) {
    const url = `${baseUrl}${page.path}`;
    console.log(`--> Checking structured data on ${page.path}...`);
    try {
      const html = await fetchHtml(url);
      const schemas = extractJsonLd(html);

      if (schemas.length === 0) {
        console.error(`[FAIL] No JSON-LD found on ${page.path}`);
        allValid = false;
        continue;
      }

      const typesFound = schemas.map((s) => s["@type"]).filter(Boolean);
      console.log(`Found schema types: ${typesFound.join(", ")}`);

      for (const expected of page.expectedTypes) {
        if (!typesFound.includes(expected)) {
          console.warn(`[WARN] Expected schema '${expected}' not found on ${page.path}`);
        }
      }

      // Deep validate each schema
      for (const schema of schemas) {
        if (schema["@context"] !== "https://schema.org") {
          console.error(`[FAIL] Invalid @context in schema: ${schema["@context"]}`);
          allValid = false;
        }

        if (schema["@type"] === "FAQPage") {
          if (!Array.isArray(schema.mainEntity) || schema.mainEntity.length === 0) {
            console.error(`[FAIL] FAQPage has no questions in mainEntity`);
            allValid = false;
          } else {
            console.log(`[PASS] FAQPage with ${schema.mainEntity.length} questions verified.`);
          }
        }

        if (schema["@type"] === "Organization") {
          if (!schema.name || !schema.url) {
            console.error(`[FAIL] Organization schema missing name or url`);
            allValid = false;
          } else {
            console.log(`[PASS] Organization (${schema.name}) verified.`);
          }
        }
      }
    } catch (err) {
      console.error(`[FAIL] Could not audit ${page.path}: ${err.message}`);
      allValid = false;
    }
  }

  console.log(`\n---------------------------------------------------------------`);
  if (allValid) {
    console.log(`[SUCCESS] Structured data audit passed.\n`);
    process.exit(0);
  } else {
    console.error(`[FAIL] One or more structured data validations failed.\n`);
    process.exit(1);
  }
}

runStructuredDataAudit().catch((err) => {
  console.error("Structured data error:", err);
  process.exit(1);
});
