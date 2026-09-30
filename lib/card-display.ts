import { compactText, titleCase } from "@/lib/format";

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
    text.includes("premium karar filtresi") ||
    text.includes(" test") ||
    text.endsWith(" test")
  );
}

function cleanCandidate(value: unknown) {
  const text = compactText(value, "").trim();
  if (!text || isTechnicalCardTitle(text)) return "";
  return text;
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