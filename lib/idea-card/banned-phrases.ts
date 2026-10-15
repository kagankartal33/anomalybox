/**
 * Vague / vibe phrases banned on idea cards.
 * Full residue detection (Kobak-style style-words, templates, leaks, workslop)
 * lives in ./ai-residue.ts and includes this list.
 * Keep in sync with tools/lint-idea-card-templates.mjs (reads this file).
 */

export const BANNED_VAGUE_PHRASES = [
  "premium moment",
  "premium frame",
  "beauty moment",
  "fitness moment",
  "food moment",
  "proof detail",
  "carry the energy",
  "elevate the content",
  "authentic impact",
  "polished storytelling",
  "hidden decision",
  "compelling reveal",
  "engaging experience",
  "captivating content",
  "seamless transition",
  "strategic authenticity",
  "dynamic visual",
  "resonate with viewers",
  "high-value content",
  "powerful payoff",
  "stop the scroll",
  "game-changing",
  "effortless engagement",
  "bring value",
  "add value",
  "deliver value",
  "create impact",
  "drive engagement",
  "maximize impact",
  "authentic connection",
  "visual journey",
  "storytelling moment",
  "premium experience",
  "meaningful moment",
  "content moment",
  "strong energy",
  "credible energy",
  "polished energy",
  "for this beauty moment",
  "for this fitness moment",
  "for this food moment",
  "start from the premium frame",
  "let the proof carry",
  "here is the proof detail",
  "enerjik ol",
  "heyecanla anlat",
  "kameraya gül",
  "be energetic",
  "talk excitedly",
  "act natural",
  "show emotion",
] as const;

export type BannedVaguePhrase = (typeof BANNED_VAGUE_PHRASES)[number];

export const META_DIALOGUE_PHRASES = [
  "the creator should",
  "the creator says",
  "the user sees",
  "the audience will see",
  "this content will",
  "this video should",
  "insert product name",
  "insert category",
  "add text here",
  "the model should",
  "the viewer",
] as const;

export const GENERIC_CTA_PHRASES = [
  "what do you think",
  "let me know below",
  "follow for more",
  "save this for later",
  "tag a friend",
  "do you agree",
  "comment below",
  "share this",
] as const;

/** Escape a phrase for use in RegExp. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Return first banned phrase found in text, or null. */
export function findBannedPhrase(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of BANNED_VAGUE_PHRASES) {
    if (lower.includes(phrase)) return phrase;
  }
  return null;
}

/** Strip all banned phrases from text; collapse whitespace. */
export function stripBannedPhrases(text: string): string {
  let out = text;
  for (const phrase of BANNED_VAGUE_PHRASES) {
    out = out.replace(new RegExp(escapeRegExp(phrase), "gi"), " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

export function containsMetaDialogue(text: string): boolean {
  const lower = text.toLowerCase();
  return META_DIALOGUE_PHRASES.some((phrase) => lower.includes(phrase));
}

export function containsGenericCta(text: string): boolean {
  const lower = text.toLowerCase();
  return GENERIC_CTA_PHRASES.some((phrase) => lower.includes(phrase));
}
