import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreativeDossierVisual } from "@/components/CreativeDossierVisual";
import { JsonLd } from "@/components/JsonLd";
import { PublicShell } from "@/components/PublicShell";
import { siteUrl } from "@/lib/env";
import { breadcrumbJsonLd, publicMetadata } from "@/lib/seo-metadata";
import {
  BOX_FEATURES,
  BOX_PRICING,
  BRIEF_INCLUDES,
  boxPriceAmount,
  boxPriceLabel,
  type PricedBoxSlug,
} from "@/lib/pricing";

type DossierSlug = "classic-red" | "signature-purple";

type Dossier = {
  name: string;
  count: number;
  variant: "red" | "purple";
  query: PricedBoxSlug;
  description: string;
  bestFor: string[];
  otherSlug: DossierSlug;
};

const dossiers = {
  "classic-red": {
    name: "Classic Red Creative Brief",
    count: BOX_PRICING.viral_box_500.briefCount,
    variant: "red",
    query: "viral_box_500",
    description:
      "Two private Instagram shoot briefs with scene flow, spoken lines, and camera notes for one lane. Ready to film this week.",
    bestFor: [
      "You want to film this week and need two finished plans, not a list of loose ideas.",
      "You are trying a new lane or creator mode and want to test it before committing to a larger batch.",
      "You already shoot regularly and only need direction for the next one or two posts.",
    ],
    otherSlug: "signature-purple",
  },
  "signature-purple": {
    name: "Signature Purple Creative Brief",
    count: BOX_PRICING.premium_viral_box_1000.briefCount,
    variant: "purple",
    query: "premium_viral_box_1000",
    description:
      "Five private Instagram shoot briefs with deep proof structure, scene pacing, and spoken script systems for creators.",
    bestFor: [
      "You batch-film and want several briefs for the same lane ready before shoot day.",
      "You want longer scene and proof notes, plus atmosphere and edit direction for each brief.",
      "You want more angles on one lane so a week of posts does not repeat itself.",
    ],
    otherSlug: "classic-red",
  },
} satisfies Record<DossierSlug, Dossier>;

const howItWorks = [
  { title: "Configure", copy: "In the Store, choose the package, one creator lane, and one creator mode." },
  { title: "Check out", copy: "Availability for that exact match is checked before secure Stripe checkout opens." },
  { title: "Receive", copy: "After payment the briefs are delivered to your Creator Vault, locked to the match you chose." },
  { title: "Shoot", copy: "Open a brief when you are ready, walk the scenes in order, follow the edit notes, then post." },
];

function dossierImage(variant: Dossier["variant"]) {
  return variant === "red" ? "/assets/premium/studio/dossier-classic.webp" : "/assets/premium/studio/dossier-signature.webp";
}

function faqFor(dossier: Dossier) {
  const price = boxPriceLabel(dossier.query);
  const other = dossiers[dossier.otherSlug];
  return [
    {
      question: `What do I get with the ${dossier.name}?`,
      answer: `${dossier.count} private shoot briefs for ${price}, written for the one creator lane and one creator mode you choose at checkout. Each brief covers the opening, the scene order, camera and framing notes, spoken lines and on-screen text, caption and comment prompts, edit direction, and what you should not claim on camera.`,
    },
    {
      question: `How is it different from the ${other.name}?`,
      answer: `${dossier.name} includes ${dossier.count} briefs for ${price}. ${other.name} includes ${other.count} briefs for ${boxPriceLabel(other.query)}. Both use the same brief format; Signature Purple adds longer scene and proof notes, atmosphere and edit direction, and more angles inside the same lane.`,
    },
    {
      question: "Is filming included?",
      answer: "No. You receive written shoot briefs and film them yourself. Each brief is written so you know what to shoot, in what order, and what to say before you start.",
    },
    {
      question: "When do the briefs arrive?",
      answer: "After payment they are delivered to your Creator Vault, where you can open them whenever you are ready to shoot.",
    },
    {
      question: "What if a brief is unclear or does not fit my lane?",
      answer: "Open the brief in Creator Vault and report it with a short note. The team reviews the report and can replace a brief that is unclear or the wrong fit.",
    },
    {
      question: "Can I get a refund?",
      answer: "Briefs are digital goods and count as fulfilled once they are delivered to Creator Vault, so there are no refunds after delivery. If a technical issue stops you from opening a purchase, contact support@anomalybox.com within 7 days.",
    },
  ];
}

export function generateStaticParams() {
  return Object.keys(dossiers).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dossier: Dossier | undefined = dossiers[slug as DossierSlug];
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
  const dossier: Dossier | undefined = dossiers[slug as DossierSlug];
  if (!dossier) notFound();
  const base = siteUrl();
  const url = `${base}/dossiers/${slug}`;
  const other = dossiers[dossier.otherSlug];
  const faq = faqFor(dossier);
  const storeHref = `/store?box=${dossier.query}`;

  return (
    <PublicShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: dossier.name,
          description: dossier.description,
          brand: { "@type": "Brand", name: "Anomaly Box" },
          url,
          image: [`${base}${dossierImage(dossier.variant)}`],
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: boxPriceAmount(dossier.query),
            availability: "https://schema.org/InStock",
            url: `${base}${storeHref}`,
            seller: { "@type": "Organization", name: "Anomaly Box", url: base },
          },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd(base, [
          { name: "Home", path: "/" },
          { name: "Creative briefs", path: "/pricing" },
          { name: dossier.name, path: `/dossiers/${slug}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />

      <div className="grid gap-10 py-12 lg:grid-cols-2 lg:items-center">
        <div className="rounded-2xl border border-ink/10 bg-white p-8">
          <CreativeDossierVisual variant={dossier.variant} itemCount={dossier.count} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum-deep">Campaign-ready creative brief</p>
          <h1 className="mt-4 text-5xl font-semibold">{dossier.name}</h1>
          <p className="mt-5 text-xl leading-9 text-ink/70">{dossier.description}</p>
          <p className="mt-6 text-3xl font-semibold">{boxPriceLabel(dossier.query)}</p>
          <p className="mt-4 leading-7 text-ink/70">
            Configure the purchase for a specific creator lane and creator mode. Availability is verified before secure checkout.
          </p>
          <Link href={storeHref} className="focus-ring mt-7 inline-flex rounded-md bg-ink px-6 py-3 font-semibold text-white">
            Configure this creative brief
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-14 pb-16">
        <section aria-labelledby="package-heading">
          <h2 id="package-heading" className="text-3xl font-semibold">What is in the {dossier.name}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {BOX_FEATURES[dossier.query].map((feature) => (
              <li key={feature} className="rounded-xl border border-ink/10 bg-white p-4 font-medium">
                {feature}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="brief-heading">
          <h2 id="brief-heading" className="text-3xl font-semibold">What every brief covers</h2>
          <p className="mt-4 leading-8 text-ink/70">
            Each brief is written for the lane and creator mode locked to your purchase, so the decisions are made before shoot day
            instead of on set.
          </p>
          <ol className="mt-5 list-decimal space-y-2 pl-6 leading-7 text-ink/80">
            {BRIEF_INCLUDES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="fit-heading">
          <h2 id="fit-heading" className="text-3xl font-semibold">Who it is for</h2>
          <ul className="mt-5 list-disc space-y-2 pl-6 leading-7 text-ink/80">
            {dossier.bestFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-5 leading-7 text-ink/70">
            Need {dossier.variant === "red" ? "more briefs or more angles on one lane" : "a smaller set to start"}? Compare it with the{" "}
            <Link href={`/dossiers/${dossier.otherSlug}`} className="font-semibold text-plum-deep underline-offset-4 hover:underline">
              {other.name}
            </Link>{" "}
            ({other.count} briefs, {boxPriceLabel(other.query)}). For a launch, rebrand, or sponsor job, the{" "}
            <Link href="/atelier" className="font-semibold text-plum-deep underline-offset-4 hover:underline">
              Atelier custom brief
            </Link>{" "}
            is quoted after a short intake.
          </p>
        </section>

        <section aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-3xl font-semibold">How it works</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2">
            {howItWorks.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-ink/10 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-plum-deep">
                  {String(index + 1).padStart(2, "0")} · {step.title}
                </p>
                <p className="mt-2 leading-7 text-ink/75">{step.copy}</p>
              </li>
            ))}
          </ol>
          <p className="mt-5 leading-7 text-ink/70">
            See every package side by side on the{" "}
            <Link href="/pricing" className="font-semibold text-plum-deep underline-offset-4 hover:underline">
              pricing page
            </Link>
            , or read how briefs are built in the{" "}
            <Link href="/methodology" className="font-semibold text-plum-deep underline-offset-4 hover:underline">
              methodology
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-3xl font-semibold">Questions about the {dossier.name}</h2>
          <div className="mt-5 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white">
            {faq.map((item) => (
              <details key={item.question} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold">{item.question}</summary>
                <p className="mt-3 leading-7 text-ink/75">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="rounded-2xl bg-ink p-8 text-white">
          <h2 className="text-2xl font-semibold">Ready to plan your next shoot?</h2>
          <p className="mt-3 leading-7 text-white/80">
            {dossier.count} briefs for {boxPriceLabel(dossier.query)}, matched to one lane and one creator mode and delivered to Creator Vault.
          </p>
          <Link href={storeHref} className="focus-ring mt-6 inline-flex rounded-md bg-white px-6 py-3 font-semibold text-ink">
            Configure the {dossier.name}
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
