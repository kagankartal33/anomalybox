"""
P12-ish: Render/indexability/accessibility contract checks for SEO package pages
(without browser). Validates files + registry fields bots and users depend on.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REG = ROOT / "lib" / "seo-package-registry.json"
LINKS = ROOT / "lib" / "seo-package-links.json"
CONTENT = ROOT / "content" / "seo-package"
PUBLIC = ROOT / "public"
OUT = ROOT / "quantum" / "data" / "evaluations" / "seo_package_render_qa.json"


def main() -> int:
    pages = json.loads(REG.read_text(encoding="utf-8"))["pages"]
    link_graph = {}
    if LINKS.exists():
        link_graph = json.loads(LINKS.read_text(encoding="utf-8")).get("links", {})

    known_paths = {p["path"] for p in pages}
    known_paths |= {"/store", "/resources", "/content-ideas", "/pricing", "/about", "/methodology", "/atelier"}

    results = []
    hard = 0
    for p in pages:
        fails = []
        warns = []
        md_path = CONTENT / f"{p['slug']}.md"
        if not md_path.exists():
            fails.append("missing_markdown")
            body = ""
        else:
            body = md_path.read_text(encoding="utf-8")

        # image
        img = p.get("image") or ""
        img_fs = PUBLIC / img.lstrip("/").replace("/", "\\") if "\\" in str(PUBLIC) else PUBLIC / img.lstrip("/")
        # pathlib handles both
        img_fs = ROOT / "public" / Path(img.lstrip("/"))
        if not img or not img_fs.exists():
            fails.append("missing_image_file")
        alt = p.get("imageAlt") or ""
        if len(alt) < 20:
            fails.append("weak_image_alt")
        if alt.lower() in {"image", "photo", "picture"}:
            fails.append("generic_image_alt")

        # headings / a11y content structure
        if not re.search(r"^# ", body, re.M):
            # site component supplies H1; body may omit — warn only
            warns.append("body_missing_h1_ok_if_component_renders")
        h2 = len(re.findall(r"^## ", body, re.M))
        if h2 < 3:
            fails.append(f"too_few_h2:{h2}")

        # dates for bots
        if not p.get("datePublished"):
            fails.append("missing_date_published")
        if not p.get("dateModified"):
            fails.append("missing_date_modified")

        # meta
        desc = p.get("description") or ""
        if len(desc) < 70:
            fails.append("short_meta_description")
        if len(desc) > 170:
            warns.append("long_meta_description")

        # internal links in markdown
        for href in re.findall(r"\]\((/[^)]+)\)", body):
            path = href.split("#")[0].rstrip("/") or "/"
            if path not in known_paths and not any(path.endswith("/" + k) for k in ["store"]):
                # allow section hubs
                if path not in {
                    "/reels",
                    "/templates",
                    "/creator-lanes",
                    "/creator-personas",
                    "/services",
                    "/tools",
                }:
                    warns.append(f"unknown_internal_link:{href}")

        # graph presence
        gl = link_graph.get(p["slug"], [])
        if len(gl) < 2:
            warns.append("sparse_internal_link_graph")

        # word count
        words = len(re.findall(r"\b[\w'-]+\b", body))
        if words < 400:
            fails.append(f"thin_content:{words}")

        ok = len(fails) == 0
        if not ok:
            hard += 1
        results.append(
            {
                "slug": p["slug"],
                "path": p["path"],
                "pass": ok,
                "fails": fails,
                "warns": warns,
                "word_count": words,
                "graph_links": len(gl),
            }
        )

    summary = {
        "count": len(results),
        "pass": sum(1 for r in results if r["pass"]),
        "fail": hard,
        "results": results,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Render QA: pass={summary['pass']} fail={summary['fail']} → {OUT}")
    # top fail reasons
    from collections import Counter

    c = Counter()
    for r in results:
        for f in r["fails"]:
            c[f.split(":")[0]] += 1
    print("fail reasons", c.most_common(10))
    return 0 if hard == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
