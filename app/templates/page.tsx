import type { Metadata } from "next";
import { SeoPackageHub } from "@/components/SeoPackageHub";
import { pageFromSearch } from "@/lib/hub-pagination";

export const metadata: Metadata = {
  title: "Customer Resource Library | Anomaly Box",
  description: "Private production resources for customers with a completed Anomaly Box purchase.",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export const dynamic = "force-dynamic";

export default async function TemplatesHubPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return (
    <SeoPackageHub
      page={pageFromSearch(await searchParams)}
      section="templates"
      title="Customer Production Resources"
      description="Copyable briefs, scripts, and shot lists for customers with an active purchase history."
    />
  );
}
