"""Remove public-facing template residue from curated SEO package Markdown."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content" / "seo-package"


def strip_related_guides(text: str) -> str:
    lines = text.splitlines()
    out: list[str] = []
    skipping = False
    for line in lines:
        if re.match(r"^##\s+Related guides\s*$", line.strip(), re.I):
            skipping = True
            continue
        if skipping and re.match(r"^##\s+", line):
            skipping = False
        if not skipping:
            out.append(line)
    return "\


def remove_empty_and_duplicate_h2(text: str) -> str:
    lines = text.splitlines()
    seen: set[str] = set()
    out: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        match = re.match(r"^##\s+(.+?)\s*$", line)
        if not match:
            out.append(line)
            i += 1
            continue

        heading = match.group(1).strip()
        key = re.sub(r"[^a-z0-9]+", " ", heading.lower()).strip()
        next_nonblank = i + 1
        while next_nonblank < len(lines) and not lines[next_nonblank].strip():
            next_nonblank += 1
        empty = next_nonblank >= len(lines) or bool(re.match(r"^#{1,2}\s+", lines[next_nonblank]))
        internal_empty = key in {"signature protocol", "field implementation", "operator notes", "anti overlap lock"}
        if empty or internal_empty or key in seen:
            i += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            continue
        seen.add(key)
        out.append(line)
        i += 1
    return "\


def clean_keyword_labels(text: str) -> str:
    text = re.sub(r"(\d+\.\s+)\*\*[^*\
    text = re.sub(r"^-\s+\*\*[^*\
    return text


def main() -> int:
    changed = 0
    for path in sorted(CONTENT.glob("*.md")):
        original = path.read_text(encoding="utf-8")
        cleaned = strip_related_guides(original)
        cleaned = remove_empty_and_duplicate_h2(cleaned)
        cleaned = clean_keyword_labels(cleaned)
        cleaned = re.sub(r"\
        if cleaned != original:
            path.write_text(cleaned, encoding="utf-8")
            changed += 1
    print(f"curated sources cleaned: {changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
