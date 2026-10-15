import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "About Anomaly Box | Private Creative Direction",
  description: "Anomaly Box sells private Instagram shoot briefs. We do not promise views, sales, or virality.",
  alternates: { canonical: "/about" },
};

export const revalidate = 300;

export default function AboutPage() {
  return (
    <PublicShell>
      <article className="mx-auto max-w-4xl py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum-deep">About Anomaly Box</p>
        <h1 className="mt-4 text-5xl font-semibold leading-[1.02]">A brief should settle the shoot, not add another idea pile.</h1>
        <p className="mt-7 text-xl leading-9 text-ink/65">Anomaly Box is a private vault of shoot briefs. You buy a small set matched to one lane and one creator mode. They arrive in Creator Vault.</p>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <section><h2 className="text-3xl font-semibold">What we make</h2><p className="mt-4 leading-8 text-ink/62">The opening, scene order, camera, spoken lines, on-screen text, edit notes, and the claims you should not make.</p></section>
          <section><h2 className="text-3xl font-semibold">What we do not promise</h2><p className="mt-4 leading-8 text-ink/62">Views, comments, sales, or going viral. Those depend on the platform and the audience, not on a brief.</p></section>
        </div>
      </article>
    </PublicShell>
  );
}
