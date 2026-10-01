import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env, siteUrl } from "@/lib/env";
import { notifyUser } from "@/lib/notifications";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, env.stripeWebhookSecret());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "invalid_signature" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error: insertEventError } = await supabase.from("stripe_webhook_events").insert({
    id: event.id,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });
  if (insertEventError?.code === "23505") return NextResponse.json({ ok: true, duplicate: true });

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }
    await supabase.from("stripe_webhook_events").update({ processing_status: "processed", processed_at: new Date().toISOString() }).eq("id", event.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    await supabase.from("stripe_webhook_events").update({
      processing_status: "failed",
      error_message: error instanceof Error ? error.message : String(error),
    }).eq("id", event.id);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createSupabaseAdminClient();
  const metadata = session.metadata ?? {};
  const userId = metadata.user_id;
  const boxProductSlug = metadata.box_product_slug;
  const categorySlug = metadata.category_slug;
  const personaSlug = metadata.persona_slug;
  if (!userId || !boxProductSlug || !categorySlug || !personaSlug) throw new Error("Missing checkout metadata");

  const [{ data: product }, { data: category }, { data: persona }] = await Promise.all([
    supabase.from("box_products").select("id,price_usd_cents,name").eq("slug", boxProductSlug).single(),
    supabase.from("categories").select("id,name").eq("slug", categorySlug).single(),
    supabase.from("creator_personas").select("id,name").eq("slug", personaSlug).single(),
  ]);
  if (!product || !category || !persona) throw new Error("Invalid product/category/persona metadata");

  const { data: existingPurchase } = await supabase
    .from("purchases")
    .select("id")
    .eq("provider_checkout_session_id", session.id)
    .maybeSingle();

  const purchasePayload = {
    user_id: userId,
    box_product_id: product.id,
    provider: "stripe",
    provider_checkout_session_id: session.id,
    provider_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
    amount_usd_cents: session.amount_total ?? product.price_usd_cents,
    currency: session.currency ?? "usd",
    status: "paid",
    category_id: category.id,
    persona_id: persona.id,
    fulfillment_source: "stripe",
    completed_at: new Date().toISOString(),
    metadata: { box_product_slug: boxProductSlug, category_slug: categorySlug, persona_slug: personaSlug },
    raw_event: session as unknown as Record<string, unknown>,
  };

  const { data: purchase, error: purchaseError } = existingPurchase
    ? await supabase.from("purchases").update(purchasePayload).eq("id", existingPurchase.id).select("id").single()
    : await supabase.from("purchases").insert(purchasePayload).select("id").single();
  if (purchaseError || !purchase) throw new Error(purchaseError?.message ?? "Purchase write failed");

  await supabase.from("checkout_sessions").update({
    purchase_id: purchase.id,
    status: "paid",
  }).eq("provider_session_id", session.id);

  const { data: deliveryId, error: deliveryError } = await supabase.rpc("deliver_idea_box", {
    p_user_id: userId,
    p_box_product_slug: boxProductSlug,
    p_category_slug: categorySlug,
    p_persona_slug: personaSlug,
    p_purchase_id: purchase.id,
  });
  if (deliveryError) throw new Error(deliveryError.message);

  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  await notifyUser({
    userId,
    email: authUser.user?.email,
    type: "box_delivered",
    title: "Your Anomaly Box dossier is waiting",
    body: `${product.name} Creator Vault sayfanda kapalı kutu olarak hazır. Hazır olduğunda açıp kartlarını inceleyebilirsin.`,
    href: `${siteUrl()}/boxes`,
    metadata: { delivery_id: deliveryId, purchase_id: purchase.id },
  });
}