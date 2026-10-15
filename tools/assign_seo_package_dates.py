"""
assign_seo_package_dates.py
===========================
Assign unique bot-facing publish/modified timestamps to every package article.

Schedule model:
  - ~5 pages per calendar day
  - Distinct clock times each day (not the same hour)
  - date_published and date_modified set in frontmatter (ISO 8601 with offset)
  - Not rendered in visible UI — only meta/JSON-LD/sitemap after import

Run:
  python tools/assign_seo_package_dates.py
  python tools/import_seo_package_v6.py
"""

from __future__ import annotations

import hashlib
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

import yaml

PKG = Path(__file__).resolve().parents[1] / (
    "archive/source-packs/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/pages"
)
FM = re.compile(r"^(---\s*\n)(.*?)(\n---\s*\n)(.*)$", re.S)

# ~5 pages/day × 112 ≈ 23 days. End near package review date (2026-08-05).
# Start: 2026-07-14 → through ~2026-08-05
START_DATE = datetime(2026, 7, 14, tzinfo=timezone.utc)
PAGES_PER_DAY = 5

# Base slots within a day (UTC hours:minutes); then jitter per page so none share exact minute
DAY_SLOTS = [
    (8, 17),
    (10, 41),
    (13, 8),
    (15, 53),
    (18, 26),
]


def stable_jitter_minutes(seed: str, span: int = 11) -> int:
    h = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    return int(h[:4], 16) % span  # 0..span-1 minutes


def build_schedule(n: int) -> list[datetime]:
    times: list[datetime] = []
    day = 0
    slot = 0
    i = 0
    while len(times) < n:
        base_h, base_m = DAY_SLOTS[slot % PAGES_PER_DAY]
        # unique second component as well
        sec = (i * 17 + slot * 7) % 50 + 5  # 5..54
        dt = START_DATE + timedelta(days=day)
        dt = dt.replace(hour=base_h, minute=base_m, second=sec, microsecond=0)
        # jitter minutes without colliding slots
        jitter = stable_jitter_minutes(f"{day}-{slot}-{i}", span=9)
        dt = dt + timedelta(minutes=jitter)
        times.append(dt)
        i += 1
        slot += 1
        if slot % PAGES_PER_DAY == 0:
            day += 1
            slot = 0
    return times


def iso(dt: datetime) -> str:
    # ISO 8601 with Z
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def main() -> int:
    folders = sorted(
        [d for d in PKG.iterdir() if d.is_dir() and (d / "article.md").exists()],
        key=lambda d: d.name,
    )
    if not folders:
        print("ERROR: no package pages found")
        return 1

    schedule = build_schedule(len(folders))
    # Ensure full uniqueness
    seen: set[str] = set()
    for i, dt in enumerate(schedule):
        s = iso(dt)
        while s in seen:
            dt = dt + timedelta(minutes=1)
            s = iso(dt)
            schedule[i] = dt
        seen.add(s)

    for folder, published in zip(folders, schedule):
        path = folder / "article.md"
        raw = path.read_text(encoding="utf-8")
        m = FM.match(raw)
        if not m:
            print(f"skip no fm: {folder.name}")
            continue
        fm = yaml.safe_load(m.group(2)) or {}
        if not isinstance(fm, dict):
            fm = {}
        body = m.group(4)

        # date_modified: same day, 25–95 minutes later (still unique enough)
        mod_offset = 25 + (int(hashlib.sha256(folder.name.encode()).hexdigest()[:2], 16) % 71)
        modified = published + timedelta(minutes=mod_offset)

        fm["date_published"] = iso(published)
        fm["date_modified"] = iso(modified)
        # keep last_reviewed as date-only editorial field (bots use date_published/modified)
        fm["last_reviewed"] = published.strftime("%Y-%m-%d")

        if fm.get("secondary_keywords") is None:
            fm["secondary_keywords"] = []

        y = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=100).strip()
        path.write_text(f"---\n{y}\n---\n\n{body.lstrip()}", encoding="utf-8")

    print(f"Assigned timestamps to {len(folders)} pages")
    print(f"  first publish: {iso(schedule[0])}")
    print(f"  last publish:  {iso(schedule[-1])}")
    print(f"  pace: ~{PAGES_PER_DAY} pages/day, distinct times")
    # show first 10
    for folder, published in list(zip(folders, schedule))[:10]:
        print(f"  {folder.name}: {iso(published)}")
    print("  ...")
    for folder, published in list(zip(folders, schedule))[-3:]:
        print(f"  {folder.name}: {iso(published)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
