import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

let lastCheckTime = 0;
let cachedResult: { database: string; payments: string; paymentMode: string; status: number } | null = null;

export async function GET() {
  const now = Date.now();
  if (cachedResult && now - lastCheckTime < 30_000) {
    return NextResponse.json(
      {
        status: cachedResult.status === 200 ? "ok" : "degraded",
        checks: {
          database: cachedResult.database,
          payments: cachedResult.payments,
          paymentMode: cachedResult.paymentMode,
        },
        timestamp: new Date().toISOString(),
        cached: true,
      },
      {
        status: cachedResult.status,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  }

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
  const status = database === "ok" && payments === "ok" ? 200 : 503;

  cachedResult = { database, payments, paymentMode, status };
  lastCheckTime = now;

  return NextResponse.json(
    {
      status: status === 200 ? "ok" : "degraded",
      checks: { database, payments, paymentMode },
      timestamp: new Date().toISOString(),
      cached: false,
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
