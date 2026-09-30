import { NextResponse } from "next/server";
import { z } from "zod";
import { getCheckoutStatusForUser } from "@/lib/checkout-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SessionId = z.string().regex(/^cs_(test|live)_[A-Za-z0-9]+$/).max(255);

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  const parsed = SessionId.safeParse(sessionId);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_session" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

  try {
    const result = await getCheckoutStatusForUser(parsed.data, user.id);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "checkout_not_found" }, { status: 404 });
  }
}