import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = await Promise.allSettled([
    createSupabaseAdminClient().from("box_products").select("id", { head: true, count: "exact" }).eq("enabled", true),
    stripe().balance.retrieve(),
  ]);

  const databaseResult = checks[0];
  const stripeResult = checks[1];
  const database =
    databaseResult.status === "fulfilled" && !databaseResult.value.error
      ? "ok"
      : "degraded";
  const payments = stripeResult.status === "fulfilled" ? "ok" : "degraded";
  const paymentMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
    ? "live"
    : process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
      ? "test"
      : "unknown";
  const paymentMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
    ? "live"
    : process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
      ? "test"
      : "unknown";
  const status = database === "ok" && payments === "ok" ? 200 : 503;

  return NextResponse.json(
    {
      status: status === 200 ? "ok" : "degraded",
      checks: { database, payments, paymentMode },
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}