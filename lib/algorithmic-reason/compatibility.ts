import type { PurchaseLane } from "./types";

export const PURCHASE_LANES = [
  "beauty",
  "fashion",
  "commerce_affiliate",
  "creator_education",
  "entertainment_comedy",
  "fitness_wellness_safe",
  "food",
  "lifestyle",
  "luxury",
  "parenting_family",
  "thought_leadership",
  "travel",
] as const;

export const CREATOR_MODES = [
  "talking_head",
  "voiceover",
  "hands_only",
  "pov",
  "screen_recording",
  "object_led",
  "text_led",
  "interview",
] as const;

export const CREATOR_PERSONAS = [
  "editorial_insider",
  "relatable_confidant",
  "high_status_minimalist",
  "faceless_curator",
] as const;

export function parsePurchaseLane(value: unknown): PurchaseLane | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return (PURCHASE_LANES as readonly string[]).includes(normalized)
    ? (normalized as PurchaseLane)
    : undefined;
}
