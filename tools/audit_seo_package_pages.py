"""Full structural audit of all 112 package page folders."""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
PKG = (
    ROOT
    / "archive"
    / "source-packs"
    / "ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6"
    / "ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6"
    / "pages"
)
REG_PATH = ROOT / "lib" / "seo-package-registry.json"
FM = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.S)


def main() -> int:
    reg = json.loads(REG_PATH.read_text(encoding="utf-8")) if REG_PATH.exists() else {"pages": []}
    known = {p["path"].rstrip("/") for p in reg["pages"]}
    known |= {
        "/store",
        "/pricing",
        "/about",
        "/resources",
        "/content-ideas",
        "/atelier",
        "/methodology",
        "/login",
        "/legal",
    }
    known_slugs = {p["slug"] for p in reg["pages"]}

    folders = 0
    with_article = with_schema = with_image = with_readme = 0
    words: list[tuple[str, int, object]] = []
    missing_h1: list[str] = []
    empty_meta: list[str] = []
    short_meta: list[tuple[str, int]] = []
    long_meta: list[tuple[str, int, str]] = []
    no_canonical: list[str] = []
    placeholders: list[tuple[str, str]] = []
    broken_links: list[tuple[str, str]] = []
    hard: list[str] = []
    status_c: Counter[str] = Counter()
    type_c: Counter[str] = Counter()
    section_c: Counter[str] = Counter()
    titles: dict[str, list[str]] = defaultdict(list)
    keywords: dict[str, list[str]] = defaultdict(list)
    has_faq = 0
    has_next = 0
    has_quick = 0

    for folder in sorted(PKG.iterdir()):
        if not folder.is_dir():
            continue
        folders += 1
        art = folder / "article.md"
        sch = folder / "schema.jsonld"
        img = folder / "assets" / "featured-image.webp"
        rd = folder / "README.md"

        if art.exists():
            with_article += 1
        else:
            hard.append(f"MISSING article.md: {folder.name}")
            continue
        if sch.exists():
            with_schema += 1
        else:
            hard.append(f"MISSING schema: {folder.name}")
        if img.exists():
            with_image += 1
        else:
            hard.append(f"MISSING image: {folder.name}")
        if rd.exists():
            with_readme += 1

        raw = art.read_text(encoding="utf-8")
        m = FM.match(raw)
        fm = yaml.safe_load(m.group(1)) if m else {}
        if not isinstance(fm, dict):
            fm = {}
        body = raw[m.end() :] if m else raw
        wc = len(re.findall(r"\b[\w'-]+\b", body))
        words.append((folder.name, wc, fm.get("word_count")))

        title = str(fm.get("seo_title") or "")
        kw = str(fm.get("primary_keyword") or "").lower()
        desc = fm.get("meta_description") or ""
        if not isinstance(desc, str):
            desc = str(desc)
        desc = re.sub(r"\s+", " ", desc).strip()
        canon = str(fm.get("canonical_url") or "").strip()

        status_c[str(fm.get("status") or "none")] += 1
        type_c[str(fm.get("page_type") or "none")] += 1
        section_c[(canon.strip("/").split("/")[0] if canon else "none")] += 1
        titles[title].append(folder.name)
        keywords[kw].append(folder.name)

        if not re.search(r"^# ", body, re.M):
            missing_h1.append(folder.name)
        if re.search(r"^## Frequently asked", body, re.M | re.I):
            has_faq += 1
        if re.search(r"^## Next step", body, re.M | re.I):
            has_next += 1
        if re.search(r"^## Quick answer", body, re.M | re.I):
            has_quick += 1

        if len(desc) < 50:
            empty_meta.append(folder.name)
        elif len(desc) < 70:
            short_meta.append((folder.name, len(desc)))
        if len(desc) > 165:
            long_meta.append((folder.name, len(desc), desc[:90]))
        if not canon:
            no_canonical.append(folder.name)

        low = body.lower()
        for needle in ("lorem ipsum", "todo:", "tbd", "[insert", "xxx", "coming soon", "placeholder"):
            if needle in low:
                placeholders.append((folder.name, needle))

        for link in re.findall(r"\]\((/[^)]+)\)", body):
            path = link.split("#")[0].rstrip("/") or "/"
            slug = path.strip("/").split("/")[-1] if path.strip("/") else ""
            if path in known or path in known_paths_variants(known):
                continue
            if slug in known_slugs:
                continue
            # package-relative asset links ignored
            if "assets/" in path:
                continue
            broken_links.append((folder.name, link))

    known  # silence
    wc_list = [w for _, w, _ in words]
    print("=== FULL PAGES FOLDER SCAN ===")
    print(f"folders: {folders}")
    print(f"article/schema/image/readme: {with_article}/{with_schema}/{with_image}/{with_readme}")
    print(
        f"body words min/avg/max: {min(wc_list)}/{round(sum(wc_list)/len(wc_list))}/{max(wc_list)}"
    )
    print(
        f"under 400: {sum(1 for w in wc_list if w < 400)} | "
        f"under 600: {sum(1 for w in wc_list if w < 600)} | "
        f"over 1200: {sum(1 for w in wc_list if w > 1200)}"
    )
    print(f"missing H1: {missing_h1 or 'none'}")
    print(f"meta <50 chars: {empty_meta or 'none'}")
    print(f"meta 50-69 chars: {len(short_meta)}")
    print(f"meta >165 chars: {len(long_meta)}")
    for row in long_meta[:8]:
        print(f"  long meta: {row}")
    print(f"no canonical: {no_canonical or 'none'}")
    print(f"placeholder signals: {len(placeholders)}")
    for row in placeholders[:10]:
        print(f"  {row}")
    dup_t = {k: v for k, v in titles.items() if k and len(v) > 1}
    dup_k = {k: v for k, v in keywords.items() if k and len(v) > 1}
    print(f"duplicate titles: {len(dup_t)}")
    print(f"duplicate keywords: {len(dup_k)}")
    for k, v in list(dup_k.items())[:8]:
        print(f"  kw '{k}': {v}")
    print(f"status: {dict(status_c)}")
    print(f"page_type: {dict(type_c)}")
    print(f"sections: {dict(section_c)}")
    print(f"has Quick answer: {has_quick}/{folders}")
    print(f"has FAQ: {has_faq}/{folders}")
    print(f"has Next step: {has_next}/{folders}")
    print(f"unresolved internal link refs: {len(broken_links)}")
    bc = Counter(broken_links)
    for (f, l), c in bc.most_common(20):
        print(f"  {f} -> {l} (x{c})")
    print(f"hard issues: {len(hard)}")
    for h in hard[:20]:
        print(f"  {h}")

    # editorial honesty note
    print("\nNOTE: This is a structural/completeness audit of every folder.")
    print("It is NOT a full human line-by-line editorial fact-check of every paragraph.")
    return 0 if not hard else 2


def known_paths_variants(known: set[str]) -> set[str]:
    return known


if __name__ == "__main__":
    raise SystemExit(main())
