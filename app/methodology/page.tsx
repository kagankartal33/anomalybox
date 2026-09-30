import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "Creator Brief Methodology | Anomaly Box",
  description: "How Anomaly Box structures creator briefs around audience goal, visible action, shot language, edit logic, and claim-aware execution.",
  alternates: { canonical: "/methodology" },
};

const stages = [
  ["Goal", "Define the useful audience outcome and the strategic reason the content should exist."],
  ["Action", "Translate the idea into visible behavior that a creator can perform or capture."],
  ["Language", "Use spoken lines and on-screen text only when they improve comprehension."],
  ["Shot", "Choose framing that makes the proof legible and supports the intended brand effect."],
  ["Edit", "Build rhythm around meaning, continuity, and payoff instead of decorative motion."],
  ["Safety", "Remove unsupported claims, hidden sponsorship, and guarantees the footage cannot prove."],
];

export default function MethodologyPage() {
  return (
    <PublicShell>
      <article className="mx-auto max-w-5xl py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum-deep">Methodology</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[1.02]">A brief is ready when every instruction can survive the shoot.</h1>
        <p className="mt-7 max-w-3xl text-xl leading-9 text-ink/65">Our framework connects strategy to production without hiding uncertainty behind trend language or performance guarantees.</p>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stages.map(([title, copy], index) => <section key={title} className="rounded-xl border border-ink/10 bg-white p-6"><div className="text-xs font-semibold text-plum-deep">0{index + 1}</div><h2 className="mt-2 text-2xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-ink/60">{copy}</p></section>)}
        </div>
      </article>
    </PublicShell>
  );
}