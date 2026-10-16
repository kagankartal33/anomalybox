import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PublicShell } from "@/components/PublicShell";
import { BRAND_PROFILES } from "@/lib/brand-profiles";
import { siteUrl } from "@/lib/env";
import { INTERACTIVE_TOOLS } from "@/lib/interactive-tools";
import { BOX_PRICING, BRIEF_INCLUDES, boxPriceLabel } from "@/lib/pricing";
import { breadcrumbJsonLd } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "About Anomaly Box | Private Creative Direction",
  description:
    "Anomaly Box writes private Instagram shoot briefs matched to one lane and one creator mode. How briefs are made, checked, delivered and replaced.",
  alternates: { canonical: "/about" },
};

export const revalidate = 300;

const principles = [
  ["Settle the shoot", "Every brief answers what to film, in what order, and what to say before the camera is on."],
  ["Match before writing", "Briefs are written for the creator lane and creator mode you choose, not reused across niches."],
  ["Proof over promises", "Claims a creator cannot show on camera are removed, and every brief lists what not to claim."],
  ["No performance guarantees", "Views, comments, sales and virality depend on the platform and the audience, not on a brief."],
];

const qualitySteps = [
  "Stock is checked for your exact lane and creator mode before checkout opens, so you never pay for a match that is not ready.",
  "Each brief follows the same structure: goal, visible action, spoken lines and on-screen text, shot choice, edit rhythm and claim safety.",
  "If a brief is unclear or the wrong fit, you report it from Creator Vault with a short note. The team reviews it and can replace the brief.",
];

const profileLinks = [
  ["Instagram", BRAND_PROFILES.instagram],
  ["TikTok", BRAND_PROFILES.tiktok],
  ["YouTube", BRAND_PROFILES.youtube],
  ["Medium", BRAND_PROFILES.medium],
  ["Substack", BRAND_PROFILES.substack],
] as const;

export default function AboutPage() {
  const base = siteUrl();
  return (
    <PublicShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About Anomaly Box",
          url: `${base}/about`,
          mainEntity: { "@id": `${base}/#organization` },
        }}
      />
      <JsonLd data={breadcrumbJsonLd(base, [{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />

      <article className="mx-auto max-w-4xl space-y-14 py-12">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum-deep">About Anomaly Box</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[1.02]">A brief should settle the shoot, not add another idea pile.</h1>
          <p className="mt-7 text-xl leading-9 text-ink/70">
            Anomaly Box writes private Instagram shoot briefs. You choose a small set matched to one creator lane and one creator
            mode, and the briefs arrive in your Creator Vault ready to film.
          </p>
        </header>

        <section aria-labelledby="why-heading">
          <h2 id="why-heading" className="text-3xl font-semibold">Why it exists</h2>
          <p className="mt-4 leading-8 text-ink/75">
            Most creators do not run out of ideas; they run out of decisions made in advance. A list of trends still leaves the
            opening, the scene order, the framing and the words to be worked out on shoot day. Anomaly Box moves those decisions into
            a written brief, so the time on set goes into filming instead of planning.
          </p>
        </section>

        <section aria-labelledby="principles-heading">
          <h2 id="principles-heading" className="text-3xl font-semibold">How we work</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {principles.map(([title, copy]) => (
              <div key={title} className="rounded-xl border border-ink/10 bg-white p-5">
                <dt className="font-semibold">{title}</dt>
                <dd className="mt-2 leading-7 text-ink/75">{copy}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 leading-7 text-ink/75">
            The full framework is on the{" "}
            <Link href="/methodology" className="font-semibold text-plum-deep underline-offset-4 hover:underline">
              methodology page
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="brief-heading">
          <h2 id="brief-heading" className="text-3xl font-semibold">What a brief contains</h2>
          <ul className="mt-5 list-disc space-y-2 pl-6 leading-7 text-ink/80">
            {BRIEF_INCLUDES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-5 leading-7 text-ink/75">
            Packages:{" "}
            <Link href="/dossiers/classic-red" className="font-semibold text-plum-deep underline-offset-4 hover:underline">
              Classic Red
            </Link>{" "}
            ({BOX_PRICING.viral_box_500.briefCount} briefs, {boxPriceLabel("viral_box_500")}),{" "}
            <Link href="/dossiers/signature-purple" className="font-semibold text-plum-deep underline-offset-4 hover:underline">
              Signature Purple
            </Link>{" "}
            ({BOX_PRICING.premium_viral_box_1000.briefCount} briefs, {boxPriceLabel("premium_viral_box_1000")}) and the custom{" "}
            <Link href="/atelier" className="font-semibold text-plum-deep underline-offset-4 hover:underline">
              Atelier
            </Link>{" "}
            brief for launches and sponsor work. Compare them on the{" "}
            <Link href="/pricing" className="font-semibold text-plum-deep underline-offset-4 hover:underline">
              pricing page
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="quality-heading">
          <h2 id="quality-heading" className="text-3xl font-semibold">Quality checks and replacements</h2>
          <ol className="mt-5 list-decimal space-y-3 pl-6 leading-7 text-ink/80">
            {qualitySteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="free-heading">
          <h2 id="free-heading" className="text-3xl font-semibold">Free guides and tools</h2>
          <p className="mt-4 leading-8 text-ink/75">
            The{" "}
            <Link href="/resources" className="font-semibold text-plum-deep underline-offset-4 hover:underline">
              creator guide library
            </Link>{" "}
            covers planning, filming and editing short-form video. The interactive tools are free to use:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-ink/80">
            {INTERACTIVE_TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link href={tool.href} className="font-semibold text-plum-deep underline-offset-4 hover:underline">
                  {tool.title}
                </Link>{" "}
                — {tool.description}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="policy-heading">
          <h2 id="policy-heading" className="text-3xl font-semibold">Policies and contact</h2>
          <p className="mt-4 leading-8 text-ink/75">
            Briefs are digital goods and count as delivered once they appear in Creator Vault; filming is not included. Terms,
            privacy and the digital goods policy are on the{" "}
            <Link href="/legal" className="font-semibold text-plum-deep underline-offset-4 hover:underline">
              legal page
            </Link>
            . For questions, write to{" "}
            <a href="mailto:support@anomalybox.com" className="font-semibold text-plum-deep underline-offset-4 hover:underline">
              support@anomalybox.com
            </a>
            .
          </p>
          <p className="mt-4 leading-8 text-ink/75">
            Follow Anomaly Box on{" "}
            {profileLinks.map(([label, href], index) => (
              <span key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-plum-deep underline-offset-4 hover:underline">
                  {label}
                </a>
                {index < profileLinks.length - 2 ? ", " : index === profileLinks.length - 2 ? " and " : "."}
              </span>
            ))}
          </p>
        </section>
      </article>
    </PublicShell>
  );
}
