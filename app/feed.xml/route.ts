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
  const items = llmsPublicPages
    .map(
      (item) =>
        `<item><title>${escapeXml(item.title)}</title><link>${base}${item.path}</link><guid>${base}${item.path}</guid><description>${escapeXml(item.description)}</description></item>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Anomaly Box Creator Resources</title><link>${base}/resources</link><description>Practical guides for creator content planning, filming, visual direction, and sustainable production.</description>${items}</channel></rss>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
