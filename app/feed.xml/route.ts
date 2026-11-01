import { llmsPublicPages } from "@/lib/llms-pages";
import { siteUrl } from "@/lib/env";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const base = siteUrl();
  const buildDate = new Date("2026-11-01T11:15:00.000Z").toUTCString();
  const items = llmsPublicPages
    .map(
      (item) =>
        `<item><title>${escapeXml(item.title)}</title><link>${base}${item.path}</link><guid isPermaLink="true">${base}${item.path}</guid><pubDate>${buildDate}</pubDate><description>${escapeXml(item.description)}</description></item>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Anomaly Box Creator Resources</title><link>${base}/resources</link><description>Practical guides for creator content planning, filming, visual direction, and sustainable production.</description><lastBuildDate>${buildDate}</lastBuildDate><atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
