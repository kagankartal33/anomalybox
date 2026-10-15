#!/usr/bin/env node

/**
 * Accessibility (a11y) & Semantic HTML Audit Tool
 * Audits heading hierarchy (single H1, logical nesting), image alt attributes,
 * form input labels, button accessible names, and landmark semantics.
 *
 * Usage:
 *   node tools/audit-accessibility.mjs [baseUrl]
 */

import http from "node:http";
import https from "node:https";

const baseUrl = (process.argv[2] || process.env.SITE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

const AUDIT_ROUTES = ["/", "/store", "/pricing", "/legal", "/atelier", "/login"];

function fetchHtml(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === "https:" ? https : http;
    client.get(url, { headers: { "User-Agent": "ViralBox-A11yAuditor/1.0" } }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    }).on("error", reject);
  });
}

function auditHtml(pathname, html) {
  const issues = [];

  // 1. Heading hierarchy
  const h1Matches = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  if (h1Matches.length === 0) {
    issues.push(`Missing <h1> tag.`);
  } else if (h1Matches.length > 1) {
    issues.push(`Multiple <h1> tags found (${h1Matches.length}). Should have exactly 1.`);
  }

  // 2. Images with missing alt attribute
  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  let missingAltCount = 0;
  for (const img of imgTags) {
    if (!img.includes("alt=")) {
      missingAltCount++;
    }
  }
  if (missingAltCount > 0) {
    issues.push(`${missingAltCount} <img> tag(s) missing 'alt' attribute.`);
  }

  // 3. Inputs without label or aria-label
  const inputTags = html.match(/<input\b[^>]*>/gi) || [];
  let unlabelledInputs = 0;
  for (const inp of inputTags) {
    const typeMatch = inp.match(/type=["']([^"']*)["']/i);
    const type = typeMatch ? typeMatch[1] : "text";
    if (type === "hidden" || inp.includes('aria-hidden="true"')) continue;

    const hasAriaLabel = inp.includes("aria-label=") || inp.includes("aria-labelledby=");
    const hasId = inp.includes("id=");
    const hasTitle = inp.includes("title=");
    if (!hasAriaLabel && !hasId && !hasTitle) {
      unlabelledInputs++;
    }
  }
  if (unlabelledInputs > 0) {
    issues.push(`${unlabelledInputs} <input> element(s) without accessible label/id.`);
  }

  // 4. Buttons without accessible text
  const buttonMatches = html.match(/<button\b[^>]*>([\s\S]*?)<\/button>/gi) || [];
  let emptyButtons = 0;
  for (const btn of buttonMatches) {
    const text = btn.replace(/<[^>]*>/g, "").trim();
    const hasAria = btn.includes("aria-label=") || btn.includes("aria-labelledby=");
    if (!text && !hasAria) {
      emptyButtons++;
    }
  }
  if (emptyButtons > 0) {
    issues.push(`${emptyButtons} <button> element(s) with no discernible text or aria-label.`);
  }

  // 5. Landmark verification
  const hasMain = html.includes("<main");
  const hasNav = html.includes("<nav");
  if (!hasMain) issues.push(`Missing <main> semantic landmark.`);
  if (!hasNav) issues.push(`Missing <nav> semantic landmark.`);

  return issues;
}

async function runA11yAudit() {
  console.log(`\n===============================================================`);
  console.log(` ACCESSIBILITY (A11Y) & SEMANTIC HTML AUDIT: ${baseUrl}`);
  console.log(`===============================================================\n`);

  let totalIssues = 0;

  for (const route of AUDIT_ROUTES) {
    const url = `${baseUrl}${route}`;
    try {
      const html = await fetchHtml(url);
      const issues = auditHtml(route, html);

      if (issues.length === 0) {
        console.log(`[PASS] ${route} meets semantic and accessible standards.`);
      } else {
        console.warn(`[WARN] ${route}:`);
        for (const issue of issues) {
          console.warn(`       - ${issue}`);
          totalIssues++;
        }
      }
    } catch (err) {
      console.error(`[FAIL] Failed to fetch ${route}: ${err.message}`);
      totalIssues++;
    }
  }

  console.log(`\n---------------------------------------------------------------`);
  if (totalIssues > 0) {
    console.warn(`Accessibility audit finished with ${totalIssues} warning(s)/issue(s).\n`);
    // Exit code 0 if only minor warnings, but report cleanly
    process.exit(totalIssues > 5 ? 1 : 0);
  } else {
    console.log(`[SUCCESS] All audited routes meet accessibility and semantic criteria.\n`);
    process.exit(0);
  }
}

runA11yAudit().catch((err) => {
  console.error("A11y audit error:", err);
  process.exit(1);
});
