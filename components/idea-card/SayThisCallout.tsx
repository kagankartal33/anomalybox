"use client";

/**
 * SayThisCallout
 * Premium dialogue callout for ShootPlan step cards.
 * Renders the "Say This" spoken line with large decorative quotes,
 * a microphone badge, a calm plum-tinted background, and a 1-click copy action.
 */

import { useState } from "react";
import { Mic, Copy, Check } from "lucide-react";

export function SayThisCallout({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  return (
    <div className="relative rounded-xl border border-plum/15 bg-plum-soft/35 px-5 py-4 sm:px-6 sm:py-5">
      {/* Decorative opening quote */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-3 select-none font-serif text-4xl leading-none text-plum/15 sm:left-4"
      >
        &ldquo;
      </span>

      {/* Header with Label and Quick Copy Button */}
      <div className="relative mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Mic className="h-3.5 w-3.5 text-plum" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-plum">
            Say this
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="focus-ring inline-flex items-center gap-1 rounded-md border border-plum/20 bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-plum-deep hover:bg-white transition"
          title="Copy spoken line to clipboard"
          aria-label="Copy spoken line"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
              <span className="text-emerald-700">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 text-plum" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* The dialogue line — large, high-contrast typography for set visibility */}
      <p className="relative pl-2 text-lg font-semibold leading-7 text-ink sm:text-xl sm:leading-8">
        {text}
      </p>

      {/* Decorative closing quote */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-3 select-none font-serif text-4xl leading-none text-plum/15 sm:right-4"
      >
        &rdquo;
      </span>
    </div>
  );
}
