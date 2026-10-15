"""
Bootstrap REQUIREMENTS.json + TASKS.json from REQUIREMENT_CANDIDATES.json
and the phase runbook seed tasks. Completeness-oriented for P00.

Disposition:
  - Each candidate becomes mapped to REQ-S{section:02d}-{seq:04d}
  - False-positive heuristic: pure heading-like or purely descriptive may be non_normative
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CAND = ROOT / ".agent" / "REQUIREMENT_CANDIDATES.json"
REQ_OUT = ROOT / ".agent" / "REQUIREMENTS.json"
TASK_OUT = ROOT / ".agent" / "TASKS.json"

SECTION_NUM = re.compile(r"^(\d+)\.")
NON_NORM = re.compile(
    r"^(example|for example|such as|note:|warning:|```|#+ |\|---|the result is|this section)",
    re.I,
)


def section_number(section: str) -> int:
    m = SECTION_NUM.match(section.strip())
    if m:
        return int(m.group(1))
    # named sections without number
    key = section.lower()
    if "appendix" in key:
        return 90
    if "executive" in key:
        return 0
    return 0


def main() -> int:
    cand_doc = json.loads(CAND.read_text(encoding="utf-8"))
    candidates = cand_doc["candidates"]

    requirements = []
    seq_by_section: dict[int, int] = {}
    line_to_req: dict[int, str] = {}

    for c in candidates:
        text = str(c.get("source_text", "")).strip()
        section = str(c.get("source_section", "document-root"))
        line = int(c["source_line_start"])
        snum = section_number(section)

        if NON_NORM.search(text) and not re.search(r"\b(must|shall|required|prohibited|never)\b", text, re.I):
            c["disposition"] = "non_normative"
            c["mapped_requirement_ids"] = []
            c["notes"] = "Heuristic non-normative; review if incorrectly classified."
            continue

        seq_by_section[snum] = seq_by_section.get(snum, 0) + 1
        rid = f"REQ-S{snum:02d}-{seq_by_section[snum]:04d}"
        line_to_req[line] = rid
        c["disposition"] = "mapped"
        c["mapped_requirement_ids"] = [rid]
        c["notes"] = "Auto-mapped during P00 bootstrap from candidate extract."

        # partial credit for existing SEO package work (not verified)
        impl = "not_started"
        notes = []
        lower = text.lower()
        if any(k in lower for k in ["structured data", "schema", "json-ld"]):
            notes.append("Partial: package pages emit Article/Service JSON-LD.")
            impl = "implemented_unverified"
        if any(k in lower for k in ["canonical", "robots", "sitemap"]):
            notes.append("Partial: Next.js robots/sitemap/canonical present.")
            impl = "implemented_unverified"
        if "duplicate" in lower or "originality" in lower:
            notes.append("Partial: tools/originality_gate.py exists.")
            impl = "implemented_unverified"
        if "datepublished" in lower or "date modified" in lower or "dates" in lower and "match" in lower:
            notes.append("Partial: staggered datePublished/dateModified on SEO package pages.")
            impl = "implemented_unverified"

        requirements.append(
            {
                "requirement_id": rid,
                "section": section,
                "source_line_start": line,
                "source_line_end": int(c.get("source_line_end") or line),
                "source_text": text,
                "priority": "P0"
                if snum in {0, 1, 3, 4, 5, 15, 20, 45, 46, 48, 49, 50, 53, 54, 55, 56, 59, 60}
                or any(x in lower for x in ["must not", "cannot publish", "never", "hard gate", "tenant"])
                else "P1",
                "implementation_status": impl,
                "verification_status": "not_started",
                "evidence_artifacts": [],
                "implementation_notes": " ".join(notes),
                "candidate_id": c.get("candidate_id"),
            }
        )

    CAND.write_text(json.dumps(cand_doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    req_doc = {
        "specification_version": "4.0",
        "specification_file": "archive/source-packs/QUANTUM_GEMINI_IMPLEMENTATION_PACK/QUANTUM_GEMINI_IMPLEMENTATION_PACK/QUANTUM_WORLD_CLASS_ENGINE_GAP_AUDIT_V4_GEMINI_EXECUTION_EDITION.md",
        "bootstrap": "tools/quantum/bootstrap_ledgers_from_candidates.py",
        "instructions": [
            "Do not delete requirements; supersede only.",
            "No requirement may be verified without evidence_artifacts.",
            "Auto-mapped rows require human/agent semantic review over time.",
        ],
        "requirements": requirements,
    }
    REQ_OUT.write_text(json.dumps(req_doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Task ledger: P00 complete set + seeded future phases as not_started
    tasks = [
        {
            "task_id": "P00-T001",
            "title": "Create repository inventory without modifying product code",
            "phase": "P00",
            "status": "in_progress",
            "requirement_ids": [r["requirement_id"] for r in requirements if r["section"].startswith("47") or "Baseline" in r["section"] or "Mandatory Pre-Implementation" in r["section"]][:5]
            or ([requirements[0]["requirement_id"]] if requirements else []),
            "allowed_files_to_modify": [
                "docs/implementation-audit/*",
                ".agent/*",
            ],
            "acceptance_criteria": [
                "Repository root and runtime inventory recorded",
                "Baseline commands and exit codes recorded",
                "Requirement candidates extracted and dispositioned",
                "Ledgers validate",
                "No product code changed in this task",
            ],
            "required_evidence_artifacts": [
                "docs/implementation-audit/repository-inventory.md",
                "docs/implementation-audit/baseline-command-results.md",
                ".agent/REQUIREMENTS.json",
                ".agent/TASKS.json",
                ".agent/REQUIREMENT_CANDIDATES.json",
            ],
        },
        {
            "task_id": "P00-T002",
            "title": "Validate ledgers and freeze P00 exit criteria",
            "phase": "P00",
            "status": "not_started",
            "requirement_ids": [],
            "allowed_files_to_modify": [".agent/*", "docs/implementation-audit/*"],
            "acceptance_criteria": [
                "validate_agent_ledgers.py exits 0",
                "CURRENT_TASK points to next phase task",
            ],
            "required_evidence_artifacts": [
                "docs/implementation-audit/p00-completion.md",
            ],
        },
        {
            "task_id": "P01-T001",
            "title": "Add stable bootstrap Makefile targets for local mock path",
            "phase": "P01",
            "status": "not_started",
            "requirement_ids": [],
            "allowed_files_to_modify": ["Makefile", "package.json", "docs/operations/*", ".env.example", "README.md"],
            "acceptance_criteria": [
                "make help documents bootstrap/test/build",
                "make typecheck or npm equivalent documented",
            ],
        },
        {
            "task_id": "P07-T001",
            "title": "Implement filesystem Evidence Ledger with source and claim records",
            "phase": "P07",
            "status": "not_started",
            "requirement_ids": [r["requirement_id"] for r in requirements if "Evidence Ledger" in r["section"] or "Claim Record" in r["section"] or "Source Record" in r["section"]][:20],
            "allowed_files_to_modify": [
                "tools/quantum/**",
                "quantum/**",
                "tests/quantum/**",
                "docs/implementation-audit/**",
                ".agent/**",
            ],
            "acceptance_criteria": [
                "Can create source and claim records",
                "Unsupported critical claims fail verification",
                "Unit tests pass",
            ],
        },
        {
            "task_id": "P08-T001",
            "title": "Implement page justification / distinct-value gate over seo-package corpus",
            "phase": "P08",
            "status": "not_started",
            "requirement_ids": [r["requirement_id"] for r in requirements if "Page Justification" in r["section"] or "Distinct Value" in r["section"] or "duplicate" in r["source_text"].lower()][:20],
            "allowed_files_to_modify": [
                "tools/quantum/**",
                "quantum/**",
                "tests/quantum/**",
                ".agent/**",
            ],
        },
        {
            "task_id": "P10-T001",
            "title": "Implement quality scorecard hard gates for package pages",
            "phase": "P10",
            "status": "not_started",
            "requirement_ids": [r["requirement_id"] for r in requirements if "Hard Gate" in r["section"] or "Quality Scorecard" in r["section"] or "hard gate" in r["source_text"].lower()][:20],
            "allowed_files_to_modify": [
                "tools/quantum/**",
                "quantum/**",
                "tests/quantum/**",
                ".agent/**",
            ],
        },
    ]

    task_doc = {
        "specification_version": "4.0",
        "current_phase": "P00",
        "current_task": "P00-T001",
        "tasks": tasks,
    }
    TASK_OUT.write_text(json.dumps(task_doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    unreviewed = sum(1 for c in candidates if c.get("disposition") == "unreviewed")
    print(f"Requirements: {len(requirements)}")
    print(f"Candidates total: {len(candidates)} unreviewed: {unreviewed}")
    print(f"Wrote {REQ_OUT}")
    print(f"Wrote {TASK_OUT}")
    print(f"Updated {CAND}")
    return 0 if unreviewed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
