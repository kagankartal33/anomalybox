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
