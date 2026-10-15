import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Format Utility Router: Reels vs Carousels vs Text | Anomaly Box",
  description: "Determine the optimal content format for your message based on viewer information job, depth, and production constraints.",
  alternates: { canonical: "/tools/format-utility-router" },
  openGraph: {
    title: "Format Utility Router: Reels vs Carousels vs Text | Anomaly Box",
    description: "Determine the optimal content format for your message based on viewer information job, depth, and production constraints.",
    url: "/tools/format-utility-router",
  },
};

export default function FormatUtilityRouterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
