import type { IdeaCard } from "@/lib/idea-card";
import { formatTimeRange, stageLabel } from "@/lib/idea-card";
import { premiumAssets } from "@/lib/premium-assets";
import { CardGuideFigure } from "./CardGuideFigure";

export function VideoFlowOverview({ card }: { card: IdeaCard }) {
  return (
    <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-soft sm:p-6" aria-labelledby="video-flow-heading">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-plum">Sequence map</p>
      <h2 id="video-flow-heading" className="mt-1 text-2xl font-semibold tracking-tight text-ink">
        Video Flow
      </h2>
      <p className="mt-1 text-sm leading-6 text-ink/55">Timeline overview — what each step is for.</p>

      <div className="mt-5">
        <CardGuideFigure
          src={premiumAssets.cardGuides.videoFlow}
          alt="A premium creator studio storyboard showing five connected beats from opening hook to final payoff"
          eyebrow="How to read the sequence"
          title="One idea, five deliberate beats"
          description="Treat each step as a transition in attention: establish, build, demonstrate, prove, and close."
        />
      </div>

      <ol className="mt-5 space-y-3">
        {card.steps.map((step) => (
          <li
            key={step.id}
            className="grid gap-2 rounded-lg border border-ink/10 bg-paper px-3 py-3 sm:grid-cols-[88px_120px_1fr] sm:items-center sm:gap-3 sm:px-4"
          >
            <span className="text-sm font-semibold tabular-nums text-ink/70">
              {formatTimeRange(step.startSecond, step.endSecond)}
            </span>
            <span className="inline-flex w-fit items-center rounded-full border border-plum/15 bg-white px-2.5 py-1 text-xs font-semibold text-plum-deep">
              {stageLabel(step.stage, step.customStageLabel)}
            </span>
            <p className="text-[15px] leading-6 text-ink/80">{step.purpose}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}