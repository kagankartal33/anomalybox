"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BatteryCharging } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";

export default function CreatorCapacityCalculatorPage() {
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [teamType, setTeamType] = useState<"solo" | "duo" | "team">("solo");
  const [setupType, setSetupType] = useState<"phone_natural" | "studio_lights" | "screen_desk">("phone_natural");
  const [editPreference, setEditPreference] = useState<"fast_mobile" | "detailed_desktop">("fast_mobile");

  // Calculations
  const hoursPerVideo = 
    (teamType === "solo" ? 2.5 : teamType === "duo" ? 1.8 : 1.2) +
    (setupType === "studio_lights" ? 1.0 : setupType === "phone_natural" ? 0.3 : 0.5) +
    (editPreference === "detailed_desktop" ? 1.5 : 0.5);

  const maxSustainableWeeklyPosts = Math.max(1, Math.floor(weeklyHours / hoursPerVideo));
  const recommendedBatchDayHours = Math.min(weeklyHours, Math.round(hoursPerVideo * maxSustainableWeeklyPosts * 0.7));
  const editingBufferHours = Math.round(weeklyHours - recommendedBatchDayHours);

  const burnOutRisk = weeklyHours < hoursPerVideo * 2 ? "High Risk" : maxSustainableWeeklyPosts >= 5 ? "Volume Trap" : "Sustainable";

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/10 px-3.5 py-1 text-xs font-semibold text-teal-900">
            <BatteryCharging className="h-3.5 w-3.5" />
            <span>Anti-Burnout Capacity Model • Phase 01 / 24</span>
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            Creator Capacity & Batching Calculator
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-ink/70">
            Stop falling into daily posting traps. Calculate your realistic production capacity, sustainable weekly cadence, and batch-shoot window based on real solo/team hours.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Inputs */}
          <div className="space-y-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-soft lg:col-span-7">
            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-ink" htmlFor="weekly-hours">
                  Available Weekly Content Hours
                </label>
                <span className="font-mono text-sm font-bold text-plum-deep">{weeklyHours} hours/week</span>
              </div>
              <input
                id="weekly-hours"
                type="range"
                min="2"
                max="40"
                step="1"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="mt-3 w-full accent-plum-deep"
              />
              <div className="mt-1 flex justify-between text-xs text-ink/60">
                <span>2h (Side-hustle)</span>
                <span>20h (Dedicated)</span>
                <span>40h (Full-time)</span>
              </div>
            </div>

            <div>
              <span className="block text-sm font-semibold text-ink">Production Team Structure</span>
              <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                {[
                  { id: "solo", label: "Solo Creator", desc: "You do all filming & editing" },
                  { id: "duo", label: "Duo / Assistant", desc: "Shared filming or helper" },
                  { id: "team", label: "Editor / Team", desc: "Dedicated editing support" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTeamType(t.id as typeof teamType)}
                    className={`focus-ring rounded-xl border p-3 text-left transition ${
                      teamType === t.id
                        ? "border-ink bg-ink text-white"
                        : "border-ink/10 bg-paper text-ink hover:bg-white"
                    }`}
                  >
                    <div className="text-xs font-bold">{t.label}</div>
                    <div className={`mt-1 text-[11px] leading-tight ${teamType === t.id ? "text-white/60" : "text-ink/50"}`}>
                      {t.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm font-semibold text-ink">Production & Gear Setup</span>
              <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                {[
                  { id: "phone_natural", label: "Phone + Natural Light", desc: "Fastest setup (< 10 min)" },
                  { id: "studio_lights", label: "Multi-Light Studio", desc: "High polish, higher friction" },
                  { id: "screen_desk", label: "Desk / Screen / POV", desc: "Minimal physical reset" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSetupType(s.id as typeof setupType)}
                    className={`focus-ring rounded-xl border p-3 text-left transition ${
                      setupType === s.id
                        ? "border-ink bg-ink text-white"
                        : "border-ink/10 bg-paper text-ink hover:bg-white"
                    }`}
                  >
                    <div className="text-xs font-bold">{tCase(s.label)}</div>
                    <div className={`mt-1 text-[11px] leading-tight ${setupType === s.id ? "text-white/60" : "text-ink/50"}`}>
                      {s.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm font-semibold text-ink">Editing Workflow</span>
              <div className="mt-2.5 grid grid-cols-2 gap-3">
                {[
                  { id: "fast_mobile", label: "Mobile / CapCut Fast-Cut", desc: "30–45 min per video" },
                  { id: "detailed_desktop", label: "Desktop Premiere / Final Cut", desc: "90–120 min per video" },
                ].map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEditPreference(e.id as typeof editPreference)}
                    className={`focus-ring rounded-xl border p-3 text-left transition ${
                      editPreference === e.id
                        ? "border-ink bg-ink text-white"
                        : "border-ink/10 bg-paper text-ink hover:bg-white"
                    }`}
                  >
                    <div className="text-xs font-bold">{e.label}</div>
                    <div className={`mt-1 text-[11px] leading-tight ${editPreference === e.id ? "text-white/60" : "text-ink/50"}`}>
                      {e.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Output */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink/60">Sustainable Output Recommendation</h2>
              
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight text-plum-deep">{maxSustainableWeeklyPosts}</span>
                <span className="text-lg font-semibold text-ink">Reels / Week</span>
              </div>
              <p className="mt-1 text-xs text-ink/60">Estimated {hoursPerVideo.toFixed(1)} hours of total effort per finished video.</p>

              <div className="mt-6 space-y-3.5 border-t border-ink/10 pt-5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-ink/70">Single-Session Batch Filming:</span>
                  <span className="font-semibold text-ink">{recommendedBatchDayHours}h / 1 session</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink/70">Asynchronous Editing Buffer:</span>
                  <span className="font-semibold text-ink">{editingBufferHours}h across week</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink/70">Cadence Health:</span>
                  <span className={`font-semibold ${burnOutRisk === "Sustainable" ? "text-teal" : "text-coral"}`}>
                    {burnOutRisk}
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-ink/10 bg-[#fbfaf6] p-4 text-xs leading-relaxed text-ink/70">
                <p className="font-semibold text-ink">⚡ The Anomaly Box Capacity Rule:</p>
                <p className="mt-1">
                  Never shoot daily. Pre-decide 2 to 3 high-leverage briefs on Monday, shoot them in one 2-hour window on Tuesday, and preserve your creative energy for authentic audience engagement.
                </p>
              </div>

              <div className="mt-6">
                <Link
                  href="/store"
                  className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-white transition hover:bg-black"
                >
                  Get Pre-Decided Briefs <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}

function tCase(str: string) {
  return str;
}
