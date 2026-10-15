import { parsePurchaseLane, PURCHASE_LANES } from "./algorithmic-reason/compatibility";

export function resolveTrainingScopeSlug(slug: string): string {
  const direct = parsePurchaseLane(slug);
  if (direct) return direct;
  const normalized = slug.toLowerCase().replace(/[_-]+/g, " ");
  for (const lane of PURCHASE_LANES) {
    const laneWords = lane.replace(/_/g, " ");
    if (normalized.includes(laneWords)) return lane;
  }
  if (/beauty|skincare|makeup|cosmetics/.test(normalized)) return "beauty";
  if (/fashion|clothing|outfit|style/.test(normalized)) return "fashion";
  if (/food|dining|restaurant|recipe|cooking/.test(normalized)) return "food";
  if (/travel|trip|tour|hotel|vacation/.test(normalized)) return "travel";
  if (/fitness|workout|gym|wellness/.test(normalized)) return "fitness_wellness_safe";
  if (/comedy|funny|humor|sketch/.test(normalized)) return "entertainment_comedy";
  if (/luxury|yacht|jewelry/.test(normalized)) return "luxury";
  if (/parent|family|kids/.test(normalized)) return "parenting_family";
  if (/business|leadership|career|strategy/.test(normalized)) return "thought_leadership";
  if (/creator|content|youtube|reels|camera/.test(normalized)) return "creator_education";
  if (/commerce|shop|affiliate|product/.test(normalized)) return "commerce_affiliate";
  return "lifestyle";
}
