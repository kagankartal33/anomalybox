import type { Metadata } from "next";

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
  return children;
}
