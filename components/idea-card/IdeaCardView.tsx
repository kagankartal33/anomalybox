"use client";

import { useState } from "react";
import { Copy, Check, CheckSquare, Square, ShieldCheck, Film } from "lucide-react";
import type { PresentedCard } from "@/lib/idea-card";
import { ShootingModeModal } from "./ShootingModeModal";
import { CardFeedbackWidget } from "./CardFeedbackWidget";
import { CardProgressNav } from "./CardProgressNav";
import { IdeaCardHeader } from "./IdeaCardHeader";
import { ShootPlan } from "./ShootPlan";
import { VisualGuide } from "./VisualGuide";

export function IdeaCardView({ card }: { card: PresentedCard }) {
  const [shootModeOpen, setShootModeOpen] = useState(false);
  const storageKey = `anomaly_filmed_${card.id}`;
  const [filmedSet, setFilmedSet] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return new Set(JSON.parse(saved));
      } catch {
        // Ignore
      }
    }
    return new Set();
  });

  const toggleFilmed = (stepId: string) => {
    setFilmedSet((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const markAllFilmed = () => {
    const allIds = card.steps.map((s) => s.id);
    const next = new Set(allIds);
    setFilmedSet(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(allIds));
    } catch {
      // Ignore
    }
  };

  const resetFilmed = () => {
    setFilmedSet(new Set());
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
  };

  const safetyBullets =
    card.safety.bullets.length > 0
      ? card.safety.bullets
      : [
          "Keep visible addresses, private data, and unconsented faces out of frame.",
          "Confirm music, stock footage, and brand permissions.",
          "Keep claims supportable and put sponsor disclosures on screen.",
        ];

  return (
    <>
      {/* Sticky progress nav — compact and viewport-friendly */}
      <CardProgressNav onShootMode={() => setShootModeOpen(true)} />

      <div className="space-y-5">
        {/* ① Brief & Billboard Hook */}
        <IdeaCardHeader card={card} onShootMode={() => setShootModeOpen(true)} />

        {/* ② Shoot Plan (Scene-by-Scene Cue Sheet) */}
        <ShootPlan
          card={card}
          onShootMode={() => setShootModeOpen(true)}
          filmedSet={filmedSet}
          onToggleFilmed={toggleFilmed}
          onResetFilmed={resetFilmed}
        />

        {/* ⑤ Final Checklist & CapCut Subtitle Exporter */}
        <FinalChecklist
          card={card}
          productionNotes={card.overallProductionNotes}
          safetyBullets={safetyBullets}
          safetySummary={card.safety.summary}
          sectionId="section-checklist"
        />

        {/* ⑥ Visual Guide — collapsed reference */}
        <div id="section-guide" className="scroll-mt-14 print:hidden">
          <VisualGuide />
        </div>

        {/* ⑦ Card feedback */}
        <div className="print:hidden">
          <CardFeedbackWidget cardId={card.id} />
        </div>
      </div>

      {/* Shoot Mode full-screen modal */}
      <ShootingModeModal
        card={card}
        isOpen={shootModeOpen}
        onClose={() => setShootModeOpen(false)}
        onMarkAllFilmed={markAllFilmed}
      />
    </>
  );
}

/** Combined production notes + posting safety section with interactive check-off and CapCut copy */
function FinalChecklist({
  card,
  productionNotes,
  safetyBullets,
  safetySummary,
  sectionId,
}: {
  card: PresentedCard;
  productionNotes: string[];
  safetyBullets: string[];
  safetySummary: string | null;
  sectionId?: string;
}) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => new Set());
  const [copiedCaptions, setCopiedCaptions] = useState(false);

  const hasNotes = productionNotes.length > 0;
  const hasSafety = safetyBullets.length > 0;
  if (!hasNotes && !hasSafety) return null;

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  // Collect all onScreenText items across steps for 1-click export to video editor
  const textBeats = card.steps
    .filter((s) => Boolean(s.onScreenText?.trim()))
    .map((s) => `Scene ${s.order} (${s.stageLabel}): "${s.onScreenText}"`);

  const handleCopyCaptions = async () => {
    if (textBeats.length === 0) return;
    try {
      const text = textBeats.join("\n");
      await navigator.clipboard.writeText(text);
      setCopiedCaptions(true);
      setTimeout(() => setCopiedCaptions(false), 2200);
    } catch {
      // Ignore
    }
  };

  return (
    <section
      id={sectionId}
      className="scroll-mt-14 rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-7"
      aria-labelledby="final-checklist-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-ink/5 pb-4 mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-plum">
            Post-Production &amp; Release
          </p>
          <h2
            id="final-checklist-heading"
            className="mt-0.5 text-xl sm:text-2xl font-semibold tracking-tight text-ink"
          >
            Checks Before You Post
          </h2>
        </div>

        {/* CapCut / Editor Bulk Captions Copy Action */}
        {textBeats.length > 0 && (
          <button
            type="button"
            onClick={handleCopyCaptions}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ink/5 transition self-start"
            title="Copy all on-screen graphics for CapCut or Premiere"
          >
            {copiedCaptions ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied all captions</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-plum" />
                <span>Copy all on-screen text ({textBeats.length})</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Production Notes Checklist */}
        {hasNotes ? (
          <div className="rounded-xl border border-ink/10 bg-paper/70 p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/60 mb-3 flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5 text-plum" aria-hidden="true" />
              <span>Production &amp; Pacing Notes</span>
            </p>
            <ul className="space-y-2.5 text-sm leading-relaxed text-ink/80">
              {productionNotes.map((note) => {
                const isDone = checkedItems.has(note);
                return (
                  <li
                    key={note}
                    onClick={() => toggleCheck(note)}
                    className="flex items-start gap-2.5 cursor-pointer select-none rounded-md p-1 -m-1 hover:bg-white/60 transition"
                  >
                    {isDone ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-ink/30 mt-0.5 shrink-0" />
                    )}
                    <span className={isDone ? "text-ink/45 line-through decoration-ink/30" : "text-ink/85"}>
                      {note}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {/* Safety & Compliance Checklist */}
        {hasSafety ? (
          <div className="rounded-xl border border-ink/10 bg-paper/70 p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/60 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-plum" aria-hidden="true" />
              <span>Posting Safety &amp; Rights</span>
            </p>
            {safetySummary ? (
              <p className="mb-3 text-xs leading-5 text-ink/70 font-medium">{safetySummary}</p>
            ) : null}
            <ul className="space-y-2.5 text-sm leading-relaxed text-ink/80">
              {safetyBullets.map((bullet) => {
                const isDone = checkedItems.has(bullet);
                return (
                  <li
                    key={bullet}
                    onClick={() => toggleCheck(bullet)}
                    className="flex items-start gap-2.5 cursor-pointer select-none rounded-md p-1 -m-1 hover:bg-white/60 transition"
                  >
                    {isDone ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-ink/30 mt-0.5 shrink-0" />
                    )}
                    <span className={isDone ? "text-ink/45 line-through decoration-ink/30" : "text-ink/85"}>
                      {bullet}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
