import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const allowedMimeTypes = ["video/mp4", "video/quicktime", "video/x-m4v", "video/webm"];
const maxVideoBytes = 524288000;

const ReviewInput = z.object({
  review_id: z.string().uuid().optional().nullable(),
  delivery_item_id: z.string().uuid().optional().nullable(),
  original_filename: z.string().min(1),
  mime_type: z.string().min(1),
  file_size_bytes: z.number().positive(),
  caption: z.string().optional().nullable(),
  transcript: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const { user } = await requireUser();

  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = ReviewInput.safeParse(jsonBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  if (!allowedMimeTypes.includes(input.mime_type) || input.file_size_bytes > maxVideoBytes) {
    return NextResponse.json({ error: "unsupported_or_too_large_video" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const attemptId = crypto.randomUUID();
  const reviewId = input.review_id ?? crypto.randomUUID();
  let ideaId = "";
  let attemptNumber = 1;
  const safeName = input.original_filename.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "review-video.mp4";
  const storagePath = `${user.id}/${reviewId}/${attemptId}/${safeName}`;

  if (input.review_id) {
    const { data: review } = await supabase.from("creator_video_reviews").select("*").eq("id", input.review_id).eq("user_id", user.id).single();
    if (!review) return NextResponse.json({ error: "review_not_found" }, { status: 404 });
    ideaId = review.idea_id;
    const { data: lastAttempt } = await supabase.from("creator_video_review_attempts").select("attempt_number").eq("review_id", input.review_id).order("attempt_number", { ascending: false }).limit(1).maybeSingle();
    attemptNumber = (lastAttempt?.attempt_number ?? 0) + 1;
  } else {
    if (!input.delivery_item_id) return NextResponse.json({ error: "delivery_item_id_required" }, { status: 400 });
    const { data: item } = await supabase.from("idea_box_items").select("id,idea_id").eq("id", input.delivery_item_id).eq("user_id", user.id).single();
    if (!item) return NextResponse.json({ error: "delivery_item_not_found" }, { status: 404 });
    ideaId = item.idea_id;
    const { error: reviewError } = await supabase.from("creator_video_reviews").insert({
      id: reviewId,
      user_id: user.id,
      delivery_item_id: input.delivery_item_id,
      idea_id: ideaId,
      storage_bucket: "creator-review-videos",
      storage_path: storagePath,
      original_filename: safeName,
      mime_type: input.mime_type,
      file_size_bytes: input.file_size_bytes,
      caption: input.caption,
      transcript: input.transcript,
      status: "pending_upload",
      review_method: "manual_admin",
      software_checks: { ai_enabled: false, training_use: "never" },
      ai_analysis_internal: { provider: "none", status: "disabled" },
    });
    if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 400 });
  }

  const { data: attempt, error: attemptError } = await supabase.from("creator_video_review_attempts").insert({
    id: attemptId,
    review_id: reviewId,
    user_id: user.id,
    idea_id: ideaId,
    attempt_number: attemptNumber,
    storage_bucket: "creator-review-videos",
    storage_path: storagePath,
    original_filename: safeName,
    mime_type: input.mime_type,
    file_size_bytes: input.file_size_bytes,
    caption: input.caption,
    transcript: input.transcript,
    status: "pending_upload",
  }).select("*").single();

  if (attemptError || !attempt) {
    if (!input.review_id) {
      await supabase.from("creator_video_reviews").delete().eq("id", reviewId);
    }
    return NextResponse.json({ error: attemptError?.message ?? "attempt_failed" }, { status: 400 });
  }

  const { data: review } = await supabase.from("creator_video_reviews").update({
    current_attempt_id: attempt.id,
    storage_bucket: "creator-review-videos",
    storage_path: storagePath,
    original_filename: safeName,
    mime_type: input.mime_type,
    file_size_bytes: input.file_size_bytes,
    caption: input.caption,
    transcript: input.transcript,
    status: "pending_upload",
  }).eq("id", reviewId).select("*").single();

  const { data: signedUpload } = await supabase.storage
    .from("creator-review-videos")
    .createSignedUploadUrl(storagePath);

  return NextResponse.json({
    review,
    attempt,
    upload: {
      bucket: "creator-review-videos",
      path: storagePath,
      token: signedUpload?.token,
      signed_url: signedUpload?.signedUrl,
      max_file_size_bytes: maxVideoBytes,
      allowed_mime_types: allowedMimeTypes,
    },
  }, { status: 201 });
}