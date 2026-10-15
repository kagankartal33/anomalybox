import { compactText, titleCase } from "@/lib/format";

const legacyDecisionFilterPattern = /\bpremium\s+karar\s+filtresi\b/i;
const legacyDecisionFilterPatternGlobal = /\bpremium\s+karar\s+filtresi\b/gi;
const legacyDecisionTitleTokens = new Set(["quality", "gate", "premium", "karar", "filtresi", "test"]);
const forbiddenTitlePattern = /\b(brief|ritual|report|memo|audit|dossier|file|sheet|sop|framework|blueprint|ai|algorithm|engine|model|prompt|agent|neural|autopilot|system|quality gate|score|score_band|training|dataset|inventory)\b/i;
const technicalIdPattern = /\brun_\d{8}_\d{6}_[a-z0-9_]+|\b\d{3,}\b/i;

function objectValue(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return (value as Record<string, unknown>)[key];
}

export function isTechnicalCardTitle(value: string | null | undefined) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return true;
  return (
    text.startsWith("quality gate") ||
    text.startsWith("run_") ||
    text.includes(" run_") ||
    legacyDecisionFilterPattern.test(text) ||
    forbiddenTitlePattern.test(text) ||
    technicalIdPattern.test(text) ||
    text.includes(" test") ||
    text.endsWith(" test")
  );
}

function cleanCandidate(value: unknown) {
  const text = compactText(value, "").trim();
  if (!text || isTechnicalCardTitle(text)) return "";
  return text;
}

function technicalTitleConcept(value: string | null | undefined) {
  let text = String(value ?? "").toLowerCase();
  if (!text) return "";
  text = text
    .replace(/^quality gate v\d+\s+/i, "")
    .replace(legacyDecisionFilterPatternGlobal, "")
    .replace(/\btest\b/gi, "")
    .trim();

  const runMatch = text.match(/run_\d{8}_\d{6}_(.+?)(?:_\d+)?$/);
  if (runMatch?.[1]) text = runMatch[1];

  const words = text
    .replace(/^run_/, "")
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .filter((word) => !/^\d+$/.test(word))
    .filter((word) => !legacyDecisionTitleTokens.has(word))
    .slice(0, 6);

  if (!words.length) return "";
  return `${titleCase(words.join(" "))} Brief`;
}

function titleFromPremise(value: string) {
  const cleaned = value
    .replace(/\s+/g, " ")
    .replace(/\bcreator\b/gi, "")
    .replace(/\bpremium\b/gi, "")
    .replace(/\bviral reels?\b/gi, "Reels")
    .trim();
  const words = cleaned.split(" ").filter(Boolean).slice(0, 9).join(" ");
  return titleCase(words || "Premium Creator Brief");
}

export function displayCardTitle(cardValue: unknown, dbTitle?: string | null) {
  const card = (cardValue && typeof cardValue === "object" && !Array.isArray(cardValue) ? cardValue : {}) as Record<string, unknown>;
  const summary = objectValue(card.idea_summary, "title") || objectValue(card.idea_summary, "premise");
  const title =
    cleanCandidate(card.title) ||
    cleanCandidate(summary) ||
    cleanCandidate(card.concept) ||
    cleanCandidate(objectValue(card.hook_performance_pack, "first_line_hook")) ||
    cleanCandidate(card.one_sentence_premise) ||
    cleanCandidate(card.premise) ||
    technicalTitleConcept(compactText(card.title, "")) ||
    technicalTitleConcept(dbTitle) ||
    (!isTechnicalCardTitle(dbTitle) ? String(dbTitle).trim() : "");

  if (!title) return "Premium Creator Brief";
  return title.length > 92 ? `${title.slice(0, 89).trim()}...` : titleFromPremise(title);
}

export function displayCardPremise(cardValue: unknown) {
  const card = (cardValue && typeof cardValue === "object" && !Array.isArray(cardValue) ? cardValue : {}) as Record<string, unknown>;
  return (
    cleanCandidate(objectValue(card.idea_summary, "creator_takeaway")) ||
    cleanCandidate(card.brand_lift_statement) ||
    cleanCandidate(card.one_sentence_premise) ||
    cleanCandidate(card.premise)
  );
}