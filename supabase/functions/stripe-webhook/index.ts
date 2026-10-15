/**
 * Production Stripe webhook receiver (Supabase Edge Function).
 * Primary durable fulfillment endpoint (independent of Vercel deploys).
 *
 * Secrets required:
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_SECRET
 * - SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (auto-provided by Supabase)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@18.3.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const siteUrl = Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "https://anomalybox.com";

if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
  throw new Error("stripe-webhook function is missing required secrets");
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: "2025-06-30.basil",
  httpClient: Stripe.createFetchHttpClient(),
});

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type CheckoutMetadata = {
  reservation_required?: boolean;
  box_product_slug?: string;
  category_slug?: string;
  persona_slug?: string;
  context_detail?: string;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return json({ error: "missing_signature" }, 400);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch {
    return json({ error: "invalid_signature" }, 400);
  }

  const { data: claim, error: claimError } = await admin.rpc("claim_stripe_webhook_event", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_payload: event as unknown as Record<string, unknown>,
  });

  if (claimError) {
    console.error("claim failed", claimError);
    return json({ error: "event_claim_failed" }, 500);
  }
  if (claim === "processed") {
    return json({ ok: true, duplicate: true });
  }
  if (claim === "busy") {
    return json({ error: "event_busy" }, 409);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await fulfillStripeCheckout(session.id);
        if (result.state === "attention") {
          throw new Error(result.message ?? "Paid checkout requires fulfillment attention.");
        }
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        await closeUnpaidCheckout(event.data.object as Stripe.Checkout.Session, event.type);
        break;
      }
      case "charge.refunded": {
        await markRefunded(event.data.object as Stripe.Charge);
        break;
      }
      default:
        break;
    }

    const { error: processedError } = await admin
      .from("stripe_webhook_events")
      .update({
        processing_status: "processed",
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", event.id);

    if (processedError) throw new Error(processedError.message);
    return json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe event processing failed";
    await admin
      .from("stripe_webhook_events")
      .update({ processing_status: "failed", error_message: message })
      .eq("id", event.id);
    console.error("processing failed", event.id, event.type, message);
    return json({ error: "event_processing_failed", message }, 500);
  }
});

async function fulfillStripeCheckout(sessionId: string) {
  const { data: checkout, error: checkoutError } = await admin
    .from("checkout_sessions")
    .select("id,user_id,box_product_id,category_id,persona_id,purchase_id,status,metadata")
    .eq("provider_session_id", sessionId)
    .maybeSingle();

  if (checkoutError || !checkout) throw new Error("Checkout session is not registered.");

  const metadata = (checkout.metadata ?? {}) as CheckoutMetadata;
  const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

  if (stripeSession.client_reference_id && stripeSession.client_reference_id !== checkout.id) {
    throw new Error("Checkout reference does not match.");
  }
  if (stripeSession.metadata?.checkout_id && stripeSession.metadata.checkout_id !== checkout.id) {
    throw new Error("Checkout metadata does not match.");
  }
  if (stripeSession.metadata?.user_id && stripeSession.metadata.user_id !== checkout.user_id) {
    throw new Error("Checkout owner does not match.");
  }
  if (stripeSession.payment_status !== "paid") {
    return { state: "pending" as const, checkoutId: checkout.id, message: "Payment is still being confirmed." };
  }

  const [{ data: product }, { data: category }, { data: persona }] = await Promise.all([
    admin.from("box_products").select("id,slug,name,price_usd_cents").eq("id", checkout.box_product_id).single(),
    admin.from("categories").select("id,slug,name").eq("id", checkout.category_id).single(),
    admin.from("creator_personas").select("id,slug,name").eq("id", checkout.persona_id).single(),
  ]);
  if (!product || !category || !persona) throw new Error("Checkout product scope no longer exists.");
  if (stripeSession.currency?.toLowerCase() !== "usd") throw new Error("Checkout currency does not match.");
  if (stripeSession.amount_total !== product.price_usd_cents) {
    throw new Error("Checkout amount does not match the secured product price.");
  }

  const { data: existingPurchase } = await admin
    .from("purchases")
    .select("id,status")
    .eq("provider_checkout_session_id", sessionId)
    .maybeSingle();

  if (existingPurchase?.status === "refunded") {
    return {
      state: "refunded" as const,
      checkoutId: checkout.id,
      purchaseId: existingPurchase.id,
      message: "This payment has been refunded.",
    };
  }

  const purchasePayload = {
    user_id: checkout.user_id,
    box_product_id: product.id,
    provider: "stripe",
    provider_checkout_session_id: sessionId,
    provider_payment_intent_id:
      typeof stripeSession.payment_intent === "string"
        ? stripeSession.payment_intent
        : stripeSession.payment_intent?.id ?? null,
    amount_usd_cents: product.price_usd_cents,
    currency: "usd",
    status: "paid",
    category_id: category.id,
    persona_id: persona.id,
    fulfillment_source: "stripe",
    completed_at: new Date().toISOString(),
    metadata: {
      checkout_id: checkout.id,
      box_product_slug: product.slug,
      category_slug: category.slug,
      persona_slug: persona.slug,
      context_detail: metadata.context_detail ?? "",
    },
    raw_event: stripeSession as unknown as Record<string, unknown>,
  };

  const { data: purchase, error: purchaseError } = await admin
    .from("purchases")
    .upsert(purchasePayload, { onConflict: "provider_checkout_session_id" })
    .select("id")
    .single();
  if (purchaseError || !purchase) throw new Error(purchaseError?.message ?? "Purchase could not be recorded.");

  await admin.from("checkout_sessions").update({ purchase_id: purchase.id, status: "paid" }).eq("id", checkout.id);

  const { data: existingDelivery } = await admin
    .from("idea_box_deliveries")
    .select("id,status")
    .eq("purchase_id", purchase.id)
    .maybeSingle();

  let deliveryId = existingDelivery?.id;
  if (existingDelivery?.status !== "delivered") {
    const { count: activeReservations, error: reservationError } = await admin
      .from("checkout_inventory_reservations")
      .select("id", { count: "exact", head: true })
      .eq("checkout_session_id", checkout.id)
      .eq("status", "active");
    if (reservationError) throw new Error(reservationError.message);

    if ((activeReservations ?? 0) > 0) {
      const { data, error } = await admin.rpc("fulfill_reserved_checkout", {
        p_checkout_session_id: checkout.id,
        p_purchase_id: purchase.id,
      });
      if (error || !data) throw new Error(error?.message ?? "Reserved dossier delivery failed.");
      deliveryId = data as string;
    } else if (metadata.reservation_required) {
      throw new Error("The secured inventory reservation is unavailable.");
    } else {
      const { data, error } = await admin.rpc("deliver_idea_box", {
        p_user_id: checkout.user_id,
        p_box_product_slug: metadata.box_product_slug ?? product.slug,
        p_category_slug: metadata.category_slug ?? category.slug,
        p_persona_slug: metadata.persona_slug ?? persona.slug,
        p_purchase_id: purchase.id,
      });
      if (error || !data) throw new Error(error?.message ?? "Legacy dossier delivery failed.");
      deliveryId = data as string;
    }
  }

  const { data: delivery, error: deliveryError } = await admin
    .from("idea_box_deliveries")
    .select("id,status,failure_reason")
    .eq("id", deliveryId)
    .single();
  if (deliveryError || !delivery) throw new Error(deliveryError?.message ?? "Dossier delivery could not be verified.");
  if (delivery.status !== "delivered") {
    return {
      state: "attention" as const,
      checkoutId: checkout.id,
      purchaseId: purchase.id,
      deliveryId: delivery.id,
      message: delivery.failure_reason ?? "Your paid dossier needs fulfillment review.",
    };
  }

  // Best-effort in-app notification; email is optional.
  if (existingDelivery?.status !== "delivered") {
    try {
      await admin.from("notifications").insert({
        user_id: checkout.user_id,
        type: "dossier_delivered",
        title: "Your Anomaly Box dossier is ready",
        body: `${product.name} is secured in your Creator Vault. Access it when you are ready to review the private briefs.`,
        href: `${siteUrl}/boxes`,
        metadata: { delivery_id: delivery.id, purchase_id: purchase.id },
        dedupe_key: `purchase:${purchase.id}:delivered`,
      });
    } catch (error) {
      console.error("notification insert failed", error);
    }
  }

  return {
    state: "delivered" as const,
    checkoutId: checkout.id,
    purchaseId: purchase.id,
    deliveryId: delivery.id,
  };
}

async function closeUnpaidCheckout(session: Stripe.Checkout.Session, eventType: string) {
  if (session.payment_status === "paid") return;
  const { data: checkout } = await admin
    .from("checkout_sessions")
    .select("id")
    .eq("provider_session_id", session.id)
    .maybeSingle();
  if (!checkout) return;

  const status = eventType === "checkout.session.expired" ? "expired" : "canceled";
  const [{ error: releaseError }, { error: updateError }] = await Promise.all([
    admin.rpc("release_checkout_inventory", { p_checkout_session_id: checkout.id }),
    admin.from("checkout_sessions").update({ status }).eq("id", checkout.id),
  ]);
  if (releaseError || updateError) {
    throw new Error(releaseError?.message ?? updateError?.message ?? "Checkout could not be closed.");
  }
}

async function markRefunded(charge: Stripe.Charge) {
  if (!charge.refunded) return;
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const { data: purchase, error: purchaseError } = await admin
    .from("purchases")
    .select("id")
    .eq("provider_payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (purchaseError) throw new Error(purchaseError.message);
  if (!purchase) return;

  const [{ error: purchaseUpdateError }, { error: deliveryUpdateError }] = await Promise.all([
    admin.from("purchases").update({ status: "refunded" }).eq("id", purchase.id),
    admin.from("idea_box_deliveries").update({ status: "refunded" }).eq("purchase_id", purchase.id),
  ]);
  if (purchaseUpdateError || deliveryUpdateError) {
    throw new Error(purchaseUpdateError?.message ?? deliveryUpdateError?.message ?? "Refund state could not be recorded.");
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
