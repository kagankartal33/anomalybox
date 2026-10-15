#!/usr/bin/env python3
"""Score compact reference candidates and approve safe, useful design examples."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = ROOT / "manifests" / "candidate_manifest.jsonl"
APPROVED = ROOT / "manifests" / "approved_manifest.jsonl"
REJECTED = ROOT / "manifests" / "rejected_manifest.jsonl"
PROVENANCE = ROOT / "manifests" / "provenance.csv"

GOOD_WORDS = {
    "clean",
    "minimal",
    "clear",
    "simple",
    "spacious",
    "responsive",
    "hero",
    "navigation",
    "cta",
    "product",
    "pricing",
    "service",
    "portfolio",
    "elegant",
    "modern",
}
BAD_WORDS = {
    "clutter",
    "busy",
    "overlapping",
    "tiny",
    "low contrast",
    "complex",
    "crowded",
    "banner",
    "ads",
}


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"Missing {path}. Run discover_webui_candidates.py first.")
    with path.open("r", encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def score(record: dict[str, Any]) -> tuple[dict[str, int], list[str], list[str]]:
    desc = (record.get("description") or "").lower()
    element_count = int(record.get("element_count") or 0)
    styles = set(record.get("visual_style") or [])
    archetype = record.get("page_archetype") or "other"

    good_hits = sum(1 for word in GOOD_WORDS if word in desc)
    bad_hits = sum(1 for word in BAD_WORDS if word in desc)

    hierarchy = 3 + ("hero" in desc) + ("navigation" in desc) - min(bad_hits, 2)
    typography = 3 + ("typography" in desc or "headline" in desc) + ("minimal" in desc) - ("tiny" in desc)
    whitespace = 3 + ("clean" in desc or "spacious" in desc or "minimal" in desc) - ("crowded" in desc)
    marketing = 3 + ("cta" in desc or "call to action" in desc) + (archetype in {"product", "pricing", "saas", "service"})
    responsiveness = 4 if record.get("viewport") == "desktop" else 3
    originality = 4 + ("premium_minimal" in styles or "editorial" in styles) - min(bad_hits, 2)

    if element_count < 55:
        hierarchy -= 1
        marketing -= 1
    if element_count > 220:
        whitespace -= 1

    scores = {
        "hierarchy": max(1, min(5, int(hierarchy))),
        "typography": max(1, min(5, int(typography))),
        "whitespace_grid": max(1, min(5, int(whitespace))),
        "marketing_clarity": max(1, min(5, int(marketing))),
        "responsiveness": max(1, min(5, int(responsiveness))),
        "originality_safety": max(1, min(5, int(originality))),
    }

    principles = [
        "Lead with one specific outcome before secondary details.",
        "Use disciplined spacing and a visible container grid.",
        "Keep the primary CTA dominant and avoid competing actions.",
    ]
    if archetype == "pricing":
        principles.append("Place proof or risk reduction close to the purchase decision.")
    if "editorial" in styles:
        principles.append("Use editorial rhythm to make premium content feel curated rather than crowded.")
    if "modern_tech" in styles:
        principles.append("Show product structure without filling the page with generic dashboard cards.")

    reject_reasons: list[str] = []
    if bad_hits >= 2:
        reject_reasons.append("description suggests clutter or readability risk")
    if element_count < 35 or element_count > 260:
        reject_reasons.append("element count outside protocol bounds")
    if not record.get("image_src"):
        reject_reasons.append("missing screenshot reference")

    return scores, principles, reject_reasons


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--approve-limit", type=int, default=40)
    parser.add_argument("--threshold", type=int, default=21)
    args = parser.parse_args()

    records = load_jsonl(CANDIDATES)
    approved: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []

    for record in records:
        scores, principles, reject_reasons = score(record)
        total = sum(scores.values())
        enriched = {
            "reference_id": f"webui_{len(approved) + len(rejected) + 1:04d}",
            **record,
            "scores": scores,
            "score_total": total,
            "derived_principles": principles,
            "do_not_copy": ["Brand name, logo, colors, exact copy, iconography, component geometry, source code."],
        }
        if total >= args.threshold and not reject_reasons and len(approved) < args.approve_limit:
            approved.append(enriched)
        else:
            enriched["reject_reasons"] = reject_reasons or [f"score below threshold ({total}/{args.threshold})"]
            rejected.append(enriched)

    ROOT.joinpath("manifests").mkdir(parents=True, exist_ok=True)
    with APPROVED.open("w", encoding="utf-8") as fh:
        for record in approved:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
    with REJECTED.open("w", encoding="utf-8") as fh:
        for record in rejected:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
    with PROVENANCE.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=[
                "reference_id",
                "dataset",
                "sample_id",
                "source_name",
                "source_url",
                "license_review_status",
                "retrieved_at",
                "score_total",
            ],
        )
        writer.writeheader()
        for record in approved:
            writer.writerow({key: record.get(key, "") for key in writer.fieldnames})

    print(f"Approved {len(approved)} references; rejected {len(rejected)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
