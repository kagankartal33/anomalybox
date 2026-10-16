import { money } from "@/lib/format";

/**
 * Public prices of the self-serve boxes. Checkout charges exactly these amounts (see
 * app/api/checkout/route.ts), so every page, structured-data block and checkout must read from here.
 * Search engines reject merchant listings whose markup price differs from the price at checkout.
 */
export const BOX_PRICING = {
  viral_box_500: { name: "Classic Red", priceCents: 900, briefCount: 2 },
  premium_viral_box_1000: { name: "Signature Purple", priceCents: 1900, briefCount: 5 },
} as const;

export type PricedBoxSlug = keyof typeof BOX_PRICING;

export function isPricedBoxSlug(slug: string): slug is PricedBoxSlug {
  return Object.prototype.hasOwnProperty.call(BOX_PRICING, slug);
}

/** Price in cents for a self-serve box, or undefined for products without a fixed public price. */
export function boxPriceCents(slug: string): number | undefined {
  return isPricedBoxSlug(slug) ? BOX_PRICING[slug].priceCents : undefined;
}

/** Display price, e.g. "$9". */
export function boxPriceLabel(slug: PricedBoxSlug): string {
  return money(BOX_PRICING[slug].priceCents);
}

/** Price as a decimal number of US dollars for schema.org Offer.price, e.g. 9. */
export function boxPriceAmount(slug: PricedBoxSlug): number {
  return BOX_PRICING[slug].priceCents / 100;
}

/** What every shoot brief contains, regardless of tier. Shown on /pricing and the dossier pages. */
export const BRIEF_INCLUDES = [
  "Hook and opening options",
  "Scene-by-scene flow",
  "Shot, framing, and camera direction",
  "Spoken lines and on-screen text system",
  "Caption and comment-response prompts",
  "Edit rhythm and atmosphere direction",
  "Sponsor-safe wording and claim boundaries",
] as const;

/** Tier-specific highlights. */
export const BOX_FEATURES: Record<PricedBoxSlug, readonly string[]> = {
  viral_box_500: ["Two private shoot briefs", "Opening, scenes, and camera notes", "Caption and comment prompts", "What you should not claim on camera"],
  premium_viral_box_1000: ["Five private shoot briefs", "Longer scene and proof notes", "Atmosphere and edit direction", "More angles inside the same lane"],
};
