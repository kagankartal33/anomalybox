import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViralBox | Premium Viral Idea Boxes for Influencers",
  description: "Buy premium viral content idea boxes with execution-ready hooks, scene scripts, B-roll, captions, brand lift and manual creator video review.",
  keywords: ["viral ideas", "influencer content", "Instagram Reels ideas", "creator strategy", "premium content ideas", "viral content generator"],
  openGraph: {
    title: "ViralBox | Premium Viral Idea Boxes",
    description: "Execution-ready viral content cards for serious influencers.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-white text-ink antialiased">{children}</body>
    </html>
  );
}