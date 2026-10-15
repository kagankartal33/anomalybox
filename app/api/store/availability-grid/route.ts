import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listPurchaseLaneModeCounts } from "@/lib/inventory";

export async function GET(request: Request) {
  const productSlug = new URL(request.url).searchParams.get("box_product_slug")?.trim() ?? "";
  const supabase = createSupabaseAdminClient();
  let needed = 2;
  if (productSlug) {
    const { data: product } = await supabase
      .from("box_products")
      .select("allocation,idea_count")
      .eq("slug", productSlug)
      .eq("enabled", true)
      .maybeSingle();
    const allocation = (product?.allocation ?? {}) as Record<string, number>;
    needed = Number(allocation.high ?? product?.idea_count ?? 2) || 2;
  }

  const cells = await listPurchaseLaneModeCounts();
  return NextResponse.json({
    needed_high: needed,
    cells: cells.map((cell) => ({
      category_slug: cell.categorySlug,
      persona_slug: cell.personaSlug,
      high_count: cell.highCount,
      ok: cell.highCount >= needed,
    })),
  });
}
