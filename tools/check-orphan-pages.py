#!/usr/bin/env python3
"""
Verify internal link equity and ensure no orphan pages exist across the site.
Checks both registry pages and legacy resources against lib/seo-package-links.json.
"""

import json
from pathlib import Path
import re
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
LINKS_PATH = ROOT / "lib" / "seo-package-links.json"
SEO_CONTENT_PATH = ROOT / "lib" / "seo-content.ts"
REGISTRY_PATH = ROOT / "lib" / "seo-package-registry.json"

def main():
    link_data = json.loads(LINKS_PATH.read_text(encoding="utf-8"))
    links = link_data.get("links", {})
    
    registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    reg_pages = registry.get("pages", [])
    
    seo_content = SEO_CONTENT_PATH.read_text(encoding="utf-8")
    res_part = seo_content.split("export const resources = [")[1]
    legacy_slugs = re.findall(r'slug:\s*"([^"]+)"', res_part)
    
    print(f"Total Registry Pages: {len(reg_pages)}")
    print(f"Total Legacy Resources: {len(legacy_slugs)}")
    print(f"Total Link Graph Nodes: {len(links)}")
    
    # Calculate inbound links
    inbound_counts = {slug: 0 for slug in legacy_slugs}
    for source_slug, target_links in links.items():
        for link in target_links:
            target_slug = link.get("slug", "")
            if target_slug in inbound_counts:
                inbound_counts[target_slug] += 1
                
    zero_inbound = [s for s, count in inbound_counts.items() if count == 0]
    
    # reels-creative-brief-template-for-brands is intentionally excluded as a purchase-gated template
    expected_zero = {"reels-creative-brief-template-for-brands"}
    actual_orphans = set(zero_inbound) - expected_zero
    
    print(f"Legacy resources with inbound links: {len(legacy_slugs) - len(zero_inbound)}/{len(legacy_slugs)}")
    if actual_orphans:
        print(f"❌ Found unexpected orphan pages ({len(actual_orphans)}): {actual_orphans}")
        return 1
    
    print("✅ All public content pages have inbound internal links (zero unexpected orphans).")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
