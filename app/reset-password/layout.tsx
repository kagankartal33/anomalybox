import { privatePageMetadata } from "@/lib/private-metadata";
export const metadata = { ...privatePageMetadata, title: "Choose a new password | Anomaly Box", alternates: { canonical: "/reset-password" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
