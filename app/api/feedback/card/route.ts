import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const Input = z.object({
  cardId: z.string().uuid(),
  shotStatus: z.enum(["shot", "planned", "skipped"]),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  feedbackText: z.string().max(1000).nullable().optional(),
  actualCaptureMinutes: z.number().int().min(1).max(1440).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "authentication_required" }, { status: 401 });
    }
    const body = await request.json();
    const parsed = Input.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input", details: parsed.error.format() }, { status: 400 });
    }

    const { cardId, shotStatus, rating, actualCaptureMinutes } = parsed.data;
    const feedbackText = parsed.data.feedbackText?.trim() || null;

    const { data: deliveredCard, error: ownershipError } = await supabase
      .from("idea_box_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("idea_id", cardId)
      .maybeSingle();

    if (ownershipError) {
      return NextResponse.json({ error: "database_error" }, { status: 500 });
    }
    if (!deliveredCard) {
      return NextResponse.json({ error: "card_not_delivered_to_user" }, { status: 403 });
    }

    const { error } = await supabase.from("idea_card_feedback").upsert({
      card_id: cardId,
      idea_id: cardId,
      user_id: user.id,
      shot_status: shotStatus,
      was_shot: shotStatus === "shot",
      rating: shotStatus === "shot" ? rating ?? null : null,
      feedback_text: feedbackText,
      actual_capture_minutes: shotStatus === "shot" ? actualCaptureMinutes ?? null : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,idea_id" });

    if (error) {
      console.error("Failed to save card feedback", { code: error.code });
      return NextResponse.json({ error: "database_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Feedback route error", { name: err instanceof Error ? err.name : "unknown" });
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
