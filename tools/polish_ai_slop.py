"""
Precision cleanup for specific AI slop phrases:
1. "client journey" -> "client progression"
2. "customer journey" -> "customer decision path" / "buyer path"
3. "buyer journey" -> "buying process"
4. "sleep disruption" -> "persistent sleep issues"
5. "travel journey" / "transit journey" -> "travel route" / "transit sequence"
6. "disruption" in burnout disclaimers -> "sleep issues" / "routine interruption"
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIRS = [
    ROOT / "content" / "resources",
    ROOT / "content" / "seo-package",
]

REPLACEMENTS = [
    # Burnout disclaimers
    (re.compile(r"\bsleep disruption\b", re.IGNORECASE), "persistent sleep issues"),
    (re.compile(r"\bdisruption to sleep\b", re.IGNORECASE), "interrupted sleep"),
    
    # Journey -> specific concrete terms
    (re.compile(r"\bclient[ -]journey evidence\b", re.IGNORECASE), "client progression evidence"),
    (re.compile(r"\bclient journey\b", re.IGNORECASE), "client progression"),
    (re.compile(r"\bClient journey\b"), "Client progression"),
    (re.compile(r"\bcustomer journey\b", re.IGNORECASE), "customer decision path"),
    (re.compile(r"\bbuyer journey\b", re.IGNORECASE), "buying path"),
    (re.compile(r"\bvisual journey\b", re.IGNORECASE), "visual progression"),
    (re.compile(r"\bcreator journey\b", re.IGNORECASE), "creator workflow"),
    (re.compile(r"\btransformation journey\b", re.IGNORECASE), "transformation process"),
    (re.compile(r"\bfitness journey\b", re.IGNORECASE), "training progression"),
    (re.compile(r"\btravel journey\b", re.IGNORECASE), "travel route"),
]

def main():
    changed_files = 0
    total_replacements = 0

    for content_dir in CONTENT_DIRS:
        for p in content_dir.glob("*.md"):
            text = p.read_text(encoding="utf-8")
            orig = text
            file_replacements = 0
            for pattern, repl in REPLACEMENTS:
                new_text, count = pattern.subn(repl, text)
                if count > 0:
                    text = new_text
                    file_replacements += count
            
            if text != orig:
                p.write_text(text, encoding="utf-8")
                changed_files += 1
                total_replacements += file_replacements

    print(f"Cleaned {changed_files} files with {total_replacements} replacements.")

if __name__ == "__main__":
    main()
