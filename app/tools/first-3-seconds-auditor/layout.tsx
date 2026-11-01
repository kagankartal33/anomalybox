import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { siteUrl } from "@/lib/env";
import { breadcrumbJsonLd } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "First 3 Seconds Video Hook Auditor | Anomaly Box",
  description: "Audit your short-form video opening for retention friction, spoken line timing, visual movement, and on-screen text contrast.",
  alternates: { canonical: "/tools/first-3-seconds-auditor" },
  openGraph: {
    title: "First 3 Seconds Video Hook Auditor | Anomaly Box",
    description: "Audit your short-form video opening for retention friction, spoken line timing, visual movement, and on-screen text contrast.",
    url: "/tools/first-3-seconds-auditor",
  },
};

export default function First3SecondsAuditorLayout({ children }: { children: React.ReactNode }) {
  const base = siteUrl();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "First 3 Seconds Video Hook Auditor",
          url: `${base}/tools/first-3-seconds-auditor`,
          description: "Audit your short-form video opening for retention friction, spoken line timing, visual movement, and on-screen text contrast.",
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
          { name: "First 3 Seconds Video Hook Auditor", path: "/tools/first-3-seconds-auditor" },
        ])}
      />
      {children}
    </>
  );
}
