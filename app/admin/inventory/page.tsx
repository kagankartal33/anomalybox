import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AdminInventoryPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.rpc("inventory_health");
  const rows = (data ?? []) as Array<{
    category_slug: string;
    persona_slug: string;
    low_count: number;
    mid_count: number;
    high_count: number;
    needs_generation: boolean;
  }>;

  return (
    <AppShell>
      <section className="mb-6 rounded-md border border-ink/10 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink/40">Inventory</p>
        <h1 className="mt-2 text-4xl font-semibold">Inventory health</h1>
        <p className="mt-2 text-ink/60">When a lane is unavailable, checkout stays closed until new cards are imported or generated.</p>
      </section>
      <div className="overflow-x-auto rounded-md border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-mist">
            <tr>
              <th className="p-3">Category</th>
              <th className="p-3">Persona</th>
              <th className="p-3">Low</th>
              <th className="p-3">Mid</th>
              <th className="p-3">High</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 300).map((row) => (
              <tr key={`${row.category_slug}-${row.persona_slug}`} className="border-t border-ink/10">
                <td className="p-3">{row.category_slug}</td>
                <td className="p-3">{row.persona_slug}</td>
                <td className="p-3">{row.low_count}</td>
                <td className="p-3">{row.mid_count}</td>
                <td className="p-3">{row.high_count}</td>
                <td className="p-3"><StatusPill value={row.needs_generation ? "needs_inventory" : "available"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}