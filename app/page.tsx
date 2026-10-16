import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { preload } from "react-dom";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
} from "lucide-react";
import { PremiumIcon } from "@/components/PremiumIcon";
import { CreativeDossierVisual } from "@/components/CreativeDossierVisual";
import { SampleBriefModal } from "@/components/SampleBriefModal";
import { premiumAssets } from "@/lib/premium-assets";
import { popularGuides } from "@/lib/popular-guides";
import { JsonLd } from "@/components/JsonLd";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const bentoItems = [
  {
    title: "Delivered to your vault",
    copy: "After payment, the brief sits in Creator Vault. You open it when you are ready to shoot.",
    icon: LockKeyhole,
  },
  {
    title: "What you actually get",
    copy: "Opening options, scene order, camera notes, spoken lines, captions, edit notes, and what you should not claim.",
    icon: ClipboardCheck,
  },
  {
    title: "Matched at checkout",
    copy: "You pick one lane and one creator mode. That match is locked to the briefs you buy.",
    icon: BadgeCheck,
  },
  {
    title: "Report a weak card",
    copy: "If a brief is unclear or the wrong fit, you can flag it so it can be replaced.",
    icon: CheckCircle2,
  },
];

const howSteps = [
  {
    num: "01",
    title: "Configure",
    copy: "Choose a brief package, one lane, and one creator mode inside Store.",
    image: premiumAssets.marketing.howConfigure,
    imageAlt: "Step 1: selecting a creator lane and mode inside the Store",
  },
  {
    num: "02",
    title: "Receive",
    copy: "Your creative brief arrives securely in Creator Vault with the match locked to that purchase.",
    image: premiumAssets.marketing.howReceive,
    imageAlt: "Step 2: a sealed brief card appearing inside Creator Vault",
  },
  {
    num: "03",
    title: "Reveal",
    copy: "Open the brief when you are ready and walk the scenes in order.",
    image: premiumAssets.marketing.howReveal,
    imageAlt: "Step 3: the brief card opening to reveal scenes and spoken lines",
  },
  {
    num: "04",
    title: "Shoot",
    copy: "Shoot the scenes, follow the edit notes, then post.",
    image: premiumAssets.marketing.howShoot,
    imageAlt: "Step 4: a creator filming with shoot-mode teleprompter visible",
  },
] as const;

export default function AnomalyBoxLanding() {
  const guides = popularGuides();
  // The hero <picture> is the LCP element. Announce the matching source in <head> so the browser does
  // not wait for body parsing to discover it.
  preload(premiumAssets.marketing.heroMobile, { as: "image", fetchPriority: "high", media: "(max-width: 767px)" });
  preload(premiumAssets.marketing.heroDesktop, { as: "image", fetchPriority: "high", media: "(min-width: 768px)" });
  return (
    <main className="min-h-screen bg-[#F7F4ED] text-ink">
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is Anomaly Box?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Anomaly Box sells private Instagram shoot briefs. Each brief covers the opening, scene order, camera, spoken lines, captions, edit notes, and claim limits for one lane.",
              },
            },
            {
              "@type": "Question",
              name: "How does a creative brief improve content production?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "A creative brief settles the hook, scene order, framing, script, caption, edit direction, and claim boundaries before filming, reducing avoidable decisions during production.",
              },
            },
            {
              "@type": "Question",
              name: "What is included in an Anomaly Box creator brief?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Each brief contains hook and opening options, scene flow, camera and framing direction, a spoken or on-screen text system, caption and comment prompts, edit direction, and sponsor-safe claim boundaries.",
              },
            },
          ],
        },
      ]} />
      <SiteHeader isLanding={true} />

      <section className="mx-auto max-w-7xl px-4 pb-14 pt-5 sm:px-6 sm:pt-8">
        <div className="relative min-h-[700px] overflow-hidden rounded-2xl border border-white/10 bg-[#171619] shadow-[0_45px_100px_-65px_rgba(24,17,27,0.9)] md:min-h-[660px]">
          <div className="absolute inset-0">
            <picture>
              <source media="(max-width: 767px)" srcSet={premiumAssets.marketing.heroMobile} />
              <source media="(min-width: 768px)" srcSet={premiumAssets.marketing.heroDesktop} />
              <img
                src={premiumAssets.marketing.heroDesktop}
                alt="Anomaly Box shoot brief in a creator studio"
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-cover object-center"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/45" />
          </div>

          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center sm:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#E8EDF7] backdrop-blur-md">
              Private Creator Briefs
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl md:text-7xl">
              From concept to shoot in one practical brief.
            </h1>
            {/* L-4: compact trust signal — factual, no fake metrics */}
            <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/55">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-white/40" aria-hidden="true" /> Hook &amp; scene order</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-white/40" aria-hidden="true" /> Camera &amp; spoken lines</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-white/40" aria-hidden="true" /> Edit &amp; claim notes</span>
            </div>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-xl">
              Private shoot briefs with openings, scene order, camera notes, scripts, edit notes, and claim limits for one lane and one creator mode.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/store"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-ink transition hover:bg-[#E8EDF7] focus-ring shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Explore Briefs <ArrowRight className="h-4 w-4" />
              </Link>
              <SampleBriefModal
                triggerVariant="outline"
                triggerLabel="Inspect Sample Brief"
                triggerClassName="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-4 text-base font-bold text-white backdrop-blur-md transition hover:bg-white/20 focus-ring hover:-translate-y-0.5"
              />
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-md transition hover:bg-white/20 focus-ring"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-[#EEEAE1] py-12">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 md:grid-cols-4">
          {bentoItems.map((item, index) => (
            <article key={item.title} className={`rounded-md border border-ink/10 bg-white p-6 shadow-sm ${index === 1 ? "md:col-span-2" : ""}`}>
              <PremiumIcon icon={item.icon} size="sm" tone={index === 1 ? "purple" : index === 3 ? "teal" : "ink"} />
              <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/62">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/70">The objects</p>
            <h2 className="mt-2 text-3xl font-semibold">Three levels of creative direction</h2>
          </div>
          <SampleBriefModal triggerVariant="badge" triggerLabel="Preview Sample Brief Specimen" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="group rounded-xl border border-ink/10 bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B42335]">Classic Red</p>
            <CreativeDossierVisual variant="red" itemCount={2} className="mt-3" />
          </div>
          <div className="group rounded-xl border border-plum/20 bg-[#F4EFF4] p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-plum-deep">Signature Purple</p>
            <CreativeDossierVisual variant="purple" available itemCount={5} className="mt-3" />
          </div>
          <div className="group rounded-xl border border-ink/10 bg-[#101011] p-5 text-white shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">Atelier Black</p>
            <CreativeDossierVisual variant="black" itemCount={7} className="mt-3" />
          </div>
        </div>
      </section>

      <section id="how" className="content-visibility-auto mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/70">How It Works</p>
            <h2 className="mt-3 text-4xl font-semibold">A simple path from purchase to a brief you can take to set.</h2>
            <p className="mt-4 text-lg leading-8 text-ink/64">
              This is not an endless idea generator. You buy a small set of briefs and take them to set.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {howSteps.map((step) => (
              <article key={step.num} className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
                <div className="relative aspect-[4/3] w-full bg-paper">
                  <Image
                    src={step.image}
                    alt={step.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 30vw"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <div className="font-mono text-sm font-semibold text-ink/70">{step.num}</div>
                  <h3 className="mt-2 text-2xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/62">{step.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="popular-guides-heading" className="content-visibility-auto mx-auto max-w-7xl px-6 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Free creator guides</p>
            <h2 id="popular-guides-heading" className="mt-3 text-4xl font-semibold">Plan your next shoot with these guides</h2>
          </div>
          <Link href="/resources" className="inline-flex items-center gap-2 font-semibold text-plum-deep focus-ring">
            Browse all guides <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {guides.map((guide) => (
            <li key={guide.href}>
              <Link
                href={guide.href}
                className="focus-ring block h-full rounded-xl border border-ink/10 bg-white p-5 transition hover:border-plum-deep/40 hover:shadow-md"
              >
                <span className="font-semibold leading-snug text-ink">{guide.title}</span>
                <span className="mt-2 block text-sm leading-6 text-ink/70">{guide.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="content-visibility-auto bg-[#080808] py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">Private custom service</p>
            <h2 className="mt-3 text-5xl font-semibold">ATELIER BLACK BOX</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/66">
              Custom briefs for a launch, rebrand, or sponsor set when a standard package is not enough.
            </p>
            <Link
              href="/atelier#atelier-request"
              className="mt-7 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-ink hover:bg-[#E8EDF7] focus-ring"
            >
              Request Atelier direction <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative aspect-[3/2] overflow-hidden rounded-xl border border-white/10">
            <Image
              src={premiumAssets.marketing.atelier}
              alt="Creative director reviewing an Atelier campaign brief in a cinematic studio"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
