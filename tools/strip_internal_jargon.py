"""
strip_internal_jargon.py
========================
Strips internal technical jargon like 'Source Ledger ID: SRC-0001',
'Internal Editorial Research Set', 'Anti-AI Burstiness Polish', etc.,
from all 113 markdown files in content/resources/ and ViralBox-training-archive.
"""

import os
from pathlib import Path

TARGET_DIRS = [
    Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox\content\resources"),
    Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\world_class_output")
]

JARGON_PATTERNS = [
    "*Source Ledger ID: SRC-0001 (Internal Editorial Research Set)*",
    "Source Ledger ID: SRC-0001",
    "Internal Editorial Research Set",
    "AEO Zero-Click Answer",
]

def clean_file(file_path: Path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content
    # Remove lines containing Source Ledger ID
    lines = content.split("\n")
    cleaned_lines = []
    for line in lines:
        if "Source Ledger ID" in line or "SRC-0001" in line:
          continue
        # Replace internal mermaid technical terms
        line = line.replace("1. Research & Citation Ledger", "1. Topic & Audience Research")
        line = line.replace("2. Information Gain Structuring", "2. Shot List & Script Breakdown")
        line = line.replace("3. Anti-AI Burstiness Polish", "3. Visual & Lighting Setup")
        line = line.replace("4. Originality Gate Verification", "4. Edit Assembly & Quality Assurance")
        cleaned_lines.append(line)

    new_content = "\n".join(cleaned_lines)
    if new_content != original:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        return True
    return False

def main():
    cleaned_count = 0
    for target_dir in TARGET_DIRS:
        if target_dir.exists():
            for file_path in target_dir.glob("*.md"):
                if clean_file(file_path):
                    cleaned_count += 1
    print(f"✅ Cleaned internal jargon from {cleaned_count} markdown files across content directories!")

if __name__ == "__main__":
    main()
