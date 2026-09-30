import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { notifyUser } from "@/lib/notifications";
import { siteUrl } from "@/lib/env";
import { stripe } from "@/lib/stripe";

export type CheckoutFulfillmentState = "delivered" | "pending" | "attention" | "refunded";

export type CheckoutFulfillmentResult = {
  state: CheckoutFulfillmentState;
  checkoutId: string;
  purchaseId?: string;
  deliveryId?: string;
  message?: string;
};

type CheckoutMetadata = {
  reservation_required?: boolean;
  box_product_slug?: string;
  category_slug?: string;
  persona_slug?: string;
  context_detail?: string;
};

export async function fulfillStripeCheckout(sessionId: string): Promise<CheckoutFulfillmentResult> {
  const admin = createSupabaseAdminClient();
  const { data: checkout, error: checkoutError } = await admin
    .from("checkout_sessions")
    .select("id,user_id,box_product_id,category_id,persona_id,purchase_id,status,metadata")
    .eq("provider_session_id", sessionId)
    .maybeSingle();

  if (checkoutError || !checkout) {
    throw new Error("Checkout session is not registered.");
  }

  const metadata = (checkout.metadata ?? {}) as CheckoutMetadata;
  const stripeSession = await stripe().checkout.sessions.retrieve(sessionId);

  if (
    stripeSession.client_reference_id &&
    stripeSession.client_reference_id !== checkout.id
  ) {
    throw new Error("Checkout reference does not match.");
  }

  if (
    stripeSession.metadata?.checkout_id &&
    stripeSession.metadata.checkout_id !== checkout.id
  ) {
    throw new Error("Checkout metadata does not match.");
  }

  if (
    stripeSession.metadata?.user_id &&
    stripeSession.metadata.user_id !== checkout.user_id
  ) {
    throw new Error("Checkout owner does not match.");
  }

  if (stripeSession.payment_status !== "paid") {
    return {
      state: "pending",
      checkoutId: checkout.id,
      message: "Payment is still being confirmed.",
    };
  }

  const [{ data: product }, { data: category }, { data: persona }] = await Promise.all([
    admin.from("box_products").select("id,slug,name,price_usd_cents").eq("id", checkout.box_product_id).single(),
    admin.from("categories").select("id,slug,name").eq("id", checkout.category_id).single(),
    admin.from("creator_personas").select("id,slug,name").eq("id", checkout.persona_id).single(),
  ]);

  if (!product || !category || !persona) {
    throw new Error("Checkout product scope no longer exists.");
  }

  if (stripeSession.currency?.toLowerCase() !== "usd") {
    throw new Error("Checkout currency does not match.");
  }
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
      state: "refunded",
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

  if (purchaseError || !purchase) {
    throw new Error(purchaseError?.message ?? "Purchase could not be recorded.");
  }

  await admin
    .from("checkout_sessions")
    .update({ purchase_id: purchase.id, status: "paid" })
    .eq("id", checkout.id);

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

  if (deliveryError || !delivery) {
    throw new Error(deliveryError?.message ?? "Dossier delivery could not be verified.");
  }
  if (delivery.status !== "delivered") {
    return {
      state: "attention",
      checkoutId: checkout.id,
      purchaseId: purchase.id,
      deliveryId: delivery.id,
      message: delivery.failure_reason ?? "Your paid dossier needs fulfillment review.",
    };
  }

  if (existingDelivery?.status !== "delivered") {
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(checkout.user_id);
      await notifyUser({
        userId: checkout.user_id,
        email: authUser.user?.email,
        type: "dossier_delivered",
        title: "Your Anomaly Box dossier is ready",
        body: `${product.name} is secured in your Creator Vault. Access it when you are ready to review the private briefs.`,
        href: `${siteUrl()}/boxes`,
        metadata: { delivery_id: delivery.id, purchase_id: purchase.id },
        dedupeKey: `purchase:${purchase.id}:delivered`,
      });
    } catch (error) {
      console.error("Dossier delivery notification failed without affecting fulfillment.", {
        purchaseId: purchase.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  return {
    state: "delivered",
    checkoutId: checkout.id,
    purchaseId: purchase.id,
    deliveryId: delivery.id,
  };
}