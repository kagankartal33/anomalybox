import { compactText, normalizeCreatorText, titleCase } from "@/lib/format";

type JsonRecord = Record<string, unknown>;

export type CardSectionBlock =
  | { type: "text"; title: string; body: string }
  | { type: "list"; title: string; items: string[] }
  | { type: "key_value"; title: string; rows: Array<{ label: string; value: string }> }
  | { type: "timeline"; title: string; items: Array<{ time?: string; title: string; body?: string; meta?: string[] }> }
  | { type: "shot_list"; title: string; items: Array<{ time?: string; title: string; action?: string; note?: string; overlay?: string }> }
  | { type: "execution_ranges"; title: string; mode: "shooting" | "editing"; ranges: ExecutionRange[] }
  | {
      type: "edit_assembly";
      title: string;
      clipOrder: string[];
      cutPoints: string[];
      transitionStyle: string[];
      textOverlayTiming: string[];
      voiceoverSync: string[];
      musicSoundCue: string[];
      pacingNotes: string[];
      finalChecklist: string[];
    }
  | {
      type: "caption_pack";
      title: string;
      captions: string[];
      onScreenText: string[];
      cta?: string;
      pinnedComment?: string;
      audienceQuestion?: string;
      storyPoll?: string;
      storyOptions?: string[];
      followupFrame?: string;
    }
  | {
      type: "safety";
      title: string;
      disclosure?: string;
      claimBoundary?: string;
      doNotSay: string[];
      evidenceNote?: string;
      saferAlternative?: string;
    };

export type CardSection = {
  key: string;
  title: string;
  short_summary: string;
  how_to_do_it: string;
  what_good_looks_like: string;
  common_mistakes: string[];
  example_execution: string;
  source_payload: Record<string, unknown>;
  checklist_items: string[];
  blocks: CardSectionBlock[];
};

const noGuidance = "No dedicated guidance for this section.";

export type CanonicalExecutionBeat = {
  time_range: string;
  start: number;
  end: number;
  purpose: string;
  primary_action: string;
  shot?: string;
  voiceover?: string;
  on_screen_text?: string;
  edit_move?: string;
  supporting_b_roll: string[];
  pose_camera_note?: string;
  safety_note?: string;
};

export type PerSecondFrame = {
  second: number;
  shoot_frame: string;
  camera_action: string;
  pose_note?: string;
  b_roll_note?: string;
  on_screen_text?: string;
  voiceover_line?: string;
  personalization_slot?: string;
  edit_action: string;
  cut_point?: string;
  transition_style?: string;
  overlay_timing?: string;
  audio_cue?: string;
  pacing_note?: string;
  final_check?: string;
  visual_cue: "close_up" | "face_camera" | "hand_action" | "product" | "environment" | "text_overlay" | "movement" | "proof" | "payoff";
};

export type ExecutionRange = {
  time_range: string;
  start: number;
  end: number;
  purpose: string;
  action: string;
  camera: string;
  say?: string;
  say_tone?: string;
  on_screen_text_required: boolean;
  creator_touch?: string;
  edit: string;
  shoot_summary: string;
  edit_summary: string;
  shoot_direction: string;
  camera_direction?: string;
  pose_micro_behavior?: string;
  setting_or_broll?: string;
  spoken_line?: string;
  on_screen_text?: string;
  edit_direction: string;
  cut_point?: string;
  transition_style?: string;
  overlay_timing?: string;
  audio_cue?: string;
  pacing_note?: string;
  final_check?: string;
  creator_customization?: string;
  visual_cue: PerSecondFrame["visual_cue"];
};

export type NormalizedCardExecution = {
  beats: CanonicalExecutionBeat[];
  per_second_frames: PerSecondFrame[];
  execution_ranges: ExecutionRange[];
  supplemental_b_roll: string[];
  edit_notes: Array<{ label: string; value: string }>;
  edit_assembly_guide: {
    clipOrder: string[];
    cutPoints: string[];
    transitionStyle: string[];
    textOverlayTiming: string[];
    voiceoverSync: string[];
    musicSoundCue: string[];
    pacingNotes: string[];
    finalChecklist: string[];
  };
  example_story: {
    title: string;
    paragraphs: string[];
    steps: Array<{ label: string; body: string }>;
  };
};

const labelOverrides: Record<string, string> = {
  avoid: "Avoid",
  avoid_over_advertising: "Avoid over-advertising",
  audience_aftertaste: "Audience aftertaste",
  audience_question: "Audience question",
  body: "Body",
  brand_equity: "Brand equity",
  camera_attention: "Camera attention",
  claim_boundary: "Claim boundary",
  color_language: "Color language",
  cta: "CTA",
  delivery_style: "Delivery style",
  disclosure_text: "Disclosure text",
  do_not_say: "Do not say",
  evidence_note: "Evidence note",
  expression: "Expression",
  eye_contact: "Eye contact",
  face: "Face",
  facial_expression: "Facial expression",
  followup_frame: "Follow-up frame",
  framing: "Framing",
  hands: "Hands",
  lighting: "Lighting",
  location_options: "Location options",
  mood: "Mood",
  movement: "Movement",
  opening_visual: "Opening visual",
  partnership_signal: "Partnership signal",
  payoff_visual: "Payoff visual",
  pacing_notes: "Pacing notes",
  poll_options: "Poll options",
  poll_question: "Poll question",
  product_handling: "Product handling",
  production_versions: "Production versions",
  reply_strategy: "Reply strategy",
  safer_alternative_phrase: "Safer alternative",
  scene_arc: "Scene arc",
  shoot_time_minutes: "Shoot time",
  sound_cue: "Sound cue",
  smile_timing: "Smile timing",
  solo_creator_friendly: "Solo creator friendly",
  soundscape: "Soundscape",
  visual_texture: "Visual texture",
  why_it_fits_creator: "Why it fits this creator",
};

function pick(card: Record<string, unknown>, keys: string[]) {
  return Object.fromEntries(keys.filter((key) => card[key] != null).map((key) => [key, card[key]]));
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asCleanText(value: unknown, fallback = "") {
  const text = compactText(value, "").trim();
  return text ? normalizeCreatorText(text) : fallback;
}

function asCleanList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => asCleanText(item)).filter(Boolean);
  }
  const text = asCleanText(value);
  return text ? [text] : [];
}

function normalizedTokens(value: string) {
  return normalizeCreatorText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2)
    .filter((token) => !["the", "and", "for", "with", "this", "that", "your", "you", "into", "from"].includes(token));
}

function tokenOverlap(a: string, b: string) {
  const left = new Set(normalizedTokens(a));
  const right = new Set(normalizedTokens(b));
  if (!left.size || !right.size) return 0;
  let hits = 0;
  left.forEach((token) => {
    if (right.has(token)) hits += 1;
  });
  return hits / Math.min(left.size, right.size);
}

function actionFamily(value: string) {
  const text = value.toLowerCase();
  if (/\b(reveal|show|display|open|hold up)\b/.test(text)) return "reveal";
  if (/\b(save|screenshot|hold|checklist)\b/.test(text)) return "save";
  if (/\b(comment|ask|question|reply|poll)\b/.test(text)) return "comment";
  if (/\b(cut|transition|edit|pace|freeze)\b/.test(text)) return "edit";
  if (/\b(compare|filter|remove|choose|sort|select)\b/.test(text)) return "decision";
  if (/\b(proof|evidence|detail|close-up|closeup)\b/.test(text)) return "proof";
  return normalizedTokens(value).slice(0, 3).join("_") || "action";
}

function visualCueFor(value: string): PerSecondFrame["visual_cue"] {
  const text = value.toLowerCase();
  if (/\b(close|macro|detail|texture|proof)\b/.test(text)) return "close_up";
  if (/\b(face|camera|eye|talk|speak|voice)\b/.test(text)) return "face_camera";
  if (/\b(hand|hold|touch|place|sort|open|move)\b/.test(text)) return "hand_action";
  if (/\b(product|item|box|bag|dress|makeup|plate|drink)\b/.test(text)) return "product";
  if (/\b(room|hotel|street|table|desk|location|environment|background)\b/.test(text)) return "environment";
  if (/\b(text|overlay|caption|title|word)\b/.test(text)) return "text_overlay";
  if (/\b(walk|turn|pan|tilt|move|transition)\b/.test(text)) return "movement";
  if (/\b(payoff|final|cta|save|comment)\b/.test(text)) return "payoff";
  return "proof";
}

function normalizeListField(record: JsonRecord | null, keys: string[]) {
  if (!record) return [];
  for (const key of keys) {
    const values = asCleanList(record[key]);
    if (values.length) return uniqueText(values);
  }
  return [];
}

function parseTime(value: unknown, fallbackStart: number, fallbackDuration = 4) {
  const text = String(value ?? "")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, "")
    .toLowerCase();
  if (text.includes("last")) {
    return { start: Math.max(0, fallbackStart), end: Math.max(fallbackStart + 3, fallbackStart + fallbackDuration), label: "last 3s" };
  }
  const [startText, endText] = text.split(/-|to/);
  const start = Number.parseInt(startText || `${fallbackStart}`, 10);
  let end = endText ? Number.parseInt(endText, 10) : start + fallbackDuration;
  const safeStart = Number.isFinite(start) ? Math.max(0, start) : fallbackStart;
  if (!Number.isFinite(end) || end <= safeStart) end = safeStart + fallbackDuration;
  return { start: safeStart, end, label: `${safeStart}-${end}s` };
}

function rangesOverlap(a: { start: number; end: number }, b: { start: number; end: number }) {
  return Math.max(a.start, b.start) <= Math.min(a.end, b.end) || Math.abs(a.start - b.start) <= 2;
}

function uniqueText(values: string[]) {
  const result: string[] = [];
  values.forEach((value) => {
    const text = asCleanText(value);
    if (!text) return;
    if (result.some((existing) => existing.toLowerCase() === text.toLowerCase() || tokenOverlap(existing, text) >= 0.82)) return;
    result.push(text);
  });
  return result;
}

function personalizationInstructions(value: unknown) {
  const slots = asRecord(value);
  if (!slots) return [];
  const instructions: Record<string, string> = {
    product_name: "Add your product, place, service, or subject here.",
    audience_pain: "Name the audience problem in one short phrase.",
    daily_context: "Use today's real context so the moment feels specific.",
    signature_phrase: "Add your own recurring phrase if it fits naturally.",
  };

  return uniqueText(Object.keys(slots).map((key) => instructions[key] ?? `Customize ${labelFor(key).toLowerCase()} with your own detail.`));
}

function pickInstructionForSecond(values: string[], second: number, totalSeconds: number) {
  if (!values.length) return "";
  return pickBySecond(values, second, totalSeconds);
}

function beatText(beat: CanonicalExecutionBeat) {
  return [
    beat.purpose,
    beat.primary_action,
    beat.shot,
    beat.voiceover,
    beat.on_screen_text,
    beat.edit_move,
    ...beat.supporting_b_roll,
  ].filter(Boolean).join(" ");
}

function findBeat(beats: CanonicalExecutionBeat[], range: { start: number; end: number }, actionText = "") {
  const family = actionFamily(actionText);
  return beats.find((beat) => rangesOverlap(beat, range) && (!actionText || actionFamily(beat.primary_action) === family || tokenOverlap(beatText(beat), actionText) >= 0.35))
    ?? beats.find((beat) => rangesOverlap(beat, range));
}

export function normalizeCardExecution(cardValue: unknown): NormalizedCardExecution {
  const card = (cardValue && typeof cardValue === "object" && !Array.isArray(cardValue) ? cardValue : {}) as JsonRecord;
  const sceneScript = asArray(card.scene_script);
  const beats: CanonicalExecutionBeat[] = [];

  sceneScript.forEach((item, index) => {
    const scene = asRecord(item);
    const range = parseTime(scene?.second ?? scene?.time, index * 7, 5);
    const purpose = asCleanText(scene?.purpose ?? scene?.beat ?? scene?.title, `Beat ${index + 1}`);
    const voiceover = asCleanText(scene?.voiceover ?? asCleanList(scene?.spoken_lines).join(" "));
    const onScreen = asCleanText(scene?.on_screen_text ?? scene?.overlay);
    beats.push({
      time_range: range.label,
      start: range.start,
      end: range.end,
      purpose,
      primary_action: voiceover || onScreen || purpose,
      voiceover: voiceover || undefined,
      on_screen_text: onScreen || undefined,
      supporting_b_roll: [],
    });
  });

  if (!beats.length) {
    const blueprint = asRecord(card.video_blueprint);
    const range = parseTime("0-8", 0, 8);
    beats.push({
      time_range: range.label,
      start: range.start,
      end: range.end,
      purpose: "opening",
      primary_action: asCleanText(blueprint?.opening_visual ?? card.one_sentence_premise, "Open with the strongest visual proof."),
      supporting_b_roll: [],
    });
  }

  asArray(card.shot_list).forEach((item, index) => {
    const shot = asRecord(item);
    if (!shot) return;
    const range = parseTime(shot.second ?? shot.time, index * 7, 4);
    const action = asCleanText(shot.action);
    const target = findBeat(beats, range, action) ?? beats[Math.min(index, beats.length - 1)];
    target.start = Math.min(target.start, range.start);
    target.end = Math.max(target.end, range.end);
    target.time_range = `${target.start}-${target.end}s`;
    target.shot = target.shot || asCleanText(shot.shot ?? shot.type ?? shot.title) || undefined;
    if (action && tokenOverlap(target.primary_action, action) < 0.72) target.primary_action = target.primary_action || action;
    const overlay = asCleanText(shot.overlay ?? shot.on_screen_text);
    if (overlay && (!target.on_screen_text || tokenOverlap(target.on_screen_text, overlay) < 0.72)) target.on_screen_text = target.on_screen_text ?? overlay;
  });

  asArray(card.editing_timeline).forEach((item, index) => {
    const edit = asRecord(item);
    if (!edit) return;
    const range = parseTime(edit.second ?? edit.time, index * 7, 4);
    const editMove = asCleanText(edit.edit ?? edit.action ?? edit.note);
    const target = findBeat(beats, range, editMove) ?? beats[Math.min(index, beats.length - 1)];
    if (editMove && tokenOverlap(beatText(target), editMove) < 0.72) target.edit_move = target.edit_move || editMove;
  });

  const supplementalBroll: string[] = [];
  asArray(card.b_roll_plan).forEach((item) => {
    const broll = asRecord(item);
    const text = asCleanText([broll?.shot, broll?.note].filter(Boolean).join(" "));
    if (!text) return;
    const target = beats.find((beat) => tokenOverlap(beatText(beat), text) >= 0.38);
    if (target) {
      target.supporting_b_roll = uniqueText([...target.supporting_b_roll, text]).slice(0, 2);
    } else if (!supplementalBroll.some((existing) => tokenOverlap(existing, text) >= 0.62)) {
      supplementalBroll.push(text);
    }
  });

  const pose = asRecord(card.pose_direction);
  const micro = asRecord(card.micro_behavior_guide);
  const camera = asRecord(card.camera_direction);
  const poseNote = asCleanText(pose?.expression ?? micro?.facial_expression ?? camera?.framing);
  if (poseNote) beats[0].pose_camera_note = poseNote;

  const safety = asRecord(card.brand_safety);
  const safetyNote = asCleanText(safety?.claim_boundary ?? safety?.disclosure_text);
  if (safetyNote) beats[beats.length - 1].safety_note = safetyNote;

  beats.sort((a, b) => a.start - b.start || a.end - b.end);
  const dedupedBeats: CanonicalExecutionBeat[] = [];
  beats.forEach((beat) => {
    const existing = dedupedBeats.find((item) => rangesOverlap(item, beat) && (actionFamily(item.primary_action) === actionFamily(beat.primary_action) || tokenOverlap(beatText(item), beatText(beat)) >= 0.68));
    if (!existing) {
      dedupedBeats.push({ ...beat, supporting_b_roll: uniqueText(beat.supporting_b_roll) });
      return;
    }
    existing.start = Math.min(existing.start, beat.start);
    existing.end = Math.max(existing.end, beat.end);
    existing.time_range = `${existing.start}-${existing.end}s`;
    existing.shot = existing.shot || beat.shot;
    existing.voiceover = existing.voiceover || beat.voiceover;
    existing.on_screen_text = existing.on_screen_text || beat.on_screen_text;
    existing.edit_move = existing.edit_move || beat.edit_move;
    existing.pose_camera_note = existing.pose_camera_note || beat.pose_camera_note;
    existing.safety_note = existing.safety_note || beat.safety_note;
    existing.supporting_b_roll = uniqueText([...existing.supporting_b_roll, ...beat.supporting_b_roll]).slice(0, 2);
  });

  const editingNotes = keyValueRows(card.editing_notes);
  const editAssembly = buildEditAssemblyGuide(card, dedupedBeats, editingNotes);
  const perSecondFrames = buildPerSecondFrames(card, dedupedBeats, editAssembly);
  const executionRanges = buildExecutionRanges(card, dedupedBeats, editAssembly);
  return {
    beats: dedupedBeats,
    per_second_frames: perSecondFrames,
    execution_ranges: executionRanges,
    supplemental_b_roll: uniqueText(supplementalBroll).slice(0, 6),
    edit_notes: editingNotes,
    edit_assembly_guide: editAssembly,
    example_story: buildExampleStory(card, dedupedBeats),
  };
}

function explicitExecutionRanges(card: JsonRecord): ExecutionRange[] {
  return asArray(card.execution_ranges)
    .map((item, index): ExecutionRange | null => {
      const range = asRecord(item);
      if (!range) return null;
      const parsed = parseTime(range.time_range ?? range.time ?? range.second, index * 6, 5);
      const action = instructionText(range.action ?? range.pose_micro_behavior ?? range.pose_note ?? range.shoot_direction ?? range.what_to_shoot);
      const camera = instructionText(range.camera ?? range.camera_direction ?? range.camera_action);
      const say = instructionText(range.say ?? range.spoken_line ?? range.voiceover_line ?? range.voiceover);
      const sayTone = instructionText(range.say_tone ?? range.tone) || inferSayTone(say, String(range.purpose ?? ""));
      const creatorTouch = instructionText(range.creator_touch ?? range.creator_customization ?? range.personalization_slot);
      const shoot = asCleanText(range.shoot_direction ?? range.what_to_shoot ?? range.action);
      const edit = instructionText(range.edit ?? range.edit_direction ?? range.edit_action);
      if (!shoot && !edit) return null;
      const seed = [
        action || shoot,
        camera || range.camera_direction,
        range.pose_micro_behavior,
        range.setting_or_broll,
        edit,
      ].filter(Boolean).join(" ");
      const normalizedRange = {
        time_range: parsed.label,
        start: parsed.start,
        end: parsed.end,
        purpose: asCleanText(range.purpose, `Part ${index + 1}`),
        action: action || shoot || "Capture the clearest visual for this part.",
        camera: camera || "Keep the camera steady and make the action easy to read.",
        say: say || undefined,
        say_tone: say ? sayTone : undefined,
        on_screen_text_required: Boolean(range.on_screen_text_required),
        creator_touch: creatorTouch || undefined,
        edit: edit || "Keep the cut clean and move into the next part.",
        shoot_direction: shoot || "Capture the clearest visual for this part.",
        camera_direction: camera || asCleanText(range.camera_direction) || undefined,
        pose_micro_behavior: asCleanText(range.pose_micro_behavior ?? range.pose_note) || undefined,
        setting_or_broll: asCleanText(range.setting_or_broll ?? range.b_roll_note) || undefined,
        spoken_line: say || undefined,
        on_screen_text: asCleanText(range.on_screen_text) || undefined,
        edit_direction: edit || "Keep the cut clean and move into the next part.",
        cut_point: asCleanText(range.cut_point) || undefined,
        transition_style: asCleanText(range.transition_style) || undefined,
        overlay_timing: asCleanText(range.overlay_timing) || undefined,
        audio_cue: asCleanText(range.audio_cue) || undefined,
        pacing_note: asCleanText(range.pacing_note) || undefined,
        final_check: asCleanText(range.final_check) || undefined,
        creator_customization: creatorTouch || undefined,
        visual_cue: visualCueFor(seed),
      } satisfies Omit<ExecutionRange, "shoot_summary" | "edit_summary">;
      return {
        ...normalizedRange,
        shoot_summary: asCleanText(range.shoot_summary) || makeShootSummary(normalizedRange),
        edit_summary: asCleanText(range.edit_summary) || makeEditSummary(normalizedRange),
      };
    })
    .filter((range): range is ExecutionRange => range !== null)
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

function normalizePurpose(value: string, index: number) {
  const text = asCleanText(value, "");
  if (!text) return index === 0 ? "Hook" : `Part ${index + 1}`;
  if (/attention|hook|open/i.test(text)) return "Hook";
  if (/premise|setup/i.test(text)) return "Setup";
  if (/proof|turn|detail|evidence/i.test(text)) return "Proof";
  if (/payoff|reveal|final/i.test(text)) return "Payoff";
  if (/comment|save|cta|call/i.test(text)) return "CTA";
  return titleCase(text);
}

function timeRangeLabel(start: number, end: number) {
  return `${Math.max(0, start)}-${Math.max(start + 1, end)}s`;
}

function shortSentence(value: unknown, maxWords = 18) {
  const text = asCleanText(value)
    .replace(/\s+/g, " ")
    .replace(/[.]+$/g, "")
    .trim();
  if (!text) return "";
  const words = text.split(/\s+/).filter(Boolean);
  return words.length > maxWords ? `${words.slice(0, maxWords).join(" ")}` : text;
}

function joinRangeParts(parts: string[]) {
  return uniqueText(parts.map((part) => shortSentence(part, 16)).filter(Boolean)).join(", ");
}

function instructionText(value: unknown) {
  return asCleanText(value)
    .replace(/\b(your product or subject)\s*:\s*\1\b/gi, "your product or subject")
    .replace(/\b(the audience problem)\s*:\s*\1\b/gi, "the audience problem")
    .replace(/\b(today's real context)\s*:\s*\1\b/gi, "today's real context")
    .replace(/\b(your own recurring phrase)\s*:\s*\1\b/gi, "your own recurring phrase")
    .replace(/\s*\|\s*/g, " ")
    .trim();
}

function inferSayTone(value: string | undefined, purpose: string) {
  const text = `${value ?? ""} ${purpose}`.toLowerCase();
  if (/\b(curious|wonder|why|what|which|question|merak)\b/.test(text)) return "curious";
  if (/\b(calm|soft|quiet|luxury|premium|clean|gentle)\b/.test(text)) return "calm";
  if (/\b(proof|trust|boundary|explain|evidence|decision)\b/.test(text)) return "confident";
  if (/\b(smile|funny|amused|light)\b/.test(text)) return "softly amused";
  if (/\b(comment|save|tell|ask|reply)\b/.test(text)) return "inviting";
  return "natural";
}

function sayInstruction(say: string | undefined, tone: string | undefined) {
  if (!say) return "";
  return `Deliver this line in your own voice with a ${tone || "natural"} tone: "${shortSentence(say, 16)}."`;
}

function onScreenInstruction(text: string | undefined, required = false) {
  if (!text) return "";
  return `${required ? "Use this exact on-screen text" : "Optional on-screen text"}: "${shortSentence(text, 12)}."`;
}

function makeShootSummary(range: {
  time_range: string;
  purpose: string;
  action?: string;
  camera?: string;
  say?: string;
  say_tone?: string;
  on_screen_text_required?: boolean;
  creator_touch?: string;
  shoot_direction: string;
  camera_direction?: string;
  pose_micro_behavior?: string;
  setting_or_broll?: string;
  spoken_line?: string;
  on_screen_text?: string;
}) {
  const actionLine = shortSentence(range.action || joinRangeParts([range.shoot_direction, range.pose_micro_behavior ?? ""]), 18);
  const cameraLine = shortSentence(range.camera || range.camera_direction || range.setting_or_broll || "", 16);
  const sayLine = sayInstruction(range.say || range.spoken_line, range.say_tone);
  const textLine = onScreenInstruction(range.on_screen_text, Boolean(range.on_screen_text_required));
  const touchLine = range.creator_touch ? ` Creator touch: ${shortSentence(range.creator_touch, 14)}.` : "";
  if (actionLine || cameraLine || sayLine || textLine || touchLine) {
    return `${range.time_range} ${range.purpose}: ${actionLine || "Capture one clear visual for this part."}.${cameraLine ? ` Camera: ${cameraLine}.` : ""}${sayLine ? ` ${sayLine}` : ""}${textLine ? ` ${textLine}` : ""}${touchLine}`;
  }
  const action = joinRangeParts([
    range.shoot_direction,
    range.pose_micro_behavior ?? "",
    range.camera_direction ?? "",
    range.setting_or_broll ?? "",
  ]);
  const say = range.spoken_line ? ` Say: "${shortSentence(range.spoken_line, 14)}."` : "";
  const text = range.on_screen_text ? ` Text: "${shortSentence(range.on_screen_text, 10)}."` : "";
  return `${range.time_range} ${range.purpose}: ${action || "Capture one clear visual for this part."}.${say}${text}`;
}

function makeEditSummary(range: {
  time_range: string;
  edit?: string;
  edit_direction: string;
  cut_point?: string;
  transition_style?: string;
  overlay_timing?: string;
  audio_cue?: string;
  pacing_note?: string;
}) {
  const edit = joinRangeParts([
    range.edit ?? "",
    range.edit_direction,
    range.cut_point ?? "",
    range.transition_style ?? "",
    range.overlay_timing ?? "",
    range.audio_cue ?? "",
    range.pacing_note ?? "",
  ]);
  return `${range.time_range}: ${edit || "Keep this cut clean and move into the next part."}.`;
}

function defaultRangeBeats(beats: CanonicalExecutionBeat[]) {
  if (beats.length > 1) return beats;
  const seed = beats[0];
  const defaults = [
    { start: 0, end: 3, purpose: "Hook" },
    { start: 3, end: 6, purpose: "Setup" },
    { start: 6, end: 14, purpose: "Proof" },
    { start: 14, end: 26, purpose: "Payoff" },
    { start: 26, end: 35, purpose: "CTA" },
  ];
  return defaults.map((item) => ({
    time_range: timeRangeLabel(item.start, item.end),
    start: item.start,
    end: item.end,
    purpose: item.purpose,
    primary_action: seed?.primary_action || "Show the clearest version of this idea.",
    shot: seed?.shot,
    voiceover: seed?.voiceover,
    on_screen_text: seed?.on_screen_text,
    edit_move: seed?.edit_move,
    supporting_b_roll: seed?.supporting_b_roll ?? [],
    pose_camera_note: seed?.pose_camera_note,
  } satisfies CanonicalExecutionBeat));
}

function mergeBeatPair(left: CanonicalExecutionBeat, right: CanonicalExecutionBeat): CanonicalExecutionBeat {
  return {
    time_range: timeRangeLabel(left.start, right.end),
    start: Math.min(left.start, right.start),
    end: Math.max(left.end, right.end),
    purpose: left.purpose === right.purpose ? left.purpose : `${normalizePurpose(left.purpose, 0)} / ${normalizePurpose(right.purpose, 1)}`,
    primary_action: uniqueText([left.primary_action, right.primary_action]).join(" "),
    shot: left.shot || right.shot,
    voiceover: left.voiceover || right.voiceover,
    on_screen_text: left.on_screen_text || right.on_screen_text,
    edit_move: left.edit_move || right.edit_move,
    supporting_b_roll: uniqueText([...left.supporting_b_roll, ...right.supporting_b_roll]).slice(0, 2),
    pose_camera_note: left.pose_camera_note || right.pose_camera_note,
    safety_note: left.safety_note || right.safety_note,
  };
}

function rangeBeats(beats: CanonicalExecutionBeat[]) {
  let items = defaultRangeBeats(beats).map((beat) => ({ ...beat })).sort((a, b) => a.start - b.start || a.end - b.end);
  while (items.length > 7) {
    let mergeIndex = 0;
    let shortestGap = Number.POSITIVE_INFINITY;
    for (let index = 0; index < items.length - 1; index += 1) {
      const gap = Math.max(0, items[index + 1].start - items[index].end);
      if (gap < shortestGap) {
        shortestGap = gap;
        mergeIndex = index;
      }
    }
    const merged = mergeBeatPair(items[mergeIndex], items[mergeIndex + 1]);
    items = [...items.slice(0, mergeIndex), merged, ...items.slice(mergeIndex + 2)];
  }
  return items;
}

function buildExecutionRanges(card: JsonRecord, beats: CanonicalExecutionBeat[], editAssembly: NormalizedCardExecution["edit_assembly_guide"]): ExecutionRange[] {
  const explicit = explicitExecutionRanges(card);
  if (explicit.length) return explicit;

  const customizationInstructions = personalizationInstructions(card.personalization_slots);
  const safeBeats = rangeBeats(beats);
  const ranges = safeBeats.map((beat, index): ExecutionRange => {
    const time_range = timeRangeLabel(beat.start, beat.end);
    const broll = uniqueText(beat.supporting_b_roll).slice(0, 2).join(" ");
    const clipOrder = editAssembly.clipOrder[index] ?? editAssembly.clipOrder[0];
    const cutPoint = editAssembly.cutPoints[index] ?? `Cut at ${beat.end}s once the action is clear.`;
    const transition = editAssembly.transitionStyle[index] ?? (index === 0 ? "Open clean; no decorative transition." : "Use a clean hard cut into this part.");
    const overlayTiming = beat.on_screen_text ? `${time_range}: keep the text readable while this part plays.` : editAssembly.textOverlayTiming[index];
    const seed = [
      beat.shot,
      beat.primary_action,
      beat.pose_camera_note,
      broll,
      beat.edit_move,
    ].filter(Boolean).join(" ");
    const purpose = normalizePurpose(beat.purpose, index);
    const camera = beat.shot ? `Frame for ${beat.shot.toLowerCase()}; keep the movement controlled and readable.` : "Keep the camera steady and make the action easy to read.";
    const edit = beat.edit_move || clipOrder || `Place this ${purpose.toLowerCase()} clip here and keep it tight.`;
    const creatorTouch = customizationInstructions[index % Math.max(1, customizationInstructions.length)] || undefined;

    const normalizedRange = {
      time_range,
      start: beat.start,
      end: beat.end,
      purpose,
      action: beat.pose_camera_note || beat.primary_action || beat.shot || "Capture the clearest visual for this part.",
      camera,
      say: beat.voiceover || undefined,
      say_tone: beat.voiceover ? inferSayTone(beat.voiceover, purpose) : undefined,
      on_screen_text_required: false,
      creator_touch: creatorTouch,
      edit,
      shoot_direction: beat.shot || beat.primary_action || "Capture the clearest visual for this part.",
      camera_direction: camera,
      pose_micro_behavior: beat.pose_camera_note || undefined,
      setting_or_broll: broll || undefined,
      spoken_line: beat.voiceover || undefined,
      on_screen_text: beat.on_screen_text || undefined,
      edit_direction: edit,
      cut_point: cutPoint,
      transition_style: transition,
      overlay_timing: overlayTiming || undefined,
      audio_cue: editAssembly.musicSoundCue[index] ?? editAssembly.musicSoundCue[0],
      pacing_note: editAssembly.pacingNotes[index] ?? editAssembly.pacingNotes[0],
      final_check: index === safeBeats.length - 1 ? (editAssembly.finalChecklist[0] ?? "The ending must make the next action obvious.") : undefined,
      creator_customization: creatorTouch,
      visual_cue: visualCueFor(seed),
    } satisfies Omit<ExecutionRange, "shoot_summary" | "edit_summary">;
    return {
      ...normalizedRange,
      shoot_summary: makeShootSummary(normalizedRange),
      edit_summary: makeEditSummary(normalizedRange),
    };
  });

  const deduped: ExecutionRange[] = [];
  ranges.forEach((range) => {
    const existing = deduped.find((item) => item.time_range === range.time_range || (rangesOverlap(item, range) && tokenOverlap(item.shoot_direction, range.shoot_direction) >= 0.72));
    if (!existing) {
      deduped.push(range);
      return;
    }
    existing.shoot_direction = existing.shoot_direction || range.shoot_direction;
    existing.camera_direction = existing.camera_direction || range.camera_direction;
    existing.pose_micro_behavior = existing.pose_micro_behavior || range.pose_micro_behavior;
    existing.setting_or_broll = existing.setting_or_broll || range.setting_or_broll;
    existing.spoken_line = existing.spoken_line || range.spoken_line;
    existing.on_screen_text = existing.on_screen_text || range.on_screen_text;
    existing.edit_direction = existing.edit_direction || range.edit_direction;
    existing.action = existing.action || range.action;
    existing.camera = existing.camera || range.camera;
    existing.say = existing.say || range.say;
    existing.say_tone = existing.say_tone || range.say_tone;
    existing.creator_touch = existing.creator_touch || range.creator_touch;
    existing.edit = existing.edit || range.edit;
  });
  return deduped.map((range) => ({
    ...range,
    shoot_summary: makeShootSummary(range),
    edit_summary: makeEditSummary(range),
  }));
}

function explicitPerSecondFrames(card: JsonRecord): PerSecondFrame[] {
  return asArray(card.per_second_frames)
    .map((item, index): PerSecondFrame | null => {
      const frame = asRecord(item);
      if (!frame) return null;
      const second = Number(frame.second ?? index);
      if (!Number.isFinite(second) || second < 0) return null;
      const shoot = asCleanText(frame.shoot_frame ?? frame.frame ?? frame.what_to_shoot);
      const camera = asCleanText(frame.camera_action ?? frame.camera ?? frame.framing);
      const edit = asCleanText(frame.edit_action ?? frame.edit ?? frame.assembly);
      const customization = asCleanText(frame.personalization_slot ?? frame.customization);
      const seed = [shoot, camera, edit].join(" ");
      return {
        second: Math.floor(second),
        shoot_frame: shoot || "Hold this second on the clearest visual.",
        camera_action: camera || "Keep the frame steady and readable.",
        pose_note: asCleanText(frame.pose_note ?? frame.pose) || undefined,
        b_roll_note: asCleanText(frame.b_roll_note ?? frame.b_roll) || undefined,
        on_screen_text: asCleanText(frame.on_screen_text ?? frame.overlay) || undefined,
        voiceover_line: asCleanText(frame.voiceover_line ?? frame.voiceover) || undefined,
        personalization_slot: customization && !/\{[a-z0-9_ -]+\}/i.test(String(frame.personalization_slot ?? frame.customization ?? "")) ? customization : undefined,
        edit_action: edit || "Keep this second only if it advances the beat.",
        cut_point: asCleanText(frame.cut_point) || undefined,
        transition_style: asCleanText(frame.transition_style ?? frame.transition) || undefined,
        overlay_timing: asCleanText(frame.overlay_timing) || undefined,
        audio_cue: asCleanText(frame.audio_cue ?? frame.sound_cue) || undefined,
        pacing_note: asCleanText(frame.pacing_note) || undefined,
        final_check: asCleanText(frame.final_check) || undefined,
        visual_cue: visualCueFor(seed),
      } satisfies PerSecondFrame;
    })
    .filter((frame): frame is PerSecondFrame => frame !== null)
    .sort((a, b) => a.second - b.second);
}

function frameForSecond(second: number, beats: CanonicalExecutionBeat[]) {
  return beats.find((beat) => second >= beat.start && second <= beat.end)
    ?? beats.find((beat) => Math.abs(second - beat.start) <= 1)
    ?? beats[beats.length - 1];
}

function pickBySecond(values: string[], second: number, totalSeconds: number) {
  if (!values.length) return "";
  const index = Math.min(values.length - 1, Math.floor((second / Math.max(1, totalSeconds)) * values.length));
  return values[index] ?? values[0] ?? "";
}

function buildPerSecondFrames(card: JsonRecord, beats: CanonicalExecutionBeat[], editAssembly: NormalizedCardExecution["edit_assembly_guide"]): PerSecondFrame[] {
  const explicit = explicitPerSecondFrames(card);
  if (explicit.length) return explicit;

  const blueprint = asRecord(card.video_blueprint);
  const durationFromBlueprint = Number(blueprint?.duration_seconds);
  const duration = Math.max(
    1,
    Math.min(
      90,
      Number.isFinite(durationFromBlueprint) && durationFromBlueprint > 0
        ? Math.floor(durationFromBlueprint)
        : beats.length
          ? Math.max(...beats.map((beat) => beat.end))
          : 35,
    ),
  );
  const customizationInstructions = personalizationInstructions(card.personalization_slots);
  const frames: PerSecondFrame[] = [];

  for (let second = 0; second <= duration; second += 1) {
    const beat = frameForSecond(second, beats);
    const progressInBeat = beat ? (second - beat.start) / Math.max(1, beat.end - beat.start) : 0;
    const isBeatStart = beat ? second === beat.start : second === 0;
    const isBeatEnd = beat ? second === beat.end : second === duration;
    const shootSeed = beat ? [beat.shot, beat.primary_action, beat.purpose].filter(Boolean).join(" ") : "Open with the clearest visual.";
    const cutInstruction = isBeatEnd
      ? `Cut at ${second}s once this frame is understood.`
      : isBeatStart
        ? `Start this clip at ${second}s.`
        : "Hold the clip only while the action stays clear.";
    const transition = isBeatStart && second > 0
      ? pickBySecond(editAssembly.transitionStyle, second, duration) || "Use a clean hard cut into this frame."
      : "No transition inside this second; keep the motion continuous.";

    frames.push({
      second,
      shoot_frame: beat?.shot || beat?.primary_action || "Hold this second on the clearest visual.",
      camera_action: beat?.shot || "Keep the camera steady and the subject readable.",
      pose_note: beat?.pose_camera_note,
      b_roll_note: pickBySecond(beat?.supporting_b_roll ?? [], second, Math.max(1, beat?.end ?? duration)) || undefined,
      on_screen_text: beat?.on_screen_text,
      voiceover_line: beat?.voiceover,
      personalization_slot: progressInBeat > 0.35 && progressInBeat < 0.75 ? pickInstructionForSecond(customizationInstructions, second, duration) || undefined : undefined,
      edit_action: isBeatStart
        ? pickBySecond(editAssembly.clipOrder, second, duration) || `Place the ${beat?.purpose ?? "current"} clip here.`
        : pickBySecond(editAssembly.pacingNotes, second, duration) || "Keep this second tight and readable.",
      cut_point: cutInstruction,
      transition_style: transition,
      overlay_timing: beat?.on_screen_text ? `${second}s: keep overlay readable during this frame.` : undefined,
      audio_cue: pickBySecond(editAssembly.musicSoundCue, second, duration) || undefined,
      pacing_note: pickBySecond(editAssembly.pacingNotes, second, duration) || undefined,
      final_check: isBeatEnd ? pickBySecond(editAssembly.finalChecklist, second, duration) || "This second must move the viewer forward." : undefined,
      visual_cue: visualCueFor(shootSeed),
    });
  }

  const deduped: PerSecondFrame[] = [];
  frames.forEach((frame) => {
    const previous = deduped[deduped.length - 1];
    if (previous && previous.second === frame.second) {
      previous.shoot_frame = previous.shoot_frame || frame.shoot_frame;
      previous.camera_action = previous.camera_action || frame.camera_action;
      previous.edit_action = previous.edit_action || frame.edit_action;
      previous.cut_point = previous.cut_point || frame.cut_point;
      return;
    }
    deduped.push(frame);
  });
  return deduped;
}

function buildEditAssemblyGuide(card: JsonRecord, beats: CanonicalExecutionBeat[], editingNotes: Array<{ label: string; value: string }>) {
  const explicit = asRecord(card.edit_assembly_guide);
  const clipOrder = normalizeListField(explicit, ["clip_order", "clipOrder"]);
  const cutPoints = normalizeListField(explicit, ["cut_points", "cutPoints"]);
  const transitionStyle = normalizeListField(explicit, ["transition_style", "transitionStyle", "transitions"]);
  const textOverlayTiming = normalizeListField(explicit, ["text_overlay_timing", "textOverlayTiming", "overlay_timing"]);
  const voiceoverSync = normalizeListField(explicit, ["voiceover_sync", "voiceoverSync"]);
  const musicSoundCue = normalizeListField(explicit, ["music_sound_cue", "musicSoundCue", "sound_cue", "soundCue"]);
  const pacingNotes = normalizeListField(explicit, ["pacing_notes", "pacingNotes"]);
  const finalChecklist = normalizeListField(explicit, ["final_assembly_checklist", "finalChecklist", "checklist"]);

  const fallbackClipOrder = beats.map((beat, index) => `${index + 1}. ${beat.time_range}: ${beat.shot || beat.primary_action}`);
  const fallbackCutPoints = beats.map((beat) => `Cut at ${beat.end}s, once the ${beat.purpose.toLowerCase()} beat has landed.`);
  const fallbackTransitions = uniqueText(beats.map((beat, index) => {
    if (beat.edit_move) return beat.edit_move;
    if (index === 0) return "Open with a clean hard cut into the first visual.";
    if (index === beats.length - 1) return "Use a clean cut into the final payoff.";
    return "Use a direct hard cut; avoid decorative transitions unless the action matches.";
  })).slice(0, 6);
  const fallbackOverlays = beats
    .filter((beat) => beat.on_screen_text)
    .map((beat) => `${beat.time_range}: ${beat.on_screen_text}`);
  const fallbackVoiceover = beats
    .filter((beat) => beat.voiceover)
    .map((beat) => `${beat.time_range}: sync the voiceover to this shot - ${beat.voiceover}`);
  const fallbackPacing = uniqueText([
    "Keep the first two seconds visually decisive.",
    "Let proof shots breathe only long enough to be understood.",
    ...editingNotes.map((note) => `${note.label}: ${note.value}`),
  ]).slice(0, 6);

  return {
    clipOrder: uniqueText(clipOrder.length ? clipOrder : fallbackClipOrder).slice(0, 8),
    cutPoints: uniqueText(cutPoints.length ? cutPoints : fallbackCutPoints).slice(0, 8),
    transitionStyle: uniqueText(transitionStyle.length ? transitionStyle : fallbackTransitions).slice(0, 6),
    textOverlayTiming: uniqueText(textOverlayTiming.length ? textOverlayTiming : fallbackOverlays).slice(0, 6),
    voiceoverSync: uniqueText(voiceoverSync.length ? voiceoverSync : fallbackVoiceover).slice(0, 6),
    musicSoundCue: uniqueText(musicSoundCue.length ? musicSoundCue : ["Use a subtle bed under the opening, dip it during proof, and lift it slightly for the payoff."]).slice(0, 4),
    pacingNotes: uniqueText(pacingNotes.length ? pacingNotes : fallbackPacing).slice(0, 6),
    finalChecklist: uniqueText(finalChecklist.length ? finalChecklist : [
      "The first visual is understandable without context.",
      "Every clip appears once in the order shown above.",
      "No cut repeats the same action twice.",
      "On-screen text is readable before the next cut.",
      "The final shot clearly tells the viewer what to do next.",
    ]).slice(0, 8),
  };
}

function keyValueRows(value: unknown) {
  const record = asRecord(value);
  if (!record) return [];
  return Object.entries(record)
    .map(([key, rowValue]) => ({ label: labelFor(key), value: asCleanText(rowValue) }))
    .filter((row) => row.value);
}

function shortenBriefLine(value: string, max = 120) {
  const text = asCleanText(value);
  if (!text) return "";
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const at = cut.lastIndexOf(" ");
  return `${(at > 60 ? cut.slice(0, at) : cut).trim()}…`;
}

function buildExampleStory(card: JsonRecord, beats: CanonicalExecutionBeat[]) {
  const summary = asRecord(card.idea_summary);
  const blueprint = asRecord(card.video_blueprint);
  const hook = asRecord(card.hook_performance_pack);
  const opening = shortenBriefLine(
    beats[0]?.primary_action || asCleanText(blueprint?.opening_visual) || asCleanText(hook?.first_line_hook ?? asCleanList(hook?.hook_options)[0]),
    110,
  );
  const proof = shortenBriefLine(
    beats.find((beat) => /proof|trust|detail|middle|turn/i.test(beat.purpose))?.primary_action
      || beats[Math.min(2, Math.max(0, beats.length - 1))]?.primary_action
      || "",
    110,
  );
  const payoff = shortenBriefLine(
    beats[beats.length - 1]?.primary_action || asCleanText(blueprint?.payoff_visual),
    110,
  );
  const premise = shortenBriefLine(
    asCleanText(summary?.creator_takeaway)
      || asCleanText(summary?.premise)
      || asCleanText(card.one_sentence_premise)
      || "One clear decision the viewer can understand in a few seconds.",
    140,
  );

  // Plain language only — no long narrative. Creator should get the card in under 10 seconds.
  return {
    title: "Creative Brief Summary",
    paragraphs: uniqueText([
      premise ? `Idea: ${premise}` : "",
    ]),
    steps: [
      { label: "Idea", body: premise || "One clear, shootable decision." },
      { label: "Open with", body: opening || "The strongest first visual or line." },
      { label: "Show next", body: proof || "The one proof or choice that makes it real." },
      { label: "End with", body: payoff || "A clear save, reply, or final action." },
    ],
  };
}

function hasPayload(payload: Record<string, unknown>) {
  return Object.keys(payload).length > 0 && compactText(payload, "").trim().length > 0;
}

function labelFor(key: string) {
  return labelOverrides[key] ?? titleCase(key);
}

function keyValueBlock(title: string, value: unknown, allowedKeys?: string[]): CardSectionBlock | null {
  const record = asRecord(value);
  if (!record) return null;
  const keys = allowedKeys ?? Object.keys(record);
  const rows = keys
    .filter((key) => record[key] != null)
    .map((key) => ({ label: labelFor(key), value: asCleanText(record[key]) }))
    .filter((row) => row.value.length > 0);
  return rows.length ? { type: "key_value", title, rows } : null;
}

function captionPackBlock(card: JsonRecord): CardSectionBlock | null {
  const captionPack = asRecord(card.caption_pack);
  const commentEngine = asRecord(card.comment_engine);
  const storyFollowup = asRecord(card.story_followup);
  const block: CardSectionBlock = {
    type: "caption_pack",
    title: "Caption, Comment, and Story Follow-up",
    captions: asCleanList(captionPack?.caption_options),
    onScreenText: asCleanList(captionPack?.on_screen_text),
    cta: asCleanText(captionPack?.cta) || undefined,
    pinnedComment: asCleanText(commentEngine?.pinned_comment) || undefined,
    audienceQuestion: asCleanText(commentEngine?.audience_question) || undefined,
    storyPoll: asCleanText(storyFollowup?.poll_question) || undefined,
    storyOptions: asCleanList(storyFollowup?.poll_options),
    followupFrame: asCleanText(storyFollowup?.followup_frame) || undefined,
  };

  return block.captions.length || block.onScreenText.length || block.cta || block.pinnedComment || block.audienceQuestion || block.storyPoll
    ? block
    : null;
}

function safetyBlock(value: unknown): CardSectionBlock | null {
  const record = asRecord(value);
  if (!record) return null;
  const block: CardSectionBlock = {
    type: "safety",
    title: "Claim and Sponsor Safety",
    disclosure: asCleanText(record.disclosure_text) || undefined,
    claimBoundary: asCleanText(record.claim_boundary) || undefined,
    doNotSay: asCleanList(record.do_not_say),
    evidenceNote: asCleanText(record.evidence_note) || undefined,
    saferAlternative: asCleanText(record.safer_alternative_phrase) || undefined,
  };
  return block.disclosure || block.claimBoundary || block.doNotSay.length || block.evidenceNote || block.saferAlternative ? block : null;
}

function textBlock(title: string, value: unknown): CardSectionBlock | null {
  const body = asCleanText(value);
  return body ? { type: "text", title, body } : null;
}

function canonicalTimelineBlock(execution: NormalizedCardExecution): CardSectionBlock | null {
  const items = execution.beats.map((beat, index) => ({
    time: beat.time_range,
    title: beat.purpose || `Beat ${index + 1}`,
    body: uniqueText([
      beat.primary_action,
      beat.shot ? `Shot: ${beat.shot}` : "",
      beat.voiceover ? `Voiceover: ${beat.voiceover}` : "",
      beat.on_screen_text ? `On-screen text: ${beat.on_screen_text}` : "",
    ]).join(" "),
    meta: uniqueText([
      beat.edit_move ? `Edit: ${beat.edit_move}` : "",
      beat.pose_camera_note ? `Pose/camera: ${beat.pose_camera_note}` : "",
      beat.safety_note ? `Safety: ${beat.safety_note}` : "",
    ]),
  })).filter((item) => item.title || item.body);

  return items.length ? { type: "timeline", title: "Canonical Execution Beats", items } : null;
}

function brollSupportBlock(execution: NormalizedCardExecution): CardSectionBlock | null {
  const items = uniqueText([
    ...execution.supplemental_b_roll,
    ...execution.beats.flatMap((beat) => beat.supporting_b_roll),
  ]).slice(0, 8);

  return items.length ? { type: "list", title: "Additional Support Shots", items } : null;
}

function editSupportBlock(execution: NormalizedCardExecution): CardSectionBlock | null {
  const editMoves = uniqueText(execution.beats.map((beat) => beat.edit_move ?? "")).slice(0, 8);
  if (!editMoves.length) return null;
  return { type: "list", title: "Cut and Pacing Notes", items: editMoves };
}

function editAssemblyBlock(execution: NormalizedCardExecution): CardSectionBlock {
  return {
    type: "edit_assembly",
    title: "Edit Assembly Guide",
    ...execution.edit_assembly_guide,
  };
}

function sectionBlocks(key: string, card: JsonRecord): CardSectionBlock[] {
  const blocks: Array<CardSectionBlock | null> = [];
  const execution = normalizeCardExecution(card);

  if (key === "scene_flow") {
    blocks.push({ type: "execution_ranges", title: "Time-range shooting board", mode: "shooting", ranges: execution.execution_ranges });
    blocks.push(canonicalTimelineBlock(execution));
    blocks.push(brollSupportBlock(execution));
  }

  if (key === "pose_micro_behavior") {
    blocks.push(keyValueBlock("Pose Direction", card.pose_direction, ["face", "hands", "body", "expression"]));
    blocks.push(keyValueBlock("Micro Behavior Guide", card.micro_behavior_guide, ["facial_expression", "eye_contact", "product_handling", "camera_attention", "smile_timing", "avoid_over_advertising"]));
    blocks.push(keyValueBlock("Camera Direction", card.camera_direction, ["framing", "movement", "lighting"]));
  }

  if (key === "b_roll") {
    blocks.push(brollSupportBlock(execution));
  }

  if (key === "edit_timeline") {
    blocks.push({ type: "execution_ranges", title: "Time-range edit board", mode: "editing", ranges: execution.execution_ranges });
    blocks.push(editAssemblyBlock(execution));
    blocks.push(editSupportBlock(execution));
    blocks.push(keyValueBlock("Editing Notes", card.editing_notes));
  }

  if (key === "caption_comment") {
    blocks.push(captionPackBlock(card));
  }

  if (key === "brand_lift") {
    blocks.push(textBlock("Brand Lift Statement", card.brand_lift_statement));
    blocks.push(keyValueBlock("Strategic Value", card.strategic_value, ["brand_equity", "audience_aftertaste", "partnership_signal"]));
    blocks.push(keyValueBlock("Creator Presence Mode", card.creator_presence_mode, ["mode", "delivery_style", "why_it_fits_creator", "avoid"]));
    blocks.push(keyValueBlock("Atmosphere Direction", card.atmosphere_direction, ["mood", "visual_texture", "color_language", "soundscape"]));
  }

  if (key === "brand_safety") {
    blocks.push(safetyBlock(card.brand_safety));
    blocks.push(keyValueBlock("Production Plan", card.production_plan, ["shoot_time_minutes", "equipment", "solo_creator_friendly", "location_options", "production_versions"]));
  }

  return blocks.filter(Boolean) as CardSectionBlock[];
}

function section(
  card: Record<string, unknown>,
  key: string,
  title: string,
  sourceKeys: string[],
  summary: string,
  how: string,
  good: string,
  mistakes: string[],
  example: string,
): CardSection {
  const payload = pick(card, sourceKeys);
  if (key === "scene_flow") {
    const execution = normalizeCardExecution(card);
    payload.execution_beats = execution.beats;
    payload.execution_ranges = execution.execution_ranges;
    payload.execution_duration = execution.beats.length ? Math.max(...execution.beats.map((beat) => beat.end)) : undefined;
  }
  const active = hasPayload(payload);
  const blocks = active ? sectionBlocks(key, card) : [];
  return {
    key,
    title,
    short_summary: active ? summary : "This card has no dedicated guidance for this section.",
    how_to_do_it: active ? how : "Follow the main idea and the other active tabs on this card.",
    what_good_looks_like: active ? good : "If the video still follows the core card idea, this section does not need extra work.",
    common_mistakes: active ? mistakes : [],
    example_execution: active ? example : "No example needed for this card.",
    source_payload: payload,
    checklist_items: sourceKeys,
    blocks: blocks.length ? blocks : [{ type: "text", title: noGuidance, body: "This card does not include a dedicated block for this section. Use the core idea, the hook, and the active tabs as your guide." }],
  };
}

export function normalizeAdminCardSections(cardValue: unknown): CardSection[] {
  const card = (cardValue && typeof cardValue === "object" && !Array.isArray(cardValue) ? cardValue : {}) as Record<string, unknown>;
  return [
    section(card, "scene_flow", "Scene Flow", ["video_blueprint", "scene_script", "shot_list", "b_roll_plan", "pose_direction", "micro_behavior_guide", "camera_direction", "editing_timeline", "editing_notes", "edit_assembly_guide", "personalization_slots"], "The Audience Insight: How the Reel captures attention fast and delivers a clear, saveable payoff.", "Signature Execution Blueprint: Shoot the beats in order. Each scene has one job: attention, trust, proof, payoff, or CTA.", "The Elevated Outcome: Viewer gets the premise instantly, sees proof without confusion, knows exactly why to save or comment.", ["Opening with context instead of a visual hook", "Letting the proof section run too long", "Ending without a clear action"], "Open with the strongest visual, explain the premise in one clean line, show proof or a turn, then finish with a save/comment CTA."),
    section(card, "pose_micro_behavior", "Pose & Micro Behavior", ["pose_direction", "micro_behavior_guide", "camera_direction"], "The Audience Insight: How natural movement and eye contact build trust and premium presence.", "Signature Execution Blueprint: Match facial expression, hand movement, framing, and camera attention to the tone of the idea.", "The Elevated Outcome: Creator feels relaxed, premium, and trustworthy without looking scripted.", ["Staring into camera for the entire video", "Holding the product like an ad placement", "Overacting a simple proof moment"], "Look to camera for the hook, shift attention to the action or object during proof, then return calmly for the final CTA."),
    section(card, "b_roll", "B-roll", ["b_roll_plan", "shot_list"], "The Audience Insight: Supporting shots that make the story feel real and premium without distraction.", "Signature Execution Blueprint: Give each supporting shot a job: proof, setting, realism, texture, transition, or payoff.", "The Elevated Outcome: Video feels visually rich, every shot helps the viewer understand the idea.", ["Repeating the same angle", "Using pretty shots with no purpose", "Skipping the small proof details"], "Add a close-up, a hand movement, an environment detail, a preparation moment, and one real-life imperfection."),
    section(card, "edit_timeline", "Edit Timeline", ["editing_timeline", "editing_notes"], "The Audience Insight: Precise rhythm that protects attention and makes the idea easy to follow.", "Signature Execution Blueprint: Cut quickly at the start, slow only when proof matters, keep payoff clean.", "The Elevated Outcome: Video starts fast, clarifies in the middle, ends with reason to save/share/comment.", ["Wasting the first second", "Letting the explanation flatten the pace", "Hiding the payoff too late"], "0-2s visual interruption, 3-8s premise, 9-20s proof or turn, final seconds CTA."),
    section(card, "caption_comment", "Caption & Comment", ["caption_pack", "comment_engine", "story_followup"], "The Audience Insight: Caption and comment prompts that drive saves, replies, and continuation.", "Signature Execution Blueprint: Choose caption matching the edit, use pinned comment to prompt specific viewer answer.", "The Elevated Outcome: Caption frames the decision, comment prompt is easy to answer.", ["Using a generic comment question", "Putting too much text on screen", "Writing a caption that repeats the video word-for-word"], "Use a short caption that frames the decision, then pin a question that asks the audience what they would choose or remove."),
    section(card, "brand_lift", "Brand Lift", ["brand_lift_statement", "strategic_value", "creator_presence_mode", "atmosphere_direction"], "The Audience Insight: How the idea builds your taste, authority, and premium positioning.", "Signature Execution Blueprint: Carry the suggested mood, presence, and atmosphere into every shot and line.", "The Elevated Outcome: Viewer remembers your judgment and standards, not just the tactic.", ["Treating the idea as only a content trick", "Mixing premium and relatable tones without intention", "Forcing a product pitch into a brand moment"], "Let the idea show your standards: calm judgment, taste, and a specific point of view."),
    section(card, "brand_safety", "Brand Safety", ["brand_safety"], "The Audience Insight: Boundaries that keep the video credible and brand-safe.", "Signature Execution Blueprint: Use disclosure when needed, avoid guarantees, tie claims to real context.", "The Elevated Outcome: Post feels trustworthy and safe for partners.", ["Hiding disclosure", "Promising universal results", "Making claims without evidence"], "Say 'in my context this is the safer choice' instead of 'this works for everyone.'"),
  ];
}

export function normalizeCreatorCardSections(cardValue: unknown): CardSection[] {
  const card = (cardValue && typeof cardValue === "object" && !Array.isArray(cardValue) ? cardValue : {}) as Record<string, unknown>;
  // Creator-facing sections only. Caption & Audience Prompt is intentionally omitted from the site UI.
  const creatorSections = [
    section(card, "scene_flow", "Scene Flow", ["video_blueprint", "scene_script", "shot_list", "b_roll_plan", "pose_direction", "micro_behavior_guide", "camera_direction", "editing_timeline", "editing_notes", "edit_assembly_guide", "personalization_slots"], "Shoot and assemble the Reel from this one execution board.", "Follow the beats from top to bottom, then use the edit guide to assemble the final cut.", "The Reel is clear, shootable, and easy to edit without guessing what comes next.", ["Repeating the same action in two clips", "Adding extra context before the hook", "Letting the edit slow down before the payoff"], "Shoot each beat once, keep only the strongest clip, then assemble the timeline in the order shown."),
    section(card, "edit_timeline", "Edit Assembly Guide", ["editing_timeline", "editing_notes", "edit_assembly_guide", "scene_script", "shot_list", "b_roll_plan"], "Assemble the Reel in the exact order, cut rhythm, and overlay timing.", "Follow the clip order, cut points, transition style, and final checklist before exporting.", "The final edit feels clean, intentional, and easy to follow.", ["Using every take instead of the strongest take", "Adding decorative transitions that slow the premise", "Letting overlays arrive after the viewer needs them"], "Build the edit from the clip order, cut at the listed moments, then check the final assembly list before posting."),
    section(card, "brand_safety", "Posting Safety", ["brand_safety"], "Keep claims, sponsor language, and disclosures credible before publishing.", "Use the boundary language when the post includes a result, recommendation, partner, or claim.", "The post feels trustworthy to viewers and usable for brand partners.", ["Promising a guaranteed result", "Hiding a sponsorship disclosure", "Turning a personal context into a universal claim"], "Frame claims around your context and use clear disclosure when needed."),
  ];
  return creatorSections
    .map((item) => {
      let blocks = item.blocks.filter((block) => {
        if (item.key === "scene_flow") {
          return block.type === "execution_ranges" && block.mode === "shooting";
        }
        if (item.key === "edit_timeline") {
          return block.type === "edit_assembly" || (block.type === "execution_ranges" && block.mode === "editing");
        }
        if (item.key === "brand_safety") return block.type === "safety";
        return false;
      });

      // One board only: prefer edit_assembly mock over editing ranges when both exist.
      if (item.key === "edit_timeline" && blocks.some((b) => b.type === "edit_assembly")) {
        blocks = blocks.filter((b) => b.type === "edit_assembly");
      }

      return { ...item, blocks };
    })
    .filter((item) => item.blocks.length > 0);
}

export const normalizeCardSections = normalizeAdminCardSections;
