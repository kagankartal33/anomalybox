"""Fail when public Markdown exposes content-generation residue or weak structure."""

from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIRS = [ROOT / "content" / "seo-package", ROOT / "content" / "resources"]

FORBIDDEN = {
    "zero-click label": r"Zero-Click Summary",
    "seo operator heading": r"SEO operator rules",
    "training profile": r"training profile",
    "pipeline disclaimer": r"not viral idea-card patterns|not book quotations",
    "scope lock": r"Scope lock:",
    "search-intent narration": r"Search intent for \*\*.+?\*\* is",
    "generation instruction": r"No content may be auto-published|AI engines actively demote generic synthesis",
    "template answer tail": r"Keep the answer specific to your niche constraints",
    "template audience tail": r"who need filmable rules, not inspiration dumps",
    "strict-on-purpose tail": r"this will feel strict on purpose",
    "information gain heading": r"^##\s+Information gain",
    "internal empty heading": r"^##\s+(Signature protocol|Operator notes|Field implementation|Anti-overlap lock)\s*$",
}


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def paragraphs(text: str) -> list[str]:
    return [
        re.sub(r"\s+", " ", block.strip()).lower()
        for block in re.split(r"\n\s*\n", text)
        if len(block.split()) >= 14 and not block.lstrip().startswith(("#", "|", "-", "1."))
    ]


def main() -> int:
    files = [p for directory in CONTENT_DIRS for p in sorted(directory.glob("*.md"))]
    errors: list[str] = []
    para_owners: dict[str, list[str]] = {}

    for path in files:
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(ROOT).as_posix()
        wc = word_count(text)
        if not 600 <= wc <= 1200:
            errors.append(f"word-count {wc}: {rel}")

        h2s = re.findall(r"^##\s+(.+?)\s*$", text, re.M)
        normalized_h2 = [re.sub(r"[^a-z0-9]+", " ", h.lower()).strip() for h in h2s]
        duplicates = [h for h, count in Counter(normalized_h2).items() if count > 1]
        if duplicates:
            errors.append(f"duplicate-h2 {duplicates}: {rel}")

        lines = text.splitlines()
        for i, line in enumerate(lines):
            if not line.startswith("## "):
                continue
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j >= len(lines) or lines[j].startswith(("# ", "## ")):
                errors.append(f"empty-h2 line {i + 1}: {rel}")

        for label, pattern in FORBIDDEN.items():
            if re.search(pattern, text, re.I | re.M):
                errors.append(f"{label}: {rel}")

        for paragraph in paragraphs(text):
            para_owners.setdefault(paragraph, []).append(rel)

    repeated = [(p, owners) for p, owners in para_owners.items() if len(set(owners)) > 1]
    for paragraph, owners in repeated:
        errors.append(f"repeated-paragraph ({len(set(owners))} files): {paragraph[:100]} :: {', '.join(sorted(set(owners))[:4])}")

    print(f"editorial files: {len(files)}")
    print(f"forbidden patterns: {sum(1 for e in errors if not e.startswith(('word-count', 'duplicate-h2', 'empty-h2', 'repeated-paragraph')))}")
    print(f"repeated paragraphs: {len(repeated)}")
    print(f"errors: {len(errors)}")
    for error in errors[:200]:
        print(f"- {error}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
