import type { Metadata } from "next";
import { SeoPackageHub } from "@/components/SeoPackageHub";
import { premiumAssets } from "@/lib/premium-assets";

const TITLE = "Creator Content Guides, Briefs & Production Tools | Anomaly Box";
const DESCRIPTION =
  "Find practical creator guides for content planning, Reels, UGC briefs, filming, visual direction, sustainable workflows, and performance review.";

export const revalidate = 300;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "Creator Resources Hub",
    "Creator Content Guides",
    "UGC Creator Briefs Hub",
    "Search Visibility for Creators",
    "Instagram Reels Planning",
  ],
  alternates: { canonical: "/resources" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/resources",
    images: [premiumAssets.og.default],
  },
};

export default function ResourcesPage() {
  return (
    <SeoPackageHub
      paginate
      page={1}
      title="Creator Content Guides & Production Tools"
      description="Plan stronger content with practical guidance on audience fit, hooks, visual proof, shot lists, scripts, editing, and sustainable production."
    />
  );
}
