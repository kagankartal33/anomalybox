import Link from "next/link";
import { Compass, ShoppingBag, BookOpen, Wrench } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";

export default function NotFoundPage() {
  return (
    <PublicShell>
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-plum/20 bg-plum-soft text-plum-deep shadow-sm">
          <Compass className="h-8 w-8" />
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-plum-deep">
          404 • Resource Not Found
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          This brief or page is not in the catalog.
        </h1>

        <p className="mt-4 max-w-lg text-base leading-relaxed text-ink/70">
          The link you followed may have moved or been updated. You can browse our active creator briefs and decision tools below.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-black focus-ring shadow-sm"
          >
            <ShoppingBag className="h-4 w-4" />
            Explore Store Catalog
          </Link>

          <Link
            href="/content-ideas"
            className="inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-[#F7F4ED] focus-ring"
          >
            <BookOpen className="h-4 w-4" />
            Browse Content Ideas
          </Link>

          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-[#F7F4ED] focus-ring"
          >
            <Wrench className="h-4 w-4" />
            Creator Tools
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
