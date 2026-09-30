"""Fail-fast audit for public SEO metadata, content shape, and assets."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "lib" / "seo-package-registry.json"
PACKAGE = ROOT / "content" / "seo-package"
LEGACY = ROOT / "content" / "resources"
LEGACY_ASSETS = ROOT / "public" / "assets" / "legacy-resources"


def main() -> int:
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    pages = registry.get("pages", [])
    errors: list[str] = []
    paths = [p.get("path") for p in pages]
    images = [p.get("image") for p in pages]
    if len(paths) != len(set(paths)):
        errors.append("duplicate package canonical paths")
    if len(images) != len(set(images)):
        errors.append("duplicate package image paths")
    for page in pages:
        if not 110 <= len(page.get("description", "")) <= 158:
            errors.append(f"metadata description length: {page.get('slug')}")
        if len(page.get("imageAlt", "")) > 125:
            errors.append(f"alt text too long: {page.get('slug')}")
        markdown = PACKAGE / f"{page['slug']}.md"
        if not markdown.exists():
            errors.append(f"missing package markdown: {page['slug']}")
            continue
        text = markdown.read_text(encoding="utf-8", errors="replace")
        if "\x01" in text:
            errors.append(f"control character: {page['slug']}")
        if not re.search(r"^#\s+", text, re.M):
            errors.append(f"missing H1: {page['slug']}")
        if not re.search(r"^##\s+Frequently asked questions", text, re.M | re.I):
            errors.append(f"missing visible FAQ: {page['slug']}")
        if not re.search(r"^##\s+Next step", text, re.M | re.I):
            errors.append(f"missing next step: {page['slug']}")

    legacy_files = list(LEGACY.glob("*.md"))
    missing_assets = [p.stem for p in legacy_files if not (LEGACY_ASSETS / f"{p.stem}.svg").exists()]
    if missing_assets:
        errors.append(f"missing legacy visuals: {len(missing_assets)}")

    print(f"package pages: {len(pages)}")
    print(f"legacy resources: {len(legacy_files)}")
    print(f"legacy visuals: {len(list(LEGACY_ASSETS.glob('*.svg')))}")
    print(f"errors: {len(errors)}")
    for error in errors[:40]:
        print(f"  {error}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())