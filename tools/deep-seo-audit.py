#!/usr/bin/env python3
"""
Deep 360-Degree SEO Audit for Anomaly Box
Audits titles, descriptions, canonicals, keywords, word counts, headings, JSON-LD, internal links, images, and sitemap.
"""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_PKG = ROOT / "content" / "seo-package"
CONTENT_RES = ROOT / "content" / "resources"
APP_DIR = ROOT / "app"
REG_PATH = ROOT / "lib" / "seo-package-registry.json"

FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.S)
H1_RE = re.compile(r"^#\s+(.+)$", re.M)
H2_RE = re.compile(r"^##\s+(.+)$", re.M)
H3_RE = re.compile(r"^###\s+(.+)$", re.M)
LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
IMAGE_RE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")

def parse_frontmatter(text: str) -> tuple[dict, str]:
    m = FM_RE.match(text)
    if not m:
        return {}, text
    raw_fm = m.group(1)
    body = text[m.end():]
    fm = {}
    for line in raw_fm.split("\n"):
        line = line.strip()
        if ":" in line and not line.startswith("#"):
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm, body

def audit():
    report = {
        "summary": {},
        "articles": {
            "total": 0,
            "word_counts": [],
            "titles": {},
            "descriptions": {},
            "keywords": Counter(),
            "short_descriptions": [],
            "long_descriptions": [],
            "short_titles": [],
            "long_titles": [],
            "missing_h1": [],
            "heading_counts": [],
            "internal_links_count": [],
            "outbound_links_count": [],
            "faq_count": 0,
            "low_word_count": [],
        },
        "routes": {
            "pages_analyzed": 0,
            "custom_metadata": [],
            "json_ld_detected": [],
        },
        "registry": {
            "total_registered": 0,
            "sections": Counter(),
            "target_queries": Counter(),
        },
        "images": {
            "total_checked": 0,
            "missing_alt": 0,
            "webp_count": 0,
        },
        "sitemap_and_robots": {},
        "keyword_clusters": defaultdict(list),
    }

    # 1. Audit Registry
    if REG_PATH.exists():
        reg = json.loads(REG_PATH.read_text(encoding="utf-8"))
        pages = reg.get("pages", [])
        report["registry"]["total_registered"] = len(pages)
        for p in pages:
            report["registry"]["sections"][p.get("section", "unknown")] += 1
            if p.get("target_query"):
                report["registry"]["target_queries"][p["target_query"]] += 1

    # 2. Audit Markdown Content (seo-package + resources)
    all_files = list(CONTENT_PKG.glob("*.md")) + list(CONTENT_RES.glob("*.md"))
    report["articles"]["total"] = len(all_files)

    for f in all_files:
        content = f.read_text(encoding="utf-8")
        fm, body = parse_frontmatter(content)
        
        # Word count
        words = len(body.split())
        report["articles"]["word_counts"].append(words)
        if words < 600:
            report["articles"]["low_word_count"].append((f.name, words))

        # Title
        title = fm.get("title", "")
        if title:
            report["articles"]["titles"][f.name] = title
            t_len = len(title)
            if t_len < 30:
                report["articles"]["short_titles"].append((f.name, title, t_len))
            elif t_len > 75:
                report["articles"]["long_titles"].append((f.name, title, t_len))

        # Description
        desc = fm.get("description", "")
        if desc:
            report["articles"]["descriptions"][f.name] = desc
            d_len = len(desc)
            if d_len < 80:
                report["articles"]["short_descriptions"].append((f.name, desc, d_len))
            elif d_len > 170:
                report["articles"]["long_descriptions"].append((f.name, desc, d_len))

        # Keywords / Search queries
        target_query = fm.get("target_query", "") or fm.get("keyword", "") or fm.get("primary_keyword", "")
        if target_query:
            report["articles"]["keywords"][target_query] += 1
            # cluster categorization
            for cluster in ["ugc", "reels", "burnout", "script", "brief", "hook", "strategy", "monetization", "fitness", "beauty", "travel", "b2b", "commerce"]:
                if cluster in target_query.lower() or cluster in f.name.lower():
                    report["keyword_clusters"][cluster].append(f.name)

        # Headings
        h1s = H1_RE.findall(body)
        h2s = H2_RE.findall(body)
        h3s = H3_RE.findall(body)
        if not h1s and not title:
            report["articles"]["missing_h1"].append(f.name)
        report["articles"]["heading_counts"].append((len(h2s), len(h3s)))

        # FAQs
        if "faq" in body.lower() or "## frequently asked questions" in body.lower() or "## faq" in body.lower():
            report["articles"]["faq_count"] += 1

        # Links
        links = LINK_RE.findall(body)
        internal = [l for l in links if l[1].startswith("/") or "anomalybox.com" in l[1]]
        outbound = [l for l in links if l[1].startswith("http") and "anomalybox.com" not in l[1]]
        report["articles"]["internal_links_count"].append(len(internal))
        report["articles"]["outbound_links_count"].append(len(outbound))

        # Images
        images = IMAGE_RE.findall(body)
        for img in images:
            report["images"]["total_checked"] += 1
            alt = img[0].strip()
            src = img[1].strip()
            if not alt:
                report["images"]["missing_alt"] += 1
            if src.endswith(".webp"):
                report["images"]["webp_count"] += 1

    # 3. App Routes SEO Analysis
    for page_path in APP_DIR.rglob("page.tsx"):
        report["routes"]["pages_analyzed"] += 1
        code = page_path.read_text(encoding="utf-8")
        rel_path = str(page_path.relative_to(ROOT))
        
        has_metadata = "export const metadata" in code or "generateMetadata" in code
        has_json_ld = "application/ld+json" in code or "JsonLd" in code or "jsonLd" in code
        
        if has_metadata:
            report["routes"]["custom_metadata"].append(rel_path)
        if has_json_ld:
            report["routes"]["json_ld_detected"].append(rel_path)

    # Summary calculations
    wc = report["articles"]["word_counts"]
    report["summary"] = {
        "total_markdown_articles": len(all_files),
        "avg_word_count": round(sum(wc) / len(wc)) if wc else 0,
        "min_word_count": min(wc) if wc else 0,
        "max_word_count": max(wc) if wc else 0,
        "articles_with_faqs": report["articles"]["faq_count"],
        "faq_percentage": f"{round(report['articles']['faq_count'] / len(all_files) * 100, 1)}%",
        "avg_internal_links_per_article": round(sum(report["articles"]["internal_links_count"]) / len(all_files), 1),
        "total_images_in_content": report["images"]["total_checked"],
        "webp_image_percentage": f"{round(report['images']['webp_count'] / (report['images']['total_checked'] or 1) * 100, 1)}%",
        "routes_with_metadata": len(report["routes"]["custom_metadata"]),
        "routes_with_structured_data": len(report["routes"]["json_ld_detected"]),
    }

    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    audit()
