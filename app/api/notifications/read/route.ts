import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

const Input = z.object({
  notification_id: z.string().uuid().optional(),
  all: z.boolean().optional(),
});

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  const input = Input.parse(await request.json());
  const now = new Date().toISOString();

  if (input.all) {
    await supabase.from("notifications").update({ read_at: now }).eq("user_id", user.id).is("read_at", null);
    return NextResponse.json({ ok: true });
  }

  if (!input.notification_id) return NextResponse.json({ error: "notification_id_required" }, { status: 400 });
  await supabase.from("notifications").update({ read_at: now }).eq("user_id", user.id).eq("id", input.notification_id);
  return NextResponse.json({ ok: true });
}