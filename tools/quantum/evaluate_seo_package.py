"""
Evaluate all SEO package pages through QUANTUM justification + quality gates.
Evidence ledger hard-gates apply only when claims are registered.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from quantum.evidence_ledger import EvidenceLedger, seed_brand_sources  # noqa: E402
from quantum.quality_gates import evaluate_page  # noqa: E402
from quantum.state_machine import JobStore  # noqa: E402

REG = ROOT / "lib" / "seo-package-registry.json"
CONTENT = ROOT / "content" / "seo-package"
OUT = ROOT / "quantum" / "data" / "evaluations" / "seo_package_eval.json"


def main() -> int:
    pages = json.loads(REG.read_text(encoding="utf-8"))["pages"]
    bodies = {
        p["slug"]: (CONTENT / f"{p['slug']}.md").read_text(encoding="utf-8")
        if (CONTENT / f"{p['slug']}.md").exists()
        else ""
        for p in pages
    }
    ledger = EvidenceLedger()
    if not ledger.list_sources():
        seed_brand_sources(ledger)

    jobs = JobStore()
    results = []
    for page in pages:
        job = jobs.create(page_id=str(page.get("id") or page["slug"]), slug=page["slug"])
        # advance through justification-related states for audit trail
        if job.state == "DISCOVERED":
            jobs.transition(job.job_id, "TRIAGED", actor="evaluate_seo_package", reason="batch_eval")
            job = jobs.get(job.job_id)  # type: ignore
        if job and job.state == "TRIAGED":
            # justification outcome decides next hop
            pass

        ev = evaluate_page(page, bodies[page["slug"]], bodies, ledger=ledger)
        if ev.decision.startswith("approve"):
            if job and job.state == "TRIAGED":
                jobs.transition(job.job_id, "JUSTIFIED", actor="evaluate_seo_package", reason=ev.decision)
        else:
            if job and job.state == "TRIAGED":
                # keep blocked rather than rejected for repairable score issues
                if ev.decision == "reject_hard_gate":
                    jobs.transition(job.job_id, "BLOCKED", actor="evaluate_seo_package", reason=";".join(ev.hard_gate_failures[:3]) or ev.decision)
                else:
                    jobs.transition(job.job_id, "BLOCKED", actor="evaluate_seo_package", reason=ev.decision)

        results.append(ev.to_dict())

    OUT.parent.mkdir(parents=True, exist_ok=True)
    summary = {
        "count": len(results),
        "approve": sum(1 for r in results if r["decision"] == "approve"),
        "approve_with_minor_repairs": sum(1 for r in results if r["decision"] == "approve_with_minor_repairs"),
        "reject_score": sum(1 for r in results if r["decision"] == "reject_score"),
        "reject_hard_gate": sum(1 for r in results if r["decision"] == "reject_hard_gate"),
        "avg_score": round(sum(r["overall_score"] for r in results) / max(len(results), 1), 2),
        "results": results,
    }
    OUT.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Evaluated {summary['count']} pages → {OUT}")
    print(
        f"approve={summary['approve']} minor={summary['approve_with_minor_repairs']} "
        f"reject_score={summary['reject_score']} hard={summary['reject_hard_gate']} avg={summary['avg_score']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
