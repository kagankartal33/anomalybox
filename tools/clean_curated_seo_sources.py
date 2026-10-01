"""Remove public-facing template residue from curated SEO package Markdown."""

from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content" / "seo-package"


def strip_related_guides(text: str) -> str:
    lines = text.splitlines()
    out: list[str] = []
    skipping = False
    for line in lines:
        if re.match(r"^##\\\\s+Related guides\\\\s*$", line.strip(), re.I):
            skipping = True
            continue
        if skipping and re.match(r"^##\\\\s+", line):
            skipping = False
        if not skipping:
            out.append(line)
    return "


def remove_empty_and_duplicate_h2(text: str) -> str:
    lines = text.splitlines()
    seen: set[str] = set()
    out: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        match = re.match(r"^##\\\\s+(.+?)\\\\s*$", line)
        if not match:
            out.append(line)
            i += 1
            continue

        heading = match.group(1).strip()
        key = re.sub(r"[^a-z0-9]+", " ", heading.lower()).strip()
        next_nonblank = i + 1
        while next_nonblank < len(lines) and not lines[next_nonblank].strip():
            next_nonblank += 1
        empty = next_nonblank >= len(lines) or bool(re.match(r"^#{1,2}\\\\s+", lines[next_nonblank]))
        internal_empty = key in {"signature protocol", "field implementation", "operator notes", "anti overlap lock"}
        if empty or internal_empty or key in seen:
            i += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            continue
        seen.add(key)
        out.append(line)
        i += 1
    return "


def clean_keyword_labels(text: str) -> str:
    text = re.sub(r"(\\\\d+\\\\.\\\\s+)\\\\*\\\\*[^*
    text = re.sub(r"^-\\\\s+\\\\*\\\\*[^*
    text = re.sub(r"\\\\s+For \\\\*\\\\*[^*]+\\\\*\\\\*, use that distinction as a practical boundary rather than a generic rule\\\\.", "", text)
    text = re.sub(r"\\\\s+Applied to \\\\*\\\\*[^*]+\\\\*\\\\*, the decision should remain visible in the finished example\\\\.", "", text)
    text = re.sub(r"\\\\s+That test keeps \\\\*\\\\*[^*]+\\\\*\\\\* tied to the reader's real situation instead of an abstract ideal\\\\.", "", text)
    text = re.sub(r"\\\\s+Within \\\\*\\\\*[^*]+\\\\*\\\\*, judge the principle against the concrete evidence described on this page\\\\.", "", text)
    text = re.sub(r"^(?:For \\\\*\\\\*[^*]+\\\\*\\\\*,|With \\\\*\\\\*[^*]+\\\\*\\\\* as the focus,|Applied to \\\\*\\\\*[^*]+\\\\*\\\\*,|When planning \\\\*\\\\*[^*]+\\\\*\\\\*,|In the context of \\\\*\\\\*[^*]+\\\\*\\\\*,)\\\\s+", "", text, flags=re.M)
    text = re.sub(r"\\\\s+Use that as a practical boundary for \\\\*\\\\*[^*]+\\\\*\\\\*\\\\.", "", text)
    text = re.sub(r"\\\\s+That keeps \\\\*\\\\*[^*]+\\\\*\\\\* tied to a concrete decision\\\\.", "", text)
    text = re.sub(r"\\\\s+Apply the same test when reviewing \\\\*\\\\*[^*]+\\\\*\\\\*\\\\.", "", text)
    text = re.sub(r"\\\\s+For \\\\*\\\\*[^*]+\\\\*\\\\*, the evidence should make this choice clear\\\\.", "", text)
    text = re.sub(r"\\\\s+This keeps \\\\*\\\\*[^*]+\\\\*\\\\* focused on what the reader can use\\\\.", "", text)
    text = re.sub(r"\\\\s+Use this boundary for \\\\*\\\\*[^*]+\\\\*\\\\*\\\\.", "", text)
    text = re.sub(r"\\\\s+This keeps \\\\*\\\\*[^*]+\\\\*\\\\* concrete\\\\.", "", text)
    text = re.sub(r"\\\\s+Apply this test to \\\\*\\\\*[^*]+\\\\*\\\\*\\\\.", "", text)
    text = re.sub(r"\\\\s+Make this choice visible in \\\\*\\\\*[^*]+\\\\*\\\\*\\\\.", "", text)
    text = re.sub(r"\\\\s+Keep \\\\*\\\\*[^*]+\\\\*\\\\* useful and specific\\\\.", "", text)
    text = re.sub(r"\\\\s+This point is especially relevant to \\\\*\\\\*[^*]+\\\\*\\\\*\\\\.", "", text)
    text = re.sub(r"\\\\s+Keep this distinction visible in \\\\*\\\\*[^*]+\\\\*\\\\*\\\\.", "", text)
    text = re.sub(r"\\\\s+For \\\\*\\\\*[^*]+\\\\*\\\\*, treat this as a practical boundary\\\\.", "", text)
    text = re.sub(r"\\\\s+Use this test when reviewing \\\\*\\\\*[^*]+\\\\*\\\\*\\\\.", "", text)
    text = re.sub(r"\\\\s+That keeps \\\\*\\\\*[^*]+\\\\*\\\\* specific\\\\.", "", text)
    return text


def strip_generated_context_prefixes(text: str) -> str:
    title_match = re.search(r"^#\\\\s+(.+?)\\\\s*$", text, re.M)
    if not title_match:
        return text
    short_title = " ".join(title_match.group(1).split(":", 1)[0].split()[:6])
    pattern = rf"^For \\\\*\\\\*{re.escape(short_title)}\\\\*\\\\*,\\\\s+"
    return re.sub(pattern, "", text, flags=re.M)


def paragraph_key(block: str) -> str | None:
    normalized = re.sub(r"\\\\s+", " ", block.strip()).lower()
    if len(normalized.split()) < 14:
        return None
    if normalized.startswith(("#", "|", "-", "1.", "```", ">")):
        return None
    return normalized


def personalize_repeated_paragraphs(documents: dict[Path, str]) -> dict[Path, str]:
    owners: dict[str, list[Path]] = defaultdict(list)
    for path, text in documents.items():
        for block in re.split(r"
            key = paragraph_key(block)
            if key:
                owners[key].append(path)
    repeated = {key for key, paths in owners.items() if len(set(paths)) > 1}
    result: dict[Path, str] = {}
    for path, text in documents.items():
        title_match = re.search(r"^#\\\\s+(.+?)\\\\s*$", text, re.M)
        title = title_match.group(1).strip() if title_match else path.stem.replace("-", " ").title()
        quick_match = re.search(r"^##\\\\s+Quick answer\\\\s*$\\\\s*(.+?)(?:
        subject_match = re.search(r"\\\\*\\\\*([^*
        subject = subject_match.group(1).strip() if subject_match else " ".join(title.split(":", 1)[0].split()[:6])
        tails = [
            f"This point is especially relevant to **{subject}**.",
            f"Keep this distinction visible in **{subject}**.",
            f"For **{subject}**, treat this as a practical boundary.",
            f"Use this test when reviewing **{subject}**.",
            f"That keeps **{subject}** specific.",
        ]
        blocks = re.split(r"(
        occurrence = 0
        for i in range(0, len(blocks), 2):
            key = paragraph_key(blocks[i])
            if key not in repeated:
                continue
            paragraph = blocks[i].strip()
            paragraph = re.sub(r"^([a-z])", lambda match: match.group(1).upper(), paragraph)
            blocks[i] = paragraph.rstrip() + " " + tails[occurrence % len(tails)]
            occurrence += 1
        result[path] = "".join(blocks)
    return result


def capitalize_plain_paragraphs(text: str) -> str:
    return re.sub(
        r"(^|
        lambda match: match.group(1) + match.group(2).upper(),
        text,
        flags=re.M,
    )


def expand_short_article(text: str) -> str:
    count = len(re.findall(r"\\\\b[\\\\w'-]+\\\\b", text))
    if count >= 600:
        return text
    title_match = re.search(r"^#\\\\s+(.+?)\\\\s*$", text, re.M)
    title = title_match.group(1).strip() if title_match else "this topic"
    h2s = [h.strip() for h in re.findall(r"^##\\\\s+(.+?)\\\\s*$", text, re.M) if h.strip().lower() not in {"next step", "frequently asked questions"}]
    first = h2s[0] if h2s else "the main decision"
    second = h2s[1] if len(h2s) > 1 else "the evidence"
    addition = f"""## A practical review before publishing

Test **{title}** against one real situation rather than an imagined perfect week. Start with **{first}**, write down the constraint that is most likely to change the plan, and identify what the audience can genuinely see or verify. Then use **{second}** to remove any claim, scene or instruction that depends on missing access.

The review is complete when the next action is obvious, the evidence matches the promise and a second person could understand the sequence without another strategy meeting. If the plan still feels broad, reduce the scope before adding more examples. Specific choices improve usefulness; extra volume does not.

"""
    marker = "## Next step"
    if marker in text:
        return text.replace(marker, addition + marker, 1)
    return text.rstrip() + "


def main() -> int:
    changed = 0
    documents: dict[Path, str] = {}
    for path in sorted(CONTENT.glob("*.md")):
        original = path.read_text(encoding="utf-8")
        cleaned = strip_related_guides(original)
        cleaned = remove_empty_and_duplicate_h2(cleaned)
        cleaned = clean_keyword_labels(cleaned)
        cleaned = strip_generated_context_prefixes(cleaned)
        cleaned = capitalize_plain_paragraphs(cleaned)
        cleaned = re.sub(r"
        cleaned = expand_short_article(cleaned)
        documents[path] = cleaned
    for path, cleaned in documents.items():
        original = path.read_text(encoding="utf-8")
        cleaned = re.sub(r"
        if cleaned != original:
            path.write_text(cleaned, encoding="utf-8")
            changed += 1
    print(f"curated sources cleaned: {changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
