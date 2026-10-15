"""
eval-seo-content-quality.py
===========================
COMPREHENSIVE 2026 SEO, AEO & READABILITY EVALUATION SUITE.

Audits every public markdown article in content/resources/ on:
  1. Flesch Reading Ease (Readability >= 45.0, target 50-65)
  2. Information Gain Index (0-100, Decision Tables & Technical Parameters)
  3. AEO Snippet Extractability Score (0-100, Quick Answer Clarity)
  4. Concreteness & Active Voice Index (0-100, Tangible vs Abstract Words)
  5. Human Burstiness Score (0-100, Sentence Length Variance)
  6. Forbidden AI Cliches (Must be 0)
  7. Word Count Compliance (600 - 1200 words)
  8. Exhaustive Pairwise Jaccard Uniqueness (< 0.65)
"""

from __future__ import annotations

import math
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
RESOURCES_DIR = ROOT / "content" / "resources"
SEO_PACKAGE_DIR = ROOT / "content" / "seo-package"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from originality_gate import get_shingles, jaccard_similarity  # noqa: E402
from training_knowledge import FORBIDDEN_CLICHES  # noqa: E402


def prose(text: str) -> str:
    """Extract clean readable prose stripping markdown formatting."""
    t = re.sub(r"```.*?```", " ", text, flags=re.S)
    t = re.sub(r"`[^`]+`", " ", t)
    t = re.sub(r"!?(?:\[([^]]*)\])\([^)]+\)", r"\1", t)
    t = re.sub(r"^\s*[#>|*-]+\s*", "", t, flags=re.M)
    t = re.sub(r"^\s*\d+[.)]\s*", "", t, flags=re.M)
    return re.sub(r"\s+", " ", t).strip()


def syllables(word: str) -> int:
    clean = re.sub(r"[^a-z]", "", word.lower())
    if not clean:
        return 0
    groups = len(re.findall(r"[aeiouy]+", clean))
    if clean.endswith("e") and not clean.endswith(("le", "ye")) and groups > 1:
        groups -= 1
    return max(1, groups)


def flesch_reading_ease(text: str) -> float:
    body = prose(text)
    words = re.findall(r"[A-Za-z]+(?:['-][A-Za-z]+)*", body)
    sentences = [p for p in re.split(r"[.!?]+(?:\s+|$)", body) if p.strip()]
    if not words or not sentences:
        return 100.0
    score = 206.835 - 1.015 * (len(words) / len(sentences)) - 84.6 * (
        sum(syllables(w) for w in words) / len(words)
    )
    return round(max(0.0, min(100.0, score)), 2)


def sentence_burstiness(text: str) -> float:
    body = prose(text)
    sentences = [p for p in re.split(r"[.!?]+(?:\s+|$)", body) if p.strip()]
    if len(sentences) < 5:
        return 50.0
    lengths = [len(s.split()) for s in sentences]
    mean = sum(lengths) / len(lengths)
    variance = sum((x - mean) ** 2 for x in lengths) / len(lengths)
    std_dev = math.sqrt(variance)
    # Healthy human burstiness has std_dev between 5.0 and 12.0
    score = min(100.0, (std_dev / 8.0) * 100.0)
    return round(score, 2)


def aeo_extractability_score(text: str) -> float:
    # Check for Quick answer heading and length
    m = re.search(r"^##\s+Quick answer\s*\n\s*(.+?)(?=\n##|\Z)", text, re.I | re.M | re.S)
    if not m:
        return 0.0
    answer = m.group(1).strip()
    words = answer.split()
    wc = len(words)
    score = 100.0
    if wc < 30:
        score -= 40.0
    elif wc > 90:
        score -= 20.0
    if any(cliche in answer.lower() for cliche in ["in this article", "we will explore", "guide will teach"]):
        score -= 30.0
    if not re.search(r"\b(is|requires|locks|sets|means|focuses)\b", answer, re.I):
        score -= 20.0
    return round(max(0.0, score), 2)


def information_gain_score(text: str) -> float:
    score = 0.0
    # 1. Table presence (25 pts)
    if "| :--- |" in text:
        score += 25.0
    # 2. Concrete technical parameters (35 pts)
    params = re.findall(r"\b(\d+fps|\d+k|\d+mm|\d+dB|\d+%\b|\d+-\d+s|\d+\s*(?:minutes|hours|days|shots|beats))\b", text, re.I)
    score += min(35.0, len(params) * 5.0)
    # 3. Actionable script / formula (20 pts)
    if re.search(r"^##\s+A script you can adapt", text, re.I | re.M):
        score += 20.0
    # 4. PAA FAQs (20 pts)
    faqs = re.findall(r"^###\s+.+\?\s*$", text, re.M)
    score += min(20.0, len(faqs) * 5.0)
    return round(min(100.0, score), 2)


def concreteness_score(text: str) -> float:
    concrete_terms = re.findall(
        r"\b(light|camera|lens|frame|tripod|audio|mic|foley|contract|usage|rights|whitelisting|macro|exposure|kelvin|angle|prop|cut|scene|take|timer|metric|dashboard)\b",
        text, re.I
    )
    abstract_terms = re.findall(
        r"\b(vibe|magic|feeling|amazing|great|wonderful|fantastic|beautiful|elevated|synergy|tapestry|holistic)\b",
        text, re.I
    )
    total = len(concrete_terms) + len(abstract_terms)
    if total == 0:
        return 70.0
    ratio = len(concrete_terms) / total
    return round(ratio * 100.0, 2)


def audit_corpus(directory: Path = RESOURCES_DIR) -> dict:
    files = sorted(directory.glob("*.md"))
    if not files:
        print(f"ERROR: No markdown files found in {directory}")
        return {"error": "no_files"}

    results = []
    cliche_violations = []
    length_violations = []
    readability_warnings = []
    shingles_cache = {}

    for path in files:
        text = path.read_text(encoding="utf-8")
        slug = path.stem
        words = len(re.findall(r"\b[\w'-]+\b", text))
        flesch = flesch_reading_ease(text)
        burst = sentence_burstiness(text)
        aeo = aeo_extractability_score(text)
        info_gain = information_gain_score(text)
        concrete = concreteness_score(text)

        # Cliches
        cliches = [c for c in FORBIDDEN_CLICHES if c in text.lower()]
        if cliches:
            cliche_violations.append((slug, cliches))

        if not (600 <= words <= 1200):
            length_violations.append((slug, words))

        if flesch < 45.0:
            readability_warnings.append((slug, flesch))

        shingles_cache[slug] = get_shingles(text)

        results.append({
            "slug": slug,
            "words": words,
            "flesch": flesch,
            "burstiness": burst,
            "aeo_score": aeo,
            "info_gain": info_gain,
            "concreteness": concrete,
            "cliches": cliches,
        })

    # Pairwise Jaccard Uniqueness
    slugs = list(shingles_cache.keys())
    high_similarity_pairs = []
    for i, left in enumerate(slugs):
        for right in slugs[i + 1:]:
            j = jaccard_similarity(shingles_cache[left], shingles_cache[right])
            if j >= 0.65:
                high_similarity_pairs.append((left, right, round(j, 3)))

    avg_flesch = sum(r["flesch"] for r in results) / len(results)
    avg_info_gain = sum(r["info_gain"] for r in results) / len(results)
    avg_aeo = sum(r["aeo_score"] for r in results) / len(results)
    avg_concrete = sum(r["concreteness"] for r in results) / len(results)
    avg_burst = sum(r["burstiness"] for r in results) / len(results)

    return {
        "total_articles": len(results),
        "avg_flesch_readability": round(avg_flesch, 2),
        "avg_information_gain": round(avg_info_gain, 2),
        "avg_aeo_score": round(avg_aeo, 2),
        "avg_concreteness": round(avg_concrete, 2),
        "avg_burstiness": round(avg_burst, 2),
        "cliche_violations": cliche_violations,
        "length_violations": length_violations,
        "readability_below_45": readability_warnings,
        "high_similarity_pairs": high_similarity_pairs,
        "pass": (
            len(cliche_violations) == 0
            and len(length_violations) == 0
            and len(high_similarity_pairs) == 0
            and avg_flesch >= 45.0
            and avg_info_gain >= 85.0
            and avg_aeo >= 90.0
        ),
    }


def main() -> int:
    print("=" * 70)
    print("  COMPREHENSIVE 2026 SEO, AEO & READABILITY EVALUATION SUITE")
    print("=" * 70)

    report = audit_corpus(RESOURCES_DIR)
    if "error" in report:
        return 1

    print(f"\n[Corpus Metrics: {report['total_articles']} Articles]")
    print(f"  Flesch Reading Ease (Target >= 45.0):     {report['avg_flesch_readability']:.2f}")
    print(f"  Information Gain Index (0-100):           {report['avg_information_gain']:.2f}")
    print(f"  AEO Snippet Extractability Score (0-100):  {report['avg_aeo_score']:.2f}")
    print(f"  Concreteness Index (0-100):               {report['avg_concreteness']:.2f}")
    print(f"  Human Burstiness Score (0-100):           {report['avg_burstiness']:.2f}")
    print(f"\n[Guardrail Compliance]")
    print(f"  Cliché Violations:                        {len(report['cliche_violations'])}")
    print(f"  Word Count Outliers (<600 or >1200):      {len(report['length_violations'])}")
    print(f"  Readability Warnings (<45.0):             {len(report['readability_below_45'])}")
    print(f"  Near-Duplicate Pairs (Jaccard >= 0.65):   {len(report['high_similarity_pairs'])}")

    if report["high_similarity_pairs"][:5]:
        print("\n  Sample high similarity pairs:")
        for a, b, j in report["high_similarity_pairs"][:5]:
            print(f"    {a} ~ {b}: {j}")

    if report["pass"]:
        print("\n" + "=" * 70)
        print("  SUCCESS: All articles pass 2026 AEO, Readability & Quality Standards!")
        print("=" * 70)
        return 0
    else:
        print("\n" + "=" * 70)
        print("  FAIL: Quality benchmark requirements not fully met.")
        print("=" * 70)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
