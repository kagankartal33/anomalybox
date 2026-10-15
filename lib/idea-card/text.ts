/** Text normalization + comparison helpers (Anomaly Box brief spec §17–18) */

const PLACEHOLDER_EXACT = new Set([
  "lorem ipsum",
  "tbd",
  "todo",
  "n/a",
  "na",
  "insert text",
  "add text here",
  "example line",
  "placeholder",
  "[category]",
  "[product]",
  "[creator]",
]);

export function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const normalized = value
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();

  if (!normalized) return undefined;
  if (PLACEHOLDER_EXACT.has(normalized.toLowerCase())) return undefined;
  if (/^\[.+\]$/.test(normalized)) return undefined;

  return normalized;
}

export function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function canonicalizeForComparison(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenSet(value: string): Set<string> {
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "to", "of", "in", "on", "for", "with",
    "this", "that", "it", "is", "are", "be", "you", "your", "from", "into",
  ]);

  return new Set(
    canonicalizeForComparison(value)
      .split(" ")
      .filter((token) => token.length > 2 && !stopWords.has(token)),
  );
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = new Set([...setA, ...setB]).size;
  return union ? intersection / union : 0;
}

export function stripOuterQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith("“") && trimmed.endsWith("”"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function uniqueStrings(values: Array<string | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const text = normalizeText(value);
    if (!text) continue;
    const key = canonicalizeForComparison(text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}
