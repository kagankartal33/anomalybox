"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, Film, Layers, FileText, CheckCircle2, Video } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { SampleBriefModal } from "@/components/SampleBriefModal";

type Goal = "visual_demo" | "reference_guide" | "opinion_perspective" | "story_transformation";
type Depth = "quick_30s" | "step_by_step" | "deep_nuance";
type FacePreference = "camera_confident" | "faceless_hands" | "text_graphic_only";

export default function FormatUtilityRouterPage() {
  const [goal, setGoal] = useState<Goal>("visual_demo");
  const [depth, setDepth] = useState<Depth>("quick_30s");
  const [face, setFace] = useState<FacePreference>("camera_confident");

  // Format Recommendation Engine
  let recommendedFormat = "9:16 Instagram Reel";
  let formatDesc = "Best when the proof has to be seen, not read.";
  let Icon = Film;
  let secondaryRecommendation = "Multi-Slide Carousel (Repurposed for Saves)";

  if (goal === "reference_guide" || depth === "step_by_step") {
    if (face === "text_graphic_only") {
      recommendedFormat = "10-Slide Educational Carousel";
      formatDesc = "Use this when people need to keep a checklist, not just watch a clip.";
      Icon = Layers;
      secondaryRecommendation = "Searchable Website Guide / Resource Article";
    } else {
      recommendedFormat = "9:16 Reel with Pinned Save CTA";
      formatDesc = "Demonstrate the framework visually in video, but place the full reference checklist in caption / carousel for saves.";
      Icon = Film;
      secondaryRecommendation = "10-Slide Educational Carousel";
    }
  } else if (goal === "opinion_perspective") {
    if (face === "camera_confident") {
      recommendedFormat = "Eye-Level Talking Head Reel (0:30 - 0:45)";
      formatDesc = "Talk to camera at eye level. Say the unexpected line first.";
      Icon = Film;
      secondaryRecommendation = "LinkedIn / Threads Long-Form Text Take";
    } else {
      recommendedFormat = "Voiceover over Ambient B-Roll Reel";
      formatDesc = "High aesthetic immersion without on-camera presence. Calibrated voiceover rhythm over texture B-roll.";
      Icon = Video;
      secondaryRecommendation = "Quote Graphic Carousel";
    }
  } else if (depth === "deep_nuance") {
    recommendedFormat = "Searchable Article / Long-Form Video";
    formatDesc = "When topics require conditionality and deep trade-offs (Phase 30 Cluster #19), forcing a 30s Reel creates filler complaints. Publish text or long-form, then clip teaser Reel.";
    Icon = FileText;
    secondaryRecommendation = "3-Part Reel Series";
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-plum/20 bg-plum-soft px-3.5 py-1 text-xs font-semibold text-plum-deep">
            <Compass className="h-3.5 w-3.5" />
            <span>Format Utility Router • Phase 30 Cluster #12</span>
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            Format Utility & Media Router
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-ink/70">
            Stop forcing every concept into a Reel. Match your idea to the lowest-friction, highest-retention media format based on real viewer information goals.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Inputs */}
          <div className="space-y-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-soft lg:col-span-7">
            <div>
              <span className="block text-sm font-semibold text-ink">1. What is the primary job of this content?</span>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                {[
                  { id: "visual_demo", label: "Visual Demonstration", desc: "Show a physical transformation, routine, or product in use" },
                  { id: "reference_guide", label: "Reference / Guide", desc: "Checklist, step-by-step rules, or resource tools to save" },
                  { id: "opinion_perspective", label: "Contrarian Perspective", desc: "Counter-intuitive truth or industry hot-take" },
                  { id: "story_transformation", label: "Story / Founder Arc", desc: "Behind-the-scenes decision or journey breakdown" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGoal(item.id as Goal)}
                    className={`focus-ring rounded-xl border p-3.5 text-left transition ${
                      goal === item.id
                        ? "border-ink bg-ink text-white"
                        : "border-ink/10 bg-paper text-ink hover:bg-white"
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className={`mt-1 text-[11px] leading-tight ${goal === item.id ? "text-white/60" : "text-ink/50"}`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm font-semibold text-ink">2. How much information density is required?</span>
              <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                {[
                  { id: "quick_30s", label: "Single Punchy Insight", desc: "1 clear takeaway in 30s" },
                  { id: "step_by_step", label: "Multi-Step Process", desc: "3 to 5 actionable steps" },
                  { id: "deep_nuance", label: "Comprehensive Nuance", desc: "Trade-offs, scenarios & data" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDepth(item.id as Depth)}
                    className={`focus-ring rounded-xl border p-3 text-left transition ${
                      depth === item.id
                        ? "border-ink bg-ink text-white"
                        : "border-ink/10 bg-paper text-ink hover:bg-white"
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className={`mt-1 text-[11px] leading-tight ${depth === item.id ? "text-white/60" : "text-ink/50"}`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm font-semibold text-ink">3. On-Camera Presence Comfort</span>
              <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                {[
                  { id: "camera_confident", label: "Talking Head / Face", desc: "Comfortable on camera" },
                  { id: "faceless_hands", label: "Hands / POV / Voice", desc: "Faceless with spoken voice" },
                  { id: "text_graphic_only", label: "Pure Text / Visuals", desc: "No voice, no face" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFace(item.id as FacePreference)}
                    className={`focus-ring rounded-xl border p-3 text-left transition ${
                      face === item.id
                        ? "border-ink bg-ink text-white"
                        : "border-ink/10 bg-paper text-ink hover:bg-white"
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className={`mt-1 text-[11px] leading-tight ${face === item.id ? "text-white/60" : "text-ink/50"}`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Output */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/60">Optimal Media Format</h2>
              
              <div className="mt-4 flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-plum-soft text-plum-deep">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-ink">{recommendedFormat}</h3>
                  <span className="text-xs text-teal font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> High Viewer Utility Match
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-ink/70">
                {formatDesc}
              </p>

              <div className="mt-6 border-t border-ink/10 pt-5 text-xs text-ink/60 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-ink">Secondary Format Option:</span>
                  <span>{secondaryRecommendation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-ink">Target Metric:</span>
                  <span>{goal === "reference_guide" ? "Save Rate & DM Shares" : "Completion Rate & Discovery"}</span>
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                <Link
                  href="/store"
                  className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-white transition hover:bg-black"
                >
                  Configure Brief for this Format <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="flex justify-center">
                  <SampleBriefModal
                    triggerVariant="link"
                    triggerLabel="Preview sample brief structure"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
