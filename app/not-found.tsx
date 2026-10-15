import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-ink/10 bg-white shadow-soft">
          <Compass className="h-8 w-8 text-plum" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Sayfa Bulunamadı
        </h1>
        <p className="mt-3 text-base leading-7 text-ink/65">
          Aradığınız kart, dosya veya sayfa taşınmış ya da mevcut olmayabilir.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/store"
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-paper"
          >
            Fikir Kutularını Keşfet
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
