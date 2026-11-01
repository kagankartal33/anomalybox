import json
import re
from pathlib import Path

ROOT = Path(".")
reg = json.loads((ROOT / "lib" / "seo-package-registry.json").read_text(encoding="utf-8"))["pages"]
content = (ROOT / "lib" / "seo-content.ts").read_text(encoding="utf-8")
res_part = content.split("export const resources = [")[1]
matches = list(re.finditer(r'slug:\s*"([^"]+)",\s*title:\s*"([^"]+)"', res_part))

consolidation = json.loads((ROOT / "lib" / "seo-consolidation.json").read_text(encoding="utf-8"))
merged = set()
for c in consolidation.get("clusters", []):
    for r in c.get("redirects", []):
        merged.add(r)
for r in consolidation.get("retiredHubPages", []):
    merged.add(r["source"])

def is_protected(section, title):
    return section == "templates" or bool(re.search(r"\btemplate\b", title, re.I))

print("=== CHECKING REGISTRY PAGES ===")
for p in reg:
    if p["path"] in merged:
        continue
    if is_protected(p.get("section", ""), p.get("title", "")):
        print(f"Registry protected: [{p.get('section')}] {p['path']} -> {p['title']}")

print("\n=== CHECKING LEGACY RESOURCE PAGES ===")
for m in matches:
    slug, title = m.group(1), m.group(2)
    path = f"/resources/{slug}"
    if path in merged:
        continue
    if is_protected("resources", title):
        print(f"Legacy protected: {path} -> {title}")

