import { normalizeCardSections } from "@/lib/card-sections";

export function checklistFromIdeaCard(card: unknown) {
  return normalizeCardSections(card).map((section) => ({
    section: section.title,
    check_key: section.key,
    label: section.title,
    source_card_path: section.checklist_items.join(","),
    is_required: section.key !== "brand_lift",
    original_suggestion: section.source_payload,
    admin_look_for: section.what_good_looks_like,
  }));
}

export function creatorReportFromChecks(decision: string, overallFeedback: string, checks: Array<Record<string, unknown>>) {
  return {
    final_decision: decision,
    headline: decision === "ready_to_post"
      ? "Video is ready to post."
      : decision === "brand_safety_blocked"
      ? "Brand safety must be fixed before posting."
      : decision === "needs_reshoot"
      ? "Some critical sections need a reshoot."
      : "A focused revision will make this stronger.",
    overall_feedback: overallFeedback,
    sections: checks.reduce<Record<string, unknown[]>>((acc, check) => {
      const section = String(check.section);
      acc[section] ??= [];
      acc[section].push({
        label: check.label,
        status: check.status,
        evidence_summary: check.evidence_summary,
        revision_advice: check.revision_advice,
      });
      return acc;
    }, {}),
    raw_scores_visible: false,
    viral_success_guaranteed: false,
  };
}