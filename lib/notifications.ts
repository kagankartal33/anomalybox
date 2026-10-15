import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

type NotifyInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  href?: string;
  email?: string | null;
  channel?: "in_app" | "email" | "both";
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
};

export async function notifyUser(input: NotifyInput) {
  const channel = input.channel ?? "both";
  const supabase = createSupabaseAdminClient();

  const { error: insertError } = await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    channel,
    metadata: input.metadata ?? {},
    dedupe_key: input.dedupeKey ?? null,
  });

  if (insertError) {
    if (insertError.code === "23505" || insertError.message?.includes("duplicate key")) {
      return;
    }
    console.error("Failed to insert notification:", insertError);
  }

  const apiKey = env.resendApiKey();
  if ((channel === "email" || channel === "both") && apiKey && input.email) {
    const resend = new Resend(apiKey);
    const link = input.href ? (input.href.startsWith("http") ? input.href : `${env.siteUrl()}${input.href}`) : null;
    await resend.emails.send({
      from: env.emailFrom(),
      to: input.email,
      subject: input.title,
      text: `${input.body}${link ? `\n\n${link}` : ""}`,
    });
  }
}