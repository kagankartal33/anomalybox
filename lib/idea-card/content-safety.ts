/** Shared creator-content checks. These are conservative backstops, not semantic proof. */
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringFields(value: unknown): string[] {
  if (typeof value === "string") return [value];
  return value && typeof value === "object" ? Object.values(value).flatMap(stringFields) : [];
}

function affirmativeClauses(value: string): string[] {
  return value.replace(/[’‘]/g, "'").split(/(?<=[.!?;])\s+|\n+/)
    .filter(clause => !/^\s*(?:please\s+)?(?:never\b|do not\b|don't\b|avoid\b)/i.test(clause));
}

export function hasEarlySponsorDisclosure(value: unknown): boolean {
  const steps = record(value).steps;
  if (!Array.isArray(steps)) return false;
  return [...steps].sort((a, b) => Number(record(a).order) - Number(record(b).order)).slice(0, 2).some(step => {
    const row = record(step);
    return [row.spokenLine, row.onScreenText].some(field => typeof field === "string" && affirmativeClauses(field)
      .some(clause => /(?:#ad\b|\bpaid partnership\b|\bsponsored by\b)/i.test(clause)));
  });
}

export function needsSponsorDisclosure(value: unknown): boolean {
  return stringFields(value).some(field => /\b(sponsor(?:ed)?|paid partnership|ad|affiliate|gifted|brand deal)\b/i.test(field));
}

export function privacySafetyFlags(value: unknown): string[] {
  const flags = new Set<string>();
  for (const clause of stringFields(value).flatMap(affirmativeClauses)) {
    const capture = /\b(record|film|capture|show|display|reveal|share|publish|post|expose|include)\b/i.test(clause);
    const person = /\b(customer|client|patient|stranger|passenger|bystander|guest|employee|colleague|person|people|someone|their)\b/i.test(clause);
    const privateData = /\b(?:private (?:medical |health |personal )?(?:details|information|messages)|medical records?|health records?|phone numbers?|home addresses?|passport numbers?|credit card (?:numbers?|details)|passwords?|bank details)\b/i.test(clause);
    const noConsent = /\b(?:without (?:\w+\s+){0,3}(?:permission|consent)|secretly|covertly|hidden camera|without (?:them|anyone) knowing)\b/i.test(clause);
    if (capture && noConsent && (person || privateData)) flags.add("hard_privacy_violation");
    else if (capture && person && privateData && !/\b(?:with (?:\w+\s+){0,3}(?:permission|consent)|consenting|fictional|dummy|redacted|blurred)\b/i.test(clause)) flags.add("privacy_consent_review");
  }
  return [...flags];
}