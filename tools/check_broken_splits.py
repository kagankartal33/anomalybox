"""
Inspect content/resources for broken sentence splits (e.g. 'synthetic. Generic', 'Instagram. YouTube').
"""

import re
from pathlib import Path

ROOT = Path(r"c:\Users\Kagan\OneDrive\Desktop\ViralBox")
RESOURCES = ROOT / "content" / "resources"

for md_file in sorted(RESOURCES.glob("*.md")):
    text = md_file.read_text(encoding="utf-8")
    lines = text.splitlines()
    broken = []
    for i, line in enumerate(lines, 1):
        # Look for period followed by uppercase inside list item or sentence fragments
        # e.g. "Instagram. YouTube", "raw. Unedited", "human. Voice"
        matches = re.findall(r'([a-z0-9]+\.\s+[A-Z][a-z]+)', line)
        for m in matches:
            # Filter out normal sentence ends
            # e.g. "problem. Here", "view. The", "point. This"
            # Flag suspicious fragments like "synthetic. Generic", "Instagram. YouTube", "raw. Unedited"
            words = m.split('. ')
            if len(words) == 2:
                w1, w2 = words[0], words[1]
                if w1 in {"synthetic", "instagram", "raw", "human", "boundaries", "analysis", "study", "voice", "scene", "first", "second", "third", "direct", "visual"}:
                    broken.append((i, m, line[:100]))
    if broken:
        print(f"\n{md_file.name}:")
        for lineno, fragment, snippet in broken:
            print(f"  Line {lineno}: '{fragment}' in -> {snippet}")
