"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkInventoryForBox } from "@/lib/inventory";
import { notifyUser } from "@/lib/notifications";
import { creatorReportFromChecks } from "@/lib/admin-review";
import { siteUrl } from "@/lib/env";

export async function createCreatorUser(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "");
  const handle = String(formData.get("handle") ?? "");
  const niche = String(formData.get("niche") ?? "");
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
  const userId = String(formData.get("user_id") ?? "");
  const boxProductSlug = String(formData.get("box_product_slug") ?? "");
  const categorySlug = String(formData.get("category_slug") ?? "");
  const personaSlug = String(formData.get("persona_slug") ?? "");
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
    title: "A gift ViralBox is waiting",
    body: `${product.name} was added to your Creator Vault by the ViralBox team.`,
    href: `${siteUrl()}/boxes`,
    metadata: { delivery_id: deliveryId, purchase_id: purchase.id, gift: true },
  });

  redirect(`/admin/users?gift=sent`);
}

export async function saveManualReview(formData: FormData) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const reviewId = String(formData.get("review_id") ?? "");
  const attemptId = String(formData.get("attempt_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const ideaId = String(formData.get("idea_id") ?? "");
  const finalDecision = String(formData.get("final_decision") ?? "minor_revisions");
  const overallFeedback = String(formData.get("overall_feedback") ?? "");
  const adminPrivateNotes = String(formData.get("admin_private_notes") ?? "");
  const keys = formData.getAll("check_key").map(String);

  const rows = keys.map((key) => ({
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
  }));

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