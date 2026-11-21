from pathlib import Path

ROOT = Path(".")

# 1. Update app/sitemap.ts
sitemap_file = ROOT / "app" / "sitemap.ts"
sitemap_code = sitemap_file.read_text(encoding="utf-8")
import re
sitemap_code = re.sub(
    r'const contentUpdated = new Date\("[^"]+"\);',
    'const contentUpdated = new Date("2026-11-21T15:00:00.000Z");',
    sitemap_code
)
sitemap_file.write_text(sitemap_code, encoding="utf-8")
print("Updated app/sitemap.ts lastmod to 2026-11-21T15:00:00.000Z.")

# 2. Update app/feed.xml/route.ts
feed_file = ROOT / "app" / "feed.xml" / "route.ts"
feed_code = feed_file.read_text(encoding="utf-8")
feed_code = re.sub(
    r'const buildDate = new Date\("[^"]+"\)\.toUTCString\(\);',
    'const buildDate = new Date("2026-11-21T15:00:00.000Z").toUTCString();',
    feed_code
)
feed_file.write_text(feed_code, encoding="utf-8")
print("Updated app/feed.xml/route.ts buildDate to 2026-11-21T15:00:00.000Z.")
