import { NextResponse } from "next/server";
import { z } from "zod";
import { checkInventoryForBox } from "@/lib/inventory";

const AvailabilityInput = z.object({
  box_product_slug: z.string().min(1),
  category_slug: z.string().min(1),
  persona_slug: z.string().min(1),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const input = AvailabilityInput.safeParse({
    box_product_slug: url.searchParams.get("box_product_slug"),
    category_slug: url.searchParams.get("category_slug"),
    persona_slug: url.searchParams.get("persona_slug"),
  });

  if (!input.success) {
    return NextResponse.json({ ok: false, error: "invalid_selection", missing: ["product/category/persona"], counts: {} }, { status: 400 });
  }

  const stock = await checkInventoryForBox(input.data.box_product_slug, input.data.category_slug, input.data.persona_slug);
  return NextResponse.json(stock);
}
