"""Repair deterministic SEO metadata and malformed imported FAQ markers.

This script only touches the public SEO package registry and its checked-in
markdown mirrors. It never reads or writes viral card/training data.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "lib" / "seo-package-registry.json"
PACKAGE_CONTENT = ROOT / "content" / "seo-package"
PACKAGE_SOURCE = ROOT / "ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6" / "ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6" / "pages"


def clean_description(value: str, title: str) -> str:
    value = re.sub(r"[.…]+$", "", value.strip()).strip()
    if len(value) < 110:
        value = f"{value or title}: practical examples, clear steps, and production decisions for creators."
    return value[:158].rstrip(" ,.;:")


def clean_alt(value: str, title: str) -> str:
    value = re.sub(r"^AnomalyBox editorial featured image for\s*", "", value.strip(), flags=re.I)
    value = re.sub(
        r", showing (?:creative direction dossier|content system|UGC product brief|beauty products|reels storyboard)[^.]*\.?$",
        "",
        value,
        flags=re.I,
    )
    result = f"{value or title} — creator planning visual."
    if len(result) <= 125:
        return result
    return f"{title} — creator planning visual."[:125].rstrip()


def repair_marker(text: str) -> str:
    return text.replace("\x01 questions", "## Frequently asked questions")


def main() -> int:
    payload = json.loads(REGISTRY.read_text(encoding="utf-8"))
    pages = payload.get("pages", [])
    for page in pages:
        page["description"] = clean_description(str(page.get("description", "")), str(page.get("title", "")))
        page["imageAlt"] = clean_alt(str(page.get("imageAlt", "")), str(page.get("title", "")))

    REGISTRY.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    repaired = 0
    for path in PACKAGE_CONTENT.glob("*.md"):
        original = path.read_text(encoding="utf-8")
        updated = repair_marker(original)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            repaired += 1

    for folder in PACKAGE_SOURCE.iterdir() if PACKAGE_SOURCE.exists() else []:
        article = folder / "article.md"
        if not article.exists():
            continue
        original = article.read_text(encoding="utf-8")
        updated = repair_marker(original)
        updated = re.sub(r"(meta_description:\s*['\"]?[^\n'\"]+?)[.…]+(['\"]?)", r"\1\2", updated)
        if updated != original:
            article.write_text(updated, encoding="utf-8")

    print(f"updated registry pages: {len(pages)}")
    print(f"repaired FAQ markers: {repaired}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())