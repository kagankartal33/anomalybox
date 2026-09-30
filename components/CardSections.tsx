"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, Clock3, MessageSquareText, ShieldCheck } from "lucide-react";
import type { CardSection, CardSectionBlock } from "@/lib/card-sections";

export function CardSections({ sections }: { sections: CardSection[] }) {
  const [open, setOpen] = useState(sections[0]?.key ?? "");

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const active = open === section.key;
        return (
          <div key={section.key} className="overflow-hidden rounded-md border border-ink/10 bg-white shadow-sm">
            <button
              aria-expanded={active}
              className="focus-ring flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
              onClick={() => setOpen(active ? "" : section.key)}
              type="button"
            >
              <span>
                <span className="block font-semibold">{section.title}</span>
                <span className="mt-1 block text-xs font-normal leading-5 text-ink/55">{section.short_summary}</span>
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition ${active ? "rotate-180" : ""}`} />
            </button>
            {active ? (
              <div className="space-y-5 border-t border-ink/10 px-4 py-4 text-sm leading-6">
                <div className="grid gap-3 md:grid-cols-3">
                  <InfoCard label="What this means" value={section.short_summary} />
                  <InfoCard label="How to execute" value={section.how_to_do_it} />
                  <InfoCard label="What good looks like" value={section.what_good_looks_like} />
                </div>

                {section.blocks.map((block, index) => <BlockRenderer block={block} key={`${block.type}-${block.title}-${index}`} />)}

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoCard label="Example execution" value={section.example_execution} />
                  {section.common_mistakes.length ? (
                    <div className="rounded-md border border-coral/15 bg-coral/5 p-3">
                      <div className="flex items-center gap-2 font-semibold text-coral">
                        <AlertTriangle className="h-4 w-4" />
                        Common mistakes
                      </div>
                      <ul className="mt-2 space-y-1 text-ink/70">
                        {section.common_mistakes.map((item) => <li key={item}>- {item}</li>)}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper/70 p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">{label}</div>
      <p className="mt-2 text-ink/70">{value}</p>
    </div>
  );
}

function BlockRenderer({ block }: { block: CardSectionBlock }) {
  if (block.type === "text") {
    return (
      <BlockShell title={block.title}>
        <p className="text-ink/70">{block.body}</p>
      </BlockShell>
    );
  }

  if (block.type === "list") {
    return (
      <BlockShell title={block.title}>
        <ul className="space-y-2">
          {block.items.map((item) => <li className="rounded-md bg-mist/50 px-3 py-2 text-ink/75" key={item}>{item}</li>)}
        </ul>
      </BlockShell>
    );
  }

  if (block.type === "key_value") {
    return (
      <BlockShell title={block.title}>
        <div className="divide-y divide-ink/10 overflow-hidden rounded-md border border-ink/10">
          {block.rows.map((row) => (
            <div className="grid gap-2 bg-white px-3 py-3 md:grid-cols-[180px_1fr]" key={`${row.label}-${row.value}`}>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/40">{row.label}</div>
              <div className="text-ink/75">{row.value}</div>
            </div>
          ))}
        </div>
      </BlockShell>
    );
  }

  if (block.type === "timeline") {
    return (
      <BlockShell icon={<Clock3 className="h-4 w-4" />} title={block.title}>
        <div className="space-y-3">
          {block.items.map((item, index) => (
            <div className="grid gap-3 rounded-md border border-ink/10 bg-white p-3 md:grid-cols-[90px_1fr]" key={`${item.time}-${item.title}-${index}`}>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">{item.time ?? `Beat ${index + 1}`}</div>
              <div>
                <div className="font-semibold">{item.title}</div>
                {item.body ? <p className="mt-1 text-ink/70">{item.body}</p> : null}
                {item.meta?.length ? (
                  <ul className="mt-2 space-y-1 text-ink/60">
                    {item.meta.map((meta) => <li key={meta}>- {meta}</li>)}
                  </ul>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </BlockShell>
    );
  }

  if (block.type === "shot_list") {
    return (
      <BlockShell title={block.title}>
        <div className="grid gap-3 md:grid-cols-2">
          {block.items.map((item, index) => (
            <div className="rounded-md border border-ink/10 bg-white p-3" key={`${item.title}-${index}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{item.title}</div>
                {item.time ? <div className="rounded-full bg-teal/10 px-2 py-1 text-xs font-semibold text-teal">{item.time}</div> : null}
              </div>
              {item.action ? <p className="mt-2 text-ink/70">{item.action}</p> : null}
              {item.overlay ? <p className="mt-2 rounded-md bg-mist/60 px-3 py-2 text-ink/65">On-screen: {item.overlay}</p> : null}
              {item.note ? <p className="mt-2 text-ink/55">{item.note}</p> : null}
            </div>
          ))}
        </div>
      </BlockShell>
    );
  }

  if (block.type === "caption_pack") {
    return (
      <BlockShell icon={<MessageSquareText className="h-4 w-4" />} title={block.title}>
        <div className="grid gap-3 lg:grid-cols-2">
          <ListPanel items={block.captions} title="Caption options" />
          <ListPanel items={block.onScreenText} title="On-screen text" />
          {block.cta ? <InfoCard label="CTA" value={block.cta} /> : null}
          {block.pinnedComment ? <InfoCard label="Pinned comment" value={block.pinnedComment} /> : null}
          {block.audienceQuestion ? <InfoCard label="Audience question" value={block.audienceQuestion} /> : null}
          {block.storyPoll ? <InfoCard label="Story poll" value={block.storyPoll} /> : null}
          {block.storyOptions?.length ? <ListPanel items={block.storyOptions} title="Story poll options" /> : null}
          {block.followupFrame ? <InfoCard label="Follow-up frame" value={block.followupFrame} /> : null}
        </div>
      </BlockShell>
    );
  }

  return (
    <BlockShell icon={<ShieldCheck className="h-4 w-4" />} title={block.title}>
      <div className="grid gap-3 lg:grid-cols-2">
        {block.disclosure ? <InfoCard label="Disclosure" value={block.disclosure} /> : null}
        {block.claimBoundary ? <InfoCard label="Claim boundary" value={block.claimBoundary} /> : null}
        {block.evidenceNote ? <InfoCard label="Evidence note" value={block.evidenceNote} /> : null}
        {block.saferAlternative ? <InfoCard label="Safer alternative" value={block.saferAlternative} /> : null}
        {block.doNotSay.length ? <ListPanel danger items={block.doNotSay} title="Do not say" /> : null}
      </div>
    </BlockShell>
  );
}

function BlockShell({ children, icon, title }: { children: React.ReactNode; icon?: React.ReactNode; title: string }) {
  return (
    <section className="rounded-md border border-ink/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 font-semibold">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function ListPanel({ danger = false, items, title }: { danger?: boolean; items: string[]; title: string }) {
  if (!items.length) return null;
  return (
    <div className={`rounded-md border p-3 ${danger ? "border-coral/20 bg-coral/5" : "border-ink/10 bg-paper/70"}`}>
      <div className={`text-xs font-semibold uppercase tracking-[0.14em] ${danger ? "text-coral" : "text-ink/40"}`}>{title}</div>
      <ul className="mt-2 space-y-2 text-ink/70">
        {items.map((item) => <li key={item}>- {item}</li>)}
      </ul>
    </div>
  );
}