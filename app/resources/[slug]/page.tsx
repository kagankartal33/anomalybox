import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PublicShell } from "@/components/PublicShell";
import { resourceBySlug, resources } from "@/lib/seo-content";
import { siteUrl } from "@/lib/env";

export function generateStaticParams() {
  return resources.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const resource = resourceBySlug(slug);
  return resource ? { title: `${resource.title} | Anomaly Box`, description: resource.description, alternates: { canonical: `/resources/${slug}` } } : {};
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = resourceBySlug(slug);
  if (!resource) notFound();
  const url = `${siteUrl()}/resources/${slug}`;
  return (
    <PublicShell>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: resource.title,
        description: resource.description,
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: "Anomaly Box" },
        publisher: { "@type": "Organization", name: "Anomaly Box", url: siteUrl() },
      }} />
      <article className="mx-auto max-w-3xl py-10">
        <nav className="text-sm text-ink/50" aria-label="Breadcrumb"><Link href="/resources">Resources</Link> / Field note</nav>
        <h1 className="mt-5 text-5xl font-semibold leading-[1.02]">{resource.title}</h1>
        <p className="mt-6 text-xl leading-9 text-ink/65">{resource.description}</p>
        <div className="mt-12 space-y-10">
          {resource.sections.map((section, index) => (
            <section key={section}>
              <div className="text-xs font-semibold uppercase tracking-[0.15em] text-plum-deep">0{index + 1}</div>
              <h2 className="mt-2 text-3xl font-semibold">{section}</h2>
              <p className="mt-4 leading-8 text-ink/65">Make this decision explicit before production. Write the intended viewer outcome, the evidence that can be shown honestly, and the minimum sequence required to make the idea clear. Keep every shot and line accountable to that purpose.</p>
            </section>
          ))}
        </div>
        <aside className="mt-14 rounded-xl border border-plum/20 bg-plum-soft/60 p-7">
          <h2 className="text-2xl font-semibold">Need the complete direction?</h2>
          <p className="mt-3 leading-7 text-ink/62">A private Anomaly Box dossier turns the method into execution-ready creator briefs matched to a specific lane and creator mode.</p>
          <Link href="/store" className="focus-ring mt-5 inline-flex rounded-md bg-ink px-5 py-3 font-semibold text-white">Configure a dossier</Link>
        </aside>
      </article>
    </PublicShell>
  );
}