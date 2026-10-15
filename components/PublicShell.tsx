import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F4ED] text-ink flex flex-col justify-between">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 w-full flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
