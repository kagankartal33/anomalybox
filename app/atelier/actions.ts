"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const AtelierLeadInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  instagramHandle: z.string().trim().max(80),
  desiredEffect: z.string().trim().min(2).max(120),
  projectContext: z.string().trim().min(20).max(2000),
  company: z.string().trim().max(0),
});

export async function submitAtelierLead(formData: FormData) {
  const parsed = AtelierLeadInput.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    instagramHandle: String(formData.get("instagram_handle") ?? ""),
    desiredEffect: String(formData.get("desired_effect") ?? ""),
    projectContext: String(formData.get("project_context") ?? ""),
    company: String(formData.get("company") ?? ""),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please complete the request form.";
    redirect(`/atelier?error=${encodeURIComponent(message)}#atelier-request`);
  }

  const supabase = createSupabaseAdminClient();
  const { name, email, instagramHandle, desiredEffect, projectContext } = parsed.data;
  const { error } = await supabase.from("atelier_leads").insert({
    name,
    email,
    instagram_handle: instagramHandle || null,
    desired_effect: desiredEffect,
    project_context: projectContext,
    metadata: { source: "atelier_page", creator_visible: false },
  });

  if (error) {
    redirect(`/atelier?error=${encodeURIComponent("Your request could not be saved. Please try again.")}#atelier-request`);
  }

  redirect("/atelier?sent=1#atelier-request");
}