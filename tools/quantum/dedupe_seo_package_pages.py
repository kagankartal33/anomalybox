"""
CONTENT-DEDUP-001
Differentiate hard near-duplicate SEO package pages with unique sections
per slug, then leave re-import + evaluate to the operator/script chain.
"""
from __future__ import annotations

import re
from pathlib import Path

import yaml

PKG = Path(__file__).resolve().parents[2] / (
    "archive/source-packs/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/pages"
)
FM = re.compile(r"^(---\s*\n)(.*?)(\n---\s*\n)(.*)$", re.S)

# Unique differentiators keyed by slug (canonical slug after number prefix strip)
DIFF: dict[str, dict[str, str]] = {
    "instagram-burnout": {
        "angle": "feed + Stories volume, public comment load, and profile aesthetics pressure",
        "unique_section": """## Instagram-specific pressure map

Burnout on Instagram often comes from **surface maintenance**, not only long-form production:

| Surface | Hidden cost |
| :--- | :--- |
| Feed grid | Aesthetic continuity and “dead square” anxiety |
| Stories | Daily presence expectation |
| Reels | Trend velocity and edit time |
| DMs / comments | Unbounded social labour |

**Instagram minimum week:** 1 Reel *or* 2 carousels + 3 Stories max, with one reply window (not all-day inbox).

**Do not copy Reels-burnout advice blindly:** Stories and grid repair create costs Reels-only creators never feel.
""",
        "qa": """## Quick answer

**Instagram burnout** is usually multi-surface load (Feed, Stories, Reels, DMs) plus public evaluation. Cut surfaces before cutting quality: pick one primary surface, cap Stories, set a daily reply window, and drop trend Reels until energy returns. Seek professional care if sleep, mood or function collapse.
""",
    },
    "reels-burnout": {
        "angle": "hook–edit–trend cycle and vertical video finishing debt",
        "unique_section": """## Reels-specific burnout loop

Reels burnout is a **finishing debt** problem:

1. Hook hunting (first 1s arms race)
2. Multi-take filming
3. Captions + sound + cut pacing
4. Performance anxiety from completion rate

**Reels minimum week:** one 15–25s proven format with locked B-roll kit — no new trend audio.

**Reels recovery rule:** reuse last month’s best structure with new proof; do not invent a new concept every post.

Unlike full Instagram burnout, you may keep static carousels healthy while pausing Reels entirely.
""",
        "qa": """## Quick answer

**Reels burnout** is finishing-debt from hooks, takes and edits. Pause trend-chasing, lock one short format, reuse proven structure with new proof, and measure energy after export—not only watch time. Restore Reels only after two calm weeks of lighter formats.
""",
    },
    "content-fatigue": {
        "angle": "audience and creator boredom from repetitive value",
        "unique_section": """## Content fatigue vs creator fatigue

**Content fatigue** is when *the library* feels stale: same promise, same angle, declining saves.  
It can exist even when the creator is healthy.

Signals:

- Saves drop while posting stays consistent
- Comments shift to “you already covered this”
- Series completion falls

**Response:** rotate series jobs (teach → process → proof → POV), not just aesthetics. Archive two weak series; promote one bank idea with new evidence.
""",
        "qa": """## Quick answer

**Content fatigue** means the content library feels repetitive to the audience (or to you as editor). Rotate content jobs, refresh proof, and retire weak series—before assuming personal burnout. If exhaustion is physical or emotional, treat that separately as creator fatigue/health.
""",
    },
    "creator-fatigue": {
        "angle": "operator energy, recovery debt, and nervous system load",
        "unique_section": """## Creator fatigue diagnostics

**Creator fatigue** is about *you*, not the feed:

| Check | Red flag |
| :--- | :--- |
| Sleep | Can’t recover after posting days |
| Recovery debt | Need full day off after every upload |
| Body | Tension, headaches, dread before record |
| Identity | “I only exist if I post” |

**Response:** minimum cadence + no public comeback stunt + boundaries on comments. If symptoms persist, professional support outranks any content system.
""",
        "qa": """## Quick answer

**Creator fatigue** is operator-level depletion (sleep, dread, recovery debt), not just a boring feed. Shrink to a minimum week, stop optional formats, protect unrecorded life, and get qualified help if health declines. Do not use a posting calendar as treatment.
""",
    },
    "content-creation-decision-fatigue": {
        "angle": "pre-shoot choice overload before any filming starts",
        "unique_section": """## Decision fatigue is pre-production, not editing

Most freeze happens **before** record:

- Which idea?
- Which hook?
- Which claim is safe?
- Which first frame?

**Counter-system (15 minutes):**

1. Pull 3 bank entries already scored filmable.  
2. Force-rank them by “proof available today”.  
3. Write one card only.  
4. Ban second concepts until the first is exported.

If you re-decide after the card is written, the system failed—not your discipline.
""",
        "qa": """## Quick answer

**Content creation decision fatigue** is overload from unmade pre-shoot choices. Limit options: three bank ideas max, one proof filter, one shoot card, no re-opening the decision until export. Templates help only when fields are filled once.
""",
    },
    "social-media-burnout-creator": {
        "angle": "multi-platform presence cost across networks",
        "unique_section": """## Multi-platform burnout pattern

Social media burnout for creators often means **N platforms × daily presence**, not one app:

- Cross-posting without re-editing for format  
- Inbox fragmentation  
- Metric comparison across apps  

**Reset:** one primary platform for 30 days; others on “archive + weekly repurpose only.”  
Define success as qualified conversations, not multi-app streaks.
""",
        "qa": """## Quick answer

**Social media burnout** for creators is multi-platform presence cost. Collapse to one primary network for 30 days, repurpose weekly at most, cap inboxes, and measure useful conversations—not simultaneous streaks on every app.
""",
    },
    "content-creation-workflow": {
        "angle": "idea → film → edit → publish assembly line",
        "unique_section": """## Workflow stages (production line)

| Stage | Output | Done when |
| :--- | :--- | :--- |
| Select | Ranked idea | Proof available today |
| Brief | Shoot card | Action + line + claim boundary |
| Capture | Raw clips | Opening frame secured |
| Edit | Cut | Promise matches payoff |
| Publish | Live post | CTA + reply window set |
| Learn | Bank note | One keep / one cut |

**Workflow rule:** never start Capture without a Brief. That single gate removes most thrash.
""",
        "qa": """## Quick answer

A **content creation workflow** is a staged line from select → brief → capture → edit → publish → learn. Block filming until a one-page brief exists, and review one keep/one cut after publish before inventing a new format.
""",
    },
    "content-planning-workflow": {
        "angle": "calendar, pillars, and capacity allocation before production",
        "unique_section": """## Planning is capacity allocation

A planning workflow answers:

1. What series own the month?  
2. How many units fit real hours?  
3. Which days are capture vs edit?  
4. What is the kill list?

**Monthly plan skeleton:**

- 60% baseline series  
- 30% proof-heavy pieces  
- 10% experiments (optional, deletable)

If the calendar has no kill list, it is a wish list.
""",
        "qa": """## Quick answer

A **content planning workflow** allocates capacity before production: pillars, unit counts, capture/edit days, and a kill list. Plan only what fits real hours, keep experiments optional, and never treat an overfull calendar as a commitment.
""",
    },
    "social-media-creative-brief-template": {
        "angle": "brand-facing multi-channel creative brief fields",
        "unique_section": """## Social brief fields (brand ↔ creator)

Required fields for a social creative brief:

1. Campaign objective (awareness / consideration / conversion)  
2. Audience + exclusion  
3. Mandatory messages vs banned claims  
4. Channel variants (Feed / Stories / Reels / paid cutdown)  
5. Asset lengths and safe zones  
6. Approval chain + revision cap  

**Difference from a creator personal brief:** multi-channel deliverables and brand claim control dominate.
""",
        "qa": """## Quick answer

A **social media creative brief template** aligns brand objective, banned claims, channel variants and revision caps before shoot. Fill mandatory/banned messages and approval chain first—creative style comes second.
""",
    },
    "content-creator-brief-template": {
        "angle": "solo creator self-brief for one piece of content",
        "unique_section": """## Solo creator brief (single asset)

Fields:

1. Audience tension  
2. Content job (teach / prove / process / POV)  
3. Opening frame  
4. Proof insert  
5. Spoken line (optional)  
6. CTA  
7. Time box  

No brand approval chain. If it takes more than 10 minutes to fill, the idea is not ready.
""",
        "qa": """## Quick answer

A **content creator brief template** is a one-page self-brief for a single asset: tension, job, opening, proof, CTA, time box. If you cannot fill it in ten minutes, return the idea to the bank.
""",
    },
    "ugc-creative-brief-template": {
        "angle": "UGC deliverables, usage rights, and ad-hook variants",
        "unique_section": """## UGC brief essentials

- Product truth + claims boundary  
- 2–3 hook variants for ad testing  
- Required proof shots (macro, demo, reaction)  
- Usage window (organic / paid / spark)  
- Revision rounds included  
- Raw file requirements  

**UGC-specific risk:** unpaid perpetual usage. Put duration and media in the brief, not the DMs.
""",
        "qa": """## Quick answer

A **UGC creative brief template** locks product truth, hook variants, proof shots, usage rights and revision caps before the creator films. Missing rights terms create expensive disputes later.
""",
    },
    "influencer-brief-template": {
        "angle": "creator voice + brand integration without script slavery",
        "unique_section": """## Influencer brief balance

Must include:

- Integration style (soft mention / dedicated / review)  
- Non-negotiable disclosures  
- Creative freedom zones  
- Exact deliverables (posts, Stories, lives)  
- Whitelisting / spark codes  
- Timeline and kill fee  

**Difference from UGC:** audience trust and creator voice are the product; over-scripting destroys value.
""",
        "qa": """## Quick answer

An **influencer brief template** protects creator voice while defining disclosures, deliverables, freedom zones and paid usage. Over-scripting is a failure mode; clear non-negotiables are not.
""",
    },
    "ugc-video-script-template": {
        "angle": "native UGC spoken lines + problem/demo/payoff",
        "unique_section": """## UGC script beat sheet

| Seconds | Beat | Example intent |
| :--- | :--- | :--- |
| 0–2 | Pattern interrupt | Show the messy problem |
| 2–8 | Relatable friction | Name the daily annoyance |
| 8–20 | Demo | Hands-on product use |
| 20–28 | Proof | Texture / result / limit |
| 28–35 | Soft CTA | Where to get it / what to try |

Language stays first-person and specific. No corporate voiceover tone.
""",
        "qa": """## Quick answer

A **UGC video script template** sequences interrupt → friction → demo → proof → soft CTA in first-person native language. Write what the creator can honestly say while using the product on camera.
""",
    },
    "product-video-script-template": {
        "angle": "product mechanism and demo clarity for commerce",
        "unique_section": """## Product video script spine

1. **Problem cost** (time, money, mess)  
2. **Mechanism** (how the product works, visible)  
3. **Demo under real conditions**  
4. **Limit honesty** (what it doesn’t do)  
5. **Next action** (try, configure, buy path)

**Commerce rule:** if the mechanism isn’t visible, the script is advertising, not demonstration.
""",
        "qa": """## Quick answer

A **product video script template** proves a mechanism on camera: problem cost, how it works, real demo, honest limits, next action. Skip claims you cannot show in the same take.
""",
    },
    "short-form-video-script-template": {
        "angle": "generic short-form pacing independent of UGC/ads",
        "unique_section": """## Short-form script primitives

Regardless of niche:

- One promise  
- One proof  
- One emotion or utility  
- One ending action  

**Timing skeleton (flexible):** 15 / 30 / 45s variants from the same card by cutting mid-proof, not by rewriting the promise.
""",
        "qa": """## Quick answer

A **short-form video script template** holds one promise, one proof, one utility/emotion and one ending action. Length variants cut mid-proof; they do not invent a second promise.
""",
    },
    "custom-instagram-content-plan": {
        "angle": "30-day Instagram calendar artifact sold/configured as a plan",
        "unique_section": """## What a custom Instagram plan contains

- Audience promise  
- 3 series mapped to Feed/Reels/Stories  
- 30-day unit counts by capacity  
- Example cards for week 1  
- Metrics review ritual  

**Not included by default:** guaranteed growth, unlimited revisions, daily management.
""",
        "qa": """## Quick answer

A **custom Instagram content plan** is a capacity-based 30-day map of series, unit counts and example cards—not a growth guarantee. It should match real filming hours and claim boundaries.
""",
    },
    "content-planning-service-for-creators": {
        "angle": "ongoing service retainer for planning decisions",
        "unique_section": """## Service vs one-off plan

| | One-off plan | Planning service |
| :--- | :--- | :--- |
| Cadence | Once | Weekly/monthly |
| Decisions | Batch | Continuous triage |
| Owner | Client executes alone | Shared decision load |
| Stop rule | Document delivered | Scope + hours/month |

A service fails when it becomes unlimited chat. Cap decision hours.
""",
        "qa": """## Quick answer

A **content planning service for creators** is ongoing decision support with capped hours—not a single PDF. Define cadence, outputs, revision limits and what happens when capacity is exceeded.
""",
    },
    "personal-brand-creative-direction": {
        "angle": "identity, visual signature, and high-ticket positioning",
        "unique_section": """## Personal brand direction layers

1. **Positioning promise** (who + outcome)  
2. **Visual signature** (height, grade, props)  
3. **Proof language** (case, process, POV)  
4. **Offer bridge** (who it’s not for)  

Direction that only changes LUTs is decoration. Direction that changes proof and promise is strategy.
""",
        "qa": """## Quick answer

**Personal brand creative direction** aligns promise, visual signature, proof language and offer bridges. If only the color grade changes, you bought aesthetics—not direction.
""",
    },
    "instagram-content-strategy-service": {
        "angle": "Instagram-native strategy service scope",
        "unique_section": """## Instagram strategy service scope

Typically includes:

- Profile audit (promise vs grid)  
- Series architecture for Feed/Reels/Stories  
- Claim-safe content rules  
- Monthly planning ritual  
- Optional creative direction handoff  

Excludes community management unless contracted.
""",
        "qa": """## Quick answer

An **Instagram content strategy service** designs series, profile promise fit and planning rituals for Instagram surfaces. It is not default community management or guaranteed reach.
""",
    },
    "ugc-creative-strategy-service": {
        "angle": "UGC program strategy for brands/creators",
        "unique_section": """## UGC strategy service scope

- Offer/product proof map  
- Hook library for testing  
- Creator briefing standards  
- Rights & revision policy  
- Portfolio/shot list standards  

Success metric: usable ad assets and clear briefs—not follower count.
""",
        "qa": """## Quick answer

A **UGC creative strategy service** builds proof maps, hook libraries, briefing and rights standards so assets are brand-usable. Optimize for approved ads and clear scopes, not vanity metrics.
""",
    },
    "content-strategist-for-instagram": {
        "angle": "hiring/DIY decision for Instagram strategist role",
        "unique_section": """## DIY vs strategist vs dossier

| Need | Best fit |
| :--- | :--- |
| One-off clarity | Private dossier / plan |
| Ongoing decisions | Strategist retainer |
| Just templates | DIY + brief templates |

Hire a strategist when decision load is weekly and costly—not when you only need a shot list once.
""",
        "qa": """## Quick answer

A **content strategist for Instagram** is worth it when weekly decision load is expensive. For one-off shoot-ready clarity, a dossier or plan may be enough; for pure templates, DIY works.
""",
    },
    "reels-creative-direction": {
        "angle": "Reels-only creative direction package",
        "unique_section": """## Reels direction deliverables

- Hook options (visual + verbal)  
- Scene order with proof insert  
- On-screen text limits  
- Edit pacing notes  
- CTA matched to utility  

Direction ends when the creator can film without a second strategy call.
""",
        "qa": """## Quick answer

**Reels creative direction** packages hooks, scene order, proof inserts, text limits and CTA so a Reel can be filmed without reopening strategy mid-shoot.
""",
    },
    "content-ideas-for-camera-shy-creators": {
        "angle": "formats that reduce face-forward anxiety",
        "unique_section": """## Camera-shy format menu

- Hands-only demos  
- Over-shoulder desk  
- Voiceover + B-roll  
- Text-led carousels  
- Screen recordings  

**Anxiety rule:** separate “being watched” from “sharing expertise.” Start with zero-face formats for two weeks, then optional chin-down talking head if desired.
""",
        "qa": """## Quick answer

**Content ideas for camera-shy creators** prioritize hands, POV, VO+B-roll, text carousels and screen recordings. Build a zero-face streak first; face-forward is optional, not a requirement for authority.
""",
    },
    "brand-ready-creator": {
        "angle": "portfolio and ops readiness for brand deals",
        "unique_section": """## Brand-ready checklist

- Media kit with clear rates  
- 3 portfolio pieces with proof  
- Revision & usage policy written  
- Response SLA  
- Invoice/legal basics  

Being camera-shy is orthogonal: brands buy clarity and reliability, not constant selfie volume.
""",
        "qa": """## Quick answer

A **brand-ready creator** has proof-led portfolio pieces, written usage/revision terms, rates and response standards. Readiness is operational—not the same as being comfortable on camera every day.
""",
    },
    "private-creative-direction-instagram-creators": {
        "angle": "private dossier product positioning for Instagram creators",
        "unique_section": """## Private direction vs public tips

Public articles teach principles. Private direction locks **your** lane constraints into cards: hooks, shots, claims, CTAs.

**Fit:** creator already films but loses hours deciding.  
**Not fit:** creator wants guaranteed virality or unlimited strategy chat.
""",
        "qa": """## Quick answer

**Private creative direction for Instagram creators** turns general advice into personal shoot cards under real constraints. It helps decision load; it does not guarantee reach.
""",
    },
    "how-to-build-a-content-bank": {
        "angle": "operational bank fields and weekly promotion ritual",
        "unique_section": """## Bank anti-patterns

- Titles only (“idea soup”)  
- Never deleting  
- Never promoting to briefs  
- Scoring vanity instead of filmability  

**Healthy bank:** few active, many archived, weekly promotion of 2–3 filmable entries.
""",
        "qa": """## Quick answer

Build a **content bank** with tension, proof, effort and status—not titles alone. Promote few ideas to briefs weekly and archive aggressively so the bank reduces decisions.
""",
    },
}


def slug_of(folder: str) -> str:
    parts = folder.split("-", 1)
    if parts[0].isdigit() and len(parts) == 2:
        return parts[1]
    return folder


def wc(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def replace_or_insert_section(body: str, heading: str, content: str) -> str:
    """Replace ## heading section or insert before FAQ/Next."""
    pattern = re.compile(
        rf"(^## {re.escape(heading)}\n)(.*?)(?=^## |\Z)",
        re.M | re.S,
    )
    block = content.strip() + "\n\n"
    if pattern.search(body):
        return pattern.sub(block if content.strip().startswith("##") else f"## {heading}\n\n{content.strip()}\n\n", body, count=1)
    # insert full block (content includes ##)
    full = content.strip() + "\n\n"
    if re.search(r"^## Frequently asked", body, re.M | re.I):
        return re.sub(r"(^## Frequently asked)", full + r"\1", body, count=1, flags=re.M)
    if re.search(r"^## Next step", body, re.M | re.I):
        return re.sub(r"(^## Next step)", full + r"\1", body, count=1, flags=re.M)
    return body.rstrip() + "\n\n" + full


def replace_quick_answer(body: str, qa_block: str) -> str:
    pattern = re.compile(r"^## Quick answer\n.*?(?=^## |\Z)", re.M | re.S)
    if pattern.search(body):
        return pattern.sub(qa_block.strip() + "\n\n", body, count=1)
    # after H1/image
    return re.sub(
        r"(^# .+\n(?:\!\[[^\]]*\]\([^\)]+\)\n)?\n)",
        r"\1" + qa_block.strip() + "\n\n",
        body,
        count=1,
        flags=re.M,
    )


def process(path: Path, slug: str, conf: dict) -> bool:
    raw = path.read_text(encoding="utf-8")
    m = FM.match(raw)
    if not m:
        return False
    fm = yaml.safe_load(m.group(2)) or {}
    body = m.group(4)

    if conf.get("qa"):
        body = replace_quick_answer(body, conf["qa"])

    # Remove generic shared expanders that cause collisions
    for generic in (
        "Practical depth",
        "Field implementation",
        "Operator notes",
        "Closing checklist",
        "A 14-day system reset",
        "Boundaries worth writing down",
        "Implementation checklist",
    ):
        body = re.sub(
            rf"^## {re.escape(generic)}\n.*?(?=^## |\Z)",
            "",
            body,
            count=1,
            flags=re.M | re.S,
        )

    # Insert unique differentiator
    uniq = conf["unique_section"].strip() + "\n"
    heading = uniq.split("\n", 1)[0].replace("## ", "").strip()
    body = replace_or_insert_section(body, heading, uniq)

    # Unique next step
    ns = (
        f"## Next step\n\n"
        f"Apply the **{slug.replace('-', ' ')}** angle ({conf['angle']}) to one card this week. "
        f"If decisions still stall after that single experiment, "
        f"[review AnomalyBox private direction](/store/) for shoot-ready cards—not more generic lists.\n"
    )
    if re.search(r"^## Next step", body, re.M | re.I):
        body = re.sub(r"^## Next step\n.*?(?=^## |\Z)", ns + "\n", body, count=1, flags=re.M | re.S)
    else:
        body = body.rstrip() + "\n\n" + ns

    body = re.sub(r"\n{3,}", "\n\n", body).strip() + "\n"
    fm["word_count"] = wc(body)
    if fm.get("secondary_keywords") is None:
        fm["secondary_keywords"] = []
    # mark differentiation
    fm["dedupe_pass"] = "CONTENT-DEDUP-001"
    y = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=100).strip()
    path.write_text(f"---\n{y}\n---\n\n{body.lstrip()}", encoding="utf-8")
    return True


def main() -> int:
    changed = []
    for d in sorted(PKG.iterdir()):
        if not d.is_dir():
            continue
        slug = slug_of(d.name)
        if slug not in DIFF:
            continue
        ok = process(d / "article.md", slug, DIFF[slug])
        if ok:
            changed.append((d.name, slug))
    print(f"Differentiated {len(changed)} pages")
    for folder, slug in changed:
        print(f"  {folder} → {slug}")
    missing = set(DIFF) - {s for _, s in changed}
    if missing:
        print("WARN missing folders for:", missing)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
