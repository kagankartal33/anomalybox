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
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function compactText(value: unknown, fallback = "No dedicated guidance is attached to this card section."): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (Array.isArray(value)) return value.map((item) => compactText(item, "")).filter(Boolean).join(" ");
  if (typeof value === "object") return Object.values(value).map((item) => compactText(item, "")).filter(Boolean).join(" ");
  return String(value);
}