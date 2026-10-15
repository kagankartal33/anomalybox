import { Compass, Gem, Instagram, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingLanePicker } from "@/components/OnboardingLanePicker";
import { requireUser } from "@/lib/auth";
import { saveOnboarding } from "./actions";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string; instagram?: string }> }) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: categories }, { data: personas }, { data: profile }, { data: creatorProfile }, { data: instagram }, { data: preferences }] = await Promise.all([
    supabase.from("categories").select("id,slug,name,family").eq("enabled", true).order("sort_order").limit(2000),
    supabase.from("creator_personas").select("id,slug,name,description,tags,metadata").eq("enabled", true).order("sort_order").limit(100),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("creator_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("linked_social_accounts").select("handle,connected_at").eq("user_id", user.id).eq("provider", "instagram").maybeSingle(),
    supabase.from("creator_category_preferences").select("category_id,persona_id,priority").eq("user_id", user.id).order("priority").limit(3),
  ]);
  const initialCategoryIds = (preferences ?? []).map((preference) => String(preference.category_id)).filter(Boolean).slice(0, 3);
  const initialPersonaId = String(preferences?.find((preference) => preference.persona_id)?.persona_id ?? personas?.[0]?.id ?? "");
  const productionCapacity = creatorProfile?.production_capacity as { cuisine_detail?: unknown } | null;
  const cuisineDetail = typeof productionCapacity?.cuisine_detail === "string" ? productionCapacity.cuisine_detail : "";

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-md border border-ink/10 bg-white shadow-soft">
          <div className="border-b border-ink/10 bg-[radial-gradient(circle_at_80%_0%,#F3E8FF_0%,#FFFFFF_38%,#FBFAF6_100%)] p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45 shadow-sm">
              <Gem className="h-3.5 w-3.5 text-[#5B2A86]" />
              Creator fit profile
            </div>
            <h1 className="mt-4 text-4xl font-semibold">Tune your Anomaly Box match.</h1>
            <p className="mt-3 max-w-2xl leading-7 text-ink/65">
              Select the lane your audience knows you for, then choose the creator mode that best describes how you show up on camera.
            </p>
          </div>
          <div className="p-6">
          {params.error ? <div className="mt-4 rounded-md bg-coral/10 p-3 text-sm text-coral">{params.error}</div> : null}
          {params.instagram === "connected" ? <div className="mt-4 rounded-md bg-teal/10 p-3 text-sm text-teal">Instagram connection saved.</div> : null}
          <form action={saveOnboarding} className="mt-6">
            <OnboardingLanePicker
              categories={categories ?? []}
              personas={personas ?? []}
              initialCategoryIds={initialCategoryIds}
              initialPersonaId={initialPersonaId}
              displayName={profile?.display_name ?? user.email ?? ""}
              handle={instagram?.handle ?? creatorProfile?.handle ?? ""}
              niche={creatorProfile?.niche ?? ""}
              cuisineDetail={cuisineDetail}
            />
          </form>
          </div>
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
          <div className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-teal text-white">
              <Compass className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-semibold">How matching works</h2>
            <div className="mt-4 space-y-4 text-sm leading-6 text-ink/65">
              <p><span className="font-semibold text-ink">Primary lane:</span> decides which stock pool new boxes use.</p>
              <p><span className="font-semibold text-ink">Support lanes:</span> guide tone and creative range.</p>
              <p><span className="font-semibold text-ink">Creator mode:</span> shapes camera rhythm, visual language, and audience promise.</p>
            </div>
          </div>
          <div className="rounded-md border border-ink/10 bg-ink p-5 text-white shadow-soft">
            <ShieldCheck className="h-5 w-5 text-white/70" />
            <h2 className="mt-4 font-semibold">Vault rule</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">Changing your match profile affects future purchases only. Creative briefs already secured in your vault keep the lane and mode they were delivered with.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
