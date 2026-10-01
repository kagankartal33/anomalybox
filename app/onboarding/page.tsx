import { Compass, Gem, Instagram, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingLanePicker } from "@/components/OnboardingLanePicker";
import { requireUser } from "@/lib/auth";
import { saveOnboarding } from "./actions";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string; instagram?: string }> }) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: categories }, { data: personas }, { data: profile }, { data: creatorProfile }, { data: instagram }] = await Promise.all([
    supabase.from("categories").select("id,slug,name,family").eq("enabled", true).order("sort_order").limit(250),
    supabase.from("creator_personas").select("id,slug,name,description").eq("enabled", true).order("sort_order").limit(50),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("creator_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("linked_social_accounts").select("handle,connected_at").eq("user_id", user.id).eq("provider", "instagram").maybeSingle(),
  ]);

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-md border border-ink/10 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink/40">Creator lane</p>
          <h1 className="mt-2 text-4xl font-semibold">Tune your ViralBox fit.</h1>
          <p className="mt-3 max-w-2xl text-ink/60">These preferences shape box availability, card fit, and manual review context.</p>
          {params.error ? <div className="mt-4 rounded-md bg-coral/10 p-3 text-sm text-coral">{params.error}</div> : null}
          {params.instagram === "connected" ? <div className="mt-4 rounded-md bg-teal/10 p-3 text-sm text-teal">Instagram connection saved.</div> : null}
          <form action={saveOnboarding} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              Display name
              <input className="focus-ring rounded-md border border-ink/15 px-3 py-3 font-normal" name="display_name" defaultValue={profile?.display_name ?? user.email ?? ""} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Instagram handle
              <input className="focus-ring rounded-md border border-ink/15 px-3 py-3 font-normal" name="handle" defaultValue={instagram?.handle ?? creatorProfile?.handle ?? ""} placeholder="@creator" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Niche note
              <input className="focus-ring rounded-md border border-ink/15 px-3 py-3 font-normal" name="niche" defaultValue={creatorProfile?.niche ?? ""} placeholder="beauty, luxury lifestyle, travel..." />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Primary category
              <select className="focus-ring rounded-md border border-ink/15 px-3 py-3 font-normal" name="category_id" required>
                <option value="">Choose category</option>
                {categories?.map((category) => <option key={category.id} value={category.id}>{category.name} / {category.family}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Creator persona
              <select className="focus-ring rounded-md border border-ink/15 px-3 py-3 font-normal" name="persona_id">
                <option value="">Default persona</option>
                {personas?.map((persona) => <option key={persona.id} value={persona.id}>{persona.name}</option>)}
              </select>
            </label>
            <button className="focus-ring rounded-md bg-ink px-4 py-3 font-semibold text-white" type="submit">Save profile and continue to Store</button>
          </form>
        </section>
        <aside className="space-y-4">
          <div className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="font-semibold">Instagram connection</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">Connect Instagram through Meta OAuth. Automatic posting is not enabled in this phase.</p>
            <a className="mt-4 flex items-center justify-center gap-2 rounded-md border border-ink/15 px-4 py-3 font-semibold hover:bg-mist focus-ring" href="/api/auth/instagram/connect">
              <Instagram className="h-4 w-4" />
              Connect Instagram / Meta
            </a>
          </div>
          <div className="rounded-md border border-ink/10 bg-ink p-5 text-white shadow-soft">
            <h2 className="font-semibold">Why this matters</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">A tighter creator lane helps ViralBox deliver cards that match your category, audience expectations, production reality, and brand tone.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}