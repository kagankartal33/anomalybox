"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Anomaly Box Global Root Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F4ED] text-[#171619] antialiased flex items-center justify-center p-6 font-sans">
        <main className="max-w-md w-full rounded-2xl border border-black/10 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#523B5C]/10 text-[#523B5C] font-bold text-xl">
            !
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#523B5C]">
            Application Error
          </p>

          <h1 className="mt-2 text-2xl font-bold text-[#171619]">
            Unable to load layout
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-black/70">
            A critical root component failed to render. Please reload the application.
          </p>

          {error.digest && (
            <p className="mt-2 font-mono text-[11px] text-black/40">
              Error Digest: {error.digest}
            </p>
          )}

          <div className="mt-6">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full rounded-xl bg-[#171619] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              Reload application
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
