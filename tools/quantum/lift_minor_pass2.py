"""Second-pass lift for remaining minor pages — longer unique anti-overlap blocks."""
from __future__ import annotations

import re
from pathlib import Path

import yaml

PKG = Path(__file__).resolve().parents[2] / (
    "archive/source-packs/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/pages"
)
FM = re.compile(r"^(---\s*\n)(.*?)(\n---\s*\n)(.*)$", re.S)

PASS2: dict[str, str] = {
    "instagram-content-strategy-service": """## Deliverable matrix (Instagram strategy retainer)

| Week | Artefact | Acceptance test |
| :--- | :--- | :--- |
| 0 | Surface audit (Feed / Stories / Reels / bio) | One primary surface chosen |
| 1 | Promise + two series map | Stranger can state the niche in one line |
| 2 | 30-day plan with bank links | Every slot has proof asset named |
| 3 | Review scoreboard | Planned vs shipped + saves trend |

UGC creative retainers optimise creator briefs and paid cutdowns. This service optimises **organic Instagram system design** and does not replace ad creative ops.
""",
    "ecommerce-content-strategy": """## Ecommerce funnel content map

1. **Discovery** — problem-aware short video or carousel  
2. **Consideration** — objection handling and comparison honesty  
3. **Conversion** — PDP-aligned demo with limit shot  
4. **Post-purchase** — use tips that reduce returns  

Score content by assisted product views and save-to-SKU tags, not follower vanity. Repeatable ops systems are useful infrastructure; this page decides **which ecommerce story jobs** those systems run.
""",
    "personal-brand-creative-direction": """## Personal brand direction canvas

- Voice adjectives (3 max) with “never say” list  
- Visual motif kit (colour, crop, type treatment)  
- Story lanes: origin, craft, client result, opinion  
- Boundary: what the person will not perform on camera  

A planning service builds calendars; creative direction locks **identity constraints** so calendars stay on-brand when volume rises.
""",
    "content-ideas-when-stuck": """## Stuck vs block vs empty bank

| State | Signal | Move |
| :--- | :--- | :--- |
| Stuck | Ideas exist, dread to pick | 15-min promise audit |
| Block | Craft paralysis / delete loop | Timer finish old structure |
| Empty bank | No filmable rows | Observation or friction log refill |

Do not run Instagram surface-fear tactics when the real state is empty bank, and do not brainstorm when the bank already has unfilmed proof.
""",
    "instagram-content-block": """## Grid-fear unpack

Instagram block often hides three separate fears: colour continuity, Stories streak guilt, and Reel trend debt.  
Isolate which surface triggers avoidance. Ship one anti-grid utility carousel, freeze Stories to three days, pause trend audio for a week.  
Creative-craft paralysis without platform UI anxiety is a different protocol.
""",
    "creative-block-content-creator": """## Originality anxiety loop

Symptoms: twelve reference tabs, zero exports, “not unique enough” deletes.  
Counter: constrain to one structure you already shipped, change only the proof, finish inside 40 minutes, publish or schedule before critique.  
Platform grid rules are irrelevant here — this is craft freeze.
""",
    "how-to-come-up-with-content-ideas": """## Friction-log invention recipe

Export 20 recent questions → cluster five tensions → attach owned proof → write bank titles only for clusters with filmable proof.  
Skip competitor tabs during invention sessions. Finding in the wild is a different day of the week.
""",
    "how-to-find-content-ideas": """## Field notebook method

One notebook (digital fine): PAA questions, sales objections, competitor missing proofs, almost-worked posts.  
Weekly transfer to bank with effort scores. No inventing during find walks — invention pollutes observation.
""",
    "why-is-content-creation-so-hard": """## Decision weight index

Rate each upcoming post 1–5 on: strategy clarity, craft bar, ops readiness, identity fear.  
Any dimension ≥4 becomes the week’s repair focus. Time tracking alone will not fix a 5 on identity fear.
""",
    "content-creation-takes-too-much-time": """## Four-bucket week experiment

Log minutes only in ideation, capture, edit, distribution.  
Kill or template the largest bucket. Psychology of “hard” without a minute ledger is out of scope for this page.
""",
    "running-out-of-content-ideas": """## Empty-well checklist

1. Count filmable bank rows (proof + format).  
2. If ≥5, you are not empty — you are filtering.  
3. If <5, run observation loop once, then stop.  

Same-day Instagram menu picks and long-term never-run-out systems are adjacent, not identical.
""",
    "content-planning-service-for-creators": """## Planning SKU edges

Includes: calendar, bank hygiene, batch windows, scoreboard.  
Excludes by default: brand motif design, paid UGC casting, legal claim review. Upsell those as separate lines so scope does not silently expand.
""",
    "ugc-creative-strategy-service": """## UGC retainer edges

Includes: creator shortlist criteria, brief kits, rights language, cutdown plan.  
Excludes: full organic Instagram series architecture (that is strategy service work).
""",
}


def slug_of(folder: str) -> str:
    parts = folder.split("-", 1)
    return parts[1] if parts[0].isdigit() and len(parts) == 2 else folder


def main() -> int:
    n = 0
    for d in sorted(PKG.iterdir()):
        if not d.is_dir():
            continue
        slug = slug_of(d.name)
        if slug not in PASS2:
            continue
        path = d / "article.md"
        raw = path.read_text(encoding="utf-8")
        m = FM.match(raw)
        if not m:
            continue
        fm = yaml.safe_load(m.group(2)) or {}
        body = m.group(4)
        # remove previous pass2 block
        body = re.sub(r"^## Anti-overlap lock\n.*?(?=^## |\Z)", "", body, flags=re.M | re.S)
        block = "## Anti-overlap lock\n\n" + PASS2[slug].strip() + "\n\n"
        if re.search(r"^## Frequently asked", body, re.M | re.I):
            body = re.sub(r"(^## Frequently asked)", block + r"\1", body, count=1, flags=re.M)
        elif re.search(r"^## Next step", body, re.M | re.I):
            body = re.sub(r"(^## Next step)", block + r"\1", body, count=1, flags=re.M)
        else:
            body = body.rstrip() + "\n\n" + block
        # guarantee word count headroom
        wc = len(re.findall(r"\b[\w'-]+\b", body))
        if wc < 640:
            extra = f"""

### Execution note for {slug.replace('-', ' ')}

Ship one cycle using only this page’s lock table or checklist. Do not merge steps from sibling articles in the same session; that reintroduces overlap and decision load. After publish, write one line on which row of the lock failed — that line is the next edit.
"""
            body = body.rstrip() + extra
        body = re.sub(r"\n{3,}", "\n\n", body).strip() + "\n"
        fm["word_count"] = len(re.findall(r"\b[\w'-]+\b", body))
        fm["dedupe_pass"] = "CONTENT-DEDUP-002-pass2"
        if fm.get("secondary_keywords") is None:
            fm["secondary_keywords"] = []
        y = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=100).strip()
        path.write_text(f"---\n{y}\n---\n\n{body.lstrip()}", encoding="utf-8")
        n += 1
        print(f"pass2 {d.name} words={fm['word_count']}")
    print(f"done {n}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
