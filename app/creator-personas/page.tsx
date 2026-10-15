import type { Metadata } from "next";
import { SeoPackageHub } from "@/components/SeoPackageHub";

export const metadata: Metadata = {
  title: "Creator Personas | Anomaly Box",
  description: "Choose a creator workflow that fits your available time, energy, privacy preferences, filming confidence, and need for visible proof.",
  alternates: { canonical: "/creator-personas" },
};

export const revalidate = 300;

export default function CreatorPersonasHubPage() {
  return (
    <SeoPackageHub
      page={1}
      section="creator-personas"
      title="Creator Personas"
      description="Direction that respects capacity, privacy, and proof style — not one-size-fits-all content advice."
    />
  );
}
