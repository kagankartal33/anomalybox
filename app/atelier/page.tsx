import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Gem, Shield, Sparkles } from "lucide-react";
import { submitAtelierLead } from "@/app/atelier/actions";
import { PremiumIcon } from "@/components/PremiumIcon";
import { RecaptchaSubmitButton } from "@/components/RecaptchaSubmitButton";
import { premiumAssets } from "@/lib/premium-assets";

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

export default async function AtelierPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#060606] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="focus-ring inline-flex items-center gap-3 rounded-sm" aria-label="Anomaly Box home">
            <Image src={premiumAssets.brand.mark} alt="" width={40} height={40} className="h-10 w-10" priority />
            <span className="text-lg font-semibold tracking-[0.01em] text-white">Anomaly Box</span>
          </Link>
          <a
            href="#atelier-request"
            className="rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5"
          >
            Request consultation
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1fr_0.9fr] md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            <Gem className="h-3.5 w-3.5 text-[#D9E2F2]" />
            Concierge creative direction
          </div>
          <h1 className="mt-6 text-6xl font-semibold leading-[0.95]">ATELIER BLACK BOX</h1>
          <p className="mt-6 max-w-2xl text-xl leading-9 text-white/70">
            A bespoke creator-card system for established creators who need sharper positioning, campaign-specific direction,
            and premium digital cards shaped around their voice, audience, and production style.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#atelier-request"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-[#10100f] hover:bg-[#E8EDF7]"
            >
              Request a private Atelier consultation <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/" className="inline-flex items-center justify-center rounded-md border border-white/18 px-6 py-3 font-semibold text-white/72 hover:bg-white/5">
              Back to Anomaly Box
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/12 bg-[#0D0D0D] shadow-[0_50px_120px_-70px_rgba(255,255,255,0.45)]">
          <div className="relative aspect-[3/2] border-b border-white/10">
            <Image
              src={premiumAssets.marketing.atelier}
              alt="A face-free creative director reviewing a tailored campaign in a dark cinematic studio"
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B5A8BB]">Private design object</p>
          <PremiumIcon className="mt-5" icon={Sparkles} tone="blackDiamond" />
          <h2 className="mt-4 text-2xl font-semibold">Built around the effect you want your audience to feel.</h2>
          <div className="mt-6 grid gap-3">
            {effects.map((effect) => (
              <div key={effect} className="relative rounded-md border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/76">
                {effect}
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">What is included</p>
            <h2 className="mt-3 text-4xl font-semibold">Custom cards, custom positioning, controlled execution.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {deliverables.map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-white/72">
                <PremiumIcon className="mb-4" icon={Check} size="sm" tone="blackDiamond" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2">
          <div className="rounded-md border border-white/10 bg-white/[0.035] p-7">
            <PremiumIcon icon={Shield} tone="blackDiamond" />
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
              and creators who want a more bespoke creative system than a standard dossier.
            </p>
          </div>
        </div>
      </section>

      <section id="atelier-request" className="border-t border-white/10 py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[0.85fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Private request</p>
            <h2 className="mt-3 text-4xl font-semibold">Tell us the effect you want the campaign to create.</h2>
            <p className="mt-4 leading-8 text-white/64">
              Share the launch, brand shift, sponsor campaign, or creator lane you want to sharpen. The Atelier response is reviewed manually.
            </p>
          </div>
          <form action={submitAtelierLead} className="rounded-md border border-white/10 bg-white/[0.045] p-6 shadow-[0_50px_120px_-80px_rgba(255,255,255,0.5)]">
            {params.sent ? <div className="mb-4 rounded-md border border-[#D9E2F2]/25 bg-[#D9E2F2]/10 p-3 text-sm text-[#D9E2F2]">Your private request was sent to the Anomaly Box Atelier team.</div> : null}
            {params.error ? <div className="mb-4 rounded-md border border-red-300/25 bg-red-400/10 p-3 text-sm text-red-100">{params.error}</div> : null}
            <input aria-hidden="true" className="hidden" name="company" tabIndex={-1} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-white/82">
                Name
                <input className="focus-ring rounded-md border border-white/12 bg-black/35 px-3 py-3 font-normal text-white placeholder:text-white/30" name="name" required />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-white/82">
                Email
                <input className="focus-ring rounded-md border border-white/12 bg-black/35 px-3 py-3 font-normal text-white placeholder:text-white/30" name="email" required type="email" />
              </label>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-semibold text-white/82">
              Instagram handle
              <input className="focus-ring rounded-md border border-white/12 bg-black/35 px-3 py-3 font-normal text-white placeholder:text-white/30" name="instagram_handle" placeholder="@creator" />
            </label>
            <label className="mt-4 grid gap-2 text-sm font-semibold text-white/82">
              Desired brand effect
              <select className="focus-ring rounded-md border border-white/12 bg-black/35 px-3 py-3 font-normal text-white" name="desired_effect" required defaultValue="">
                <option disabled value="">Select one</option>
                {effects.map((effect) => <option className="bg-[#0D0D0D]" key={effect} value={effect}>{effect}</option>)}
              </select>
            </label>
            <label className="mt-4 grid gap-2 text-sm font-semibold text-white/82">
              What are you preparing for?
              <textarea className="focus-ring min-h-36 rounded-md border border-white/12 bg-black/35 px-3 py-3 font-normal leading-7 text-white placeholder:text-white/30" name="project_context" placeholder="Launch, rebrand, sponsor campaign, product reveal, or the audience effect you want..." required />
            </label>
            <RecaptchaSubmitButton action="atelier_request" className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-5 py-3 font-semibold text-[#10100f] hover:bg-[#E8EDF7] disabled:opacity-60">
              Request private Atelier review <ArrowRight className="h-4 w-4" />
            </RecaptchaSubmitButton>
          </form>
        </div>
      </section>
    </main>
  );
}