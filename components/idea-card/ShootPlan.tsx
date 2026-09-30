"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { IdeaCard, IdeaCardStep } from "@/lib/idea-card";
import { formatTimeRange, stageLabel } from "@/lib/idea-card";
import { premiumAssets } from "@/lib/premium-assets";
import { CardGuideFigure } from "./CardGuideFigure";

type Field = { label: string; value?: string; icon: string };

function stepFields(step: IdeaCardStep): Field[] {
  return [
    { label: "Goal", value: step.goal, icon: premiumAssets.cardGuides.fieldIcons.goal },
    { label: "Action", value: step.action, icon: premiumAssets.cardGuides.fieldIcons.action },
    { label: "Say this", value: step.spokenLine, icon: premiumAssets.cardGuides.fieldIcons.sayThis },
    { label: "Shot", value: step.shot, icon: premiumAssets.cardGuides.fieldIcons.shot },
    { label: "On-screen text", value: step.onScreenText, icon: premiumAssets.cardGuides.fieldIcons.onScreenText },
    { label: "Edit note", value: step.editNote, icon: premiumAssets.cardGuides.fieldIcons.editNote },
    { label: "Performance note", value: step.performanceNote, icon: premiumAssets.cardGuides.fieldIcons.performanceNote },
  ].filter((field) => Boolean(field.value?.trim()));
}

function ShootStepCard({
  step,
  open,
  onToggle,
  panelId,
  headerId,
}: {
  step: IdeaCardStep;
  open: boolean;
  onToggle: () => void;
  panelId: string;
  headerId: string;
}) {
  const fields = stepFields(step);

  return (
    <article className="overflow-hidden rounded-lg border border-ink/10 bg-white">
      <h3 className="m-0 text-base font-semibold">
        <button
          id={headerId}
          type="button"
          className="focus-ring flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-paper/60 sm:px-5"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold tabular-nums text-ink/60">
                {formatTimeRange(step.startSecond, step.endSecond)}
              </span>
              <span className="rounded-full bg-plum-soft px-2 py-0.5 text-xs font-semibold text-plum-deep">
                {stageLabel(step.stage, step.customStageLabel)}
              </span>
              <span className="text-xs text-ink/40">Step {step.order}</span>
            </span>
            <span className="mt-1.5 block text-[15px] font-semibold leading-snug text-ink sm:text-base">
              {step.purpose}
            </span>
          </span>
          <ChevronDown
            className={`mt-1 h-5 w-5 shrink-0 text-plum transition ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </h3>

      {open ? (
        <div id={panelId} role="region" aria-labelledby={headerId} className="border-t border-ink/10 px-4 py-4 sm:px-5">
          <dl className="space-y-3">
            {fields.map((field) => (
              <div key={field.label} className="grid grid-cols-[28px_1fr] gap-3 rounded-lg bg-[#F8F5EF] px-3 py-3">
                <Image src={field.icon} alt="" width={22} height={22} className="mt-0.5 h-[22px] w-[22px]" />
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-plum">{field.label}</dt>
                  <dd className="mt-1 text-[15px] leading-6 text-ink/80 sm:leading-7">
                    {field.label === "Say this" ? `“${field.value}”` : field.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </article>
  );
}

export function ShootPlan({ card }: { card: IdeaCard }) {
  const baseId = useId();
  const [openAll, setOpenAll] = useState(false);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(card.steps.map((step, index) => [step.id, index === 0])),
  );

  function setStepOpen(id: string, value: boolean) {
    setOpenMap((current) => ({ ...current, [id]: value }));
  }

  function toggleAll() {
    const next = !openAll;
    setOpenAll(next);
    setOpenMap(Object.fromEntries(card.steps.map((step) => [step.id, next])));
  }

  return (
    <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-soft sm:p-6" aria-labelledby="shoot-plan-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-plum">Execution detail</p>
          <h2 id="shoot-plan-heading" className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Shoot Plan
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink/55">
            Detailed steps — open one at a time, or expand all.
          </p>
        </div>
        <button
          type="button"
          className="focus-ring rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-paper"
          onClick={toggleAll}
        >
          {openAll ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="mt-5">
        <CardGuideFigure
          src={premiumAssets.cardGuides.shootPlanAnatomy}
          alt="A premium shoot-planning dossier combining goal, action, spoken delivery, camera framing, safe text area, edit timing, and performance energy"
          eyebrow="Shoot plan anatomy"
          title="Seven decisions, one executable step"
          description="Each open step combines intent, action, delivery, framing, text, edit, and performance direction."
        />
      </div>

      <div className="mt-5 space-y-3">
        {card.steps.map((step, index) => (
          <ShootStepCard
            key={step.id}
            step={step}
            open={Boolean(openMap[step.id])}
            onToggle={() => setStepOpen(step.id, !openMap[step.id])}
            panelId={`${baseId}-panel-${index}`}
            headerId={`${baseId}-header-${index}`}
          />
        ))}
      </div>
    </section>
  );
}