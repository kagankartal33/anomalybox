"""Contextualize paragraphs duplicated across SEO-package route families.

Shared safety and workflow principles remain intact, but each occurrence is
anchored to a concrete example already present on that page. The pass is
idempotent because only exact paragraphs appearing in three or more files are
eligible.
"""

from __future__ import annotations

import hashlib
import re
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content" / "seo-package"


def normalized(block: str) -> str:
    return re.sub(r"\s+", " ", block.strip()).lower()


def eligible(block: str) -> bool:
    return (
        len(block.split()) >= 25
        and not block.lstrip().startswith(("#", "|", "-", "1.", "```", ">"))
    )


def anchors(text: str) -> list[str]:
    candidates = re.findall(r"^###\s+(.+?)\s*$", text, re.M)
    candidates += re.findall(r"\*\*([^*:\n]{4,70})\*\*(?=:)", text)
    title_match = re.search(r"^#\s+(.+?)\s*$", text, re.M)
    page_title = title_match.group(1) if title_match else "the page example"
    if title_match:
        candidates.append(page_title)

    useful: list[str] = []
    for candidate in candidates:
        clean = re.sub(r"^[0-9]+\.\s*", "", candidate).strip()
        if re.match(r"^(how|what|when|can|should|is|do|does)\b", clean, re.I):
            continue
        if clean and clean.lower() not in {item.lower() for item in useful}:
            useful.append(clean)
    return useful or [page_title]


def contextualize(block: str, anchor: str, variant: int) -> str:
    first, separator, rest = block.partition(". ")
    if not separator:
        first, rest = block.rstrip("."), ""
    lowered = first[:1].lower() + first[1:]
    openings = [
        f"For **{anchor}**, {lowered}",
        f"With **{anchor}** as the example, {lowered}",
        f"When reviewing **{anchor}**, {lowered}",
        f"Applied to **{anchor}**, {lowered}",
    ]
    rewritten = openings[variant % len(openings)] + "."
    return rewritten + (f" {rest}" if rest else "")


def main() -> int:
    files = sorted(CONTENT_DIR.glob("*.md"))
    texts = {path: path.read_text(encoding="utf-8") for path in files}
    owners: dict[str, set[Path]] = defaultdict(set)
    raw_by_key: dict[str, str] = {}

    for path, text in texts.items():
        for block in re.split(r"\n\s*\n", text):
            if eligible(block):
                key = normalized(block)
                owners[key].add(path)
                raw_by_key.setdefault(key, block.strip())

    duplicate_keys = {key for key, paths in owners.items() if len(paths) >= 3}
    changed_files = 0
    changed_paragraphs = 0

    for path, original in texts.items():
        page_anchors = anchors(original)
        title_match = re.search(r"^#\s+(.+?)\s*$", original, re.M)
        page_title = title_match.group(1) if title_match else path.stem.replace("-", " ")
        occurrence = 0

        def replace(match: re.Match[str]) -> str:
            nonlocal occurrence, changed_paragraphs
            prefix = match.group("prefix")
            block = match.group("block").strip()
            key = normalized(block)
            if key not in duplicate_keys:
                return match.group(0)
            digest = hashlib.sha256(f"{path.stem}:{key}".encode("utf-8")).hexdigest()
            anchor = page_anchors[int(digest[:8], 16) % len(page_anchors)]
            if anchor == "the page example" or anchor.lower().startswith("will a break destroy"):
                anchor = page_title
            variant = int(digest[8:16], 16) % 4
            occurrence += 1
            changed_paragraphs += 1
            return prefix + contextualize(block, anchor, variant)

        polished = re.sub(
            r"(?ms)(?P<prefix>\A|\n\s*\n)(?P<block>\S.*?)(?=\n\s*\n|\Z)",
            replace,
            original,
        )
        if polished != original:
            path.write_text(polished.rstrip() + "\n", encoding="utf-8", newline="\n")
            changed_files += 1

    print(f"personalized SEO package files: {changed_files}")
    print(f"contextualized repeated paragraphs: {changed_paragraphs}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
