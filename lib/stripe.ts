import Stripe from "stripe";
import { env } from "@/lib/env";

export function stripe() {
  return new Stripe(env.stripeSecretKey(), {
    apiVersion: "2025-08-27.basil",
    typescript: true,
  });
}