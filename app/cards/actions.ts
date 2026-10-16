"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { FLASH } from "@/lib/flash-messages";

const ReportReason = z.enum([
  "unclear_execution",
  "duplicate_or_too_similar",
  "wrong_lane_or_creator_mode_fit",
  "safety_or_sponsor_concern",
  "too_generic",
  "already_used_or_not_useful",
  "other",
]);

const ReportCardInput = z.object({
  ideaId: z.string().uuid(),
  deliveryId: z.string().uuid(),
  deliveryItemId: z.string().uuid(),
  reason: ReportReason,
  creatorNote: z.string().trim().min(10, FLASH.cardReportNoteRequired).max(2000),
});

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? FLASH.cardReportFailed;
}

function reportError(ideaId: string, message: string): never {
  redirect(`/cards/${encodeURIComponent(ideaId)}?report_error=${encodeURIComponent(message)}`);
}

export async function reportCard(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = ReportCardInput.safeParse({
    ideaId: String(formData.get("idea_id") ?? ""),
    deliveryId: String(formData.get("delivery_id") ?? ""),
    deliveryItemId: String(formData.get("delivery_item_id") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    creatorNote: String(formData.get("creator_note") ?? ""),
  });

  const rawIdeaId = String(formData.get("idea_id") ?? "");
  if (!parsed.success) reportError(rawIdeaId || "unknown", firstIssue(parsed.error));

  const { ideaId, deliveryId, deliveryItemId, reason, creatorNote } = parsed.data;
  const { data: item } = await supabase
    .from("idea_box_items")
    .select("id,delivery_id,idea_id,user_id")
    .eq("id", deliveryItemId)
    .eq("delivery_id", deliveryId)
    .eq("idea_id", ideaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!item) reportError(ideaId, FLASH.cardNotInVault);

  const { data: openReport } = await supabase
    .from("card_reports")
    .select("id,status")
    .eq("delivery_item_id", deliveryItemId)
    .eq("status", "under_review")
    .maybeSingle();

  if (openReport) reportError(ideaId, FLASH.cardReportAlreadyOpen);

  const admin = createSupabaseAdminClient();
  const { data: report, error } = await admin
    .from("card_reports")
    .insert({
      user_id: user.id,
      delivery_id: deliveryId,
      delivery_item_id: deliveryItemId,
      idea_id: ideaId,
      reason,
      creator_note: creatorNote,
      status: "under_review",
    })
    .select("id")
    .single();

  if (error || !report) {
    console.error("Card report insert failed.", { code: error?.code });
    reportError(ideaId, FLASH.cardReportFailed);
  }

  await admin.from("card_report_events").insert({
    report_id: report.id,
    user_id: user.id,
    actor: "creator",
    event_type: "report_submitted",
    metadata: { reason },
  });

  revalidatePath(`/cards/${ideaId}`);
  revalidatePath("/admin");
  redirect(`/cards/${ideaId}?reported=1`);
}
