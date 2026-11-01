import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { siteUrl } from "@/lib/env";
import { breadcrumbJsonLd } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "Reels vs Carousels vs Text: Format Router | Anomaly Box",
  description: "Determine the optimal content format for your message based on viewer information job, depth, and production constraints.",
  alternates: { canonical: "/tools/format-utility-router" },
  openGraph: {
    title: "Reels vs Carousels vs Text: Format Router | Anomaly Box",
    description: "Determine the optimal content format for your message based on viewer information job, depth, and production constraints.",
    url: "/tools/format-utility-router",
  },
};

export default function FormatUtilityRouterLayout({ children }: { children: React.ReactNode }) {
  const base = siteUrl();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Reels vs Carousels vs Text: Format Router",
          url: `${base}/tools/format-utility-router`,
          description: "Determine the optimal content format for your message based on viewer information job, depth, and production constraints.",
          applicationCategory: "MultimediaApplication",
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
          { name: "Reels vs Carousels vs Text: Format Router", path: "/tools/format-utility-router" },
        ])}
      />
      {children}
    </>
  );
}
