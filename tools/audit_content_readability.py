"""Report readability and repetition risks across public Markdown content."""

from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIRS = [ROOT / "content" / "seo-package", ROOT / "content" / "resources"]


def prose(text: str) -> str:
    text = re.sub(r"```.*?```", " ", text, flags=re.S)
    text = re.sub(r"`[^`]+`", " ", text)
    text = re.sub(r"!?(?:\\\\[([^]]*)\\\\])\\\\([^)]+\\\\)", r"\\\\1", text)
    text = re.sub(r"^\\\\s*[#>|*-]+\\\\s*", "", text, flags=re.M)
    text = re.sub(r"^\\\\s*\\\\d+[.)]\\\\s*", "", text, flags=re.M)
    return re.sub(r"\\\\s+", " ", text).strip()


def syllables(word: str) -> int:
    clean = re.sub(r"[^a-z]", "", word.lower())
    if not clean:
        return 0
    groups = len(re.findall(r"[aeiouy]+", clean))
    if clean.endswith("e") and not clean.endswith(("le", "ye")) and groups > 1:
        groups -= 1
    return max(1, groups)


def flesch(text: str) -> float:
    body = prose(text)
    words = re.findall(r"[A-Za-z]+(?:['-][A-Za-z]+)*", body)
    sentences = [part for part in re.split(r"[.!?]+(?:\\\\s+|$)", body) if part.strip()]
    if not words or not sentences:
        return 100.0
    return 206.835 - 1.015 * (len(words) / len(sentences)) - 84.6 * (
        sum(syllables(word) for word in words) / len(words)
    )


def paragraphs(text: str) -> list[str]:
    return [
        re.sub(r"\\\\s+", " ", block.strip()).lower()
        for block in re.split(r"
        if len(block.split()) >= 25
        and not block.lstrip().startswith(("#", "|", "-", "1.", "```", ">"))
    ]


def main() -> int:
    rows: list[tuple[float, str]] = []
    package_paragraphs: dict[str, list[str]] = defaultdict(list)
    for directory in CONTENT_DIRS:
        for path in sorted(directory.glob("*.md")):
            text = path.read_text(encoding="utf-8")
            rel = path.relative_to(ROOT).as_posix()
            rows.append((flesch(text), rel))
            if directory.name == "seo-package":
                for paragraph in paragraphs(text):
                    package_paragraphs[paragraph].append(rel)

    difficult = sorted((score, rel) for score, rel in rows if score < 40)
    hard_failures = [(score, rel) for score, rel in difficult if score < 35]
    repeated = sorted(
        ((len(set(owners)), paragraph, sorted(set(owners))) for paragraph, owners in package_paragraphs.items() if len(set(owners)) >= 3),
        reverse=True,
    )

    print(f"public markdown files: {len(rows)}")
    print(f"readability below 40: {len(difficult)}")
    for score, rel in difficult:
        print(f"- {score:.1f}: {rel}")
    print(f"SEO-package paragraphs repeated across 3+ pages: {len(repeated)}")
    for count, paragraph, owners in repeated[:100]:
        line = f"- {count} files: {paragraph[:110]} :: {', '.join(owners[:4])}"
        print(line.encode("ascii", "backslashreplace").decode("ascii"))
    print(f"readability hard failures below 35: {len(hard_failures)}")
    return 1 if repeated or hard_failures else 0


if __name__ == "__main__":
    raise SystemExit(main())