import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { dateTime } from "@/lib/format";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const [{ data: attempts }, { data: purchases }, { data: users }] = await Promise.all([
    supabase.from("creator_video_review_attempts").select("id,review_id,user_id,attempt_number,status,submitted_at,created_at").eq("status", "under_review").order("created_at", { ascending: false }).limit(20),
    supabase.from("purchases").select("id,status,fulfillment_source,created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("profiles").select("id,display_name,role,created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <AppShell>
      <section className="mb-6 rounded-md border border-ink/10 bg-ink p-6 text-white shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/45">Admin workspace</p>
        <h1 className="mt-2 text-4xl font-semibold">Operations dashboard</h1>
        <p className="mt-2 max-w-2xl text-white/70">Manage review queue, inventory health, users, and admin gift boxes.</p>
      </section>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <Link href="/admin/inventory" className="rounded-md border border-ink/10 bg-white p-5 font-semibold shadow-soft transition hover:-translate-y-0.5 focus-ring">Inventory health</Link>
        <Link href="/admin/users" className="rounded-md border border-ink/10 bg-white p-5 font-semibold shadow-soft transition hover:-translate-y-0.5 focus-ring">Users & gift boxes</Link>
        <Link href="/admin#reviews" className="rounded-md border border-ink/10 bg-white p-5 font-semibold shadow-soft transition hover:-translate-y-0.5 focus-ring">Review queue: {attempts?.length ?? 0}</Link>
      </div>

      <section id="reviews" className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-2xl font-semibold">Under review</h2>
        <div className="space-y-2">
          {attempts?.map((attempt) => (
            <Link key={attempt.id} href={`/admin/reviews/${attempt.review_id}`} className="flex items-center justify-between rounded-md bg-paper p-3 transition hover:bg-mist focus-ring">
              <div>
                <div className="font-semibold">Review {attempt.review_id.slice(0, 8)} / Attempt {attempt.attempt_number}</div>
                <p className="text-sm text-ink/50">{dateTime(attempt.submitted_at ?? attempt.created_at)}</p>
              </div>
              <StatusPill value={attempt.status} />
            </Link>
          ))}
          {!attempts?.length ? <p className="text-ink/60">No reviews waiting right now.</p> : null}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-ink/10 bg-white p-5">
          <h2 className="mb-4 text-2xl font-semibold">Recent users</h2>
          {users?.map((user) => (
            <div key={user.id} className="flex items-center justify-between border-t border-ink/10 py-3 first:border-t-0">
              <span>{user.display_name ?? user.id}</span>
              <StatusPill value={user.role} />
            </div>
          ))}
        </section>
        <section className="rounded-md border border-ink/10 bg-white p-5">
          <h2 className="mb-4 text-2xl font-semibold">Recent purchases</h2>
          {purchases?.map((purchase) => (
            <div key={purchase.id} className="flex items-center justify-between border-t border-ink/10 py-3 first:border-t-0">
              <span>{purchase.fulfillment_source}</span>
              <StatusPill value={purchase.status} />
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}