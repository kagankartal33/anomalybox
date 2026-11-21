import Link from "next/link";
import { getCategorizedLegacyGuides } from "@/lib/legacy-guides-directory";

export function LegacyGuidesDirectory() {
  const categories = getCategorizedLegacyGuides();
  const totalGuides = categories.reduce((sum, c) => sum + c.guides.length, 0);

  return (
    <section className="mt-20 border-t border-ink/10 pt-16" aria-labelledby="all-guides-heading">
      <div className="mb-12 text-center">
        <span className="inline-block rounded-full border border-plum-deep/20 bg-plum-soft/40 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-plum-deep">
          Complete Architectural Library
        </span>
        <h2 id="all-guides-heading" className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Creator Workflow &amp; Production Architecture Directory
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-ink/65">
          Explore all {totalGuides} verified creator briefs, technical shoot plans, and production systems across strategy, filming, lighting, and commercial execution.
        </p>
      </div>

      <div className="space-y-16">
        {categories.map((category) => (
          <div key={category.id} className="rounded-2xl border border-ink/10 bg-[#FAF7F2]/50 p-6 sm:p-8">
            <div className="border-b border-ink/10 pb-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                  {category.name}
                </h3>
                <span className="rounded-full bg-plum-soft/60 px-3 py-1 text-xs font-semibold text-plum-deep">
                  {category.guides.length} Guides
                </span>
              </div>
              <p className="mt-1.5 text-sm text-ink/70">{category.description}</p>
            </div>

            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.guides.map((guide) => (
                <li key={guide.slug} className="flex">
                  <Link
                    href={guide.path}
                    className="focus-ring group flex flex-1 flex-col justify-between rounded-xl border border-ink/10 bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-plum-deep/30 hover:shadow-md"
                  >
                    <div>
                      <h4 className="text-base font-semibold leading-snug text-ink transition group-hover:text-plum-deep">
                        {guide.title}
                      </h4>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink/65">
                        {guide.description}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs font-bold text-plum-deep">
                      <span>Read guide</span>
                      <span className="transition duration-200 group-hover:translate-x-0.5">→</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
