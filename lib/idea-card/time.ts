/** Shared time parse/format for idea-card timelines (Anomaly Box brief spec §15) */

export function parseTimeToSeconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value !== "string") return null;

  const raw = value.trim().toLowerCase().replace(/,/g, ".");
  if (!raw) return null;

  // "5s" / "12 sec"
  const secMatch = raw.match(/^(\d+(?:\.\d+)?)\s*(?:s|sec|secs|seconds)?$/);
  if (secMatch && !raw.includes(":")) {
    return Math.max(0, Math.floor(Number(secMatch[1])));
  }

  // "0:05" / "00:05" / "1:05" / "00:01:05"
  if (raw.includes(":")) {
    const parts = raw.split(":").map((part) => Number.parseInt(part, 10));
    if (parts.some((part) => !Number.isFinite(part) || part < 0)) return null;
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }

  const asNum = Number.parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(asNum) ? Math.max(0, asNum) : null;
}

export function parseTimeRange(value: unknown, fallbackDuration = 5): { start: number; end: number } | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const start = parseTimeToSeconds(record.start ?? record.startSecond ?? record.start_second);
    const end = parseTimeToSeconds(record.end ?? record.endSecond ?? record.end_second);
    if (start != null && end != null && end > start) return { start, end };
  }

  const text = String(value ?? "")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, "")
    .trim();

  if (!text) return null;

  const [startText, endText] = text.split(/-|to/i);
  const start = parseTimeToSeconds(startText ?? "0");
  let end = endText ? parseTimeToSeconds(endText) : null;

  if (start == null) return null;
  if (end == null || end <= start) end = start + fallbackDuration;
  return { start, end };
}

export function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/** en dash range — Anomaly Box brief spec */
export function formatTimeRange(startSecond: number, endSecond: number): string {
  return `${formatTime(startSecond)}–${formatTime(endSecond)}`;
}
