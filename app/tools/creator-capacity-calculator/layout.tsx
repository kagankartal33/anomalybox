import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { siteUrl } from "@/lib/env";
import { breadcrumbJsonLd } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "Creator Capacity & Batch Filming Calculator | Anomaly Box",
  description: "Calculate sustainable weekly production hours, editing buffers, and batch shoot capacity without creator burnout.",
  alternates: { canonical: "/tools/creator-capacity-calculator" },
  openGraph: {
    title: "Creator Capacity & Batch Filming Calculator | Anomaly Box",
    description: "Calculate sustainable weekly production hours, editing buffers, and batch shoot capacity without creator burnout.",
    url: "/tools/creator-capacity-calculator",
  },
};

export default function CreatorCapacityCalculatorLayout({ children }: { children: React.ReactNode }) {
  const base = siteUrl();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Creator Capacity & Batch Filming Calculator",
          url: `${base}/tools/creator-capacity-calculator`,
          description: "Calculate sustainable weekly production hours, editing buffers, and batch shoot capacity without creator burnout.",
          applicationCategory: "BusinessApplication",
          operatingSystem: "All",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd(base, [
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: "Creator Capacity & Batch Filming Calculator", path: "/tools/creator-capacity-calculator" },
        ])}
      />
      {children}
    </>
  );
}
