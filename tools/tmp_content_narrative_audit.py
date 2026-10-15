from __future__ import annotations

import math
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIRS = (ROOT / "content" / "seo-package", ROOT / "content" / "resources")

RESIDUE_PATTERNS = {
    "page-focus": r"\bPage focus:",
    "publication-evidence": r"\bpublication evidence\b",
    "must-verify-live": r"\bmust verify live\b",
    "angle-instruction": r"\bapply (?:the|this) .{0,80}? angle\b",
    "practical-aim": r"\bhas one practical aim\b",
    "generic-proof-first": r"\bdecide the audience outcome and credible proof first\b",
    "generic-final-pass": r"\buse the final pass to remove ambiguity\b",
    "generic-evidence-tail": r"\btied to evidence gathered during\b",
    "article-self-reference": r"\b(?:this article|this guide) (?:will|helps|shows|explains|covers)\b",
}

COMMON_ALLOWED_HEADINGS = {
    "frequently asked questions",
    "next step",
    "what this means",
}


def words(text: str) -> list[str]:
    return re.findall(r"[A-Za-z]+(?:['-][A-Za-z]+)*", text)


def syllables(word: str) -> int:
    token = re.sub(r"[^a-z]", "", word.lower())
    if not token:
        return 0
    groups = len(re.findall(r"[aeiouy]+", token))
    if token.endswith("e") and not token.endswith(("le", "ye")) and groups > 1:
        groups -= 1
    return max(1, groups)


def prose_blocks(markdown: str) -> list[str]:
    text = re.sub(r"```[\s\S]*?```", " ", markdown)
    text = re.sub(r"!\[([^]]*)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"\[([^]]+)\]\([^)]+\)", r"\1", text)
    blocks = []
    for block in re.split(r"\n\s*\n", text):
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines or all(line.startswith(("#", "|", "- ", "* ", ">", "1. ", "2. ", "3. ", "4. ", "5. ")) for line in lines):
            continue
        cleaned = " ".join(re.sub(r"^\d+\.\s+", "", line) for line in lines)
        cleaned = re.sub(r"[*_`>]", "", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        if len(words(cleaned)) >= 8:
            blocks.append(cleaned)
    return blocks


def sentences(blocks: list[str]) -> list[str]:
    result = []
    for block in blocks:
        result.extend(part.strip() for part in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'])", block) if len(words(part)) >= 4)
    return result


def skeleton(sentence: str) -> str:
    value = re.sub(r"\*\*[^*]+\*\*", " <topic> ", sentence)
    value = re.sub(r"\[[^]]+\]", " <slot> ", value)
    value = re.sub(r"“[^”]+”|\"[^\"]+\"", " <quote> ", value)
    value = re.sub(r"\b\d+(?:\.\d+)?\b", " <num> ", value)
    value = re.sub(r"\[[^]]+\]\([^)]+\)", " <link> ", value)
    value = re.sub(r"[^a-z<> ]+", " ", value.lower())
    return re.sub(r"\s+", " ", value).strip()


files = [path for directory in CONTENT_DIRS for path in sorted(directory.glob("*.md"))]
raw_by_path = {path: path.read_text(encoding="utf-8") for path in files}
sentence_owners: dict[str, set[Path]] = defaultdict(set)
heading_owners: dict[str, set[Path]] = defaultdict(set)

for path, raw in raw_by_path.items():
    for sentence in sentences(prose_blocks(raw)):
        normalized = skeleton(sentence)
        if len(normalized.split()) >= 8:
            sentence_owners[normalized].add(path)
    for heading in re.findall(r"^##\s+(.+?)\s*$", raw, re.M):
        normalized = re.sub(r"[^a-z0-9]+", " ", heading.lower()).strip()
        heading_owners[normalized].add(path)

metrics = []
for path, raw in raw_by_path.items():
    blocks = prose_blocks(raw)
    sentence_list = sentences(blocks)
    sentence_lengths = [len(words(item)) for item in sentence_list] or [0]
    paragraph_lengths = [len(words(item)) for item in blocks] or [0]
    all_words = words(" ".join(blocks))
    word_count = len(words(raw))
    sentence_count = max(1, len(sentence_list))
    syllable_count = sum(syllables(word) for word in all_words)
    prose_word_count = max(1, len(all_words))
    flesch = 206.835 - 1.015 * (prose_word_count / sentence_count) - 84.6 * (syllable_count / prose_word_count)
    avg_sentence = sum(sentence_lengths) / len(sentence_lengths)
    long_ratio = sum(length > 28 for length in sentence_lengths) / len(sentence_lengths)
    sorted_paragraphs = sorted(paragraph_lengths)
    p95_paragraph = sorted_paragraphs[min(len(sorted_paragraphs) - 1, math.floor(len(sorted_paragraphs) * 0.95))]
    placeholders = len(re.findall(r"\[(?![^]]+\]\()[^]]{2,80}\]", raw))
    residue = [name for name, pattern in RESIDUE_PATTERNS.items() if re.search(pattern, raw, re.I)]
    formulaic = {
        skeleton(sentence)
        for sentence in sentence_list
        if len(sentence_owners[skeleton(sentence)]) >= 4 and len(skeleton(sentence).split()) >= 8
    }
    headings = [re.sub(r"[^a-z0-9]+", " ", item.lower()).strip() for item in re.findall(r"^##\s+(.+?)\s*$", raw, re.M)]
    common_headings = [heading for heading in headings if heading not in COMMON_ALLOWED_HEADINGS and len(heading_owners[heading]) >= 8]

    risk = 0
    risk += 20 if flesch < 40 else 12 if flesch < 50 else 5 if flesch < 60 else 0
    risk += 15 if avg_sentence > 25 else 8 if avg_sentence > 21 else 0
    risk += min(15, round(long_ratio * 40))
    risk += 12 if p95_paragraph > 130 else 6 if p95_paragraph > 90 else 0
    risk += min(18, placeholders * 3)
    risk += min(24, len(residue) * 6)
    risk += min(24, len(formulaic) * 3)
    risk += min(8, len(common_headings) * 2)

    metrics.append({
        "path": path,
        "corpus": path.parent.name,
        "words": word_count,
        "flesch": round(flesch, 1),
        "avg_sentence": round(avg_sentence, 1),
        "long_ratio": round(long_ratio * 100, 1),
        "p95_paragraph": p95_paragraph,
        "placeholders": placeholders,
        "residue": residue,
        "formulaic": len(formulaic),
        "common_headings": len(common_headings),
        "risk": risk,
    })

print(f"FILES {len(metrics)}")
for corpus in ("seo-package", "resources"):
    group = [item for item in metrics if item["corpus"] == corpus]
    print(
        f"CORPUS {corpus} count={len(group)} avg_flesch={sum(item['flesch'] for item in group)/len(group):.1f} "
        f"avg_sentence={sum(item['avg_sentence'] for item in group)/len(group):.1f} avg_risk={sum(item['risk'] for item in group)/len(group):.1f}"
    )

print("READABILITY_BANDS", dict(Counter(
    "difficult<40" if item["flesch"] < 40 else "fairly-difficult<50" if item["flesch"] < 50 else "standard<60" if item["flesch"] < 60 else "easy>=60"
    for item in metrics
)))
print("FILES_WITH_PLACEHOLDERS", sum(item["placeholders"] > 0 for item in metrics))
print("FILES_WITH_RESIDUE", sum(bool(item["residue"]) for item in metrics))
print("FILES_WITH_FORMULAIC_SENTENCES", sum(item["formulaic"] > 0 for item in metrics))

print("TOP_RISK")
for item in sorted(metrics, key=lambda value: (-value["risk"], value["flesch"]))[:35]:
    rel = item["path"].relative_to(ROOT).as_posix()
    print(
        f"{item['risk']:03d} | {rel} | words={item['words']} flesch={item['flesch']} avgS={item['avg_sentence']} "
        f"long={item['long_ratio']}% p95P={item['p95_paragraph']} slots={item['placeholders']} "
        f"formula={item['formulaic']} residue={','.join(item['residue']) or '-'}"
    )

print("COMMON_SENTENCE_SKELETONS")
for sentence, owners in sorted(sentence_owners.items(), key=lambda item: (-len(item[1]), item[0]))[:15]:
    if len(owners) < 4:
        continue
    print(f"{len(owners):03d} files | {sentence[:180]}")

print("COMMON_H2")
for heading, owners in sorted(heading_owners.items(), key=lambda item: (-len(item[1]), item[0]))[:20]:
    print(f"{len(owners):03d} files | {heading}")