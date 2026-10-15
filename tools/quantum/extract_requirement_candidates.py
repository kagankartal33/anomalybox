#!/usr/bin/env python3
"""Extract candidate normative requirements from the V4 Markdown specification.

This is a completeness aid, not a semantic substitute for human/agent review.
It emits line-addressable candidates so the requirement ledger can prove that
all MUST/MUST NOT/required/prohibited/checklist statements were considered.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

NORMATIVE = re.compile(
    r"\b(must|must not|required|prohibited|never|only when|cannot|may not|shall)\b",
    re.IGNORECASE,
)
CHECKBOX = re.compile(r"^\s*-\s*\[[ xX]\]\s+")
HEADING = re.compile(r"^(#{1,6})\s+(.+?)\s*$")


def stable_id(section: str, line_no: int, text: str) -> str:
    digest = hashlib.sha256(f"{section}|{line_no}|{text}".encode("utf-8")).hexdigest()[:10]
    return f"CAND-{line_no:05d}-{digest}"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("spec", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    lines = args.spec.read_text(encoding="utf-8").splitlines()
    section = "document-root"
    candidates: list[dict[str, object]] = []

    for index, raw in enumerate(lines, start=1):
        heading = HEADING.match(raw)
        if heading:
            section = heading.group(2)
            continue
        stripped = raw.strip()
        if not stripped:
            continue
        if NORMATIVE.search(stripped) or CHECKBOX.match(raw):
            candidates.append(
                {
                    "candidate_id": stable_id(section, index, stripped),
                    "source_line_start": index,
                    "source_line_end": index,
                    "source_section": section,
                    "source_text": stripped,
                    "disposition": "unreviewed",
                    "mapped_requirement_ids": [],
                    "notes": "",
                }
            )

    payload = {
        "specification": str(args.spec),
        "candidate_count": len(candidates),
        "warning": "Candidates require semantic review; false positives must be explicitly dispositioned, never silently deleted.",
        "candidates": candidates,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(candidates)} candidates to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
