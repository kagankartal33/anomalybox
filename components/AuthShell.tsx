import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { premiumAssets } from "@/lib/premium-assets";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F7F4ED] px-4 py-6 sm:px-6 lg:grid lg:place-items-center lg:py-10">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-56 overflow-hidden bg-ink sm:min-h-72 lg:min-h-[680px]">
          <Image
            src={premiumAssets.marketing.heroMobile}
            alt="A calm, private creator production workspace prepared for an Anomaly Box brief"
            fill
            sizes="(max-width: 1023px) 100vw, 55vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Private creator workspace</p>
            <p className="mt-3 max-w-md text-xl font-semibold leading-snug sm:text-2xl">
              Secure access to production-ready creative direction.
            </p>
          </div>
        </div>

        <div className="flex items-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="w-full">
            <nav aria-label="Brand navigation">
              <Link href="/" className="focus-ring inline-flex rounded-sm">
                <Image src={premiumAssets.brand.logo} alt="Anomaly Box" width={240} height={56} className="h-12 sm:h-14 w-auto" />
              </Link>
            </nav>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-plum">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-md leading-7 text-ink/65">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
