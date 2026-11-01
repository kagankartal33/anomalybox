import json
import re
from pathlib import Path

ROOT = Path(".")
consolidation = json.loads((ROOT / "lib" / "seo-consolidation.json").read_text(encoding="utf-8"))
merged = set()
for c in consolidation.get("clusters", []):
    for r in c.get("redirects", []):
        merged.add(r)
for r in consolidation.get("retiredHubPages", []):
    merged.add(r["source"])

reg = json.loads((ROOT / "lib" / "seo-package-registry.json").read_text(encoding="utf-8"))["pages"]
content = (ROOT / "lib" / "seo-content.ts").read_text(encoding="utf-8")
res_part = content.split("export const resources = [")[1]
matches = list(re.finditer(r'slug:\s*"([^"]+)"', res_part))

legacy_paths = [f"/resources/{m.group(1)}" for m in matches]
unmerged_legacy = [p for p in legacy_paths if p not in merged]
unmerged_reg = [p for p in reg if p["path"] not in merged]

print(f"Legacy total: {len(legacy_paths)}, unmerged: {len(unmerged_legacy)}, merged: {len(legacy_paths) - len(unmerged_legacy)}")
print(f"Registry total: {len(reg)}, unmerged: {len(unmerged_reg)}, merged: {len(reg) - len(unmerged_reg)}")

# Check sitemap
sitemap_links = []
# Let's inspect where unmerged legacy pages are linked on the site
links_data = json.loads((ROOT / "lib" / "seo-package-links.json").read_text(encoding="utf-8"))
links_graph = links_data.get("links", {})
inbound_to_legacy = {}
for src, links in links_graph.items():
    for link in links:
        target = link.get("path")
        if target in unmerged_legacy:
            inbound_to_legacy[target] = inbound_to_legacy.get(target, 0) + 1

print(f"Unmerged legacy with inbound related links: {len(inbound_to_legacy)} / {len(unmerged_legacy)}")
zero_inbound = [p for p in unmerged_legacy if inbound_to_legacy.get(p, 0) == 0]
print(f"Unmerged legacy with ZERO inbound related links: {len(zero_inbound)}")
for p in zero_inbound:
    print(f"  Zero inbound: {p}")
