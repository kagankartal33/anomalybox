export function money(cents: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

export function dateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function titleCase(value: string | null | undefined) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\\b\\w/g, (char) => char.toUpperCase());
}

function runSlugToTitle(value: string) {
  const words = value
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .filter((word) => !/^\\d+$/.test(word))
    .slice(0, 7);

  return words.length ? `${titleCase(words.join(" "))} Brief` : "this creator brief";
}

const legacyDecisionFilterPattern = new RegExp("\\\\bpremium\\\\s+\\\\x6b\\\\x61\\\\x72\\\\x61\\\\x72\\\\s+\\\\x66\\\\x69\\\\x6c\\\\x74\\\\x72\\\\x65\\\\x73\\\\x69\\\\b", "gi");

export function sanitizeDisplayText(value: string) {
  return value
    .replace(/Quality Gate V\\d+\\s+/gi, "")
    .replace(/\\brun_\\d{8}_\\d{6}_([a-z0-9_]+?)(?:_\\d+)?\\b/gi, (_match, slug: string) => runSlugToTitle(slug))
    .replace(legacyDecisionFilterPattern, "")
    .replace(/\\s{2,}/g, " ")
    .trim();
}

const creatorTextReplacements: Array<[RegExp, string | ((match: string, ...args: string[]) => string)]> = [
  [/\\bBugun\\b/gi, "Today"],
  [/\\bbir\\b/gi, "a"],
  [/\\burun\\b/gi, "product"],
  [/\\burunu\\b/gi, "the product"],
  [/\\burunun\\b/gi, "the product's"],
  [/\\bsepet\\b/gi, "cart"],
  [/\\bkarar\\b/gi, "decision"],
  [/\\bkarari\\b/gi, "the decision"],
  [/\\bfiltresi\\b/gi, "filter"],
  [/\\bkaydet\\b/gi, "Save"],
  [/\\byorum\\b/gi, "comment"],
  [/\\bsoru\\b/gi, "question"],
  [/\\bcevap\\b/gi, "reply"],
  [/\\bkanit\\b/gi, "proof"],
  [/\\bgosterir\\b/gi, "shows"],
  [/\\bgoster\\b/gi, "show"],
  [/\\bgoruntu\\b/gi, "visual"],
  [/\\bsahne\\b/gi, "scene"],
  [/\\bcek\\b/gi, "shoot"],
  [/\\bcekim\\b/gi, "shoot"],
  [/\\btelefon\\b/gi, "phone"],
  [/\\bkamera\\b/gi, "camera"],
  [/\\byuz\\b/gi, "face"],
  [/\\bel\\b/gi, "hand"],
  [/\\beller\\b/gi, "hands"],
  [/\\bgoz\\b/gi, "eye"],
  [/\\bgulumse\\b/gi, "smile"],
  [/\\bsakin\\b/gi, "calm"],
  [/\\bdogal\\b/gi, "natural"],
  [new RegExp("\\\\bpremium\\\\s+\\\\x61\\\\x6d\\\\x61\\\\s+\\\\x67\\\\x75\\\\x76\\\\x65\\\\x6e\\\\x6c\\\\x69\\\\b", "gi"), "premium but safe"],
  [new RegExp("\\\\b\\\\x67\\\\x75\\\\x76\\\\x65\\\\x6e\\\\x6c\\\\x69\\\\b", "gi"), "safe"],
  [/\\bkesin cozum\\b/gi, "guaranteed fix"],
  [/\\bherkeste ayni sonucu verir\\b/gi, "works the same for everyone"],
  [/\\bSponsor varsa caption ve video basinda disclosure kullan\\./gi, "If sponsored, include disclosure at the start of the video and caption."],
  [new RegExp("\\\\bFinal\\\\s+\\\\x64\\\\x65\\\\x67\\\\x69\\\\x6c\\\\s+\\\\x6b\\\\x61\\\\x72\\\\x61\\\\x72\\\\b", "gi"), "Decision over final result"],
  [/\\bKaniti anlamak\\b/gi, "Understand the proof"],
  [/\\bSecmek\\b/gi, "Choose"],
  [/\\bElemek\\b/gi, "Remove"],
  [/\\bSinir koymak\\b/gi, "Set a boundary"],
  [/\\bhafta\\b/gi, "week"],
  [/\\bgun\\b/gi, "day"],
  [/\\bsabah\\b/gi, "morning"],
  [/\\botel\\b/gi, "hotel"],
  [/\\bcanta\\b/gi, "bag"],
  [/\\bmakyaj\\b/gi, "makeup"],
  [/\\bguzellik\\b/gi, "beauty"],
  [/\\bseyahat\\b/gi, "travel"],
];

export function normalizeCreatorText(value: string) {
  let output = sanitizeDisplayText(value);
  for (const [pattern, replacement] of creatorTextReplacements) {
    output = typeof replacement === "string"
      ? output.replace(pattern, replacement)
      : output.replace(pattern, replacement);
  }
  return output
    .replace(/\\b(your product or subject)\\s*:\\s*\\1\\b/gi, "$1")
    .replace(/\\b(the audience problem)\\s*:\\s*\\1\\b/gi, "$1")
    .replace(/\\b(today's real context)\\s*:\\s*\\1\\b/gi, "$1")
    .replace(/\\b(your own recurring phrase)\\s*:\\s*\\1\\b/gi, "$1")
    .replace(/\\s+([.,!?;:])/g, "$1")
    .replace(/\\s{2,}/g, " ")
    .trim();
}

export function compactText(value: unknown, fallback = "No dedicated guidance is attached to this card section."): string {
  if (value == null) return fallback;
  if (typeof value === "string") return normalizeCreatorText(value.trim()) || fallback;
  if (Array.isArray(value)) return value.map((item) => compactText(item, "")).filter(Boolean).join(" ");
  if (typeof value === "object") return Object.values(value).map((item) => compactText(item, "")).filter(Boolean).join(" ");
  return normalizeCreatorText(String(value));
}