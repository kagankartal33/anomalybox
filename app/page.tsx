import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Gem,
  LockKeyhole,
  PackageCheck,
  Sparkles,
  Video,
} from "lucide-react";
import { PremiumIcon } from "@/components/PremiumIcon";
import { JsonLd } from "@/components/JsonLd";
import { ProductBoxVisual } from "@/components/ProductBoxVisual";
import { siteUrl } from "@/lib/env";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo-metadata";

const bentoItems = [
  {
    title: "Secured creative dossiers",
    copy: "Each purchase arrives as a private creative project in your Creator Vault.",
    icon: LockKeyhole,
  },
  {
    title: "Execution-ready cards",
    copy: "Scene flow, shot list, caption direction, brand lift, and safety boundaries in one private card.",
    icon: ClipboardCheck,
  },
  {
    title: "Purchase-time matching",
    copy: "Choose the exact lane and creator mode for the dossier you are commissioning.",
    icon: BadgeCheck,
  },
  {
    title: "Human review loop",
    copy: "Upload your draft and receive checklist feedback from the admin dashboard.",
    icon: Video,
  },
];

export default function AnomalyBoxLanding() {
  return (
    <main className="min-h-screen bg-[#F7F4ED] text-ink">
      <JsonLd data={[organizationJsonLd(siteUrl()), websiteJsonLd(siteUrl())]} />
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-[#FBF9F5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold focus-ring">
            <PremiumIcon icon={Gem} size="sm" tone="ink" />
            ViralBox
          </Link>
          <nav aria-label="Public navigation" className="flex flex-wrap items-center gap-1 text-sm">
            <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/store">Store</Link>
            <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/content-ideas">Content Ideas</Link>
            <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/resources">Resources</Link>
            <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/pricing">Pricing</Link>
            <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="#how">How It Works</Link>
            <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/atelier">Atelier</Link>
            <Link className="rounded-md bg-ink px-4 py-2 font-semibold text-white hover:bg-black focus-ring" href="/login">Login</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/50 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#B42335]" />
            Premium Anomaly Box for Instagram creators
          </div>
          <h1 className="mt-6 max-w-4xl text-6xl font-semibold leading-[0.94] md:text-7xl">
            Private creator briefs built to be shot, not brainstormed.
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-9 text-ink/68">
            Choose a private dossier, match it to a creator lane and mode, then receive structured briefs with hooks, scenes, shots, captions, and brand-safe execution guidance.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/store"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-7 py-3.5 text-base font-semibold text-white hover:bg-black focus-ring"
            >
              Explore the Store <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center rounded-md border border-ink/15 px-7 py-3.5 text-base font-semibold hover:bg-paper focus-ring"
            >
              See How It Works
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="group rounded-md border border-ink/10 bg-paper p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B42335]">Classic object</span>
              <Camera className="h-4 w-4 text-ink/35" />
            </div>
            <ProductBoxVisual variant="red" cardCount={2} />
          </div>
          <div className="group rounded-md border border-ink/10 bg-[#fbf8ff] p-5 shadow-soft sm:translate-y-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6D28D9]">Signature object</span>
              <Gem className="h-4 w-4 text-ink/35" />
            </div>
            <ProductBoxVisual variant="purple" opened cardCount={5} />
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/38">Card preview</p>
            <h2 className="mt-3 text-2xl font-semibold">The Decision Filter Before the Final</h2>
            <div className="mt-5 grid gap-3 text-sm">
              {["First-second visual hook", "Scene-by-scene script", "Caption and comment engine"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-md border border-ink/10 bg-paper px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-teal" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-ink/10 bg-[#080808] p-5 text-white shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Atelier concierge</p>
            <ProductBoxVisual variant="black" cardCount={7} className="mt-2 h-44" />
            <p className="mt-3 text-sm leading-6 text-white/62">Bespoke strategy cards for launches, rebrands, and premium campaign moments.</p>
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

      <section id="how" className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/70">How It Works</p>
            <h2 className="mt-3 text-4xl font-semibold">A simple path from purchase to publish-ready execution.</h2>
            <p className="mt-4 text-lg leading-8 text-ink/64">
              Anomaly Box is not an endless idea generator. It is a private delivery system for selected, structured briefs that help creators move into production with control.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["01", "Configure", "Choose a box, one lane, and one creator mode inside Store."],
              ["02", "Receive", "Your box lands sealed in Creator Vault with the match locked to that purchase."],
              ["03", "Reveal", "Open the box when ready and study the structured card guidance."],
              ["04", "Review", "Submit a draft video for human checklist feedback before posting."],
            ].map(([num, title, copy]) => (
              <article key={num} className="rounded-md border border-ink/10 bg-white p-6 shadow-sm">
                <div className="font-mono text-sm font-semibold text-ink/35">{num}</div>
                <h3 className="mt-4 text-2xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#080808] py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">Private custom service</p>
            <h2 className="mt-3 text-5xl font-semibold">ATELIER BLACK BOX</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/66">
              A bespoke creator-card system for high-value launches, rebrands, sponsor campaigns, and creators who need a more tailored strategic layer.
            </p>
            <Link
              href="/atelier#atelier-request"
              className="mt-7 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-ink hover:bg-[#E8EDF7] focus-ring"
            >
              Request Atelier direction <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Creator and lane analysis",
              "Desired brand effect selection",
              "Custom digital cards",
              "Sponsor-safe wording",
              "Launch or rebrand strategy",
              "Optional manual execution review",
            ].map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/72">
                <PackageCheck className="mb-3 h-4 w-4 text-[#D9E2F2]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10 bg-white py-10 text-center text-sm text-ink/70">
        Premium private creator cards for Instagram execution.{" "}
        <Link href="/store" className="underline underline-offset-2 hover:text-ink">Explore the Store</Link>
        {" / "}
        <Link href="/legal" className="underline underline-offset-2 hover:text-ink">Legal</Link>
        {" / "}
        <Link href="/about" className="underline underline-offset-2 hover:text-ink">About</Link>
      </footer>
    </main>
  );
}