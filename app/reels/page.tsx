import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Film } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { resources } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: "Instagram Reels Guides, Hooks & Shot Plans | ViralBox",
  description: "Plan clearer Instagram Reels with practical guidance on hooks, opening frames, scene order, visual proof, editing, and repeatable formats.",
  alternates: { canonical: "/reels" },
};

export const revalidate = 300;

export default function ReelsHubPage() {
  const reelsResources = resources;

  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-plum-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-plum-deep">
            <Film className="h-3.5 w-3.5" />
            Editorial Hub
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Instagram Reels Guides & Strategy
          </h1>
          <p className="mt-4 text-lg leading-8 text-ink/70">
            Build Reels around a clear promise, a strong opening frame, visible proof, and a scene plan that fits the way you actually create.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {reelsResources.map((item) => (
            <Link
              key={item.slug}
              href={`/resources/${item.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-ink/10 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-ink/25"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-plum">Field Guide</span>
                <h2 className="mt-2 text-xl font-semibold text-ink group-hover:text-plum-deep">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink/65">
                  {item.description}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-teal group-hover:underline">
                Read guide
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-ink/10 bg-paper p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            Ready to shoot execution-ready briefs?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-ink/70">
            Get curated ViralBox dossiers with scene-by-scene scripts, B-roll cues, captions, and creator video review.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/store"
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3 font-semibold text-white transition hover:bg-black"
            >
              Explore Idea Boxes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}