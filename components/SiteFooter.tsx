import Link from "next/link";
import { BRAND_PROFILES } from "@/lib/brand-profiles";
import { INTERACTIVE_TOOLS } from "@/lib/interactive-tools";
import Image from "next/image";
import { premiumAssets } from "@/lib/premium-assets";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-[#FAF7F2] text-ink">
      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-6 py-14 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="inline-block focus-ring rounded-sm">
              <Image
                src={premiumAssets.brand.logo}
                alt="Anomaly Box"
                width={200}
                height={45}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ink/65">
              Private Instagram shoot briefs for creators, brands, and agencies.
            </p>
            <div className="mt-5">
              <Link
                href="/store"
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-plum-deep hover:underline"
              >
                Choose your brief package →
              </Link>
            </div>

            {/* Social channels */}
            <div className="mt-5 flex items-center gap-2.5 text-ink/60">
              <a
                href={BRAND_PROFILES.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-white hover:text-ink hover:border-ink/30 transition"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href={BRAND_PROFILES.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-white hover:text-ink hover:border-ink/30 transition"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>
              <a
                href={BRAND_PROFILES.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-white hover:text-ink hover:border-ink/30 transition"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href={BRAND_PROFILES.medium}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Medium"
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-white hover:text-ink hover:border-ink/30 transition"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
                </svg>
              </a>
              <a
                href={BRAND_PROFILES.substack}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Substack"
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-white hover:text-ink hover:border-ink/30 transition"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Direction & Store */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-ink/60">Direction &amp; Store</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/store" className="text-ink/75 transition hover:text-ink">
                  Store Catalog
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-ink/75 transition hover:text-ink">
                  Pricing &amp; Packages
                </Link>
              </li>
              <li>
                <Link href="/atelier" className="text-ink/75 transition hover:text-ink">
                  Atelier Black Box
                </Link>
              </li>
              <li>
                <Link href="/dossiers/classic-red" className="text-ink/75 transition hover:text-ink">
                  Classic Red Brief
                </Link>
              </li>
              <li>
                <Link href="/dossiers/signature-purple" className="text-ink/75 transition hover:text-ink">
                  Signature Purple Brief
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-ink/75 transition hover:text-ink">
                  Services &amp; Packages
                </Link>
              </li>
            </ul>
          </div>

          {/* Content & Intelligence */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-ink/60">Content &amp; Strategy</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/content-ideas" className="text-ink/75 transition hover:text-ink">
                  Content Ideas
                </Link>
              </li>
              <li>
                <Link href="/creator-lanes" className="text-ink/75 transition hover:text-ink">
                  Creator Lanes (25 Niches)
                </Link>
              </li>
              <li>
                <Link href="/creator-personas" className="text-ink/75 transition hover:text-ink">
                  Creator Personas
                </Link>
              </li>
              <li>
                <Link href="/reels" className="text-ink/75 transition hover:text-ink">
                  Reels Guides &amp; Shot Plans
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-ink/75 transition hover:text-ink">
                  Creator Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Interactive Tools */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-ink/60">Interactive Tools</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/tools" className="text-ink/75 transition hover:text-ink">
                  Creator Tools Hub
                </Link>
              </li>
              {INTERACTIVE_TOOLS.map((tool) => (
                <li key={tool.href}>
                  <Link href={tool.href} className="text-ink/75 transition hover:text-ink">
                    {tool.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/tools/content-pillar-builder" className="text-ink/75 transition hover:text-ink">
                  Pillar Builder
                </Link>
              </li>
              <li>
                <Link href="/tools/creator-brief-scorecard" className="text-ink/75 transition hover:text-ink">
                  Brief Scorecard
                </Link>
              </li>
              <li>
                <Link href="/tools/creator-mode-selector" className="text-ink/75 transition hover:text-ink">
                  Mode Selector
                </Link>
              </li>
              <li>
                <Link href="/tools/content-concept-stress-test" className="text-ink/75 transition hover:text-ink">
                  Concept Stress Test
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-ink/60">Platform &amp; Trust</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="text-ink/75 transition hover:text-ink">
                  About Anomaly Box
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="text-ink/75 transition hover:text-ink">
                  Brief Methodology
                </Link>
              </li>
              <li>
                <Link href="/legal" className="text-ink/75 transition hover:text-ink">
                  Legal &amp; Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-ink/75 transition hover:text-ink">
                  Sign in / Creator Vault
                </Link>
              </li>
              <li>
                <a href="mailto:support@anomalybox.com" className="text-ink/75 transition hover:text-ink">
                  support@anomalybox.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-ink/10 bg-white/70 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-xs text-ink/60 sm:flex-row">
          <div>
            © {new Date().getFullYear()} Anomaly Box. All rights reserved. Campaign-ready creative direction for creators.
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/legal#privacy" className="hover:text-ink underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/legal#terms" className="hover:text-ink underline-offset-2 hover:underline">
              Terms of Service
            </Link>
            <Link href="/feed.xml" className="hover:text-ink underline-offset-2 hover:underline">
              RSS Feed
            </Link>
            <Link href="/llms.txt" className="hover:text-ink underline-offset-2 hover:underline">
              LLMs.txt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
