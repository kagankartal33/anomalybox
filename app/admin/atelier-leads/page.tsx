import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { dateTime } from "@/lib/format";

export default async function AdminAtelierLeadsPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const { data: leads } = await supabase
    .from("atelier_leads")
    .select("id,name,email,instagram_handle,desired_effect,project_context,status,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell>
      <div className="mb-6">
        <Link className="text-sm text-ink/55 underline underline-offset-2" href="/admin">Back to admin</Link>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-ink/40">Concierge leads</p>
        <h1 className="mt-2 text-4xl font-semibold">ATELIER BLACK BOX requests</h1>
        <p className="mt-2 max-w-2xl text-ink/65">Review private consultation requests for custom creator strategy cards.</p>
      </div>

      <section className="rounded-md border border-ink/10 bg-white shadow-soft">
        <div className="divide-y divide-ink/10">
          {leads?.map((lead) => (
            <article className="grid gap-4 p-5 lg:grid-cols-[1fr_180px]" key={lead.id}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{lead.name}</h2>
                  <StatusPill value={lead.status} />
                </div>
                <p className="mt-1 text-sm text-ink/55">{lead.email}{lead.instagram_handle ? ` / ${lead.instagram_handle}` : ""}</p>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-ink/40">Desired effect</p>
                <p className="mt-1 text-ink/75">{lead.desired_effect}</p>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink/40">Context</p>
                <p className="mt-1 leading-7 text-ink/70">{lead.project_context}</p>
              </div>
              <div className="text-sm text-ink/55 lg:text-right">{dateTime(lead.created_at)}</div>
            </article>
          ))}
          {!leads?.length ? <p className="p-5 text-ink/60">No Atelier requests yet.</p> : null}
        </div>
      </section>
    </AppShell>
  );
}