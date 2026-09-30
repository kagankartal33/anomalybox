import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "About Anomaly Box | Private Creative Direction",
  description: "Anomaly Box builds private, execution-ready creative direction for creators without promising reach, engagement, or virality.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PublicShell>
      <article className="mx-auto max-w-4xl py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum-deep">About Anomaly Box</p>
        <h1 className="mt-4 text-5xl font-semibold leading-[1.02]">Creative direction should reduce uncertainty, not add more noise.</h1>
        <p className="mt-7 text-xl leading-9 text-ink/65">Anomaly Box is a private creator workspace for structured, execution-ready briefs. Each dossier is matched to a creator lane and production mode, then delivered to a secure Creator Vault.</p>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <section><h2 className="text-3xl font-semibold">What we make</h2><p className="mt-4 leading-8 text-ink/62">Clear creative goals, scene flow, shot direction, spoken lines, on-screen text, edit notes, performance notes, and safety boundaries designed to work together.</p></section>
          <section><h2 className="text-3xl font-semibold">What we do not promise</h2><p className="mt-4 leading-8 text-ink/62">No brief can guarantee reach, engagement, sales, or virality. Platform distribution and audience response remain outside any creator strategy provider’s control.</p></section>
        </div>
      </article>
    </PublicShell>
  );
}