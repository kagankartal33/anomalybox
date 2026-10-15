"""Differentiate remaining near_duplicate_warn pairs (0.70–0.80 Jaccard)."""
from __future__ import annotations

import re
from pathlib import Path

import yaml

PKG = Path(__file__).resolve().parents[2] / (
    "archive/source-packs/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/pages"
)
FM = re.compile(r"^(---\s*\n)(.*?)(\n---\s*\n)(.*)$", re.S)

DIFF = {
    "how-to-come-up-with-content-ideas": """## Idea generation from friction logs

Build ideas from **logged frictions**, not brainstorm vibes:

1. Export last 20 comments/DMs/support questions.  
2. Cluster into 5 tensions.  
3. For each tension write one proof you already own.  
4. Promote only proof-backed clusters to the bank.

**This page is about sourcing inputs.** Finding ideas in the wild differs from “never run out” systems that emphasise recycling.
""",
    "how-to-find-content-ideas": """## Finding ideas in the wild (observation loop)

Finding is external observation:

- Competitor gaps (what they never prove)  
- Search suggestions / PAA questions  
- Real customer objections on sales calls  
- Failed posts that almost worked  

**Finding ≠ inventing.** Capture observations weekly; inventing without observation is noise.
""",
    "running-out-of-content-ideas": """## When the well feels empty

“Running out” is usually **filter failure**, not zero inputs:

- Bank full of unfilmable titles  
- Standards too vague to pick  
- Fear of repeating a winning structure  

**Unblock:** promote 2 bank items with proof today; ban new brainstorming until those ship.
""",
    "content-ideas-when-stuck": """## Stuck protocol (15 minutes)

1. Open last three posts — extract the promise each made.  
2. Ask: what proof was weak?  
3. Rebuild the same promise with better proof (not a new niche).  
4. If dread is physical, stop — that is fatigue, not idea shortage.
""",
    "instagram-content-block": """## Instagram block is surface-specific

Block often means **grid/Stories pressure**, not zero expertise:

- Fear of breaking the grid  
- Comparing Stories streaks  
- Reel trend FOMO  

**Instagram unstick:** post a utility carousel that ignores grid perfection for one week.
""",
    "creative-block-content-creator": """## Creative block as craft freeze

Creative block here is **craft paralysis** (style, angle, originality anxiety):

- Over-researching references  
- Deleting takes for “not unique enough”  
- Starting five drafts, finishing zero  

**Craft unstick:** finish one imperfect piece inside a 40-minute timer using an old structure.
""",
    "content-strategy-for-creators": """## Creator strategy baseline (general)

General creator strategy locks promise, series, proof and capacity for **any** niche.  
It is the umbrella system. Small-creator variants specialise constraints (time, solo gear).
""",
    "content-strategy-for-small-creators": """## Small-creator constraints

Small creators optimise for:

- <5 hours/week production  
- No editor  
- One camera  
- Local/real-life access limits  

**Default series:** 2 max. Kill “daily” language. Strategy succeeds if it survives a busy job week.
""",
    "video-production-brief-template": """## Video production brief (crew/asset oriented)

Emphasises:

- Shot list & gear  
- Locations & permissions  
- Call sheet timing  
- Delivery codecs  

Use when multiple people or multi-location shoots are involved.
""",
    "content-production-brief-template": """## Content production brief (editorial oriented)

Emphasises:

- Message hierarchy  
- Format mix (carousel/Reel/static)  
- Approval gates  
- Publishing calendar slot  

Use for editorial ops even when filming is solo.
""",
    "ugc-shot-list": """## UGC shot list (product-proof first)

Priority shots: problem context, hands demo, macro texture, social proof insert, end card.  
Optimised for **ad cutdowns**, not travel beauty.
""",
    "b-roll-shot-list": """## B-roll shot list (atmosphere & transitions)

Priority shots: establishing, insert details, movement bridges, reaction cutaways.  
Supports talking-head or VO stories; not a UGC product demo list.
""",
    "travel-video-shot-list": """## Travel shot list (place specificity)

Arrival, route markers, local texture, food/hand detail, exit frame.  
Proof = “this place, not stock skyline.”
""",
    "product-video-shot-list": """## Product shot list (mechanism clarity)

Hero, unbox/open, mechanism close-up, in-use demo, limit/honesty shot.  
If mechanism isn’t visible, the list is incomplete.
""",
    "reels-creative-brief-template": """## Reels brief (hook + 9:16 safe zones)

- 3 hook options  
- On-screen text max 6 words  
- Beat timestamps  
- Sound choice notes  
- CTA last 3s  

Different from general social briefs: vertical pacing dominates.
""",
    "reels-script-template": """## Reels spoken/visual script

Line-by-line for 15–30s with visual column.  
Focus: first-second interrupt and mid-video proof insert.
""",
    "shoot-plan-template": """## Shoot plan (day-of logistics)

Call times, setup order, shot priority if time runs out, backup indoor plan.  
Not a script — a day plan.
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
        if slug not in DIFF:
            continue
        path = d / "article.md"
        raw = path.read_text(encoding="utf-8")
        m = FM.match(raw)
        if not m:
            continue
        fm = yaml.safe_load(m.group(2)) or {}
        body = m.group(4)
        block = "## Differentiation note\n\n" + DIFF[slug].strip() + "\n"
        # remove old differentiation note if any
        body = re.sub(r"^## Differentiation note\n.*?(?=^## |\Z)", "", body, flags=re.M | re.S)
        if re.search(r"^## Frequently asked", body, re.M | re.I):
            body = re.sub(r"(^## Frequently asked)", block + "\n\1", body, count=1, flags=re.M)
        else:
            body = body.rstrip() + "\n\n" + block
        body = re.sub(r"\n{3,}", "\n\n", body).strip() + "\n"
        fm["word_count"] = len(re.findall(r"\b[\w'-]+\b", body))
        fm["dedupe_pass"] = "CONTENT-DEDUP-002-warn"
        if fm.get("secondary_keywords") is None:
            fm["secondary_keywords"] = []
        y = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=100).strip()
        path.write_text(f"---\n{y}\n---\n\n{body.lstrip()}", encoding="utf-8")
        n += 1
        print("updated", d.name)
    print(f"done {n}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
