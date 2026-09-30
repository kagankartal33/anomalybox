import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViralBox",
  description: "Premium viral idea boxes for creators.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}