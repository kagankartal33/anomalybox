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

  const { data: notification, error: insertError } = await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    channel,
    metadata: input.metadata ?? {},
    dedupe_key: input.dedupeKey ?? null,
  }).select("id,metadata").single();

  if (insertError?.code === "23505" && input.dedupeKey) {
    return { duplicate: true, emailDelivered: false };
  }
  if (insertError || !notification) {
    throw new Error(insertError?.message ?? "Notification could not be recorded");
  }

  const apiKey = env.resendApiKey();
  if ((channel === "email" || channel === "both") && apiKey && input.email) {
    try {
      const resend = new Resend(apiKey);
      const result = await resend.emails.send({
        from: env.emailFrom(),
        to: input.email,
        subject: input.title,
        text: `${input.body}${input.href ? `\n\n${input.href}` : ""}`,
      });

      if (result.error) {
        await supabase.from("notifications").update({
          metadata: {
            ...(input.metadata ?? {}),
            email_delivery: "failed",
            email_error: result.error.name,
          },
        }).eq("id", notification.id);
        return { duplicate: false, emailDelivered: false };
      }

      return { duplicate: false, emailDelivered: true };
    } catch (error) {
      await supabase.from("notifications").update({
        metadata: {
          ...(input.metadata ?? {}),
          email_delivery: "failed",
          email_error: error instanceof Error ? error.name : "unknown",
        },
      }).eq("id", notification.id);
      return { duplicate: false, emailDelivered: false };
    }
  }

  return { duplicate: false, emailDelivered: false };
}
