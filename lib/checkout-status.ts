import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fulfillStripeCheckout,
  type CheckoutFulfillmentResult,
} from "@/lib/stripe-fulfillment";

export async function getCheckoutStatusForUser(
  sessionId: string,
  userId: string,
): Promise<CheckoutFulfillmentResult> {
  const admin = createSupabaseAdminClient();
  const { data: checkout, error } = await admin
    .from("checkout_sessions")
    .select("id,status,purchase_id")
    .eq("provider_session_id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !checkout) {
    throw new Error("Checkout session was not found for this account.");
  }

  if (checkout.status === "expired" || checkout.status === "canceled") {
    return {
      state: "attention",
      checkoutId: checkout.id,
      message: "This checkout is no longer active.",
    };
  }

  try {
    return await fulfillStripeCheckout(sessionId);
  } catch (fulfillmentError) {
    const { data: purchase } = checkout.purchase_id
      ? await admin.from("purchases").select("id,status").eq("id", checkout.purchase_id).maybeSingle()
      : { data: null };

    if (purchase?.status === "refunded") {
      return {
        state: "refunded",
        checkoutId: checkout.id,
        purchaseId: purchase.id,
        message: "This payment has been refunded.",
      };
    }

    if (purchase?.status === "paid") {
      const { data: delivery } = await admin
        .from("idea_box_deliveries")
        .select("id,status")
        .eq("purchase_id", purchase.id)
        .maybeSingle();

      if (delivery?.status === "delivered") {
        return {
          state: "delivered",
          checkoutId: checkout.id,
          purchaseId: purchase.id,
          deliveryId: delivery.id,
        };
      }

      console.error("Paid checkout needs fulfillment attention.", {
        checkoutId: checkout.id,
        error: fulfillmentError instanceof Error ? fulfillmentError.message : "unknown",
      });
      return {
        state: "attention",
        checkoutId: checkout.id,
        purchaseId: purchase.id,
        deliveryId: delivery?.id,
        message: "Payment is confirmed, but your creative brief needs a fulfillment review. No second payment is required.",
      };
    }

    return {
      state: "pending",
      checkoutId: checkout.id,
      message: "Payment confirmation is still in progress.",
    };
  }
}
