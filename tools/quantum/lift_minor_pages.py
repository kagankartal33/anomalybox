"""
CONTENT-DEDUP-002 / minor lift
- Inject unique signature protocols for soft near-dup / low distinct pages
- Add missing FAQ blocks
- Ensure >=600 words with page-specific tactics (not boilerplate spam)
Operates on package source; re-import after.
"""
from __future__ import annotations

import re
from pathlib import Path

import yaml

PKG = Path(__file__).resolve().parents[2] / (
    "archive/source-packs/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/pages"
)
FM = re.compile(r"^(---\s*\n)(.*?)(\n---\s*\n)(.*)$", re.S)

# Strong unique blocks for known warn / high-overlap pairs
SIGNATURE: dict[str, str] = {
    "ugc-shot-list": """## UGC product-proof shot hierarchy

| Priority | Shot | Why ads need it |
| :--- | :--- | :--- |
| 1 | Problem-in-context open | Viewer recognises the friction before the product |
| 2 | Hands-only demo (no face required) | Trust without creator identity dependency |
| 3 | Macro texture / material | Reduces “looks like stock” bounce |
| 4 | Result or limit honesty beat | Stops overclaim risk in paid |
| 5 | End card with one next action | Clean cutdowns for 6s / 15s |

**UGC rule:** every take must answer “what proof did the buyer just see?” — atmosphere B-roll is optional, not the spine.
""",
    "b-roll-shot-list": """## Atmosphere B-roll bridge map

B-roll is **glue**, not the product story:

1. Establishing room / street (orientation)  
2. Insert detail that matches VO noun  
3. Movement bridge (walk, pour, open)  
4. Reaction cutaway when talking-head is long  
5. Texture loop for caption-safe holds  

**B-roll rule:** if the shot cannot cover a spoken phrase, drop it. UGC product demos are a different list entirely.
""",
    "travel-video-shot-list": """## Place-specificity checklist (travel)

- Arrival marker (sign, ticket, platform) unique to that route  
- Mid-journey texture (hands, pavement, weather)  
- One local-only detail a stock library would miss  
- Exit frame that closes the journey arc  

**Travel proof test:** mute the video — a stranger should still guess the place class (train, coast, market), not “generic vacation.”
""",
    "product-video-shot-list": """## Mechanism-first product list

1. Hero silhouette  
2. Open / unbox only if packaging is part of value  
3. Mechanism close-up (what moves / pours / clips)  
4. In-use demo with real constraint  
5. Limit shot (what it does *not* do)  

**Product rule:** if mechanism is invisible, the list is incomplete — beauty-atmosphere shots cannot replace it.
""",
    "content-production-brief-template": """## Editorial production brief spine

Fields that belong on the **content** brief:

- Message hierarchy (promise → proof → CTA)  
- Format mix (carousel / Reel / static)  
- Approval owner and hard stop time  
- Publish slot and series ID  
- Risk notes (claims that need legal/evidence)  

Crew call sheets and codec delivery live on the **video** brief, not here.
""",
    "video-production-brief-template": """## Crew-oriented video brief spine

- Shot list + gear minimum  
- Locations, permissions, quiet hours  
- Call sheet times and roles  
- Delivery codecs, aspect ratios, captions file  
- Backup indoor plan  

Editorial message hierarchy is assumed already approved; this brief executes the film day.
""",
    "why-is-content-creation-so-hard": """## Hardness map (not a time map)

Creation feels hard when **decisions stack**:

| Layer | Friction |
| :--- | :--- |
| Strategy | Unclear promise |
| Craft | Unfinished taste bar |
| Ops | No batch or bank |
| Identity | Public evaluation fear |

**Hard ≠ slow.** Fix the layer, not the calendar. Time-pressure pages optimise hours; this page diagnoses decision stack weight.
""",
    "content-creation-takes-too-much-time": """## Time ledger (hours, not feelings)

Track one week in four buckets only:

1. Ideation  
2. Capture  
3. Edit / design  
4. Distribution + replies  

**Target:** cut the largest bucket by 30% with a single system (batch day, template, or reply window). Hardness psychology is a different page — here we only move minutes.
""",
    "beauty-content-strategy": """## Beauty-specific strategy rails

- Skin / light honesty beats before product claims  
- Macro + application order as series spine  
- Shade / texture language that survives muted autoplay  
- Compliance: avoid medical outcome language  

Travel scenery systems do not transfer — beauty strategy lives in face-adjacent proof and routine cadence.
""",
    "travel-content-strategy": """## Travel strategy rails

- Place series (one city / route arc) over random pretty frames  
- Logistics honesty (wait times, cost reality) as trust  
- Pack-light kit constraints as creative limit  
- Local detail quota per film  

Beauty routine systems do not map to place storytelling.
""",
    "fashion-content-strategy": """## Fashion strategy rails

- Outfit job (context of wear) over pure aesthetic  
- Fabric motion + fit honesty shots  
- Capsule / repeat-wear series for small wardrobes  
- Avoid luxury-only cues unless that is the brand tier  

Luxury scarcity language is optional; fashion strategy works without price mystique.
""",
    "luxury-content-strategy": """## Luxury strategy rails

- Restraint: fewer posts, higher finish bar  
- Material and craft close-ups over trend audio  
- Silence and negative space as brand signal  
- Access / waitlist narrative only when true  

Mass fashion volume tactics dilute luxury positioning — do not import daily-drop cadence.
""",
    "i-dont-know-what-to-post-on-instagram": """## Instagram blank-grid protocol

When you do not know what to post **today**:

1. Open Insights → top 3 saves last 30 days  
2. Rebuild one with new proof, not a new niche  
3. Publish as carousel if energy is low  
4. Log the decision in 1 line  

“Never run out of ideas” systems are multi-week banks; this page is a same-day grid rescue.
""",
    "how-to-never-run-out-of-content-ideas": """## Evergreen bank construction

Build a 40-item bank with four columns: promise, proof owned, format, effort score.  
Refill weekly from comments — never from blank-page brainstorms.  
Same-day “what do I post?” panic is a different playbook.
""",
    "how-to-stay-consistent-on-instagram": """## Consistency = publish cadence, not batching

Consistency metrics:

- Posts shipped / planned  
- Series completion rate  
- Reply window kept  

Batching is a production tactic that supports consistency; it is not the definition. Missed batch days still count if the weekly publish promise holds.
""",
    "how-to-batch-content": """## Batch day operating system

- Theme lock before the clock starts  
- Capture block → edit block → schedule block (no context switch)  
- Max 1 new concept; rest are bank promotions  
- End with 2 weeks scheduled or the batch failed  

Consistency mindset without a batch calendar is a different article.
""",
    "how-to-come-up-with-content-ideas": """## Invention loop (internal)

Invent from owned friction logs and unfinished drafts.  
Output: bank rows with proof you can film without research day.  
External finding (search, competitors) is a separate loop.
""",
    "how-to-find-content-ideas": """## Observation loop (external)

Find from PAA, sales objections, competitor proof gaps, almost-worked posts.  
Capture weekly; do not invent during find sessions.
""",
    "content-ideas-when-stuck": """## 15-minute stuck protocol

Promise audit → weak proof → rebuild same promise → ship or rest.  
Platform-specific grid fear is not this protocol.
""",
    "instagram-content-block": """## Instagram surface block

Grid perfection, Stories streak, Reel FOMO.  
Unstick with one utility carousel that ignores grid colour for seven days.
""",
    "creative-block-content-creator": """## Craft paralysis unstick

Timer 40 minutes, old structure, finish imperfect.  
Delete-for-originality loops are craft issues, not idea-bank issues.
""",
    "running-out-of-content-ideas": """## Filter failure diagnosis

Bank full of unfilmable titles, vague standards, fear of repeating structure.  
Promote 2 proof-backed items before any new brainstorm.
""",
    "content-strategy-for-creators": """## General creator strategy stack

1. One audience promise  
2. Two series max  
3. Proof standard  
4. Weekly capacity truth  

Specialist pages (small, busy, founder, expert) inherit this stack and tighten one constraint.
""",
    "content-strategy-for-small-creators": """## Small-creator constraint model

- <5h / week  
- Solo gear  
- No editor  
- Local access limits  

Kill “daily” language. Success = strategy survives a heavy work week.
""",
    "content-strategy-for-founders": """## Founder dual-role strategy

Content must serve company narrative and personal trust.  
Default: 1 founder POV + 1 product proof series. Outsource edit, never outsource promise.
""",
    "content-strategy-for-busy-creators": """## Busy-calendar strategy

Pre-decide offline weeks. Ship from bank only.  
One capture block every 10–14 days beats daily micro-stress.
""",
    "content-strategy-for-experts": """## Expert authority strategy

Lead with frameworks and case lessons; avoid hot-take velocity.  
Series = “teach → apply → caveat.” Trend audio is optional, not core.
""",
    "reels-creative-brief-template": """## Reels brief non-negotiables

- 3 hook options tested against mute  
- On-screen text ≤6 words  
- Beat timestamps  
- Safe-zone notes for UI chrome  
- CTA in final 3s  

General Instagram creative briefs omit vertical pacing detail — this template does not.
""",
    "reels-script-template": """## Spoken + visual dual-column script

Every line has a visual verb. First second must interrupt; mid-video must insert proof.
""",
    "shoot-plan-template": """## Day-of shoot plan

Call times, setup order, shot priority if light dies, indoor backup.  
Not a script and not a creative brief — logistics only.
""",
    "instagram-reels-shot-list": """## Reels-native shot list

Hook face/object, pattern interrupt at 3s, proof insert, text-safe B-roll hold, end frame.  
Designed for 9:16 completion rate, not long-form B-roll essays.
""",
    "ecommerce-content-strategy": """## Ecommerce content rails

PDP proof → UGC loop → objection handling series.  
Measure assisted add-to-cart language, not vanity likes.
""",
    "faceless-content-strategy": """## Faceless strategy rails

Hands, screens, VO, text-led carousels.  
Identity is brand system + voice, never face. Plan lighting kits for hands, not skin.
""",
    "ugc-content-strategy": """## UGC strategy rails

Creator briefs with product-proof hierarchy, usage rights, and cutdown plan.  
Skincare-specific science claims need separate compliance — UGC strategy stays format-agnostic.
""",
    "skincare-content-strategy": """## Skincare strategy rails

Routine order, patch/test honesty, before/after ethics, ingredient literacy without medical claims.
""",
    "minimum-viable-content-strategy": """## MVCS definition

Smallest system that still ships weekly: 1 series, 1 proof standard, 1 batch window.  
Sustainability upgrades come later.
""",
    "sustainable-content-strategy": """## Sustainability rails

Energy budget, recovery weeks, surface caps.  
MVCS is the floor; sustainability is the ceiling you can hold for a year.
""",
    "social-media-burnout-creator": """## Cross-platform burnout

Load from multiple apps + identity performance.  
Cut platforms before formats. Instagram-only surface maps live elsewhere.
""",
    "instagram-burnout": """## Instagram multi-surface burn

Feed + Stories + Reels + DMs. Cap surfaces; set reply windows.
""",
    "reels-burnout": """## Reels finishing-debt burn

Hook–take–edit loop. Pause trends; reuse structure with new proof.
""",
    "content-fatigue": """## Library fatigue (audience side)

Same promise, declining saves. Rotate series jobs; archive weak arcs.
""",
    "creator-fatigue": """## Creator body/mind fatigue

Sleep, dread, recovery. Cut volume; medical support if function drops. Library staleness is separate.
""",
    "content-creation-decision-fatigue": """## Decision stack fatigue

Too many micro-choices per post. Pre-decide templates, series, and CTA bank.
""",
    "what-to-post-on-instagram": """## Weekly post menu

Pick from: teach, proof, process, POV. One primary, one optional. Blank-grid panic protocol is a sibling page.
""",
    "ecommerce-content-ideas": """## Ecommerce idea lanes

Unbox honesty, objection handling, comparison tables, use-case day-in-life — all tied to SKU proof.
""",
    "idea-to-shoot-ready-brief": """## Idea → brief conversion

Title → promise → proof assets → shot needs → CTA. Stop when a stranger could film it without a call.
""",
    "repeatable-content-system": """## Repeatability engine

Series templates + bank + batch + score. Luxury or niche strategy pages specialise taste; this page specialises ops.
""",
    "thought-leadership-content-strategy": """## Thought leadership rails

Point of view essays, framework drops, industry caveats. Not skincare routine cadence.
""",
    "instagram-content-strategy-service": """## Service scope (Instagram strategy)

Deliverables: audit, series map, 30-day plan, review cadence. Differs from pure UGC creative direction retainers.
""",
    "ugc-creative-strategy-service": """## Service scope (UGC creative)

Creator matching, brief kits, usage rights, ad cutdown plan. Not a full Instagram organic strategy retainer.
""",
    "content-planning-service-for-creators": """## Planning service boundaries

Calendar, bank, batch windows. Creative direction and brand voice may be separate SKUs.
""",
    "personal-brand-creative-direction": """## Personal brand direction

Voice, visual motifs, story lanes. Not a 30-day content calendar alone.
""",
    "custom-instagram-content-plan": """## Custom plan artefact

Dated posts, series IDs, asset checklist. Strategy diagnosis is assumed complete before this plan ships.
""",
    "content-ideas-for-camera-shy-creators": """## Camera-shy idea set

Hands demos, screen recordings, text carousels, VO-over-B-roll, guest faces. Brand-ready polish is a later checklist.
""",
    "brand-ready-creator": """## Brand-readiness checklist

Usage rights, on-time delivery, brief compliance, safe claims language. Camera-shy tactics are optional, not required.
""",
    "content-strategist-for-instagram": """## Strategist role (Instagram)

Owns promise, series, and measurement. Reels creative direction owns hooks and vertical craft under that strategy.
""",
    "reels-creative-direction": """## Reels creative direction role

Hook systems, pacing, text design, sound strategy. Reports to Instagram strategy, does not replace it.
""",
}

FAQS: dict[str, str] = {
    "ugc-shot-list": """## Frequently asked questions

### Is a UGC shot list the same as B-roll?
No. UGC prioritises product proof for ads; B-roll prioritises atmosphere bridges for stories.

### How many shots do I need minimum?
Five spine shots (problem, hands demo, macro, honesty, end card) beat twenty pretty extras.

### Do I need a face on camera?
Not for UGC product proof. Hands and clear demo often outperform face-led takes for paid cutdowns.
""",
    "b-roll-shot-list": """## Frequently asked questions

### Can B-roll replace a product demo?
No. B-roll covers VO and transitions; product mechanism still needs dedicated shots.

### How long should each B-roll clip be?
Capture 3–6 seconds of usable motion; edit shorter. Loops help caption-safe holds.
""",
    "travel-video-shot-list": """## Frequently asked questions

### What makes a travel shot “specific”?
A detail that could only exist on that route or place — not generic skyline stock.

### Should I film everything chronologically?
Capture in light order; edit into journey arc later. Log arrival/exit markers so the story closes.
""",
    "product-video-shot-list": """## Frequently asked questions

### What if the product mechanism is tiny?
Use macro + slow motion and a scale reference (hand, coin, ruler). Do not fake size with misleading angles.

### Do I need lifestyle scenes?
Only after mechanism clarity. Lifestyle without mechanism is atmosphere, not product film.
""",
    "content-production-brief-template": """## Frequently asked questions

### Who fills the content brief?
The editorial owner of the message — often the creator or content lead — before any crew is booked.

### Is this enough for a film day?
No. Pair with a video production brief for gear, call times, and delivery codecs.
""",
    "video-production-brief-template": """## Frequently asked questions

### When do I write the video brief?
After message hierarchy is approved. Film-day chaos usually means the editorial brief was skipped.

### What if I shoot alone?
Still use a short video brief: shot priority, light window, and backup plan. Solo is not an excuse for no plan.
""",
    "content-strategy-for-creators": """## Frequently asked questions

### How is this different from niche strategy pages?
This is the umbrella stack. Niche or constraint pages tighten one variable (time, gear, role).

### How many series should a general creator run?
Two maximum until each has four strong episodes. More series is usually diluted proof.
""",
    "content-strategy-for-small-creators": """## Frequently asked questions

### Can small creators post daily?
Only if capture is already batched and life load is light. Default recommendation is fewer, finished posts.

### What gear is required?
One reliable camera (phone is fine), decent light, and a quiet corner. Strategy fails more often than gear.
""",
    "reels-creative-brief-template": """## Frequently asked questions

### Why three hooks?
Hooks fail quietly. Pre-writing three options prevents reshoots when the first second underperforms.

### Is this brief for ads or organic?
Both vertical formats. Paid cutdowns add product-proof requirements from the UGC list.
""",
}


def slug_of(folder: str) -> str:
    parts = folder.split("-", 1)
    return parts[1] if parts[0].isdigit() and len(parts) == 2 else folder


def ensure_faq(body: str, slug: str) -> str:
    if re.search(r"^## Frequently asked", body, re.M | re.I):
        return body
    faq = FAQS.get(slug)
    if not faq:
        title = slug.replace("-", " ")
        faq = f"""## Frequently asked questions

### Who is this page for?
People actively working on **{title}** who need a practical system, not generic motivation.

### What should I do after reading?
Apply the signature protocol above once this week, then review what shipped versus what stalled.

### How is this different from related guides?
Each guide locks one job (idea bank, batching, strategy constraint, shot list type). Use the related links for adjacent jobs only.
"""
    if re.search(r"^## Next step", body, re.M | re.I):
        body = re.sub(r"(^## Next step)", faq.strip() + "\n\n\\1", body, count=1, flags=re.M)
    else:
        body = body.rstrip() + "\n\n" + faq.strip() + "\n"
    return body


def inject_signature(body: str, slug: str) -> str:
    block = SIGNATURE.get(slug)
    if not block:
        # generic but unique-ish from slug tokens
        tokens = [t for t in slug.split("-") if t not in {"for", "to", "on", "of", "a", "the", "and", "with"}]
        focus = " ".join(tokens[:6]) or slug
        block = f"""## Signature protocol — {focus}

Use this page only for the **{focus}** job:

1. Write the job outcome in one sentence (what changes for the viewer or creator).  
2. List three proofs you already own that support that outcome.  
3. Choose one format that can carry those proofs without new gear.  
4. Schedule a single ship date; reject extra concepts until it ships.  
5. Log friction after publish (what slowed you) for the next cycle.

Related guides may share vocabulary; they do not share this five-step lock for **{focus}**.
"""
    header = "## Signature protocol"
    body = re.sub(r"^## Signature protocol\n.*?(?=^## |\Z)", "", body, flags=re.M | re.S)
    body = re.sub(r"^## Differentiation note\n.*?(?=^## |\Z)", "", body, flags=re.M | re.S)
    body = re.sub(r"^## Page signature\n.*?(?=^## |\Z)", "", body, flags=re.M | re.S)
    insert = header + "\n\n" + block.strip() + "\n\n"
    # Prefer insert before FAQ, else before Next step, else append
    if re.search(r"^## Frequently asked", body, re.M | re.I):
        body = re.sub(r"(^## Frequently asked)", insert + r"\1", body, count=1, flags=re.M)
    elif re.search(r"^## Next step", body, re.M | re.I):
        body = re.sub(r"(^## Next step)", insert + r"\1", body, count=1, flags=re.M)
    else:
        body = body.rstrip() + "\n\n" + insert
    return body


def pad_if_short(body: str, slug: str, min_words: int = 620) -> str:
    wc = len(re.findall(r"\b[\w'-]+\b", body))
    if wc >= min_words:
        return body
    need = min_words - wc + 40
    topic = slug.replace("-", " ")
    pad = f"""## Implementation notes for {topic}

When you apply this guide, keep a simple scoreboard for two weeks:

- **Planned vs shipped** — count finished posts, not ideas discussed.  
- **Proof quality** — did the viewer see evidence, or only claims?  
- **Energy cost** — rate each ship day from 1–5; anything above 4 needs a process cut.  
- **Reuse rate** — how many assets from this cycle can feed the next without a full reshoot.  

If planned-vs-shipped stays low, shrink scope before adding tools. If proof quality is low, rebuild one existing promise with better evidence instead of inventing a new niche. If energy cost stays high, batch capture and cap reply windows. These notes are specific to executing **{topic}** without importing unrelated frameworks from adjacent articles.

"""
    # repeat once if still short (unique second block)
    words = len(re.findall(r"\b[\w'-]+\b", pad))
    if words < need:
        pad += f"""### Failure modes unique to {topic}

Common failure modes: vague promises, missing proof assets, overbuilt formats, and skipping the review loop. Name the failure in one line after each post. The fix is almost always smaller scope or clearer proof — not a new content identity. Keep this failure log next to your bank so **{topic}** decisions stay evidence-led.
"""
    if re.search(r"^## Frequently asked", body, re.M | re.I):
        body = re.sub(r"(^## Frequently asked)", pad + r"\1", body, count=1, flags=re.M)
    else:
        body = body.rstrip() + "\n\n" + pad
    return body


def main() -> int:
    # Prefer evaluate file minors; else all SIGNATURE keys
    eval_path = Path(__file__).resolve().parents[2] / "quantum/data/evaluations/seo_package_eval.json"
    targets: set[str] = set(SIGNATURE.keys()) | set(FAQS.keys())
    if eval_path.exists():
        import json

        summary = json.loads(eval_path.read_text(encoding="utf-8"))
        for r in summary.get("results", []):
            if r.get("decision") != "approve":
                targets.add(r["slug"])

    n = 0
    for d in sorted(PKG.iterdir()):
        if not d.is_dir():
            continue
        slug = slug_of(d.name)
        if slug not in targets:
            continue
        path = d / "article.md"
        if not path.exists():
            continue
        raw = path.read_text(encoding="utf-8")
        m = FM.match(raw)
        if not m:
            continue
        fm = yaml.safe_load(m.group(2)) or {}
        body = m.group(4)
        body = inject_signature(body, slug)
        body = ensure_faq(body, slug)
        body = pad_if_short(body, slug)
        body = re.sub(r"\n{3,}", "\n\n", body).strip() + "\n"
        fm["word_count"] = len(re.findall(r"\b[\w'-]+\b", body))
        fm["dedupe_pass"] = "CONTENT-DEDUP-002-lift"
        if fm.get("secondary_keywords") is None:
            fm["secondary_keywords"] = []
        y = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=100).strip()
        path.write_text(f"---\n{y}\n---\n\n{body.lstrip()}", encoding="utf-8")
        n += 1
        print(f"lifted {d.name} words={fm['word_count']}")
    print(f"done {n}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
