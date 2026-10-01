import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkInventoryForBox } from "@/lib/inventory";
import { siteUrl } from "@/lib/env";
import { storeSelectionPath } from "@/lib/navigation";
import { stripe } from "@/lib/stripe";

const CheckoutInput = z.object({
  box_product_slug: z.string().min(1),
  category_slug: z.string().min(1),
  persona_slug: z.string().min(1),
  context_detail: z.string().trim().max(160).optional(),
});

export async function POST(request: Request) {
  const input = CheckoutInput.parse(await request.json());
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = storeSelectionPath({
      boxProductSlug: input.box_product_slug,
      categorySlug: input.category_slug,
      personaSlug: input.persona_slug,
      contextDetail: input.context_detail,
      checkout: true,
    });
    return NextResponse.json({ error: "login_required", login_url: `/login?next=${encodeURIComponent(next)}` }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  const stock = await checkInventoryForBox(input.box_product_slug, input.category_slug, input.persona_slug);
  if (!stock.ok) {
    return NextResponse.json({ error: "inventory_unavailable", missing: stock.missing, counts: stock.counts }, { status: 409 });
  }

  const [{ data: product }, { data: category }, { data: persona }] = await Promise.all([
    admin.from("box_products").select("id,slug,name,price_usd_cents,idea_count").eq("slug", input.box_product_slug).single(),
    admin.from("categories").select("id,slug,name").eq("slug", input.category_slug).single(),
    admin.from("creator_personas").select("id,slug,name").eq("slug", input.persona_slug).single(),
  ]);

  if (!product || !category || !persona) return NextResponse.json({ error: "invalid_product_scope" }, { status: 400 });

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    success_url: `${siteUrl()}/profile?checkout=success`,
    cancel_url: `${siteUrl()}/store?checkout=canceled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: product.price_usd_cents,
          product_data: {
            name: product.name,
            description: `${category.name} / ${persona.name} için ${product.idea_count} premium fikir`,
          },
        },
      },
    ],
    metadata: {
      user_id: user.id,
      box_product_slug: product.slug,
      category_slug: category.slug,
      persona_slug: persona.slug,
      context_detail: input.context_detail ?? "",
      category_id: category.id,
      persona_id: persona.id,
    },
  });

  await admin.from("checkout_sessions").insert({
    user_id: user.id,
    box_product_id: product.id,
    provider: "stripe",
    provider_session_id: session.id,
    status: "open",
    checkout_url: session.url,
    category_id: category.id,
    persona_id: persona.id,
    metadata: {
      stripe_session_id: session.id,
      box_product_slug: product.slug,
      category_slug: category.slug,
      persona_slug: persona.slug,
      context_detail: input.context_detail ?? "",
    },
  });

  return NextResponse.json({ url: session.url });
}