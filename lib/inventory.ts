import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type StockCheck = {
  ok: boolean;
  missing: string[];
  counts: Record<string, number>;
};

export async function checkInventoryForBox(boxProductSlug: string, categorySlug: string, personaSlug: string): Promise<StockCheck> {
  const supabase = createSupabaseAdminClient();
  const [{ data: product }, { data: category }, { data: persona }] = await Promise.all([
    supabase.from("box_products").select("id,slug,allocation").eq("slug", boxProductSlug).eq("enabled", true).single(),
    supabase.from("categories").select("id,slug").eq("slug", categorySlug).eq("enabled", true).single(),
    supabase.from("creator_personas").select("id,slug").eq("slug", personaSlug).eq("enabled", true).single(),
  ]);

  if (!product || !category || !persona) {
    return { ok: false, missing: ["product/category/persona"], counts: {} };
  }

  const allocation = product.allocation as Record<string, number>;
  const counts: Record<string, number> = {};
  const missing: string[] = [];

  for (const band of ["low", "mid", "high"]) {
    const needed = Number(allocation[band] ?? 0);
    if (!needed) continue;
    const { count } = await supabase
      .from("idea_inventory")
      .select("id", { count: "exact", head: true })
      .eq("category_id", category.id)
      .eq("persona_id", persona.id)
      .eq("score_band", band)
      .eq("status", "available");
    counts[band] = count ?? 0;
    if ((count ?? 0) < needed) missing.push(`${band}: needed ${needed}, available ${count ?? 0}`);
  }

  return { ok: missing.length === 0, missing, counts };
}