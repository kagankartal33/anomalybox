import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type StockCheck = {
  ok: boolean;
  missing: string[];
  counts: Record<string, number>;
};

const SELLABLE_BANDS = ["high"] as const;

/**
 * Availability is exact purchase-lane × creator-mode stock.
 * Only unused high-band cards (score >= 80, renderable, matching persona)
 * count. Checkout stays closed when that cell cannot fill the box.
 */
export async function checkInventoryForBox(
  boxProductSlug: string,
  categorySlug: string,
  personaSlug: string,
): Promise<StockCheck> {
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
  const { data: countRows, error: countError } = await supabase.rpc("available_inventory_counts", {
    p_category_slug: categorySlug,
    p_persona_slug: personaSlug,
  });

  if (countError) {
    console.error("Inventory availability count failed.", { code: countError.code });
    return { ok: false, missing: ["inventory availability"], counts: {} };
  }

  const availableByBand = new Map(
    ((countRows ?? []) as Array<{ score_band: string; available_count: number | string }>).map((row) => [
      row.score_band,
      Number(row.available_count),
    ]),
  );

  for (const band of SELLABLE_BANDS) {
    const needed = Number(allocation[band] ?? 0);
    if (!needed) continue;
    const available = availableByBand.get(band) ?? 0;
    counts[band] = available;
    if (available < needed) {
      missing.push(`${categorySlug}/${personaSlug} ${band}: needed ${needed}, available ${available}`);
    }
  }

  return { ok: missing.length === 0, missing, counts };
}

export type CreatorModeStock = {
  personaSlug: string;
  highCount: number;
};

export type LaneModeStockCell = {
  categorySlug: string;
  personaSlug: string;
  highCount: number;
};

export async function listPurchaseLaneModeCounts(): Promise<LaneModeStockCell[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("purchase_lane_mode_counts");
  if (error) {
    if (error.code) {
      console.error("Purchase lane mode matrix failed.", { code: error.code });
    }
    return [];
  }
  return ((data ?? []) as Array<{ category_slug: string; persona_slug: string; high_count: number | string }>).map((row) => ({
    categorySlug: row.category_slug,
    personaSlug: row.persona_slug,
    highCount: Number(row.high_count || 0),
  }));
}

export async function listCreatorModeStock(categorySlug: string): Promise<CreatorModeStock[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("available_creator_modes_for_lane", {
    p_category_slug: categorySlug,
  });
  if (error) {
    console.error("Creator mode stock lookup failed.", { code: error.code });
    return [];
  }
  return ((data ?? []) as Array<{ persona_slug: string; high_count: number | string }>).map((row) => ({
    personaSlug: row.persona_slug,
    highCount: Number(row.high_count || 0),
  }));
}
