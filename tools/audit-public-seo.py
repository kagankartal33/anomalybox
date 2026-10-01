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
PACKAGE_ASSETS = ROOT / "public" / "assets" / "seo-package"
SEO_PACKAGE_SOURCE = ROOT / "lib" / "seo-package.ts"
EXPECTED_PACKAGE_PAGES = 110


def main() -> int:
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    pages = registry.get("pages", [])
    errors: list[str] = []
    descriptions: dict[str, list[str]] = {}
    seo_titles: dict[str, list[str]] = {}
    forbidden_meta = re.compile(
        r"publish-ready|field notes?|proof standards|clear steps, examples|"
        r"2026 aeo|maximum ai extraction|not generic motivation|seo package|editorial draft",
        re.I,
    )
    paths = [p.get("path") for p in pages]
    images = [p.get("image") for p in pages]
    if len(pages) != EXPECTED_PACKAGE_PAGES:
        errors.append(
            f"package page count: expected {EXPECTED_PACKAGE_PAGES}, found {len(pages)}"
        )
    if len(paths) != len(set(paths)):
        errors.append("duplicate package canonical paths")
    if len(images) != len(set(images)):
        errors.append("duplicate package image paths")
    for page in pages:
        image = page.get("image", "")
        expected_prefix = "/assets/seo-package/"
        if not image.startswith(expected_prefix) or not image.endswith(".webp"):
            errors.append(f"non-package thumbnail path: {page.get('slug')}")
        else:
            thumbnail = ROOT / "public" / image.removeprefix("/")
            hero = thumbnail.with_name(f"{thumbnail.stem}-hero.webp")
            if not thumbnail.exists():
                errors.append(f"missing package thumbnail: {page.get('slug')}")
            if not hero.exists():
                errors.append(f"missing package hero: {page.get('slug')}")
        if not 110 <= len(page.get("description", "")) <= 158:
            errors.append(f"metadata description length: {page.get('slug')}")
        if forbidden_meta.search(page.get("description", "")):
            errors.append(f"metadata description residue: {page.get('slug')}")
        descriptions.setdefault(page.get("description", "").casefold(), []).append(page.get("slug", ""))
        current_seo_title = page.get("seoTitle", "")
        if not current_seo_title or len(current_seo_title) > 62:
            errors.append(f"seo title length: {page.get('slug')}")
        if forbidden_meta.search(current_seo_title):
            errors.append(f"seo title residue: {page.get('slug')}")
        seo_titles.setdefault(current_seo_title.casefold(), []).append(page.get("slug", ""))
        if len(page.get("imageAlt", "")) > 125:
            errors.append(f"alt text too long: {page.get('slug')}")
        markdown = PACKAGE / f"{page['slug']}.md"
        if not markdown.exists():
            errors.append(f"missing package markdown: {page['slug']}")
            continue
        text = markdown.read_text(encoding="utf-8", errors="replace")
        if "\\\\x01" in text:
            errors.append(f"control character: {page['slug']}")
        if not re.search(r"^#\\\\s+", text, re.M):
            errors.append(f"missing H1: {page['slug']}")
        else:
            h1 = re.search(r"^#\\\\s+(.+?)\\\\s*$", text, re.M).group(1).replace("**", "").strip()
            if h1 != page.get("title"):
                errors.append(f"registry title differs from H1: {page['slug']}")
        if not re.search(r"^##\\\\s+Frequently asked questions", text, re.M | re.I):
            errors.append(f"missing visible FAQ: {page['slug']}")
        if not re.search(r"^##\\\\s+Next step", text, re.M | re.I):
            errors.append(f"missing next step: {page['slug']}")

    for description, owners in descriptions.items():
        if description and len(owners) > 1:
            errors.append(f"duplicate metadata description: {', '.join(owners)}")
    for title, owners in seo_titles.items():
        if title and len(owners) > 1:
            errors.append(f"duplicate SEO title: {', '.join(owners)}")

    legacy_files = list(LEGACY.glob("*.md"))
    missing_assets = [p.stem for p in legacy_files if not (LEGACY_ASSETS / f"{p.stem}.svg").exists()]
    if missing_assets:
        errors.append(f"missing legacy visuals: {len(missing_assets)}")

    package_source = SEO_PACKAGE_SOURCE.read_text(encoding="utf-8")
    if "export const seoPackagePages: SeoPackagePage[] = registryPages;" not in package_source:
        errors.append("public SEO hubs are not pinned to registryPages")
    if "const routablePages = [...registryPages, ...legacyResourcePages];" not in package_source:
        errors.append("legacy route compatibility is not isolated from public hubs")

    print(f"package pages: {len(pages)}")
    print(f"package thumbnails: {len(list(PACKAGE_ASSETS.glob('*.webp'))) // 2}")
    print(f"legacy resources: {len(legacy_files)}")
    print(f"legacy visuals: {len(list(LEGACY_ASSETS.glob('*.svg')))}")
    print(f"errors: {len(errors)}")
    for error in errors[:40]:
        print(f"  {error}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())