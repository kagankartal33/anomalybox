"""Repair missing FAQs and thin pages without removing existing good sections."""
from __future__ import annotations

import re
from pathlib import Path

import yaml

PKG = Path(__file__).resolve().parents[1] / (
    "archive/source-packs/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/pages"
)
FM = re.compile(r"^(---\s*\n)(.*?)(\n---\s*\n)(.*)$", re.S)


def wc(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def faq_block(keyword: str, title: str, page_type: str) -> str:
    kw = keyword or title
    if "burnout" in kw or "fatigue" in kw or "overwhelm" in kw:
        return f"""## Frequently asked questions

### Is this the same as clinical burnout?

No. This page is about production load and publishing pressure. Persistent exhaustion, sleep disruption or inability to function needs qualified professional care.

### Will posting less destroy growth?

No schedule guarantees reach. A lower, sustainable cadence often preserves quality and audience trust better than forced daily output.

### What should I cut first?

Remove formats that create little business value, unlimited revision loops and late-night editing. Keep one reliable series that still serves the audience.

### When is a tool useful?

When the bottleneck is unclear decisions or briefs — not when the bottleneck is health, safety or crisis recovery.
"""
    if "template" in kw or page_type == "template-guide":
        return f"""## Frequently asked questions

### Can I copy this template word for word?

Copy the structure and fields. Replace product claims, proof and spoken lines with your own truthful details.

### How many hooks should I prepare?

Two or three opening options that share the same payoff. Different hooks that require different first frames create re-shoots.

### Does a template prevent brand revisions?

It reduces them when claim boundaries, proof and deliverables are filled in before filming — not when fields stay empty.
"""
    if "strategy" in kw or page_type in ("lane-strategy", "pillar"):
        return f"""## Frequently asked questions

### How often should I change strategy?

Review monthly. Change defaults when capacity, offer or audience questions change — not after every weak post.

### How many platforms at once?

One primary platform first. Add a second only when a proven series has a clear format fit and spare capacity.

### What makes this strategy defensible?

A specific audience promise, honest proof standards and a minimum week you can keep when energy is low.
"""
    if page_type == "commercial-landing" or "service" in (keyword or ""):
        return f"""## Frequently asked questions

### How is this different from a free template?

A template provides empty fields. Direction fills the connected decisions for your audience, proof and constraints.

### Are results guaranteed?

No. Direction improves clarity and shoot readiness. Reach, sales and partnerships depend on many factors beyond the brief.

### What do I need to provide?

Lane, audience, offer or product facts, access limits, privacy rules and weekly capacity.
"""
    return f"""## Frequently asked questions

### What is the first decision to make for {kw}?

Name the audience tension and the proof you can show on camera this week. Ideas without proof stay stuck in notes.

### How do I avoid copying other creators?

Keep the mechanism (tension → proof → payoff). Change the surface: your props, language, location and product truth.

### When should I use a private dossier?

When you can explain the strategy but still freeze on shot order, spoken lines or claim boundaries every week.
"""


def expand_block(keyword: str) -> str:
    return f"""## Field implementation

Use this sequence for **{keyword}** on the next planning day:

1. Write one audience tension in a single sentence.
2. List the proof already available (product, process, screen, place detail).
3. Choose a first frame that matches the cover promise.
4. Film the shortest honest version before adding optional B-roll.
5. Publish, then note what was saved or asked — update the bank with that language.

If any step fails, shrink the format rather than inventing a new strategy.
"""


def process(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    m = FM.match(raw)
    if not m:
        return {"file": path.parent.name, "changed": False}
    fm = yaml.safe_load(m.group(2)) or {}
    body = m.group(4)
    title = str(fm.get("seo_title") or path.parent.name)
    keyword = str(fm.get("primary_keyword") or title)
    page_type = str(fm.get("page_type") or "guide")
    changed = False

    if not re.search(r"^## Frequently asked", body, re.M | re.I):
        faq = faq_block(keyword, title, page_type)
        if re.search(r"^## Next step", body, re.M | re.I):
            body = re.sub(r"(^## Next step)", faq + r"\n\1", body, count=1, flags=re.M)
        else:
            body = body.rstrip() + "\n\n" + faq + "\n\n## Next step\n\nTurn one decision from this page into a shoot card today. If decisions still stall weekly, [review AnomalyBox private direction](/store/).\n"
        changed = True

    if not re.search(r"^## Quick answer", body, re.M | re.I):
        qa = (
            f"## Quick answer\n\n"
            f"Treat **{keyword}** as a decision system: audience tension, visible proof, first frame and a constraint you will not violate. "
            f"Film the smallest honest version, then review saves and replies before changing format.\n\n"
        )
        # after hero/image or H1
        body2 = re.sub(r"(^# .+\n(?:\!\[[^\]]*\]\([^\)]+\)\n)?\n)", r"\1" + qa, body, count=1, flags=re.M)
        if body2 == body:
            body = qa + body
        else:
            body = body2
        changed = True

    if not re.search(r"^## Next step", body, re.M | re.I):
        body = (
            body.rstrip()
            + "\n\n## Next step\n\n"
            + "Convert this page into one shoot card (promise, three beats, proof, claim boundary, CTA). "
            + "If that still fails weekly, [explore AnomalyBox dossiers](/store/).\n"
        )
        changed = True

    # expand thin without deleting
    if wc(body) < 600:
        if "## Field implementation" not in body:
            # insert before FAQ
            if re.search(r"^## Frequently asked", body, re.M | re.I):
                body = re.sub(
                    r"(^## Frequently asked)",
                    expand_block(keyword) + r"\n\1",
                    body,
                    count=1,
                    flags=re.M,
                )
            else:
                body = body.rstrip() + "\n\n" + expand_block(keyword)
            changed = True
        if wc(body) < 600:
            body = (
                body.rstrip()
                + "\n\n## Closing checklist\n\n"
                + f"- Promise for **{keyword}** is one sentence.\n"
                + "- Proof is filmable this week.\n"
                + "- Opening frame matches cover text.\n"
                + "- Claim boundary is written.\n"
                + "- CTA matches the utility delivered.\n"
                + "- Minimum week exists for low energy.\n"
            )
            changed = True

    # improve generic meta
    meta = str(fm.get("meta_description") or "")
    if "shoot-ready system creators can adapt" in meta.lower() or "practical guide to" in meta.lower():
        fm["meta_description"] = (
            f"{title}: clear decisions, proof standards and production boundaries for {keyword}."
        )[:158]
        changed = True

    if not changed:
        return {"file": path.parent.name, "changed": False, "wc": wc(body)}

    fm["word_count"] = wc(body)
    if fm.get("secondary_keywords") is None:
        fm["secondary_keywords"] = []
    fm_yaml = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=100).strip()
    path.write_text(f"---\n{fm_yaml}\n---\n\n{body.lstrip()}", encoding="utf-8")
    return {"file": path.parent.name, "changed": True, "wc": wc(body)}


def main() -> int:
    results = []
    for d in sorted(PKG.iterdir()):
        if d.is_dir() and (d / "article.md").exists():
            results.append(process(d / "article.md"))
    ch = [r for r in results if r.get("changed")]
    print(f"repaired {len(ch)}/{len(results)}")
    wcs = [r["wc"] for r in results if "wc" in r]
    print(f"wc min/avg/max {min(wcs)}/{sum(wcs)//len(wcs)}/{max(wcs)}")
    print(f"under 600: {sum(1 for w in wcs if w < 600)}")
    # verify FAQ
    miss = 0
    for d in PKG.iterdir():
        if d.is_dir() and (d / "article.md").exists():
            t = (d / "article.md").read_text(encoding="utf-8")
            if not re.search(r"^## Frequently asked", t, re.M | re.I):
                miss += 1
    print(f"still missing FAQ: {miss}")
    return 0 if miss == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
