import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PublicShell } from "@/components/PublicShell";
import { SeoPackageArticle } from "@/components/SeoPackageArticle";
import { segmentBySlug, segments } from "@/lib/seo-content";
import { seoPackageByPath, seoPackageBySection } from "@/lib/seo-package";
import { getSeoPackageMarkdown } from "@/lib/seo-package-markdown";
import { siteUrl } from "@/lib/env";
import { premiumAssets } from "@/lib/premium-assets";
import { packageGenerateMetadata } from "@/lib/seo-package-page";
import { brandedTitle } from "@/lib/seo-metadata";

const packageMeta = packageGenerateMetadata("content-ideas");

export function generateStaticParams() {
  const packageSlugs = seoPackageBySection("content-ideas").map((p) => p.slug);
  const segmentSlugs = segments.map((s) => s.slug);
  return [...new Set([...packageSlugs, ...segmentSlugs])].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pkg = seoPackageByPath("content-ideas", slug);
  if (pkg) return packageMeta({ params });

  const segment = segmentBySlug(slug);
  if (!segment) return {};

  const canonicalUrl = `${siteUrl()}/content-ideas/${slug}`;
  const title = brandedTitle(`${segment.name}: Practical, Shoot-Ready Formats`);
  const ogImageUrl = `${siteUrl()}${premiumAssets.og.default}`;

  return {
    title,
    description: `Practical ${segment.name.toLowerCase()} with hook, proof, shot, on-screen text, edit, and performance direction.`,
    keywords: [segment.name, `${segment.name} Reels`, "Shoot-Ready Briefs", "Campaign Creative Direction"],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description: `Practical ${segment.name.toLowerCase()} with hook, proof, shot, on-screen text, edit, and performance direction.`,
      type: "article",
      url: canonicalUrl,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${segment.name} Shoot-Ready Direction` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${segment.name} | Anomaly Box`,
      description: `Practical ${segment.name.toLowerCase()} with hook, proof, shot, and edit direction.`,
      images: [ogImageUrl],
    },
  };
}

export default async function ContentIdeasSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const pkg = seoPackageByPath("content-ideas", slug);
  if (pkg) {
    const markdown = getSeoPackageMarkdown(slug);
    if (!markdown) notFound();
    return <SeoPackageArticle page={pkg} markdown={markdown} />;
  }

  const segment = segmentBySlug(slug);
  if (!segment) notFound();

  const pageUrl = `${siteUrl()}/content-ideas/${segment.slug}`;
  const heroImage = premiumAssets.cardGuides.videoFlow;

  return (
    <PublicShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: segment.name,
            description: `A practical guide for ${segment.audience}.`,
            mainEntityOfPage: pageUrl,
            image: `${siteUrl()}${heroImage}`,
            datePublished: "2026-08-05T00:00:00Z",
            dateModified: "2026-08-05T00:00:00Z",
            author: { "@type": "Organization", name: "Anomaly Box" },
            publisher: {
              "@type": "Organization",
              name: "Anomaly Box",
              url: siteUrl(),
              logo: { "@type": "ImageObject", url: `${siteUrl()}/brand/mark-anomaly.svg` },
            },
          },
        ]}
      />
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <nav className="text-sm font-medium text-ink/50">
          <Link href="/content-ideas" className="hover:text-plum-deep">
            Content Ideas
          </Link>
        </nav>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{segment.name}</h1>
        <p className="mt-6 text-xl text-ink/70">
          Practical formats for {segment.audience}: {segment.proof}.
        </p>
        <figure className="my-10 overflow-hidden rounded-2xl border border-ink/10 p-2">
          <Image src={heroImage} alt={segment.name} width={1200} height={675} className="w-full rounded-xl object-cover" />
        </figure>
        <ul className="mt-8 list-disc space-y-3 pl-6 text-ink/75">
          {segment.examples.map((ex) => (
            <li key={ex}>{ex}</li>
          ))}
        </ul>
        <div className="mt-10">
          <Link href="/resources" className="font-semibold text-plum-deep">
            Browse creator guides →
          </Link>
        </div>
      </article>
    </PublicShell>
  );
}
