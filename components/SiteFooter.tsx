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
