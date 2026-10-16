"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, ArrowRight } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Anomaly Box Root Error Boundary caught:", error);
  }, [error]);

  return (
    <PublicShell>
      <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-plum/20 bg-plum-soft text-plum-deep shadow-sm">
          <AlertCircle className="h-7 w-7" />
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-plum-deep">
          Temporary System Interruption
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Something interrupted this brief view.
        </h1>

        <p className="mt-4 max-w-lg text-base leading-relaxed text-ink/70">
          The requested page encountered an unexpected state. Your vault credentials and cart parameters are safe.
        </p>

        {error.digest && (
          <p className="mt-2 font-mono text-xs text-ink/60">
            Incident ID: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-black focus-ring shadow-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>

          <Link
            href="/store"
            className="inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-[#F7F4ED] focus-ring"
          >
            Go to Store
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
