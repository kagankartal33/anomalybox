"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  X,
  Sparkles,
  Camera,
  Clapperboard,
  Mic,
  Volume2,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
  Eye,
} from "lucide-react";

interface SampleBriefModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: "button" | "badge" | "link" | "outline";
}

const sampleScenes = [
  {
    num: "01",
    stage: "Hook / Pattern Interrupt",
    time: "0:00 - 0:03",
    shot: "Macro 45° angled shot. Camera is 15cm from portafilter. Rich crema begins dripping into glass cup.",
    audio: "Grinder noise ASMR cut abruptly to absolute silence on the first drip. Zero background music.",
    spoken: "If your morning espresso tastes sour or bitter, you're making this 4-second mistake before you even press the button.",
    onScreenText: "The 4-second espresso flaw ☕",
  },
  {
    num: "02",
    stage: "The Micro-Demonstration",
    time: "0:04 - 0:16",
    shot: "Chest-level medium shot. You pick up the portafilter, showing an uneven coffee puck with small pinholes (channeling).",
    audio: "Subtle 120 BPM low-pass filter beat enters softly under speech.",
    spoken: "Notice these tiny holes? That's channeling. Water rushes through the easiest path, burning part of the puck while leaving the rest under-extracted.",
    onScreenText: "Channeling = Sour + Bitter at the same time",
  },
  {
    num: "03",
    stage: "The 4-Second Calibration",
    time: "0:17 - 0:34",
    shot: "Overhead top-down camera. Hands show WDT needle tool distribution in slow circular motions, followed by a level tamp.",
    audio: "Tactile click sound of tamper resting flat against the basket.",
    spoken: "Instead of tapping the side with your hand, do a 4-second circular stir with a needle tool. You want an even density across the entire basket.",
    onScreenText: "4-second needle stir (no side tapping)",
  },
  {
    num: "04",
    stage: "Payoff & Conversation Prompt",
    time: "0:35 - 0:45",
    shot: "Eye-level handheld camera. Taking the first sip, looking directly at camera with relaxed body language.",
    audio: "Music resolves with a clean fade.",
    spoken: "Night and day difference. What grinder are you currently using? Drop it below and I'll tell you your ideal click setting.",
    onScreenText: "Drop your grinder model below 👇",
  },
];

export function SampleBriefModal({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  triggerClassName,
  triggerLabel = "Inspect Sample Brief",
  triggerVariant = "button",
}: SampleBriefModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const isControlled = typeof externalIsOpen === "boolean";
  const open = isControlled ? externalIsOpen : internalIsOpen;

  const handleClose = useCallback(() => {
    if (isControlled && externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [isControlled, externalOnClose]);

  const handleOpen = () => {
    setInternalIsOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, handleClose]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2000);
    } catch {
      // Ignore clipboard write failures gracefully
    }
  };

  return (
    <>
      {/* Trigger Button (if uncontrolled) */}
      {!isControlled && (
        triggerVariant === "outline" ? (
          <button
            type="button"
            onClick={handleOpen}
            className={
              triggerClassName ||
              "inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20 focus-ring"
            }
          >
            <Eye className="h-4 w-4" />
            {triggerLabel}
          </button>
        ) : triggerVariant === "badge" ? (
          <button
            type="button"
            onClick={handleOpen}
            className={
              triggerClassName ||
              "inline-flex items-center gap-1.5 rounded-full border border-plum/30 bg-plum-soft px-3 py-1 text-xs font-semibold text-plum-deep hover:bg-plum-soft/80 transition"
            }
          >
            <Eye className="h-3.5 w-3.5" />
            {triggerLabel}
          </button>
        ) : triggerVariant === "link" ? (
          <button
            type="button"
            onClick={handleOpen}
            className={
              triggerClassName ||
              "inline-flex items-center gap-1.5 text-xs font-semibold text-plum-deep underline underline-offset-4 hover:text-black transition"
            }
          >
            <Eye className="h-3.5 w-3.5" />
            {triggerLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleOpen}
            className={
              triggerClassName ||
              "inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-black focus-ring"
            }
          >
            <Eye className="h-4 w-4" />
            {triggerLabel}
          </button>
        )
      )}

      {/* Modal Backdrop & Dialog */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sample-brief-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#141416] text-white shadow-2xl">
            {/* Header / Specimen Watermark */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#1A1A1E] px-6 py-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-teal/30 bg-teal/15 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-teal">
                  <Sparkles className="h-3 w-3" />
                  Specimen Dossier
                </span>
                <span className="font-mono text-xs text-white/50">
                  REF: ANM-SPEC-042 // CREATOR VAULT SAMPLE
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white focus-ring"
                aria-label="Close sample brief modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-sm">
              {/* Metadata Banner */}
              <div className="grid gap-3 rounded-xl border border-white/10 bg-[#1c1c22] p-4 sm:grid-cols-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/55">Lane</p>
                  <p className="mt-1 font-semibold text-white">Specialty Coffee &amp; Cafes</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/55">Creator Mode</p>
                  <p className="mt-1 font-semibold text-white">Calm Authority</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/55">Production Setup</p>
                  <p className="mt-1 font-semibold text-white">Solo • Phone 4K60 • 35m</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/55">Pacing Style</p>
                  <p className="mt-1 font-semibold text-white">ASMR Proof First • 45s</p>
                </div>
              </div>

              {/* Title & Directive */}
              <div>
                <h2 id="sample-brief-title" className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  The 4-Second Extraction Flaw
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  <strong className="text-white">Director&apos;s Core Intent:</strong> Convert casual morning coffee drinkers into engaged followers by disproving a common intuitive habit (side tapping the portafilter) using tactile visual proof within the first 3 seconds.
                </p>
              </div>

              {/* Hook Spotlight */}
              <div className="rounded-xl border border-[#B42335]/30 bg-[#251419] p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B7D]">
                    Phase 01: The Verified Hook
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(sampleScenes[0].spoken, "hook")}
                    className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition"
                    title="Copy opening line"
                  >
                    {copiedText === "hook" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-teal" />
                        <span className="text-teal">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Line</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-3 font-mono text-base font-semibold text-white sm:text-lg">
                  &ldquo;{sampleScenes[0].spoken}&rdquo;
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-[#FF6B7D]" />
                    Tight 45° macro extraction
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-[#FF6B7D]" />
                    Zero music first 3s (pure ASMR)
                  </span>
                </div>
              </div>

              {/* Scene Breakdown Tabs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">
                    Scene-by-Scene Shoot Flow (4 Scenes)
                  </h3>
                  <span className="text-xs text-white/55">Click scene tab to inspect</span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {sampleScenes.map((scene, idx) => (
                    <button
                      key={scene.num}
                      type="button"
                      onClick={() => setActiveTab(idx)}
                      className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        activeTab === idx
                          ? "bg-white text-ink shadow-md"
                          : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      Scene {scene.num} ({scene.time})
                    </button>
                  ))}
                </div>

                {/* Active Scene Panel */}
                <div className="mt-3 rounded-xl border border-white/10 bg-[#1A1A1E] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs font-bold text-white">
                        Scene {sampleScenes[activeTab].num}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {sampleScenes[activeTab].stage}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-white/55">
                      Target Duration: {sampleScenes[activeTab].time}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/50">
                        <Clapperboard className="h-3.5 w-3.5 text-teal" />
                        Camera &amp; Physical Framing
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                        {sampleScenes[activeTab].shot}
                      </p>
                    </div>

                    <div>
                      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/50">
                        <Volume2 className="h-3.5 w-3.5 text-plum" />
                        Audio &amp; Rhythm Direction
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                        {sampleScenes[activeTab].audio}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal">
                        <Mic className="h-3.5 w-3.5" />
                        Spoken Line (Teleprompter Script)
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(sampleScenes[activeTab].spoken, `scene-${activeTab}`)}
                        className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition"
                      >
                        {copiedText === `scene-${activeTab}` ? (
                          <Check className="h-3.5 w-3.5 text-teal" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>{copiedText === `scene-${activeTab}` ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <p className="mt-2 text-sm italic leading-relaxed text-white">
                      &ldquo;{sampleScenes[activeTab].spoken}&rdquo;
                    </p>
                    <div className="mt-3 border-t border-white/10 pt-2 text-xs text-white/60">
                      <strong>On-Screen Text:</strong> {sampleScenes[activeTab].onScreenText}
                    </div>
                  </div>
                </div>
              </div>

              {/* Directorial Safety & Claim Boundaries */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-300">
                  <ShieldAlert className="h-4 w-4" />
                  Sponsor &amp; Claim Safety Boundaries (Mandatory)
                </div>
                <p className="mt-1.5 leading-relaxed text-white/70">
                  Do not make absolute guarantees like &quot;never drink bad coffee again&quot; or health claims regarding stomach acidity. Anchor the entire credibility on contact-time consistency and particle distribution mechanics.
                </p>
              </div>
            </div>

            {/* Footer with Purchase Conversion CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 bg-[#161618] px-6 py-4">
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold text-white">Every Anomaly Box brief arrives in this exact format.</p>
                <p className="text-xs text-white/50">Two briefs in Classic Red ($9) or five in Signature Purple ($19).</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-1/2 sm:w-auto rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  Close Preview
                </button>
                <Link
                  href="/store?box=viral_box_500"
                  onClick={handleClose}
                  className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-ink hover:bg-[#E8EDF7] transition shadow-lg"
                >
                  Configure My Brief <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
