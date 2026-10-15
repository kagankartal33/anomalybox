import Stripe from "stripe";
import { env } from "@/lib/env";

export function stripe() {
  return new Stripe(env.stripeSecretKey(), {
    apiVersion: "2025-06-30.basil",
    typescript: true,
  });
}
