import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PublicShell } from "@/components/PublicShell";
import { segmentBySlug, segments } from "@/lib/seo-content";
import { siteUrl } from "@/lib/env";

export function generateStaticParams() {
  return segments.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const segment = segmentBySlug(slug);
  if (!segment) return {};
  return {
    title: `${segment.name}: Practical, Shoot-Ready Formats | Anomaly Box`,
    description: `Practical ${segment.name.toLowerCase()} with hook, proof, shot, on-screen text, edit, and performance direction.`,
    alternates: { canonical: `/content-ideas/${slug}` },
  };
}

export default async function SegmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const segment = segmentBySlug(slug);
  if (!segment) notFound();
  const pageUrl = `${siteUrl()}/content-ideas/${segment.slug}`;
  return (
    <PublicShell>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: segment.name,
          description: `A practical guide for ${segment.audience}.`,
          mainEntityOfPage: pageUrl,
          author: { "@type": "Organization", name: "Anomaly Box" },
          publisher: { "@type": "Organization", name: "Anomaly Box", url: siteUrl() },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Content Ideas", item: `${siteUrl()}/content-ideas` },
            { "@type": "ListItem", position: 2, name: segment.name, item: pageUrl },
          ],
        },
      ]} />
      <article className="mx-auto max-w-4xl py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-ink/50"><Link href="/content-ideas">Content ideas</Link> / {segment.name}</nav>
        <h1 className="mt-5 text-5xl font-semibold leading-[1.02]">{segment.name}</h1>
        <p className="mt-6 text-xl leading-9 text-ink/65">Strong direction for {segment.audience} depends on {segment.proof}. The goal is not more ideas; it is fewer, better-defined ideas that survive contact with production.</p>
        <section className="mt-12">
          <h2 className="text-3xl font-semibold">Three formats to develop</h2>
          <div className="mt-5 grid gap-4">
            {segment.examples.map((example, index) => (
              <div key={example} className="rounded-xl border border-ink/10 bg-white p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-plum-deep">Format {index + 1}</div>
                <h3 className="mt-2 text-xl font-semibold">{example}</h3>
                <p className="mt-3 leading-7 text-ink/62">Define the viewer goal first. Then specify the visible action, one spoken line if needed, the proof shot, restrained on-screen text, and the edit beat that delivers the promise.</p>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-12 rounded-xl bg-ink p-8 text-white">
          <h2 className="text-3xl font-semibold">Turn the format into a shoot-ready brief</h2>
          <p className="mt-4 max-w-2xl leading-7 text-white/68">Anomaly Box matches private creative dossiers to your lane and creator mode, then structures each direction around goal, action, line, shot, text, edit, and performance.</p>
          <Link href="/store" className="focus-ring mt-6 inline-flex rounded-md bg-white px-5 py-3 font-semibold text-ink">Explore private dossiers</Link>
        </section>
      </article>
    </PublicShell>
  );
}