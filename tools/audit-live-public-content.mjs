/**
 * Crawl every URL in the public sitemap and report content/SEO/link defects.
 * This is intentionally dependency-free so it can run locally or in CI.
 */
const base = new URL(process.env.SITE_AUDIT_BASE || "https://anomalybox.com");
const concurrency = Number(process.env.SITE_AUDIT_CONCURRENCY || 10);

function decode(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function textContent(value) {
  return decode(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function attribute(tag, name) {
  return decode(tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1] || "");
}

function metaContent(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const tag = tags.find((item) => attribute(item, "name").toLowerCase() === name.toLowerCase());
  return tag ? attribute(tag, "content") : "";
}

function canonicalHref(html) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  const tag = tags.find((item) => attribute(item, "rel").toLowerCase().split(/\s+/).includes("canonical"));
  return tag ? attribute(tag, "href") : "";
}

async function mapLimit(items, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

async function fetchPage(url) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "AnomalyBoxContentAudit/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });
    const contentType = response.headers.get("content-type") || "";
    const html = contentType.includes("text/html") ? await response.text() : "";
    return { url, finalUrl: response.url, status: response.status, html };
  } catch (error) {
    return { url, finalUrl: url, status: 0, html: "", error: String(error) };
  }
}

const sitemapResponse = await fetch(new URL("/sitemap.xml", base), {
  headers: { "user-agent": "AnomalyBoxContentAudit/1.0" },
  signal: AbortSignal.timeout(30000),
});
if (!sitemapResponse.ok) throw new Error(`sitemap fetch failed: ${sitemapResponse.status}`);
const sitemap = await sitemapResponse.text();
const urls = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1])))];
const pages = await mapLimit(urls, fetchPage);

const findings = {
  httpErrors: [],
  headingErrors: [],
  metadataErrors: [],
  canonicalErrors: [],
  duplicateRelatedGuides: [],
  unresolvedMarkdown: [],
  missingImageAlt: [],
  internalLanguage: [],
  brokenInternalLinks: [],
};
const titles = new Map();
const descriptions = new Map();
const internalLinks = new Set();

for (const page of pages) {
  if (page.status !== 200) findings.httpErrors.push(`${page.status} ${page.url}`);
  if (!page.html) continue;

  const title = textContent(page.html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const description = metaContent(page.html, "description");
  const canonical = canonicalHref(page.html);
  const h1Count = (page.html.match(/<h1\b/gi) || []).length;
  const relatedCount = (page.html.match(/<h2\b[^>]*>\s*Related guides\s*<\/h2>/gi) || []).length;
  const visible = textContent(page.html.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " "));

  if (!title) findings.metadataErrors.push(`missing title: ${page.url}`);
  if (!description) findings.metadataErrors.push(`missing description: ${page.url}`);
  if (h1Count !== 1) findings.headingErrors.push(`H1 count ${h1Count}: ${page.url}`);
  if (!canonical) findings.canonicalErrors.push(`missing canonical: ${page.url}`);
  if (relatedCount > 1) findings.duplicateRelatedGuides.push(`${relatedCount} sections: ${page.url}`);
  if (/\[[^\]]+\]\((?:\/|https?:\/\/)[^)]+\)/.test(visible)) findings.unresolvedMarkdown.push(page.url);
  if (/SEO operator rules|Zero-Click Summary|not random keyword stuffing|Source Ledger ID|Anti-AI Burstiness|Originality Gate/i.test(visible)) {
    findings.internalLanguage.push(page.url);
  }

  if (title) titles.set(title, [...(titles.get(title) || []), page.url]);
  if (description) descriptions.set(description, [...(descriptions.get(description) || []), page.url]);

  for (const tag of page.html.match(/<img\b[^>]*>/gi) || []) {
    if (!attribute(tag, "alt").trim()) findings.missingImageAlt.push(page.url);
  }
  for (const tag of page.html.match(/<a\b[^>]*>/gi) || []) {
    const href = attribute(tag, "href");
    if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(href)) continue;
    const target = new URL(href, page.url);
    if (target.origin !== base.origin || target.pathname.startsWith("/api/")) continue;
    target.hash = "";
    internalLinks.add(target.href);
  }
}

for (const [title, titleUrls] of titles) {
  if (titleUrls.length > 1) findings.metadataErrors.push(`duplicate title (${titleUrls.length}): ${title}`);
}
for (const [description, descriptionUrls] of descriptions) {
  if (descriptionUrls.length > 1) findings.metadataErrors.push(`duplicate description (${descriptionUrls.length}): ${description.slice(0, 100)}`);
}

const sitemapStatus = new Map(pages.map((page) => [new URL(page.url).pathname.replace(/\/$/, "") || "/", page.status]));
const extraLinks = [...internalLinks].filter((url) => {
  const pathname = new URL(url).pathname.replace(/\/$/, "") || "/";
  return !sitemapStatus.has(pathname);
});
const extraResults = await mapLimit(extraLinks, fetchPage);
for (const result of extraResults) {
  if (result.status >= 400 || result.status === 0) findings.brokenInternalLinks.push(`${result.status} ${result.url}`);
}

console.log(`sitemap pages: ${urls.length}`);
console.log(`internal links: ${internalLinks.size}`);
for (const [name, items] of Object.entries(findings)) {
  const unique = [...new Set(items)];
  findings[name] = unique;
  console.log(`${name}: ${unique.length}`);
  for (const item of unique.slice(0, 15)) console.log(`  - ${item}`);
}

const hardFailures = findings.httpErrors.length + findings.brokenInternalLinks.length;
process.exitCode = hardFailures > 0 ? 1 : 0;