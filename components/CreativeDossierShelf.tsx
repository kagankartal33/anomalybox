"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { ArrowRight, ChevronRight, Gem, Package } from "lucide-react";
import { openCreativeDossier } from "@/app/boxes/actions";
import { StatusPill } from "@/components/StatusPill";
import { CreativeDossierVisual, type CreativeDossierVariant } from "@/components/CreativeDossierVisual";

type BoxItem = {
  id: string;
  idea_id: string;
  slot_index: number;
  title: string;
  premise?: string;
};

type BoxTheme = {
  name: "purple" | "red";
  label: string;
  shell: string;
  lid: string;
  body: string;
  ribbon: string;
  glow: string;
  accentText: string;
  headerClass: string;
  buttonClass: string;
  cardHoverClass: string;
  cardNumberClass: string;
  foil: string;
};

export type CreatorBox = {
  id: string;
  status: string;
  created_at: string;
  delivered_at?: string | null;
  opened_at?: string | null;
  product_name: string;
  product_slug: string;
  category_name: string;
  persona_name: string;
  items: BoxItem[];
};

function boxTheme(box: CreatorBox): BoxTheme {
  const marker = `${box.product_name} ${box.product_slug}`.toLowerCase();
  const premium = marker.includes("1000") || marker.includes("elite") || marker.includes("signature");

  if (premium) {
    return {
      name: "purple",
      label: "Signature Purple Brief",
      shell: "bg-[#312937]",
      lid: "bg-[#5C4D64]",
      body: "bg-[#725F7B]",
      ribbon: "bg-[#B5A8BB]",
      glow: "bg-[#EEE8F0]",
      accentText: "text-plum",
      headerClass: "bg-[#F1ECF1]",
      buttonClass: "bg-plum-deep text-white hover:bg-[#3F3545]",
      cardHoverClass: "hover:border-plum/40 hover:bg-[#F5F0F5]",
      cardNumberClass: "text-plum-deep",
      foil: "bg-[#D5CAD8]",
    };
  }

  return {
    name: "red",
    label: "Classic Red Brief",
    shell: "bg-[#3B1719]",
    lid: "bg-[#9F2637]",
    body: "bg-[#D74654]",
    ribbon: "bg-[#FFD2BC]",
    glow: "bg-[#FFF1EA]",
    accentText: "text-[#B42335]",
    headerClass: "bg-[#F7EEEB]",
    buttonClass: "bg-[#963B48] text-white hover:bg-[#7D303B]",
    cardHoverClass: "hover:border-[#B42335]/45 hover:bg-[#FFF5F1]",
    cardNumberClass: "text-[#B42335]",
    foil: "bg-[#FFD8C2]",
  };
}

function getVariantFromTheme(theme: BoxTheme): CreativeDossierVariant {
  return theme.name === "purple" ? "purple" : "red";
}

function playLuxuryUnboxChime() {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(528, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.35);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1056, now + 0.08);
    gain2.gain.setValueAtTime(0.001, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.06, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 1.3);
    osc2.start(now + 0.08);
    osc2.stop(now + 1.5);
  } catch {
    // Graceful fallback
  }
}

function triggerHapticFeedback() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([15, 30, 20]);
    }
  } catch {
    // Graceful fallback
  }
}

function OpenDialog({ box, onClose }: { box: CreatorBox; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const theme = boxTheme(box);
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) return;
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((node) => !node.hasAttribute("disabled"));
      if (!nodes.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [onClose, pending]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 px-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-lg rounded-md border border-white/20 bg-white p-6 shadow-soft"
      >
        <div className="mb-5 rounded-md border border-ink/10 bg-paper p-4">
          <CreativeDossierVisual variant={getVariantFromTheme(theme)} itemCount={box.items.length} />
        </div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-mist px-3 py-1 text-xs font-semibold text-ink/60">
          <Gem className={`h-3.5 w-3.5 ${theme.accentText}`} />
          Private shoot briefs
        </div>
        <h2 id={titleId} className="text-3xl font-semibold leading-tight">
          Open this {theme.label} box and access your shoot briefs?
        </h2>
        <p id={descriptionId} className="mt-3 leading-7 text-ink/65">
          This opens {box.items.length} shoot-ready brief{box.items.length === 1 ? "" : "s"} for {box.category_name} / {box.persona_name}.
          Opened briefs stay in your vault.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className={`focus-ring flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 font-semibold transition disabled:bg-ink/40 ${theme.buttonClass}`}
            disabled={pending}
            onClick={() => {
              playLuxuryUnboxChime();
              triggerHapticFeedback();
              startTransition(async () => {
                await openCreativeDossier(box.id);
                onClose();
              });
            }}
            type="button"
          >
            {pending ? "Opening..." : "Open my briefs"}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button className="focus-ring rounded-md border border-ink/15 px-4 py-3 font-semibold" disabled={pending} onClick={onClose} type="button">
            Keep sealed
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreativeDossierShelf({ boxes }: { boxes: CreatorBox[] }) {
  const [selected, setSelected] = useState<CreatorBox | null>(null);

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        {boxes.map((box) => {
          const opened = Boolean(box.opened_at);
          const theme = boxTheme(box);
          return (
            <article key={box.id} className="group overflow-hidden rounded-md border border-ink/10 bg-white shadow-soft">
              <div className={`border-b border-ink/10 p-5 ${theme.headerClass}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/60 shadow-soft">
                    <Package className={`h-3.5 w-3.5 ${theme.accentText}`} />
                    {opened ? "Opened box" : "Sealed box"}
                  </div>
                  <StatusPill value={opened ? "opened" : "unopened"} />
                </div>

                <div className="-mt-1 mb-3 text-[11px] font-medium tracking-wide text-ink/55">
                  {box.category_name} / {box.persona_name}
                </div>

                <button
                  className="focus-ring block w-full rounded-md text-left"
                  onClick={() => !opened && setSelected(box)}
                  type="button"
                  aria-label={opened ? `${theme.label} ready to use` : `Open ${theme.label} box`}
                  disabled={opened}
                >
                  <CreativeDossierVisual variant={getVariantFromTheme(theme)} available={opened} itemCount={box.items.length} />
                </button>
              </div>
              <div className="p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${theme.cardNumberClass}`}>Brief Dossier</p>
                    <h2 className="mt-1 text-2xl font-semibold">{theme.label}</h2>
                  </div>
                  <div className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs font-semibold text-ink/55">
                    {box.items.length} shoot brief{box.items.length === 1 ? "" : "s"}
                  </div>
                </div>
                {!opened ? (
                  <button
                    className={`focus-ring mt-5 w-full rounded-md px-4 py-3 font-semibold transition active:scale-[0.99] ${theme.buttonClass}`}
                    onClick={() => setSelected(box)}
                    type="button"
                  >
                    Open box and view briefs
                  </button>
                ) : (
                  <div className="mt-5 grid gap-2.5">
                    {box.items.map((item, idx) => (
                      <Link
                        key={item.id}
                        className={`focus-ring group/card flex items-start justify-between gap-3 rounded-xl border border-ink/10 bg-paper p-4 transition ${theme.cardHoverClass}`}
                        href={`/cards/${item.idea_id}`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${theme.headerClass} ${theme.cardNumberClass} border border-ink/10`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className={`text-[10px] font-bold uppercase tracking-[0.14em] mb-0.5 ${theme.cardNumberClass}`}>Brief {idx + 1}</div>
                            <h3 className="text-base font-semibold leading-snug text-ink">{item.title}</h3>
                            {item.premise ? <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-ink/55">{item.premise}</p> : null}
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 shrink-0 mt-1.5 transition-transform group-hover/card:translate-x-0.5 ${theme.cardNumberClass} opacity-40 group-hover/card:opacity-70`} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {selected ? <OpenDialog box={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}
