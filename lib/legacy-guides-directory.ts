import { resources } from "@/lib/seo-content";
import { isConsolidatedPath } from "@/lib/seo-consolidation";

export type LegacyGuideItem = {
  slug: string;
  title: string;
  description: string;
  path: string;
};

export type LegacyGuideCategory = {
  id: string;
  name: string;
  description: string;
  guides: LegacyGuideItem[];
};

export function getCategorizedLegacyGuides(): LegacyGuideCategory[] {
  const unmerged = resources
    .filter((r) => !isConsolidatedPath(`/resources/${r.slug}`))
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      description: r.description,
      path: `/resources/${r.slug}`,
    }));

  const categories: Record<string, LegacyGuideCategory> = {
    strategy: {
      id: "strategy",
      name: "Content Strategy & Production Workflow",
      description: "Cadence, batch filming, creator decision fatigue, and sustainable output frameworks.",
      guides: [],
    },
    reels: {
      id: "reels",
      name: "Reels, Hooks & Script Frameworks",
      description: "0–3s hook engineering, scene sequencing, spoken dialogue, and UGC creative briefs.",
      guides: [],
    },
    production: {
      id: "production",
      name: "Studio Setup, Filming & Lighting Plans",
      description: "Camera angles, natural and key lighting setups, iPhone 4K filming, and B-roll shot lists.",
      guides: [],
    },
    aesthetic: {
      id: "aesthetic",
      name: "Visual Direction & Aesthetic Signatures",
      description: "Color grading, faceless video direction, fashion styling, and visual identity anchors.",
      guides: [],
    },
    business: {
      id: "business",
      name: "Creator Business & Commercial Positioning",
      description: "UGC portfolio structure, creator pricing retainers, founder personal branding, and brand deal terms.",
      guides: [],
    },
  };

  for (const r of unmerged) {
    const text = `${r.title} ${r.description}`.toLowerCase();
    if (
      text.includes("lighting") ||
      text.includes("studio") ||
      text.includes("iphone") ||
      text.includes("b-roll") ||
      text.includes("shot list") ||
      text.includes("shoot plan")
    ) {
      categories.production.guides.push(r);
    } else if (
      text.includes("hook") ||
      text.includes("script") ||
      text.includes("reels") ||
      text.includes("ugc brief") ||
      text.includes("brief template")
    ) {
      categories.reels.guides.push(r);
    } else if (
      text.includes("business") ||
      text.includes("pricing") ||
      text.includes("portfolio") ||
      text.includes("retainer") ||
      text.includes("deal") ||
      text.includes("personal brand") ||
      text.includes("founder")
    ) {
      categories.business.guides.push(r);
    } else if (
      text.includes("visual signature") ||
      text.includes("faceless") ||
      text.includes("aesthetic") ||
      text.includes("format") ||
      text.includes("lookbook") ||
      text.includes("fashion") ||
      text.includes("beauty")
    ) {
      categories.aesthetic.guides.push(r);
    } else {
      categories.strategy.guides.push(r);
    }
  }

  return Object.values(categories);
}
