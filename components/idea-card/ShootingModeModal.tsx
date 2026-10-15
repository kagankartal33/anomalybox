"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Video,
  Eye,
  Sparkles,
  MoveRight,
  CheckCircle2,
} from "lucide-react";
import type { PresentedCard } from "@/lib/idea-card";

export function ShootingModeModal({
  card,
  isOpen,
  onClose,
  onMarkAllFilmed,
}: {
  card: PresentedCard;
  isOpen: boolean;
  onClose: () => void;
  onMarkAllFilmed?: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }
  const [fontSizeLevel, setFontSizeLevel] = useState<"normal" | "large" | "xlarge">("normal");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const steps = card.steps;
  const currentStep = steps[currentStepIndex];

  const handleNext = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(steps.length, prev + 1));
  }, [steps.length]);

  const handlePrev = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleFinish = useCallback(() => {
    setCurrentStepIndex(steps.length);
  }, [steps.length]);

  // Screen Wake Lock API — keep display active while filming
  useEffect(() => {
    if (!isOpen) return;
    let wakeLock: { release: () => Promise<void> } | null = null;
    async function requestWakeLock() {
      try {
        if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
          wakeLock = await (
            navigator as unknown as {
              wakeLock: {
                request: (type: string) => Promise<{ release: () => Promise<void> }>;
              };
            }
          ).wakeLock.request("screen");
        }
      } catch {
        // Silently continue if WakeLock request is denied by OS or power saving
      }
    }
    requestWakeLock();
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isOpen]);

  // Focus trap — keep keyboard focus inside the modal while open
  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;

    requestAnimationFrame(() => {
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusable?.[0]?.focus();
    });

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusableEls = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusableEls.length === 0) return;
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleTab);
    return () => {
      window.removeEventListener("keydown", handleTab);
      previousFocus?.focus();
    };
  }, [isOpen]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " " || e.code === "Space" || e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Touch gesture handlers for mobile swiping
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.changedTouches[0]?.clientX ?? null);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0]?.clientX ?? 0;
    const deltaX = touchEndX - touchStartX;
    setTouchStartX(null);
    if (deltaX < -50) {
      if (currentStepIndex === steps.length - 1) {
        handleFinish();
      } else {
        handleNext();
      }
    } else if (deltaX > 50) {
      handlePrev();
    }
  };

  const handleMarkAllAndExit = () => {
    try {
      localStorage.setItem(
        `anomaly_filmed_${card.id}`,
        JSON.stringify(card.steps.map((s) => s.id))
      );
    } catch {
      // Ignore
    }
    if (onMarkAllFilmed) {
      onMarkAllFilmed();
    }
    onClose();
  };

  if (!isOpen) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;
  const isDone = currentStepIndex >= steps.length;

  // Done screen — shown after user advances past the last scene
  if (isOpen && isDone) {
    return (
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shoot-done-title"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#09090b] text-[#f4f4f5] px-6 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-2">
            All scenes walked
          </p>
          <h2 id="shoot-done-title" className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            {card.title}
          </h2>
          <p className="mt-3 text-base text-white/65 max-w-md mx-auto">
            You&rsquo;ve walked every scene in Shoot Mode. Ready to mark all scenes filmed and review the final checklist?
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <button
            type="button"
            onClick={handleMarkAllAndExit}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-black hover:bg-emerald-400 transition shadow-lg active:scale-98"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Mark all filmed &amp; return to brief</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentStepIndex(steps.length - 1)}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Review last scene</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-transparent px-5 py-3.5 text-sm font-semibold text-white/70 hover:text-white transition"
          >
            <span>Exit without marking</span>
          </button>
        </div>
      </div>
    );
  }

  if (!currentStep) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shoot-mode-title"
      className="fixed inset-0 z-50 flex flex-col bg-[#09090b] text-[#f4f4f5] select-none font-sans"
    >
      {/* Top Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6 backdrop-blur-md bg-black/60">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-red-400">
            ● SHOOT
          </span>
          <h1 id="shoot-mode-title" className="truncate text-sm font-semibold text-white/80 hidden sm:block">
            {card.title}
          </h1>
        </div>

        {/* Scene progress dots */}
        <div className="flex items-center gap-1.5">
          {steps.map((step, idx) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setCurrentStepIndex(idx)}
              title={`Scene ${idx + 1}: ${step.stageLabel}`}
              className={`rounded-full transition-all duration-200 ${
                idx === currentStepIndex
                  ? "w-7 h-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                  : idx < currentStepIndex
                  ? "w-3 h-2.5 bg-white/50"
                  : "w-2.5 h-2.5 bg-white/20"
              }`}
            />
          ))}
          <span className="ml-2 font-mono text-xs font-semibold text-white/60 tabular-nums">
            Scene {currentStepIndex + 1} / {steps.length}
          </span>
        </div>

        {/* Font size & Exit Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5" aria-label="Text size">
            <button
              type="button"
              onClick={() => setFontSizeLevel("normal")}
              className={`px-2 py-1 text-xs font-semibold rounded transition ${
                fontSizeLevel === "normal" ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80"
              }`}
              title="Standard text size"
              aria-pressed={fontSizeLevel === "normal"}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSizeLevel("large")}
              className={`px-2 py-1 text-xs font-semibold rounded transition ${
                fontSizeLevel === "large" ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80"
              }`}
              title="Large text size"
              aria-pressed={fontSizeLevel === "large"}
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setFontSizeLevel("xlarge")}
              className={`px-2 py-1 text-xs font-semibold rounded transition ${
                fontSizeLevel === "xlarge" ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80"
              }`}
              title="Extra large text size"
              aria-pressed={fontSizeLevel === "xlarge"}
            >
              A++
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5"
            aria-label="Exit Shoot mode"
          >
            <span className="hidden sm:inline text-xs font-semibold">Exit</span>
            <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px] text-white/40 hidden sm:inline">
              ESC
            </kbd>
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Shoot Mode stage */}
      <main
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="flex-1 overflow-y-auto flex flex-col justify-center touch-pan-y"
      >
        <div
          key={currentStepIndex}
          className="max-w-5xl mx-auto w-full px-5 sm:px-8 py-6 flex flex-col justify-center animate-scene-in"
        >
          {/* Scene title and purpose */}
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <span className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400">
              Scene {currentStepIndex + 1}: {currentStep.stageLabel}
            </span>
            <span className="text-sm font-medium text-white/70">
              {currentStep.purpose}
            </span>
            {currentStep.onScreenText ? (
              <span className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/85">
                <Sparkles className="h-3 w-3 text-plum shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-xs" title={currentStep.onScreenText}>
                  On screen: {currentStep.onScreenText}
                </span>
              </span>
            ) : null}
          </div>

          {/* Hero spoken line */}
          <div className="relative rounded-2xl border border-white/15 bg-white/[0.04] p-7 sm:p-10 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400 mb-4">
              <Volume2 className="h-4 w-4 shrink-0" />
              <span>Say this</span>
            </div>

            <p
              className={`${
                fontSizeLevel === "normal"
                  ? "text-3xl sm:text-4xl lg:text-5xl"
                  : fontSizeLevel === "large"
                  ? "text-4xl sm:text-5xl lg:text-6xl"
                  : "text-5xl sm:text-6xl lg:text-7xl"
              } font-semibold leading-[1.3] tracking-tight text-white selection:bg-red-500/40`}
            >
              {currentStep.spokenLine ? (
                <span>&ldquo;{currentStep.spokenLine}&rdquo;</span>
              ) : (
                <span className="text-white/40 italic font-normal text-2xl sm:text-3xl">
                  (Silent scene &mdash; no spoken line. Focus on action and camera.)
                </span>
              )}
            </p>
          </div>

          {/* Clean Studio Slate — Camera, Movement, Posture */}
          <div
            className={`grid grid-cols-1 gap-3.5 mt-5 ${
              currentStep.action ? "md:grid-cols-2" : ""
            }`}
          >
            {/* Camera & frame */}
            <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/[0.04] p-4">
              <Video className="h-5 w-5 text-white/60 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                  Camera and frame
                </p>
                <p className="text-sm sm:text-base font-medium text-white/90 mt-1 leading-snug">
                  {currentStep.shot || "Medium eye-level frame."}
                </p>
              </div>
            </div>

            {/* Posture & vibe */}
            <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/[0.04] p-4">
              <Eye className="h-5 w-5 text-white/60 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                  Posture and energy
                </p>
                <p className="text-sm sm:text-base font-medium text-white/90 mt-1 leading-snug">
                  {currentStep.performanceNote || "Calm, intentional delivery."}
                </p>
              </div>
            </div>

            {/* Physical action */}
            {currentStep.action && (
              <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/[0.04] p-4 md:col-span-2">
                <MoveRight className="h-5 w-5 text-white/60 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                    Action &amp; Movement
                  </p>
                  <p className="text-sm sm:text-base font-medium text-white/90 mt-1 leading-snug">
                    {currentStep.action}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Controls */}
      <footer className="shrink-0 border-t border-white/10 bg-black/70 px-4 sm:px-6 py-4 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirst}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous scene</span>
          </button>

          <div className="text-xs text-white/50 hidden sm:block font-medium">
            Tip: Press{" "}
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/80">
              Space
            </kbd>{" "}
            or{" "}
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/80">
              &rarr;
            </kbd>{" "}
            for next scene
          </div>

          <button
            type="button"
            onClick={isLast ? handleFinish : handleNext}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition shadow-lg bg-white text-black hover:bg-white/90 active:scale-95"
          >
            <span>{isLast ? "Done" : "Next scene"}</span>
            {!isLast && <ChevronRight className="h-4 w-4" />}
            {isLast && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          </button>
        </div>
      </footer>
    </div>
  );
}
