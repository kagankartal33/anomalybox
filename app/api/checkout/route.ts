import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkInventoryForBox } from "@/lib/inventory";
import { siteUrl } from "@/lib/env";
import { storeSelectionPath } from "@/lib/navigation";
import { stripe } from "@/lib/stripe";
import { boxPriceCents } from "@/lib/pricing";
import { verifyRecaptcha } from "@/lib/bot-protection";

const CheckoutInput = z.object({
  box_product_slug: z.string().min(1).max(100),
  category_slug: z.string().min(1).max(100),
  persona_slug: z.string().min(1).max(100),
  context_detail: z.string().trim().max(160).optional(),
  recaptcha_token: z.string().max(4096).optional(),
});

export async function POST(request: Request) {
  const parsed = CheckoutInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_checkout_request" }, { status: 400 });
  }
  const input = parsed.data;
  if (!(await verifyRecaptcha(input.recaptcha_token, "begin_checkout"))) {
    return NextResponse.json({ error: "security_verification_failed" }, { status: 403 });
  }
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
    admin
      .from("box_products")
      .select("id,slug,name,price_usd_cents,idea_count,metadata")
      .eq("slug", input.box_product_slug)
      .eq("enabled", true)
      .single(),
    admin.from("categories").select("id,slug,name").eq("slug", input.category_slug).eq("enabled", true).single(),
    admin.from("creator_personas").select("id,slug,name").eq("slug", input.persona_slug).eq("enabled", true).single(),
  ]);

  if (!product || !category || !persona) {
    return NextResponse.json({ error: "invalid_product_scope" }, { status: 400 });
  }

  const secret = process.env.STRIPE_SECRET_KEY ?? "";
  const stripeMode = secret.startsWith("sk_live_") || secret.startsWith("rk_live_") ? "live" : "test";
  const stripeCatalog =
    product.metadata &&
    typeof product.metadata === "object" &&
    product.metadata.stripe &&
    typeof product.metadata.stripe === "object"
      ? (product.metadata.stripe as Record<string, { price_id?: string; product_id?: string; unit_amount?: number }>)
      : null;
  const stripePriceId = stripeCatalog?.[stripeMode]?.price_id;
  const stripePriceAmount = stripeCatalog?.[stripeMode]?.unit_amount;
  const expectedCents = boxPriceCents(product.slug) ?? product.price_usd_cents;
  if (product.price_usd_cents !== expectedCents) {
    return NextResponse.json({ error: "product_price_misconfigured" }, { status: 500 });
  }
  const canUseStripePrice =
    typeof stripePriceId === "string" &&
    stripePriceId.startsWith("price_") &&
    typeof stripePriceAmount === "number" &&
    stripePriceAmount === expectedCents;

  const expiresAt = new Date(Date.now() + 31 * 60 * 1000);
  const checkoutMetadata = {
    reservation_required: true,
    box_product_slug: product.slug,
    category_slug: category.slug,
    persona_slug: persona.slug,
    context_detail: input.context_detail ?? "",
  };

  const { data: checkout, error: checkoutError } = await admin
    .from("checkout_sessions")
    .insert({
      user_id: user.id,
      box_product_id: product.id,
      provider: "stripe",
      status: "created",
      category_id: category.id,
      persona_id: persona.id,
      metadata: checkoutMetadata,
    })
    .select("id")
    .single();

  if (checkoutError || !checkout) {
    console.error("Checkout record creation failed.", { code: checkoutError?.code });
    return NextResponse.json({ error: "checkout_initialization_failed" }, { status: 500 });
  }

  const { data: reservedCount, error: reservationError } = await admin.rpc("reserve_checkout_inventory", {
    p_checkout_session_id: checkout.id,
    p_user_id: user.id,
    p_box_product_slug: product.slug,
    p_category_slug: category.slug,
    p_persona_slug: persona.slug,
    p_expires_at: expiresAt.toISOString(),
  });

  if (reservationError || Number(reservedCount) !== product.idea_count) {
    await admin.from("checkout_sessions").update({ status: "canceled" }).eq("id", checkout.id);
    console.warn("Checkout inventory reservation failed.", {
      checkoutId: checkout.id,
      code: reservationError?.code,
    });
    return NextResponse.json({ error: "inventory_unavailable" }, { status: 409 });
  }

  let session: Stripe.Checkout.Session | null = null;
  try {
    session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: checkout.id,
        expires_at: Math.floor(expiresAt.getTime() / 1000),
        success_url: `${siteUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl()}/store?checkout=canceled`,
        ...(user.email ? { customer_email: user.email } : {}),
        line_items: [
          canUseStripePrice
            ? {
                quantity: 1,
                price: stripePriceId,
              }
            : {
                quantity: 1,
                price_data: {
                  currency: "usd",
                  unit_amount: expectedCents,
                  product_data: {
                    name: product.name,
                    description: `${product.idea_count} private creator briefs for ${category.name} / ${persona.name}`,
                  },
                },
              },
        ],
        metadata: {
          checkout_id: checkout.id,
          user_id: user.id,
          box_product_slug: product.slug,
          category_slug: category.slug,
          persona_slug: persona.slug,
          context_detail: input.context_detail ?? "",
          stripe_price_id: canUseStripePrice ? stripePriceId : "",
          stripe_product_id: canUseStripePrice ? stripeCatalog?.[stripeMode]?.product_id ?? "" : "",
        },
      },
      { idempotencyKey: `anomaly-box-checkout:${checkout.id}` },
    );

    if (!session.url) throw new Error("Stripe Checkout did not return a URL.");

    const { error: updateError } = await admin
      .from("checkout_sessions")
      .update({
        provider_session_id: session.id,
        status: "open",
        checkout_url: session.url,
      })
      .eq("id", checkout.id);

    if (updateError) throw new Error(updateError.message);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (session?.status === "open") {
      await stripe().checkout.sessions.expire(session.id).catch(() => undefined);
    }
    await Promise.all([
      admin.rpc("release_checkout_inventory", { p_checkout_session_id: checkout.id }),
      admin.from("checkout_sessions").update({ status: "canceled" }).eq("id", checkout.id),
    ]);
    console.error("Stripe Checkout creation failed.", {
      checkoutId: checkout.id,
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "checkout_initialization_failed" }, { status: 500 });
  }
}
