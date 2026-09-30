import { siteUrl } from "@/lib/env";

export function GET() {
  const base = siteUrl();
  return new Response(`# Anomaly Box

Anomaly Box is a private creative direction platform for creators. It provides execution-ready briefs matched to a creator lane and production mode. It does not guarantee reach, engagement, sales, or virality.

## Primary pages
- ${base}/about
- ${base}/methodology
- ${base}/content-ideas
- ${base}/resources
- ${base}/store
- ${base}/pricing
- ${base}/atelier

## Contact
- support@anomalybox.com
`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
}