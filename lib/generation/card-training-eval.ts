import { cardTrainingTarget, type CardSftRow } from "./card-training-dataset.ts";
import { evaluateIdeaCardV22 } from "../idea-card/quality-v2-2.ts";
import { objectRecord } from "./automatic-policy.ts";

/** Diagnostic generation eval, never a substitute for provider qualification. */
export function evaluateCardTrainingSamples(expected: CardSftRow[], samples: unknown[]) {
  const byId = new Map<string, unknown>();
  const duplicateIds = new Set<string>();
  const expectedIds = new Set(expected.map(row => row.meta.source_id));
  const unexpectedRows: number[] = [];
  samples.forEach((sample, index) => {
    const row = objectRecord(sample);
    if (typeof row.source_id !== "string" || !expectedIds.has(row.source_id)) { unexpectedRows.push(index + 1); return; }
    if (byId.has(row.source_id)) duplicateIds.add(row.source_id);
    byId.set(row.source_id, row.output);
  });
  const results = expected.map(row => {
    const id = row.meta.source_id;
    if (!byId.has(id)) return { source_id: id, score: null, codes: ["missing_generation"] };
    if (duplicateIds.has(id)) return { source_id: id, score: null, codes: ["duplicate_generation_id"] };
    try {
      const value = byId.get(id);
      const card = cardTrainingTarget(typeof value === "string" ? JSON.parse(value) : value);
      const target = JSON.parse(row.messages.at(-1)!.content);
      const gate = evaluateIdeaCardV22(card);
      const codes = [...gate.hardGateCodes, ...gate.issueCodes, ...gate.humanReviewReasons];
      if (gate.decision !== "approve") codes.push("quality_not_approved");
      if (["category", "personaSlug", "platform", "durationSeconds", "hookId", "shootFormat"].some(key => card[key] !== target[key])) codes.push("brief_contract_mismatch");
      return { source_id: id, score: gate.craftScore, codes: [...new Set(codes)] };
    } catch { return { source_id: id, score: null, codes: ["invalid_generation_json_or_schema"] }; }
  });
  const passed = results.filter(row => row.codes.length === 0).length;
  return {
    mode: "heldout_generation_diagnostic", expected_count: expected.length, supplied_count: samples.length,
    passed_count: passed, pass_rate: passed / Math.max(1, expected.length), unexpected_rows: unexpectedRows,
    diagnostic_passed: expected.length > 0 && passed === expected.length && unexpectedRows.length === 0,
    model_qualified: false, semantic_duplicate_rate: null,
    next_gate: "Run independent critic, global semantic dedup and model:qualify-v2.2 before publication.", results,
  };
}