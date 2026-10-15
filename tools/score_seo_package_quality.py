"""Score every package article for improvement priority."""
from __future__ import annotations

import json
import re
from pathlib import Path

import yaml

PKG = Path(__file__).resolve().parents[1] / (
    "archive/source-packs/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/pages"
)
FM = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.S)
OUT = Path(__file__).resolve().parents[1] / "tmp" / "seo_package_quality_scores.json"


def score_article(folder: Path) -> dict:
    raw = (folder / "article.md").read_text(encoding="utf-8")
    m = FM.match(raw)
    fm = yaml.safe_load(m.group(1)) if m else {}
    if not isinstance(fm, dict):
        fm = {}
    body = raw[m.end() :] if m else raw
    words = re.findall(r"\b[\w'-]+\b", body)
    wc = len(words)
    h2s = re.findall(r"^## (.+)$", body, re.M)
    h3s = re.findall(r"^### (.+)$", body, re.M)
    faqs = re.findall(r"^### (.+)$", body, re.M)  # FAQ questions often H3 under FAQ
    has_faq = bool(re.search(r"^## Frequently asked", body, re.M | re.I))
    has_next = bool(re.search(r"^## Next step", body, re.M | re.I))
    has_quick = bool(re.search(r"^## Quick answer", body, re.M | re.I))
    has_list = bool(re.search(r"^\d+\. |^- ", body, re.M))
    has_bold_proof = "**" in body
    # generic/template signals
    generic = 0
    for phrase in [
        "a practical guide to",
        "shoot-ready system creators can adapt",
        "this guide closes that gap",
        "the practical question is not only",
    ]:
        if phrase in body.lower():
            generic += 1
    # short paragraphs density
    paras = [p.strip() for p in re.split(r"\n\s*\n", body) if p.strip() and not p.strip().startswith("#")]
    avg_para = sum(len(p.split()) for p in paras) / max(len(paras), 1)
    # CTA specificity
    cta_soft = "anomalybox" in body.lower() or "/store" in body.lower()

    issues = []
    score = 100
    if wc < 500:
        score -= 18
        issues.append(f"thin_word_count:{wc}")
    elif wc < 600:
        score -= 8
        issues.append(f"under_600:{wc}")
    if wc > 1200:
        score -= 10
        issues.append(f"over_1200:{wc}")
    if not has_faq:
        score -= 15
        issues.append("missing_faq")
    if not has_next:
        score -= 8
        issues.append("missing_next_step")
    if not has_quick and (fm.get("page_type") or "") in ("pillar", "guide"):
        score -= 5
        issues.append("missing_quick_answer")
    if len(h2s) < 3:
        score -= 10
        issues.append(f"few_h2:{len(h2s)}")
    if not has_list:
        score -= 5
        issues.append("no_lists")
    if generic >= 2:
        score -= 8
        issues.append(f"template_phrases:{generic}")
    if not cta_soft:
        score -= 4
        issues.append("weak_product_cta")
    if avg_para > 90:
        score -= 5
        issues.append(f"long_paragraphs_avg:{avg_para:.0f}")
    desc = str(fm.get("meta_description") or "")
    if len(re.sub(r"\s+", " ", desc)) < 110:
        score -= 3
        issues.append("meta_could_be_richer")

    return {
        "folder": folder.name,
        "title": fm.get("seo_title") or folder.name,
        "type": fm.get("page_type"),
        "keyword": fm.get("primary_keyword"),
        "canonical": fm.get("canonical_url"),
        "wc": wc,
        "h2": len(h2s),
        "h3": len(h3s),
        "has_faq": has_faq,
        "has_next": has_next,
        "has_quick": has_quick,
        "score": max(0, score),
        "issues": issues,
    }


def main() -> int:
    rows = []
    for folder in sorted(PKG.iterdir()):
        if folder.is_dir() and (folder / "article.md").exists():
            rows.append(score_article(folder))
    rows.sort(key=lambda r: (r["score"], r["wc"]))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"scored {len(rows)} → {OUT}")
    print("lowest 25:")
    for r in rows[:25]:
        print(f"  {r['score']:3d}  {r['wc']:4d}w  {r['folder']}  {r['issues']}")
    print("issue frequency:")
    c: dict[str, int] = {}
    for r in rows:
        for i in r["issues"]:
            key = i.split(":")[0]
            c[key] = c.get(key, 0) + 1
    for k, v in sorted(c.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}")
    print(f"avg score: {sum(r['score'] for r in rows)/len(rows):.1f}")
    print(f"below 85: {sum(1 for r in rows if r['score'] < 85)}")
    print(f"below 90: {sum(1 for r in rows if r['score'] < 90)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
