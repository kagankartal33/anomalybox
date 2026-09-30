"use client";

import { useState } from "react";
import { ChevronDown, Clock, MessageSquare, Mic2, MonitorPlay, Sparkles, Video } from "lucide-react";
import type { CardSection, CardSectionBlock } from "@/lib/card-sections";
import { compactText } from "@/lib/format";

type SceneFlowEvent = {
  start: number;
  end: number;
  title: string;
  action?: string;
  overlay?: string;
  voice?: string;
  onscreen?: string;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value: unknown) {
  return compactText(value, "").trim();
}

function parseTimeRange(value: unknown, fallbackDuration: number) {
  const text = String(value ?? "")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, "")
    .toLowerCase();
  const [startText, endText] = text.split(/-|to/);
  const start = Number.parseInt(startText || "0", 10);
  let end = endText ? Number.parseInt(endText, 10) : start + fallbackDuration;

  if (Number.isNaN(end) || end <= start) end = start + fallbackDuration;
  return {
    start: Math.max(0, Number.isNaN(start) ? 0 : start),
    end,
  };
}

// Helper: build second-by-second events from scene_flow source payload.
// Text details are displayed in separate event cards, so the time rail itself never overlaps.
function buildSceneFlowEvents(section: CardSection) {
  const events: SceneFlowEvent[] = [];
  const payload = section.source_payload || {};

  asArray(payload.shot_list).forEach((item) => {
    const shot = asRecord(item);
    if (!shot) return;
    const range = parseTimeRange(shot.second ?? shot.time, 4);
    events.push({
      ...range,
      title: cleanText(shot.shot ?? shot.type ?? shot.title) || "Action",
      action: cleanText(shot.action) || undefined,
      overlay: cleanText(shot.overlay ?? shot.on_screen_text) || undefined,
    });
  });

  asArray(payload.scene_script).forEach((item) => {
    const scene = asRecord(item);
    if (!scene) return;
    const range = parseTimeRange(scene.second ?? scene.time, 5);
    const voice = cleanText(scene.voiceover ?? (Array.isArray(scene.spoken_lines) ? scene.spoken_lines.join(" ") : ""));
    events.push({
      ...range,
      title: cleanText(scene.purpose ?? scene.beat ?? scene.title) || "Beat",
      action: cleanText(scene.purpose ?? scene.action) || undefined,
      voice: voice || undefined,
      onscreen: cleanText(scene.on_screen_text ?? scene.overlay) || undefined,
    });
  });

  events.sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: SceneFlowEvent[] = [];
  events.forEach((event) => {
    const last = merged[merged.length - 1];
    if (last && Math.abs(last.start - event.start) < 2 && Math.abs(last.end - event.end) < 3) {
      last.title = last.title || event.title;
      last.action = last.action || event.action;
      last.overlay = last.overlay || event.overlay;
      last.voice = last.voice || event.voice;
      last.onscreen = last.onscreen || event.onscreen;
    } else {
      merged.push(event);
    }
  });

  const blueprint = asRecord(payload.video_blueprint);
  const blueprintDuration = Number(blueprint?.duration_seconds);
  const duration = Number.isFinite(blueprintDuration) && blueprintDuration > 0
    ? blueprintDuration
    : merged.length
      ? merged[merged.length - 1].end
      : 38;

  return { events: merged, duration: Math.max(15, duration) };
}

function formatTime(value: number) {
  return `${value}s`;
}

function timelineTicks(duration: number) {
  const step = duration > 45 ? 10 : 5;
  return Array.from({ length: Math.floor(duration / step) + 1 }, (_, index) => index * step);
}

function EventDetail({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="rounded-md border border-ink/10 bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/38">
        <Icon className="h-3.5 w-3.5 text-teal" />
        {label}
      </div>
      <p className="mt-1 text-sm leading-6 text-ink/72">{value}</p>
    </div>
  );
}

function ExecutionTimelineBoard({ events, duration }: { events: SceneFlowEvent[]; duration: number }) {
  if (!events.length) {
    return (
      <div className="timeline-board rounded-md border border-ink/10 bg-paper p-5 text-sm text-ink/60">
        No timed scene data on this card.
      </div>
    );
  }

  return (
    <div className="timeline-board rounded-md border border-ink/10 bg-paper p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-ink/10 pb-4 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Execution Timeline
          </div>
          <h3 className="mt-3 text-xl font-semibold">Second-by-second board</h3>
          <p className="mt-1 text-sm leading-6 text-ink/60">Use the rail for rhythm, then follow each beat card for what to do on camera.</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-white px-3 py-2 text-sm font-semibold text-ink/62">
          Total rhythm: {formatTime(duration)}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="timeline-ruler relative min-w-[640px] px-1 pb-7 pt-1">
          <div className="absolute left-1 right-1 top-7 h-px bg-ink/15" />
          {timelineTicks(duration).map((tick) => {
            const left = Math.min(100, (tick / duration) * 100);
            return (
              <div key={tick} className="timeline-marker absolute top-1" style={{ left: `${left}%` }}>
                <div className="mx-auto h-3 w-px bg-ink/25" />
                <div className="-translate-x-1/2 pt-1 text-[10px] font-semibold text-ink/45">{formatTime(tick)}</div>
              </div>
            );
          })}

          <div className="relative mt-12 h-7 rounded-full border border-ink/10 bg-white shadow-sm">
            {events.map((event, index) => {
              const left = Math.max(0, (event.start / duration) * 100);
              const width = Math.max(2.5, ((event.end - event.start) / duration) * 100);
              return (
                <div
                  key={`${event.start}-${event.end}-${index}`}
                  aria-label={`${event.start}-${event.end}s ${event.title}`}
                  className="absolute top-1 h-5 rounded-full border border-teal/35 bg-teal/15"
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${event.start}-${event.end}s: ${event.title}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="timeline-events mt-5 grid gap-3 md:grid-cols-2">
        {events.map((event, index) => (
          <article key={`${event.start}-${event.end}-${index}`} className="timeline-event-card rounded-md border border-ink/10 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">
                  <Clock className="h-3.5 w-3.5" />
                  {event.start}-{event.end}s
                </div>
                <h4 className="mt-3 text-base font-semibold leading-6">{event.title}</h4>
              </div>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-ink/10 bg-paper text-xs font-semibold text-ink/45">
                {String(index + 1).padStart(2, "0")}
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <EventDetail icon={MonitorPlay} label="Action" value={event.action} />
              <EventDetail icon={MessageSquare} label="Overlay" value={event.overlay} />
              <EventDetail icon={Mic2} label="Voiceover" value={event.voice} />
              <EventDetail icon={Video} label="On screen" value={event.onscreen} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function renderBlock(block: CardSectionBlock, index: number) {
  return (
    <div key={index} className="rounded-md border border-ink/10 bg-white p-3 text-xs shadow-sm">
      <div className="mb-2 font-semibold">{block.title}</div>
      {block.type === "timeline" && block.items ? (
        <ul className="space-y-1 text-ink/80">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>
              {item.time ? `${item.time}: ` : ""}
              {item.title}
              {item.body ? ` - ${item.body}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
      {block.type === "shot_list" && block.items ? (
        <ul className="space-y-1 text-ink/80">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>
              {item.time ? `${item.time} ` : ""}
              {item.title}
              {item.action ? `: ${item.action}` : ""}
              {item.overlay ? ` / ${item.overlay}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
      {block.type === "key_value" && block.rows ? (
        <div className="grid grid-cols-1 gap-y-1">
          {block.rows.map((row, rowIndex) => (
            <div key={rowIndex}>
              <span className="text-ink/60">{row.label}:</span> {row.value}
            </div>
          ))}
        </div>
      ) : null}
      {block.type === "text" ? <div className="text-ink/80">{block.body}</div> : null}
      {block.type === "list" ? (
        <ul className="list-disc pl-4 text-ink/80">
          {block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
        </ul>
      ) : null}
      {block.type === "caption_pack" ? (
        <div className="text-ink/70">Caption and comment prompts are included in this card.</div>
      ) : null}
      {block.type === "safety" ? (
        <div className="text-ink/70">Safety boundaries and disclosure notes are included.</div>
      ) : null}
    </div>
  );
}

export function CardSections({ sections, cardId }: { sections: CardSection[]; cardId?: string }) {
  const [open, setOpen] = useState(sections[0]?.key ?? "");

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const active = open === section.key;
        const sceneFlow = section.key === "scene_flow" ? buildSceneFlowEvents(section) : null;
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
                {section.key === "scene_flow" && sceneFlow ? (
                  <>
                    <div className="mt-1">
                      <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Watch the Flow (Custom 3-6s)</div>
                      <video
                        className="w-full max-w-md rounded-md border border-ink/10 bg-paper shadow-sm"
                        controls
                        muted
                        loop
                        playsInline
                        src={cardId ? `/card-videos/${cardId}-scene_flow.mp4` : "/card-videos/scene-flow-demo.mp4"}
                      />
                      <p className="mt-2 text-[11px] leading-5 text-ink/55">Exact sequence for this card. Play to see the second-by-second execution.</p>
                    </div>

                    <ExecutionTimelineBoard events={sceneFlow.events} duration={sceneFlow.duration} />
                  </>
                ) : null}

                {section.blocks.length > 0 ? (
                  <div className={section.key === "scene_flow" ? "mt-1" : ""}>
                    {section.key === "scene_flow" ? (
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Full Scene Details</div>
                    ) : null}
                    <div className="space-y-3">
                      {section.blocks.map(renderBlock)}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}