import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type InventoryRow = {
  category_slug: string;
  persona_slug: string;
  low_count: number;
  mid_count: number;
  high_count: number;
  needs_generation: boolean;
};

type BoxProduct = {
  slug: string;
  name: string;
  idea_count: number | null;
  allocation: Record<string, number> | null;
};

type Search = {
  category?: string;
  persona?: string;
  status?: string;
  product?: string;
  q?: string;
};

function totalStock(row: InventoryRow) {
  return Number(row.high_count || 0);
}

function canFulfillProduct(row: InventoryRow, product: BoxProduct | null) {
  if (!product?.allocation) return true;
  const allocation = product.allocation;
  for (const band of ["high"] as const) {
    const needed = Number(allocation[band] ?? 0);
    if (!needed) continue;
    const available = Number(row[`${band}_count`] ?? 0);
    if (available < needed) return false;
  }
  return true;
}

function firstParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";
}

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const query = (searchParams ? await searchParams : {}) as Search;
  const categoryFilter = firstParam(query.category).trim();
  const personaFilter = firstParam(query.persona).trim();
  const statusFilter = firstParam(query.status).trim() || "all";
  const productFilter = firstParam(query.product).trim();
  const textFilter = firstParam(query.q).trim().toLowerCase();

  const supabase = createSupabaseAdminClient();
  const [{ data }, { data: products }, { data: categoryRows }, { data: personaRows }] = await Promise.all([
    supabase.rpc("inventory_health", { p_category_slug: categoryFilter || null }),
    supabase.from("box_products").select("slug,name,idea_count,allocation").eq("enabled", true).order("price_usd_cents", { ascending: true }),
    supabase.from("categories").select("slug").eq("enabled", true).order("slug"),
    supabase.from("creator_personas").select("slug").eq("enabled", true).order("slug"),
  ]);

  const rows = ((data ?? []) as InventoryRow[]).map((row) => ({
    ...row,
    low_count: Number(row.low_count || 0),
    mid_count: Number(row.mid_count || 0),
    high_count: Number(row.high_count || 0),
    needs_generation: Boolean(row.needs_generation),
  }));

  const boxProducts = (products ?? []) as BoxProduct[];
  const selectedProduct = boxProducts.find((product) => product.slug === productFilter) ?? null;

  const categories = Array.from(new Set((categoryRows ?? []).map((row) => row.slug).filter(Boolean)));
  const personas = Array.from(new Set((personaRows ?? []).map((row) => row.slug).filter(Boolean)));

  let filtered = rows;
  if (categoryFilter) filtered = filtered.filter((row) => row.category_slug === categoryFilter);
  if (personaFilter) filtered = filtered.filter((row) => row.persona_slug === personaFilter);
  if (statusFilter === "needs_inventory") filtered = filtered.filter((row) => row.needs_generation);
  if (statusFilter === "available") filtered = filtered.filter((row) => !row.needs_generation);
  if (statusFilter === "empty") filtered = filtered.filter((row) => totalStock(row) === 0);
  if (selectedProduct) filtered = filtered.filter((row) => canFulfillProduct(row, selectedProduct));
  if (textFilter) {
    filtered = filtered.filter((row) =>
      `${row.category_slug} ${row.persona_slug}`.toLowerCase().includes(textFilter),
    );
  }

  const summary = {
    routes: filtered.length,
    available: filtered.filter((row) => !row.needs_generation).length,
    needs: filtered.filter((row) => row.needs_generation).length,
    empty: filtered.filter((row) => totalStock(row) === 0).length,
    totalCards: filtered.reduce((sum, row) => sum + totalStock(row), 0),
    productReady: selectedProduct
      ? filtered.filter((row) => canFulfillProduct(row, selectedProduct)).length
      : filtered.filter((row) => !row.needs_generation).length,
  };

  const topNeeds = [...filtered]
    .filter((row) => row.needs_generation || totalStock(row) === 0)
    .sort((a, b) => totalStock(a) - totalStock(b))
    .slice(0, 8);

  return (
    <AppShell>
      <section className="mb-6 rounded-md border border-ink/10 bg-white p-6 shadow-soft">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Link className="text-sm text-ink/60 underline underline-offset-2" href="/admin">Back to admin</Link>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-ink/60">Inventory</p>
            <h1 className="mt-2 text-4xl font-semibold">Inventory health</h1>
            <p className="mt-2 max-w-2xl text-ink/60">
              Filter lanes by category, persona, product readiness, and stock status. When a lane is unavailable, checkout stays closed until new cards are imported or generated.
            </p>
          </div>
        </div>

        <form className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5" method="get">
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
            Category
            <select className="focus-ring rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink" defaultValue={categoryFilter} name="category">
              <option value="">All categories</option>
              {categories.map((slug) => (
                <option key={slug} value={slug}>{slug}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
            Persona
            <select className="focus-ring rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink" defaultValue={personaFilter} name="persona">
              <option value="">All personas</option>
              {personas.map((slug) => (
                <option key={slug} value={slug}>{slug}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
            Status
            <select className="focus-ring rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink" defaultValue={statusFilter} name="status">
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="needs_inventory">Needs inventory</option>
              <option value="empty">Empty stock</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
            Product readiness
            <select className="focus-ring rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink" defaultValue={productFilter} name="product">
              <option value="">Any product</option>
              {boxProducts.map((product) => (
                <option key={product.slug} value={product.slug}>{product.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
            Search
            <input
              className="focus-ring rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
              defaultValue={textFilter}
              name="q"
              placeholder="category or persona"
              type="search"
            />
          </label>
          <div className="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-5">
            <button className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">
              Apply filters
            </button>
            <Link className="focus-ring rounded-md border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70" href="/admin/inventory">
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Routes shown", value: summary.routes },
          { label: "Available", value: summary.available },
          { label: "Needs inventory", value: summary.needs },
          { label: "Empty stock", value: summary.empty },
          { label: "Available cards", value: summary.totalCards },
        ].map((item) => (
          <div key={item.label} className="rounded-md border border-ink/10 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{item.value}</p>
          </div>
        ))}
      </section>

      {selectedProduct ? (
        <section className="mb-6 rounded-md border border-teal/20 bg-teal/5 p-4 text-sm text-ink/70">
          Showing lanes that can currently fulfill <span className="font-semibold text-ink">{selectedProduct.name}</span>
          {selectedProduct.allocation ? (
            <span>
              {" "}(needs {Number(selectedProduct.allocation.high ?? selectedProduct.idea_count ?? 0)} high cards)
            </span>
          ) : null}
          . Matching routes: <span className="font-semibold text-ink">{summary.productReady}</span>.
        </section>
      ) : null}

      {topNeeds.length ? (
        <section className="mb-6 rounded-md border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold">Priority restock</h2>
          <p className="mt-1 text-sm text-ink/60">Lowest-stock filtered routes that still need attention.</p>
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {topNeeds.map((row) => (
              <li key={`need-${row.category_slug}-${row.persona_slug}`} className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm">
                <span className="font-semibold">{row.category_slug}</span>
                <span className="text-ink/40"> / </span>
                <span>{row.persona_slug}</span>
                <span className="ml-2 text-ink/50">({totalStock(row)} cards)</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-mist">
            <tr>
              <th className="p-3">Category</th>
              <th className="p-3">Persona</th>
              <th className="p-3">Low</th>
              <th className="p-3">Mid</th>
              <th className="p-3">High</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              {boxProducts.length ? <th className="p-3">Products ready</th> : null}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 400).map((row) => {
              const readyProducts = boxProducts.filter((product) => canFulfillProduct(row, product)).map((product) => product.slug);
              return (
                <tr key={`${row.category_slug}-${row.persona_slug}`} className="border-t border-ink/10">
                  <td className="p-3 font-medium">{row.category_slug}</td>
                  <td className="p-3">{row.persona_slug}</td>
                  <td className="p-3 tabular-nums">{row.low_count}</td>
                  <td className="p-3 tabular-nums">{row.mid_count}</td>
                  <td className="p-3 tabular-nums">{row.high_count}</td>
                  <td className="p-3 tabular-nums font-semibold">{totalStock(row)}</td>
                  <td className="p-3"><StatusPill value={row.needs_generation ? "needs_inventory" : "available"} /></td>
                  {boxProducts.length ? (
                    <td className="p-3 text-xs text-ink/60">
                      {readyProducts.length ? readyProducts.join(", ") : "none"}
                    </td>
                  ) : null}
                </tr>
              );
            })}
            {!filtered.length ? (
              <tr>
                <td className="p-6 text-ink/60" colSpan={boxProducts.length ? 8 : 7}>
                  No inventory routes match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {filtered.length > 400 ? (
        <p className="mt-3 text-sm text-ink/60">Showing first 400 of {filtered.length} matching routes. Narrow filters for the rest.</p>
      ) : null}
    </AppShell>
  );
}
