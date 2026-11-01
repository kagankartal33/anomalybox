"""
P11: Relevance-based internal link graph for SEO package pages.
Writes lib/seo-package-links.json consumed by the site (no random links).
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REG = ROOT / "lib" / "seo-package-registry.json"
CONTENT = ROOT / "content" / "seo-package"
CONSOLIDATION = ROOT / "lib" / "seo-consolidation.json"
OUT = ROOT / "lib" / "seo-package-links.json"

consolidation_data = json.loads(CONSOLIDATION.read_text(encoding="utf-8")) if CONSOLIDATION.exists() else {}
merged_sources = set()
for cluster in consolidation_data.get("clusters", []):
    for r in cluster.get("redirects", []):
        merged_sources.add(r)
for r in consolidation_data.get("retiredHubPages", []):
    merged_sources.add(r["source"])

STOP = {
    "the", "and", "for", "with", "that", "this", "from", "your", "you", "are", "how",
    "what", "when", "into", "about", "content", "creator", "creators", "video", "a", "an",
    "to", "of", "in", "on", "or", "is", "as", "at", "by", "it",
}


def tokens(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+", text.lower())
    return {w for w in words if len(w) > 2 and w not in STOP}


def score(a: dict, b: dict, ta: set[str], tb: set[str]) -> float:
    if a["slug"] == b["slug"]:
        return -1.0
    s = 0.0
    if a.get("section") == b.get("section"):
        s += 0.35
    if a.get("pageType") == b.get("pageType"):
        s += 0.15
    inter = len(ta & tb)
    union = len(ta | tb) or 1
    s += 0.50 * (inter / union)
    # slight boost for complementary types
    pair = {a.get("pageType"), b.get("pageType")}
    if pair == {"guide", "template-guide"} or pair == {"pillar", "guide"}:
        s += 0.08
    if pair == {"commercial-landing", "persona-hub"}:
        s += 0.05
    return s


def load_all_pages():
    reg_pages = json.loads(REG.read_text(encoding="utf-8"))["pages"]
    seo_content = (ROOT / "lib" / "seo-content.ts").read_text(encoding="utf-8")
    res_part = seo_content.split("export const resources = [")[1]

    matches = re.finditer(
        r'slug:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*description:\s*"([^"]+)"',
        res_part,
    )

    legacy_pages = []
    for m in matches:
        slug, title, desc = m.group(1), m.group(2), m.group(3)
        legacy_pages.append({
            "slug": slug,
            "path": f"/resources/{slug}",
            "title": title,
            "section": "resources",
            "pageType": "resource",
            "description": desc,
            "keyword": title.lower(),
            "secondaryKeywords": [],
            "isLegacy": True,
        })

    return reg_pages, legacy_pages


def is_protected_template(page: dict) -> bool:
    return page.get("section") == "templates"


def main() -> int:
    reg_pages, legacy_pages = load_all_pages()
    all_pages = reg_pages + legacy_pages

    tok: dict[str, set[str]] = {}
    for p in all_pages:
        blob = f"{p.get('title','')} {p.get('keyword','')} {p.get('description','')} {' '.join(p.get('secondaryKeywords') or [])}"
        if p.get("isLegacy"):
            body_path = ROOT / "content" / "resources" / f"{p['slug']}.md"
        else:
            body_path = CONTENT / f"{p['slug']}.md"

        if body_path.exists():
            body = body_path.read_text(encoding="utf-8", errors="replace")
            heads = " ".join(re.findall(r"^##? .+$", body, re.M))
            blob += " " + heads
        tok[p["slug"]] = tokens(blob)

    # Valid candidates to be linked TO: must never be purchase-gated templates or merged/consolidated URLs
    candidates = [p for p in all_pages if not is_protected_template(p) and p.get("path") not in merged_sources]

    graph: dict[str, list[dict]] = {}
    for a in all_pages:
        ranked = []
        for b in candidates:
            if a["slug"] == b["slug"]:
                continue
            sc = score(a, b, tok[a["slug"]], tok[b["slug"]])
            if sc < 0.05:
                continue
            ranked.append(
                {
                    "slug": b["slug"],
                    "path": b["path"],
                    "title": b["title"],
                    "section": b["section"],
                    "score": round(sc, 4),
                    "anchorText": b["title"] if len(b["title"]) < 70 else b.get("keyword", b["title"]).title(),
                }
            )
        ranked.sort(key=lambda x: -x["score"])
        # 3–5 links, prefer diversity of section
        picked = []
        seen_section = defaultdict(int)
        for item in ranked:
            if len(picked) >= 5:
                break
            if seen_section[item["section"]] >= 3 and len(ranked) > 5:
                continue
            picked.append(item)
            seen_section[item["section"]] += 1
        if len(picked) < 3:
            picked = ranked[:3]
        graph[a["slug"]] = picked

    # Guarantee inbound link distribution: ensure NO candidate is an orphan
    inbound_counts = defaultdict(int)
    for a_slug, links in graph.items():
        for item in links:
            inbound_counts[item["slug"]] += 1

    zero_inbound = [c for c in candidates if inbound_counts[c["slug"]] == 0]
    for target in zero_inbound:
        # Find best source pages to link to this target
        best_sources = []
        for src in all_pages:
            if src["slug"] == target["slug"]:
                continue
            sc = score(src, target, tok[src["slug"]], tok[target["slug"]])
            best_sources.append((sc, src))
        best_sources.sort(key=lambda x: -x[0])

        added = 0
        for sc, src in best_sources:
            src_links = graph[src["slug"]]
            if any(l["slug"] == target["slug"] for l in src_links):
                continue
            new_item = {
                "slug": target["slug"],
                "path": target["path"],
                "title": target["title"],
                "section": target["section"],
                "score": round(sc, 4),
                "anchorText": target["title"] if len(target["title"]) < 70 else target.get("keyword", target["title"]).title(),
            }
            if len(src_links) < 5:
                src_links.append(new_item)
                added += 1
            elif len(src_links) == 5:
                # Replace the lowest scored link if this target is relevant
                lowest_idx = min(range(len(src_links)), key=lambda i: src_links[i]["score"])
                if src_links[lowest_idx]["score"] < sc:
                    src_links[lowest_idx] = new_item
                    added += 1
            if added >= 2:
                break

    OUT.write_text(
        json.dumps(
            {
                "generated_by": "tools/quantum/build_internal_link_graph.py",
                "policy": "relevance-ranked; max 5; zero-orphan inbound guarantee; avoid random injection",
                "count": len(graph),
                "links": graph,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    avg = sum(len(v) for v in graph.values()) / max(len(graph), 1)
    print(f"Wrote {OUT} pages={len(graph)} avg_links={avg:.2f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
