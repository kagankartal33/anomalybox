import { seoPageByPublicPath } from "@/lib/seo-package";

/**
 * Guides linked from the home page. Chosen from Search Console (Oct 2026): these pages already earn
 * impressions at average positions 3-8, so a link from the strongest page on the site is the
 * cheapest way to lift them onto page one. Paths that were merged in the content consolidation
 * resolve to their cluster winner. Review this list against Search Console every quarter.
 */
const POPULAR_GUIDE_PATHS = [
  "/reels/instagram-reels-shot-list",
  "/resources/content-planning-workflow",
  "/services/custom-instagram-content-plan",
  "/creator-personas/content-strategy-for-small-creators",
  "/resources/minimum-viable-content-strategy",
  "/resources/how-to-create-content-consistently",
  "/reels/instagram-reels-ideas",
  "/resources/food-recipe-reels-lighting-and-angle-plan",
] as const;

export type PopularGuide = { href: string; title: string; description: string };

export function popularGuides(): PopularGuide[] {
  const seen = new Set<string>();
  const guides: PopularGuide[] = [];
  for (const path of POPULAR_GUIDE_PATHS) {
    const page = seoPageByPublicPath(path);
    if (!page || seen.has(page.path)) continue;
    seen.add(page.path);
    guides.push({ href: page.path, title: page.title, description: page.description });
  }
  return guides;
}
