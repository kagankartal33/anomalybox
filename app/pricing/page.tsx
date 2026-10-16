import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock3, Crown, Gem, LockKeyhole, ShieldCheck, SlidersHorizontal, Sparkles, VideoOff } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { PremiumIcon } from "@/components/PremiumIcon";
import { CreativeDossierVisual } from "@/components/CreativeDossierVisual";
import { SampleBriefModal } from "@/components/SampleBriefModal";
import { premiumAssets } from "@/lib/premium-assets";
import { BOX_FEATURES, BRIEF_INCLUDES, boxPriceLabel } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Anomaly Box Pricing: Classic Red, Signature Purple, Atelier",
  description:
    "Compare Classic Red, Signature Purple, and Atelier. Briefs arrive in Creator Vault. Filming is not included.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    images: [{ url: premiumAssets.og.pricing, width: 1200, height: 630, alt: "Anomaly Box pricing" }],
  },
};

export const revalidate = 300;
const plans = [
  {
    name: "Classic Red Box",
    price: boxPriceLabel("viral_box_500"),
    description: "Two private shoot briefs tailored for one lane and one creator mode. Ready to film this week.",
    variant: "red" as const,
    icon: Gem,
    href: "/store?box=viral_box_500",
    cta: "Configure Classic Red",
    features: BOX_FEATURES.viral_box_500,
  },
  {
    name: "Signature Purple Box",
    price: boxPriceLabel("premium_viral_box_1000"),
    description: "Five private shoot briefs with deeper scene flow, pacing, and visual proof structure for your selected lane.",
    variant: "purple" as const,
    icon: Crown,
    href: "/store?box=premium_viral_box_1000",
    cta: "Configure Signature Purple",
    features: BOX_FEATURES.premium_viral_box_1000,
  },
  {
    name: "Atelier Black Box",
    price: "Private quote",
    description: "A custom brief set for a launch, rebrand, or sponsor job. Quote after a short intake.",
    variant: "black" as const,
    icon: Sparkles,
    href: "/atelier#atelier-request",
    cta: "Request Atelier consultation",
    features: ["Lane and voice review", "The brand effect you want", "Custom briefs written for that job", "Private intake, not a form package"],
  },
];

const briefIncludes = BRIEF_INCLUDES;

export default function PricingPage() {
  return (
    <PublicShell>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Pricing</p>
        <h1 className="mt-2 max-w-4xl text-5xl font-semibold leading-[1.02]">Pick how many shoot briefs you need.</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/66">
          Classic and Signature use the lane and creator mode you choose at checkout. Atelier is quote-only when a standard box is not enough.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className={`group overflow-hidden rounded-xl border bg-white shadow-soft ${plan.variant === "purple" ? "border-plum/25" : plan.variant === "red" ? "border-[#963B48]/25" : "border-ink/20"}`}>
            <div className={plan.variant === "black" ? "bg-[#101011] p-6 text-white" : plan.variant === "purple" ? "bg-[#F1ECF1] p-6" : "bg-[#F7EEEB] p-6"}>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${plan.variant === "black" ? "bg-white/10 text-white/68" : "bg-white text-ink/55"}`}>
                <PremiumIcon icon={plan.icon} size="sm" tone={plan.variant === "purple" ? "purple" : plan.variant === "red" ? "red" : "blackDiamond"} />
                {plan.name}
              </div>
              <CreativeDossierVisual variant={plan.variant} available={plan.variant === "purple"} itemCount={plan.variant === "red" ? 2 : plan.variant === "black" ? 7 : 5} className="mt-4" />
            </div>
            <div className="p-6">
              <div className="text-3xl font-semibold">{plan.price}</div>
              <h2 className="mt-4 text-2xl font-semibold">{plan.name}</h2>
              <p className="mt-2 min-h-20 text-sm leading-6 text-ink/62">{plan.description}</p>
              <div className="mt-5 grid gap-2 text-sm">
                {plan.features.map((feature) => (
                  <div key={feature} className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-ink/68">{feature}</div>
                ))}
              </div>
              <Link className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-5 py-3 font-semibold text-white hover:bg-black focus-ring" href={plan.href}>
                {plan.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-12 border-t border-ink/10 pt-12" aria-labelledby="brief-includes-title">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum-deep">Inside every brief</p>
                <h2 id="brief-includes-title" className="mt-2 max-w-2xl text-3xl font-semibold leading-tight">
                  What each brief settles before you pick up the phone.
                </h2>
              </div>
              <SampleBriefModal triggerVariant="badge" triggerLabel="Inspect Full Sample Brief" />
            </div>
            <p className="mt-4 max-w-2xl leading-7 text-ink/62">
              Package size changes how many angles you get. The job of each brief stays the same: fewer decisions on set.
            </p>
            <ul className="mt-7 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {briefIncludes.map((item) => (
                <li key={item} className="flex items-start gap-3 border-b border-ink/8 pb-3 text-sm leading-6 text-ink/72">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-ink/12 bg-paper p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/42">Delivery and scope</p>
            <h2 className="mt-3 text-2xl font-semibold">What you get, and what you do not.</h2>
            <div className="mt-6 grid gap-5 text-sm leading-6 text-ink/68">
              <div className="flex gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-plum-deep" aria-hidden="true" />
                <p><strong className="text-ink">Delivery:</strong> Your creative brief is delivered digitally to your secure Creator Vault.</p>
              </div>
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-plum-deep" aria-hidden="true" />
                <p><strong className="text-ink">Estimated timing:</strong> Typically within a few minutes after payment confirmation. If fulfillment needs attention, the checkout status page keeps you informed.</p>
              </div>
              <div className="flex gap-3">
                <SlidersHorizontal className="mt-0.5 h-5 w-5 shrink-0 text-plum-deep" aria-hidden="true" />
                <p><strong className="text-ink">Edits after delivery:</strong> Classic and Signature are not rewritten after you pay. You choose lane and mode before checkout. Atelier edits are written into the quote.</p>
              </div>
              <div className="flex gap-3">
                <VideoOff className="mt-0.5 h-5 w-5 shrink-0 text-plum-deep" aria-hidden="true" />
                <p><strong className="text-ink">Production boundary:</strong> Finished video production, filming, and editing are not included.</p>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-plum-deep" aria-hidden="true" />
                <p><strong className="text-ink">Outcome boundary:</strong> Anomaly Box provides creative strategy and execution guidance; reach, engagement, and viral performance are not guaranteed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </PublicShell>
  );
}
