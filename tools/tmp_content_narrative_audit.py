from __future__ import annotations

import math
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIRS = (ROOT / "content" / "seo-package", ROOT / "content" / "resources")

RESIDUE_PATTERNS = {
    "page-focus": r"\\\\bPage focus:",
    "publication-evidence": r"\\\\bpublication evidence\\\\b",
    "must-verify-live": r"\\\\bmust verify live\\\\b",
    "angle-instruction": r"\\\\bapply (?:the|this) .{0,80}? angle\\\\b",
    "practical-aim": r"\\\\bhas one practical aim\\\\b",
    "generic-proof-first": r"\\\\bdecide the audience outcome and credible proof first\\\\b",
    "generic-final-pass": r"\\\\buse the final pass to remove ambiguity\\\\b",
    "generic-evidence-tail": r"\\\\btied to evidence gathered during\\\\b",
    "article-self-reference": r"\\\\b(?:this article|this guide) (?:will|helps|shows|explains|covers)\\\\b",
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
    text = re.sub(r"```[\\\\s\\\\S]*?```", " ", markdown)
    text = re.sub(r"!\\\\[([^]]*)\\\\]\\\\([^)]+\\\\)", r"\\\\1", text)
    text = re.sub(r"\\\\[([^]]+)\\\\]\\\\([^)]+\\\\)", r"\\\\1", text)
    blocks = []
    for block in re.split(r"
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

for corpus in ("seo-package", "resources"):
    group = [item for item in metrics if item["corpus"] == corpus]
    residue_counts = Counter(name for item in group for name in item["residue"])
    print(
        f"DETAIL {corpus} placeholders={sum(item['placeholders'] > 0 for item in group)} "
        f"formulaic={sum(item['formulaic'] > 0 for item in group)} residue_files={sum(bool(item['residue']) for item in group)} "
        f"residue_patterns={dict(residue_counts)}"
    )

for corpus in ("seo-package", "resources"):
    group = [item for item in metrics if item["corpus"] == corpus]
    print(f"TOP_RISK_{corpus.upper()}")
    for item in sorted(group, key=lambda value: (-value["risk"], value["flesch"]))[:18]:
        rel = item["path"].relative_to(ROOT).as_posix()
        print(
            f"{item['risk']:03d} | {rel} | words={item['words']} flesch={item['flesch']} avgS={item['avg_sentence']} "
            f"long={item['long_ratio']}% slots={item['placeholders']} formula={item['formulaic']} "
            f"residue={','.join(item['residue']) or '-'}"
        )

for corpus in ("seo-package", "resources"):
    group = [item for item in metrics if item["corpus"] == corpus]
    print(f"LOW_RISK_{corpus.upper()}")
    for item in sorted(group, key=lambda value: (value["risk"], -value["flesch"]))[:10]:
        rel = item["path"].relative_to(ROOT).as_posix()
        print(
            f"{item['risk']:03d} | {rel} | words={item['words']} flesch={item['flesch']} "
            f"slots={item['placeholders']} formula={item['formulaic']} residue={','.join(item['residue']) or '-'}"
        )

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