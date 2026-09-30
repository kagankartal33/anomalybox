"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Gem, Package, Sparkles } from "lucide-react";
import { openViralBox } from "@/app/boxes/actions";
import { StatusPill } from "@/components/StatusPill";

type BoxItem = {
  id: string;
  idea_id: string;
  slot_index: number;
  title: string;
  premise?: string;
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

function BoxVisual({ opened, count }: { opened: boolean; count: number }) {
  return (
    <div className="relative mx-auto h-48 w-full max-w-[280px]">
      <div className="absolute inset-x-10 bottom-4 h-24 rounded-md border border-ink/10 bg-[#2A211D] shadow-soft" />
      <div className="absolute inset-x-7 bottom-24 h-10 origin-bottom rounded-md border border-ink/10 bg-[#6F3E2D] shadow-soft transition-transform duration-500 group-hover:-translate-y-3 group-hover:rotate-[-4deg]" />
      <div className="absolute inset-x-12 bottom-10 h-28 rounded-md bg-[#E7C68F] shadow-inner" />
      <div className="absolute left-1/2 bottom-10 h-28 w-7 -translate-x-1/2 bg-[#B83241]" />
      <div className="absolute inset-x-12 bottom-[86px] h-7 bg-[#B83241]" />
      {opened ? (
        <>
          <div className="absolute left-10 top-3 h-28 w-20 rotate-[-10deg] rounded-md border border-ink/10 bg-white shadow-soft" />
          <div className="absolute left-1/2 top-0 h-32 w-24 -translate-x-1/2 rounded-md border border-ink/10 bg-mist shadow-soft" />
          <div className="absolute right-10 top-5 h-28 w-20 rotate-[11deg] rounded-md border border-ink/10 bg-white shadow-soft" />
          <div className="absolute inset-x-0 bottom-0 text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">{count} cards revealed</div>
        </>
      ) : (
        <>
          <div className="absolute left-1/2 top-8 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full bg-white/90 shadow-soft transition-transform duration-500 group-hover:scale-110">
            <Sparkles className="h-7 w-7 text-coral" />
          </div>
          <div className="absolute inset-x-0 bottom-0 text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">sealed idea box</div>
        </>
      )}
    </div>
  );
}

function OpenDialog({ box, onClose }: { box: CreatorBox; onClose: () => void }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-md border border-white/20 bg-white p-6 shadow-soft">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-mist px-3 py-1 text-xs font-semibold text-ink/60">
          <Gem className="h-3.5 w-3.5 text-coral" />
          Premium box reveal
        </div>
        <h2 className="text-3xl font-semibold leading-tight">Open this ViralBox and reveal your private creator cards?</h2>
        <p className="mt-3 leading-7 text-ink/65">
          This will unlock {box.items.length} execution-ready idea cards for {box.category_name} / {box.persona_name}. Once opened, the cards stay saved in your creator workspace.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 font-semibold text-white disabled:bg-ink/40"
            disabled={pending}
            onClick={() => startTransition(async () => {
              await openViralBox(box.id);
              onClose();
            })}
            type="button"
          >
            {pending ? "Opening..." : "Yes, reveal my cards"}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button className="rounded-md border border-ink/15 px-4 py-3 font-semibold" disabled={pending} onClick={onClose} type="button">
            Keep it sealed
          </button>
        </div>
      </div>
    </div>
  );
}

export function ViralBoxShelf({ boxes }: { boxes: CreatorBox[] }) {
  const [selected, setSelected] = useState<CreatorBox | null>(null);

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        {boxes.map((box) => {
          const opened = Boolean(box.opened_at);
          return (
            <article key={box.id} className="group overflow-hidden rounded-md border border-ink/10 bg-white shadow-soft">
              <div className="border-b border-ink/10 bg-gradient-to-br from-white to-mist/60 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/60 shadow-soft">
                    <Package className="h-3.5 w-3.5 text-teal" />
                    {opened ? "Opened creator box" : "Sealed creator box"}
                  </div>
                  <StatusPill value={opened ? "opened" : "unopened"} />
                </div>
                <button className="block w-full text-left" onClick={() => !opened && setSelected(box)} type="button">
                  <BoxVisual opened={opened} count={box.items.length} />
                </button>
              </div>
              <div className="p-5">
                <h2 className="text-2xl font-semibold">{box.product_name}</h2>
                <p className="mt-1 text-sm text-ink/55">{box.category_name} / {box.persona_name}</p>
                {!opened ? (
                  <button className="mt-5 w-full rounded-md bg-ink px-4 py-3 font-semibold text-white transition-transform hover:-translate-y-0.5" onClick={() => setSelected(box)} type="button">
                    Reveal this ViralBox
                  </button>
                ) : (
                  <div className="mt-5 grid gap-3">
                    {box.items.map((item) => (
                      <Link key={item.id} className="rounded-md border border-ink/10 bg-paper p-4 transition hover:border-teal/50 hover:bg-mist" href={`/cards/${item.idea_id}`}>
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Premium card {item.slot_index}</div>
                        <h3 className="mt-1 font-semibold">{item.title}</h3>
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