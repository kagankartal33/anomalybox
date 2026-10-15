import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { premiumAssets } from "@/lib/premium-assets";

const guides = [
  {
    title: "Camera framing and shot language",
    summary: "Set distance and angle before you place the camera.",
    src: premiumAssets.cardGuides.shotLanguage,
    alt: "Wide, medium, close, detail, and over-the-shoulder camera frames",
    description: "Use the angle on the card as the base frame. Keep focus when you change distance.",
  },
  {
    title: "On-screen safe zone",
    summary: "Keep the subject and text clear of platform buttons.",
    src: premiumAssets.cardGuides.textSafeZone,
    alt: "Safe placement for text and subject in a vertical video",
    description: "Protect the center. Leave space at the top, bottom, and right for interface chrome.",
  },
  {
    title: "Edit and cut logic",
    summary: "Turn the shots into one intentional sequence.",
    src: premiumAssets.cardGuides.editAssembly,
    alt: "Edit desk with cut points and audio layers",
    description: "Give every cut a job. Hold the proof shot long enough to read.",
  },
  {
    title: "On-camera posture",
    summary: "Deliver calm, focused energy without looking staged.",
    src: premiumAssets.cardGuides.performanceDirection,
    alt: "On-camera posture from a still stance to a clear hand gesture",
    description: "Start still. Mark the main beat with the hands. End clean.",
  },
] as const;

export function VisualGuide() {
  return (
    <details className="group overflow-hidden rounded-xl border border-ink/10 bg-white shadow-soft">
      <summary className="focus-ring flex cursor-pointer list-none items-center justify-between p-5 sm:p-6 hover:bg-paper/50 marker:hidden">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-plum">Optional guide</p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-ink">
            Shoot and production reference
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-ink/55">
            Open this for camera angle, text-safe area, and edit notes.
          </p>
        </div>
        <ChevronDown className="h-5 w-5 shrink-0 text-plum transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="border-t border-ink/10 bg-[#FBF9F5] p-4 sm:p-6 divide-y divide-ink/10">
        {guides.map((guide) => (
          <div key={guide.title} className="grid gap-4 py-4 first:pt-0 last:pb-0 md:grid-cols-[260px_1fr] md:items-center">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-ink/10 bg-[#EEEAE1] md:w-[260px] md:shrink-0">
              <Image
                src={guide.src}
                alt={guide.alt}
                fill
                quality={90}
                sizes="(max-width: 767px) 92vw, 520px"
                className="object-contain"
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-ink">{guide.title}</h3>
              <p className="mt-0.5 text-xs text-ink/60 font-medium">{guide.summary}</p>
              <p className="mt-1.5 text-xs leading-5 text-ink/75">{guide.description}</p>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
