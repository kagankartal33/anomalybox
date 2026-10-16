"use server";

import { redirect } from "next/navigation";
import { Resend } from "resend";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { verifyRecaptcha } from "@/lib/bot-protection";
import { FLASH } from "@/lib/flash-messages";

const AtelierLeadInput = z.object({
  name: z.string().trim().min(2, FLASH.atelierName).max(120, FLASH.atelierName),
  email: z.string().trim().email(FLASH.atelierEmail).max(180, FLASH.atelierEmail),
  instagramHandle: z.string().trim().max(80, FLASH.atelierInstagram),
  desiredEffect: z.string().trim().min(2, FLASH.atelierEffect).max(120, FLASH.atelierEffect),
  projectContext: z.string().trim().min(20, FLASH.atelierContext).max(2000, FLASH.atelierContext),
  // Honeypot: real visitors never see or fill this field.
  company: z.string().trim().max(0, FLASH.atelierIncomplete),
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
    const message = parsed.error.issues[0]?.message ?? FLASH.atelierIncomplete;
    redirect(`/atelier?error=${encodeURIComponent(message)}#atelier-request`);
  }
  if (!(await verifyRecaptcha(parsed.data.recaptchaToken, "atelier_request"))) {
    redirect(`/atelier?error=${encodeURIComponent(FLASH.captchaFailed)}#atelier-request`);
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
    redirect(`/atelier?error=${encodeURIComponent(FLASH.atelierSaveFailed)}#atelier-request`);
  }

  const apiKey = env.resendApiKey();
  if (!apiKey) {
    await supabase.from("atelier_leads").update({
      metadata: { source: "atelier_page", creator_visible: false, email_delivery: "not_configured" },
    }).eq("id", lead.id);
    redirect(`/atelier?error=${encodeURIComponent(FLASH.atelierEmailUnavailable)}#atelier-request`);
  }

  const resend = new Resend(apiKey);
  const { error: emailError } = await resend.emails.send({
    from: env.emailFrom(),
    to: env.atelierInbox(),
    replyTo: email,
    // Strip line breaks so a crafted name cannot add lines to the subject header.
    subject: `New Atelier request — ${name.replace(/[\r\n]+/g, " ")}`,
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
    redirect(`/atelier?error=${encodeURIComponent(FLASH.atelierEmailFailed)}#atelier-request`);
  }

  redirect("/atelier?sent=1#atelier-request");
}
