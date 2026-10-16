import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { PublicShell } from "@/components/PublicShell";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SampleBriefModal } from "@/components/SampleBriefModal";
import type { SeoPackagePage } from "@/lib/seo-package";
import {
  relatedLinksForSlug,
  sectionLabel,
  versionedSeoPackageHeroImage,
} from "@/lib/seo-package";
import { siteUrl } from "@/lib/env";
import { consolidationClusterForWinner } from "@/lib/seo-consolidation";
import { articleJsonLd, breadcrumbJsonLd, cleanAlt } from "@/lib/seo-metadata";
import { isPurchaseProtectedTemplate } from "@/lib/template-policy";

function getSmartStoreLink(page: SeoPackagePage) {
  const text = `${page.slug} ${page.keyword} ${page.title}`.toLowerCase();
  if (/coffee|cafe|espresso|roaster/.test(text)) {
    return {
      href: "/store?box=viral_box_500&category=cafe_coffee_culture",
      label: "Configure Coffee Culture Shoot Brief",
    };
  }
  if (/beauty|skincare|makeup|cosmetics/.test(text)) {
    return {
      href: "/store?box=viral_box_500&category=beauty_cosmetics_skincare",
      label: "Configure Beauty Shoot Brief",
    };
  }
  if (/fashion|style|outfit|wardrobe|clothing/.test(text)) {
    return {
      href: "/store?box=viral_box_500&category=fashion_apparel_style",
      label: "Configure Fashion Shoot Brief",
    };
  }
  if (/food|recipe|restaurant|dining|baking/.test(text)) {
    return {
      href: "/store?box=viral_box_500&category=food_dining_culinary",
      label: "Configure Food & Dining Shoot Brief",
    };
  }
  if (/travel|hotel|resort|hospitality/.test(text)) {
    return {
      href: "/store?box=viral_box_500&category=travel_hospitality_places",
      label: "Configure Travel Shoot Brief",
    };
  }
  if (/fitness|workout|gym|running|wellness/.test(text)) {
    return {
      href: "/store?box=viral_box_500&category=fitness_wellness_athletics",
      label: "Configure Fitness Shoot Brief",
    };
  }
  if (/tech|software|saas|gadget|ai/.test(text)) {
    return {
      href: "/store?box=viral_box_500&category=technology_software_gadgets",
      label: "Configure Tech Shoot Brief",
    };
  }
  return {
    href: "/store?box=viral_box_500",
    label: "Configure Your Shoot Brief",
  };
}

type Props = {
  page: SeoPackagePage;
  markdown: string;
  showPurchaseProtectedLinks?: boolean;
};

export function SeoPackageArticle({ page, markdown, showPurchaseProtectedLinks = false }: Props) {
  const base = siteUrl();
  const heroImage = versionedSeoPackageHeroImage(page.image);
  const sectionHref = `/${page.section}`;
  const sectionName = sectionLabel(page.section);
  const smartStore = getSmartStoreLink(page);
  // Cluster winners absorb merged guides, so they carry the contextual links to the money pages.
  const moneyLinks = consolidationClusterForWinner(page.path)?.moneyLinks ?? [];
  const related = relatedLinksForSlug(page.slug, 8)
    .filter((item) => showPurchaseProtectedLinks || !isPurchaseProtectedTemplate(item))
    .slice(0, 5);

  // The layout owns the H1 and the single related-links module. Older source
  // articles may still contain an embedded Related guides block, so remove it
  // before rendering to prevent duplicate headings and non-authoritative links.
  const body = stripEmbeddedRelatedGuides(markdown.replace(/^#\s+.+\n+/, ""));

  const published = page.datePublished || page.dateModified;
  const modified = page.dateModified || page.datePublished;
  const articleLd = articleJsonLd(base, {
    title: page.title,
    description: page.description,
    canonicalPath: page.path,
    image: heroImage,
    imageAlt: cleanAlt(page.imageAlt, page.title),
    keywords: [page.keyword, ...(page.secondaryKeywords || [])],
    published,
    modified,
    schemaType: page.schemaType === "Service" ? "Service" : "Article",
    markdown: body,
  });
  const breadcrumbLd = breadcrumbJsonLd(base, [
    { name: "Home", path: "/" },
    { name: sectionName, path: sectionHref },
    { name: page.title, path: page.path },
  ]);

  return (
    <PublicShell>
      <JsonLd data={[...articleLd, breadcrumbLd]} />
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="text-sm font-medium text-ink/60" aria-label="Breadcrumb">
            <Link href={sectionHref} className="transition hover:text-plum-deep">
              {sectionName}
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-ink/40">Guide</span>
          </nav>
          <span className="rounded-full border border-plum-deep/20 bg-plum-soft/40 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-plum-deep">
            {sectionName}
          </span>
        </div>

        <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl">
          {page.title}
        </h1>
        <p className="mt-6 text-xl font-normal leading-relaxed text-ink/70">{page.description}</p>

        <figure className="my-10 overflow-hidden rounded-2xl border border-ink/10 bg-plum-soft/20 shadow-lg">
          <Image
            src={heroImage}
            alt={page.imageAlt}
            width={1600}
            height={900}
            priority={page.pageType === "pillar"}
            sizes="(max-width: 896px) 100vw, 896px"
            className="w-full rounded-xl object-cover"
          />
        </figure>

        <div className="mt-4">
          <MarkdownRenderer content={body} />
        </div>

        {moneyLinks.length > 0 && (
          <p className="mt-10 border-l-2 border-plum-deep/40 pl-4 leading-relaxed text-ink/75">
            Ready to film instead of plan? You can{" "}
            {moneyLinks.map((link, index) => (
              <Fragment key={link.href}>
                {index > 0 ? (index === moneyLinks.length - 1 ? ", or " : ", ") : null}
                <Link
                  href={link.href}
                  className="font-semibold text-plum-deep underline decoration-plum-deep/30 underline-offset-4 transition hover:decoration-plum-deep"
                >
                  {link.label}
                </Link>
              </Fragment>
            ))}
            .
          </p>
        )}

        {related.length > 0 && (
          <section className="mt-14 border-t border-ink/10 pt-10" aria-labelledby="related-guides-heading">
            <h2 id="related-guides-heading" className="text-2xl font-bold text-ink">
              Related guides
            </h2>
            <p className="mt-2 text-sm text-ink/60">
              Continue with the most useful next step for your format, workflow, or production constraint.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={item.path}
                    className="focus-ring block rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-plum-deep/30 hover:bg-plum-soft/30"
                  >
                    {item.anchorText}
                    <span className="mt-1 block text-xs font-medium text-ink/60">
                      {sectionLabel(item.section)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <aside className="mt-16 rounded-3xl border border-plum/25 bg-plum-soft/35 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-ink">Want a shoot-ready brief, not another idea list?</h2>
          <p className="mt-3 leading-relaxed text-ink/70">
            Anomaly Box turns the strategy in this guide into private, scene-by-scene shoot briefs inside Creator Vault—with camera notes, scripts, and claim safety boundaries.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href={smartStore.href}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3 font-semibold text-white shadow-md transition hover:bg-plum-deep"
            >
              {smartStore.label} <ArrowRight className="h-4 w-4" />
            </Link>
            <SampleBriefModal
              triggerVariant="outline"
              triggerLabel="Preview Sample Brief"
              triggerClassName="focus-ring inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-white px-5 py-3 font-semibold text-ink transition hover:bg-paper"
            />
            <Link
              href="/resources"
              className="focus-ring inline-flex rounded-xl border border-ink/15 bg-white px-5 py-3 font-semibold text-ink transition hover:bg-plum-soft"
            >
              All creator guides
            </Link>
          </div>
        </aside>
      </article>
    </PublicShell>
  );
}

export function stripEmbeddedRelatedGuides(markdown: string): string {
  const lines = markdown.split("\n");
  const cleaned: string[] = [];
  let skipping = false;

  for (const line of lines) {
    if (/^##\s+Related guides\s*$/i.test(line.trim())) {
      skipping = true;
      continue;
    }
    if (skipping && /^##\s+/.test(line)) {
      skipping = false;
    }
    if (!skipping) cleaned.push(line);
  }

  return cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
