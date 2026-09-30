"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ReviewUploadForm({
  ideaId,
  deliveryItemId,
  reviewId,
}: {
  ideaId?: string;
  deliveryItemId?: string;
  reviewId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const file = form.get("video") as File | null;
    if (!file) {
      setError("Choose a video file before submitting.");
      setLoading(false);
      return;
    }

    const createRes = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        review_id: reviewId,
        delivery_item_id: deliveryItemId,
        idea_id: ideaId,
        original_filename: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        caption: form.get("caption"),
        transcript: form.get("transcript"),
        video_metadata: {},
      }),
    });
    const created = await createRes.json();
    if (!createRes.ok) {
      setError(created.error ?? "Review could not be started.");
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const upload = await supabase.storage.from(created.upload.bucket).upload(created.upload.path, file, {
      contentType: file.type,
      upsert: true,
    });
    if (upload.error) {
      setError(upload.error.message);
      setLoading(false);
      return;
    }

    const submitRes = await fetch("/api/reviews/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        review_id: created.review.id,
        attempt_id: created.attempt.id,
        caption: form.get("caption"),
        transcript: form.get("transcript"),
      }),
    });
    const submitted = await submitRes.json();
    if (!submitRes.ok) {
      setError(submitted.error ?? "Review could not be submitted.");
      setLoading(false);
      return;
    }

    router.push(`/reviews/${created.review.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-md border border-ink/10 bg-white p-5 shadow-soft">
      <label className="grid gap-2 text-sm font-semibold">
        Video file
        <input className="focus-ring rounded-md border border-ink/15 px-3 py-3 font-normal" name="video" type="file" accept="video/mp4,video/quicktime,video/x-m4v,video/webm" required />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Caption draft
        <textarea className="focus-ring min-h-24 rounded-md border border-ink/15 px-3 py-3 font-normal" name="caption" placeholder="Paste the caption you plan to use..." />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Transcript or spoken lines
        <textarea className="focus-ring min-h-24 rounded-md border border-ink/15 px-3 py-3 font-normal" name="transcript" placeholder="Paste the lines spoken in the video..." />
      </label>
      {error ? <p className="rounded-md bg-coral/10 p-3 text-sm text-coral">{error}</p> : null}
      <button className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 font-semibold text-white disabled:bg-ink/40" disabled={loading} type="submit">
        <Upload className="h-4 w-4" />
        {loading ? "Uploading for review..." : "Submit for manual review"}
      </button>
    </form>
  );
}