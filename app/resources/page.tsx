import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { resources } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: "Creator Resources: Briefs, Shoot Plans, Editing & Strategy",
  description: "Practical guides for creator content systems, short-form shoot plans, faceless production, editing, UGC, and performance review.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  return (
    <PublicShell>
      <section className="max-w-4xl py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum-deep">Anomaly Box field notes</p>
        <h1 className="mt-4 text-5xl font-semibold leading-none">Creator resources for clearer production.</h1>
        <p className="mt-6 text-lg leading-8 text-ink/65">Practical, claim-aware guidance for moving from an audience goal to footage, edit, and review.</p>
      </section>
      <div className="grid gap-4 pb-12 md:grid-cols-2">
        {resources.map((resource) => (
          <article key={resource.slug} className="rounded-xl border border-ink/10 bg-white p-6">
            <h2 className="text-2xl font-semibold">{resource.title}</h2>
            <p className="mt-3 leading-7 text-ink/60">{resource.description}</p>
            <Link href={`/resources/${resource.slug}`} className="focus-ring mt-5 inline-flex items-center gap-2 rounded-sm font-semibold text-plum-deep">Read field note <ArrowRight className="h-4 w-4" /></Link>
          </article>
        ))}
      </div>
    </PublicShell>
  );
}