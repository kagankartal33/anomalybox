import os
import re
from pathlib import Path

ROOT = Path(r"c:\Users\Kagan\OneDrive\Desktop\ViralBox")

EXCLUDES = {"node_modules", ".next", ".git", ".agents", "tools", "ANOMALYBOX_CREATOR_RESEARCH_PHASE_01_30_COMPLETE_ALL_FILES"}

findings = []

for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in EXCLUDES and not d.startswith(".")]
    for file in files:
        file_path = Path(root) / file
        if file_path.name.endswith(".log") or file_path.name.endswith(".png") or file_path.name.endswith(".webp"):
            continue
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        
        rel = file_path.relative_to(ROOT).as_posix()
        for lineno, line in enumerate(content.splitlines(), 1):
            if ".md" in line:
                findings.append((rel, lineno, line.strip()))

print(f"Total lines with '.md': {len(findings)}")
for rel, lineno, line in findings[:50]:
    print(f"{rel}:{lineno} -> {line[:120]}")
