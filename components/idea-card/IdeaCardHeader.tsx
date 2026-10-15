import { Sparkles, ArrowRight } from "lucide-react";
import type { PresentedCard } from "@/lib/idea-card";
import { CardExportActions } from "./CardExportActions";

export function IdeaCardHeader({
  card,
  onShootMode,
}: {
  card: PresentedCard;
  onShootMode: () => void;
}) {
  const meta: Array<{ label: string; value: string }> = [
    { label: "Format", value: card.meta.format },
    { label: "Final video", value: card.meta.durationLabel },
    { label: "Difficulty", value: card.meta.difficultyLabel },
  ];

  if (card.meta.filmingEstimateLabel) {
    meta.push({ label: "Estimated filming", value: card.meta.filmingEstimateLabel });
  }

  if (card.meta.categoryLabel) {
    meta.push({ label: "Lane", value: card.meta.categoryLabel });
  }
  if (card.meta.shootFormatLabel) {
    meta.push({ label: "Shoot", value: card.meta.shootFormatLabel });
  }
  if (card.meta.presenceLabel) {
    meta.push({ label: "Presence", value: card.meta.presenceLabel });
  }

  const insight = card.algorithmicInsight;

  // Use narrative spine if present; otherwise derive from step stages
  const spineItems =
    card.storySpine && card.storySpine.length > 0
      ? card.storySpine
      : card.steps.map((s) => s.stageLabel || s.purpose);

  const scrollToScene = (index: number) => {
    const el = document.getElementById(`scene-${index + 1}`) || document.getElementById("section-shoot");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header
      id="section-brief"
      className="scroll-mt-14 rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-7"
    >
      {/* Top Header: Category Tag & Direct Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-ink/5 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-plum">
            Private Shoot Brief
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold leading-tight tracking-tight text-ink">
            {card.title}
          </h1>
        </div>
        <div className="sm:self-start shrink-0">
          <CardExportActions card={card} onShootMode={onShootMode} />
        </div>
      </div>

      {/* THE BILLBOARD HOOK — Hero Visual Slate for the First 3 Seconds */}
      <div className="mt-5 rounded-xl border border-plum/20 bg-paper/90 p-5 sm:p-6 transition hover:border-plum/30">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-plum">
            <Sparkles className="h-3 w-3 text-plum" aria-hidden="true" />
            The Opening Hook (0:00 &ndash; 0:03)
          </span>
          {insight?.isAlgorithmicReasonValid && (insight.hookNameEn || insight.hookTypeId) ? (
            <span className="rounded-full bg-plum/10 px-2.5 py-0.5 text-[10px] font-bold text-plum-deep">
              {insight.hookNameEn ||
                (insight.hookTypeId
                  ? insight.hookTypeId.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())
                  : "Opening hook")}
            </span>
          ) : null}
        </div>

        {/* Hero Hook Headline */}
        <blockquote className="font-serif text-2xl sm:text-3xl italic font-normal text-ink leading-snug">
          &ldquo;{card.hookLine}&rdquo;
        </blockquote>

        {/* Strategic Reason under Hook */}
        <div className="mt-4 grid gap-3 border-t border-ink/5 pt-3 sm:grid-cols-2 text-xs sm:text-sm">
          {card.whyItWorks ? (
            <div>
              <span className="font-semibold text-ink">Why viewers stop scrolling: </span>
              <span className="text-ink/75">{card.whyItWorks}</span>
            </div>
          ) : null}
          {card.viewerLeaveWith ? (
            <div>
              <span className="font-semibold text-ink">What they keep: </span>
              <span className="text-ink/75">{card.viewerLeaveWith}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* NARRATIVE ROADMAP (The Story Spine) — 10,000-Foot View of the Video */}
      {spineItems.length > 0 ? (
        <div className="mt-5 rounded-xl border border-ink/10 bg-[#FAF8F5] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50">
              Story Spine &middot; Video Flow
            </p>
            <span className="text-[11px] text-ink/45 hidden sm:inline">
              Click any beat to jump to scene
            </span>
          </div>

          <ol className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1">
            {spineItems.map((beat, idx) => (
              <li key={idx} className="flex items-center gap-2 flex-1 min-w-[140px]">
                <button
                  type="button"
                  onClick={() => scrollToScene(idx)}
                  className="group flex items-center gap-2 w-full text-left rounded-lg border border-ink/10 bg-white p-2.5 sm:p-3 hover:border-plum/40 hover:bg-plum-soft/20 transition focus-ring"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-plum-soft text-[10px] font-bold text-plum-deep group-hover:bg-plum group-hover:text-white transition">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-ink/85 line-clamp-2 leading-snug">
                    {beat}
                  </span>
                </button>
                {idx < spineItems.length - 1 && (
                  <ArrowRight
                    className="h-3.5 w-3.5 shrink-0 text-ink/25 hidden sm:block"
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {/* Production Specs & Required Kit */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 pt-4">
        <dl className="flex flex-wrap gap-2" aria-label="Brief metadata">
          {meta.map((item) => (
            <div
              key={item.label}
              className="rounded-full border border-plum/15 bg-plum-soft/50 px-3 py-1 text-xs font-medium text-ink/75"
              aria-label={`${item.label}: ${item.value}`}
            >
              <dt className="sr-only">{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>

        {card.kit.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-ink/40 mr-1">Kit:</span>
            {card.kit.map((item) => (
              <span
                key={item}
                className="rounded-md border border-ink/10 bg-paper px-2.5 py-0.5 text-xs text-ink/75 font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
