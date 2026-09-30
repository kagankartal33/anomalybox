import Image from "next/image";
import Link from "next/link";
import { premiumAssets } from "@/lib/premium-assets";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F4ED] text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-[#FBF9F5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="focus-ring rounded-sm">
            <Image src={premiumAssets.brand.logo} alt="Anomaly Box" width={155} height={36} className="h-9 w-auto" priority />
          </Link>
          <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-1 text-sm">
            <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/content-ideas">Content Ideas</Link>
            <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/resources">Resources</Link>
            <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/store">Store</Link>
            <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/pricing">Pricing</Link>
            <Link className="rounded-md px-3 py-2 hover:bg-plum-soft/70 focus-ring" href="/atelier">Atelier</Link>
            <Link className="rounded-md bg-ink px-4 py-2 font-semibold text-white hover:bg-black focus-ring" href="/login">Login</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-ink/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 text-sm md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="font-semibold">Anomaly Box</div>
            <p className="mt-2 max-w-md leading-6 text-ink/55">Private, execution-ready creative direction for creators who want a clear path from concept to publish.</p>
          </div>
          <div className="grid content-start gap-2">
            <Link href="/about">About</Link>
            <Link href="/methodology">Methodology</Link>
            <Link href="/resources">Creator resources</Link>
          </div>
          <div className="grid content-start gap-2">
            <Link href="/legal">Legal &amp; privacy</Link>
            <a href="mailto:support@anomalybox.com">support@anomalybox.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}