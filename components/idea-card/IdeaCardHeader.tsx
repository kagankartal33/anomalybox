import { Clock, Film, Sparkles, Target } from "lucide-react";
import type { IdeaCard } from "@/lib/idea-card";

export function IdeaCardHeader({ card }: { card: IdeaCard }) {
  return (
    <header className="rounded-xl border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-plum-soft px-3 py-1 text-xs font-semibold tracking-wide text-plum-deep uppercase">
            {card.category || "General"}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink/75">
            <Film className="h-3.5 w-3.5 text-ink/50" />
            {card.format || "Reel"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-ink/60">
          <Clock className="h-3.5 w-3.5" />
          <span>{card.durationSeconds}s Duration</span>
        </div>
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {card.title}
      </h1>

      <div className="mt-5 grid gap-4 border-t border-ink/10 pt-4 sm:grid-cols-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-plum">
            <Sparkles className="h-3.5 w-3.5" />
            Concept Premise
          </div>
          <p className="text-sm leading-6 text-ink/80">{card.conceptSummary}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal">
            <Target className="h-3.5 w-3.5" />
            Viewer Takeaway
          </div>
          <p className="text-sm leading-6 text-ink/80">{card.viewerTakeaway}</p>
        </div>
      </div>

      {card.productionEstimate && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg bg-paper p-3 text-xs text-ink/70">
          <span className="font-semibold text-ink">Estimated Production:</span>
          <span>Shoot: {card.productionEstimate.captureMinutesLow}-{card.productionEstimate.captureMinutesHigh} min</span>
          <span>Edit: {card.productionEstimate.editMinutesLow}-{card.productionEstimate.editMinutesHigh} min</span>
          <span className="capitalize">Confidence: {card.productionEstimate.confidence}</span>
        </div>
      )}
    </header>
  );
}
