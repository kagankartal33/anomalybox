import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { segments } from "@/lib/seo-content";
import { llmsPublicPages } from "@/lib/llms-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const contentUpdated = new Date("2026-09-23T00:00:00.000Z");

  const core: MetadataRoute.Sitemap = [
    { url: base, lastModified: contentUpdated, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/content-ideas`, lastModified: contentUpdated, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/resources`, lastModified: contentUpdated, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/store`, lastModified: contentUpdated, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/pricing`, lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/atelier`, lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, lastModified: contentUpdated, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/methodology`, lastModified: contentUpdated, changeFrequency: "yearly", priority: 0.7 },
    { url: `${base}/dossiers/classic-red`, lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/dossiers/signature-purple`, lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/tools/first-3-seconds-auditor`, lastModified: contentUpdated, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/tools/format-utility-router`, lastModified: contentUpdated, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/tools/creator-capacity-calculator`, lastModified: contentUpdated, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/legal`, lastModified: contentUpdated, changeFrequency: "yearly", priority: 0.3 },
  ];

  const sectionHubs: MetadataRoute.Sitemap = [
    "reels",
    "creator-lanes",
    "creator-personas",
    "services",
    "tools",
  ].map((section) => ({
      url: `${base}/${section}`,
      lastModified: contentUpdated,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

  const packagePages: MetadataRoute.Sitemap = llmsPublicPages.map((page) => ({
    url: `${base}${page.path}`,
    lastModified: contentUpdated,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Segment pages not covered by package content-ideas slugs
  const packageContentIdeaSlugs = new Set(
    llmsPublicPages
      .filter((p) => p.path.startsWith("/content-ideas/"))
      .map((p) => p.path.split("/").at(-1)),
  );
  const extraSegments: MetadataRoute.Sitemap = segments
    .filter((s) => !packageContentIdeaSlugs.has(s.slug))
    .map((item) => ({
      url: `${base}/content-ideas/${item.slug}`,
      lastModified: contentUpdated,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    }));

  const all = [...core, ...sectionHubs, ...packagePages, ...extraSegments];
  return [...new Map(all.map((entry) => [entry.url, entry])).values()];
}
