/**
 * Social and identity profiles that verifiably belong to Anomaly Box (checked 16 Oct 2026: each one
 * names the brand and describes the product, or links back to anomalybox.com).
 *
 * Used for the footer and for Organization.sameAs. Only add a profile after confirming it belongs
 * to the brand: x.com/anomalybox is an unrelated 2017 stop-motion account, and
 * pinterest.com/anomalybox, linkedin.com/company/anomalybox and github.com/anomalybox do not exist.
 * tiktok.com/@anomalybox ("The Anomaly"), youtube.com/@AnomalyBox ("Anomaly Boxy") and
 * substack.com/@anomalybox are empty and unconfirmed.
 */
export const BRAND_PROFILES = {
  instagram: "https://www.instagram.com/anomalybox/",
  medium: "https://medium.com/@anomalybox",
  gravatar: "https://gravatar.com/delectably2582260304",
  github: "https://github.com/kagankartal33/anomalybox",
} as const;

export const BRAND_SAME_AS: string[] = Object.values(BRAND_PROFILES);
