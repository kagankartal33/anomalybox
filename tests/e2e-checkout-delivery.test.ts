import assert from "node:assert/strict";
import { z } from "zod";

/**
 * E2E Checkout and Delivery Simulation Test
 * Validates the full purchase lifecycle from store reservation to webhook fulfillment,
 * stock reservation timeout, and vault delivery contracts.
 */

// 1. Checkout Reservation Contract
const CheckoutReservationInputSchema = z.object({
  productSlug: z.string().min(1),
  categorySlug: z.string().min(1),
  personaSlug: z.string().min(1),
  contextDetail: z.string().max(500).optional(),
});

// 2. Stripe Webhook Session Completed Contract
const StripeCheckoutSessionCompletedSchema = z.object({
  id: z.string().startsWith("cs_"),
  object: z.literal("checkout.session"),
  payment_status: z.literal("paid"),
  customer_details: z.object({
    email: z.string().email(),
  }),
  metadata: z.object({
    product_slug: z.string(),
    category_slug: z.string(),
    persona_slug: z.string(),
    user_id: z.string().uuid(),
    box_order_id: z.string().uuid(),
  }),
});

// Mock state machine for checkout reservation and delivery
interface ReservationState {
  orderId: string;
  userId: string;
  laneSlug: string;
  personaSlug: string;
  status: "reserved" | "completed" | "expired" | "released";
  expiresAt: number;
}

class InventoryReservationEngine {
  private stock: Map<string, number> = new Map();
  private reservations: Map<string, ReservationState> = new Map();
  private deliveredBoxes: Map<string, string[]> = new Map(); // userId -> boxIds

  constructor(initialStock: Record<string, number>) {
    for (const [key, count] of Object.entries(initialStock)) {
      this.stock.set(key, count);
    }
  }

  reserve(userId: string, laneSlug: string, personaSlug: string): { success: boolean; orderId?: string; error?: string } {
    const key = `${laneSlug}:${personaSlug}`;
    const available = this.stock.get(key) || 0;
    if (available <= 0) {
      return { success: false, error: "OUT_OF_STOCK" };
    }

    const orderId = crypto.randomUUID();
    this.stock.set(key, available - 1);
    this.reservations.set(orderId, {
      orderId,
      userId,
      laneSlug,
      personaSlug,
      status: "reserved",
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
    });

    return { success: true, orderId };
  }

  fulfillWebhook(eventId: string, orderId: string, processedEvents: Set<string>): { success: boolean; error?: string } {
    // Idempotency check
    if (processedEvents.has(eventId)) {
      return { success: true }; // Replay ignored safely
    }

    const reservation = this.reservations.get(orderId);
    if (!reservation) {
      return { success: false, error: "RESERVATION_NOT_FOUND" };
    }
    if (reservation.status === "completed") {
      processedEvents.add(eventId);
      return { success: true };
    }
    if (reservation.status === "expired" || reservation.status === "released") {
      return { success: false, error: "RESERVATION_EXPIRED" };
    }

    reservation.status = "completed";
    processedEvents.add(eventId);

    const userBoxes = this.deliveredBoxes.get(reservation.userId) || [];
    userBoxes.push(orderId);
    this.deliveredBoxes.set(reservation.userId, userBoxes);

    return { success: true };
  }

  releaseExpired(orderId: string): void {
    const res = this.reservations.get(orderId);
    if (res && res.status === "reserved") {
      res.status = "released";
      const key = `${res.laneSlug}:${res.personaSlug}`;
      this.stock.set(key, (this.stock.get(key) || 0) + 1);
    }
  }

  getAvailable(laneSlug: string, personaSlug: string): number {
    return this.stock.get(`${laneSlug}:${personaSlug}`) || 0;
  }

  getUserBoxCount(userId: string): number {
    return (this.deliveredBoxes.get(userId) || []).length;
  }
}

async function runCheckoutDeliveryE2ETest() {
  console.log("--> Testing E2E Checkout Reservation & Delivery Flow...");

  // 1. Input schema verification
  const validPayload = {
    productSlug: "classic-red",
    categorySlug: "streetwear-fashion",
    personaSlug: "documentary-director",
    contextDetail: "Launching winter jacket series",
  };
  assert.doesNotThrow(() => CheckoutReservationInputSchema.parse(validPayload));

  // Invalid payload test
  assert.throws(() => CheckoutReservationInputSchema.parse({
    productSlug: "",
    categorySlug: "test",
    personaSlug: "test",
  }));

  // 2. Inventory Reservation & Race Condition Protection
  const engine = new InventoryReservationEngine({
    "streetwear-fashion:documentary-director": 1, // Only 1 brief available
  });

  const userA = crypto.randomUUID();
  const userB = crypto.randomUUID();

  // User A reserves the only brief
  const resA = engine.reserve(userA, "streetwear-fashion", "documentary-director");
  assert.equal(resA.success, true);
  assert.ok(resA.orderId);
  assert.equal(engine.getAvailable("streetwear-fashion", "documentary-director"), 0);

  // User B tries to reserve the same brief -> Out of stock
  const resB = engine.reserve(userB, "streetwear-fashion", "documentary-director");
  assert.equal(resB.success, false);
  assert.equal(resB.error, "OUT_OF_STOCK");

  // 3. Webhook processing & Idempotency
  const processedWebhookEvents = new Set<string>();
  const mockWebhookPayload = {
    id: "cs_test_1234567890",
    object: "checkout.session" as const,
    payment_status: "paid" as const,
    customer_details: { email: "creator@example.com" },
    metadata: {
      product_slug: "classic-red",
      category_slug: "streetwear-fashion",
      persona_slug: "documentary-director",
      user_id: userA,
      box_order_id: resA.orderId!,
    },
  };

  assert.doesNotThrow(() => StripeCheckoutSessionCompletedSchema.parse(mockWebhookPayload));

  // First webhook delivery
  const eventId = "evt_test_checkout_completed_001";
  const fulfillment1 = engine.fulfillWebhook(eventId, resA.orderId!, processedWebhookEvents);
  assert.equal(fulfillment1.success, true);
  assert.equal(engine.getUserBoxCount(userA), 1);

  // Replayed duplicate webhook (Stripe retry)
  const fulfillment2 = engine.fulfillWebhook(eventId, resA.orderId!, processedWebhookEvents);
  assert.equal(fulfillment2.success, true);
  assert.equal(engine.getUserBoxCount(userA), 1, "Duplicate webhook must not increment delivered boxes");

  // 4. Expiration and release flow test
  const engine2 = new InventoryReservationEngine({
    "tech-hardware:minimalist-reviewer": 1,
  });
  const resExpire = engine2.reserve(userB, "tech-hardware", "minimalist-reviewer");
  assert.equal(resExpire.success, true);
  assert.equal(engine2.getAvailable("tech-hardware", "minimalist-reviewer"), 0);

  // Expire the reservation
  engine2.releaseExpired(resExpire.orderId!);
  assert.equal(engine2.getAvailable("tech-hardware", "minimalist-reviewer"), 1, "Expired reservation must return stock to pool");

  console.log("OK: E2E Checkout Reservation & Delivery Test Passed.");
}

runCheckoutDeliveryE2ETest().catch((err) => {
  console.error("FAIL: E2E Checkout Test Failed:", err);
  process.exit(1);
});
