import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/env";
import { premiumAssets } from "@/lib/premium-assets";
import { JsonLd } from "@/components/JsonLd";
import { ConsentAnalytics } from "@/components/ConsentAnalytics";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo-metadata";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const verification: NonNullable<Metadata["verification"]> = {};
if (process.env.GOOGLE_SITE_VERIFICATION) verification.google = process.env.GOOGLE_SITE_VERIFICATION;
const otherVerification: Record<string, string> = {};
if (process.env.BING_SITE_VERIFICATION) otherVerification["msvalidate.01"] = process.env.BING_SITE_VERIFICATION;
if (process.env.YANDEX_SITE_VERIFICATION) otherVerification["yandex-verification"] = process.env.YANDEX_SITE_VERIFICATION;
if (Object.keys(otherVerification).length) verification.other = otherVerification;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Anomaly Box | Private Creative Direction & Briefs for Instagram Creators",
  description: "Private Instagram shoot briefs with openings, scene order, camera notes, scripts, and claim limits for one lane.",
  keywords: [
    "Instagram Creative Direction",
    "Private Creator Briefs",
    "Instagram Shoot Briefs",
    "Instagram Content System",
    "Reels Scripting Frameworks",
    "Visual Signatures for Instagram",
    "Repeatable Creator System"
  ],
  alternates: {
    canonical: "/",
  },
  applicationName: "Anomaly Box",
  authors: [{ name: "Anomaly Box Studio", url: "/" }],
  creator: "Anomaly Box",
  publisher: "Anomaly Box",
  category: "Creative Direction & Creator Tools",
  ...(Object.keys(verification).length ? { verification } : {}),
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32.png?v=6", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png?v=6", sizes: "48x48", type: "image/png" },
      { url: "/favicon.ico?v=6", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=6", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico?v=6"],
  },
  openGraph: {
    title: "Anomaly Box | Premium Creator Briefs",
    description: "Private Instagram shoot briefs matched to one lane and one creator mode. Delivered to Creator Vault.",
    type: "website",
    url: "/",
    siteName: "Anomaly Box",
    locale: "en_US",
    images: [
      {
        url: premiumAssets.og.default,
        width: 1200,
        height: 630,
        alt: "An Anomaly Box shoot brief in a creator studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anomaly Box | Premium Creator Briefs",
    description: "Private Instagram shoot briefs matched to one lane and one creator mode. Delivered to Creator Vault.",
    images: [premiumAssets.og.default],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const base = siteUrl();
  const organization = organizationJsonLd(base);
  const website = websiteJsonLd(base);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://psqqqhcfmfojrqsvzzzb.supabase.co";
  let supabaseOrigin = "https://psqqqhcfmfojrqsvzzzb.supabase.co";
  try {
    supabaseOrigin = new URL(supabaseUrl).origin;
  } catch {
    // fallback to default
  }

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={supabaseOrigin} />
        <link rel="preconnect" href="https://api.stripe.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-white text-ink antialiased">
        <JsonLd data={[organization, website]} />
        {children}
        <ConsentAnalytics />
      </body>
    </html>
  );
}
