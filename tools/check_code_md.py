import os
from pathlib import Path

ROOT = Path(r"c:\Users\Kagan\OneDrive\Desktop\ViralBox")
SCAN_DIRS = ["app", "components", "lib"]

findings = []

for d in SCAN_DIRS:
    dp = ROOT / d
    if not dp.exists():
        continue
    for root, dirs, files in os.walk(dp):
        for file in files:
            fp = Path(root) / file
            if fp.suffix not in {".ts", ".tsx", ".js", ".jsx"}:
                continue
            content = fp.read_text(encoding="utf-8", errors="ignore")
            rel = fp.relative_to(ROOT).as_posix()
            for lineno, line in enumerate(content.splitlines(), 1):
                if ".md" in line:
                    findings.append((rel, lineno, line.strip()))

print(f"Total lines with '.md' in app/components/lib: {len(findings)}")
for rel, lineno, line in findings:
    print(f"{rel}:{lineno} -> {line}")
