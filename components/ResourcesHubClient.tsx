"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, Sparkles, BookOpen } from "lucide-react";
import { premiumAssets } from "@/lib/premium-assets";

import { getPageImageSpec } from "@/lib/page-images";

interface ResourceItem {
  slug: string;
  title: string;
  description: string;
  sections: string[];
}

const CATEGORIES = [
  { id: "all", label: "All Guides" },
  { id: "ugc", label: "UGC Briefs & Rights" },
  { id: "burnout", label: "Burnout & Systems" },
  { id: "ai", label: "AI & Authenticity" },
  { id: "faceless", label: "Faceless & POV" },
  { id: "aeo", label: "Search & Discoverability" },
];

export function ResourcesHubClient({ resources }: { resources: ResourceItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sections.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeCategory === "all") return true;
      if (activeCategory === "ugc") {
        return (
          item.slug.includes("ugc") ||
          item.slug.includes("brief") ||
          item.slug.includes("revision") ||
          item.slug.includes("rights") ||
          item.slug.includes("payment")
        );
      }
      if (activeCategory === "burnout") {
        return (
          item.slug.includes("burnout") ||
          item.slug.includes("repurposing") ||
          item.slug.includes("consistency") ||
          item.slug.includes("niche") ||
          item.slug.includes("batching")
        );
      }
      if (activeCategory === "ai") {
        return (
          item.slug.includes("ai") ||
          item.slug.includes("authenticity") ||
          item.slug.includes("trust") ||
          item.slug.includes("beauty")
        );
      }
      if (activeCategory === "faceless") {
        return (
          item.slug.includes("faceless") ||
          item.slug.includes("hands") ||
          item.slug.includes("pov") ||
          item.slug.includes("asmr") ||
          item.slug.includes("zero-budget")
        );
      }
      if (activeCategory === "aeo") {
        return (
          item.slug.includes("aeo") ||
          item.slug.includes("dossier") ||
          item.slug.includes("visual-signature") ||
          item.slug.includes("schema") ||
          item.slug.includes("overviews")
        );
      }
      return true;
    });
  }, [resources, searchQuery, activeCategory]);

  const featured = resources[0];
  const gridItems = searchQuery || activeCategory !== "all" ? filteredResources : filteredResources.slice(1);

  return (
    <div className="space-y-12 pb-20">
      {/* Search & Category Filter Bar */}
      <div className="rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Instant Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creator guides, UGC briefs, Reels, lighting, or workflows..."
              className="w-full rounded-xl border border-ink/10 bg-plum-soft/30 py-3.5 pl-12 pr-4 text-sm font-medium text-ink outline-none transition focus:border-plum-deep focus:bg-white focus:ring-2 focus:ring-plum/20"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide transition ${
                  activeCategory === cat.id
                    ? "bg-ink text-white shadow-sm"
                    : "bg-plum-soft/40 text-ink/70 hover:bg-plum-soft/80 hover:text-ink"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Headline Guide (Shown when no search query active) */}
      {!searchQuery && activeCategory === "all" && featured && (
        <article className="group relative overflow-hidden rounded-3xl border border-plum/20 bg-ink p-8 text-white shadow-xl transition hover:border-plum/40 md:p-12">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-plum-deep/30 blur-3xl" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-plum-soft">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" /> Featured Guide
              </div>
              <h2 className="text-3xl font-bold leading-tight md:text-4xl text-white group-hover:text-plum-soft transition">
                {featured.title}
              </h2>
              <p className="text-lg leading-relaxed text-white/75">
                {featured.description}
              </p>
              <div className="pt-4">
                <Link
                  href={`/resources/${featured.slug}`}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-white px-6 py-3.5 font-semibold text-ink shadow-md transition hover:bg-plum-soft"
                >
                  Open Guide <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-2 backdrop-blur-md">
                <Image
                  src={getPageImageSpec(featured.slug, featured.title).url}
                  alt={featured.title}
                  width={600}
                  height={350}
                  className="rounded-xl object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </article>
      )}

      {/* Grid of Resources */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-ink flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-plum-deep" />
            Creator Guide Library
          </h3>
          <span className="text-xs font-semibold tracking-wider text-ink/60 uppercase">
            Showing {filteredResources.length} of {resources.length} Guides
          </span>
        </div>

        {gridItems.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gridItems.map((item) => {
              const imageSpec = getPageImageSpec(item.slug, item.title);
              return (
                <article
                  key={item.slug}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition hover:-translate-y-1 hover:border-plum/40 hover:shadow-md"
                >
                  {/* Topic-Unique Card Thumbnail Image */}
                  <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-plum-soft/20">
                    <Image
                      src={imageSpec.url}
                      alt={imageSpec.alt}
                      fill
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md border border-white/20 uppercase tracking-wider">
                      {imageSpec.badge}
                    </div>
                  </div>

                  <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold leading-snug text-ink transition group-hover:text-plum-deep">
                        <Link href={`/resources/${item.slug}`}>
                          {item.title}
                        </Link>
                      </h3>

                      <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-ink/65">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-ink/5 flex items-center justify-between">
                      <Link
                        href={`/resources/${item.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-plum-deep transition group-hover:translate-x-1"
                      >
                        Open Guide <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-plum-soft/20 p-12 text-center">
            <p className="text-base font-semibold text-ink/70">{`No directions found matching "${searchQuery}".`}</p>
            <p className="mt-1 text-sm text-ink/60">
              {'Try searching for keywords like "UGC", "lighting", "repurposing", or "script".'}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              className="mt-4 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white"
            >

              Reset Search & Filters
            </button>
          </div>
        )}
      </div>

      {/* CTA to digital shoot briefs */}
      <section className="rounded-3xl border border-plum/20 bg-gradient-to-r from-plum-soft/60 via-white to-plum-soft/40 p-8 shadow-sm md:p-12">
        <div className="grid gap-8 md:grid-cols-12 md:items-center">
          <div className="space-y-4 md:col-span-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-plum-deep">Campaign-ready creative brief</span>
            <h2 className="text-3xl font-bold leading-tight text-ink md:text-4xl">
              Turn your next content plan into shoot-ready direction.
            </h2>
            <p className="text-base leading-relaxed text-ink/70">
              Anomaly Box delivers Classic Red and Signature Purple briefs digitally to Creator Vault, built around your lane, constraints, and production style.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/store"
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 font-semibold text-white shadow-md transition hover:bg-plum-deep"
              >
                Explore Creative Briefs <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dossiers/signature-purple"
                className="inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-white px-6 py-3.5 font-semibold text-ink transition hover:bg-plum-soft"
              >
                View Signature Purple
              </Link>
            </div>
          </div>

          <div className="md:col-span-4 flex justify-center">
            <Image
              src={premiumAssets.dossiers.signature}
              alt="Anomaly Box Signature Purple creative brief"
              width={320}
              height={320}
              className="rounded-2xl shadow-lg border border-white/50"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
