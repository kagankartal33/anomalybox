import type { Metadata } from "next";

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
  return children;
}
