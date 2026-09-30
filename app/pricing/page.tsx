import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Crown, Gem, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PremiumIcon } from "@/components/PremiumIcon";
import { ProductBoxVisual } from "@/components/ProductBoxVisual";

export const metadata: Metadata = {
  title: "ViralBox Pricing | Classic Red, Signature Purple, and Atelier",
  description:
    "Compare ViralBox pricing for Classic Red Box, SIGNATURE PURPLE BOX, and the contact-only ATELIER BLACK BOX concierge service.",
  alternates: {
    canonical: "/pricing",
  },
};

const plans = [
  {
    name: "Classic Red Box",
    price: "$500",
    description: "2 private creator cards calibrated to your lane, creator mode, and production style.",
    variant: "red" as const,
    icon: Gem,
    href: "/store?box=viral_box_500",
    cta: "Configure Classic Red",
    features: ["Two private strategy cards", "Scene flow and shot direction", "Caption and comment prompts", "Brand-safe execution notes"],
  },
  {
    name: "SIGNATURE PURPLE BOX",
    price: "$1,000",
    description: "5 private strategy cards with deeper execution direction, brand-lift framing, and launch-ready creative angles.",
    variant: "purple" as const,
    icon: Crown,
    href: "/store?box=premium_viral_box_1000",
    cta: "Configure Signature Purple",
    features: ["Five private strategy cards", "Deeper production guidance", "Brand-lift and atmosphere direction", "Stronger range for campaign moments"],
  },
  {
    name: "ATELIER BLACK BOX",
    price: "Private quote",
    description: "A bespoke concierge creator-card system for launches, rebrands, sponsored campaigns, and premium positioning.",
    variant: "black" as const,
    icon: Sparkles,
    href: "/atelier#atelier-request",
    cta: "Request Atelier consultation",
    features: ["Creator and lane analysis", "Desired brand-effect selection", "Custom digital cards", "Optional manual execution review"],
  },
];

export default function PricingPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/40">Pricing</p>
        <h1 className="mt-2 max-w-4xl text-5xl font-semibold leading-[1.02]">Choose the level of private creator strategy you need.</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/66">
          Standard boxes are configured in Store by lane and creator mode. The Atelier service is contact-only for custom strategy work.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className={`group overflow-hidden rounded-md border bg-white shadow-soft ${plan.variant === "purple" ? "border-[#7E22CE]/25" : plan.variant === "red" ? "border-[#B42335]/25" : "border-ink/20"}`}>
            <div className={plan.variant === "black" ? "bg-[#080808] p-6 text-white" : plan.variant === "purple" ? "bg-[radial-gradient(circle_at_50%_0%,#F3E8FF_0%,#FFFFFF_48%,#F7F5EF_100%)] p-6" : "bg-[radial-gradient(circle_at_50%_0%,#FFE6DD_0%,#FFFFFF_48%,#F7F5EF_100%)] p-6"}>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${plan.variant === "black" ? "bg-white/10 text-white/68" : "bg-white text-ink/55"}`}>
                <PremiumIcon icon={plan.icon} size="sm" tone={plan.variant === "purple" ? "purple" : plan.variant === "red" ? "red" : "blackDiamond"} />
                {plan.name}
              </div>
              <ProductBoxVisual variant={plan.variant} opened={plan.variant === "purple"} cardCount={plan.variant === "red" ? 2 : 5} className="mt-4" />
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

      <p className="mt-8 text-center text-sm leading-6 text-ink/55">
        ViralBox provides execution guidance and creative strategy. It does not guarantee reach, engagement, or platform outcomes.
      </p>
    </AppShell>
  );
}