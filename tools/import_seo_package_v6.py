"""
import_seo_package_v6.py
========================
Imports ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6 into the Next.js site.

Writes:
  - content/seo-package/{slug}.md          (body, site-ready)
  - public/assets/seo-package/{slug}.webp  (featured images)
  - lib/seo-package-registry.json          (metadata for routes/sitemap/SEO)

Does not touch the viral idea-card pipeline.
"""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

import yaml

from polish_public_metadata import build_description, full_title, seo_title

ROOT = Path(__file__).resolve().parents[1]
PKG = (
    ROOT
    / "archive"
    / "source-packs"
    / "ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6"
    / "ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6"
)
OUT_MD = ROOT / "content" / "seo-package"
OUT_IMG = ROOT / "public" / "assets" / "seo-package"
OUT_REG = ROOT / "lib" / "seo-package-registry.json"

# These pages were intentionally removed from the public product. Keep the
# canonical source package intact as an archive, but never republish them when
# the import pipeline is rerun.
RETIRED_SLUGS = {
    "reels-shot-list-template",
    "ugc-brief-template",
}

FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def strip_frontmatter(text: str) -> tuple[dict, str]:
    m = FM_RE.match(text)
    if not m:
        return {}, text
    fm = yaml.safe_load(m.group(1)) or {}
    if not isinstance(fm, dict):
        fm = {}
    body = text[m.end() :]
    return fm, body


def normalize_body(body: str, slug: str, image_public: str, image_alt: str) -> str:
    # Remove package-relative image markdown; page component renders hero from registry
    body = re.sub(
        r"!\[([^\]]*)\]\(assets/featured-image\.webp\)\s*\n?",
        "",
        body,
        count=1,
    )
    # Normalize internal links that use trailing slashes to site style
    body = re.sub(r"\]\((/[^)]+)/\)", r"](\1)", body)
    # Ensure H1 exists once — keep package H1
    return body.strip() + "\n"


def slug_from_folder(folder: str) -> str:
    # 001-instagram-content-ideas -> instagram-content-ideas
    parts = folder.split("-", 1)
    if parts and parts[0].isdigit() and len(parts) == 2:
        return parts[1]
    return folder


def section_from_canonical(canonical: str) -> tuple[str, str]:
    path = canonical.strip("/")
    bits = path.split("/")
    if len(bits) >= 2:
        return bits[0], bits[1]
    if len(bits) == 1:
        return "resources", bits[0]
    return "resources", "unknown"


def main() -> int:
    if not PKG.exists():
        print(f"ERROR: package not found at {PKG}")
        return 1

    manifest = json.loads((PKG / "package-manifest.json").read_text(encoding="utf-8"))
    OUT_MD.mkdir(parents=True, exist_ok=True)
    OUT_IMG.mkdir(parents=True, exist_ok=True)

    registry = []
    issues = []

    for art in manifest["articles"]:
        folder = art["folder"]
        page_dir = PKG / "pages" / folder
        article_path = page_dir / "article.md"
        image_path = page_dir / "assets" / "featured-image.webp"
        schema_path = page_dir / "schema.jsonld"

        if not article_path.exists():
            issues.append(f"missing article: {folder}")
            continue

        raw = article_path.read_text(encoding="utf-8")
        fm, body = strip_frontmatter(raw)

        canonical = (fm.get("canonical_url") or art.get("canonical") or "").strip()
        section, slug = section_from_canonical(canonical)
        if not slug or slug == "unknown":
            slug = slug_from_folder(folder)
        if slug in RETIRED_SLUGS:
            continue

        title = fm.get("seo_title") or art.get("title") or slug
        # meta_description may be multi-line list artifact from weak yaml
        desc = fm.get("meta_description") or art.get("title") or title
        if isinstance(desc, list):
            desc = " ".join(str(x) for x in desc)
        desc = re.sub(r"\s+", " ", str(desc)).strip()
        if len(desc) > 160:
            # keep SERP-friendly length but don't hard fail
            pass

        keyword = fm.get("primary_keyword") or art.get("keyword") or slug.replace("-", " ")
        secondary = fm.get("secondary_keywords") or []
        if isinstance(secondary, str):
            secondary = [secondary] if secondary else []

        image_alt = fm.get("featured_image_alt") or f"Anomaly Box featured image for {title}"
        if isinstance(image_alt, list):
            image_alt = " ".join(str(x) for x in image_alt)
        image_alt = re.sub(r"\s+", " ", str(image_alt)).strip()

        public_img = f"/assets/seo-package/{slug}.webp"
        if image_path.exists():
            shutil.copy2(image_path, OUT_IMG / f"{slug}.webp")
        else:
            issues.append(f"missing image: {folder}")

        site_body = normalize_body(body, slug, public_img, image_alt)
        # Drop duplicate H1 from body if renderer also shows title — keep H1 in markdown for accessibility
        (OUT_MD / f"{slug}.md").write_text(site_body, encoding="utf-8")

        schema = {}
        if schema_path.exists():
            try:
                schema = json.loads(schema_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                issues.append(f"bad schema: {folder}")

        word_count = int(fm.get("word_count") or art.get("word_count") or 0)
        # Count actual body words without frontmatter
        body_words = len(re.findall(r"\b[\w'-]+\b", site_body))

        # Bot-facing dates (not shown in UI). Prefer explicit ISO fields from assign_seo_package_dates.py
        date_published = (
            fm.get("date_published")
            or fm.get("datePublished")
            or fm.get("last_reviewed")
            or manifest.get("updated")
            or "2026-07-14T08:17:00Z"
        )
        date_modified = (
            fm.get("date_modified")
            or fm.get("dateModified")
            or date_published
        )
        if isinstance(date_published, str) and "T" not in date_published:
            date_published = f"{date_published}T12:00:00Z"
        if isinstance(date_modified, str) and "T" not in date_modified:
            date_modified = f"{date_modified}T12:30:00Z"

        registry.append(
            {
                "id": fm.get("content_id") or art.get("id"),
                "folder": folder,
                "slug": slug,
                "section": section,
                "path": f"/{section}/{slug}",
                "title": title,
                "description": desc[:320],
                "keyword": keyword,
                "secondaryKeywords": secondary,
                "pageType": fm.get("page_type") or art.get("type") or "guide",
                "searchIntent": fm.get("search_intent") or "",
                "audience": fm.get("audience") or "",
                "funnelStage": fm.get("funnel_stage") or "",
                "wordCount": word_count,
                "bodyWordCount": body_words,
                "image": public_img,
                "imageAlt": image_alt,
                "datePublished": str(date_published),
                "dateModified": str(date_modified),
                "status": "published",
                "schemaType": (schema.get("@type") if isinstance(schema, dict) else None) or "Article",
            }
        )

    for page in registry:
        markdown = (OUT_MD / f"{page['slug']}.md").read_text(encoding="utf-8")
        page["title"] = full_title(markdown, str(page.get("title") or page["slug"]))
        page["seoTitle"] = seo_title(page["title"])
        page["description"] = build_description(page, markdown)

    # sort by package id order
    registry.sort(key=lambda x: x.get("id") or x["slug"])

    OUT_REG.write_text(
        json.dumps(
            {
                "package": manifest.get("package"),
                "version": manifest.get("version"),
                "importedAt": "2026-08-05",
                "count": len(registry),
                "pages": registry,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    sections = {}
    for p in registry:
        sections[p["section"]] = sections.get(p["section"], 0) + 1

    print(f"Imported {len(registry)} SEO package pages")
    print(f"  markdown → {OUT_MD}")
    print(f"  images   → {OUT_IMG}")
    print(f"  registry → {OUT_REG}")
    print(f"  sections: {sections}")
    short = [p for p in registry if p["bodyWordCount"] < 400]
    print(f"  body words < 400: {len(short)}")
    if issues:
        print(f"  issues ({len(issues)}):")
        for i in issues[:20]:
            print("   -", i)
        return 2
    print("SUCCESS: package ready for site wiring")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
