"use client";

import { useState }

function fieldText(value: string | undefined) {
  return value && value.trim() ? value.trim() : "";
}

function sayDisplay(range: ExecutionRange) {
  if (!range.say) return "";
  return `Deliver the line in your own voice, keeping a ${range.say_tone || "natural"} tone: "${range.say}"`;
}

function onScreenDisplay(range: ExecutionRange) {
  if (!range.on_screen_text) return "";
  return `${range.on_screen_text_required ? "Use this exact on-screen text" : "Optional on-screen text"}: "${range.on_screen_text}"`;
}

function RangeNote({
  label,
  value,
  tone = "default",
  optional = false,
}: {
  label: string;
  value: string;
  tone?: "default" | "yellow" | "teal" | "lavender";
  optional?: boolean;
}) {
  if (!fieldText(value)) return null;

  const toneClass = {
    default: "border-ink/10 bg-white",
    yellow: "border-yellow-300/70 bg-yellow-50",
    teal: "border-teal/25 bg-teal/10",
    lavender: "border-purple-200 bg-purple-50",
  }[tone];

  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/45">
        <span>{label}</span>
        {optional ? (
          <span className="rounded-full border border-ink/10 bg-white px-2 py-0.5 text-[0.62rem] tracking-[0.1em] text-ink/45">
            Optional
          </span>
        ) : null}
      </div>
      <p className="text-sm leading-6 text-ink/78">{value}</p>
    </div>
  );
}

function RangeOverviewList({ ranges, mode }: { ranges: ExecutionRange[]; mode: FrameBoardMode }) {
  const isEditing = mode === "editing";
  return (
    <div className="space-y-3">
      {ranges.map((range, index) => {
        const editText = fieldText(range.edit || range.edit_direction);
        const editDetails = [range.cut_point, range.transition_style, range.overlay_timing, range.audio_cue, range.pacing_note]
          .map(fieldText)
          .filter(Boolean)
          .join(" ");

        return (
          <article key={`${mode}-range-${range.time_range}-${index}`} className="rounded-md border border-ink/10 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-ink/10 pb-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-teal">
                  {isEditing ? "Edit range" : "Shooting range"}
                </div>
                <h4 className="mt-1 text-lg font-semibold leading-7 text-ink">{title}</h4>
              </div>
              <span className="w-fit rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink/55">{String(index + 1).padStart(2, "0")}</span>
            </div>

            {isEditing ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <RangeNote label="Edit" value={editText} />
                <RangeNote label="Cut / transition" value={editDetails} />
                <RangeNote label="On-screen text" value={onScreenDisplay(range)} optional={!range.on_screen_text_required} tone="teal" />
                <RangeNote label="Voice sync" value={sayDisplay(range)} tone="lavender" />
                <RangeNote label="Creator touch" value={fieldText(range.creator_touch || range.creator_customization)} tone="yellow" />
                <RangeNote label="Final check" value={fieldText(range.final_check)} />
              </div>
            ) : (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <RangeNote label="Action" value={fieldText(range.action || range.pose_micro_behavior || range.shoot_direction)} />
                <RangeNote label="Camera" value={fieldText(range.camera || range.camera_direction)} />
                <RangeNote label="Say" value={sayDisplay(range)} tone="lavender" />
                <RangeNote label="On-screen text" value={onScreenDisplay(range)} optional={!range.on_screen_text_required} tone="teal" />
                <RangeNote label="Creator touch" value={fieldText(range.creator_touch || range.creator_customization)} tone="yellow" />
                <RangeNote label="Setting / B-roll" value={fieldText(range.setting_or_broll)} />
              </div>
            )}
          </article>
        );
      })}
      <div className="rounded-md border border-ink/10 bg-paper px-4 py-3 text-xs leading-5 text-ink/55">
        {isEditing
          ? "Use this as the assembly order: place the strongest take, cut before the moment drags, and keep only overlays that clarify the point."
          : "Use this as set direction: perform the action, hold the frame, deliver the line naturally, and add your creator touch only where it strengthens the moment."}
      </div>
    </div>
  );
}

function ExecutionRangeBoard({ ranges, mode }: { ranges: ExecutionRange[]; mode: FrameBoardMode }) {
  if (!ranges.length) {
    return (
      <div className="timeline-board rounded-md border border-ink/10 bg-paper p-5 text-sm text-ink/60">
        This card has no range board yet. Use the summary and active sections as the brief.
      </div>
    );
  }

  const isEditing = mode === "editing";
  const eyebrow = isEditing ? "Edit assembly" : "Scene flow";
  const title = isEditing ? "Edit the Reel in clear ranges" : `Shoot this in ${ranges.length} clear parts`;
  const subtitle = isEditing
    ? "Each range tells you how to cut, transition, sync voice, place text, and keep the pace clean."
    : "Each range tells you what to do, where to place the camera, what to say, and where your own presence should come through.";
  const Icon = isEditing ? Scissors : Video;
  const rangeLabel = `${ranges.length} parts`;

  return (
    <div className="timeline-board rounded-md border border-ink/10 bg-paper p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-ink/10 pb-5 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal shadow-sm">
            <Icon className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h3 className="mt-3 text-2xl font-semibold leading-tight">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">{subtitle}</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-white px-3 py-2 text-sm font-semibold text-ink/62">
          {rangeLabel}
        </div>
      </div>

      <div className="mt-5">
        <RangeOverviewList ranges={ranges} mode={mode} />
      </div>
    </div>
  );
}

function FrameCue({ cue }: { cue: ExecutionRange["visual_cue"] }) {
  const labelMap: Record<ExecutionRange["visual_cue"], string> = {
    close_up: "Close-up",
    face_camera: "Face",
    hand_action: "Hands",
    product: "Product",
    environment: "Setting",
    text_overlay: "Text",
    movement: "Move",
    proof: "Proof",
    payoff: "Payoff",
  };

  return (
    <div className="relative grid aspect-video min-h-28 place-items-center overflow-hidden rounded-md border border-ink/10 bg-white shadow-sm">
      <div className="absolute inset-3 rounded-md border border-dashed border-ink/12" />
      <div className="absolute left-4 top-4 h-2 w-10 rounded-full bg-teal/20" />
      <div className="absolute bottom-4 right-4 h-8 w-14 rounded-md border border-ink/15 bg-paper" />
      <div className="grid h-16 w-16 place-items-center rounded-full border border-teal/20 bg-teal/10 text-xs font-semibold text-teal">
        {labelMap[cue] ?? "Frame"}
      </div>
    </div>
  );
}

function buildPerSecondFrames(section: CardSection) {
  const payload = section.source_payload || {};
  const frames = asArray(payload.per_second_frames)
    .map((item) => asRecord(item))
    .filter(Boolean)
    .map((frame) => ({
      second: Number(frame.second ?? 0),
      shoot_frame: cleanText(frame.shoot_frame),
      camera_action: cleanText(frame.camera_action),
      pose_note: cleanText(frame.pose_note) || undefined,
      b_roll_note: cleanText(frame.b_roll_note) || undefined,
      on_screen_text: cleanText(frame.on_screen_text) || undefined,
      voiceover_line: cleanText(frame.voiceover_line) || undefined,
      personalization_slot: cleanText(frame.personalization_slot) || undefined,
      edit_action: cleanText(frame.edit_action),
      cut_point: cleanText(frame.cut_point) || undefined,
      transition_style: cleanText(frame.transition_style) || undefined,
      overlay_timing: cleanText(frame.overlay_timing) || undefined,
      audio_cue: cleanText(frame.audio_cue) || undefined,
      pacing_note: cleanText(frame.pacing_note) || undefined,
      final_check: cleanText(frame.final_check) || undefined,
      visual_cue: cleanText(frame.visual_cue) || "proof",
    }))
    .filter((frame) => Number.isFinite(frame.second))
    .sort((a, b) => a.second - b.second) as PerSecondFrame[];

  return frames;
}

function EventListDetail({ icon: Icon, label, values }: { icon: typeof Clock; label: string; values?: string[] }) {
  if (!values?.length) return null;
  return (
    <div className="rounded-md border border-ink/10 bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/38">
        <Icon className="h-3.5 w-3.5 text-teal" />
        {label}
      </div>
      <ul className="mt-1 space-y-1 text-sm leading-6 text-ink/72">
        {values.map((value) => <li key={value}>{value}</li>)}
      </ul>
    </div>
  );
}

function SceneFlowPreview({ cardId }: { cardId?: string }) {
  const [failed, setFailed] = useState(false);
  const source = cardId ? `/card-videos/${cardId}-scene_flow.mp4` : "/card-videos/scene-flow-demo.mp4";

  if (failed) {
    return (
      <div className="grid min-h-40 w-full max-w-md place-items-center rounded-md border border-ink/10 bg-paper p-5 text-center shadow-sm">
        <div>
          <MonitorPlay className="mx-auto h-7 w-7 text-teal" />
          <p className="mt-3 text-sm font-semibold">Scene preview is prepared as a written execution board.</p>
          <p className="mt-1 text-xs leading-5 text-ink/55">Follow the range board below for the same shoot-and-edit direction.</p>
        </div>
      </div>
    );
  }

  return (
    <video
      className="w-full max-w-md rounded-md border border-ink/10 bg-paper shadow-sm"
      controls
      muted
      loop
      playsInline
      src={source}
      onError={() => setFailed(true)}
    />
  );
} from "react";
import { ChevronDown, Clock, MessageSquare, Mic2, MonitorPlay, Sparkles, Video } from "lucide-react";
import type { CardSection, CardSectionBlock, ExecutionRange } from "@/lib/card-sections";
import { compactText } from "@/lib/format";

type SceneFlowEvent = {
  start: number;
  end: number;
  title: string;
  action?: string;
  overlay?: string;
  voice?: string;
  onscreen?: string;
  edit?: string;
  pose?: string;
  broll?: string[];
};

type FrameBoardMode = "shooting" | "editing";

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
    .replace(/\\u2013|\\u2014/g, "-")
    .replace(/\\s+/g, "")
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

// Helper: build readable time-range events from scene_flow source payload.
// Text details are displayed in separate event cards, so the time rail itself never overlaps.
function buildSceneFlowEvents(section: CardSection) {
  const events: SceneFlowEvent[] = [];
  const payload = section.source_payload || {};

  asArray(payload.execution_beats).forEach((item) => {
    const beat = asRecord(item);
    if (!beat) return;
    const start = Number(beat.start);
    const end = Number(beat.end);
    const range = Number.isFinite(start) && Number.isFinite(end) && end > start
      ? { start, end }
      : parseTimeRange(beat.time_range, 5);
    events.push({
      ...range,
      title: cleanText(beat.purpose) || "Beat",
      action: cleanText(beat.primary_action) || undefined,
      overlay: cleanText(beat.on_screen_text) || undefined,
      voice: cleanText(beat.voiceover) || undefined,
      onscreen: cleanText(beat.shot) || undefined,
      edit: cleanText(beat.edit_move) || undefined,
      pose: cleanText(beat.pose_camera_note) || undefined,
      broll: Array.isArray(beat.supporting_b_roll) ? beat.supporting_b_roll.map((item) => cleanText(item)).filter(Boolean) : [],
    });
  });

  if (events.length) {
    events.sort((a, b) => a.start - b.start || a.end - b.end);
    const durationValue = Number(payload.execution_duration);
    return {
      events,
      duration: Number.isFinite(durationValue) && durationValue > 0 ? Math.max(15, durationValue) : Math.max(15, events[events.length - 1].end),
    };
  }

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  if (!events.length) {
    return (
      <div className="timeline-board rounded-md border border-ink/10 bg-paper p-5 text-sm text-ink/60">
        This card uses the range board below instead of a separate timed rail.
      </div>
    );
  }
  const selected = events[Math.min(selectedIndex, events.length - 1)];

  return (
    <div className="timeline-board rounded-md border border-ink/10 bg-paper p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-ink/10 pb-4 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Execution Timeline
          </div>
          <h3 className="mt-3 text-xl font-semibold">Second-by-second board</h3>
          <p className="mt-1 text-sm leading-6 text-ink/60">Tap a time marker, shoot that part, then move to the next beat.</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-white px-3 py-2 text-sm font-semibold text-ink/62">
          Total rhythm: {formatTime(duration)}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[140px_1fr]">
        <div className="relative rounded-md border border-ink/10 bg-white p-3 shadow-sm">
          <div className="absolute bottom-4 left-8 top-4 w-px bg-ink/12" />
          <div className="space-y-3">
            {events.map((event, index) => {
              const active = index === selectedIndex;
              return (
                <button
                  key={`${event.start}-${event.end}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`focus-ring relative flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition ${active ? "bg-teal/10 text-teal" : "hover:bg-paper text-ink/60"}`}
                  aria-pressed={active}
                >
                  <span className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold ${active ? "border-teal bg-teal text-white" : "border-ink/15 bg-white"}`}>
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-xs font-semibold">{event.start}-{event.end}s</span>
                    <span className="block max-w-[82px] truncate text-[11px]">{event.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <article className="timeline-event-card rounded-md border border-ink/10 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">
                  <Clock className="h-3.5 w-3.5" />
                  {selected.start}-{selected.end}s
                </div>
                <h4 className="mt-3 text-xl font-semibold leading-7">{selected.title}</h4>
              </div>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-ink/10 bg-paper text-xs font-semibold text-ink/45">
                {String(selectedIndex + 1).padStart(2, "0")}
              </div>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              <EventDetail icon={MonitorPlay} label="What to shoot" value={selected.action} />
              <EventDetail icon={Video} label="Camera / shot" value={selected.onscreen} />
              <EventDetail icon={Sparkles} label="Pose / micro behavior" value={selected.pose} />
              <EventListDetail icon={ListChecks} label="Required B-roll" values={selected.broll} />
              <EventDetail icon={MessageSquare} label="On-screen text" value={selected.overlay} />
              <EventDetail icon={Mic2} label="Voiceover / spoken line" value={selected.voice} />
              <EventDetail icon={Scissors} label="Edit note" value={selected.edit} />
            </div>
          </article>

          <div className="grid gap-2 md:grid-cols-2">
            {events.map((event, index) => (
              <button
                key={`${event.start}-${event.end}-${index}-card`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`focus-ring rounded-md border p-3 text-left text-sm transition ${index === selectedIndex ? "border-teal/40 bg-teal/10" : "border-ink/10 bg-white hover:border-ink/25"}`}
              >
                <div className="text-xs font-semibold text-ink/45">{event.start}-{event.end}s</div>
                <div className="mt-1 font-semibold">{event.title}</div>
                <div className="mt-1 line-clamp-2 text-xs leading-5 text-ink/55">{event.action}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RenderList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-xs leading-5 text-ink/45">No dedicated instruction for this part.</p>;
  return (
    <ul className="space-y-1.5 text-sm leading-6 text-ink/72">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-teal" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

type EditAssemblyStep = {
  key: string;
  title: string;
  icon: typeof Clock;
  items: string[];
};

function EditAssemblyBoard({ block }: { block: Extract<CardSectionBlock, { type: "edit_assembly" }> }) {
  const steps: EditAssemblyStep[] = [
    { key: "clip_order", title: "Clip Order", icon: ListChecks, items: block.clipOrder },
    { key: "cut_points", title: "Cut Points", icon: Scissors, items: block.cutPoints },
    { key: "transition_style", title: "Transition Style", icon: Sparkles, items: block.transitionStyle },
    { key: "text_overlay", title: "Text Overlay Timing", icon: MessageSquare, items: block.textOverlayTiming },
    { key: "voiceover", title: "Voiceover Sync", icon: Mic2, items: block.voiceoverSync },
    { key: "sound", title: "Music / Sound Cue", icon: Music2, items: block.musicSoundCue },
    { key: "pacing", title: "Pacing Notes", icon: Clock, items: block.pacingNotes },
    { key: "checklist", title: "Final Assembly Checklist", icon: CheckCircle2, items: block.finalChecklist },
  ];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = steps[Math.min(selectedIndex, steps.length - 1)];
  const SelectedIcon = selected.icon;

  return (
    <div className="timeline-board rounded-md border border-ink/10 bg-paper p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-ink/10 pb-4 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal shadow-sm">
            <Scissors className="h-3.5 w-3.5" />
            Edit Assembly
          </div>
          <h3 className="mt-3 text-xl font-semibold">Build the final cut with control</h3>
          <p className="mt-1 text-sm leading-6 text-ink/60">Open each edit stage, apply the direction, then move to the next stage.</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-white px-3 py-2 text-sm font-semibold text-ink/62">
          {steps.length} assembly stages
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[190px_1fr]">
        <div className="relative rounded-md border border-ink/10 bg-white p-3 shadow-sm">
          <div className="absolute bottom-4 left-8 top-4 w-px bg-ink/12" />
          <div className="space-y-2">
            {steps.map((step, index) => {
              const active = index === selectedIndex;
              const StepIcon = step.icon;
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`focus-ring relative flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition ${active ? "bg-teal/10 text-teal" : "hover:bg-paper text-ink/60"}`}
                  aria-pressed={active}
                >
                  <span className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${active ? "border-teal bg-teal text-white" : "border-ink/15 bg-white"}`}>
                    <StepIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="block text-xs font-semibold leading-5">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <article className="timeline-event-card rounded-md border border-ink/10 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">
                <SelectedIcon className="h-3.5 w-3.5" />
                Stage {selectedIndex + 1}
              </div>
              <h4 className="mt-3 text-xl font-semibold leading-7">{selected.title}</h4>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-ink/10 bg-paper text-xs font-semibold text-ink/45">
              {String(selectedIndex + 1).padStart(2, "0")}
            </div>
          </div>

          <div className="mt-4 rounded-md border border-ink/10 bg-paper p-4">
            <RenderList items={selected.items} />
          </div>
        </article>
      </div>
    </div>
  );
}

function SmallBriefPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white p-4">
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/45">{title}</div>
      <div className="mt-2 text-sm leading-6 text-ink/75">{children}</div>
    </div>
  );
}

function CaptionPackBoard({ block }: { block: Extract<CardSectionBlock, { type: "caption_pack" }> }) {
  const hasStory = Boolean(block.storyPoll || block.storyOptions?.length || block.followupFrame);
  return (
    <div className="rounded-md border border-ink/10 bg-paper p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-ink/10 pb-4 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal shadow-sm">
            <MessageSquare className="h-3.5 w-3.5" />
            Caption system
          </div>
          <h3 className="mt-3 text-xl font-semibold">Post with a clear audience action</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/60">
            Use the caption and prompt that best match the final edit. Keep the post specific, calm, and easy to answer.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {block.captions.length ? (
          <SmallBriefPanel title="Caption options">
            <RenderList items={block.captions} />
          </SmallBriefPanel>
        ) : null}
        {block.onScreenText.length ? (
          <SmallBriefPanel title="On-screen text">
            <RenderList items={block.onScreenText} />
          </SmallBriefPanel>
        ) : null}
        {block.cta ? (
          <SmallBriefPanel title="Final call to action">
            <p>{block.cta}</p>
          </SmallBriefPanel>
        ) : null}
        {block.pinnedComment || block.audienceQuestion ? (
          <SmallBriefPanel title="Pinned comment">
            <p>{block.pinnedComment || block.audienceQuestion}</p>
          </SmallBriefPanel>
        ) : null}
        {hasStory ? (
          <SmallBriefPanel title="Story follow-up">
            {block.storyPoll ? <p>{block.storyPoll}</p> : null}
            {block.storyOptions?.length ? <RenderList items={block.storyOptions} /> : null}
            {block.followupFrame ? <p className="mt-2">{block.followupFrame}</p> : null}
          </SmallBriefPanel>
        ) : null}
      </div>
    </div>
  );
}

function SafetyBoard({ block }: { block: Extract<CardSectionBlock, { type: "safety" }> }) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper p-5 shadow-sm">
      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal shadow-sm">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Posting guardrails
      </div>
      <h3 className="mt-3 text-xl font-semibold">Keep the post credible and brand-safe</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {block.disclosure ? (
          <SmallBriefPanel title="Disclosure">
            <p>{block.disclosure}</p>
          </SmallBriefPanel>
        ) : null}
        {block.claimBoundary ? (
          <SmallBriefPanel title="Claim boundary">
            <p>{block.claimBoundary}</p>
          </SmallBriefPanel>
        ) : null}
        {block.saferAlternative ? (
          <SmallBriefPanel title="Safer phrasing">
            <p>{block.saferAlternative}</p>
          </SmallBriefPanel>
        ) : null}
        {block.evidenceNote ? (
          <SmallBriefPanel title="Proof standard">
            <p>{block.evidenceNote}</p>
          </SmallBriefPanel>
        ) : null}
        {block.doNotSay.length ? (
          <SmallBriefPanel title="Avoid saying">
            <RenderList items={block.doNotSay} />
          </SmallBriefPanel>
        ) : null}
      </div>
    </div>
  );
}

function renderBlock(block: CardSectionBlock, index: number) {
  if (block.type === "execution_ranges") {
    return <ExecutionRangeBoard key={index} ranges={block.ranges} mode={block.mode} />;
  }

  if (block.type === "edit_assembly") {
    return <EditAssemblyBoard key={index} block={block} />;
  }

  if (block.type === "caption_pack") {
    return <CaptionPackBoard key={index} block={block} />;
  }

  if (block.type === "safety") {
    return <SafetyBoard key={index} block={block} />;
  }

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
      {block.type === "caption_pack" ? <CaptionPackBoard block={block} /> : null}
      {block.type === "safety" ? <SafetyBoard block={block} /> : null}
    </div>
  );
}

export function CardSections({ sections, showSummaries = true }: { sections: CardSection[]; cardId?: string; showSummaries?: boolean }) {
  const [open, setOpen] = useState(sections[0]?.key ?? "");

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const active = open === section.key;
        const sceneFlow = section.key === "scene_flow" ? buildSceneFlowEvents(section) : null;
        const hasRangeBoard = section.blocks.some((block) => block.type === "execution_ranges");
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
                {showSummaries ? <span className="mt-1 block text-xs font-normal leading-5 text-ink/55">{section.short_summary}</span> : null}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition ${active ? "rotate-180" : ""}`} />
            </button>
            {active ? (
              <div className="space-y-5 border-t border-ink/10 px-4 py-4 text-sm leading-6">
                {section.key === "scene_flow" && sceneFlow && !hasRangeBoard ? (
                  <>
                    <div className="mt-1">
                      <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Watch the Flow (Custom 3-6s)</div>
                      <SceneFlowPreview cardId={cardId} />
                      <p className="mt-2 text-[11px] leading-5 text-ink/55">Exact sequence for this card when a preview video is available. The execution board below is always the source of truth.</p>
                    </div>

                    <ExecutionTimelineBoard events={sceneFlow.events} duration={sceneFlow.duration} />
                  </>
                ) : null}

                {section.blocks.length > 0 ? (
                  <div className={section.key === "scene_flow" ? "mt-1" : ""}>
                    {section.key === "scene_flow" ? (
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Production brief</div>
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