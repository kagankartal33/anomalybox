"""Remove internal editorial residue from the public SEO package.

This pass is deliberately narrow and idempotent. It only rewrites known
generator phrases that should never appear in published reader-facing copy.
"""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content" / "seo-package"

PUBLICATION_BLOCK = re.compile(
    r"\n*(?:"
    r"Before indexing[^\n]+"
    r"|The evidence module on this page[^\n]+"
    r"|The named editor[^\n]+"
    r")\n*",
    re.IGNORECASE,
)

ANGLE_CTA = re.compile(
    r"Apply (?:the|this) \*\*(?P<keyword>[^*]+)\*\* angle "
    r"\((?P<decision>[^)]+)\) to one card this week\. "
    r"If decisions still stall after that single experiment, "
    r"\[review AnomalyBox private direction\]\(/store\) for shoot-ready cards—not more generic lists\.",
    re.IGNORECASE,
)


def replace_angle(match: re.Match[str]) -> str:
    keyword = match.group("keyword").strip()
    decision = match.group("decision").strip()
    return (
        f"Before the next shoot, use **{keyword}** to resolve one concrete decision: "
        f"{decision}. Test the direction on a single card. If the concept is still difficult "
        f"to execute, [review AnomalyBox private direction](/store) for tailored, shoot-ready guidance."
    )


def main() -> int:
    changed = 0
    if not CONTENT_DIR.exists():
        print("content/seo-package does not exist, skipping.")
        return 0
    for path in sorted(CONTENT_DIR.glob("*.md")):
        original = path.read_text(encoding="utf-8")
        polished = original.replace("Page focus:", "Project:")
        polished = PUBLICATION_BLOCK.sub("\n\n", polished)
        polished = ANGLE_CTA.sub(replace_angle, polished)
        polished = re.sub(r"\n{3,}", "\n\n", polished)
        if polished != original:
            path.write_text(polished, encoding="utf-8", newline="\n")
            changed += 1

    print(f"polished SEO package files: {changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())