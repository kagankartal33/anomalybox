import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { fulfillStripeCheckout } from "@/lib/stripe-fulfillment";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, env.stripeWebhookSecret());
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: claim, error: claimError } = await admin.rpc("claim_stripe_webhook_event", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_payload: event as unknown as Record<string, unknown>,
  });

  if (claimError) {
    console.error("Stripe event could not be claimed.", { eventId: event.id, code: claimError.code });
    return NextResponse.json({ error: "event_claim_failed" }, { status: 500 });
  }
  if (claim === "processed" || claim === "busy") {
    return NextResponse.json({ ok: true, duplicate: true });
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
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe event processing failed";
    await admin
      .from("stripe_webhook_events")
      .update({ processing_status: "failed", error_message: message })
      .eq("id", event.id);
    console.error("Stripe event processing failed.", { eventId: event.id, eventType: event.type, message });
    return NextResponse.json({ error: "event_processing_failed" }, { status: 500 });
  }
}

async function closeUnpaidCheckout(session: Stripe.Checkout.Session, eventType: string) {
  if (session.payment_status === "paid") return;

  const admin = createSupabaseAdminClient();
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
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const admin = createSupabaseAdminClient();
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