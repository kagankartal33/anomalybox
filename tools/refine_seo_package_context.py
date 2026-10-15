"""Move generated context anchors to natural closing sentences."""

from __future__ import annotations

import hashlib
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content" / "seo-package"

PREFIXES = [
    re.compile(r"^For \*\*(?P<anchor>.+?)\*\*, (?P<body>.+)$", re.S),
    re.compile(r"^With \*\*(?P<anchor>.+?)\*\* as the example, (?P<body>.+)$", re.S),
    re.compile(r"^When reviewing \*\*(?P<anchor>.+?)\*\*, (?P<body>.+)$", re.S),
    re.compile(r"^Applied to \*\*(?P<anchor>.+?)\*\*, (?P<body>.+)$", re.S),
]


def capitalize_first_alpha(value: str) -> str:
    chars = list(value)
    for index, char in enumerate(chars):
        if char.isalpha():
            chars[index] = char.upper()
            break
    return "".join(chars)


def main() -> int:
    changed_files = 0
    changed_paragraphs = 0
    for path in sorted(CONTENT_DIR.glob("*.md")):
        original = path.read_text(encoding="utf-8")
        title_match = re.search(r"^#\s+(.+?)\s*$", original, re.M)
        page_title = title_match.group(1) if title_match else path.stem.replace("-", " ")

        def replace(match: re.Match[str]) -> str:
            nonlocal changed_paragraphs
            prefix = match.group("prefix")
            block = match.group("block").strip()
            for pattern in PREFIXES:
                found = pattern.match(block)
                if not found:
                    continue
                anchor = found.group("anchor").strip()
                body = capitalize_first_alpha(found.group("body").strip())
                if anchor == "the page example" or anchor.lower().startswith("will a break destroy"):
                    anchor = page_title
                digest = hashlib.sha256(f"{path.stem}:{anchor}:{body[:40]}".encode("utf-8")).hexdigest()
                closers = [
                    f"Here, test that rule through **{anchor}**.",
                    f"The page-specific example is **{anchor}**.",
                    f"Use **{anchor}** as the practical check on this page.",
                    f"For this page, apply the rule to **{anchor}**.",
                ]
                changed_paragraphs += 1
                return prefix + body.rstrip() + " " + closers[int(digest[:8], 16) % len(closers)]
            return match.group(0)

        polished = re.sub(
            r"(?ms)(?P<prefix>\A|\n\n)(?P<block>[^\n#|`>].+?)(?=\n\n|\Z)",
            replace,
            original,
        )
        if polished != original:
            path.write_text(polished.rstrip() + "\n", encoding="utf-8")
            changed_files += 1

    print(f"refined SEO package files: {changed_files}")
    print(f"moved context anchors: {changed_paragraphs}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())