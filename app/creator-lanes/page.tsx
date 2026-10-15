import type { Metadata } from "next";
import { SeoPackageHub } from "@/components/SeoPackageHub";

export const metadata: Metadata = {
  title: "Creator Lanes | Anomaly Box",
  description: "Find creator strategy guides for beauty, fitness, travel, UGC, founders, and other niches, with practical proof and production guidance.",
  alternates: { canonical: "/creator-lanes" },
};

export const revalidate = 300;

export default function CreatorLanesHubPage() {
  return (
    <SeoPackageHub
      page={1}
      section="creator-lanes"
      title="Creator Lanes"
      description="Lane-specific strategy notes so beauty, fitness, travel, UGC, and founder content stay recognizable."
    />
  );
}
