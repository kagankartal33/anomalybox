→import type { Metadata } from "next";
import { SeoPackageHub } from "@/components/SeoPackageHub";

export const metadata: Metadata = {
  title: "Instagram Reels Guides, Hooks & Shot Plans | Anomaly Box",
  description: "Plan clearer Instagram Reels with practical guidance on hooks, opening frames, scene order, visual proof, editing, and repeatable formats.",
  alternates: { canonical: "/reels" },
};

→export const revalidate = 300;

export default function ReelsHubPage() {
  return (
    <SeoPackageHub
      page={1}
      section="reels"
      title="Instagram Reels Guides"
      description="Build Reels around a clear promise, a strong opening frame, visible proof, and a scene plan that fits the way you actually create."
    />
→  );
}