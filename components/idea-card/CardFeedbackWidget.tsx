"use client";

import { useState } from "react";
import { Check, Star, Video, Bookmark, Send, CircleSlash } from "lucide-react";

type ShotStatus = "shot" | "planned" | "skipped";

export function CardFeedbackWidget({ cardId }: { cardId: string }) {
  const [shotStatus, setShotStatus] = useState<ShotStatus | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [actualCaptureMinutes, setActualCaptureMinutes] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState(false);

  async function submitFeedback(status: ShotStatus, ratingVal?: number | null, textVal?: string) {
    try {
      setIsSubmitting(true);
      setSubmitError(false);
      const response = await fetch("/api/feedback/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId,
          shotStatus: status,
          rating: ratingVal ?? null,
          feedbackText: textVal ? textVal.trim() : null,
          actualCaptureMinutes: status === "shot" && actualCaptureMinutes
            ? Number(actualCaptureMinutes)
            : null,
        }),
      });
      if (!response.ok) throw new Error("feedback_not_saved");
      return true;
    } catch {
      setSubmitError(true);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatus(status: ShotStatus) {
    setShotStatus(status);
    const saved = await submitFeedback(status, rating, feedbackText);
    if (saved && status !== "shot") setSubmitted(true);
  }

  function handleRating(star: number) {
    setRating(star);
    if (shotStatus === "shot") {
      submitFeedback(shotStatus, star, feedbackText);
    }
  }

  async function handleSaveFull() {
    if (shotStatus !== null) {
      const saved = await submitFeedback(shotStatus, rating, feedbackText);
      if (saved) setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2.5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-2xl p-5 shadow-2xs">
        <Check className="h-5 w-5 text-emerald-600 shrink-0" />
        <div>
          <p className="font-semibold text-emerald-900">Feedback saved to your Creator Vault</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Your notes help calibrate future brief deliveries to your lane and creator style.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6 shadow-soft">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-ink/5 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-plum">
            Production Log
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-ink">
            Did you shoot this brief?
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleStatus("shot")}
            className={`focus-ring inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition shadow-2xs ${
              shotStatus === "shot"
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-ink/15 bg-white text-ink hover:bg-paper"
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>Yes, I filmed it</span>
          </button>
          <button
            type="button"
            onClick={() => handleStatus("planned")}
            className={`focus-ring inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition shadow-2xs ${
              shotStatus === "planned"
                ? "border-ink bg-ink text-white"
                : "border-ink/15 bg-white text-ink/70 hover:bg-paper"
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>Saved for later</span>
          </button>
          <button
            type="button"
            onClick={() => handleStatus("skipped")}
            className={`focus-ring inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition shadow-2xs ${
              shotStatus === "skipped"
                ? "border-ink/70 bg-ink/70 text-white"
                : "border-ink/15 bg-white text-ink/60 hover:bg-paper"
            }`}
          >
            <CircleSlash className="h-3.5 w-3.5" />
            <span>Skipped</span>
          </button>
        </div>
      </div>

      {/* Follow-up fields when "Yes, I filmed it" is selected */}
      {shotStatus === "shot" && (
        <div className="mt-4 space-y-4 pt-1 animate-scene-in">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-semibold text-ink/70">Rate this brief execution:</span>
            <div className="flex items-center gap-1" role="group" aria-label="Rate this brief">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRating(star)}
                  className="p-1 transition-transform hover:scale-115 focus-ring rounded"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    className={`h-5 w-5 transition-colors ${
                      (rating ?? 0) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "fill-none text-amber-300 hover:fill-amber-400 hover:text-amber-400"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[9rem_1fr_auto]">
            <label className="sr-only" htmlFor={`capture-minutes-${cardId}`}>
              Actual filming minutes
            </label>
            <input
              id={`capture-minutes-${cardId}`}
              type="number"
              min="1"
              max="1440"
              inputMode="numeric"
              value={actualCaptureMinutes}
              onChange={(event) => setActualCaptureMinutes(event.target.value)}
              placeholder="Filming min"
              className="rounded-xl border border-ink/15 bg-paper/60 px-3.5 py-2 text-xs text-ink placeholder:text-ink/40 focus-ring"
            />
            <input
              type="text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Drop Reel URL or quick note (e.g. https://instagram.com/reel/...)"
              className="flex-1 rounded-xl border border-ink/15 bg-paper/60 px-3.5 py-2 text-xs text-ink placeholder:text-ink/40 focus-ring"
            />
            <button
              type="button"
              onClick={handleSaveFull}
              disabled={isSubmitting}
              className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-black transition shrink-0 shadow-2xs"
            >
              <Send className="h-3 w-3" />
              <span>Save log</span>
            </button>
          </div>
        </div>
      )}
      {submitError ? (
        <p role="alert" className="mt-3 text-xs font-medium text-red-700">
          We could not save this production log. Please try again.
        </p>
      ) : null}
    </div>
  );
}
