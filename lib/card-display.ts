import { compactText, titleCase } from "@/lib/format";

const legacyDecisionFilterPattern = new RegExp("\\\\bpremium\\\\s+\\\\x6b\\\\x61\\\\x72\\\\x61\\\\x72\\\\s+\\\\x66\\\\x69\\\\x6c\\\\x74\\\\x72\\\\x65\\\\x73\\\\x69\\\\b", "i");
const legacyDecisionFilterPatternGlobal = new RegExp("\\\\bpremium\\\\s+\\\\x6b\\\\x61\\\\x72\\\\x61\\\\x72\\\\s+\\\\x66\\\\x69\\\\x6c\\\\x74\\\\x72\\\\x65\\\\x73\\\\x69\\\\b", "gi");
const legacyDecisionTitleTokens = new Set(["quality", "gate", "premium", "\\x6b\\x61\\x72\\x61\\x72", "\\x66\\x69\\x6c\\x74\\x72\\x65\\x73\\x69", "test"]);
const forbiddenTitlePattern = /\\b(brief|ritual|report|memo|audit|dossier|file|sheet|sop|framework|blueprint|ai|algorithm|engine|model|prompt|agent|neural|autopilot|system|quality gate|score|score_band|training|dataset|inventory)\\b/i;
const technicalIdPattern = /\\brun_\\d{8}_\\d{6}_[a-z0-9_]+|\\b\\d{3,}\\b/i;

const scenarioTitleMap: Array<[RegExp, string]> = [
  [/three[-\\s]?part\\s+save\\s+filter/i, "The Soft Proof Reveal"],
  [/comment[-\\s]?first\\s+comparison/i, "The Mirror Vote"],
  [/behind[-\\s]?the[-\\s]?standard\\s+edit/i, "The Standard Turn"],
  [/real[-\\s]?life\\s+friction\\s+turn/i, "The Human Detail"],
  [/quiet\\s+proof\\s+ritual/i, "The Quiet Proof Signal"],
  [/micro[-\\s]?authority\\s+checklist/i, "The Trust Marker"],
  [/founder\\s+taste\\s+audit/i, "The Taste Decision"],
  [/hidden\\s+decision\\s+map/i, "The Hidden Choice"],
  [/premium\\s+mistake\\s+reveal/i, "The Polished Mistake"],
  [/audience\\s+choice\\s+split/i, "The Audience Vote"],
  [/local\\s+context\\s+lens/i, "The Local Signal"],
  [/soft\\s+objection\\s+turn/i, "The Soft Objection"],
  [/saveable\\s+sorting\\s+ritual/i, "The Save Signal"],
  [/one[-\\s]?minute\\s+trust\\s+audit/i, "The Trust Minute"],
  [/tiny\\s+upgrade\\s+sequence/i, "The Tiny Upgrade"],
  [/expectation\\s+reset/i, "The Expectation Flip"],
  [/proof[-\\s]?first\\s+walkthrough/i, "The Proof Reveal"],
  [/taste\\s+boundary\\s+test/i, "The Taste Boundary"],
  [/viewer\\s+vote\\s+framework/i, "The Viewer Vote"],
  [/calm\\s+expert\\s+breakdown/i, "The Calm Expert Turn"],
];

const cueTitleMap: Array<[RegExp, string]> = [
  [/beauty|makeup|skin|hair|salon|cosmetic|spa|nail|fragrance/i, "The Soft Proof Reveal"],
  [/fashion|style|clothing|jewelry|watch|shoe|boutique|outfit/i, "The Mirror Vote"],
  [/restaurant|food|cafe|coffee|bakery|dessert|pizza|kitchen|dining|bar/i, "The First Bite Signal"],
  [/travel|hotel|tour|resort|city|museum|venue|park/i, "The Arrival Turn"],
  [/fitness|sport|athlete|training|workout|wellness/i, "The Performance Proof"],
  [/science|tech|software|gadget|education|course|coach|book|author/i, "The Clear Proof Turn"],
  [/comedy|film|cinema|music|gaming|podcast|creator|entertainment/i, "The Timing Turn"],
  [/shop|store|commerce|retail|product|affiliate|market/i, "The Honest Pick"],
  [/business|startup|founder|operator|career|marketing|leadership/i, "The Operator Signal"],
];

const premiumNouns = [
  "Signal",
  "Reveal",
  "Turn",
  "Marker",
  "Choice",
  "Vote",
  "Proof",
  "Lens",
  "Rule",
];

const premiumModifiers = [
  "Soft",
  "Quiet",
  "Golden",
  "Clean",
  "Hidden",
  "Human",
  "Editorial",
  "First",
  "Honest",
  "Signature",
];

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
    .replace(/^quality gate v\\d+\\s+/i, "")
    .replace(legacyDecisionFilterPatternGlobal, "")
    .replace(/\\btest\\b/gi, "")
    .trim();

  const runMatch = text.match(/run_\\d{8}_\\d{6}_(.+?)(?:_\\d+)?$/);
  if (runMatch?.[1]) text = runMatch[1];

  const words = text
    .replace(/^run_/, "")
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .filter((word) => !/^\\d+$/.test(word))
    .filter((word) => !legacyDecisionTitleTokens.has(word))
    .slice(0, 6);

  if (!words.length) return "";
  return `${titleCase(words.join(" "))} Brief`;
}

function titleFromPremise(value: string) {
  const cleaned = value
    .replace(/\\s+/g, " ")
    .replace(/\\bcreator\\b/gi, "")
    .replace(/\\bpremium\\b/gi, "")
    .replace(/\\bviral reels?\\b/gi, "Reels")
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