"""
improve_seo_package_articles.py
================================
Reads every package article.md, fixes known quality issues, expands thin pages,
trims overlong ones, improves meta, rewrites repetitive filler.

Edits in place under ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/.../pages/
Then re-run: python tools/import_seo_package_v6.py
"""

from __future__ import annotations

import re
from pathlib import Path

import yaml

PKG = Path(__file__).resolve().parents[1] / (
    "archive/source-packs/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/ANOMALYBOX_112_PAGE_SEO_CONTENT_PACKAGE_V6/pages"
)
FM = re.compile(r"^(---\s*\n)(.*?)(\n---\s*\n)(.*)$", re.S)

# Repeated filler injected into many lane/strategy pages
SPAM_LINE_RE = re.compile(
    r"(?:For \*\*[^*]+\*\*,\s*)?apply this specifically to[^\n.]+\.\s*",
    re.I,
)
# Internal editorial module that should not ship as public body
PUB_EVIDENCE_RE = re.compile(
    r"\n## Publication evidence for[^\n]*\n[\s\S]*?(?=\n## |\Z)",
    re.I,
)
# Commercial deliverable spam
DELIVERABLE_SPAM = "documented as a practical decision with a named purpose"


def body_word_count(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def clean_body(body: str) -> str:
    body = SPAM_LINE_RE.sub("", body)
    body = PUB_EVIDENCE_RE.sub("\n", body)
    # collapse triple newlines
    body = re.sub(r"\n{3,}", "\n\n", body)
    return body.strip() + "\n"


def improve_meta(fm: dict, title: str, keyword: str, page_type: str) -> str:
    kw = keyword or title
    templates = {
        "pillar": f"{title}: practical steps, proof standards and production decisions for {kw} — without empty trend advice.",
        "guide": f"A clear working system for {kw}: what to decide, what to film, and what to stop doing.",
        "template-guide": f"Use this {kw} as a fillable production tool: fields, examples, and claim-safe boundaries.",
        "lane-strategy": f"{title} for creators who need recurring series, evidence rules and a capacity-first cadence.",
        "lane-ideas": f"Shoot-ready {kw} with angle, sequence, proof and a realistic next step.",
        "persona-hub": f"{title}: production defaults for real constraints, energy and privacy — not generic motivation.",
        "commercial-landing": f"What {kw} includes, who it is for, how the process works, and what is not guaranteed.",
        "linkable-asset": f"{title}: a practical checklist creators can save and reuse on the next planning cycle.",
    }
    # pick closest
    for key, val in templates.items():
        if key in (page_type or ""):
            desc = val
            break
    else:
        desc = f"{title}: practical guidance for {kw}, with examples and production boundaries creators can apply this week."
    # SERP length ~150-160
    if len(desc) > 158:
        desc = desc[:155].rsplit(" ", 1)[0] + "…"
    return desc


def quick_answer_block(keyword: str, title: str, page_type: str) -> str:
    kw = keyword or title
    if "burnout" in kw or "fatigue" in kw or "overwhelm" in kw:
        return (
            f"## Quick answer\n\n"
            f"**{kw}** is usually a workload and decision problem before it is a motivation problem. "
            f"Cut nonessential formats, define a minimum viable cadence, separate admin from creative time, "
            f"and get qualified support if health is affected. Do not treat a content calendar as medical advice.\n"
        )
    if "template" in (page_type or "") or "template" in kw:
        return (
            f"## Quick answer\n\n"
            f"A usable **{kw}** is a set of fields that force decisions: audience tension, opening frame, "
            f"proof, spoken line, claim boundary and CTA. Copy the structure, then fill it with your product "
            f"truth — empty templates do not reduce revisions by themselves.\n"
        )
    if "strategy" in kw or page_type in ("lane-strategy", "pillar"):
        return (
            f"## Quick answer\n\n"
            f"A working approach to **{kw}** locks five defaults: audience promise, three to four recurring series, "
            f"acceptable evidence, a standard vs minimum production route, and a review metric. "
            f"Rebuild those defaults monthly — not every shoot day.\n"
        )
    if "content bank" in kw:
        return (
            f"## Quick answer\n\n"
            f"Build a bank that stores tension, angle, proof, production mode and status — not just titles. "
            f"Review weekly, promote a few ideas to briefs, and archive duplicates so the bank reduces decisions "
            f"instead of multiplying them.\n"
        )
    if page_type == "commercial-landing":
        return (
            f"## Quick answer\n\n"
            f"**{kw}** is for creators who can film but lose time choosing angle, proof and scene order. "
            f"Expect diagnosis, concept, opening frame, scene/proof plan and claim-safe caption direction — "
            f"not guaranteed reach or sales.\n"
        )
    return (
        f"## Quick answer\n\n"
        f"Treat **{kw}** as a production decision system: name the audience tension, the visible proof, "
        f"the first frame, and the constraint you will not violate. Then film the smallest version that still "
        f"answers the reader’s job.\n"
    )


def next_step_block(keyword: str) -> str:
    return (
        f"## Next step\n\n"
        f"Turn the decisions on this page into one shoot card before opening the camera app: promise, three beats, "
        f"proof insert, claim boundary, CTA. If those choices still stall every week, "
        f"[review AnomalyBox private direction](/store/) for tailored, shoot-ready dossiers — not another idea dump.\n"
    )


def expansion_for(fm: dict, body: str, keyword: str, title: str, page_type: str) -> str:
    """Unique expansion blocks by page type/keyword — avoid cross-article copy."""
    kw = keyword or title
    slug_bits = (fm.get("file_name") or title).lower()

    if page_type == "commercial-landing" or "creative direction" in kw:
        return f"""## What you decide before the first take

1. **Audience job:** what the viewer should understand or do after 15–45 seconds.
2. **Proof standard:** what must appear on camera so the claim is honest.
3. **Opening frame:** the first visible moment matched to the cover promise.
4. **Scene order:** context → demonstration → proof insert → close.
5. **Boundary list:** claims you will not make; revisions that count as new work.

## How direction reduces revision loops

Most revision cost comes from unmade decisions, not from bad lighting alone. When the brief names the proof and the forbidden claims, feedback becomes “this proof is missing” instead of “make it more premium.” That is the operational value of **{kw}**.

## Example engagement model

- **Discovery call inputs:** lane, offer, access, privacy, weekly hours.
- **Direction pack:** concept card, shot order, spoken-line options, caption angle.
- **Creator pass:** natural performance inside the locked structure.
- **Review pass:** claim check and one structured feedback round.

"""

    if "burnout" in kw or "fatigue" in kw:
        return f"""## A 14-day system reset (not a hustle challenge)

**Days 1–3 — measure load:** hours filmed, edited, messaged, and recovered.  
**Days 4–7 — cut one format** that creates little business value.  
**Days 8–10 — minimum cadence only** (one reliable series).  
**Days 11–14 — reintroduce one optional experiment** if energy returned.

Track how you feel after publishing, not only views. If sleep, mood or daily function stay impaired, prioritise professional care over content systems.

## Boundaries worth writing down

- Comment and DM windows (not 24/7).
- Revision caps per brand project.
- No “post every personal moment” rule.
- One metrics review day per week, not hourly checks.

"""

    if "content bank" in kw:
        return f"""## Fields every bank entry needs

| Field | Why it matters |
| :--- | :--- |
| Audience tension | Prevents random clever titles |
| Angle | One sentence point of view |
| Proof available | Stops ideas you cannot support on camera |
| Production mode | Solo / UGC / faceless / desk |
| Effort score (1–5) | Protects capacity |
| Status | Captured → Selected → Briefed → Done |

## Weekly bank ritual (30–40 minutes)

1. Capture 5–10 tensions from comments, DMs, support tickets or client questions.  
2. Score each for usefulness and filmability.  
3. Promote only 2–3 into brief cards.  
4. Archive expired trends and duplicates.

A bank that never deletes becomes another overwhelm machine.

"""

    if "strategy" in kw or page_type in ("lane-strategy", "pillar"):
        lane_note = "your lane"
        if "beauty" in kw:
            lane_note = "texture, lighting consistency, claim-safe routine language"
        elif "fashion" in kw or "luxury" in kw:
            lane_note = "silhouette, movement, fabric proof and restrained pacing"
        elif "travel" in kw:
            lane_note = "place-specific detail, route logic and atmosphere audio"
        elif "fitness" in kw:
            lane_note = "form angles, safety language and measurable cues"
        elif "ecommerce" in kw or "product" in kw:
            lane_note = "problem–demo–proof without unsupported performance claims"
        elif "faceless" in kw:
            lane_note = "hands, objects, POV, sound identity and text rhythm"
        elif "expert" in kw or "thought" in kw:
            lane_note = "receipts, frameworks and respectful point of view"

        return f"""## Strategy one-pager (fill once, reuse weekly)

- **Promise:** who you help and what changes for them.  
- **Series map:** three recurring formats tied to that promise.  
- **Proof standard:** what counts as honest evidence in this lane ({lane_note}).  
- **Minimum week:** the smallest publish set that still feels like the brand.  
- **Stop list:** formats or claims you will not chase for reach.

## Sample week under real capacity

| Day | Work | Output |
| :--- | :--- | :--- |
| Mon | Select 2 bank ideas + write cards | 2 briefs |
| Tue | Film both in one setup | Raw clips |
| Wed | Edit + caption | 1–2 posts ready |
| Thu | Publish + reply window | Engagement |
| Fri | Light review notes | Bank updates |

If the week fails, shrink the minimum week — do not invent a new strategy.

"""

    if page_type == "template-guide" or "template" in kw or "shot list" in kw:
        return f"""## How to fill the template without freezing

1. Write the viewer outcome in one sentence.  
2. List the proof you can show today (not ideal future proof).  
3. Script the opening 3 seconds as action + text, not a long monologue.  
4. Mark claim boundaries before you film.  
5. Record one backup ending (save CTA vs soft DM CTA).

## Common mistakes this template prevents

- Filming before the payoff is defined.  
- Using three hooks that all need different first frames.  
- Caption promising something the video never shows.  
- Leaving revision scope undefined for brand work.

"""

    if page_type in ("lane-ideas", "guide") or "ideas" in kw:
        return f"""## How to adapt these ideas without copying surfaces

Keep the **mechanism** (tension → proof → payoff). Change the **surface** (your props, location, voice, product, audience language). If two creators film the same structure with different proof, both can be original.

## Production filter before you shoot

Ask:

1. Can I show proof in this room with this light?  
2. Can I say the line without overclaiming?  
3. Can I finish edit in under my weekly limit?  
4. Does this support the account promise, not a one-off stunt?

If any answer is no, return the idea to the bank instead of forcing a weak post.

"""

    # default expansion
    return f"""## Implementation checklist for {kw}

1. Write the audience tension in one line.  
2. Choose one proof device that can appear on camera.  
3. Lock the first frame to the cover promise.  
4. Film the shortest honest version first.  
5. Review saves/replies before changing the format.

## What “good enough” looks like

A finished piece that a teammate could recreate from notes, without a second strategy meeting, and without unsupported claims. Polish can wait; unclear decisions cannot.

"""


def rewrite_commercial_deliverables(body: str) -> str:
    if DELIVERABLE_SPAM not in body:
        return body

    replacement = """## Deliverables

- **Creator and lane diagnosis:** who the content is for, constraints, and the decision currently blocking production.
- **Concept rationale:** why this angle fits the audience promise and what it will not try to do.
- **Hook and opening frame:** first visible moment + spoken or on-screen open, matched to the payoff.
- **Scene and proof plan:** ordered beats with the evidence that must appear on camera.
- **Caption direction and backup route:** primary CTA plus one lower-pressure alternative if the first underperforms.

The final commercial scope, turnaround and pricing must be confirmed on the live store or service page. Do not invent fulfilment guarantees inside this article.
"""
    # replace Deliverables section if present
    body2 = re.sub(
        r"## Deliverables\n[\s\S]*?(?=\n## )",
        replacement + "\n",
        body,
        count=1,
    )
    if body2 == body:
        body2 = body.replace(DELIVERABLE_SPAM, "with a clear purpose and acceptance criterion")
    return body2


def ensure_section_after_intro(body: str, section_md: str, heading: str) -> str:
    if re.search(rf"^## {re.escape(heading)}\b", body, re.M | re.I):
        return body
    # insert after first paragraph block following H1/image
    lines = body.splitlines()
    insert_at = 0
    seen_h1 = False
    para_end = 0
    for i, line in enumerate(lines):
        if line.startswith("# "):
            seen_h1 = True
            continue
        if seen_h1 and line.startswith("!["):
            continue
        if seen_h1 and line.strip() == "":
            continue
        if seen_h1 and not line.startswith("#"):
            # find end of first content paragraph group
            j = i
            while j < len(lines) and not lines[j].startswith("## "):
                j += 1
            insert_at = j
            break
    if insert_at == 0:
        # fallback: before first ##
        for i, line in enumerate(lines):
            if line.startswith("## "):
                insert_at = i
                break
        else:
            insert_at = len(lines)
    block = section_md.strip() + "\n"
    new_lines = lines[:insert_at] + ["", block] + lines[insert_at:]
    return "\n".join(new_lines).strip() + "\n"


def ensure_before_faq_or_end(body: str, section_md: str, heading: str) -> str:
    if re.search(rf"^## {re.escape(heading)}\b", body, re.M | re.I):
        return body
    block = "\n" + section_md.strip() + "\n"
    m = re.search(r"\n## Frequently asked", body, re.I)
    if m:
        return body[: m.start()] + "\n" + block + body[m.start() :]
    if re.search(r"\n## Next step", body, re.I):
        return body  # next step exists; don't force elsewhere
    return body.rstrip() + "\n\n" + section_md.strip() + "\n"


def trim_to_max(body: str, max_words: int = 1180) -> str:
    if body_word_count(body) <= max_words:
        return body

    # Split into intro + ## sections; drop non-essential middle sections first.
    chunks = re.split(r"(?=^## )", body, flags=re.M)
    if not chunks:
        return body

    def is_keep(chunk: str) -> bool:
        head = chunk.lstrip().split("\n", 1)[0].lower()
        if chunk.lstrip().startswith("# "):
            return True
        return any(
            k in head
            for k in (
                "quick answer",
                "frequently asked",
                "next step",
                "deliverables",
                "copyable",
            )
        )

    keep = [chunks[0]]
    optional = []
    for ch in chunks[1:]:
        if is_keep(ch):
            keep.append(ch)
        else:
            optional.append(ch)

    # Prefer dropping "Practical depth" expansions and late optional sections
    optional_sorted = sorted(
        optional,
        key=lambda c: (0 if c.lstrip().lower().startswith("## practical depth") else 1, -body_word_count(c)),
    )

    body2 = "".join(keep + optional_sorted)
    # Drop optional sections from the front of optional_sorted until under max
    while body_word_count(body2) > max_words and optional_sorted:
        optional_sorted.pop(0)
        body2 = "".join(keep + optional_sorted)

    # Last resort: shorten longest remaining optional paragraph blocks
    guard = 0
    while body_word_count(body2) > max_words and guard < 40:
        guard += 1
        paras = body2.split("\n\n")
        # remove longest non-heading paragraph that is not FAQ/Next content
        candidates = []
        for i, p in enumerate(paras):
            if p.startswith("#"):
                continue
            if "frequently asked" in p.lower() or p.startswith("### "):
                continue
            candidates.append((len(p.split()), i))
        if not candidates:
            break
        candidates.sort(reverse=True)
        _, idx = candidates[0]
        paras.pop(idx)
        body2 = "\n\n".join(paras)

    return body2.strip() + "\n"


def process_file(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    m = FM.match(raw)
    if not m:
        return {"file": path.parent.name, "changed": False, "reason": "no_frontmatter"}
    fm = yaml.safe_load(m.group(2)) or {}
    if not isinstance(fm, dict):
        fm = {}
    body = m.group(4)
    original_wc = body_word_count(body)

    title = str(fm.get("seo_title") or path.parent.name)
    keyword = str(fm.get("primary_keyword") or title)
    page_type = str(fm.get("page_type") or "guide")

    body = clean_body(body)
    body = rewrite_commercial_deliverables(body)

    # meta
    old_meta = str(fm.get("meta_description") or "")
    if (
        "shoot-ready system creators can adapt" in old_meta.lower()
        or "practical guide to" in old_meta.lower()
        or len(re.sub(r"\s+", " ", old_meta)) < 110
    ):
        fm["meta_description"] = improve_meta(fm, title, keyword, page_type)

    # structure
    if not re.search(r"^## Quick answer\b", body, re.M | re.I):
        body = ensure_section_after_intro(body, quick_answer_block(keyword, title, page_type), "Quick answer")

    if not re.search(r"^## Next step\b", body, re.M | re.I):
        body = body.rstrip() + "\n\n" + next_step_block(keyword)

    # expand thin (may run twice if first pass still short after clean)
    for _ in range(2):
        wc = body_word_count(body)
        if wc >= 600:
            break
        exp = expansion_for(fm, body, keyword, title, page_type)
        # unique heading per pass to avoid "already exists" skip
        heading = "Practical depth" if "## Practical depth" not in body else "Operator notes"
        if f"## {heading}" in body:
            # append extra unique section
            heading = "Field implementation"
        body = ensure_before_faq_or_end(body, f"## {heading}\n\n" + exp, heading)

    # Final guarantee: if still thin, append a compact checklist
    if body_word_count(body) < 580:
        body = (
            body.rstrip()
            + "\n\n## Closing checklist\n\n"
            + f"1. Restate the audience tension for **{keyword}** in one sentence.\n"
            + "2. Name the proof you can film this week.\n"
            + "3. Lock one opening frame and one CTA.\n"
            + "4. Remove any claim you cannot show.\n"
            + "5. Schedule a review of saves and replies before changing format.\n"
            + "6. Keep a minimum publishing mode for low-energy weeks.\n"
            + "7. Store the winning structure in your content bank for reuse.\n\n"
        )

    # trim only truly long pages
    if body_word_count(body) > 1200:
        body = trim_to_max(body, 1180)

    # dedupe accidental double Quick answer sections (linear, no catastrophic regex)
    while body.count("## Quick answer") > 1:
        first = body.find("## Quick answer")
        second = body.find("## Quick answer", first + 1)
        if second < 0:
            break
        # drop from second heading until next ## or end
        rest = body[second + 2 :]
        nxt = rest.find("\n## ")
        end = second + 2 + nxt if nxt >= 0 else len(body)
        body = body[:second] + body[end:]

    if fm.get("secondary_keywords") is None:
        fm["secondary_keywords"] = []

    new_wc = body_word_count(body)
    fm["word_count"] = new_wc
    fm["last_reviewed"] = "2026-08-05"
    fm["status"] = "publish-ready-editorial-draft"

    fm_yaml = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=100).strip()
    new_raw = f"---\n{fm_yaml}\n---\n\n{body.lstrip()}"
    if new_raw != raw:
        path.write_text(new_raw, encoding="utf-8")
        return {
            "file": path.parent.name,
            "changed": True,
            "wc_before": original_wc,
            "wc_after": new_wc,
        }
    return {"file": path.parent.name, "changed": False, "wc_before": original_wc, "wc_after": new_wc}


def main() -> int:
    results = []
    for folder in sorted(PKG.iterdir()):
        art = folder / "article.md"
        if art.exists():
            results.append(process_file(art))
    changed = [r for r in results if r.get("changed")]
    print(f"processed {len(results)} | changed {len(changed)}")
    for r in changed[:30]:
        print(f"  {r['file']}: {r['wc_before']} → {r['wc_after']}")
    if len(changed) > 30:
        print(f"  ... +{len(changed)-30} more")
    # summary stats
    wcs = [r["wc_after"] for r in results if "wc_after" in r]
    print(f"wc min/avg/max after: {min(wcs)}/{sum(wcs)//len(wcs)}/{max(wcs)}")
    print(f"under 600: {sum(1 for w in wcs if w < 600)} | over 1200: {sum(1 for w in wcs if w > 1200)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
