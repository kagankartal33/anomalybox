"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkInventoryForBox } from "@/lib/inventory";
import { notifyUser } from "@/lib/notifications";
import { siteUrl } from "@/lib/env";

const CreateCreatorInput = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().max(120),
  handle: z.string().trim().max(80),
  niche: z.string().trim().max(160),
});

const GiftBoxInput = z.object({
  userId: z.string().uuid(),
  boxProductSlug: z.enum(["viral_box_500", "premium_viral_box_1000"]),
  categorySlug: z.string().min(1).max(120).regex(/^[a-z0-9_/-]+$/),
  personaSlug: z.string().min(1).max(120).regex(/^[a-z0-9_/-]+$/),
});

const CardReportDecision = z.enum(["reject", "accept_no_replace", "accept_replace"]);

const CardReportDecisionInput = z.object({
  reportId: z.string().uuid(),
  userId: z.string().uuid(),
  decision: CardReportDecision,
  replacementInventoryId: z.string().uuid().optional(),
  adminFeedback: z.string().trim().min(5, "Feedback should explain the decision.").max(5000),
  adminPrivateNote: z.string().trim().max(5000),
});

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid form input";
}

function adminUsersError(message: string): never {
  redirect(`/admin/users?error=${encodeURIComponent(message)}`);
}

function adminCardReportError(reportId: string, message: string): never {
  redirect(`/admin/card-reports/${reportId || "unknown"}?error=${encodeURIComponent(message)}`);
}

function adminAtelierError(message: string): never {
  redirect(`/admin/atelier-leads?error=${encodeURIComponent(message)}`);
}

const AtelierLeadStatus = z.enum(["new", "contacted", "qualified", "closed", "archived"]);
const AtelierLeadStatusInput = z.object({
  leadId: z.string().uuid(),
  status: AtelierLeadStatus,
  adminNote: z.string().trim().max(2000).optional(),
});


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

export async function updateAtelierLeadStatus(formData: FormData) {
  const { user: adminUser } = await requireAdmin();
  const parsed = AtelierLeadStatusInput.safeParse({
    leadId: String(formData.get("lead_id") ?? ""),
    status: String(formData.get("status") ?? ""),
    adminNote: String(formData.get("admin_note") ?? "") || undefined,
  });
  if (!parsed.success) adminAtelierError(firstIssue(parsed.error));

  const { leadId, status, adminNote } = parsed.data;
  const supabase = createSupabaseAdminClient();
  const { data: existing, error: loadError } = await supabase
    .from("atelier_leads")
    .select("id,status,metadata")
    .eq("id", leadId)
    .maybeSingle();
  if (loadError || !existing) adminAtelierError(loadError?.message ?? "Atelier lead could not be found.");

  const previousStatus = String(existing.status ?? "new");
  const previousMetadata = (existing.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
    ? existing.metadata
    : {}) as Record<string, unknown>;
  const previousHistory = Array.isArray(previousMetadata.status_history) ? previousMetadata.status_history : [];
  const now = new Date().toISOString();

  const metadata = {
    ...previousMetadata,
    creator_visible: false,
    last_status_change: {
      from: previousStatus,
      to: status,
      at: now,
      by: adminUser.id,
      note: adminNote || null,
    },
    status_history: [
      ...previousHistory,
      {
        from: previousStatus,
        to: status,
        at: now,
        by: adminUser.id,
        note: adminNote || null,
      },
    ].slice(-20),
  };

  const { error } = await supabase
    .from("atelier_leads")
    .update({
      status,
      metadata,
      updated_at: now,
    })
    .eq("id", leadId);
  if (error) adminAtelierError(error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/atelier-leads");
  redirect(`/admin/atelier-leads?updated=${encodeURIComponent(leadId)}&status=${encodeURIComponent(status)}`);
}
