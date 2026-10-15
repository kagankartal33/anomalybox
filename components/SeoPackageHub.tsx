import Link from "next/link";
import Image from "next/image";
import { PublicShell } from "@/components/PublicShell";
import { JsonLd } from "@/components/JsonLd";
import { TemplatePurchaseGate } from "@/components/TemplatePurchaseGate";
import { HubPagination } from "@/components/HubPagination";
import {
  SEO_PACKAGE_SECTIONS,
  pageTypeLabel,
  seoPackageBySection,
  seoPackagePages,
  sectionLabel,
  versionedSeoPackageImage,
  type SeoPackageSection,
} from "@/lib/seo-package";
import { HUB_PAGE_SIZE, clampHubPage, hubPageCount, hubPageHref, sliceHubPage } from "@/lib/hub-pagination";
import { siteUrl } from "@/lib/env";
import { getTemplateAccessState, hasTemplatePurchaseAccess } from "@/lib/template-access";
import { isPurchaseProtectedTemplate } from "@/lib/template-policy";

type Props = {
  /** If set, show one resource section. Otherwise show the complete library. */
  section?: SeoPackageSection;
  title: string;
  description: string;
  /** 1-based page. Used when paginate is true. */
  page?: number;
  /** Limit the grid to 9 guides and add numbered pages. Default on. */
  paginate?: boolean;
};

export async function SeoPackageHub({ section, title, description, page = 1, paginate = true }: Props) {
  const base = siteUrl();
  const candidatePages = section ? seoPackageBySection(section) : seoPackagePages;
  const path = section ? `/${section}` : "/resources";

  // Public hubs stay cacheable: never read cookies here. Templates keep their own gate.
  if (section === "templates") {
    const accessState = await getTemplateAccessState();
    if (!hasTemplatePurchaseAccess(accessState)) {
      return <TemplatePurchaseGate accessState={accessState} returnPath="/templates" />;
    }
  }

  const pages =
    section === "templates"
      ? candidatePages
      : candidatePages.filter((item) => !isPurchaseProtectedTemplate(item));
  const visibleSections = SEO_PACKAGE_SECTIONS;
  const currentPage = paginate ? clampHubPage(page, pages.length) : 1;
  const visiblePages = paginate ? sliceHubPage(pages, currentPage) : pages;
  const totalPages = paginate ? hubPageCount(pages.length) : 1;

  return (
    <PublicShell>
      {paginate && currentPage > 1 ? <link rel="prev" href={hubPageHref(path, currentPage - 1)} /> : null}
      {paginate && currentPage < totalPages ? <link rel="next" href={hubPageHref(path, currentPage + 1)} /> : null}
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description,
            url: `${base}${hubPageHref(path, currentPage)}`,
            numberOfItems: pages.length,
            publisher: { "@type": "Organization", name: "Anomaly Box", url: base },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: base },
              { "@type": "ListItem", position: 2, name: title, item: `${base}${path}` },
            ],
          },
        ]}
      />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-10 space-y-4 text-center">
          <span className="inline-block rounded-full border border-plum-deep/20 bg-plum-soft/40 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-plum-deep">
            Creator Resource Library
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-6xl">{title}</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-ink/65">{description}</p>
          <p className="text-sm font-medium text-ink/45">
            {paginate
              ? `${visiblePages.length} guides on this page.`
              : "Choose the guide that matches your next planning or production decision."}
          </p>
        </div>

        <div className="mb-10 flex flex-wrap justify-center gap-2" role="navigation" aria-label="Resource categories">
          <Link
            href="/resources"
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              !section
                ? "border-ink bg-ink text-white shadow-sm"
                : "border-ink/10 bg-white text-ink/80 hover:border-plum-deep/30 hover:bg-plum-soft/40"
            }`}
          >
            All Resources
          </Link>
          {visibleSections.map((s) => {
            const isActive = section === s.id;
            return (
              <Link
                key={s.id}
                href={`/${s.id}`}
                // Templates are a noindex customer area; keep crawlers from spending budget on it.
                rel={s.id === "templates" ? "nofollow" : undefined}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-ink bg-ink text-white shadow-sm"
                    : "border-ink/10 bg-white text-ink/80 hover:border-plum-deep/30 hover:bg-plum-soft/40"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>

        <div id="resource-list" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePages.map((item, index) => (
            <Link
              key={item.id}
              href={item.path}
              className="group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-plum-deep/30 hover:shadow-lg"
            >
              <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-plum-soft/30">
                <Image
                  src={versionedSeoPackageImage(item.image)}
                  alt={item.imageAlt}
                  fill
                  priority={index < 3}
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute top-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md border border-white/20 uppercase tracking-wider">
                  {sectionLabel(item.section)}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-plum-deep">
                  {pageTypeLabel(item.pageType)}
                </div>
                <h2 className="mt-2 text-xl font-bold leading-snug text-ink group-hover:text-plum-deep transition">
                  {item.title}
                </h2>
                <p className="mt-2.5 line-clamp-3 flex-1 text-sm leading-relaxed text-ink/65">{item.description}</p>
                <div className="mt-5 pt-3 border-t border-ink/5 flex items-center justify-between">
                  <span className="text-sm font-bold text-plum-deep group-hover:translate-x-1 transition duration-200 inline-flex items-center gap-1">
                    Open guide →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {paginate ? (
          <HubPagination
            basePath={path}
            page={currentPage}
            totalPages={totalPages}
            totalItems={pages.length}
            pageSize={HUB_PAGE_SIZE}
          />
        ) : null}
      </section>
    </PublicShell>
  );
}
