/**
 * lib/page-images.ts
 * ==================
 * Maps resource slugs to distinct, topic-tailored premium SEO package assets.
 */

import { seoPackageBySlug, versionedSeoPackageImage } from "@/lib/seo-package";

export interface PageImageSpec {
  url: string;
  alt: string;
  caption: string;
  badge: string;
}

export function getPageImageSpec(slug: string, title: string): PageImageSpec {
  const s = slug.toLowerCase();

  // Product-tier artwork
  if (s.includes("classic-red")) {
    return {
      url: "/assets/premium/studio/dossier-classic.webp",
      alt: "Anomaly Box Classic Red shoot brief",
      caption: "Classic Red creative direction delivered digitally in Creator Vault.",
      badge: "Classic Red Creative Brief",
    };
  }

  if (s.includes("signature-purple")) {
    return {
      url: "/assets/premium/studio/dossier-signature.webp",
      alt: "Anomaly Box Signature Purple shoot brief",
      caption: "Signature Purple visual direction delivered digitally in Creator Vault.",
      badge: "Signature Purple Creative Brief",
    };
  }

  if (s.includes("atelier") || s.includes("black")) {
    return {
      url: "/assets/premium/studio/dossier-atelier.webp",
      alt: "AnomalyBox Atelier direction for agencies",
      caption: "Bespoke campaign direction for agency and team workflows.",
      badge: "Atelier Agency Direction",
    };
  }

  const seoPage = seoPackageBySlug(slug);
  if (seoPage?.image) {
    return {
      url: versionedSeoPackageImage(seoPage.image),
      alt: seoPage.imageAlt || `${title} - Anomaly Box Editorial Field Note`,
      caption: `${title} - Shoot-ready creative direction field note.`,
      badge: seoPage.section ? seoPage.section.toUpperCase() : "FIELD NOTE",
    };
  }

  return {
    url: `/assets/legacy-resources/${slug}.svg`,
    alt: `${title} - Shoot-Ready Direction Card`,
    caption: `${title} - Visual shoot-ready framework & direction asset.`,
    badge: "Shoot-Ready Field Note",
  };
}
