"""Build a static markdown map so Next.js can trace public SEO pages safely."""
import json
from pathlib import Path


root = Path(__file__).resolve().parents[1]
content = root / "content"
markdown = {}
for folder in (content / "seo-package", content / "resources"):
    for path in folder.glob("*.md"):
        markdown.setdefault(path.stem, path.read_text(encoding="utf-8"))
(root / "lib" / "seo-package-markdown.json").write_text(
    json.dumps(markdown, ensure_ascii=False, separators=(",", ":")),
    encoding="utf-8",
)
print(f"generated markdown entries: {len(markdown)}")