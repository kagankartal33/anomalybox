import type { PresentedCard } from "@/lib/idea-card";

/**
 * VideoFlowOverview
 * Timeline map of all beats in the video.
 * Simplified: no timestamp pressure or technical jargon.
 */
export function VideoFlowOverview({ card }: { card: PresentedCard }) {
  const steps = [...card.steps].sort((a, b) => a.order - b.order);
  const total = steps.length;

  return (
    <section
      id="section-flow"
      className="scroll-mt-14 rounded-xl border border-ink/10 bg-white p-5 shadow-soft sm:p-6"
      aria-labelledby="video-flow-heading"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-plum">
            Flow
          </p>
          <h2
            id="video-flow-heading"
            className="mt-1 text-2xl font-semibold tracking-tight text-ink"
          >
            Video flow
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink/55">
            See the job of each scene and the line you say.
          </p>
        </div>

        {/* Total beat count badge */}
        <div className="shrink-0 rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs font-semibold text-ink/55">
          {total} scenes
        </div>
      </div>

      {/* Timeline list */}
      <ol className="mt-5 space-y-0" aria-label="Scene order">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const hasSpokenPreview = Boolean(step.spokenLine?.trim());

          return (
            <li key={step.id} className="relative flex gap-3 sm:gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                {/* Node */}
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-plum/30 bg-plum-soft text-[10px] font-bold text-plum-deep">
                  {step.order}
                </div>
                {/* Connector */}
                {!isLast && (
                  <div className="mt-1 w-px flex-1 bg-ink/10" style={{ minHeight: "24px" }} />
                )}
              </div>

              {/* Content */}
              <div className={`min-w-0 flex-1 pb-4 ${isLast ? "pb-0" : ""}`}>
                {/* Stage badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-plum/15 bg-plum-soft/50 px-2.5 py-0.5 text-xs font-semibold text-plum-deep">
                    Scene {step.order}: {step.stageLabel}
                  </span>
                </div>

                {/* Purpose — main text */}
                <p className="mt-1 text-[15px] font-semibold leading-snug text-ink sm:text-base">
                  {step.purpose}
                </p>

                {/* Spoken line preview — only if available */}
                {hasSpokenPreview && (
                  <p className="mt-1 truncate text-sm italic leading-snug text-ink/50">
                    <span className="not-italic text-plum mr-1">&ldquo;</span>
                    {step.spokenLine}
                    <span className="not-italic text-plum ml-1">&rdquo;</span>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
