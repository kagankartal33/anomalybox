import { compactText, normalizeCreatorText, titleCase } from "@/lib/format";

type JsonRecord = Record<string, unknown>;

export type CardSectionBlock =
  | { type: "text"; title: string; body: string }
  | { type: "list"; title: string; items: string[] }
  | { type: "key_value"; title: string; rows: Array<{ label: string; value: string }> }
  | { type: "timeline"; title: string; items: Array<{ time?: string; title: string; body?: string; meta?: string[] }> }
  | { type: "shot_list"; title: string; items: Array<{ time?: string; title: string; action?: string; note?: string; overlay?: string }> }
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
  poll_options: "Poll options",
  poll_question: "Poll question",
  product_handling: "Product handling",
  production_versions: "Production versions",
  reply_strategy: "Reply strategy",
  safer_alternative_phrase: "Safer alternative",
  scene_arc: "Scene arc",
  shoot_time_minutes: "Shoot time",
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

function listBlock(title: string, value: unknown): CardSectionBlock | null {
  const items = asCleanList(value);
  return items.length ? { type: "list", title, items } : null;
}

function timelineBlock(title: string, value: unknown, options: { titleKeys: string[]; bodyKeys?: string[]; metaKeys?: string[] } = { titleKeys: ["purpose", "beat", "title"] }): CardSectionBlock | null {
  const items = asArray(value).map((item, index) => {
    const record = asRecord(item);
    if (!record) {
      return { title: asCleanText(item, `Beat ${index + 1}`) };
    }
    const time = asCleanText(record.second ?? record.time ?? record.timestamp ?? record.range);
    const titleValue = options.titleKeys.map((key) => asCleanText(record[key])).find(Boolean) ?? `Beat ${index + 1}`;
    const body = (options.bodyKeys ?? ["voiceover", "spoken_lines", "on_screen_text", "edit", "action"])
      .map((key) => asCleanText(record[key]))
      .filter(Boolean)
      .join(" ");
    const meta = (options.metaKeys ?? [])
      .map((key) => {
        const valueText = asCleanText(record[key]);
        return valueText ? `${labelFor(key)}: ${valueText}` : "";
      })
      .filter(Boolean);
    return {
      time: time || undefined,
      title: titleValue,
      body: body || undefined,
      meta: meta.length ? meta : undefined,
    };
  }).filter((item) => item.title.length > 0);

  return items.length ? { type: "timeline", title, items } : null;
}

function shotListBlock(title: string, value: unknown): CardSectionBlock | null {
  const items = asArray(value).map((item, index) => {
    const record = asRecord(item);
    if (!record) {
      return { title: asCleanText(item, `Shot ${index + 1}`) };
    }
    return {
      time: asCleanText(record.second ?? record.time) || undefined,
      title: asCleanText(record.shot ?? record.type ?? record.title, `Shot ${index + 1}`),
      action: asCleanText(record.action) || undefined,
      note: asCleanText(record.note) || undefined,
      overlay: asCleanText(record.overlay ?? record.on_screen_text) || undefined,
    };
  }).filter((item) => item.title.length > 0);

  return items.length ? { type: "shot_list", title, items } : null;
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

function sectionBlocks(key: string, card: JsonRecord): CardSectionBlock[] {
  const blocks: Array<CardSectionBlock | null> = [];

  if (key === "scene_flow") {
    blocks.push(keyValueBlock("Video Blueprint", card.video_blueprint, ["duration_seconds", "opening_visual", "scene_arc", "payoff_visual"]));
    blocks.push(timelineBlock("Scene Script", card.scene_script, { titleKeys: ["purpose", "beat"], metaKeys: ["voiceover", "spoken_lines", "on_screen_text"] }));
    blocks.push(shotListBlock("Primary Shot List", card.shot_list));
  }

  if (key === "pose_micro_behavior") {
    blocks.push(keyValueBlock("Pose Direction", card.pose_direction, ["face", "hands", "body", "expression"]));
    blocks.push(keyValueBlock("Micro Behavior Guide", card.micro_behavior_guide, ["facial_expression", "eye_contact", "product_handling", "camera_attention", "smile_timing", "avoid_over_advertising"]));
    blocks.push(keyValueBlock("Camera Direction", card.camera_direction, ["framing", "movement", "lighting"]));
  }

  if (key === "b_roll") {
    blocks.push(shotListBlock("B-roll Plan", card.b_roll_plan));
    blocks.push(shotListBlock("Supporting Shots", card.shot_list));
  }

  if (key === "edit_timeline") {
    blocks.push(timelineBlock("Edit Timeline", card.editing_timeline, { titleKeys: ["beat", "purpose"], bodyKeys: ["edit", "action", "note"] }));
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

export function normalizeCardSections(cardValue: unknown): CardSection[] {
  const card = (cardValue && typeof cardValue === "object" && !Array.isArray(cardValue) ? cardValue : {}) as Record<string, unknown>;
  return [
    section(card, "scene_flow", "Scene Flow", ["video_blueprint", "scene_script", "shot_list"], "How the Reel moves from first-second attention into proof, payoff, and a clear viewer action.", "Shoot the beats in order. Each scene should have one job: attention, trust, proof, payoff, or CTA.", "The viewer understands the premise immediately, sees the proof without confusion, and knows why to save or comment.", ["Opening with context instead of a visual hook", "Letting the proof section run too long", "Ending without a clear action"], "Open with the strongest visual, explain the premise in one clean line, show proof or a turn, then finish with a save/comment CTA."),
    section(card, "pose_micro_behavior", "Pose & Micro Behavior", ["pose_direction", "micro_behavior_guide", "camera_direction"], "How the creator should look, move, hold objects, use eye contact, and keep the delivery natural.", "Match facial expression, hand movement, framing, and camera attention to the tone of the idea.", "The creator feels relaxed, premium, and trustworthy without looking overly scripted or promotional.", ["Staring into camera for the entire video", "Holding the product like an ad placement", "Overacting a simple proof moment"], "Look to camera for the hook, shift attention to the action or object during proof, then return calmly for the final CTA."),
    section(card, "b_roll", "B-roll", ["b_roll_plan", "shot_list"], "Supporting close-ups, movement shots, and atmosphere details that make the idea feel premium and real.", "Give each supporting shot a job: proof, setting, realism, texture, transition, or payoff.", "The video feels visually rich, but every shot still helps the viewer understand the idea.", ["Repeating the same angle", "Using pretty shots with no purpose", "Skipping the small proof details"], "Add a close-up, a hand movement, an environment detail, a preparation moment, and one real-life imperfection."),
    section(card, "edit_timeline", "Edit Timeline", ["editing_timeline", "editing_notes"], "The second-by-second rhythm that protects retention and keeps the idea easy to follow.", "Cut quickly at the start, slow down only when proof matters, and keep the payoff clean.", "The video starts fast, clarifies in the middle, and ends with a reason to save, share, or comment.", ["Wasting the first second", "Letting the explanation flatten the pace", "Hiding the payoff too late"], "0-2s visual interruption, 3-8s premise, 9-20s proof or turn, final seconds CTA."),
    section(card, "caption_comment", "Caption & Comment", ["caption_pack", "comment_engine", "story_followup"], "Caption options, pinned comment logic, and follow-up prompts designed to increase saves, replies, and story continuation.", "Choose the caption that matches the finished edit, then use the pinned comment to make the viewer answer something specific.", "The caption makes the video easier to understand on replay, and the comment prompt feels easy to answer.", ["Using a generic comment question", "Putting too much text on screen", "Writing a caption that repeats the video word-for-word"], "Use a short caption that frames the decision, then pin a question that asks the audience what they would choose or remove."),
    section(card, "brand_lift", "Brand Lift", ["brand_lift_statement", "strategic_value", "creator_presence_mode", "atmosphere_direction"], "What this idea adds to the creator's public taste, authority, relatability, or premium positioning.", "Carry the suggested mood, creator presence, and atmosphere into every shot and line.", "The viewer remembers the creator's judgment, standards, and taste, not only the tactic.", ["Treating the idea as only a content trick", "Mixing premium and relatable tones without intention", "Forcing a product pitch into a brand moment"], "Let the idea show your standards: calm judgment, taste, and a specific point of view."),
    section(card, "brand_safety", "Brand Safety", ["brand_safety"], "Sponsor, disclosure, claim, and wording boundaries that keep the video credible and post-ready.", "Use disclosure when needed, avoid guaranteed-result language, and keep claims tied to your real context.", "The post feels trustworthy, premium, and safe for a brand partner to stand behind.", ["Hiding disclosure", "Promising universal results", "Making claims without evidence"], "Say 'in my context this is the safer choice' instead of 'this works for everyone.'"),
  ];
}