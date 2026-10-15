import os
from pathlib import Path

ROOT = Path(r"c:\Users\Kagan\OneDrive\Desktop\ViralBox")
RESOURCES = ROOT / "content" / "resources"
SEO_PKG = ROOT / "content" / "seo-package"

found = []
for folder in [RESOURCES, SEO_PKG]:
    for md_file in folder.glob("*.md"):
        text = md_file.read_text(encoding="utf-8")
        for lineno, line in enumerate(text.splitlines(), 1):
            if ".md" in line:
                found.append((md_file.name, lineno, line))

print(f"Total .md mentions inside content markdown bodies: {len(found)}")
for fname, lineno, line in found:
    print(f"{fname}:{lineno} -> {line}")
