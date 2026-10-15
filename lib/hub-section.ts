import { hubPageCount } from "@/lib/hub-pagination";
import { seoPackageBySection, seoPackagePages, type SeoPackageSection } from "@/lib/seo-package";
import { isPurchaseProtectedTemplate } from "@/lib/template-policy";

export const PUBLIC_HUB_SECTIONS = [
  "content-ideas",
  "reels",
  "resources",
  "creator-lanes",
  "creator-personas",
  "services",
  "tools",
] as const satisfies readonly SeoPackageSection[];

export function publicHubCount(section: SeoPackageSection) {
  // /resources is the full public library. Other hubs are one registry section.
  const items = section === "resources" ? seoPackagePages : seoPackageBySection(section);
  return items.filter((item) => !isPurchaseProtectedTemplate(item)).length;
}

export function generateHubPagedParams(section: SeoPackageSection) {
  const total = hubPageCount(publicHubCount(section));
  return Array.from({ length: total }, (_, index) => ({ page: String(index + 1) })).filter((item) => item.page !== "1");
}
