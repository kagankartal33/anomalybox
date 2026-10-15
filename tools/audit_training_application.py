"""
audit_training_application.py
=============================
SEO CONTENT PIPELINE ONLY.

Verifies that content/resources articles:
  1. Are unique (title-strip + exhaustive pairwise Jaccard check)
  2. Use reader-facing answer, method, script, implementation and FAQ sections
  3. Avoid forbidden AI cliches and internal editorial instructions
  4. Do not contain training source leaks (book titles, SCR-ids, viral jargon)
  5. Stay in the 600–1200 word band
  6. Do not attach viral-card training signals (VTP, idea_card fields, etc.)

Does not audit viral idea cards — use quality-gate / generator tests for that.
"""

from __future__ import annotations

import hashlib
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESOURCES = ROOT / "content" / "resources"
sys.path.insert(0, str(Path(__file__).resolve().parent))

from originality_gate import get_shingles, jaccard_similarity  # noqa: E402
from training_knowledge import FORBIDDEN_CLICHES, training_status_report  # noqa: E402

SOURCE_LEAK_PATTERNS = [
    r"\bSCR-\d+\b",
    r"\bArt of SEO\b",
    r"\bEverybody Writes\b",
    r"\bThey Ask,? You Answer\b",
    r"\bContent Chemistry\b",
    r"\bProduct-led SEO\b",
    r"\btraining_weight\b",
    r"\bpattern_only\b",
    r"\bunified_master_content_profile\b",
    r"\bbook_train\b",
    r"\bVTP-\d+\b",
    r"\bidea_card\b",
    r"\bscore_band\b",
    r"\bviral_training\b",
    r"\bcinema/story training\b",
    r"\bcraft constraints \(from cinema",
]

STRUCTURE_CHECKS = {
    "quick_answer": re.compile(r"^## Quick answer$", re.I | re.M),
    "matrix": re.compile(r"\| :--- \|"),
    "method": re.compile(r"^## How to put the method into practice$", re.I | re.M),
    "script": re.compile(r"^## A script you can adapt$", re.I | re.M),
    "steps": re.compile(r"^## A practical first pass$", re.I | re.M),
    "faqs": re.compile(r"Frequently asked questions", re.I),
}

PUBLIC_LEAK_PATTERNS = [
    r">\s*\*\*Zero-Click Summary:\*\*",
    r"SEO operator rules",
    r"training profile",
    r"Scope lock:",
    r"Search intent for \*\*.+?\*\* is",
    r"No content may be auto-published",
    r"Keep the answer specific to your niche constraints",
]

VIRAL_BLEED_PATTERNS = [
    r"cinema/story training",
    r"Craft constraints \(from cinema",
    r"\bVTP-\d+",
    r"\bidea_summary\b",
    r"\bhook_performance_pack\b",
]


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def main() -> int:
    print("=" * 70)
    print(" TRAINING APPLICATION + UNIQUENESS AUDIT")
    print("=" * 70)

    tstatus = training_status_report()
    print("\n[Training load]")
    print(f"  SEO rules: {tstatus['seo_rules_count']}")
    print(f"  Principles: {tstatus['principles_count']}")
    print(f"  Craft cues: {tstatus['craft_cue_count']}")
    print(f"  Files: {tstatus['files']}")

    files = sorted(RESOURCES.glob("*.md"))
    if not files:
        print("ERROR: no markdown in content/resources")
        return 1

    structure_fail = defaultdict(int)
    leak_hits = []
    cliche_hits = []
    viral_bleed = []
    public_leaks = []
    short_docs = []
    long_docs = []
    bodies = {}

    for path in files:
        text = path.read_text(encoding="utf-8")
        slug = path.stem
        title = ""
        for line in text.splitlines():
            if line.startswith("# "):
                title = line[2:].strip()
                break
        wc = word_count(text)
        if wc < 600:
            short_docs.append((slug, wc))
        if wc > 1200:
            long_docs.append((slug, wc))

        for name, rx in STRUCTURE_CHECKS.items():
            if not rx.search(text):
                structure_fail[name] += 1

        low = text.lower()
        for c in FORBIDDEN_CLICHES:
            if c in low:
                cliche_hits.append((slug, c))
                break

        for pat in SOURCE_LEAK_PATTERNS:
            if re.search(pat, text, re.I):
                leak_hits.append((slug, pat))
                break

        for pat in VIRAL_BLEED_PATTERNS:
            if re.search(pat, text, re.I):
                viral_bleed.append((slug, pat))
                break

        for pat in PUBLIC_LEAK_PATTERNS:
            if re.search(pat, text, re.I):
                public_leaks.append((slug, pat))
                break

        body = text.replace(title, "TITLE") if title else text
        body = re.sub(r"\s+", " ", body).strip().lower()
        h = hashlib.sha256(body.encode()).hexdigest()[:16]
        bodies.setdefault(h, []).append(slug)

    unique_count = len(bodies)
    dup_clusters = {h: v for h, v in bodies.items() if len(v) > 1}

    # Full pairwise near-duplicate check. The corpus is small enough to keep this
    # exhaustive, which prevents a similar pair from hiding outside a sample.
    sample_slugs = [p.stem for p in files]
    shingle_cache = {
        slug: get_shingles((RESOURCES / f"{slug}.md").read_text(encoding="utf-8"))
        for slug in sample_slugs
    }
    high_j = []
    for i, left in enumerate(sample_slugs):
        for right in sample_slugs[i + 1:]:
            j = jaccard_similarity(shingle_cache[left], shingle_cache[right])
            if j >= 0.70:
                high_j.append((left, right, j))

    print(f"\n[Corpus] {len(files)} articles")
    print(f"  Unique title-stripped bodies: {unique_count}/{len(files)}")
    print(f"  Duplicate clusters: {len(dup_clusters)}")
    print(f"  Word count short(<600): {len(short_docs)} | long(>1200): {len(long_docs)}")
    print(f"  Structure misses: {dict(structure_fail)}")
    print(f"  Cliche hits: {len(cliche_hits)}")
    print(f"  Source-leak hits: {len(leak_hits)}")
    print(f"  Viral-card bleed hits: {len(viral_bleed)}")
    print(f"  Public editorial-instruction leaks: {len(public_leaks)}")
    print(f"  Near-duplicate Jaccard pairs in corpus (>=0.70): {len(high_j)}")
    print(f"  Pipeline claim: {tstatus.get('pipeline')} | viral_attached={tstatus.get('viral_training_attached')}")

    if high_j[:5]:
        print("  Sample high-J pairs:")
        for a, b, j in high_j[:5]:
            print(f"    {a} ~ {b}: {j:.3f}")
    if leak_hits[:5]:
        print("  Leaks:")
        for s, p in leak_hits[:5]:
            print(f"    {s}: {p}")
    if viral_bleed[:5]:
        print("  Viral bleed:")
        for s, p in viral_bleed[:5]:
            print(f"    {s}: {p}")
    if cliche_hits[:5]:
        print("  Cliches:")
        for s, c in cliche_hits[:5]:
            print(f"    {s}: {c}")

    ok = (
        unique_count == len(files)
        and not dup_clusters
        and not structure_fail
        and not short_docs
        and not long_docs
        and not high_j
        and not leak_hits
        and not viral_bleed
        and not public_leaks
        and not cliche_hits
        and tstatus["seo_rules_count"] >= 20
        and tstatus.get("viral_training_attached") is False
    )

    print(
        "\n"
        + (
            "SUCCESS: SEO pipeline isolated — unique articles, no viral-card training bleed."
            if ok
            else "FAIL: See issues above."
        )
    )
    return 0 if ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
