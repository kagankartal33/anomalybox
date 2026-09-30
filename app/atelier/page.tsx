import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Gem, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "ATELIER BLACK BOX | Custom Creator Strategy Cards",
  description:
    "A private concierge creator-card service for launches, rebrands, sponsored campaigns, and premium creator positioning.",
  alternates: {
    canonical: "/atelier",
  },
};

const effects = [
  "More editorial authority",
  "More relatable intimacy",
  "More luxury brand fit",
  "More comment and save behavior",
  "More campaign clarity",
  "A stronger visual signature",
];

const deliverables = [
  "Creator and lane analysis",
  "Desired brand-effect selection",
  "Custom digital strategy cards",
  "Brand-lift direction",
  "Hook, caption, and scene system",
  "Sponsor-safe wording",
  "Launch or rebrand strategy",
  "Optional manual execution review",
];

export default function AtelierPage() {
  return (
    <main className="min-h-screen bg-[#10100f] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-semibold tracking-[-0.2px]">ViralBox</Link>
          <a
            href="mailto:hello@viralbox.app?subject=ATELIER%20BLACK%20BOX%20consultation"
            className="rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5"
          >
            Request consultation
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1fr_0.9fr] md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            <Gem className="h-3.5 w-3.5 text-[#E9D5A1]" />
            Concierge custom box
          </div>
          <h1 className="mt-6 text-6xl font-semibold leading-[0.95] tracking-[-1.5px]">ATELIER BLACK BOX</h1>
          <p className="mt-6 max-w-2xl text-xl leading-9 text-white/70">
            A bespoke creator-card system for established creators who need sharper positioning, campaign-specific direction,
            and premium digital cards shaped around their voice, audience, and production style.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:hello@viralbox.app?subject=ATELIER%20BLACK%20BOX%20consultation"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-[#10100f] hover:bg-[#F3E7C1]"
            >
              Request a private Atelier Box consultation <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/" className="inline-flex items-center justify-center rounded-md border border-white/18 px-6 py-3 font-semibold text-white/72 hover:bg-white/5">
              Back to ViralBox
            </Link>
          </div>
        </div>

        <div className="rounded-md border border-white/12 bg-white/[0.04] p-6 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.8)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E9D5A1]">Private design brief</p>
          <h2 className="mt-4 text-2xl font-semibold">Built around the effect you want your audience to feel.</h2>
          <div className="mt-6 grid gap-3">
            {effects.map((effect) => (
              <div key={effect} className="rounded-md border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/76">
                {effect}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">What is included</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.8px]">Custom cards, custom positioning, controlled execution.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {deliverables.map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-white/72">
                <Check className="mb-4 h-4 w-4 text-[#E9D5A1]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2">
          <div className="rounded-md border border-white/10 bg-white/[0.035] p-7">
            <Shield className="h-5 w-5 text-[#E9D5A1]" />
            <h2 className="mt-4 text-2xl font-semibold">Built for brand-safe premium content.</h2>
            <p className="mt-3 leading-7 text-white/64">
              The Atelier service focuses on claim boundaries, sponsor-safe phrasing, visual positioning, and clear production guidance.
              It helps you create with taste and control without promising a guaranteed viral outcome.
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.035] p-7">
            <h2 className="text-2xl font-semibold">Best for</h2>
            <p className="mt-3 leading-7 text-white/64">
              Campaign launches, creator rebrands, premium sponsored posts, founder-led content, luxury positioning, high-value product reveals,
              and creators who want a more bespoke creative system than a standard box.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}