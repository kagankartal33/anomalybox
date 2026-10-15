import { privatePageMetadata } from "@/lib/private-metadata";
export const metadata = { ...privatePageMetadata, title: "Sign in | Anomaly Box", description: "Sign in to Anomaly Box to open your Creator Vault, purchased briefs, and profile.", alternates: { canonical: "/login" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
