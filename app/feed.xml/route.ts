import { resources } from "@/lib/seo-content";
import { siteUrl } from "@/lib/env";

export function GET() {
  const base = siteUrl();
  const items = resources.map((item) => `<item><title>${item.title}</title><link>${base}/resources/${item.slug}</link><guid>${base}/resources/${item.slug}</guid><description>${item.description}</description></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Anomaly Box Creator Resources</title><link>${base}/resources</link><description>Practical creator production and content strategy resources.</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}