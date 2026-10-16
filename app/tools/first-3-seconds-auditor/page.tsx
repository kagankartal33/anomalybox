"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertTriangle, Sparkles, Activity } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { SampleBriefModal } from "@/components/SampleBriefModal";
import { analyzeCardHook } from "@/lib/algorithmic-reason/analyzer";

export default function First3SecondsAuditorPage() {
  const [openingLine, setOpeningLine] = useState("");
  const [visualAction, setVisualAction] = useState("");
  const [onScreenText, setOnScreenText] = useState("");
  const [hasProofInFirstBeat, setHasProofInFirstBeat] = useState<boolean | null>(null);
  const [audited, setAudited] = useState(false);

  // Analysis state
  const analysis = analyzeCardHook({
    hookLine: openingLine,
    whyItWorks: `${openingLine} ${visualAction} ${onScreenText}`,
    steps: [
      { spokenLine: openingLine, action: visualAction, purpose: "hook" }
    ]
  });

  const hook = analysis.detectedHook;
  const isActionSpecific = visualAction.trim().length > 10;
  const isLineSpecific = openingLine.trim().length > 10;
  const wordCount = openingLine.trim().split(/\s+/).filter(Boolean).length;
  const isWordCountOptimal = wordCount >= 4 && wordCount <= 14;

  let retentionScore = 30;
  if (hook) retentionScore += 25;
  if (isActionSpecific) retentionScore += 15;
  if (isLineSpecific) retentionScore += 5;
  if (isWordCountOptimal) retentionScore += 15;
  if (hasProofInFirstBeat === true) retentionScore += 10;
  if (hasProofInFirstBeat === false) retentionScore -= 15;

  retentionScore = Math.max(10, Math.min(98, retentionScore));

  const handleAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (openingLine.trim() || visualAction.trim()) {
      setAudited(true);
    }
  };

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-plum/20 bg-plum-soft px-3.5 py-1 text-xs font-semibold text-plum-deep">
            <Activity className="h-3.5 w-3.5" />
            <span>Algorithmic Directing Tool • Phase 01 / 30</span>
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            First 3 Seconds Hook Auditor
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-ink/70">
            Diagnose your video opening against the 62-hook cognitive taxonomy. Check cognitive dissonance, pattern interrupt strength, and promise-proof timing before turning on the camera.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Input Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleAudit} className="space-y-5 rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
              <div>
                <label className="block text-sm font-semibold text-ink" htmlFor="opening-line">
                  1. Spoken Opening Line (What you say in 0:00 - 0:03)
                </label>
                <input
                  id="opening-line"
                  type="text"
                  placeholder="e.g., Stop doing 3 sets of 10 if your goal is actual hypertrophy..."
                  className="focus-ring mt-2 w-full rounded-lg border border-ink/15 bg-paper/50 px-4 py-3 text-sm text-ink placeholder:text-ink/35"
                  value={openingLine}
                  onChange={(e) => setOpeningLine(e.target.value)}
                  required
                />
                <p className="mt-1.5 text-xs text-ink/60">Keep it between 4 and 14 words for optimal retention velocity.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink" htmlFor="visual-action">
                  2. Physical Action in Frame 1 (What happens at 0.5s)
                </label>
                <input
                  id="visual-action"
                  type="text"
                  placeholder="e.g., Holding torn notebook directly up to camera lens, eye-level medium-close..."
                  className="focus-ring mt-2 w-full rounded-lg border border-ink/15 bg-paper/50 px-4 py-3 text-sm text-ink placeholder:text-ink/35"
                  value={visualAction}
                  onChange={(e) => setVisualAction(e.target.value)}
                />
                <p className="mt-1.5 text-xs text-ink/60">Physical movement prevents scroll momentum before audio registers.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink" htmlFor="onscreen-text">
                  3. On-Screen Hook Text (Optional)
                </label>
                <input
                  id="onscreen-text"
                  type="text"
                  placeholder="e.g., Why 90% of creators plateau at 200 views"
                  className="focus-ring mt-2 w-full rounded-lg border border-ink/15 bg-paper/50 px-4 py-3 text-sm text-ink placeholder:text-ink/35"
                  value={onScreenText}
                  onChange={(e) => setOnScreenText(e.target.value)}
                />
              </div>

              <div>
                <span className="block text-sm font-semibold text-ink">
                  4. Does the opening reveal immediate proof or tension?
                </span>
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setHasProofInFirstBeat(true)}
                    className={`focus-ring flex-1 rounded-lg border px-4 py-2.5 text-xs font-semibold transition ${
                      hasProofInFirstBeat === true
                        ? "border-teal bg-teal/10 text-teal-900"
                        : "border-ink/10 bg-paper text-ink/70 hover:bg-white"
                    }`}
                  >
                    Yes (Proof shown in 0-2s)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasProofInFirstBeat(false)}
                    className={`focus-ring flex-1 rounded-lg border px-4 py-2.5 text-xs font-semibold transition ${
                      hasProofInFirstBeat === false
                        ? "border-coral bg-coral/10 text-coral"
                        : "border-ink/10 bg-paper text-ink/70 hover:bg-white"
                    }`}
                  >
                    No / Delayed to end
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 font-semibold text-white transition hover:bg-black"
              >
                <Sparkles className="h-4 w-4" />
                Audit Hook Retention Potential
              </button>
            </form>
          </div>

          {/* Audit Results Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Retention Diagnostic Score</h2>
              
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight text-ink">{audited ? retentionScore : "--"}</span>
                <span className="text-sm font-semibold text-ink/60">/ 100 Potential</span>
              </div>

              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-paper">
                <div
                  className={`h-full transition-all duration-500 ${
                    retentionScore >= 75 ? "bg-teal" : retentionScore >= 50 ? "bg-amber-500" : "bg-coral"
                  }`}
                  style={{ width: audited ? `${retentionScore}%` : "0%" }}
                />
              </div>

              {audited ? (
                <div className="mt-6 space-y-4 border-t border-ink/10 pt-5 text-sm">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">Detected Taxonomy Hook:</span>
                    <p className="mt-1 font-semibold text-plum-deep">
                      {hook ? `${hook.nameTr} (${hook.id})` : "General / Custom Hook Pattern"}
                    </p>
                    {hook ? (
                      <p className="mt-0.5 text-xs text-ink/60">{hook.descriptionTr}</p>
                    ) : null}
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">Neurocognitive Trigger:</span>
                    <p className="mt-1 font-medium text-ink/80">
                      {hook?.primaryCognitiveTriggerLabelTr ?? "Reward Prediction Error / Curiosity Gap"}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    {hasProofInFirstBeat === false ? (
                      <div className="flex items-start gap-2 rounded-lg border border-coral/20 bg-coral/5 p-3 text-xs text-coral">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span><strong>Warning:</strong> Delaying proof past 3 seconds causes 60%+ viewer drop-off. Show proof immediately.</span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 rounded-lg border border-teal/20 bg-teal/5 p-3 text-xs text-teal-800">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                        <span><strong>Verified:</strong> Early proof fulfillment secures watch-time progression.</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 rounded-xl border border-plum/20 bg-plum-soft/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-plum-deep">Need complete shoot-ready briefs?</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink/70">
                      Eliminate the blank page with pre-written openings, scene order, camera notes, and verified hooks in Creator Vault.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Link
                        href="/store?box=viral_box_500"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-xs font-bold text-white hover:bg-black transition shadow-xs"
                      >
                        Configure Shoot Brief <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <SampleBriefModal
                        triggerVariant="link"
                        triggerLabel="Preview sample brief format"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-center text-xs leading-relaxed text-ink/60 py-8">
                  Enter your spoken opening line and frame 1 physical action above to trigger the 62-hook algorithmic audit.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
