import { privatePageMetadata } from "@/lib/private-metadata";
export const metadata = { ...privatePageMetadata, title: "Reset password | Anomaly Box", alternates: { canonical: "/forgot-password" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
