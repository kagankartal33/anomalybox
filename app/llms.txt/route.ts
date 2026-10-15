import { siteUrl } from "@/lib/env";
import { llmsPublicPages } from "@/lib/llms-pages";

export function GET() {
  const base = siteUrl();
  const pages = llmsPublicPages
    .map((page) => `- ${base}${page.path}: ${page.title} — ${page.description}`)
    .join("\n");
  return new Response(`# Anomaly Box

Anomaly Box is a private creative direction platform for creators. It provides execution-ready briefs matched to a creator lane and production mode. It does not guarantee reach, engagement, sales, or virality.

## Primary pages
- ${base}/about
- ${base}/methodology
- ${base}/content-ideas
- ${base}/resources
- ${base}/reels
- ${base}/creator-lanes
- ${base}/creator-personas
- ${base}/services
- ${base}/tools
- ${base}/store
- ${base}/pricing
- ${base}/atelier

## Public editorial pages
${pages}

## Contact
- support@anomalybox.com
`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
}
