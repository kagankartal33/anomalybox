import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IdeaCardView } from "@/components/idea-card/IdeaCardView";
import type { PresentedCard } from "@/lib/idea-card";

export const metadata = {
  title: "Card Preview | Anomaly Box",
  description: "Visual test fixture for Oscar-grade shoot briefs",
};

const sampleCard: PresentedCard = {
  id: "preview-card-fixture",
  title: "The Zero-Retention Skincare Reveal",
  hookLine: "Never buy a hydrating serum until you do this 5-second tissue test under direct light.",
  whyItWorks: "Immediate physical proof under unflattering light breaks creator skepticism within the first 2 seconds.",
  viewerLeaveWith: "A simple 5-second bathroom test to confirm if their skincare actually penetrates or just evaporates.",
  storySpine: [
    "Open with the side-by-side tissue test challenge",
    "Show simultaneous one-drop application",
    "Peel back tissue to reveal zero residue vs greasy silicone",
    "Give the 3-ingredient checklist to check on the bottle",
  ],
  meta: {
    format: "Instagram Reels (9:16)",
    durationLabel: "25s",
    difficultyLabel: "Easy",
    categoryLabel: "Beauty & Skincare",
    shootFormatLabel: "Talking Head + Macro Insets",
    presenceLabel: "Face on Camera",
  },
  kit: ["Bathroom mirror", "Two dropper serums", "Single-ply tissue", "Natural window or ring light"],
  safety: {
    summary: "Clear product labeling and disclosure compliance.",
    bullets: [
      "Keep visible addresses, unconsented faces, and prescription medications out of frame.",
      "Clear #gifted or paid sponsorship disclosure if either serum was provided by a brand.",
      "Avoid medical or acne cure claims; frame strictly around cosmetic hydration and absorption.",
    ],
  },
  overallProductionNotes: [
    "Lock white balance and exposure before filming to prevent auto-adjusting between skin tones.",
    "Keep the phone camera 18 inches away with 2x zoom for undistorted macro skin texture.",
    "Deliver the first 3 seconds without an intro breath — cut straight on the word 'Never'.",
  ],
  steps: [
    {
      id: "scene-1",
      order: 1,
      stageLabel: "Opening Hook",
      startSecond: 0,
      endSecond: 3,
      purpose: "Stop the scroll with extreme proof setup",
      goal: "Hook the viewer with a split-screen face test",
      action: "Hold two dropper bottles at eye level, drop one measured bead onto each cheek simultaneously.",
      spokenLine: "Never buy a hydrating serum until you do this 5-second tissue test.",
      shot: "Tight medium macro, eye level, locked tripod",
      onScreenText: "The 5-Second Serum Test",
      editNote: "Cut hard on the word 'test' to the press phase.",
    },
    {
      id: "scene-2",
      order: 2,
      stageLabel: "Setup & Demonstration",
      startSecond: 3,
      endSecond: 10,
      purpose: "Set a fair side-by-side comparison",
      goal: "Show equal sample amounts and real-time absorption",
      action: "Gently pat both sides with index fingers for exactly 3 seconds in neutral window light.",
      spokenLine: "Watch what happens when we press a single tissue square over both sides after thirty seconds.",
      shot: "Overhead macro tracking fingers pressing both cheeks",
      onScreenText: "3-second pat test",
      editNote: "Match-cut finger taps on the beat.",
    },
    {
      id: "scene-3",
      order: 3,
      stageLabel: "Visual Proof Payoff",
      startSecond: 10,
      endSecond: 18,
      purpose: "Reveal indisputable visual proof",
      goal: "Deliver the breakthrough comparison",
      action: "Peel back both tissues: left side is bone dry, right side is soaked with heavy oily silicone residue.",
      spokenLine: "Side A fully penetrated into the skin barrier. Side B is just heavy filler sitting on top.",
      shot: "Macro push-in holding both tissues up to the ring light",
      onScreenText: "Clean absorption vs Silicone residue",
      editNote: "Slow zoom 1.05x into the tissue fibers.",
    },
    {
      id: "scene-4",
      order: 4,
      stageLabel: "Audience Takeaway & Action",
      startSecond: 18,
      endSecond: 25,
      purpose: "Guide the audience next step",
      goal: "Prompt save and ingredient check",
      action: "Point down towards the caption with a natural nod and show bottle back label.",
      spokenLine: "Check your bottle for dimethicone in the top 3 ingredients. Save this before your next haul.",
      shot: "Medium framing, smiling, natural eye contact",
      onScreenText: "Check top 3 ingredients",
      editNote: "Hold final graphic for 1.5 seconds post dialogue.",
    },
  ],
  sanitized: false,
};

export default function CardPreviewVisualTestPage() {
  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/boxes"
          className="inline-flex items-center gap-1.5 rounded-md py-1 text-xs font-semibold text-ink/60 transition hover:text-ink focus-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Creator Vault</span>
        </Link>
        <a
          href="#report-section"
          className="xl:hidden text-xs font-semibold text-ink/45 hover:text-ink/70 transition print:hidden"
        >
          Flag this brief
        </a>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          <IdeaCardView card={sampleCard} />
        </section>

        <aside id="report-section" className="space-y-4 print:hidden xl:sticky xl:top-16 xl:self-start">
          <div className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6 shadow-soft">
            <h2 className="font-semibold text-base">Request a review</h2>
            <p className="mt-1.5 text-xs sm:text-sm leading-6 text-ink/60">
              Ask for a review if a note is unclear, the brief does not match your box, or you need a replacement.
            </p>
            <div className="mt-4 rounded-md border border-ink/10 bg-paper p-4 text-xs leading-5 text-ink/70">
              Visual preview fixture loaded. All card interactions, Shoot Mode, copy actions, and checklists are fully active.
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
