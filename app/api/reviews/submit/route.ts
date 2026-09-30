import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { notifyUser } from "@/lib/notifications";

const SubmitInput = z.object({
  review_id: z.string().uuid(),
  attempt_id: z.string().uuid(),
  caption: z.string().optional().nullable(),
  transcript: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const { user } = await requireUser();
  const input = SubmitInput.parse(await request.json());
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: attempt } = await supabase
    .from("creator_video_review_attempts")
    .select("*")
    .eq("id", input.attempt_id)
    .eq("review_id", input.review_id)
    .eq("user_id", user.id)
    .single();
  if (!attempt) return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });

  await supabase.from("creator_video_review_attempts").update({
    status: "under_review",
    submitted_at: now,
    caption: input.caption,
    transcript: input.transcript,
  }).eq("id", input.attempt_id);

  const { data: review } = await supabase.from("creator_video_reviews").update({
    status: "under_review",
    submitted_at: now,
    current_attempt_id: input.attempt_id,
    caption: input.caption,
    transcript: input.transcript,
  }).eq("id", input.review_id).select("*").single();

  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin").limit(20);
  await Promise.all((admins ?? []).map((admin) => notifyUser({
    userId: admin.id,
    type: "video_under_review",
    title: "New creator video awaiting review",
    body: "A creator submitted a draft video for manual checklist review.",
    href: `/admin/reviews/${input.review_id}`,
    channel: "in_app",
    metadata: { review_id: input.review_id, attempt_id: input.attempt_id },
  })));

  return NextResponse.json({ review });
}