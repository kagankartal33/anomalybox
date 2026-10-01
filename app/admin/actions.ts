"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkInventoryForBox } from "@/lib/inventory";
import { notifyUser } from "@/lib/notifications";
import { creatorReportFromChecks } from "@/lib/admin-review";
import { siteUrl } from "@/lib/env";

const CreateCreatorInput = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().max(120),
  handle: z.string().trim().max(80),
  niche: z.string().trim().max(160),
});

const CardReportDecisionInput = z.object({
  reportId: z.string().uuid(),
  userId: z.string().uuid(),
  decision: CardReportDecision,
  replacementInventoryId: z.string().uuid().optional(),
  adminFeedback: z.string().trim().min(5, "Feedback should explain the decision.").max(5000),
  adminPrivateNote: z.string().trim().max(5000),
});

const GiftBoxInput = z.object({
  userId: z.string().uuid(),
  boxProductSlug: z.enum(["viral_box_500", "premium_viral_box_1000"]),
  categorySlug: z.string().min(1).max(120).regex(/^[a-z0-9_/-]+$/),
  personaSlug: z.string().min(1).max(120).regex(/^[a-z0-9_/-]+$/),
});

const ManualDecision = z.enum(["ready_to_post", "minor_revisions", "needs_reshoot", "brand_safety_blocked"]);
const CheckStatus = z.enum(["pass", "partial", "missing", "not_applicable"]);
const CardReportDecision = z.enum(["reject", "accept_no_replace", "accept_replace"]);

const ManualReviewInput = z.object({
  reviewId: z.string().uuid(),
  attemptId: z.string().uuid(),
  userId: z.string().uuid(),
  ideaId: z.string().uuid(),
  finalDecision: ManualDecision,
  overallFeedback: z.string().trim().max(5000),
  adminPrivateNotes: z.string().trim().max(5000),
});

const ManualReviewCheckInput = z.object({
  attempt_id: z.string().uuid(),
  review_id: z.string().uuid(),
  user_id: z.string().uuid(),
  idea_id: z.string().uuid(),
  section: z.string().min(1).max(120),
  check_key: z.string().min(1).max(180).regex(/^[a-zA-Z0-9_.:-]+$/),
  label: z.string().min(1).max(180),
  source_card_path: z.string().max(2000),
  is_required: z.boolean(),
  status: CheckStatus,
  evidence_summary: z.string().trim().max(2000),
  revision_advice: z.string().trim().max(2000),
  confidence: z.number().min(0).max(100),
  internal_evidence: z.object({
    creator_visible: z.literal(false),
    admin_private_note: z.string().trim().max(2000),
  }),
});

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid form input";
}

function adminUsersError(message: string): never {
  redirect(`/admin/users?error=${encodeURIComponent(message)}`);
}

function adminReviewError(reviewId: string, message: string): never {
  redirect(`/admin/reviews/${reviewId || "unknown"}?error=${encodeURIComponent(message)}`);
}

function adminCardReportError(reportId: string, message: string): never {
  redirect(`/admin/card-reports/${reportId || "unknown"}?error=${encodeURIComponent(message)}`);
}

export async function createCreatorUser(formData: FormData) {
  await requireAdmin();
  const parsed = CreateCreatorInput.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    displayName: String(formData.get("display_name") ?? ""),
    handle: String(formData.get("handle") ?? ""),
    niche: String(formData.get("niche") ?? ""),
  });
  if (!parsed.success) adminUsersError(firstIssue(parsed.error));

  const { email, password, displayName, handle, niche } = parsed.data;
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error || !data.user) redirect(`/admin/users?error=${encodeURIComponent(error?.message ?? "user_create_failed")}`);

  await supabase.from("profiles").upsert({
    id: data.user.id,
    display_name: displayName || email,
    role: "creator",
  }, { onConflict: "id" });
  await supabase.from("creator_profiles").upsert({
    user_id: data.user.id,
    handle,
    niche,
    default_platforms: ["instagram_reels"],
  }, { onConflict: "user_id" });

  redirect(`/admin/users?created=${data.user.id}`);
}

export async function sendGiftBox(formData: FormData) {
  await requireAdmin();
  const parsed = GiftBoxInput.safeParse({
    userId: String(formData.get("user_id") ?? ""),
    boxProductSlug: String(formData.get("box_product_slug") ?? ""),
    categorySlug: String(formData.get("category_slug") ?? ""),
    personaSlug: String(formData.get("persona_slug") ?? ""),
  });
  if (!parsed.success) adminUsersError(firstIssue(parsed.error));

  const { userId, boxProductSlug, categorySlug, personaSlug } = parsed.data;
  const supabase = createSupabaseAdminClient();

  const stock = await checkInventoryForBox(boxProductSlug, categorySlug, personaSlug);
  if (!stock.ok) redirect(`/admin/users?error=${encodeURIComponent(`Inventory unavailable: ${stock.missing.join(", ")}`)}`);

  const [{ data: product }, { data: category }, { data: persona }] = await Promise.all([
    supabase.from("box_products").select("id,price_usd_cents,name").eq("slug", boxProductSlug).single(),
    supabase.from("categories").select("id,name").eq("slug", categorySlug).single(),
    supabase.from("creator_personas").select("id,name").eq("slug", personaSlug).single(),
  ]);
  if (!product || !category || !persona) redirect(`/admin/users?error=${encodeURIComponent("Product, category, or persona could not be found.")}`);

  const { data: purchase, error: purchaseError } = await supabase.from("purchases").insert({
    user_id: userId,
    box_product_id: product.id,
    provider: "admin_gift",
    amount_usd_cents: product.price_usd_cents,
    currency: "usd",
    status: "paid",
    category_id: category.id,
    persona_id: persona.id,
    fulfillment_source: "admin_gift",
    completed_at: new Date().toISOString(),
    metadata: { box_product_slug: boxProductSlug, category_slug: categorySlug, persona_slug: personaSlug, gift: true },
    raw_event: { source: "admin_dashboard" },
  }).select("id").single();
  if (purchaseError || !purchase) redirect(`/admin/users?error=${encodeURIComponent(purchaseError?.message ?? "purchase_failed")}`);

  const { data: deliveryId, error: deliveryError } = await supabase.rpc("deliver_idea_box", {
    p_user_id: userId,
    p_box_product_slug: boxProductSlug,
    p_category_slug: categorySlug,
    p_persona_slug: personaSlug,
    p_purchase_id: purchase.id,
  });
  if (deliveryError) redirect(`/admin/users?error=${encodeURIComponent(deliveryError.message)}`);

  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  await notifyUser({
    userId,
    email: authUser.user?.email,
    type: "gift_box_delivered",
    title: "A private creator dossier is waiting",
    body: `${product.name} was added to your Creator Vault by the Anomaly Box team.`,
    href: `${siteUrl()}/boxes`,
    metadata: { delivery_id: deliveryId, purchase_id: purchase.id, gift: true },
  });

  redirect(`/admin/users?gift=sent`);
}

export async function saveManualReview(formData: FormData) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const parsed = ManualReviewInput.safeParse({
    reviewId: String(formData.get("review_id") ?? ""),
    attemptId: String(formData.get("attempt_id") ?? ""),
    userId: String(formData.get("user_id") ?? ""),
    ideaId: String(formData.get("idea_id") ?? ""),
    finalDecision: String(formData.get("final_decision") ?? "minor_revisions"),
    overallFeedback: String(formData.get("overall_feedback") ?? ""),
    adminPrivateNotes: String(formData.get("admin_private_notes") ?? ""),
  });
  const rawReviewId = String(formData.get("review_id") ?? "");
  if (!parsed.success) adminReviewError(rawReviewId, firstIssue(parsed.error));

  const { reviewId, attemptId, userId, ideaId, finalDecision, overallFeedback, adminPrivateNotes } = parsed.data;
  const keys = formData.getAll("check_key").map(String);

  if (!keys.length) adminReviewError(reviewId, "Manual review checklist is empty.");

  const rows = keys.map((key) => {
    const row = ManualReviewCheckInput.safeParse({
      attempt_id: attemptId,
      review_id: reviewId,
      user_id: userId,
      idea_id: ideaId,
      section: String(formData.get(`section_${key}`) ?? ""),
      check_key: key,
      label: String(formData.get(`label_${key}`) ?? key),
      source_card_path: String(formData.get(`source_${key}`) ?? key),
      is_required: String(formData.get(`required_${key}`) ?? "true") === "true",
      status: String(formData.get(`status_${key}`) ?? "missing"),
      evidence_summary: String(formData.get(`evidence_${key}`) ?? ""),
      revision_advice: String(formData.get(`advice_${key}`) ?? ""),
      confidence: 0,
      internal_evidence: { creator_visible: false, admin_private_note: String(formData.get(`private_${key}`) ?? "") },
    });
    if (!row.success) adminReviewError(reviewId, firstIssue(row.error));
    return row.data;
  });

  if (finalDecision === "ready_to_post") {
    const failed = rows.filter((row) => row.is_required && !["pass", "not_applicable"].includes(row.status));
    if (failed.length) redirect(`/admin/reviews/${reviewId}?error=${encodeURIComponent("Ready to post requires every critical item to be pass or not applicable.")}`);
  }

  await supabase.from("creator_video_review_checks").upsert(rows, { onConflict: "attempt_id,check_key" });
  const status = finalDecision === "ready_to_post" ? "ready_to_post" : finalDecision === "brand_safety_blocked" ? "blocked" : "revision_requested";
  const report = creatorReportFromChecks(finalDecision, overallFeedback, rows);
  const now = new Date().toISOString();

  await supabase.from("creator_video_review_attempts").update({
    status,
    final_decision: finalDecision,
    creator_feedback: overallFeedback,
    admin_private_notes: adminPrivateNotes,
    reviewed_at: now,
  }).eq("id", attemptId);

  await supabase.from("creator_video_reviews").update({
    status,
    final_decision: finalDecision,
    creator_report: report,
    admin_private_notes: adminPrivateNotes,
    reviewed_at: now,
    completed_at: status === "ready_to_post" || status === "blocked" ? now : null,
  }).eq("id", reviewId);

  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  await notifyUser({
    userId,
    email: authUser.user?.email,
    type: "review_feedback_ready",
    title: status === "ready_to_post" ? "Your video is ready to post" : "Video review feedback is ready",
    body: overallFeedback || "Open your review result to see the checklist and feedback.",
    href: `${siteUrl()}/reviews/${reviewId}`,
    metadata: { review_id: reviewId, attempt_id: attemptId, final_decision: finalDecision },
  });

  redirect(`/admin/reviews/${reviewId}?saved=1`);
}

export async function saveCardReportDecision(formData: FormData) {
  const { user: adminUser } = await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const parsed = CardReportDecisionInput.safeParse({
    reportId: String(formData.get("report_id") ?? ""),
    userId: String(formData.get("user_id") ?? ""),
    decision: String(formData.get("decision") ?? ""),
    replacementInventoryId: String(formData.get("replacement_inventory_id") ?? "") || undefined,
    adminFeedback: String(formData.get("admin_feedback") ?? ""),
    adminPrivateNote: String(formData.get("admin_private_note") ?? ""),
  });
  const rawReportId = String(formData.get("report_id") ?? "");
  if (!parsed.success) adminCardReportError(rawReportId, firstIssue(parsed.error));

  const { reportId, userId, decision, replacementInventoryId, adminFeedback, adminPrivateNote } = parsed.data;
  const { data: report } = await supabase
    .from("card_reports")
    .select("id,user_id,idea_id,status")
    .eq("id", reportId)
    .single();

  if (!report) adminCardReportError(reportId, "Card report could not be found.");
  if (report.user_id !== userId) adminCardReportError(reportId, "Report owner mismatch.");
  if (report.status !== "under_review") adminCardReportError(reportId, "This report is no longer under review.");

  let hrefIdeaId = report.idea_id as string;
  let notificationType = "card_report_resolved";
  let title = "Your card report was reviewed";

  if (decision === "accept_replace") {
    if (!replacementInventoryId) adminCardReportError(reportId, "Choose a replacement card before accepting with replacement.");
    const { data: replacementIdeaId, error } = await supabase.rpc("replace_reported_card", {
      p_report_id: reportId,
      p_replacement_inventory_id: replacementInventoryId,
      p_admin_user_id: adminUser.id,
      p_admin_feedback: adminFeedback,
      p_admin_private_note: adminPrivateNote || null,
    });
    if (error || !replacementIdeaId) adminCardReportError(reportId, error?.message ?? "Replacement failed.");
    hrefIdeaId = String(replacementIdeaId);
    notificationType = "card_report_replaced";
    title = "Your card was replaced";
  } else {
    const status = decision === "reject" ? "rejected" : "accepted";
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("card_reports")
      .update({
        status,
        admin_decision: decision,
        admin_feedback: adminFeedback,
        admin_private_note: adminPrivateNote || null,
        reviewed_by: adminUser.id,
        reviewed_at: now,
        closed_at: now,
      })
      .eq("id", reportId)
      .eq("status", "under_review");
    if (error) adminCardReportError(reportId, error.message);

    await supabase.from("card_report_events").insert({
      report_id: reportId,
      user_id: userId,
      actor: "admin",
      event_type: status === "accepted" ? "report_accepted" : "report_rejected",
      metadata: { decision },
    });
    notificationType = status === "accepted" ? "card_report_accepted" : "card_report_rejected";
    title = status === "accepted" ? "Your card report was accepted" : "Your card report was reviewed";
  }

  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  await notifyUser({
    userId,
    email: authUser.user?.email,
    type: notificationType,
    title,
    body: adminFeedback,
    href: `${siteUrl()}/cards/${hrefIdeaId}`,
    metadata: { report_id: reportId, decision },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/card-reports/${reportId}`);
  revalidatePath(`/cards/${hrefIdeaId}`);
  redirect(`/admin/card-reports/${reportId}?saved=1`);
}