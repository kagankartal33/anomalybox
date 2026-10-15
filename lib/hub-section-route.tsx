import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SeoPackageHub } from "@/components/SeoPackageHub";
import { clampHubPage, hubPageHref } from "@/lib/hub-pagination";
import { publicHubCount } from "@/lib/hub-section";
import type { SeoPackageSection } from "@/lib/seo-package";

export { generateHubPagedParams, publicHubCount } from "@/lib/hub-section";

export function hubPagedMetadata(basePath: string, title: string, description: string) {
  return async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
    const requested = Number.parseInt((await params).page, 10);
    const section = basePath.replace(/^\//, "") as SeoPackageSection;
    const page = clampHubPage(requested, publicHubCount(section));
    const path = hubPageHref(basePath, page);
    return {
      title: `${title} | Page ${page} | Anomaly Box`,
      description,
      alternates: { canonical: path },
      openGraph: {
        title: `${title} | Page ${page} | Anomaly Box`,
        description,
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
