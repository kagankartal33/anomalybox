import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { TemplatePurchaseGate } from "@/components/TemplatePurchaseGate";
import { getTemplateAccessState, hasTemplatePurchaseAccess } from "@/lib/template-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reels Creative Brief Template for Brands | ViralBox",
  description: "Production-ready Instagram Reels creative brief template used by top influencer agencies and creator studios.",
  alternates: { canonical: "/resources/reels-creative-brief-template-for-brands" },
};

export default async function ReelsCreativeBriefTemplatePage() {
  const accessState = await getTemplateAccessState();
  const returnPath = "/resources/reels-creative-brief-template-for-brands";

  if (!hasTemplatePurchaseAccess(accessState)) {
    return <TemplatePurchaseGate accessState={accessState} returnPath={returnPath} />;
  }

  return (
    <PublicShell>
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <nav className="text-sm text-ink/50" aria-label="Breadcrumb">
          <Link href="/resources" className="hover:underline">Resources</Link> / Premium Template
        </nav>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Customer Access Unlocked
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Reels Creative Brief Template for Brands
        </h1>
        <p className="mt-4 text-lg leading-8 text-ink/70">
          The exact brief structure used to commission viral, brand-safe Instagram Reels from creators without creative friction.
        </p>

        <div className="mt-10 space-y-8">
          <section className="rounded-xl border border-ink/10 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-ink">1. Core Campaign Objective</h2>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              Define the single takeaway for the audience. Avoid multiple competing calls to action.
            </p>
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-ink">2. First 3 Seconds (Visual Hook)</h2>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              Action-first hook: Show the problem or product outcome before stating brand introduction.
            </p>
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-ink">3. Scene-by-Scene Flow & Cut Points</h2>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              Specify 3 to 5 clear beats with camera angle, spoken line, on-screen text, and B-roll notes.
            </p>
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-ink">4. Brand Safety & Disclosure</h2>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              List prohibited claims, required sponsor disclosures, and clear alternatives.
            </p>
          </section>
        </div>
      </article>
    </PublicShell>
  );
}