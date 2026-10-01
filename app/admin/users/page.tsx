import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createCreatorUser, sendGiftBox } from "../actions";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ error?: string; gift?: string; created?: string }> }) {
  const params = await searchParams;
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const [{ data: users }, { data: products }, { data: categories }, { data: personas }] = await Promise.all([
    supabase.from("profiles").select("id,display_name,role,created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("box_products").select("slug,name").eq("enabled", true).order("price_usd_cents"),
    supabase.from("categories").select("slug,name").eq("enabled", true).order("sort_order").limit(500),
    supabase.from("creator_personas").select("slug,name").eq("enabled", true).order("sort_order"),
  ]);

  return (
    <AppShell>
      <section className="mb-6 rounded-md border border-ink/10 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink/40">Admin users</p>
        <h1 className="mt-2 text-4xl font-semibold">Users & complimentary dossiers</h1>
        <p className="mt-2 text-ink/60">Create creator accounts and send complimentary private dossiers from approved inventory.</p>
      </section>
      {params.error ? <div className="mb-4 rounded-md bg-coral/10 p-3 text-sm text-coral">{params.error}</div> : null}
      {params.gift ? <div className="mb-4 rounded-md bg-teal/10 p-3 text-sm text-teal">Complimentary dossier sent.</div> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="text-2xl font-semibold">Create creator</h2>
          <form action={createCreatorUser} className="mt-4 grid gap-3">
            <input className="focus-ring rounded-md border border-ink/15 px-3 py-3" name="display_name" placeholder="Display name" />
            <input className="focus-ring rounded-md border border-ink/15 px-3 py-3" name="email" type="email" placeholder="Email" required />
            <input className="focus-ring rounded-md border border-ink/15 px-3 py-3" name="password" type="password" placeholder="Temporary password" required />
            <input className="focus-ring rounded-md border border-ink/15 px-3 py-3" name="handle" placeholder="@instagram" />
            <input className="focus-ring rounded-md border border-ink/15 px-3 py-3" name="niche" placeholder="Niche" />
            <button className="focus-ring rounded-md bg-ink px-4 py-3 font-semibold text-white">Create user</button>
          </form>
        </section>
        <section className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="text-2xl font-semibold">Send complimentary dossier</h2>
          <form action={sendGiftBox} className="mt-4 grid gap-3">
            <select className="focus-ring rounded-md border border-ink/15 px-3 py-3" name="user_id" required>
              <option value="">Choose user</option>
              {users?.map((user) => <option key={user.id} value={user.id}>{user.display_name ?? user.id}</option>)}
            </select>
            <select className="focus-ring rounded-md border border-ink/15 px-3 py-3" name="box_product_slug" required>
              {products?.map((product) => <option key={product.slug} value={product.slug}>{product.name}</option>)}
            </select>
            <select className="focus-ring rounded-md border border-ink/15 px-3 py-3" name="category_slug" required>
              {categories?.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
            </select>
            <select className="focus-ring rounded-md border border-ink/15 px-3 py-3" name="persona_slug" required>
              {personas?.map((persona) => <option key={persona.slug} value={persona.slug}>{persona.name}</option>)}
            </select>
            <button className="focus-ring rounded-md bg-teal px-4 py-3 font-semibold text-white">Send private box from inventory</button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}