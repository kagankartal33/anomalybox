#!/usr/bin/env python3
"""Download screenshots for approved references only."""

from __future__ import annotations

import argparse
import json
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APPROVED = ROOT / "manifests" / "approved_manifest.jsonl"
DESKTOP = ROOT / "references" / "approved" / "desktop"


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(f"Missing {path}. Run score_reference_candidates.py first.")
    with path.open("r", encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def download(url: str, target: Path) -> bool:
    req = urllib.request.Request(url, headers={"User-Agent": "ViralBoxDesignIntelligence/1.0"})
    with urllib.request.urlopen(req, timeout=60) as response:
        target.write_bytes(response.read())
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-downloads", type=int, default=20)
    args = parser.parse_args()

    DESKTOP.mkdir(parents=True, exist_ok=True)
    all_records = load_jsonl(APPROVED)
    records = all_records[: args.max_downloads]
    downloaded = 0
    for record in records:
        src = record.get("image_src")
        if not src:
            continue
        target = DESKTOP / f"{record['reference_id']}.jpg"
        if not target.exists():
            download(src, target)
            time.sleep(0.4)
        record["desktop_file"] = str(target.relative_to(ROOT)).replace("\\", "/")
        downloaded += 1

    by_id = {record["reference_id"]: record for record in records}
    with APPROVED.open("w", encoding="utf-8") as fh:
        for record in all_records:
            match = by_id.get(record["reference_id"])
            fh.write(json.dumps(match or record, ensure_ascii=False) + "\n")

    print(f"Downloaded or verified {downloaded} approved desktop screenshots.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
