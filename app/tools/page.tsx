import type { Metadata } from "next";
import { SeoPackageHub } from "@/components/SeoPackageHub";
import { INTERACTIVE_TOOLS } from "@/lib/interactive-tools";

export const metadata: Metadata = {
  title: "Creator Tools & Checklists | Anomaly Box",
  description: "Use creator checklists and decision tools to test concepts, clarify briefs, reduce revision loops, and protect production time.",
  alternates: { canonical: "/tools" },
};

export const revalidate = 300;

export default function ToolsHubPage() {
  return (
    <SeoPackageHub
      featured={INTERACTIVE_TOOLS}
      page={1}
      section="tools"
      title="Creator Tools & Checklists"
      description="Lightweight tools that help you decide, filter concepts, and protect production energy."
    />
  );
}
