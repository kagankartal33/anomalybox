"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F4ED] px-4 py-16 text-center text-ink">
      <div className="mx-auto max-w-md rounded-2xl border border-ink/10 bg-white p-8 shadow-soft">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-coral/10 text-coral">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
          Bir Hata Oluştu
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink/65">
          İşlem gerçekleştirilirken beklenmedik bir durum meydana geldi. Lütfen tekrar deneyin.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={() => reset()}
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Yeniden Dene
          </button>
          <Link
            href="/"
            className="focus-ring inline-flex w-full items-center justify-center rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
