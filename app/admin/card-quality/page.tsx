import Link from "next/link";
import { Activity, ArrowLeft, Database, ShieldCheck, Timer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { QUALIFICATION_CATEGORIES } from "@/lib/generation/qualification";
import { CREATIVE_TAXONOMY_VERSION, creativeRecipeSchema } from "@/lib/generation/creative-taxonomy";
import { PROMPT_VERSION } from "@/lib/generation/contracts";
import { QUALITY_GATE_VERSION } from "@/lib/idea-card/quality-v2-2";

export const dynamic = "force-dynamic";
type Json = Record<string, unknown>;
type Run = { id: string; status: string; stage: string | null; provider: string; model: string; latency_ms: number | null; token_usage: unknown; issue_counts: unknown; gate_results: unknown; metadata: unknown; created_at: string };

function object(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Json : {};
}
function weightedCount(rows: Json[]) {
  const result = new Map<string, number>();
  for (const row of rows) for (const [code, raw] of Object.entries(row)) {
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0) result.set(code, (result.get(code) ?? 0) + value);
  }
  return [...result.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
}
function count(values: string[]) {
  const result = new Map<string, number>();
  for (const value of values.filter(Boolean)) result.set(value, (result.get(value) ?? 0) + 1);
  return [...result.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
}
function percentile(values: number[], portion: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * portion) - 1)];
}
function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Activity }) {
  return <article className="rounded-md border border-ink/10 bg-white p-5 shadow-soft"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45"><Icon className="h-4 w-4" />{label}</div><p className="mt-3 text-3xl font-semibold text-ink">{value}</p><p className="mt-1 text-xs leading-5 text-ink/50">{detail}</p></article>;
}
function Distribution({ title, rows }: { title: string; rows: [string, number][] }) {
  const maximum = Math.max(1, ...rows.map(([, value]) => value));
  return <section className="rounded-md border border-ink/10 bg-white p-5 shadow-soft"><h2 className="text-sm font-semibold uppercase tracking-[0.13em] text-ink/55">{title}</h2>{rows.length ? <ol className="mt-4 space-y-3">{rows.slice(0, 12).map(([label, value]) => <li key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm"><div><span className="block truncate text-ink/70">{label.replaceAll("_", " ")}</span><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/8"><div className="h-full rounded-full bg-teal" style={{ width: `${Math.max(3, value / maximum * 100)}%` }} /></div></div><strong className="tabular-nums text-ink">{value}</strong></li>)}</ol> : <p className="mt-4 text-sm text-ink/50">No V3 recipe data yet.</p>}</section>;
}

export default async function CardQualityPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const [{ data: runRows, error: runError }, { data: candidates, error: candidateError }, { data: profiles, error: profileError }] = await Promise.all([
    supabase.from("idea_generation_runs").select("id,status,stage,provider,model,latency_ms,token_usage,issue_counts,gate_results,metadata,created_at").eq("prompt_version", PROMPT_VERSION).order("created_at", { ascending: false }).limit(500),
    supabase.from("idea_candidates").select("id,status,decision_trace,created_at").eq("decision_trace->generation->>taxonomy_version", CREATIVE_TAXONOMY_VERSION).order("created_at", { ascending: false }).limit(2000),
    supabase.from("idea_model_profiles").select("id,profile_slug,provider,model,enabled,qualification_status,qualified_prompt_version,qualified_quality_gate_version,qualification_metrics").order("profile_slug"),
  ]);
  if (runError) throw runError;
  if (candidateError) throw candidateError;
  if (profileError) throw profileError;
  const runs = (runRows ?? []) as Run[];
  const recipes = (candidates ?? []).flatMap((candidate) => {
    const parsed = creativeRecipeSchema.safeParse(object(object(candidate.decision_trace).generation).creative_recipe);
    return parsed.success ? [parsed.data] : [];
  });
  const issueRows = weightedCount(runs.map((run) => object(run.issue_counts)));
  const latencies = runs.flatMap((run) => {
    if (run.latency_ms === null || run.latency_ms === undefined) return [];
    const value = Number(run.latency_ms);
    return Number.isFinite(value) && value >= 0 ? [value] : [];
  });
  const inputTokens = runs.reduce((sum, run) => sum + Number(object(run.token_usage).inputTokens ?? 0), 0);
  const outputTokens = runs.reduce((sum, run) => sum + Number(object(run.token_usage).outputTokens ?? 0), 0);
  const reportedCost = runs.reduce((sum, run) => sum + Number(object(run.metadata).estimated_cost_usd ?? object(run.gate_results).estimated_cost_usd ?? 0), 0);
  const approvedProfiles = (profiles ?? []).filter((profile) => profile.enabled && profile.qualification_status === "approved" && profile.qualified_prompt_version === PROMPT_VERSION && profile.qualified_quality_gate_version === QUALITY_GATE_VERSION);
  const categoryCoverage = new Set<string>();
  for (const profile of approvedProfiles) {
    const counts = object(object(profile.qualification_metrics).category_counts);
    for (const category of QUALIFICATION_CATEGORIES) if (Number(counts[category] ?? 0) >= 50) categoryCoverage.add(category);
  }
  const pending = runs.filter((run) => ["queued", "running"].includes(run.status) || run.stage === "awaiting_embedding").length;
  const p95 = percentile(latencies, .95);

  return <AppShell><main className="mx-auto max-w-7xl pb-16">
    <Link href="/admin" className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Admin workspace</Link>
    <header className="mt-6 rounded-md border border-ink/10 bg-ink p-6 text-white shadow-soft"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Automatic quality operations</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold">Card generation health</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">V3 recipe coverage, deterministic rejects, model latency and qualification evidence. No human approval or creator-facing score is used.</p></div><p className="rounded-md border border-white/15 bg-white/[0.06] px-3 py-2 text-xs text-white/60">{PROMPT_VERSION}<br />{QUALITY_GATE_VERSION}</p></div></header>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Generation summary">
      <Metric label="Recent runs" value={String(runs.length)} detail={`${pending} queued, running or awaiting embedding`} icon={Activity} />
      <Metric label="Latency p95" value={p95 === null ? "—" : `${Math.round(p95 / 100) / 10}s`} detail={latencies.length ? `Average ${Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length / 100) / 10}s` : "No completed latency samples"} icon={Timer} />
      <Metric label="Model usage" value={(inputTokens + outputTokens).toLocaleString("en-US")} detail={`${inputTokens.toLocaleString("en-US")} input · ${outputTokens.toLocaleString("en-US")} output tokens`} icon={Database} />
      <Metric label="Qualification" value={`${categoryCoverage.size}/12`} detail={`${approvedProfiles.length} approved V3 profile${reportedCost > 0 ? ` · $${reportedCost.toFixed(2)} reported` : " · provider cost not reported"}`} icon={ShieldCheck} />
    </section>
    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Creative recipe distributions"><Distribution title="Hook type" rows={count(recipes.map((recipe) => recipe.hookTypeId))} /><Distribution title="Genre" rows={count(recipes.map((recipe) => recipe.genreId))} /><Distribution title="Emotion arc" rows={count(recipes.map((recipe) => recipe.emotionArcId))} /><Distribution title="Vibe" rows={count(recipes.map((recipe) => recipe.vibePresetId))} /></section>
    <section className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"><Distribution title="Reject and refine reasons" rows={issueRows} /><section className="rounded-md border border-ink/10 bg-white p-5 shadow-soft"><h2 className="text-sm font-semibold uppercase tracking-[0.13em] text-ink/55">Model qualification</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-ink/10 text-xs uppercase tracking-[0.1em] text-ink/45"><tr><th className="pb-3 pr-4">Profile</th><th className="pb-3 pr-4">Model</th><th className="pb-3">State</th></tr></thead><tbody>{(profiles ?? []).map((profile) => { const current = profile.qualified_prompt_version === PROMPT_VERSION && profile.qualified_quality_gate_version === QUALITY_GATE_VERSION; const approved = profile.enabled && profile.qualification_status === "approved" && current; return <tr key={profile.id} className="border-b border-ink/8 last:border-0"><td className="py-3 pr-4 font-medium text-ink">{profile.profile_slug}</td><td className="py-3 pr-4 text-ink/60">{profile.provider}/{profile.model}</td><td className="py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${approved ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{approved ? "approved" : "shadow"}</span></td></tr>; })}</tbody></table></div></section></section>
  </main></AppShell>;
}