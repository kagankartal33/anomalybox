import type { Metadata } from "next";

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
  const cleaned = cleanSeoText(value).replace(/[.…]+$/g, "").trim();
  if (cleaned.length >= 110) return cleaned;
  return `${cleaned || fallback} Clear steps, examples, and production decisions for creators.`.slice(0, 158);
}

export function cleanAlt(value: string, title: string): string {
  const cleaned = cleanSeoText(value)
    .replace(/^AnomalyBox editorial featured image for\s*/i, "")
    .replace(/, showing creative direction dossier, smartphone and shoot-ready planning cards\.?$/i, "")
    .replace(/, showing (creative direction dossier|content system|UGC product brief|beauty products|reels storyboard)[^.]*\.?$/i, "");
  const result = `${cleaned || title} — creator workspace and shoot-ready planning visual.`;
  return result.length <= 125 ? result : `${title} — creator planning visual.`.slice(0, 125);
}

export function absoluteUrl(base: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `${base.replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
}

export function publicMetadata(base: string, input: PublicSeoInput): Metadata {
  const description = cleanDescription(input.description, input.title);
  const image = input.image ? absoluteUrl(base, input.image) : undefined;
  const title = `${cleanSeoText(input.title)} | Anomaly Box`;
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
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_URL;
  const sameAs = [
    instagram,
    "https://www.youtube.com/@anomalybox",
    "https://x.com/anomalybox",
    "https://github.com/anomalybox",
    "https://www.linkedin.com/company/anomalybox",
    "https://www.pinterest.com/anomalybox",
    "https://medium.com/@anomalybox",
  ].filter(Boolean) as string[];

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: "Anomaly Box",
    url: base,
    logo: absoluteUrl(base, "/brand/mark-anomaly.svg"),
    email: "support@anomalybox.com",
    sameAs,
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
  return cleanSeoText(value.replace(/[*_`\[\]]/g, "").replace(/\]\([^)]*\)/g, ""));
}

export function visibleFaq(markdown: string) {
  const section = markdown.match(/^##\s+Frequently asked questions\s*$([\s\S]*?)(?=^##\s+|$)/im)?.[1] ?? "";
  const matches = [...section.matchAll(/^###\s+(.+?)\s*$([\s\S]*?)(?=^###\s+|$)/gim)];
  return matches
    .map((match) => ({ question: plain(match[1]), answer: plain(match[2]) }))
    .filter((item) => item.question && item.answer)
    .slice(0, 8);
}

export function visibleHowToSteps(markdown: string) {
  const section = markdown.match(/^##\s+Step-by-step implementation\s*$([\s\S]*?)(?=^##\s+|$)/im)?.[1] ?? "";
  return [...section.matchAll(/^\s*\d+\.\s+(?:\*\*(.+?)\*\*[:—-]\s*)?(.+?)\s*$/gm)]
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
    author: { "@id": `${base}/#organization` },
    publisher: { "@id": `${base}/#organization` },
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