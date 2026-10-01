#!/usr/bin/env python3
"""Remote-first WebUI candidate discovery.

Queries the Hugging Face Dataset Viewer API in bounded pages, strips raw HTML/CSS/JS,
and writes compact provenance metadata. It intentionally avoids bulk downloads.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import socket
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "manifests" / "candidate_manifest.jsonl"
DATASET = "ronantakizawa/webui"
API = "https://datasets-server.huggingface.co"


def fetch_json(url: str, timeout: int = 45) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": "ViralBoxDesignIntelligence/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def rows_url(config: str, split: str, offset: int, length: int) -> str:
    params = urllib.parse.urlencode(
        {"dataset": DATASET, "config": config, "split": split, "offset": offset, "length": length}
    )
    return f"{API}/rows?{params}"


def classify_archetype(description: str) -> str:
    text = description.lower()
    if any(word in text for word in ["pricing", "plan", "subscription"]):
        return "pricing"
    if any(word in text for word in ["shop", "product", "cart", "checkout", "ecommerce", "store"]):
        return "product"
    if any(word in text for word in ["agency", "portfolio", "case study", "studio"]):
        return "agency"
    if any(word in text for word in ["article", "blog", "editorial", "magazine", "newsletter"]):
        return "editorial"
    if any(word in text for word in ["booking", "service", "restaurant", "clinic", "hotel"]):
        return "service"
    if any(word in text for word in ["dashboard", "saas", "software", "platform", "analytics"]):
        return "saas"
    return "other"


def classify_style(description: str) -> list[str]:
    text = description.lower()
    styles: list[str] = []
    if any(word in text for word in ["minimal", "clean", "simple", "white space"]):
        styles.append("premium_minimal")
    if any(word in text for word in ["luxury", "elegant", "high-end", "premium"]):
        styles.append("luxury")
    if any(word in text for word in ["editorial", "magazine", "story"]):
        styles.append("editorial")
    if any(word in text for word in ["technology", "software", "platform", "dashboard"]):
        styles.append("modern_tech")
    if any(word in text for word in ["warm", "human", "friendly", "creator"]):
        styles.append("warm_human")
    return styles or ["unclear"]


def keep_row(row: dict[str, Any]) -> bool:
    return (
        row.get("viewport") == "desktop"
        and row.get("component_type") == "page"
        and isinstance(row.get("element_count"), int)
        and 35 <= row["element_count"] <= 260
    )


def compact_record(row_idx: int, row: dict[str, Any]) -> dict[str, Any]:
    image = row.get("image") or {}
    description = row.get("description") or ""
    return {
        "dataset": DATASET,
        "config": "default",
        "split": "train",
        "row_idx": row_idx,
        "sample_id": row.get("sample_id"),
        "viewport": row.get("viewport"),
        "source_name": row.get("source_name"),
        "source_url": row.get("source_url"),
        "description": description[:1400],
        "framework": row.get("framework"),
        "css_framework": row.get("css_framework"),
        "component_type": row.get("component_type"),
        "element_count": row.get("element_count"),
        "has_animations": row.get("has_animations"),
        "image_src": image.get("src"),
        "image_width": image.get("width"),
        "image_height": image.get("height"),
        "page_archetype": classify_archetype(description),
        "visual_style": classify_style(description),
        "retrieved_at": datetime.now(timezone.utc).date().isoformat(),
        "license_review_status": "upstream-license-not-verified-for-reuse",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-records", type=int, default=120)
    parser.add_argument("--page-size", type=int, default=20)
    parser.add_argument("--offsets", nargs="*", type=int, default=[0, 500, 1500, 3000, 6000, 9000])
    args = parser.parse_args()

    ROOT.joinpath("manifests").mkdir(parents=True, exist_ok=True)
    ROOT.joinpath("references", "approved", "desktop").mkdir(parents=True, exist_ok=True)
    ROOT.joinpath("references", "approved", "mobile").mkdir(parents=True, exist_ok=True)
    ROOT.joinpath("references", "approved", "tablet-when-needed").mkdir(parents=True, exist_ok=True)
    ROOT.joinpath("references", "rejected").mkdir(parents=True, exist_ok=True)
    ROOT.joinpath("derived").mkdir(parents=True, exist_ok=True)

    valid = fetch_json(f"{API}/is-valid?dataset={urllib.parse.quote(DATASET)}")
    if not valid.get("viewer"):
        raise RuntimeError(f"Dataset viewer unavailable for {DATASET}: {valid}")
    splits = fetch_json(f"{API}/splits?dataset={urllib.parse.quote(DATASET)}")
    if not any(item.get("config") == "default" and item.get("split") == "train" for item in splits.get("splits", [])):
        raise RuntimeError("Expected default/train split was not found.")

    seen: set[str] = set()
    records: list[dict[str, Any]] = []
    for offset in args.offsets:
        if len(records) >= args.max_records:
            break
        try:
            data = fetch_json(rows_url("default", "train", offset, args.page_size), timeout=75)
        except (TimeoutError, socket.timeout, urllib.error.URLError) as exc:
            print(f"Skipping offset {offset}: {exc}", file=sys.stderr)
            continue
        for item in data.get("rows", []):
            row = item.get("row") or {}
            sample_id = row.get("sample_id")
            if not sample_id or sample_id in seen or not keep_row(row):
                continue
            records.append(compact_record(item.get("row_idx", offset), row))
            seen.add(sample_id)
            if len(records) >= args.max_records:
                break
        time.sleep(0.4)

    write_manifest(records)

    print(f"Wrote {len(records)} candidates to {MANIFEST}")
    return 0


def write_manifest(records: list[dict[str, Any]]) -> None:
    with MANIFEST.open("w", encoding="utf-8") as fh:
        for record in records:
            fh.write(json.dumps(record, ensure_ascii=False) + "\


if __name__ == "__main__":
    sys.exit(main())