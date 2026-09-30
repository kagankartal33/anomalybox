import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { PublicShell } from "@/components/PublicShell";
import { segments } from "@/lib/seo-content";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Creator Content Ideas That Are Ready to Shoot | Anomaly Box",
  description: "Explore practical creator content ideas by platform and niche, with hooks, visual proof, shoot logic, and edit direction.",
  alternates: { canonical: "/content-ideas" },
};

export default function ContentIdeasPage() {
  const url = `${siteUrl()}/content-ideas`;
  return (
    <PublicShell>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Creator content idea guides",
        url,
        itemListElement: segments.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${url}/${item.slug}`,
          name: item.name,
        })),
      }} />
      <section className="max-w-4xl py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum-deep">Creator content ideas</p>
        <h1 className="mt-4 text-5xl font-semibold leading-[0.98] sm:text-6xl">Ideas become useful when a creator can actually shoot them.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-ink/65">These guides organize creator content ideas around viewer value, visual proof, practical production, and truthful performance language. Use them to shape a brief—not to copy a generic trend.</p>
      </section>
      <section aria-labelledby="idea-guides" className="py-8">
        <h2 id="idea-guides" className="text-3xl font-semibold">Choose a platform, niche, or production mode</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((segment) => (
            <article key={segment.slug} className="flex min-h-56 flex-col rounded-xl border border-ink/10 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">{segment.name}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-ink/60">Direction for {segment.audience}, built around {segment.proof}.</p>
              <Link className="focus-ring mt-5 inline-flex items-center gap-2 self-start rounded-sm font-semibold text-plum-deep" href={`/content-ideas/${segment.slug}`}>
                Open guide <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}