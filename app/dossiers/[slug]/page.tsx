import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreativeDossierVisual } from "@/components/CreativeDossierVisual";
import { JsonLd } from "@/components/JsonLd";
import { PublicShell } from "@/components/PublicShell";
import { siteUrl } from "@/lib/env";

const dossiers = {
  "classic-red": { name: "Classic Red Dossier", price: 500, count: 2, variant: "red" as const, query: "viral_box_500", description: "Two private creator briefs calibrated to one lane and creator mode." },
  "signature-purple": { name: "Signature Purple Dossier", price: 1000, count: 5, variant: "purple" as const, query: "premium_viral_box_1000", description: "Five private creator briefs with deeper production and brand-lift direction." },
};

export function generateStaticParams() {
  return Object.keys(dossiers).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dossier = dossiers[slug as keyof typeof dossiers];
  return dossier ? { title: `${dossier.name} | Anomaly Box`, description: dossier.description, alternates: { canonical: `/dossiers/${slug}` } } : {};
}

export default async function DossierPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dossier = dossiers[slug as keyof typeof dossiers];
  if (!dossier) notFound();
  const url = `${siteUrl()}/dossiers/${slug}`;
  return (
    <PublicShell>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: dossier.name,
        description: dossier.description,
        brand: { "@type": "Brand", name: "Anomaly Box" },
        url,
        offers: { "@type": "Offer", priceCurrency: "USD", price: dossier.price, url: `${siteUrl()}/store?box=${dossier.query}`, availability: "https://schema.org/InStock" },
      }} />
      <div className="grid gap-10 py-12 lg:grid-cols-2 lg:items-center">
        <div className="rounded-2xl border border-ink/10 bg-white p-8"><CreativeDossierVisual variant={dossier.variant} itemCount={dossier.count} /></div>
        <article>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum-deep">Private creative dossier</p>
          <h1 className="mt-4 text-5xl font-semibold">{dossier.name}</h1>
          <p className="mt-5 text-xl leading-9 text-ink/65">{dossier.description}</p>
          <p className="mt-6 text-3xl font-semibold">${dossier.price.toLocaleString("en-US")}</p>
          <p className="mt-4 leading-7 text-ink/55">Configure the purchase for a specific creator lane and creator mode. Availability is verified before secure checkout.</p>
          <Link href={`/store?box=${dossier.query}`} className="focus-ring mt-7 inline-flex rounded-md bg-ink px-6 py-3 font-semibold text-white">Configure this dossier</Link>
        </article>
      </div>
    </PublicShell>
  );
}