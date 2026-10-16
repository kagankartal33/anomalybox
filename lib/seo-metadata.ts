import type { Metadata } from "next";
import { BRAND_SAME_AS } from "@/lib/brand-profiles";

export type PublicSeoInput = {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  imageAlt?: string;
  keywords?: string[];
  published?: string;
  modified?: string;
  schemaType?: "Article" | "Service";
};

export function cleanSeoText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanDescription(value: string, fallback: string): string {
  const cleaned = cleanSeoText(value).replace(/[.\u2026]+$/g, "").trim();
  let description = cleaned || `${cleanSeoText(fallback)} with practical planning and production guidance for creators`;
  if (description.length < 80) {
    const supplement = " Practical Instagram shoot briefs and creative direction from Anomaly Box.";
    if (description.length + supplement.length <= 160) {
      description = `${description.replace(/[.\s]+$/g, "")}.${supplement}`;
    }
  }
  if (description.length <= 160) return `${description.replace(/[.\s]+$/g, "")}.`;
  const shortened = description.slice(0, 158);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > 100 ? boundary : 157).replace(/[\s,;:]+$/g, "")}.`;
}

export function cleanAlt(value: string, title: string): string {
  const cleaned = cleanSeoText(value)
    .replace(/^AnomalyBox editorial featured image for\s*/i, "")
    .replace(/, showing creative direction dossier, smartphone and shoot-ready planning cards\.?$/i, "")
    .replace(/, showing (creative direction dossier|content system|UGC product brief|beauty products|reels storyboard)[^.]*\.?$/i, "");
  const result = `${cleaned || title} \u2014 creator workspace and shoot-ready planning visual.`;
  return result.length <= 125 ? result : `${title} \u2014 creator planning visual.`.slice(0, 125);
}

const BRAND_SUFFIX = " | Anomaly Box";
// Google truncates titles beyond roughly 600px (~60 characters); keep the brand suffix only when it fits.
const MAX_TITLE_LENGTH = 60;

export function brandedTitle(value: string): string {
  const title = cleanSeoText(value);
  return title.length + BRAND_SUFFIX.length <= MAX_TITLE_LENGTH ? `${title}${BRAND_SUFFIX}` : title;
}

export function absoluteUrl(base: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `${base.replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
}

export function publicMetadata(base: string, input: PublicSeoInput): Metadata {
  const description = cleanDescription(input.description, input.title);
  const image = input.image ? absoluteUrl(base, input.image) : undefined;
  const title = brandedTitle(input.title);
  return {
    title,
    description,
    keywords: input.keywords?.filter(Boolean),
    alternates: { canonical: input.canonicalPath },
    openGraph: {
      title,
      description,
      type: input.schemaType === "Service" ? "website" : "article",
      url: absoluteUrl(base, input.canonicalPath),
      publishedTime: input.published,
      modifiedTime: input.modified,
      images: image
        ? [{ url: image, width: 1600, height: 900, alt: cleanAlt(input.imageAlt ?? input.title, input.title) }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

export function organizationJsonLd(base: string) {
  const verifiedProfiles = BRAND_SAME_AS;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: "Anomaly Box",
    url: base,
    logo: absoluteUrl(base, "/brand/mark-anomaly.svg"),
    email: "support@anomalybox.com",
    ...(verifiedProfiles.length ? { sameAs: verifiedProfiles } : {}),
  };
}

export function websiteJsonLd(base: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    name: "Anomaly Box",
    url: base,
    description: "Private creative direction and execution-ready dossiers for Instagram creators.",
    publisher: { "@id": `${base}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/content-ideas?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(base: string, items: Array<{ name: string; path?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(base, item.path) } : {}),
    })),
  };
}

function plain(value: string): string {
  return cleanSeoText(value.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, ""));
}

function sectionBody(markdown: string, heading: string): string {
  const headingMatch = new RegExp(`^##\\s+${heading}\\s*$`, "im").exec(markdown);
  if (!headingMatch || headingMatch.index === undefined) return "";
  const start = headingMatch.index + headingMatch[0].length;
  const rest = markdown.slice(start);
  const nextHeading = /^##\s+/im.exec(rest);
  return rest.slice(0, nextHeading?.index ?? rest.length);
}

export function visibleFaq(markdown: string) {
  const section = sectionBody(markdown, "Frequently asked questions");
  const lines = section.split(/\r?\n/);
  const entries: Array<{ question: string; answer: string }> = [];
  for (let index = 0; index < lines.length; index += 1) {
    const heading = /^###\s+(.+?)\s*$/.exec(lines[index]);
    if (!heading) continue;
    const answer: string[] = [];
    for (let next = index + 1; next < lines.length && !/^###\s+/.test(lines[next]); next += 1) {
      if (lines[next].trim()) answer.push(lines[next]);
      index = next;
    }
    entries.push({ question: plain(heading[1]), answer: plain(answer.join(" ")) });
  }
  return entries
    .filter((item) => item.question && item.answer)
    .slice(0, 8);
}

export function visibleHowToSteps(markdown: string) {
  const section = sectionBody(markdown, "Step-by-step implementation");
  return [...section.matchAll(/^\s*\d+\.\s+(?:\*\*(.+?)\*\*[:\u2014\u2013-]\s*)?(.+?)\s*$/gm)]
    .map((match) => ({ name: plain(match[1] || "Step"), text: plain(match[2] || match[1]) }))
    .filter((item) => item.text)
    .slice(0, 12);
}

export function articleJsonLd(base: string, input: PublicSeoInput & { markdown?: string }) {
  const url = absoluteUrl(base, input.canonicalPath);
  const image = input.image ? absoluteUrl(base, input.image) : undefined;
  const faq = input.markdown ? visibleFaq(input.markdown) : [];
  const steps = input.markdown ? visibleHowToSteps(input.markdown) : [];
  const article = {
    "@context": "https://schema.org",
    "@type": input.schemaType === "Service" ? "Service" : "Article",
    headline: cleanSeoText(input.title),
    description: cleanDescription(input.description, input.title),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(image ? { image: [image] } : {}),
    ...(input.published ? { datePublished: input.published } : {}),
    ...(input.modified ? { dateModified: input.modified } : {}),
    inLanguage: "en",
    author: { "@type": "Organization", "@id": `${base}/#organization`, name: "Anomaly Box", url: base },
    publisher: {
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: "Anomaly Box",
      url: base,
      logo: { "@type": "ImageObject", url: absoluteUrl(base, "/brand/mark-anomaly.svg") },
    },
  };
  const graph: Record<string, unknown>[] = [article];
  if (faq.length) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }
  if (steps.length >= 2) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: cleanSeoText(input.title),
      description: cleanDescription(input.description, input.title),
      step: steps.map((step, index) => ({ "@type": "HowToStep", position: index + 1, name: step.name, text: step.text })),
    });
  }
  return graph;
}
