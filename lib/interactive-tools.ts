export type FeaturedHubLink = {
  href: string;
  title: string;
  description: string;
};

/** Client-side tools under app/tools/* that are not part of the article registry. */
export const INTERACTIVE_TOOLS: FeaturedHubLink[] = [
  {
    href: "/tools/first-3-seconds-auditor",
    title: "First 3 Seconds Hook Auditor",
    description: "Score a short-form opening for movement, spoken-line timing, and on-screen text before you film.",
  },
  {
    href: "/tools/format-utility-router",
    title: "Reels vs Carousel vs Text Router",
    description: "Pick the format that fits the job of the message, its depth, and your production time.",
  },
  {
    href: "/tools/creator-capacity-calculator",
    title: "Creator Capacity Calculator",
    description: "Work out sustainable weekly shoot hours, editing buffers, and batch-filming capacity.",
  },
];
