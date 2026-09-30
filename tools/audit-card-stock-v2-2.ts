import { createClient } from "@supabase/supabase-js";
import { evaluateIdeaCardV22 } from "../lib/idea-card/quality-v2-2";

const apply = process.argv.includes("--apply");
const rollback = process.argv.includes("--rollback");
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

type InventoryRow = { id: string; idea_id: string; status: string; metadata: Record<string, unknown> | null };

async function main() {
  if (rollback) {
    const { data, error } = await supabase.from("idea_inventory").select("id,idea_id,status,metadata").eq("status", "paused");
    if (error) throw error;
    const rows = (data ?? []).filter((row) => row.metadata?.pause_reason === "quality_quarantine_v2_2") as InventoryRow[];
    console.log(JSON.stringify({ mode: apply ? "rollback_apply" : "rollback_dry_run", eligible: rows.length }, null, 2));
    if (apply) {
      for (const row of rows) {
        const metadata = { ...(row.metadata ?? {}), pause_reason: null, quality_quarantine_rolled_back_at: new Date().toISOString() };
        const { error: updateError } = await supabase.from("idea_inventory").update({ status: "available", metadata }).eq("id", row.id);
        if (updateError) throw updateError;
      }
    }
    return;
  }

  const [{ data: inventory, error: inventoryError }, { data: used, error: usedError }] = await Promise.all([
    supabase.from("idea_inventory").select("id,idea_id,status,metadata").eq("status", "available"),
    supabase.from("idea_box_items").select("idea_id"),
  ]);
  if (inventoryError) throw inventoryError;
  if (usedError) throw usedError;
  const usedIds = new Set((used ?? []).map((row) => row.idea_id));
  const available = (inventory ?? []).filter((row) => !usedIds.has(row.idea_id)) as InventoryRow[];
  const ideaIds = available.map((row) => row.idea_id);
  const [{ data: cards, error: cardError }, { data: checks, error: checkError }] = await Promise.all([
    ideaIds.length ? supabase.from("idea_cards").select("idea_id,card").in("idea_id", ideaIds) : Promise.resolve({ data: [], error: null }),
    ideaIds.length ? supabase.from("idea_quality_checks").select("idea_id,embedding_duplicate_score,semantic_duplicate_score,embedding_model,embedding_model_version").in("idea_id", ideaIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (cardError) throw cardError;
  if (checkError) throw checkError;
  const cardByIdea = new Map((cards ?? []).map((row) => [row.idea_id, row.card]));
  const checkByIdea = new Map((checks ?? []).map((row) => [row.idea_id, row]));
  const quarantines: Array<{ inventory: InventoryRow; reasons: string[]; score: number }> = [];

  for (const row of available) {
    const card = cardByIdea.get(row.idea_id);
    if (!card) continue;
    const check = checkByIdea.get(row.idea_id);
    const quality = evaluateIdeaCardV22(card, {
      semanticScore: check?.semantic_duplicate_score ?? check?.embedding_duplicate_score ?? null,
      embeddingModel: check?.embedding_model ?? null,
      embeddingModelVersion: check?.embedding_model_version ?? null,
    });
    if (quality.hardGateCodes.length || quality.decision === "reject") {
      quarantines.push({ inventory: row, reasons: quality.hardGateCodes.length ? quality.hardGateCodes : quality.issueCodes, score: quality.craftScore });
    }
  }

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry_run",
    scanned_available_unused: available.length,
    quarantine_count: quarantines.length,
    sample: quarantines.slice(0, 20).map((row) => ({ idea_id: row.inventory.idea_id, score: row.score, reasons: row.reasons })),
  }, null, 2));

  if (apply) {
    for (const item of quarantines) {
      const metadata = {
        ...(item.inventory.metadata ?? {}),
        pause_reason: "quality_quarantine_v2_2",
        quality_quarantine_at: new Date().toISOString(),
        quality_quarantine_reasons: item.reasons,
        quality_quarantine_score: item.score,
      };
      const { error } = await supabase.from("idea_inventory").update({ status: "paused", metadata }).eq("id", item.inventory.id).eq("status", "available");
      if (error) throw error;
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});