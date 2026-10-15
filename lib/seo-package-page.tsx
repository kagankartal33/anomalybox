/**
 * Shared generateMetadata + page body helpers for SEO package section routes.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoPackageArticle } from "@/components/SeoPackageArticle";
import { TemplatePurchaseGate } from "@/components/TemplatePurchaseGate";
import {
  seoPackageByPath,
  seoPackageStaticParams,
  versionedSeoPackageHeroImage,
  type SeoPackageSection,
} from "@/lib/seo-package";
import { getSeoPackageMarkdown } from "@/lib/seo-package-markdown";
import { siteUrl } from "@/lib/env";
import { publicMetadata } from "@/lib/seo-metadata";
import { getTemplateAccessState, hasTemplatePurchaseAccess } from "@/lib/template-access";
import { isPurchaseProtectedTemplate } from "@/lib/template-policy";

type PackageRouteOptions = {
  requiresPurchase?: boolean;
  excludePurchaseProtected?: boolean;
};

const protectedMetadata: Metadata = {
  title: "Customer Resource Library | Anomaly Box",
  description: "Private production resources for customers with a completed Anomaly Box purchase.",
  robots: { index: false, follow: false },
};

export function packageGenerateStaticParams(section: SeoPackageSection, options: PackageRouteOptions = {}) {
  return () =>
    seoPackageStaticParams(section).filter(({ slug }) => {
      if (!options.excludePurchaseProtected) return true;
      const page = seoPackageByPath(section, slug);
      return !page || !isPurchaseProtectedTemplate(page);
    });
}

export function packageGenerateMetadata(section: SeoPackageSection, options: PackageRouteOptions = {}) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ slug: string }>;
  }): Promise<Metadata> {
    const { slug } = await params;
    const page = seoPackageByPath(section, slug);
    if (!page) return {};
    if (options.excludePurchaseProtected && isPurchaseProtectedTemplate(page)) return protectedMetadata;
    if (options.requiresPurchase) {
      const accessState = await getTemplateAccessState();
      if (!hasTemplatePurchaseAccess(accessState)) return protectedMetadata;
    }
    const published = page.datePublished || page.dateModified;
    const modified = page.dateModified || page.datePublished;
    return publicMetadata(siteUrl(), {
      title: page.seoTitle || page.title,
      description: page.description,
      canonicalPath: page.path,
      image: versionedSeoPackageHeroImage(page.image),
      imageAlt: page.imageAlt,
      keywords: [page.keyword, ...(page.secondaryKeywords || []), "Anomaly Box", "Creator Direction"],
      published,
      modified,
      schemaType: page.schemaType === "Service" ? "Service" : "Article",
    });
  };
}

export function packagePage(section: SeoPackageSection, options: PackageRouteOptions = {}) {
  return async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const page = seoPackageByPath(section, slug);
    if (!page) notFound();
    if (options.excludePurchaseProtected && isPurchaseProtectedTemplate(page)) notFound();
    if (options.requiresPurchase) {
      const accessState = await getTemplateAccessState();
      if (!hasTemplatePurchaseAccess(accessState)) {
        return <TemplatePurchaseGate accessState={accessState} returnPath={page.path} />;
      }
    }
    const markdown = getSeoPackageMarkdown(slug);
    if (!markdown) notFound();
    return (
      <SeoPackageArticle
        page={page}
        markdown={markdown}
        showPurchaseProtectedLinks={Boolean(options.requiresPurchase)}
      />
    );
  };
}
