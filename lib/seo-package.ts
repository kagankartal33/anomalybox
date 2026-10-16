/**
 * SEO Package V6 registry — public editorial pages only.
 * Source: archive/source-packs/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6 (imported).
 * Not related to viral idea-card generation.
 */

import { resources } from "@/lib/seo-content";
import { consolidationDestination, isConsolidatedPath } from "@/lib/seo-consolidation";
import registry from "./seo-package-registry.json";
import linkData from "./seo-package-links.json";

// Content hash for the public SEO-package WebP files. The deployment
// integrity check blocks builds if the files change without this value being
// updated, preventing immutable browser caches from showing stale artwork.
export const SEO_PACKAGE_ASSET_VERSION = "49068aac2c6706c4";

export function versionedSeoPackageImage(image: string): string {
  if (!image.startsWith("/assets/seo-package/")) return image;
  return image.split("?")[0] ?? image;
}

export function versionedSeoPackageHeroImage(image: string): string {
  const [pathname] = image.split("?", 1);
  const hero = pathname.replace(/\.webp$/, "-hero.webp");
  return versionedSeoPackageImage(hero);
}

export type SeoPackagePage = {
  id: string;
  folder: string;
  slug: string;
  section: string;
  path: string;
  title: string;
  seoTitle?: string;
  description: string;
  keyword: string;
  secondaryKeywords: string[];
  pageType: string;
  searchIntent: string;
  audience: string;
  funnelStage: string;
  wordCount: number;
  bodyWordCount: number;
  image: string;
  imageAlt: string;
  /** ISO 8601 — bot/meta only; do not render in visible UI */
  datePublished: string;
  /** ISO 8601 — bot/meta only; do not render in visible UI */
  dateModified: string;
  status: string;
  schemaType: string;
};

export type SeoPackageSection =
  | "content-ideas"
  | "reels"
  | "resources"
  | "templates"
  | "creator-lanes"
  | "creator-personas"
  | "services"
  | "tools";

export const SEO_PACKAGE_SECTIONS: {
  id: SeoPackageSection;
  label: string;
  description: string;
}[] = [
  {
    id: "content-ideas",
    label: "Content Ideas",
    description: "Lane and format idea systems with shoot-ready direction.",
  },
  {
    id: "reels",
    label: "Reels",
    description: "Short-form hooks, scripts, and scene plans.",
  },
  {
    id: "resources",
    label: "Resources",
    description: "Workflow, strategy, and production system guides.",
  },
  {
    id: "templates",
    label: "Templates",
    description: "Briefs, scripts, shot lists, and production templates.",
  },
  {
    id: "creator-lanes",
    label: "Creator Lanes",
    description: "Niche-specific strategy and proof frameworks.",
  },
  {
    id: "creator-personas",
    label: "Creator Personas",
    description: "Persona-fit production systems for real constraints.",
  },
  {
    id: "services",
    label: "Services",
    description: "Anomaly Box services and direction products explained.",
  },
  {
    id: "tools",
    label: "Tools",
    description: "Checklists and decision tools for calmer production.",
  },
];

function loadRegistry(): SeoPackagePage[] {
  return (registry.pages ?? []) as SeoPackagePage[];
}

function loadLegacyResourcePages(): SeoPackagePage[] {
  const published = "2026-08-09T00:00:00Z";
  return resources.map((resource, index) => ({
    id: `LEGACY-${String(index + 1).padStart(3, "0")}`,
    folder: `legacy-resources/${resource.slug}`,
    slug: resource.slug,
    section: "resources",
    path: `/resources/${resource.slug}`,
    title: resource.title,
    seoTitle: compactSeoTitle(resource.title),
    description: legacyResourceDescription(resource.description, resource.sections),
    keyword: resource.title.toLowerCase(),
    secondaryKeywords: [],
    pageType: "resource",
    searchIntent: "informational",
    audience: "Creators and creator-led brands",
    funnelStage: "awareness",
    wordCount: 0,
    bodyWordCount: 0,
    image: `/assets/legacy-resources/${resource.slug}.svg`,
    imageAlt: `${resource.title} — creator planning visual.`,
    datePublished: published,
    dateModified: published,
    status: "published",
    schemaType: "Article",
  }));
}

function compactSeoTitle(title: string): string {
  if (title.length <= 60) return title;
  for (const separator of [": ", " — ", " – ", " | "]) {
    const first = title.split(separator, 1)[0].trim();
    if (first.length >= 28 && first.length <= 60) return first;
  }
  const shortened = title.slice(0, 61);
  const boundary = shortened.lastIndexOf(" ");
  return shortened.slice(0, boundary > 28 ? boundary : 60).replace(/[\s,;:—–-]+$/g, "");
}

function legacyResourceDescription(description: string, sections: string[]): string {
  const lead = description.trim().replace(/[.\u2026]+$/g, "");
  if (lead.length >= 95) return `${lead}.`;
  const topics = sections.slice(0, 2).map((section) => section.toLowerCase());
  const detail = topics.length === 2 ? ` Covers ${topics[0]} and ${topics[1]}.` : ".";
  const combined = `${lead}.${detail}`.replace(/\.\s*\./g, ".");
  if (combined.length <= 160) return combined;
  const shortened = combined.slice(0, 158);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > 100 ? boundary : 157).replace(/[\s,;:]+$/g, "")}.`;
}

// Keep the public hubs limited to the curated public package. Legacy
// resources remain routable for backwards compatibility, but must never be
// merged back into the new editorial indexes. Pages merged into a cluster
// winner (lib/seo-consolidation.json) are not routable: next.config.ts
// answers them with a 308 before any route renders.
const registryPages = loadRegistry().filter((page) => !isConsolidatedPath(page.path));
const legacyResourcePages = loadLegacyResourcePages().filter((page) => !isConsolidatedPath(page.path));
const routablePages = [...registryPages, ...legacyResourcePages];

export const seoPackagePages: SeoPackagePage[] = registryPages;

export function seoPackageBySlug(slug: string): SeoPackagePage | undefined {
  return routablePages.find((p) => p.slug === slug);
}

export function seoPackageByPath(section: string, slug: string): SeoPackagePage | undefined {
  return routablePages.find((p) => p.section === section && p.slug === slug);
}

/** Routable article at a public path. Paths merged into a cluster winner resolve to that winner. */
export function seoPageByPublicPath(path: string): SeoPackagePage | undefined {
  return routablePagesByPath.get(consolidationDestination(path) ?? path);
}

export function seoPackageBySection(section: string): SeoPackagePage[] {
  return registryPages.filter((p) => p.section === section);
}

export function seoPackageStaticParams(section?: string) {
  const list = section
    ? routablePages.filter((page) => page.section === section)
    : routablePages;
  return list.map((p) => ({ slug: p.slug }));
}

export function sectionLabel(section: string): string {
  return SEO_PACKAGE_SECTIONS.find((s) => s.id === section)?.label ?? section;
}

const PAGE_TYPE_LABELS: Record<string, string> = {
  guide: "Practical guide",
  pillar: "In-depth guide",
  "template-guide": "Member template",
  "lane-ideas": "Content ideas",
  "lane-strategy": "Creator strategy",
  "persona-hub": "Creator profile",
  "commercial-landing": "Creative service",
  "linkable-asset": "Planning tool",
  "lane-execution": "Production guide",
  "lane-commercial-ideas": "Campaign ideas",
  "lane-commercial-strategy": "Campaign strategy",
};

export function pageTypeLabel(pageType: string): string {
  return PAGE_TYPE_LABELS[pageType] ?? pageType.replaceAll("-", " ");
}

export type SeoPackageRelatedLink = {
  slug: string;
  path: string;
  title: string;
  section: string;
  score: number;
  anchorText: string;
};

function loadLinkGraph(): Record<string, SeoPackageRelatedLink[]> {
  return (linkData.links ?? {}) as Record<string, SeoPackageRelatedLink[]>;
}

const linkGraph = loadLinkGraph();

const routablePagesByPath = new Map(routablePages.map((page) => [page.path, page]));

/** Point a related link at the cluster winner when its target was merged; drop it if the winner is not an article. */
function resolveRelatedLink(item: SeoPackageRelatedLink): SeoPackageRelatedLink | undefined {
  const destination = item.path ? consolidationDestination(item.path) : undefined;
  if (!destination) return item;
  const winner = routablePagesByPath.get(destination);
  if (!winner) return undefined;
  return {
    slug: winner.slug,
    path: winner.path,
    title: winner.title,
    section: winner.section,
    score: item.score,
    anchorText: winner.seoTitle || winner.title,
  };
}

export function relatedLinksForSlug(slug: string, limit = 5): SeoPackageRelatedLink[] {
  const items = linkGraph[slug] ?? [];
  const self = routablePages.find((page) => page.slug === slug)?.path;
  const seen = new Set<string>();
  return items
    .map(resolveRelatedLink)
    .filter((item): item is SeoPackageRelatedLink => {
      if (!item?.path || item.slug === slug || item.path === self || !routablePagesByPath.has(item.path) || seen.has(item.path)) {
        return false;
      }
      seen.add(item.path);
      return true;
    })
    .slice(0, limit);
}
