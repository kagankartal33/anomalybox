import os
from pathlib import Path

ROOT = Path(r"c:\Users\Kagan\OneDrive\Desktop\ViralBox")
SCAN_DIRS = ["app", "components", "public", "lib", "content"]

findings = []

for d in SCAN_DIRS:
    dp = ROOT / d
    if not dp.exists():
        continue
    for root, dirs, files in os.walk(dp):
        for file in files:
            fp = Path(root) / file
            if fp.suffix in {".png", ".jpg", ".webp", ".ico", ".svg", ".log"}:
                continue
            try:
                content = fp.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            rel = fp.relative_to(ROOT).as_posix()
            for lineno, line in enumerate(content.splitlines(), 1):
                if ".md" in line:
                    findings.append((rel, lineno, line.strip()))

output_lines = [f"Total lines with '.md': {len(findings)}"]
for rel, lineno, line in findings:
    safe_line = line[:120].encode("ascii", "replace").decode("ascii")
    output_lines.append(f"{rel}:{lineno} -> {safe_line}")

Path(ROOT / "tools" / "md_findings.txt").write_text("\n".join(output_lines), encoding="utf-8")
print(f"Done! Written {len(findings)} findings to tools/md_findings.txt")
