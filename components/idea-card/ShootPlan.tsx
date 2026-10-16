"use client";

import { useId, useState } from "react";
import {
  ChevronDown,
  Play,
  CheckCircle2,
  Circle,
  Video,
  Type,
  Scissors,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import type { PresentedCard, PresentedStep } from "@/lib/idea-card";
import { SayThisCallout } from "./SayThisCallout";

interface ShootStepCardProps {
  step: PresentedStep;
  open: boolean;
  onToggle: () => void;
  panelId: string;
  headerId: string;
  totalSteps: number;
  isFilmed: boolean;
  onToggleFilmed: () => void;
}

function ShootStepCard({
  step,
  open,
  onToggle,
  panelId,
  headerId,
  totalSteps,
  isFilmed,
  onToggleFilmed,
}: ShootStepCardProps) {
  const [copiedText, setCopiedText] = useState(false);
  const hasSayThis = Boolean(step.spokenLine?.trim());

  const handleCopyOnScreenText = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!step.onScreenText) return;
    try {
      await navigator.clipboard.writeText(step.onScreenText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <article
      id={`scene-${step.order}`}
      className={`scroll-mt-16 overflow-hidden rounded-xl border transition duration-200 ${
        isFilmed
          ? "border-emerald-200/80 bg-emerald-50/20 shadow-xs"
          : "border-ink/10 bg-white shadow-sm hover:border-ink/20"
      }`}
    >
      <h3 className="m-0 text-base font-semibold">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
          {/* Filmed Checkbox Toggle Button */}
          <button
            type="button"
            onClick={onToggleFilmed}
            className={`focus-ring flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
              isFilmed
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : "bg-paper text-ink/60 hover:bg-ink/10 hover:text-ink"
            }`}
            title={isFilmed ? "Mark as unfilmed" : "Mark scene as filmed"}
            aria-pressed={isFilmed}
          >
            {isFilmed ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span>Filmed</span>
              </>
            ) : (
              <>
                <Circle className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
                <span className="hidden sm:inline">Mark filmed</span>
              </>
            )}
          </button>

          {/* Accordion Expand/Collapse Trigger */}
          <button
            id={headerId}
            type="button"
            className="focus-ring flex flex-1 items-center justify-between gap-3 text-left"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={onToggle}
          >
            <span className="min-w-0">
              {/* Scene Number and Stage */}
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isFilmed
                      ? "bg-emerald-100/80 text-emerald-800"
                      : "bg-plum-soft text-plum-deep"
                  }`}
                >
                  Scene {step.order}
                </span>
                <span className="text-xs font-medium text-ink/60">
                  {step.stageLabel}
                </span>
                <span className="font-mono text-[10px] text-ink/60 tabular-nums">
                  {step.order} / {totalSteps}
                </span>
              </span>

              {/* Purpose text */}
              <span
                className={`mt-1 block text-base font-semibold leading-snug sm:text-[17px] ${
                  isFilmed ? "text-ink/60 line-through decoration-ink/30" : "text-ink"
                }`}
              >
                {step.purpose}
              </span>

              {/* Spoken line preview when collapsed */}
              {!open && hasSayThis && (
                <span className="mt-1 block truncate text-sm italic text-ink/60">
                  &ldquo;{step.spokenLine}&rdquo;
                </span>
              )}
            </span>

            <ChevronDown
              className={`h-5 w-5 shrink-0 text-plum transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </h3>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="border-t border-ink/5 px-4 py-4 sm:px-5 sm:py-5 space-y-4"
        >
          {/* 1. Spoken Line (The Core Talent Cue) */}
          {hasSayThis ? (
            <SayThisCallout text={step.spokenLine!} />
          ) : (
            <div className="rounded-lg border border-ink/10 bg-paper/60 px-4 py-2.5 text-xs text-ink/60 italic">
              B-roll / Silent scene &mdash; no spoken dialogue. Follow camera action.
            </div>
          )}

          {/* 2. Physical Action & Movement */}
          {step.action && (
            <div className="rounded-xl border border-ink/10 bg-[#FAF8F5] p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink/60 flex items-center gap-1.5 mb-1.5">
                <Play className="h-3 w-3 text-plum fill-current" aria-hidden="true" />
                Action &amp; Physical Movement
              </span>
              <p className="text-sm sm:text-[15px] font-medium text-ink/90 leading-relaxed">
                {step.action}
              </p>
            </div>
          )}

          {/* 3. Director's Technical Slate (Framing, Text Overlay, Edit Cut) */}
          <div className="grid gap-3 sm:grid-cols-3 pt-1">
            {/* Camera Frame */}
            <div className="rounded-lg border border-ink/10 bg-white p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink/60 flex items-center gap-1.5 mb-1">
                <Video className="h-3.5 w-3.5 text-plum" aria-hidden="true" />
                Camera &amp; Frame
              </span>
              <p className="text-xs leading-5 text-ink/80 font-medium">
                {step.shot || "Medium eye-level frame."}
              </p>
            </div>

            {/* On-Screen Text with One-Click Copy */}
            <div className="rounded-lg border border-ink/10 bg-white p-3 shadow-2xs">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/60 flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5 text-plum" aria-hidden="true" />
                  On-Screen Text
                </span>
                {step.onScreenText ? (
                  <button
                    type="button"
                    onClick={handleCopyOnScreenText}
                    className="text-[10px] font-semibold text-plum hover:text-plum-deep inline-flex items-center gap-1"
                    title="Copy text overlay"
                  >
                    {copiedText ? (
                      <>
                        <Check className="h-2.5 w-2.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-2.5 w-2.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                ) : null}
              </div>
              <p className="text-xs leading-5 text-ink/80 font-medium">
                {step.onScreenText ? (
                  <span className="font-mono text-ink bg-paper px-1.5 py-0.5 rounded">
                    &ldquo;{step.onScreenText}&rdquo;
                  </span>
                ) : (
                  <span className="text-ink/60 italic">No on-screen graphic</span>
                )}
              </p>
            </div>

            {/* Edit / Rhythm Cut */}
            <div className="rounded-lg border border-ink/10 bg-white p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink/60 flex items-center gap-1.5 mb-1">
                <Scissors className="h-3.5 w-3.5 text-plum" aria-hidden="true" />
                Edit &amp; Cut Rhythm
              </span>
              <p className="text-xs leading-5 text-ink/80 font-medium">
                {step.editNote || step.performanceNote || "Cut clean on the last syllable."}
              </p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

interface ShootPlanProps {
  card: PresentedCard;
  onShootMode?: () => void;
  filmedSet?: Set<string>;
  onToggleFilmed?: (stepId: string) => void;
  onResetFilmed?: () => void;
}

export function ShootPlan({
  card,
  onShootMode,
  filmedSet: externalFilmedSet,
  onToggleFilmed: externalToggleFilmed,
  onResetFilmed: externalResetFilmed,
}: ShootPlanProps) {
  const baseId = useId();
  const steps = [...card.steps].sort((a, b) => a.order - b.order);

  // Local storage key for persistency on set
  const storageKey = `anomaly_filmed_${card.id}`;

  const [internalFilmedSet, setInternalFilmedSet] = useState<Set<string>>(() => {
    if (externalFilmedSet) return new Set();
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
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(steps.map((step, index) => [step.id, index === 0])),
  );

  const toggleFilmed = (stepId: string) => {
    if (externalToggleFilmed) {
      externalToggleFilmed(stepId);
      return;
    }
    setInternalFilmedSet((prev) => {
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

  const resetFilmed = () => {
    if (externalResetFilmed) {
      externalResetFilmed();
      return;
    }
    setInternalFilmedSet(new Set());
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
  };

  const filmedSet = externalFilmedSet ?? internalFilmedSet;

  const allOpen = steps.every((s) => openMap[s.id]);
  const filmedCount = steps.filter((s) => filmedSet.has(s.id)).length;
  const progressPercent = steps.length > 0 ? Math.round((filmedCount / steps.length) * 100) : 0;
  const allWrapped = filmedCount === steps.length && steps.length > 0;

  function setStepOpen(id: string, value: boolean) {
    setOpenMap((current) => ({ ...current, [id]: value }));
  }

  function toggleAll() {
    const next = !allOpen;
    setOpenMap(Object.fromEntries(steps.map((step) => [step.id, next])));
  }

  return (
    <section
      id="section-shoot"
      className="scroll-mt-14 rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-7"
      aria-labelledby="shoot-plan-heading"
    >
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-ink/5 pb-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-plum">
            Director&rsquo;s Cue Sheet
          </span>
          <h2
            id="shoot-plan-heading"
            className="mt-1 text-2xl font-semibold tracking-tight text-ink"
          >
            Scene-by-Scene Shoot Plan
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink/65">
            Follow the line, hold the framing, and check each scene off as you film.
          </p>
        </div>

        {/* Global Expand & Shoot Mode Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start">
          {onShootMode && (
            <button
              type="button"
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-plum/20 bg-plum-soft/60 px-3.5 py-2 text-xs font-semibold text-plum-deep hover:bg-plum/15 transition shadow-2xs"
              onClick={onShootMode}
            >
              <Play className="h-3 w-3 fill-current" aria-hidden="true" />
              <span>Shoot Mode</span>
            </button>
          )}
          <button
            type="button"
            className="focus-ring rounded-lg border border-ink/10 px-3 py-2 text-xs font-semibold text-ink/60 hover:text-ink hover:bg-paper transition"
            onClick={toggleAll}
          >
            {allOpen ? "Close all" : "Open all"}
          </button>
        </div>
      </div>

      {/* LIVE SET TRACKER — Real-time Filmed Progress Bar */}
      <div className="mt-5 rounded-xl border border-ink/10 bg-paper/70 p-4">
        <div className="flex items-center justify-between gap-3 text-xs mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink">Set Progress:</span>
            <span className="font-semibold text-plum-deep">
              {filmedCount} of {steps.length} scenes filmed ({progressPercent}%)
            </span>
          </div>
          {filmedCount > 0 && (
            <button
              type="button"
              onClick={resetFilmed}
              className="text-[11px] text-ink/60 hover:text-coral transition flex items-center gap-1"
              title="Reset filmed checklist"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Visual Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* All Wrapped Congratulatory Banner */}
        {allWrapped && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>All scenes wrapped! Head to the final checklist below for post-production and publishing notes.</span>
          </div>
        )}
      </div>

      {/* Beat accordions */}
      <div className="mt-5 space-y-3">
        {steps.map((step) => (
          <ShootStepCard
            key={step.id}
            step={step}
            open={Boolean(openMap[step.id])}
            onToggle={() => setStepOpen(step.id, !openMap[step.id])}
            panelId={`${baseId}-panel-${step.id}`}
            headerId={`${baseId}-header-${step.id}`}
            totalSteps={steps.length}
            isFilmed={filmedSet.has(step.id)}
            onToggleFilmed={() => toggleFilmed(step.id)}
          />
        ))}
      </div>
    </section>
  );
}
