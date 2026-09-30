import { ChevronDown } from "lucide-react";
import { premiumAssets } from "@/lib/premium-assets";
import { CardGuideFigure } from "./CardGuideFigure";

const guides = [
  {
    title: "Shot language",
    summary: "Read distance and angle before you place the camera.",
    src: premiumAssets.cardGuides.shotLanguage,
    alt: "A premium production board comparing wide, medium, close-up, detail, top-down, and over-shoulder camera framings",
    description: "Use the requested shot as the framing anchor; preserve continuity when moving between distances.",
  },
  {
    title: "Text-safe composition",
    summary: "Keep the subject clear of platform controls and captions.",
    src: premiumAssets.cardGuides.textSafeZone,
    alt: "A smartphone production setup demonstrating safe placement for subjects and on-screen text in vertical video",
    description: "Protect the central subject area and leave calm breathing room at the top, bottom, and interaction edge.",
  },
  {
    title: "Edit assembly",
    summary: "Turn the recorded moments into one controlled sequence.",
    src: premiumAssets.cardGuides.editAssembly,
    alt: "A film editing desk showing ordered picture strips, cut markers, audio, and overlay layers",
    description: "Cut on intention, keep inserts brief, and let the proof or payoff hold long enough to register.",
  },
  {
    title: "Performance direction",
    summary: "Shape energy without making the delivery feel forced.",
    src: premiumAssets.cardGuides.performanceDirection,
    alt: "A face-free performance board showing a creator moving from calm posture to expressive hand delivery and a controlled finish",
    description: "Begin grounded, build expression around the key action, then settle the delivery for the close.",
  },
] as const;

export function VisualGuide() {
  return (
    <section className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-soft" aria-labelledby="visual-guide-heading">
      <div className="border-b border-ink/10 px-5 py-5 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-plum">Shared production reference</p>
        <h2 id="visual-guide-heading" className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
          Visual Guide
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/55">
          Open a reference when the brief calls for a framing, edit, text, or performance decision.
        </p>
      </div>

      <div className="divide-y divide-ink/10">
        {guides.map((guide, index) => (
          <details key={guide.title} className="group" open={index === 0}>
            <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:hidden hover:bg-paper/70 sm:px-6">
              <span>
                <span className="block text-base font-semibold text-ink">{guide.title}</span>
                <span className="mt-0.5 block text-sm leading-6 text-ink/52">{guide.summary}</span>
              </span>
              <ChevronDown className="h-5 w-5 shrink-0 text-plum transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="border-t border-ink/10 bg-[#F7F4ED] p-4 sm:p-6">
              <CardGuideFigure
                src={guide.src}
                alt={guide.alt}
                eyebrow="Production reference"
                title={guide.title}
                description={guide.description}
              />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}