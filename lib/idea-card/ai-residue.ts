/**
 * Deterministic AI-residue detector for idea cards.
 *
 * Why not GPTZero / Originality / Turnitin:
 * - Weber-Wulff 2023: 14 detectors all below 80% accuracy; paraphrase collapses them.
 * - Liang et al. 2023 (Patterns): ~61% false-positive on non-native English.
 * - Sadasivan et al. 2023: reliable detection is not possible in the practical case.
 * - Cards are short (title + 4–6 imperative beats). Perplexity/burstiness needs long prose.
 *
 * What does work on short shoot briefs (this module):
 * 1. Excess style vocabulary — Kobak et al. 2025 (Science Advances / arXiv:2406.07016),
 *    Gray 2024, Liang et al. 2024. ChatGPT spiked delve/tapestry/intricate/meticulously.
 * 2. Rhetorical templates — formulaic transitions, "not just X but Y", "in a world where".
 * 3. Pipeline / chatbot leaks — "as an AI", placeholders, score jargon.
 * 4. Fake certainty — invented virality metrics (Kommers 2026 slop: superficial competence).
 * 5. Workslop — HBR/BetterUp 2025: polished, empty, creates more work for the recipient.
 *
 * High precision only. Common words (crucial, potential, insights, hold) are not banned.
 */

import { BANNED_VAGUE_PHRASES } from "./banned-phrases";
import { wordCount } from "./text";
import type { IdeaCard } from "./types";

export type ResidueKind =
  | "vague_phrase"
  | "llm_style_word"
  | "template"
  | "pipeline_leak"
  | "fake_certainty"
  | "workslop";

export type ResidueHit = {
  kind: ResidueKind;
  match: string;
  blocking: boolean;
};

/** Kobak/Gray/Liang high-signal style words. Whole-word only. */
export const LLM_STYLE_WORDS = [
  "delve",
  "delves",
  "delving",
  "delved",
  "tapestry",
  "realm",
  "realms",
  "intricate",
  "intricately",
  "intricacies",
  "meticulous",
  "meticulously",
  "multifaceted",
  "underscore",
  "underscores",
  "underscoring",
  "underscored",
  "showcasing",
  "pivotal",
  "groundbreaking",
  "interplay",
  "paradigm",
  "commendable",
  "invaluable",
  "noteworthy",
  "elucidate",
  "elucidates",
  "elucidating",
  "encompass",
  "encompasses",
  "encompassing",
  "bolster",
  "bolstering",
  "harness",
  "harnessing",
  "harnesses",
  "embark",
  "embarking",
  "nestled",
  "utilize",
  "utilizing",
  "utilisation",
  "utilization",
  "synergy",
  "synergies",
  "holistic",
  "adept",
  "burgeoning",
  "testament",
  "unpacking",
  "myriad",
  "plethora",
  "nuance",
  "nuanced",
  "nuances",
  "leverage",
  "leveraging",
  "leverages",
] as const;

/** Multi-word LLM style collocations (safe as substring, still specific). */
export const LLM_STYLE_PHRASES = [
  "cutting-edge",
  "cutting edge",
  "thought-provoking",
  "thought provoking",
  "digital landscape",
  "content landscape",
  "evolving landscape",
  "marketing landscape",
  "ever-evolving",
  "ever evolving",
  "vibrant energy",
  "vibrant community",
  "vibrant content",
  "vibrant experience",
  "fostering engagement",
  "foster connection",
  "foster authentic",
  "robust strategy",
  "robust approach",
  "robust framework",
  "a testament to",
  "deep dive into",
  "deep-dive into",
  "shed light on",
  "it is worth noting",
  "it's worth noting",
  "plays a crucial role",
  "play a crucial role",
  "plays a vital role",
  "in this ever",
  "derinlemesine keşfet",
  "derinlemesine incel",
  "kapsamlı bir bakış",
  "kapsamlı bir rehber",
  "kapsamlı bir yaklaşım",
  "bu yolculukta",
  "dijital dünyada",
  "unutmayın ki",
  "bu noktada belirtmek",
  "potansiyelini ortaya",
  "potansiyelini açığa",
  "eşsiz bir deneyim",
  "etkileyici bir hikaye",
  "özenle hazırlanmış",
  "yeni bir bakış açısı",
] as const;

export const AI_TEMPLATE_PATTERNS: Array<{ id: string; re: RegExp }> = [
  { id: "in_a_world_where", re: /\bin a world where\b/iu },
  { id: "whether_youre_a", re: /\bwhether you(?:['’]re| are) a\b/iu },
  { id: "important_to_note", re: /\bit(?:['’]s| is) (?:important|crucial|essential|vital) to (?:note|remember|understand|mention|recognize)\b/iu },
  { id: "lets_dive", re: /\blet(?:['’]s| us) (?:dive|unpack|explore|delve|break this down)\b/iu },
  { id: "not_just_but", re: /\bnot (?:just|only|merely) .{2,48}?\b(?:but also|but rather|it['’]s)\b/iu },
  { id: "unlock_potential", re: /\bunlock(?:s|ing)? (?:the |your )?(?:full )?potential\b/iu },
  { id: "todays_world", re: /\bin today(?:['’]s|s) (?:fast[-\s]?paced |ever[-\s]?evolving )?(?:digital )?world\b/iu },
  { id: "at_the_end_of_the_day", re: /\bat the end of the day\b/iu },
  { id: "in_conclusion", re: /\bin conclusion,?\b/iu },
  { id: "imagine_this", re: /\b(?:imagine|picture) this:/iu },
  { id: "game_changer", re: /\bgame[-\s]?changer\b/iu },
  { id: "next_level", re: /\btake(?:s| it)? to the next level\b/iu },
  { id: "in_this_guide", re: /\bin this (?:article|guide|post),? we(?:['’]ll| will)\b/iu },
  { id: "from_x_to_y_empty", re: /\bfrom beginners? to (?:seasoned |advanced |expert )/iu },
  { id: "join_me_as", re: /\bjoin me as (?:we|i)\b/iu },
  { id: "factory_brief_number", re: /\bbrief\s+\d{2,}\b/iu },
  { id: "factory_checklist_brief", re: /\b(?:checklist|framework|playbook|atlas)\s+brief\b/iu },
];

export const PIPELINE_LEAK_PHRASES = [
  "as an ai",
  "as an artificial intelligence",
  "language model",
  "i hope this helps",
  "happy to help",
  "let me know if you need",
  "great question",
  "schemaversion",
  "red gate",
  "redgate",
  "idea_card",
  "score_band",
  "quality_floor",
  "insert product",
  "insert category",
  "lorem ipsum",
  "[placeholder]",
  "[todo]",
  "{{product",
  "{{category",
] as const;

export const PIPELINE_LEAK_PATTERNS: Array<{ id: string; re: RegExp }> = [
  { id: "chatbot_certainly", re: /\bcertainly[!]/iu },
  { id: "chatbot_of_course", re: /\bof course[!]/iu },
  { id: "mustache_slot", re: /\{\{[a-z0-9_]+\}\}/iu },
  { id: "bracket_slot", re: /\[(?:product|category|creator|insert|your .+?)\]/iu },
];

export const FAKE_CERTAINTY_PHRASES = [
  "guaranteed viral",
  "will go viral",
  "go viral overnight",
  "goes viral every time",
  "10x your",
  "10x views",
  "1 million views",
  "1m views",
  "100% engagement",
  "always works",
  "never fails",
  "guaranteed results",
  "this will blow up",
  "proven to convert",
  "skyrocket your",
  "explode your reach",
  "viral guaranteed",
  "algoritmayı kandır",
  "kesin viral",
  "viral garanti",
] as const;

const STYLE_ADJECTIVES = [
  "authentic",
  "engaging",
  "captivating",
  "compelling",
  "powerful",
  "stunning",
  "seamless",
  "dynamic",
  "premium",
  "meaningful",
  "impactful",
  "transformative",
  "exceptional",
  "remarkable",
  "immersive",
  "curated",
  "elevated",
  "polished",
  "etkileyici",
  "özgün",
  "kusursuz",
  "benzersiz",
  "büyüleyici",
];

const CONCRETE_TOKEN =
  /\b(?:\d+(?:\.\d+)?|cm|mm|inch|inches|second|seconds|saniye|dakika|close-?up|overhead|macro|tripod|daylight|eye-?level|wrist|hand|hands|finger|skin|face|jaw|cheek|chest|glass|oil|bottle|pipette|beaker|serum|cream|pad|lens|label|timer|clock|mirror|shelf|board|pan|mat|knife|mug|dock|hinge|seam|fabric|wrist|pour|cap|stir|tilt|wipe|lift|hold|place|show|cut|open|close|press|tap|swipe|koy|göster|kes|dök|bak|çevir|kaldır)\b/iu;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasWholeWord(text: string, word: string): boolean {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(word)}(?![\\p{L}\\p{N}])`, "iu").test(text);
}

function firstRegexMatch(text: string, re: RegExp): string | null {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  const copy = new RegExp(re.source, flags);
  const found = copy.exec(text);
  return found?.[0] ?? null;
}

function pushUnique(hits: ResidueHit[], hit: ResidueHit) {
  if (hits.some((existing) => existing.kind === hit.kind && existing.match === hit.match)) return;
  hits.push(hit);
}

/**
 * Scan a single string. Workslop only runs on narrative-length fields.
 */
export function scanTextResidue(
  text: string,
  options?: { allowWorkslop?: boolean },
): ResidueHit[] {
  const raw = text.trim();
  if (!raw) return [];
  const lower = raw.toLowerCase();
  const hits: ResidueHit[] = [];

  for (const phrase of BANNED_VAGUE_PHRASES) {
    if (lower.includes(phrase)) {
      pushUnique(hits, { kind: "vague_phrase", match: phrase, blocking: true });
    }
  }

  for (const word of LLM_STYLE_WORDS) {
    if (hasWholeWord(raw, word)) {
      pushUnique(hits, { kind: "llm_style_word", match: word, blocking: true });
    }
  }

  for (const phrase of LLM_STYLE_PHRASES) {
    if (lower.includes(phrase)) {
      pushUnique(hits, { kind: "llm_style_word", match: phrase, blocking: true });
    }
  }

  for (const pattern of AI_TEMPLATE_PATTERNS) {
    const match = firstRegexMatch(raw, pattern.re);
    if (match) {
      pushUnique(hits, { kind: "template", match: match.toLowerCase(), blocking: true });
    }
  }

  for (const phrase of PIPELINE_LEAK_PHRASES) {
    if (lower.includes(phrase)) {
      pushUnique(hits, { kind: "pipeline_leak", match: phrase, blocking: true });
    }
  }
  for (const pattern of PIPELINE_LEAK_PATTERNS) {
    const match = firstRegexMatch(raw, pattern.re);
    if (match) {
      pushUnique(hits, { kind: "pipeline_leak", match: match.toLowerCase(), blocking: true });
    }
  }

  for (const phrase of FAKE_CERTAINTY_PHRASES) {
    if (lower.includes(phrase)) {
      pushUnique(hits, { kind: "fake_certainty", match: phrase, blocking: true });
    }
  }

  const allowWorkslop = options?.allowWorkslop !== false;
  if (allowWorkslop && wordCount(raw) >= 10 && !CONCRETE_TOKEN.test(raw)) {
    const styleHits = STYLE_ADJECTIVES.filter((adj) => hasWholeWord(raw, adj));
    if (styleHits.length >= 2) {
      pushUnique(hits, {
        kind: "workslop",
        match: `empty-style:${styleHits.slice(0, 3).join("+")}`,
        blocking: true,
      });
    }
  }

  return hits;
}

export type CardTextField = {
  path: string;
  text: string;
  narrative: boolean;
};

export function iterIdeaCardText(card: IdeaCard): CardTextField[] {
  const fields: CardTextField[] = [
    { path: "title", text: card.title ?? "", narrative: false },
    { path: "conceptSummary", text: card.conceptSummary ?? "", narrative: true },
    { path: "viewerTakeaway", text: card.viewerTakeaway ?? "", narrative: true },
    { path: "whyItWorks", text: card.whyItWorks ?? "", narrative: true },
    { path: "audience", text: card.audience ?? "", narrative: true },
  ];
  for (const [index, item] of (card.requiredItems ?? []).entries()) {
    fields.push({ path: `requiredItems.${index}`, text: item, narrative: false });
  }
  for (const [index, note] of (card.overallProductionNotes ?? []).entries()) {
    fields.push({ path: `overallProductionNotes.${index}`, text: note, narrative: true });
  }
  const sorted = [...(card.steps ?? [])].sort((a, b) => a.order - b.order);
  for (let i = 0; i < sorted.length; i += 1) {
    const step = sorted[i];
    const path = `steps.${i}`;
    fields.push(
      { path: `${path}.purpose`, text: step.purpose ?? "", narrative: true },
      { path: `${path}.goal`, text: step.goal ?? "", narrative: true },
      { path: `${path}.action`, text: step.action ?? "", narrative: true },
      { path: `${path}.spokenLine`, text: step.spokenLine ?? "", narrative: true },
      { path: `${path}.shot`, text: step.shot ?? "", narrative: true },
      { path: `${path}.onScreenText`, text: step.onScreenText ?? "", narrative: false },
      { path: `${path}.editNote`, text: step.editNote ?? "", narrative: true },
      { path: `${path}.performanceNote`, text: step.performanceNote ?? "", narrative: true },
    );
  }
  return fields.filter((field) => field.text.trim().length > 0);
}

export type CardResidueHit = ResidueHit & { path: string };

export function scanIdeaCardResidue(card: IdeaCard): CardResidueHit[] {
  const hits: CardResidueHit[] = [];
  for (const field of iterIdeaCardText(card)) {
    const found = scanTextResidue(field.text, { allowWorkslop: field.narrative });
    for (const hit of found) {
      hits.push({ ...hit, path: field.path });
    }
  }
  return hits;
}

export function hasBlockingResidue(hits: Array<ResidueHit | CardResidueHit>): boolean {
  return hits.some((hit) => hit.blocking);
}

/** First blocking match in a string, or null. Compatible with findBannedPhrase. */
export function firstResidueMatch(text: string): string | null {
  const hit = scanTextResidue(text).find((item) => item.blocking);
  return hit ? hit.match : null;
}

/** Strip lexical residue. Structural workslop cannot be stripped. */
export function stripResidue(text: string): string {
  let out = text;
  const lexical = [
    ...BANNED_VAGUE_PHRASES,
    ...LLM_STYLE_PHRASES,
    ...PIPELINE_LEAK_PHRASES,
    ...FAKE_CERTAINTY_PHRASES,
  ];
  for (const phrase of lexical) {
    out = out.replace(new RegExp(escapeRegExp(phrase), "gi"), " ");
  }
  for (const word of LLM_STYLE_WORDS) {
    out = out.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(word)}(?![\\p{L}\\p{N}])`, "giu"), " ");
  }
  for (const pattern of [...AI_TEMPLATE_PATTERNS, ...PIPELINE_LEAK_PATTERNS]) {
    out = out.replace(new RegExp(pattern.re.source, pattern.re.flags.replace("g", "")), " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

export const RESIDUE_ISSUE_CODES = [
  "BANNED_VAGUE_PHRASE",
  "LLM_STYLE_RESIDUE",
  "AI_TEMPLATE",
  "PIPELINE_LEAK",
  "FAKE_CERTAINTY",
  "WORKSLOP",
] as const;

export function residueIssueCode(kind: ResidueKind): (typeof RESIDUE_ISSUE_CODES)[number] {
  switch (kind) {
    case "vague_phrase":
      return "BANNED_VAGUE_PHRASE";
    case "llm_style_word":
      return "LLM_STYLE_RESIDUE";
    case "template":
      return "AI_TEMPLATE";
    case "pipeline_leak":
      return "PIPELINE_LEAK";
    case "fake_certainty":
      return "FAKE_CERTAINTY";
    case "workslop":
      return "WORKSLOP";
  }
}
