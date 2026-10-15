import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SeoPackageHub } from "@/components/SeoPackageHub";
import { clampHubPage, hubPageCount, hubPageHref } from "@/lib/hub-pagination";
import { brandedTitle } from "@/lib/seo-metadata";
import { publicHubCount } from "@/lib/hub-section";
import type { SeoPackageSection } from "@/lib/seo-package";

export { generateHubPagedParams, publicHubCount } from "@/lib/hub-section";

export function hubPagedMetadata(basePath: string, title: string, description: string) {
  return async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
    const requested = Number.parseInt((await params).page, 10);
    const section = basePath.replace(/^\//, "") as SeoPackageSection;
    const totalItems = publicHubCount(section);
    const page = clampHubPage(requested, totalItems);
    const totalPages = hubPageCount(totalItems);
    const path = hubPageHref(basePath, page);
    const pagedTitle = brandedTitle(`${title} – Page ${page} of ${totalPages}`);
    // Each paginated page needs a distinct description, otherwise search engines report duplicates.
    const pagedDescription = `${description.replace(/[.\s]+$/, "")}. Page ${page} of ${totalPages}.`;
    return {
      title: pagedTitle,
      description: pagedDescription,
      alternates: { canonical: path },
      openGraph: {
        title: pagedTitle,
        description: pagedDescription,
        url: path,
      },
    };
  };
}

export async function renderHubPagedPage({
  section,
  title,
  description,
  params,
}: {
  section: SeoPackageSection;
  title: string;
  description: string;
  params: Promise<{ page: string }>;
}) {
  const requested = Number.parseInt((await params).page, 10);
  const total = publicHubCount(section);
  if (!Number.isFinite(requested) || requested < 1) notFound();
  if (requested === 1) redirect(`/${section}`);
  const page = clampHubPage(requested, total);
  if (page !== requested) notFound();

  return (
    <SeoPackageHub
      paginate
      page={page}
      section={section === "resources" ? undefined : section}
      title={title}
      description={description}
    />
  );
}
