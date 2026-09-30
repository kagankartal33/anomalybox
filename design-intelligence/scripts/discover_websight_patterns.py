#!/usr/bin/env python3
"""Extract compact WebSight pattern notes without saving raw code or full datasets."""

from __future__ import annotations

import argparse
import json
import re
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "manifests" / "websight_pattern_notes.jsonl"
DATASET = "HuggingFaceM4/WebSight"
CONFIG = "v0.2"
SPLIT = "train"
API = "https://datasets-server.huggingface.co"


def fetch_json(url: str, timeout: int = 75) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": "ViralBoxDesignIntelligence/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def rows_url(offset: int, length: int) -> str:
    return f"{API}/rows?{urllib.parse.urlencode({'dataset': DATASET, 'config': CONFIG, 'split': SPLIT, 'offset': offset, 'length': length})}"


def count_tags(html: str, tag: str) -> int:
    return len(re.findall(rf"<\s*{tag}\b", html, flags=re.IGNORECASE))


def has_any(text: str, words: list[str]) -> bool:
    lower = text.lower()
    return any(word in lower for word in words)


def classify_pattern(idea: str, html: str) -> str:
    source = f"{idea} {html}".lower()
    if has_any(source, ["pricing", "plan", "subscription"]):
        return "pricing_comparison"
    if has_any(source, ["e-commerce", "ecommerce", "store", "product", "checkout"]):
        return "commerce_product_flow"
    if has_any(source, ["hero", "full-width", "tagline", "header image"]):
        return "hero_composition"
    if has_any(source, ["navigation", "menu", "footer"]):
        return "navigation_footer_structure"
    if has_any(source, ["portfolio", "gallery", "agency", "case"]):
        return "visual_portfolio_grid"
    if has_any(source, ["form", "contact", "newsletter"]):
        return "conversion_form"
    return "section_structure"


def quality_gate(idea: str, html: str) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    if len(idea.strip()) < 40:
        reasons.append("idea too short")
    if has_any(idea, ["rotating carousel", "bright", "vibrant color palette"]) and not has_any(idea, ["minimal", "clean"]):
        reasons.append("likely decorative or generic")
    if count_tags(html, "a") > 18:
        reasons.append("too many navigation links")
    if count_tags(html, "section") + count_tags(html, "main") < 1:
        reasons.append("weak semantic structure")
    return len(reasons) == 0, reasons


def derive_note(row_idx: int, row: dict[str, Any]) -> dict[str, Any] | None:
    html = row.get("text") or ""
    idea = row.get("llm_generated_idea") or ""
    ok, reasons = quality_gate(idea, html)
    if not ok:
        return None

    pattern = classify_pattern(idea, html)
    image = row.get("image") or {}
    return {
        "reference_id": f"websight_v02_{row_idx:06d}",
        "dataset": DATASET,
        "config": CONFIG,
        "split": SPLIT,
        "row_idx": row_idx,
        "license_review_status": "synthetic-reference-pattern-only",
        "retrieved_at": datetime.now(timezone.utc).date().isoformat(),
        "pattern": pattern,
        "source_idea_excerpt": idea[:240],
        "image_width": image.get("width"),
        "image_height": image.get("height"),
        "derived_pattern_note": derive_pattern_note(pattern, idea),
        "implementation_guardrail": "Do not copy HTML, CSS, copy, brand labels, image URLs, or exact layout. Use this as a structure note only.",
    }


def derive_pattern_note(pattern: str, idea: str) -> str:
    if pattern == "commerce_product_flow":
        return "Use a single product/box visual, concise package value, availability state, and one checkout action near the decision point."
    if pattern == "hero_composition":
        return "Hero should pair one strong promise with one proof object; avoid split clutter and keep CTA hierarchy clear."
    if pattern == "navigation_footer_structure":
        return "Navigation should stay short and task-oriented; footer should reduce uncertainty without repeating every feature."
    if pattern == "visual_portfolio_grid":
        return "Use image density carefully: one focal visual beats a crowded gallery when selling premium taste."
    if pattern == "conversion_form":
        return "Forms should ask only what is needed, explain the next step, and keep premium concierge language calm."
    if pattern == "pricing_comparison":
        return "Compare packages by outcome and fit, not by internal mechanics; make unavailable states explicit before checkout."
    if "minimal" in idea.lower() or "clean" in idea.lower():
        return "Keep structure minimal, body copy concise, and containers aligned to one clear grid."
    return "Convert the section structure into an original ViralBox pattern with one primary purpose and stable responsive behavior."


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-records", type=int, default=60)
    parser.add_argument("--page-size", type=int, default=12)
    parser.add_argument("--offsets", nargs="*", type=int, default=[0, 50, 100, 250, 500, 900, 1500])
    args = parser.parse_args()

    ROOT.joinpath("manifests").mkdir(parents=True, exist_ok=True)

    valid = fetch_json(f"{API}/is-valid?dataset={urllib.parse.quote(DATASET)}")
    if not valid.get("viewer"):
        raise RuntimeError(f"Dataset viewer unavailable for {DATASET}: {valid}")

    notes: list[dict[str, Any]] = []
    seen: set[int] = set()
    for offset in args.offsets:
        if len(notes) >= args.max_records:
            break
        try:
            data = fetch_json(rows_url(offset, args.page_size))
        except (TimeoutError, socket.timeout, urllib.error.URLError) as exc:
            print(f"Skipping WebSight offset {offset}: {exc}", file=sys.stderr)
            continue
        for item in data.get("rows", []):
            row_idx = int(item.get("row_idx", offset))
            if row_idx in seen:
                continue
            seen.add(row_idx)
            note = derive_note(row_idx, item.get("row") or {})
            if note:
                notes.append(note)
            if len(notes) >= args.max_records:
                break
        time.sleep(0.35)

    with OUTPUT.open("w", encoding="utf-8") as fh:
        for note in notes:
            fh.write(json.dumps(note, ensure_ascii=False) + "\n")

    print(f"Wrote {len(notes)} WebSight pattern notes to {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())