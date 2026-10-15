import { compactText, titleCase } from "@/lib/format";

const legacyDecisionFilterPattern = new RegExp("\\bpremium\\s+\\x6b\\x61\\x72\\x61\\x72\\s+\\x66\\x69\\x6c\\x74\\x72\\x65\\x73\\x69\\b", "i");
const legacyDecisionFilterPatternGlobal = new RegExp("\\bpremium\\s+\\x6b\\x61\\x72\\x61\\x72\\s+\\x66\\x69\\x6c\\x74\\x72\\x65\\x73\\x69\\b", "gi");
const legacyDecisionTitleTokens = new Set(["quality", "gate", "premium", "\x6b\x61\x72\x61\x72", "\x66\x69\x6c\x74\x72\x65\x73\x69", "test"]);
const forbiddenTitlePattern = /\b(brief|ritual|report|memo|audit|dossier|file|sheet|sop|framework|blueprint|ai|algorithm|engine|model|prompt|agent|neural|autopilot|system|quality gate|score|score_band|training|dataset|inventory)\b/i;
const technicalIdPattern = /\brun_\d{8}_\d{6}_[a-z0-9_]+|\b\d{3,}\b/i;

const scenarioTitleMap: Array<[RegExp, string]> = [
  [/three[-\s]?part\s+save\s+filter/i, "The Soft Proof Reveal"],
  [/comment[-\s]?first\s+comparison/i, "The Mirror Vote"],
  [/behind[-\s]?the[-\s]?standard\s+edit/i, "The Standard Turn"],
  [/real[-\s]?life\s+friction\s+turn/i, "The Human Detail"],
  [/quiet\s+proof\s+ritual/i, "The Quiet Proof Signal"],
  [/micro[-\s]?authority\s+checklist/i, "The Trust Marker"],
  [/founder\s+taste\s+audit/i, "The Taste Decision"],
  [/hidden\s+decision\s+map/i, "The Hidden Choice"],
  [/premium\s+mistake\s+reveal/i, "The Polished Mistake"],
  [/audience\s+choice\s+split/i, "The Audience Vote"],
  [/local\s+context\s+lens/i, "The Local Signal"],
  [/soft\s+objection\s+turn/i, "The Soft Objection"],
  [/saveable\s+sorting\s+ritual/i, "The Save Signal"],
  [/one[-\s]?minute\s+trust\s+audit/i, "The Trust Minute"],
  [/tiny\s+upgrade\s+sequence/i, "The Tiny Upgrade"],
  [/expectation\s+reset/i, "The Expectation Flip"],
  [/proof[-\s]?first\s+walkthrough/i, "The Proof Reveal"],
  [/taste\s+boundary\s+test/i, "The Taste Boundary"],
  [/viewer\s+vote\s+framework/i, "The Viewer Vote"],
  [/calm\s+expert\s+breakdown/i, "The Calm Expert Turn"],
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
    .replace(/^quality gate v\d+\s+/i, "")
    .replace(legacyDecisionFilterPatternGlobal, "")
    .replace(/\btest\b/gi, "")
    .replace(/\bbrief\b/gi, "")
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
  return titleCase(words.join(" "));
}

function titleFromPremise(value: string) {
  const cleaned = value
    .replace(/\s+/g, " ")
    .replace(/\bcreator\b/gi, "")
    .replace(/\bpremium\b/gi, "")
    .replace(/\bviral reels?\b/gi, "Reels")
    .trim();
  const words = cleaned.split(" ").filter(Boolean).slice(0, 9).join(" ");
  return titleCase(words || "Signature Creator Moment");
}

function objectText(value: unknown) {
  return compactText(value, "").replace(/\s+/g, " ").trim();
}

function titleSeed(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function extractLegacyCategory(value: string) {
  const text = value
    .replace(/\(.+?\)/g, " ")
    .replace(/\b(quiet lens|fresh signal|warm filter|confident map|local atlas|practical sequence|premium threshold)\b.*$/i, "")
    .replace(/[^a-z0-9 &]+/gi, " ")
    .trim();
  if (!text || text.length > 34) return "";
  return titleCase(text);
}

function hasForbiddenTitleLanguage(value: string) {
  return forbiddenTitlePattern.test(value) || technicalIdPattern.test(value) || legacyDecisionFilterPattern.test(value);
}

function isMechanicalConceptTitle(value: string) {
  return scenarioTitleMap.some(([pattern]) => pattern.test(value)) || /\b(filter|checklist|comparison|audit|edit|sequence|map|ritual)\b/i.test(value);
}

function compactPremiumTitle(value: string) {
  return value
    .replace(/\bThe The\b/gi, "The")
    .replace(/\bRitual\b/gi, "Signal")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.:-]+$/g, "");
}

function pickMappedTitle(text: string) {
  for (const [pattern, title] of scenarioTitleMap) {
    if (pattern.test(text)) return title;
  }
  for (const [pattern, title] of cueTitleMap) {
    if (pattern.test(text)) return title;
  }
  return "";
}

function generateEditorialTitle(seedText: string) {
  const seed = titleSeed(seedText || "anomalybox");
  const modifier = premiumModifiers[seed % premiumModifiers.length];
  const noun = premiumNouns[Math.floor(seed / 7) % premiumNouns.length];
  const second = premiumNouns[Math.floor(seed / 17) % premiumNouns.length];
  const title = noun === second ? `The ${modifier} ${noun}` : `The ${modifier} ${noun} ${second}`;
  return compactPremiumTitle(title);
}

export function premiumizeCardTitle(cardValue: unknown, dbTitle?: string | null, contextText = "") {
  const card = (cardValue && typeof cardValue === "object" && !Array.isArray(cardValue) ? cardValue : {}) as Record<string, unknown>;
  const sourceText = [
    contextText,
    objectText(card.title),
    objectText(dbTitle),
    objectText(card.concept),
    objectText(card.one_sentence_premise),
    objectText(card.idea_summary),
    objectText(card.hook_performance_pack),
    objectText(card.video_blueprint),
    objectText(card.brand_lift_statement),
  ].filter(Boolean).join(" ");

  const safeCandidate =
    cleanCandidate(card.title) ||
    cleanCandidate(objectValue(card.idea_summary, "title")) ||
    cleanCandidate(card.concept);

  if (
    safeCandidate &&
    !hasForbiddenTitleLanguage(safeCandidate) &&
    !isMechanicalConceptTitle(safeCandidate) &&
    safeCandidate.length <= 52 &&
    safeCandidate.split(/\s+/).length <= 7
  ) {
    return compactPremiumTitle(titleFromPremise(safeCandidate));
  }

  const mapped = pickMappedTitle(sourceText);
  const legacyCategory = extractLegacyCategory(objectText(card.title) || objectText(dbTitle));
  if (mapped) {
    if (/restaurant|food|cafe|coffee|bakery|dessert|dining|bar/i.test(sourceText)) return "The First Bite Signal";
    if (/travel|hotel|resort|tour|city/i.test(sourceText)) return "The Arrival Turn";
    if (/fashion|style|outfit|jewelry/i.test(sourceText) && /three[-\s]?part|comment[-\s]?first|mirror/i.test(sourceText)) return "The Mirror Vote";
    if (legacyCategory && mapped.length < 34 && !mapped.toLowerCase().includes(legacyCategory.toLowerCase())) {
      const withCue = mapped.replace(/^The\s+/i, `The ${legacyCategory} `);
      if (withCue.length <= 52 && !hasForbiddenTitleLanguage(withCue)) return compactPremiumTitle(withCue);
    }
    return mapped;
  }

  const concept = technicalTitleConcept(objectText(card.title) || objectText(dbTitle));
  if (concept && !hasForbiddenTitleLanguage(concept)) {
    return compactPremiumTitle(generateEditorialTitle(`${concept} ${sourceText}`));
  }

  return generateEditorialTitle(sourceText);
}

export function displayCardTitle(cardValue: unknown, dbTitle?: string | null) {
  return premiumizeCardTitle(cardValue, dbTitle);
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
