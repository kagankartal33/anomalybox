/**
 * Social and identity profiles that belong to Anomaly Box. Instagram, Medium, Gravatar and GitHub
 * were verified on 16 Oct 2026 (each names the brand or links back to anomalybox.com); YouTube,
 * TikTok and Substack were confirmed by the owner the same day.
 *
 * Used for the footer and for Organization.sameAs. Only add a profile after confirming it belongs
 * to the brand: x.com/anomalybox is an unrelated 2017 stop-motion account, and
 * pinterest.com/anomalybox, linkedin.com/company/anomalybox and github.com/anomalybox do not exist.
 */
export const BRAND_PROFILES = {
  instagram: "https://www.instagram.com/anomalybox/",
  tiktok: "https://www.tiktok.com/@anomalybox",
  youtube: "https://www.youtube.com/@AnomalyBox",
  medium: "https://medium.com/@anomalybox",
  substack: "https://substack.com/@anomalybox",
  gravatar: "https://gravatar.com/delectably2582260304",
  github: "https://github.com/kagankartal33/anomalybox",
} as const;

export const BRAND_SAME_AS: string[] = Object.values(BRAND_PROFILES);
