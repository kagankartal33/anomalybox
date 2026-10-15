import { NextResponse } from "next/server";
import { listCreatorModeStock } from "@/lib/inventory";

export async function GET(request: Request) {
  const categorySlug = new URL(request.url).searchParams.get("category_slug")?.trim() ?? "";
  if (!categorySlug) {
    return NextResponse.json({ error: "invalid_selection", modes: [] }, { status: 400 });
  }
  const modes = await listCreatorModeStock(categorySlug);
  return NextResponse.json({
    category_slug: categorySlug,
    modes,
  });
}