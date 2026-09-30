"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function openViralBox(deliveryId: string) {
  const {
    user,
  } = await requireUser();
  const supabase = createSupabaseAdminClient();

  const { data: delivery, error } = await supabase
    .from("idea_box_deliveries")
    .select("id,user_id,metadata")
    .eq("id", deliveryId)
    .eq("user_id", user.id)
    .single();

  if (error || !delivery) {
    throw new Error("ViralBox delivery not found");
  }

  const metadata = (delivery.metadata ?? {}) as Record<string, unknown>;
  if (!metadata.opened_at) {
    const { error: updateError } = await supabase
      .from("idea_box_deliveries")
      .update({
        metadata: {
          ...metadata,
          opened_at: new Date().toISOString(),
          opened_by: user.id,
          open_experience: "creator_confirmed_box_reveal",
        },
      })
      .eq("id", deliveryId)
      .eq("user_id", user.id);

    if (updateError) throw new Error(updateError.message);
  }

  revalidatePath("/boxes");
  revalidatePath("/profile");
}