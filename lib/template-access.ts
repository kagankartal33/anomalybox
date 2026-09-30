import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TemplateAccessState = "anonymous" | "member" | "customer";

export const getTemplateAccessState = cache(async (): Promise<TemplateAccessState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "anonymous";

  const { data: purchase, error } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  // Fail closed if the entitlement query is unavailable.
  if (error || !purchase) return "member";
  return "customer";
});

export function hasTemplatePurchaseAccess(state: TemplateAccessState): boolean {
  return state === "customer";
}
