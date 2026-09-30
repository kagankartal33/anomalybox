import type { IdeaCard } from "@/lib/idea-card";
import { premiumAssets } from "@/lib/premium-assets";
import { CardGuideFigure } from "./CardGuideFigure";
import { IdeaCardHeader } from "./IdeaCardHeader";
import { ShootPlan } from "./ShootPlan";
import { VideoFlowOverview } from "./VideoFlowOverview";
import { VisualGuide } from "./VisualGuide";

export function IdeaCardView({
  card,
  safetyNote,
}: {
  card: IdeaCard;
  /** Optional brand-safety blurb extracted from legacy card */
  safetyNote?: string | null;
}) {
  return (
    <div className="space-y-5">
      <IdeaCardHeader card={card} />
      <VideoFlowOverview card={card} />
      <ShootPlan card={card} />
      <VisualGuide />

      {card.overallProductionNotes?.length ? (
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-soft" aria-labelledby="production-notes-heading">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-plum">Across the full edit</p>
          <h2 id="production-notes-heading" className="mt-1 text-xl font-semibold text-ink">
            Production notes
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-6 text-ink/75">
            {card.overallProductionNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-soft sm:p-6" aria-labelledby="safety-heading">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-plum">Final review</p>
        <h2 id="safety-heading" className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          Posting safety
        </h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <CardGuideFigure
            src={premiumAssets.cardGuides.postingSafety}
            alt="A premium final review workspace with a vertical video, privacy shield, asset ownership sleeve, crop-safe frame, and approval marker"
            eyebrow="Before publishing"
            title="Review the frame, rights, and claim"
            description="Run one calm final check after the edit is locked and before the video leaves your workspace."
          />
          <div className="rounded-xl border border-ink/10 bg-[#F8F5EF] p-5">
            {safetyNote ? <p className="text-[15px] leading-7 text-ink/76">{safetyNote}</p> : null}
            <ul className={`${safetyNote ? "mt-4" : ""} space-y-3 text-sm leading-6 text-ink/68`}>
              <li className="border-b border-ink/10 pb-3"><strong className="text-ink">Privacy:</strong> remove visible addresses, personal data, and unintended faces.</li>
              <li className="border-b border-ink/10 pb-3"><strong className="text-ink">Rights:</strong> confirm music, footage, product, and sponsor usage permissions.</li>
              <li><strong className="text-ink">Accuracy:</strong> keep claims supportable and disclosures visible in the final crop.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}