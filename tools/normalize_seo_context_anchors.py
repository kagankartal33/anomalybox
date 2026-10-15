"""Replace generic or question-shaped context anchors with each page topic."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content" / "seo-package"
GENERIC_ANCHORS = (
    "Will posting less destroy growth?",
    "Will a break destroy my account?",
    "Who writes the creative brief?",
    "the page example",
)


def main() -> int:
    changed = 0
    for path in sorted(CONTENT_DIR.glob("*.md")):
        original = path.read_text(encoding="utf-8")
        title_match = re.search(r"^#\s+(.+?)\s*$", original, re.M)
        if not title_match:
            continue
        short_title = title_match.group(1).split(":", 1)[0].strip()
        polished = original
        for anchor in GENERIC_ANCHORS:
            polished = polished.replace(f"**{anchor}**", f"**{short_title}**")
        polished = re.sub(
            r"In \*\*(?P<title>[^*]+)\*\*, (?:applied to|for|when reviewing) \*\*[^*]+\*\*, ",
            r"In **\g<title>**, ",
            polished,
            flags=re.I,
        )
        polished = re.sub(
            r"When one part is missing from \*\*(?P<anchor>[^*]+)\*\*,",
            r"When the plan for **\g<anchor>** is missing one of these parts,",
            polished,
        )
        if polished != original:
            path.write_text(polished, encoding="utf-8", newline="\n")
            changed += 1
    print(f"normalized SEO context anchors: {changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
