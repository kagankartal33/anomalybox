import type { Metadata } from "next";
import { SeoPackageHub } from "@/components/SeoPackageHub";
import { premiumAssets } from "@/lib/premium-assets";

export const metadata: Metadata = {
  title: "Creator Content Ideas That Are Ready to Shoot | Anomaly Box",
  description:
    "Explore creator content ideas by platform and niche, with practical guidance for hooks, opening frames, visual proof, filming, and editing.",
  alternates: { canonical: "/content-ideas" },
  openGraph: {
    title: "Creator Content Ideas That Are Ready to Shoot | Anomaly Box",
    description:
      "Explore creator content ideas by platform and niche, with practical guidance for hooks, opening frames, visual proof, filming, and editing.",
    url: "/content-ideas",
    images: [premiumAssets.og.default],
  },
};

export const revalidate = 300;

export default function ContentIdeasPage() {
  return (
    <SeoPackageHub
      page={1}
      section="content-ideas"
      title="Content Ideas Ready to Shoot"
      description="Ideas become useful when a creator can film them. These guides organize audience tension, proof, opening frame, and production boundaries."
    />
  );
}
