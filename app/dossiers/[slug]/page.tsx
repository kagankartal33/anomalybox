import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreativeDossierVisual } from "@/components/CreativeDossierVisual";
import { JsonLd } from "@/components/JsonLd";
import { PublicShell } from "@/components/PublicShell";
import { siteUrl } from "@/lib/env";
import { breadcrumbJsonLd, publicMetadata } from "@/lib/seo-metadata";

const dossiers = {
  "classic-red": { name: "Classic Red Creative Brief", price: 50, count: 2, variant: "red" as const, query: "viral_box_500", description: "Two private Instagram shoot briefs with scene flow, spoken lines, and camera notes for one lane. Ready to film this week." },
  "signature-purple": { name: "Signature Purple Creative Brief", price: 100, count: 5, variant: "purple" as const, query: "premium_viral_box_1000", description: "Five private Instagram shoot briefs with deep proof structure, scene pacing, and spoken script systems for creators." },
};

function dossierImage(variant: "red" | "purple") {
  return variant === "red" ? "/assets/premium/studio/dossier-classic.webp" : "/assets/premium/studio/dossier-signature.webp";
}

export function generateStaticParams() {
  return Object.keys(dossiers).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dossier = dossiers[slug as keyof typeof dossiers];
  return dossier
    ? publicMetadata(siteUrl(), {
        title: dossier.name,
        description: dossier.description,
        canonicalPath: `/dossiers/${slug}`,
        image: dossierImage(dossier.variant),
        imageAlt: `${dossier.name} delivered digitally to Creator Vault`,
        keywords: [dossier.name, "private creator briefs", "creative direction"],
        schemaType: "Service",
      })
    : {};
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
        image: [`${siteUrl()}${dossierImage(dossier.variant)}`],
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: dossier.price,
          availability: "https://schema.org/InStock",
          url: `${siteUrl()}/store?box=${dossier.query}`,
          seller: { "@type": "Organization", name: "Anomaly Box", url: siteUrl() },
        },
      }} />
      <JsonLd data={breadcrumbJsonLd(siteUrl(), [
        { name: "Home", path: "/" },
        { name: "Creative briefs", path: "/pricing" },
        { name: dossier.name, path: `/dossiers/${slug}` },
      ])} />
      <div className="grid gap-10 py-12 lg:grid-cols-2 lg:items-center">
        <div className="rounded-2xl border border-ink/10 bg-white p-8"><CreativeDossierVisual variant={dossier.variant} itemCount={dossier.count} /></div>
        <article>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum-deep">Campaign-ready creative brief</p>
          <h1 className="mt-4 text-5xl font-semibold">{dossier.name}</h1>
          <p className="mt-5 text-xl leading-9 text-ink/65">{dossier.description}</p>
          <p className="mt-6 text-3xl font-semibold">${dossier.price.toLocaleString("en-US")}</p>
          <p className="mt-4 leading-7 text-ink/55">Configure the purchase for a specific creator lane and creator mode. Availability is verified before secure checkout.</p>
          <Link href={`/store?box=${dossier.query}`} className="focus-ring mt-7 inline-flex rounded-md bg-ink px-6 py-3 font-semibold text-white">Configure this creative brief</Link>
        </article>
      </div>
    </PublicShell>
  );
}
