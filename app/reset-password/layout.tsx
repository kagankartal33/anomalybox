import { privatePageMetadata } from "@/lib/private-metadata";
export const metadata = { ...privatePageMetadata, title: "Choose a new password | Anomaly Box", description: "Choose a new password for your Anomaly Box account.", alternates: { canonical: "/reset-password" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
