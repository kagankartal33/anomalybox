"""Final polish: template openers + richer meta descriptions."""
from __future__ import annotations

import re
from pathlib import Path

import yaml

from polish_public_metadata import build_description

PKG = Path(__file__).resolve().parents[1] / (
    "archive/source-packs/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/pages"
)
FM = re.compile(r"^(---\s*\n)(.*?)(\n---\s*\n)(.*)$", re.S)


def main() -> int:
    changed = 0
    for d in sorted(PKG.iterdir()):
        if not d.is_dir():
            continue
        path = d / "article.md"
        if not path.exists():
            continue
        raw = path.read_text(encoding="utf-8")
        m = FM.match(raw)
        if not m:
            continue
        fm = yaml.safe_load(m.group(2)) or {}
        body = m.group(4)
        orig_body = body

        body = re.sub(r"This guide closes that gap for", "This page is for", body)
        body = re.sub(
            r"the practical question is not only what to publish\. It is which",
            "the useful question is which",
            body,
            flags=re.I,
        )
        body = re.sub(
            r"A strong approach to \*\*([^*]+)\*\* starts with",
            r"A working approach to **\1** starts with",
            body,
        )

        title = str(fm.get("seo_title") or d.name)
        kw = str(fm.get("primary_keyword") or title)
        fm["meta_description"] = build_description(
            {
                "title": title,
                "keyword": kw,
                "pageType": fm.get("page_type") or "guide",
            },
            body,
        )

        if fm.get("secondary_keywords") is None:
            fm["secondary_keywords"] = []
        fm["word_count"] = len(re.findall(r"\b[\w'-]+\b", body))

        y = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=100).strip()
        new = f"---\n{y}\n---\n\n{body.lstrip()}"
        if new != raw:
            path.write_text(new, encoding="utf-8")
            changed += 1
    print(f"polished {changed} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
