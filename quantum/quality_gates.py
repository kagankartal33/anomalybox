"""
Quality scorecard + hard gates (Section 15) for SEO package pages.
"""
from __future__ import annotations

import re
from pathlib import Path

from quantum.evidence_ledger import EvidenceLedger
from quantum.models import PageEvaluation
from quantum.page_justification import JustificationResult, justify_page


def evaluate_page(
    page: dict,
    body: str,
    corpus_bodies: dict[str, str],
    ledger: EvidenceLedger | None = None,
) -> PageEvaluation:
    page_id = page.get("id") or page.get("slug")
    just = justify_page(page, {**corpus_bodies, page["slug"]: body})

    hard: list[str] = []
    repairs: list[str] = []

    if not just.approved:
        hard.extend([r for r in just.reasons if r != "justified" and not r.endswith("_warn") and "warn:" not in r])
    for r in just.reasons:
        if "warn" in r:
            repairs.append(r)

    # technical readiness signals
    if not page.get("datePublished") and not page.get("dateModified"):
        hard.append("missing_bot_dates")
    if not page.get("image"):
        hard.append("missing_featured_image")
    if not page.get("description") or len(page.get("description", "")) < 50:
        repairs.append("enrich_meta_description")

    # evidence hard gates if ledger provided
    evidence_score = 85.0
    if ledger is not None:
        failures = ledger.hard_gate_failures(page_id=page_id)
        hard.extend(failures)
        metrics = ledger.coverage_metrics(page_id=page_id)
        # Editorial how-to pages may have zero registered claims — score neutrally with repair note.
        if metrics["total_claims"] == 0:
            # No material claims asserted in ledger: treat as "not applicable" evidence (82 floor)
            evidence_score = 82.0
            repairs.append("register_material_claims_in_evidence_ledger_if_asserting_facts")
        else:
            evidence_score = 100.0 * float(metrics["material_claim_support_rate"])

    # dimensions (0-100)
    task = 90.0 if re.search(r"Quick answer|Next step", body, re.I) else 70.0
    if just.word_count >= 600:
        task += 5
    distinct = just.distinct_value_score * 100
    intent = 90.0 if just.has_intent and just.has_audience else 60.0
    editorial = 88.0 if re.search(r"Frequently asked", body, re.I) else 72.0
    # site graph: prefer pages that have related links generated
    site_graph = 80.0 if page.get("path") else 50.0
    try:
        from pathlib import Path
        import json as _json

        links_path = Path(__file__).resolve().parents[1] / "lib" / "seo-package-links.json"
        if links_path.exists():
            g = _json.loads(links_path.read_text(encoding="utf-8")).get("links", {})
            n = len(g.get(page.get("slug"), []))
            site_graph = 92.0 if n >= 3 else 75.0 if n >= 1 else 55.0
    except Exception:
        pass
    technical = 90.0 if page.get("datePublished") and page.get("image") else 65.0
    accessibility = 82.0 if page.get("imageAlt") else 50.0
    asset = 85.0 if page.get("image") else 40.0

    dims = {
        "evidence_and_accuracy": round(evidence_score, 2),
        "user_task_completion": round(min(100, task), 2),
        "distinct_value": round(distinct, 2),
        "intent_and_structure_fit": round(intent, 2),
        "editorial_quality": round(editorial, 2),
        "site_graph_fit": round(site_graph, 2),
        "technical_search_readiness": round(technical, 2),
        "accessibility": round(accessibility, 2),
        "asset_quality": round(asset, 2),
    }

    overall = (
        0.20 * dims["evidence_and_accuracy"]
        + 0.18 * dims["user_task_completion"]
        + 0.14 * dims["distinct_value"]
        + 0.12 * dims["intent_and_structure_fit"]
        + 0.10 * dims["editorial_quality"]
        + 0.08 * dims["site_graph_fit"]
        + 0.08 * dims["technical_search_readiness"]
        + 0.05 * dims["accessibility"]
        + 0.05 * dims["asset_quality"]
    )

    if hard:
        decision = "reject_hard_gate"
    elif overall >= 86:
        decision = "approve"
    elif overall >= 82:
        decision = "approve_with_minor_repairs"
    else:
        decision = "reject_score"

    return PageEvaluation(
        page_id=str(page_id),
        slug=page["slug"],
        path=page.get("path", ""),
        overall_score=round(overall, 2),
        decision=decision,
        hard_gate_failures=hard,
        dimensions=dims,
        required_repairs=repairs,
    )
