"""Move generated context anchors to natural closing sentences."""

from __future__ import annotations

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

CLOSERS = [
    re.compile(r"^(?P<body>.+?) Here, test that rule through \*\*(?P<anchor>.+?)\*\*\.$", re.S),
    re.compile(r"^(?P<body>.+?) The page-specific example is \*\*(?P<anchor>.+?)\*\*\.$", re.S),
    re.compile(r"^(?P<body>.+?) Use \*\*(?P<anchor>.+?)\*\* as the practical check on this page\.$", re.S),
    re.compile(r"^(?P<body>.+?) For this page, apply the rule to \*\*(?P<anchor>.+?)\*\*\.$", re.S),
]


def capitalize_first_alpha(value: str) -> str:
    chars = list(value)
    for index, char in enumerate(chars):
        if char.isalpha():
            chars[index] = char.upper()
            break
    return "".join(chars)


def integrate_anchor(body: str, anchor: str) -> str:
    patterns = [
        (r"^For one review period", f"For one review period on **{anchor}**"),
        (r"^When one of these parts is missing", f"When one part is missing from **{anchor}**"),
        (r"^The publishing system", f"In **{anchor}**, the publishing system"),
        (r"^Repetition and constant evaluation", f"In **{anchor}**, repetition and constant evaluation"),
        (r"^A discovery piece", f"In **{anchor}**, a discovery piece"),
    ]
    for pattern, replacement in patterns:
        if re.search(pattern, body):
            return re.sub(pattern, replacement, body, count=1)

    verb_match = re.match(
        r"^(Use|Choose|Measure|Calculate|Create|Review|Remove|Plan|Turn|Score|Add|Protect|Keep|Return|Write|Build)\b",
        body,
    )
    if verb_match:
        return f"For **{anchor}**, {body[:1].lower() + body[1:]}"
    return f"In **{anchor}**, {body[:1].lower() + body[1:]}"


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
            for pattern in CLOSERS:
                found = pattern.match(block)
                if found:
                    changed_paragraphs += 1
                    return prefix + integrate_anchor(found.group("body").strip(), found.group("anchor").strip())
            for pattern in PREFIXES:
                found = pattern.match(block)
                if not found:
                    continue
                anchor = found.group("anchor").strip()
                body = capitalize_first_alpha(found.group("body").strip())
                if anchor == "the page example" or anchor.lower().startswith("will a break destroy"):
                    anchor = page_title
                changed_paragraphs += 1
                return prefix + integrate_anchor(body.rstrip(), anchor)
            return match.group(0)

        polished = re.sub(
            r"(?ms)(?P<prefix>\A|\n\s*\n)(?P<block>\S.*?)(?=\n\s*\n|\Z)",
            replace,
            original,
        )
        if polished != original:
            path.write_text(polished.rstrip() + "\n", encoding="utf-8", newline="\n")
            changed_files += 1

    print(f"refined SEO package files: {changed_files}")
    print(f"moved context anchors: {changed_paragraphs}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
