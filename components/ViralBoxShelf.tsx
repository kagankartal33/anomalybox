"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Gem, Package, Sparkles } from "lucide-react";
import { openCreativeDossier } from "@/app/boxes/actions";
import { StatusPill } from "@/components/StatusPill";

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
      label: "SIGNATURE PURPLE DOSSIER",
      shell: "bg-[#28153B]",
      lid: "bg-[#5B2A86]",
      body: "bg-[#8E5BD6]",
      ribbon: "bg-[#D8B4FE]",
      glow: "bg-[#EFE6FF]",
      accentText: "text-[#6D28D9]",
      headerClass: "bg-[radial-gradient(circle_at_50%_20%,#F3E8FF_0%,#FBFAF7_48%,#F5F1EA_100%)]",
      buttonClass: "bg-[#4C1D75] text-white hover:bg-[#3B0764]",
      cardHoverClass: "hover:border-[#7E22CE]/45 hover:bg-[#F7F0FF]",
      cardNumberClass: "text-[#7E22CE]",
      foil: "bg-[#F3D7FF]",
    };
  }

  return {
    name: "red",
    label: "Classic Red Dossier",
    shell: "bg-[#3B1719]",
    lid: "bg-[#9F2637]",
    body: "bg-[#D74654]",
    ribbon: "bg-[#FFD2BC]",
    glow: "bg-[#FFF1EA]",
    accentText: "text-[#B42335]",
    headerClass: "bg-[radial-gradient(circle_at_50%_20%,#FFE6DD_0%,#FBFAF7_48%,#F5F1EA_100%)]",
    buttonClass: "bg-[#A52434] text-white hover:bg-[#811827]",
    cardHoverClass: "hover:border-[#B42335]/45 hover:bg-[#FFF5F1]",
    cardNumberClass: "text-[#B42335]",
    foil: "bg-[#FFD8C2]",
  };
}

function BoxVisual({ opened, count, theme }: { opened: boolean; count: number; theme: BoxTheme }) {
  return (
    <div className={`viralbox-art relative mx-auto h-52 w-full max-w-[300px] ${opened ? "is-open" : "is-sealed"}`}>
      <div className={`absolute left-1/2 top-7 h-36 w-36 -translate-x-1/2 rounded-full blur-3xl transition-opacity duration-500 ${theme.glow} ${opened ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`} />
      <div className={`absolute inset-x-8 bottom-4 h-28 rounded-[10px] border border-white/25 ${theme.shell} shadow-soft`} />
      <div className={`viralbox-lid absolute inset-x-5 bottom-[126px] h-12 origin-bottom rounded-[10px] border border-white/30 ${theme.lid} shadow-soft transition-transform duration-500`} />
      <div className={`absolute inset-x-10 bottom-10 h-32 rounded-[9px] border border-white/25 ${theme.body} shadow-inner`} />
      <div className="absolute inset-x-12 bottom-10 h-32 rounded-[8px] bg-gradient-to-br from-white/18 via-transparent to-ink/10" />
      <div className={`absolute left-1/2 bottom-10 h-32 w-7 -translate-x-1/2 ${theme.ribbon}`} />
      <div className={`absolute inset-x-10 bottom-[94px] h-7 ${theme.ribbon}`} />
      <div className={`absolute left-1/2 bottom-[78px] grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full border border-white/40 ${theme.foil} shadow-soft`}>
        <Gem className={`h-6 w-6 ${theme.accentText}`} />
      </div>
      {opened ? (
        <>
          <div className="viralbox-card-rise viralbox-card-rise-left absolute left-9 top-4 h-32 w-20 rotate-[-10deg] rounded-md border border-ink/10 bg-white shadow-soft">
            <div className={`mx-3 mt-4 h-1.5 rounded-full ${theme.foil}`} />
            <div className="mx-3 mt-3 h-1 rounded-full bg-ink/10" />
            <div className="mx-3 mt-2 h-1 rounded-full bg-ink/10" />
          </div>
          <div className="viralbox-card-rise viralbox-card-rise-center absolute left-1/2 top-0 h-36 w-24 -translate-x-1/2 rounded-md border border-ink/10 bg-white shadow-soft">
            <div className={`mx-4 mt-5 h-1.5 rounded-full ${theme.foil}`} />
            <div className="mx-4 mt-3 h-1 rounded-full bg-ink/10" />
            <div className="mx-4 mt-2 h-1 rounded-full bg-ink/10" />
            <div className="mx-4 mt-2 h-1 rounded-full bg-ink/10" />
          </div>
          <div className="viralbox-card-rise viralbox-card-rise-right absolute right-9 top-5 h-32 w-20 rotate-[11deg] rounded-md border border-ink/10 bg-white shadow-soft">
            <div className={`mx-3 mt-4 h-1.5 rounded-full ${theme.foil}`} />
            <div className="mx-3 mt-3 h-1 rounded-full bg-ink/10" />
            <div className="mx-3 mt-2 h-1 rounded-full bg-ink/10" />
          </div>
          <div className="absolute inset-x-0 bottom-0 text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">{count} cards revealed</div>
        </>
      ) : (
        <>
          <div className="absolute left-1/2 top-10 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full bg-white/90 shadow-soft transition-transform duration-500 group-hover:scale-110">
            <Sparkles className={`h-7 w-7 ${theme.accentText}`} />
          </div>
          <div className="absolute inset-x-0 bottom-0 text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">sealed idea box</div>
        </>
      )}
    </div>
  );
}

function OpenDialog({ box, onClose }: { box: CreatorBox; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const theme = boxTheme(box);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-md border border-white/20 bg-white p-6 shadow-soft">
        <div className="mb-5 rounded-md border border-ink/10 bg-paper p-4">
          <BoxVisual opened={false} count={box.items.length} theme={theme} />
        </div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-mist px-3 py-1 text-xs font-semibold text-ink/60">
          <Gem className={`h-3.5 w-3.5 ${theme.accentText}`} />
          Private dossier access
        </div>
        <h2 className="text-3xl font-semibold leading-tight">Open your {theme.label} and reveal the private creator cards?</h2>
        <p className="mt-3 leading-7 text-ink/65">
          This will unlock {box.items.length} execution-ready idea cards for {box.category_name} / {box.persona_name}. Once opened, the cards stay saved in your creator workspace.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className={`focus-ring flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 font-semibold transition disabled:bg-ink/40 ${theme.buttonClass}`}
            disabled={pending}
            onClick={() => startTransition(async () => {
              await openCreativeDossier(box.id);
              onClose();
            })}
            type="button"
          >
            {pending ? "Unlocking..." : "Access my private briefs"}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button className="rounded-md border border-ink/15 px-4 py-3 font-semibold" disabled={pending} onClick={onClose} type="button">
            Keep it secured
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
                    {opened ? "Available creative dossier" : "Secured creative dossier"}
                  </div>
                  <StatusPill value={opened ? "opened" : "unopened"} />
                </div>
                <button className="block w-full text-left" onClick={() => !opened && setSelected(box)} type="button">
                  <BoxVisual opened={opened} count={box.items.length} theme={theme} />
                </button>
              </div>
              <div className="p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${theme.cardNumberClass}`}>{theme.label}</p>
                    <h2 className="mt-1 text-2xl font-semibold">{theme.label}</h2>
                    <p className="mt-1 text-sm text-ink/55">{box.category_name} / {box.persona_name}</p>
                  </div>
                  <div className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs font-semibold text-ink/55">
                    {box.items.length} private briefs
                  </div>
                </div>
                {!opened ? (
                  <button className={`mt-5 w-full rounded-md px-4 py-3 font-semibold transition-transform hover:-translate-y-0.5 ${theme.buttonClass}`} onClick={() => setSelected(box)} type="button">
                    Unlock this dossier
                  </button>
                ) : (
                  <div className="mt-5 grid gap-3">
                    {box.items.map((item) => (
                      <Link key={item.id} className={`rounded-md border border-ink/10 bg-paper p-4 transition ${theme.cardHoverClass}`} href={`/cards/${item.idea_id}`}>
                        <div className={`text-xs font-semibold uppercase tracking-[0.14em] ${theme.cardNumberClass}`}>Private brief {item.slot_index}</div>
                        <h3 className="mt-1 text-base font-semibold leading-6">{item.title}</h3>
                        {item.premise ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/60">{item.premise}</p> : null}
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