#!/usr/bin/env python3
"""Validate requirement/task ledgers and detect unreviewed specification candidates."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

REQ_ID = re.compile(r"^REQ-S\d{2}-\d{4}$")
VALID_STATUS = {
    "not_started", "in_progress", "blocked", "implemented_unverified",
    "verified", "accepted_exception", "failed", "superseded",
}
VALID_DISPOSITION = {"mapped", "non_normative", "duplicate", "superseded"}


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--requirements", type=Path, required=True)
    parser.add_argument("--tasks", type=Path, required=True)
    parser.add_argument("--candidates", type=Path, required=True)
    args = parser.parse_args()

    errors: list[str] = []
    req_doc = load(args.requirements)
    task_doc = load(args.tasks)
    cand_doc = load(args.candidates)

    requirements = req_doc.get("requirements", [])
    seen_ids: set[str] = set()
    source_lines: set[int] = set()

    for i, req in enumerate(requirements):
        rid = req.get("requirement_id")
        if not isinstance(rid, str) or not REQ_ID.match(rid):
            errors.append(f"requirements[{i}] invalid requirement_id: {rid!r}")
        elif rid in seen_ids:
            errors.append(f"duplicate requirement_id: {rid}")
        else:
            seen_ids.add(rid)
        if req.get("implementation_status") not in VALID_STATUS:
            errors.append(f"{rid}: invalid implementation_status")
        if req.get("verification_status") not in VALID_STATUS:
            errors.append(f"{rid}: invalid verification_status")
        if not str(req.get("source_text", "")).strip():
            errors.append(f"{rid}: source_text is required")
        start = req.get("source_line_start")
        end = req.get("source_line_end")
        if not isinstance(start, int) or start <= 0:
            errors.append(f"{rid}: valid source_line_start is required")
        else:
            if not isinstance(end, int) or end < start:
                errors.append(f"{rid}: valid source_line_end is required")
            else:
                source_lines.update(range(start, end + 1))
        if req.get("verification_status") == "verified" and not req.get("evidence_artifacts"):
            errors.append(f"{rid}: verified without evidence_artifacts")

    task_ids: set[str] = set()
    for i, task in enumerate(task_doc.get("tasks", [])):
        tid = task.get("task_id")
        if not isinstance(tid, str) or not tid.strip():
            errors.append(f"tasks[{i}] missing task_id")
        elif tid in task_ids:
            errors.append(f"duplicate task_id: {tid}")
        else:
            task_ids.add(tid)
        for rid in task.get("requirement_ids", []):
            if rid not in seen_ids:
                errors.append(f"{tid}: unknown requirement_id {rid}")

    for candidate in cand_doc.get("candidates", []):
        line = candidate.get("source_line_start")
        disposition = candidate.get("disposition")
        mapped = candidate.get("mapped_requirement_ids", [])
        if disposition == "mapped":
            if not mapped:
                errors.append(f"candidate line {line}: mapped without requirement IDs")
            for rid in mapped:
                if rid not in seen_ids:
                    errors.append(f"candidate line {line}: maps to unknown {rid}")
        elif disposition not in VALID_DISPOSITION:
            errors.append(f"candidate line {line}: unreviewed or invalid disposition {disposition!r}")
        if disposition == "mapped" and isinstance(line, int) and line not in source_lines:
            errors.append(f"candidate line {line}: mapped but no requirement source range covers it")

    if errors:
        print("LEDGER VALIDATION FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    print("LEDGER VALIDATION PASSED")
    print(f"Requirements: {len(requirements)}")
    print(f"Tasks: {len(task_doc.get('tasks', []))}")
    print(f"Candidates: {len(cand_doc.get('candidates', []))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
