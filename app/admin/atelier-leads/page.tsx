import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { updateAtelierLeadStatus } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { dateTime } from "@/lib/format";

const leadStatuses = ["new", "contacted", "qualified", "closed", "archived"] as const;

type Search = {
  status?: string;
  updated?: string;
  error?: string;
};

function firstParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";
}

export default async function AdminAtelierLeadsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const query = (searchParams ? await searchParams : {}) as Search;
  const statusFilter = firstParam(query.status).trim();
  const updatedId = firstParam(query.updated).trim();
  const error = firstParam(query.error).trim();

  const supabase = createSupabaseAdminClient();
  let request = supabase
    .from("atelier_leads")
    .select("id,name,email,instagram_handle,desired_effect,project_context,status,metadata,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (statusFilter && leadStatuses.includes(statusFilter as (typeof leadStatuses)[number])) {
    request = request.eq("status", statusFilter);
  }
  const [{ data: leads }, { count: totalCount }, ...statusCountResults] = await Promise.all([
    request,
    supabase.from("atelier_leads").select("id", { count: "exact", head: true }),
    ...leadStatuses.map((status) =>
      supabase.from("atelier_leads").select("id", { count: "exact", head: true }).eq("status", status),
    ),
  ]);

  const counts = Object.fromEntries(
    leadStatuses.map((status, index) => [status, statusCountResults[index]?.count ?? 0]),
  ) as Record<(typeof leadStatuses)[number], number>;

  return (
    <AppShell>
      <div className="mb-6">
        <Link className="text-sm text-ink/55 underline underline-offset-2" href="/admin">Back to admin</Link>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-ink/40">Concierge leads</p>
        <h1 className="mt-2 text-4xl font-semibold">ATELIER BLACK BOX requests</h1>
        <p className="mt-2 max-w-2xl text-ink/65">Review private consultation requests and move each lead through contact, qualification, and close.</p>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-coral/20 bg-coral/10 p-3 text-sm text-coral" role="alert">
          {error}
        </div>
      ) : null}
      {updatedId ? (
        <div className="mb-4 rounded-md border border-teal/20 bg-teal/10 p-3 text-sm text-teal" role="status">
          Lead status updated.
        </div>
      ) : null}

      <section className="mb-5 flex flex-wrap gap-2">
        <Link
          className={`focus-ring rounded-full border px-3 py-1.5 text-xs font-semibold ${!statusFilter ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink/65"}`}
          href="/admin/atelier-leads"
        >
          All ({totalCount ?? 0})
        </Link>
        {leadStatuses.map((status) => (
          <Link
            key={status}
            className={`focus-ring rounded-full border px-3 py-1.5 text-xs font-semibold ${statusFilter === status ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink/65"}`}
            href={`/admin/atelier-leads?status=${status}`}
          >
            {status} ({counts[status]})
          </Link>
        ))}
      </section>

      <section className="rounded-md border border-ink/10 bg-white shadow-soft">
        <div className="divide-y divide-ink/10">
          {leads?.map((lead) => {
            const metadata = (lead.metadata && typeof lead.metadata === "object" && !Array.isArray(lead.metadata)
              ? lead.metadata
              : {}) as Record<string, unknown>;
            const lastChange = metadata.last_status_change && typeof metadata.last_status_change === "object"
              ? metadata.last_status_change as Record<string, unknown>
              : null;

            return (
              <article className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]" key={lead.id}>
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
                  {lastChange?.note ? (
                    <p className="mt-3 rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm text-ink/65">
                      Latest note: {String(lastChange.note)}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-ink/55 lg:text-right">
                    <div>Created {dateTime(lead.created_at)}</div>
                    {lead.updated_at ? <div className="mt-1">Updated {dateTime(lead.updated_at)}</div> : null}
                  </div>
                  <form action={updateAtelierLeadStatus} className="rounded-md border border-ink/10 bg-paper p-3 space-y-3">
                    <input name="lead_id" type="hidden" value={lead.id} />
                    <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">
                      Status
                      <select
                        className="focus-ring rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                        defaultValue={lead.status}
                        name="status"
                      >
                        {leadStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">
                      Internal note
                      <textarea
                        className="focus-ring min-h-20 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                        maxLength={2000}
                        name="admin_note"
                        placeholder="Optional private follow-up note"
                      />
                    </label>
                    <button className="focus-ring w-full rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white" type="submit">
                      Save status
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
          {!leads?.length ? <p className="p-5 text-ink/60">No Atelier requests match this filter.</p> : null}
        </div>
      </section>
    </AppShell>
  );
}
