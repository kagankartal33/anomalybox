import type { Metadata } from "next";
import { ConsentAnalytics } from "@/components/ConsentAnalytics";
import "./globals.css";

import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Anomaly Box | Private Creative Direction & Viral Idea Dossiers",
    template: "%s | Anomaly Box",
  },
  description:
    "Buy premium viral content idea boxes and creative dossiers with execution-ready hooks, scene scripts, B-roll, captions, brand lift, and manual creator video review.",
  keywords: [
    "viral ideas",
    "influencer content",
    "Instagram Reels ideas",
    "creator strategy",
    "premium content ideas",
    "creative direction",
    "viral content generator",
    "Anomaly Box",
    "ViralBox",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Anomaly Box | Private Creative Direction & Viral Idea Dossiers",
    description: "Execution-ready viral content cards and creative dossiers for serious influencers.",
    url: siteUrl(),
    siteName: "Anomaly Box",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anomaly Box | Private Creative Direction & Viral Idea Dossiers",
    description: "Execution-ready viral content cards and creative dossiers for serious influencers.",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || process.env.YANDEX_VERIFICATION,
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || process.env.BING_SITE_VERIFICATION || "",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-white text-ink antialiased">
        {children}
        <ConsentAnalytics />
      </body>
    </html>
  );
}