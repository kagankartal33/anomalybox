"use client";

import { useState } from "react";
import { Clapperboard, MonitorPlay } from "lucide-react";

export function ShootingGuideVideo({ ideaId }: { ideaId: string }) {
  const [failed, setFailed] = useState(false);
  const source = `/card-videos/${ideaId}-shooting_guide.mp4`;

  return (
    <section className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal">
            <Clapperboard className="h-3.5 w-3.5" />
            Watch How To Shoot This Reel
          </div>
          <h2 className="mt-3 text-2xl font-semibold">A visual shooting guide for this card</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/60">
            Follow the setup, hook, camera angle, B-roll, edit rhythm, caption, and safety steps before filming your draft.
          </p>
        </div>
      </div>

      {failed ? (
        <div className="grid aspect-video place-items-center rounded-md border border-ink/10 bg-paper p-6 text-center">
          <div>
            <MonitorPlay className="mx-auto h-7 w-7 text-teal" />
            <p className="mt-3 font-semibold">No shooting guide video has been created for this card yet.</p>
            <p className="mt-1 text-sm leading-6 text-ink/55">Use the written Shoot Plan and checklist below.</p>
          </div>
        </div>
      ) : (
        <video
          className="aspect-video w-full rounded-md border border-ink/10 bg-ink shadow-sm"
          controls
          playsInline
          preload="metadata"
          src={source}
          onError={() => setFailed(true)}
        />
      )}
    </section>
  );
}