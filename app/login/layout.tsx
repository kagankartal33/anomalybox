import { privatePageMetadata } from "@/lib/private-metadata";
export const metadata = { ...privatePageMetadata, title: "Sign in | Anomaly Box", alternates: { canonical: "/login" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }