import Link from "next/link";
import { Activity, ArrowRight, ClipboardCheck, Flag, Gift, Inbox, PackageCheck, ShieldCheck, ShoppingBag, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { dateTime, money } from "@/lib/format";

function pct(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function MetricTile({
  accent = "ink",
  detail,
  icon: Icon,
  label,
  value,
}: {
  accent?: "ink" | "teal" | "coral" | "purple";
  detail: string;
  icon: typeof Activity;
  label: string;
  value: string | number;
}) {
  const accentClass = {
    ink: "bg-ink text-white",
    teal: "bg-teal text-white",
    coral: "bg-[#B42335] text-white",
    purple: "bg-[#5B2A86] text-white",
  }[accent];

  return (
    <div className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">{label}</p>
          <div className="mt-3 text-3xl font-semibold">{value}</div>
          <p className="mt-2 text-sm leading-6 text-ink/60">{detail}</p>
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const [
    { data: purchases },
    { data: users },
    { count: creatorCount },
    { count: paidPurchaseCount },
    { count: cardReportCount },
    { data: cardReports },
    { count: deliveryCount },
    { count: newAtelierCount },
    { data: inventoryRows },
  ] = await Promise.all([
    supabase.from("purchases").select("id,status,fulfillment_source,amount_usd_cents,created_at,box_products(name)").order("created_at", { ascending: false }).limit(8),
    supabase.from("profiles").select("id,display_name,role,created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "creator"),
    supabase.from("purchases").select("id", { count: "exact", head: true }).eq("status", "paid"),
    supabase.from("card_reports").select("id", { count: "exact", head: true }).eq("status", "under_review"),
    supabase.from("card_reports").select("id,user_id,idea_id,reason,status,created_at").eq("status", "under_review").order("created_at", { ascending: false }).limit(8),
    supabase.from("idea_box_deliveries").select("id", { count: "exact", head: true }).eq("status", "delivered"),
    supabase.from("atelier_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.rpc("inventory_health"),
  ]);
  const inventory = (inventoryRows ?? []) as Array<{ needs_generation: boolean }>;
  const readyRoutes = inventory.filter((row) => !row.needs_generation).length;
  const missingRoutes = inventory.length - readyRoutes;
  const revenueCents = (purchases ?? []).reduce((total, purchase) => total + Number(purchase.amount_usd_cents ?? 0), 0);

  return (
    <AppShell>
      <section className="mb-6 overflow-hidden rounded-md border border-ink/10 bg-ink text-white shadow-soft">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/45">Admin workspace</p>
            <h1 className="mt-2 text-4xl font-semibold">Operations command center</h1>
            <p className="mt-2 max-w-2xl leading-7 text-white/70">
              Watch inventory readiness, manage complimentary dossiers, handle brief reports, and collect private Atelier requests from one surface.
            </p>
          </div>
          <div className="rounded-md border border-white/12 bg-white/[0.055] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/75">
              <ShieldCheck className="h-4 w-4" />
              Launch readiness
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-2xl font-semibold">{pct(readyRoutes, inventory.length)}</div>
                <div className="text-white/45">routes ready</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{cardReportCount ?? 0}</div>
                <div className="text-white/45">reports waiting</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile accent="teal" detail={`${deliveryCount ?? 0} dossiers delivered into creator vaults`} icon={PackageCheck} label="Paid purchases" value={paidPurchaseCount ?? 0} />
        <MetricTile accent="ink" detail="Creators with active profiles" icon={Users} label="Creators" value={creatorCount ?? 0} />
        <MetricTile accent="ink" detail="Card quality reports waiting for an admin decision" icon={Flag} label="Card reports" value={cardReportCount ?? 0} />
        <MetricTile accent="coral" detail={`${missingRoutes} routes need attention`} icon={Activity} label="Inventory routes" value={`${readyRoutes}/${inventory.length || 0}`} />
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Link href="/admin/card-quality" className="group rounded-md border border-ink/10 bg-white p-5 font-semibold shadow-soft transition hover:-translate-y-0.5 focus-ring">
          <Sparkles className="mb-4 h-5 w-5 text-teal" />
          Card generation health
          <div className="mt-2 text-sm font-normal text-ink/55">Monitor V3 quality, diversity and qualification.</div>
        </Link>
        <Link href="/admin/inventory" className="group rounded-md border border-ink/10 bg-white p-5 font-semibold shadow-soft transition hover:-translate-y-0.5 focus-ring">
          <ClipboardCheck className="mb-4 h-5 w-5 text-teal" />
          Inventory health
          <div className="mt-2 text-sm font-normal text-ink/55">Check lane availability before traffic.</div>
        </Link>
        <Link href="/admin/users" className="group rounded-md border border-ink/10 bg-white p-5 font-semibold shadow-soft transition hover:-translate-y-0.5 focus-ring">
          <Gift className="mb-4 h-5 w-5 text-[#B42335]" />
          Users & complimentary dossiers
          <div className="mt-2 text-sm font-normal text-ink/55">Create creators or assign a complimentary brief.</div>
        </Link>
        <Link href="/admin/atelier-leads" className="group rounded-md border border-ink/10 bg-white p-5 font-semibold shadow-soft transition hover:-translate-y-0.5 focus-ring">
          <Inbox className="mb-4 h-5 w-5 text-[#5B2A86]" />
          Atelier requests
          <div className="mt-2 text-sm font-normal text-ink/55">{newAtelierCount ?? 0} new private requests.</div>
        </Link>
        <Link href="/admin#card-reports" className="group rounded-md border border-ink/10 bg-white p-5 font-semibold shadow-soft transition hover:-translate-y-0.5 focus-ring">
          <Flag className="mb-4 h-5 w-5 text-[#5B2A86]" />
          Card reports
          <div className="mt-2 text-sm font-normal text-ink/55">{cardReportCount ?? 0} cards under review.</div>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section id="card-reports" className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink/40">Card quality</p>
              <h2 className="mt-1 text-2xl font-semibold">Card reports</h2>
            </div>
            <StatusPill value={cardReportCount ? "under_review" : "available"} />
          </div>
          <div className="space-y-2">
            {cardReports?.map((report) => (
              <Link key={report.id} href={`/admin/card-reports/${report.id}`} className="group grid gap-3 rounded-md border border-ink/10 bg-paper p-4 transition hover:bg-mist focus-ring sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="font-semibold">Report {report.id.slice(0, 8)}</div>
                  <p className="mt-1 text-sm text-ink/50">{String(report.reason).replaceAll("_", " ")} / {dateTime(report.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill value={report.status} />
                  <ArrowRight className="h-4 w-4 text-ink/35 transition group-hover:translate-x-0.5 group-hover:text-ink" />
                </div>
              </Link>
            ))}
            {!cardReports?.length ? <p className="rounded-md border border-ink/10 bg-paper p-5 text-ink/60">No card reports waiting right now.</p> : null}
          </div>
        </section>

        <section className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink/40">Commercial snapshot</p>
          <h2 className="mt-1 text-2xl font-semibold">Recent checkout activity</h2>
          <div className="mt-5 rounded-md border border-ink/10 bg-paper p-4">
            <div className="text-sm text-ink/50">Visible recent revenue</div>
            <div className="mt-1 text-3xl font-semibold">{money(revenueCents)}</div>
          </div>
          <div className="mt-4 space-y-2">
            {purchases?.map((purchase) => {
              const product = Array.isArray(purchase.box_products) ? purchase.box_products[0] : purchase.box_products;
              return (
                <div key={purchase.id} className="flex items-center justify-between gap-3 border-t border-ink/10 py-3 first:border-t-0">
                  <div>
                    <div className="font-medium">{product?.name ?? purchase.fulfillment_source}</div>
                    <p className="text-sm text-ink/50">{dateTime(purchase.created_at)}</p>
                  </div>
                  <StatusPill value={purchase.status} />
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-ink/10 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Recent creators</h2>
            <ShoppingBag className="h-5 w-5 text-ink/35" />
          </div>
          {users?.map((user) => (
            <div key={user.id} className="flex items-center justify-between border-t border-ink/10 py-3 first:border-t-0">
              <div>
                <span className="font-medium">{user.display_name ?? user.id}</span>
                <p className="text-sm text-ink/45">{dateTime(user.created_at)}</p>
              </div>
              <StatusPill value={user.role} />
            </div>
          ))}
        </section>
        <section className="rounded-md border border-ink/10 bg-ink p-5 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/40">Operator notes</p>
          <h2 className="mt-2 text-2xl font-semibold">What to watch today</h2>
          <div className="mt-5 space-y-3 text-sm leading-6 text-white/70">
            <p>Keep routes available before sending traffic to checkout.</p>
            <p>Resolve card reports quickly so creators keep momentum with useful briefs.</p>
            <p>Atelier requests are high-intent leads; answer them manually before adding checkout automation.</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
