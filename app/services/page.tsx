import type { Metadata } from "next";
import { SeoPackageHub } from "@/components/SeoPackageHub";

export const metadata: Metadata = {
  title: "Services & Direction Products | Anomaly Box",
  description: "Compare Anomaly Box shoot briefs, custom creative direction packages, and planning workflows before you film.",
  alternates: { canonical: "/services" },
};

export const revalidate = 300;

export default function ServicesHubPage() {
  return (
    <SeoPackageHub
      page={1}
      section="services"
      title="Services & Direction"
      description="How Anomaly Box briefs and private direction fit a real shoot week."
    />
  );
}
