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
};

export async function notifyUser(input: NotifyInput) {
  const channel = input.channel ?? "both";
  const supabase = createSupabaseAdminClient();

  await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    channel,
    metadata: input.metadata ?? {},
  });

  const apiKey = env.resendApiKey();
  if ((channel === "email" || channel === "both") && apiKey && input.email) {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: env.emailFrom(),
      to: input.email,
      subject: input.title,
      text: `${input.body}${input.href ? `\
    });
  }
}