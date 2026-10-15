"use server";

import { redirect } from "next/navigation";
import { Resend } from "resend";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { verifyRecaptcha } from "@/lib/bot-protection";

const AtelierLeadInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  instagramHandle: z.string().trim().max(80),
  desiredEffect: z.string().trim().min(2).max(120),
  projectContext: z.string().trim().min(20).max(2000),
  company: z.string().trim().max(0),
  recaptchaToken: z.string().max(4096).optional(),
});

export async function submitAtelierLead(formData: FormData) {
  const parsed = AtelierLeadInput.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    instagramHandle: String(formData.get("instagram_handle") ?? ""),
    desiredEffect: String(formData.get("desired_effect") ?? ""),
    projectContext: String(formData.get("project_context") ?? ""),
    company: String(formData.get("company") ?? ""),
    recaptchaToken: String(formData.get("recaptcha_token") ?? "") || undefined,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please complete the request form.";
    redirect(`/atelier?error=${encodeURIComponent(message)}#atelier-request`);
  }

  if (!(await verifyRecaptcha(parsed.data.recaptchaToken, "atelier_request"))) {
    redirect(`/atelier?error=${encodeURIComponent("Security verification failed. Please try again.")}#atelier-request`);
  }

  const supabase = createSupabaseAdminClient();
  const { name, email, instagramHandle, desiredEffect, projectContext } = parsed.data;
  const { data: lead, error } = await supabase.from("atelier_leads").insert({
    name,
    email,
    instagram_handle: instagramHandle || null,
    desired_effect: desiredEffect,
    project_context: projectContext,
    metadata: { source: "atelier_page", creator_visible: false, email_delivery: "pending" },
  }).select("id").single();

  if (error) {
    redirect(`/atelier?error=${encodeURIComponent("Your request could not be saved. Please try again.")}#atelier-request`);
  }

  const apiKey = env.resendApiKey();
  if (!apiKey) {
    await supabase.from("atelier_leads").update({
      metadata: { source: "atelier_page", creator_visible: false, email_delivery: "not_configured" },
    }).eq("id", lead.id);
    redirect(`/atelier?error=${encodeURIComponent("Your request was saved, but email delivery is temporarily unavailable. Please contact support@anomalybox.com.")}#atelier-request`);
  }

  const resend = new Resend(apiKey);
  const { error: emailError } = await resend.emails.send({
    from: env.emailFrom(),
    to: env.atelierInbox(),
    replyTo: email,
    subject: `New Atelier request — ${name}`,
    text: [
      "New Anomaly Box Atelier request",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Instagram: ${instagramHandle || "Not provided"}`,
      `Desired effect: ${desiredEffect}`,
      "",
      "Project context:",
      projectContext,
    ].join("\n"),
  });

  await supabase.from("atelier_leads").update({
    metadata: {
      source: "atelier_page",
      creator_visible: false,
      email_delivery: emailError ? "failed" : "sent",
      email_recipient: env.atelierInbox(),
    },
  }).eq("id", lead.id);

  if (emailError) {
    redirect(`/atelier?error=${encodeURIComponent("Your request was saved, but the notification email could not be delivered. Please contact support@anomalybox.com.")}#atelier-request`);
  }

  redirect("/atelier?sent=1#atelier-request");
}