"""Fix headings accidentally merged into previous paragraphs."""
from __future__ import annotations

import re
from pathlib import Path

import yaml

PKG = Path(__file__).resolve().parents[1] / (
    "archive/source-packs/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/pages"
)
FM = re.compile(r"^(---\s*\n)(.*?)(\n---\s*\n)(.*)$", re.S)


def main() -> int:
    n = 0
    for d in sorted(PKG.iterdir()):
        path = d / "article.md"
        if not path.exists():
            continue
        raw = path.read_text(encoding="utf-8")
        m = FM.match(raw)
        if not m:
            continue
        fm = yaml.safe_load(m.group(2)) or {}
        body = m.group(4)
        orig = body
        # "sentence. ## Heading" or "sentence. ### Heading"
        body = re.sub(r"([.!?])\s+(##\s+)", r"\1\n\n\2", body)
        body = re.sub(r"([.!?])\s+(###\s+)", r"\1\n\n\2", body)
        # empty practical depth heading alone followed by another heading — remove empty wrapper
        body = re.sub(r"\n## Practical depth\n\n(?=## )", "\n", body)
        body = re.sub(r"\n{3,}", "\n\n", body)
        if body != orig:
            if fm.get("secondary_keywords") is None:
                fm["secondary_keywords"] = []
            fm["word_count"] = len(re.findall(r"\b[\w'-]+\b", body))
            y = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=100).strip()
            path.write_text(f"---\n{y}\n---\n\n{body.lstrip()}", encoding="utf-8")
            n += 1
    print(f"fixed inline headings in {n} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
