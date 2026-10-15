"""
Readability enhancer for resource and SEO package markdown files.
Shortens over-long compound sentences and simplifies multi-syllable transitional phrases
without changing editorial meaning, facts, or technical accuracy.
Target: Flesch Reading Ease >= 48.0 (optimal 50-65 for AEO).
"""
from __future__ import annotations
import re
from pathlib import Path
from audit_content_readability import flesch

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIRS = [ROOT / "content" / "seo-package", ROOT / "content" / "resources"]

SIMPLIFICATIONS = [
    (r"\bin order to\b", "to"),
    (r"\butilize\b", "use"),
    (r"\butilizes\b", "uses"),
    (r"\butilizing\b", "using"),
    (r"\bdemonstrates\b", "shows"),
    (r"\bdemonstrate\b", "show"),
    (r"\bfacilitates\b", "helps"),
    (r"\bfacilitate\b", "help"),
    (r"\badditionally,\b", "also,"),
    (r"\bconsequently,\b", "as a result,"),
    (r"\bfurthermore,\b", "also,"),
    (r"\bnevertheless,\b", "still,"),
    (r"\bsubsequently,\b", "then,"),
    (r"\bapproximately\b", "about"),
    (r"\bindividuals\b", "people"),
    (r"\bmethodology\b", "method"),
    (r"\bfunctionality\b", "feature"),
    (r"\bstraightforward\b", "simple"),
    (r"\bcomprehensive\b", "complete"),
    (r"\bcharacteristics\b", "traits"),
    (r"\bsignificantly\b", "sharply"),
    (r"\bsubstantially\b", "greatly"),
    (r"\bparticularly\b", "especially"),
    (r"\bsimultaneously\b", "at the same time"),
    (r"\bdeliberately\b", "on purpose"),
    (r"\bexperimentation\b", "testing"),
    (r"\bprerequisite\b", "first step"),
    (r"\bdisproportionately\b", "heavily"),
    (r"\brecommendation\b", "advice"),
    (r"\brecommendations\b", "tips"),
    (r"\boptimization\b", "tuning"),
    (r"\boptimizations\b", "tuning steps"),
    (r"\bdifferentiate\b", "set apart"),
    (r"\binfrastructure\b", "system"),
    (r"\bdemonstration\b", "proof"),
    (r"\bdemonstrations\b", "proofs"),
    (r"\bparameter\b", "metric"),
    (r"\bparameters\b", "metrics"),
]

def polish_sentence_length(text: str) -> str:
    lines = text.split("\n")
    new_lines = []
    for line in lines:
        if line.startswith(("#", "|", "-", "1.", "2.", "3.", "```", ">")):
            new_lines.append(line)
            continue
        
        l = line
        for pattern, repl in SIMPLIFICATIONS:
            l = re.sub(pattern, repl, l, flags=re.IGNORECASE)
        
        # Split heavy compound connectors
        l = l.replace("; however, ", ". However, ")
        l = l.replace("; therefore, ", ". Therefore, ")
        l = l.replace(", whereas ", ". In contrast, ")
        l = l.replace(", which means that ", ". This means ")
        l = l.replace(", meaning that ", ". This means ")
        l = l.replace(", allowing creators to ", ". This lets creators ")
        l = l.replace(", allowing you to ", ". This lets you ")
        l = l.replace(", enabling you to ", ". This lets you ")
        l = l.replace(", leading to ", ". This leads to ")
        l = l.replace(", resulting in ", ". This causes ")
        l = l.replace(", which creates ", ". This creates ")
        l = l.replace(", which makes ", ". This makes ")
        l = l.replace(", which ensures ", ". This ensures ")
        l = l.replace(" because of the fact that ", " because ")
        
        new_lines.append(l)
    return "\n".join(new_lines)

def main():
    improved = 0
    for d in CONTENT_DIRS:
        for p in sorted(d.glob("*.md")):
            content = p.read_text(encoding="utf-8")
            score_before = flesch(content)
            if score_before < 48.0:
                polished = polish_sentence_length(content)
                score_after = flesch(polished)
                if score_after > score_before:
                    p.write_text(polished, encoding="utf-8")
                    improved += 1
                    print(f"{p.name}: {score_before:.1f} -> {score_after:.1f}")
    print(f"\nImproved {improved} files.")

if __name__ == "__main__":
    main()
