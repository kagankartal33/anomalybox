"""
Full-site AI residue scanner.
Scans: content/resources, content/seo-package, app pages (TSX), components, and any public-facing copy.
Reports: banned phrases, meta-dialogue, generic CTA, AI slop markers, template bleed.
"""

from __future__ import annotations
import re
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[1]

# ─── Phrase lists ─────────────────────────────────────────────────────────────

BANNED_VAGUE = [
    "premium moment", "premium frame", "beauty moment", "fitness moment",
    "food moment", "proof detail", "carry the energy", "elevate the content",
    "authentic impact", "polished storytelling", "hidden decision",
    "compelling reveal", "engaging experience", "captivating content",
    "seamless transition", "strategic authenticity", "dynamic visual",
    "resonate with viewers", "high-value content", "powerful payoff",
    "stop the scroll", "game-changing", "effortless engagement",
    "bring value", "add value", "deliver value", "create impact",
    "drive engagement", "maximize impact", "authentic connection",
    "visual journey", "storytelling moment", "premium experience",
    "meaningful moment", "content moment", "strong energy",
    "credible energy", "polished energy",
    "enerjik ol", "heyecanla anlat", "kameraya gül",
    "be energetic", "talk excitedly", "act natural", "show emotion",
]

META_DIALOGUE = [
    "the creator should", "the creator says", "the user sees",
    "the audience will see", "this content will", "this video should",
    "insert product name", "insert category", "add text here",
    "the model should", "the viewer",
]

GENERIC_CTA = [
    "what do you think", "let me know below", "follow for more",
    "save this for later", "tag a friend", "do you agree",
    "comment below", "share this",
]

# Additional AI slop markers beyond the banned list
AI_SLOP_EXTENDED = [
    # Classic ChatGPT intros
    "in today's fast-paced", "in today's digital world", "in today's world",
    "in the digital age", "in the modern era", "in the ever-evolving",
    "in an increasingly", "as we navigate", "it's no secret that",
    "it is no secret that", "needless to say", "at the end of the day",
    "a holistic approach", "leverage your", "leverage their", "leverage the",
    "synergy", "synergize", "revolutionize", "transformative",
    "unleash your", "unleash the", "unleash your potential",
    "unlock your potential", "unlock your", "unlock their",
    "cutting-edge", "state-of-the-art", "best-in-class",
    "world-class", "world class", "next level", "next-level",
    "takes it to the next level", "journey", "embark on",
    "dive into", "dive deep", "delve into", "delve deep",
    "the power of", "harness the power", "harness your",
    "with ease", "effortlessly", "seamlessly", "intuitively",
    "vibrant community", "passionate community",
    "don't just take our word for it",
    "like-minded individuals", "like-minded people",
    "on a personal level", "this is your chance",
    "supercharge your", "skyrocket your", "skyrocket",
    "take your game to", "elevate your game",
    "game changer", "game-changer", "gamechanger",
    "thought leader", "thought leadership",
    "circle back", "deep dive", "bandwidth",
    "move the needle", "move the needle on",
    "actionable insights", "actionable strategies",
    "drive results", "deliver results", "impactful",
    "impactful content", "meaningful impact",
    "pivotal", "paramount", "utmost importance",
    "robust", "robust strategy", "robust system",
    "utilize", "utilization", "utilize the", "utilize your",
    "meticulous", "meticulously", "meticulously crafted",
    "commendable", "it's worth noting", "it is worth noting",
    "in conclusion", "to summarize", "to sum up",
    "in summary", "in closing", "to wrap up",
    "having said that", "that being said", "with that said",
    "without further ado", "without further delay",
    # Generic influencer phrases
    "so today i'm", "hey guys", "hey everyone", "hey there",
    "welcome back to", "welcome back", "let's get into it",
    "let's dive in", "let's jump in", "let's get started",
    "be sure to", "make sure to", "don't forget to",
    "share in the comments", "drop a comment",
    "smash that like button", "hit that subscribe",
    # Fake data / placeholder patterns
    "[insert", "[your", "[brand name]", "[product name]",
    "[your name]", "[add your", "lorem ipsum",
    # Corporate speak
    "value proposition", "key takeaways", "pain points",
    "low-hanging fruit", "win-win", "think outside the box",
    "paradigm shift", "disruptive", "disruption",
    "innovative solution", "solutions-oriented",
    "customer-centric", "data-driven", "results-driven",
]

# ─── Scan targets ─────────────────────────────────────────────────────────────

SCAN_DIRS = [
    ROOT / "content" / "resources",
    ROOT / "content" / "seo-package",
    ROOT / "app",
    ROOT / "components",
]

SCAN_EXTENSIONS = {".md", ".tsx", ".ts", ".jsx", ".js"}

EXCLUDE_PATTERNS = [
    "node_modules", ".next", ".git", "banned-phrases",
    "ai-residue", "quality.ts", "test", "spec", "polish_readability",
    "__tests__",
]

def should_exclude(path: Path) -> bool:
    parts = path.parts
    return any(ex in str(path) for ex in EXCLUDE_PATTERNS)

def _compile_patterns(phrases: list[str]) -> list[tuple[str, re.Pattern]]:
    compiled = []
    for p in phrases:
        prefix = r"\b" if p[0].isalnum() else ""
        suffix = r"\b" if p[-1].isalnum() else ""
        compiled.append((p, re.compile(prefix + re.escape(p) + suffix, re.IGNORECASE)))
    return compiled

COMPILED_BANNED_VAGUE = _compile_patterns(BANNED_VAGUE)
COMPILED_META_DIALOGUE = _compile_patterns(META_DIALOGUE)
COMPILED_GENERIC_CTA = _compile_patterns(GENERIC_CTA)
COMPILED_AI_SLOP = _compile_patterns(AI_SLOP_EXTENDED)

def scan_file(path: Path) -> list[tuple[int, str, str]]:
    """Returns list of (line_number, matched_phrase, category)"""
    hits = []
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
        lines = text.split("\n")
        for lineno, line in enumerate(lines, 1):
            for phrase, pattern in COMPILED_BANNED_VAGUE:
                if pattern.search(line):
                    hits.append((lineno, phrase, "BANNED_VAGUE"))
                    break
            for phrase, pattern in COMPILED_META_DIALOGUE:
                if pattern.search(line):
                    hits.append((lineno, phrase, "META_DIALOGUE"))
                    break
            for phrase, pattern in COMPILED_GENERIC_CTA:
                if pattern.search(line):
                    hits.append((lineno, phrase, "GENERIC_CTA"))
                    break
            for phrase, pattern in COMPILED_AI_SLOP:
                if pattern.search(line):
                    hits.append((lineno, phrase, "AI_SLOP"))
                    break
    except Exception:
        pass
    return hits

def main() -> None:
    results: dict[str, list[tuple[int, str, str]]] = {}
    
    for scan_dir in SCAN_DIRS:
        if not scan_dir.exists():
            continue
        for path in sorted(scan_dir.rglob("*")):
            if path.is_dir():
                continue
            if path.suffix not in SCAN_EXTENSIONS:
                continue
            if should_exclude(path):
                continue
            hits = scan_file(path)
            if hits:
                rel = str(path.relative_to(ROOT)).replace("\\", "/")
                results[rel] = hits

    # Group by category
    by_category: dict[str, list[tuple[str, int, str]]] = defaultdict(list)
    for filepath, hits in results.items():
        for lineno, phrase, cat in hits:
            by_category[cat].append((filepath, lineno, phrase))

    total = sum(len(v) for v in results.values())
    print(f"\n{'='*70}")
    print(f"AI RESIDUE SCAN REPORT — {total} hits across {len(results)} files")
    print(f"{'='*70}\n")

    for cat in ["BANNED_VAGUE", "META_DIALOGUE", "GENERIC_CTA", "AI_SLOP"]:
        items = by_category.get(cat, [])
        if not items:
            continue
        print(f"\n-- {cat} ({len(items)} hits) ----------------------------------")
        for filepath, lineno, phrase in sorted(items):
            print(f"  {filepath}:{lineno}  ->  \"{phrase}\"")

    print(f"\n{'='*70}")
    print(f"Total files with AI residue: {len(results)}")
    print(f"Total individual hits: {total}")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    main()
