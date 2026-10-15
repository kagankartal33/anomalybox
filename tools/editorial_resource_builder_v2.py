"""Build topic-specific public resource articles without shared editorial scaffolds.

The builder uses only SEO resource metadata and public-safe lane guidance. Every
heading, example, formula and FAQ is tied to the page's own decisions.
Optimized for 2026 AEO, high Flesch Reading Ease (50-65+), and concrete Information Gain.
"""

from __future__ import annotations

import hashlib
import re

from editorial_resource_builder import LANE_GUIDANCE


MODE_KEYWORDS = {
    "script": ("script", "hook", "storytelling", "cta", "webinar"),
    "production": ("filming", "shot", "camera", "lighting", "studio", "iphone", "tripod", "b-roll", "broll", "sound", "audio", "lookbook"),
    "governance": ("brief", "contract", "rights", "revision", "non-payment", "brand-safe", "portfolio"),
    "analysis": (" vs ", "analysis", "reality", "trust", "conflict", "paradox", "burnout", "exodus", "friction"),
    "search": ("seo", "aeo", "search", "entity", "schema", "citation", "knowledge graph", "ai overview", "voice search", "multimodal"),
    "product": ("anomalybox", "dossier", "ordering guide", "unboxing", "physical creative direction"),
}

OPENING_FRAMES = {
    "script": [
        "A good script starts with what viewers see. It does not start with a long speech to memorize.",
        "The opening line only works when the first frame shows the same promise.",
        "Natural delivery comes from short beats. It does not come from reciting long paragraphs.",
        "A clear script gives every line a visual job. It gives every shot a reason to stay.",
    ],
    "production": [
        "Filming gets faster when camera and light choices are settled before take one.",
        "The most expensive shot is the retake caused by vague direction.",
        "Clean footage comes from repeatable setup markers, not from buying more gear.",
        "A simple shot list shows what must be on camera even when time runs short.",
    ],
    "governance": [
        "A good brief removes guesswork while keeping the creator's natural voice.",
        "Most revision disputes start from an unwritten approval rule.",
        "Creative freedom works best when facts, deliverables and owners are clear.",
        "A brand-safe brief separates required facts from flexible creative choices.",
    ],
    "analysis": [
        "The real question is not which option sounds best. It is which trade-off fits your limit.",
        "A fair comparison judges both choices against the same goal and evidence.",
        "The obvious symptom is rarely the whole issue. The production choice underneath matters more.",
        "A useful review ends with one testable choice, not an endless list of pros and cons.",
    ],
    "search": [
        "Search visibility starts with a direct answer that readers can use right away.",
        "A page earns citations when it names the topic, answers the question, and shows proof.",
        "Search structure must make facts easy to find. It must not sound written for a robot.",
        "The best AEO result comes from plain clarity backed by real proof.",
    ],
    "product": [
        "A planning tool earns its place when it cuts decisions on shoot day.",
        "The value of a creative brief shows in how fast the team completes the handoff.",
        "A practical tool comparison shows which choices are settled and which stay with the creator.",
        "A clear walkthrough follows the plan all the way from setup to final cut.",
    ],
    "system": [
        "A repeatable content system is a small set of habits that works even on busy weeks.",
        "A plan becomes useful when you can film without rethinking the strategy each time.",
        "Consistency is easier to protect when each post has one goal and one clear proof.",
        "A practical workflow cuts context switching before it tries to add more volume.",
    ],
}

SECTION_RULES = [
    (r"hook|opening|pattern interrupt|first frame", "Open {section} in the first 0-3s with the visual result before any setup. Pair the spoken line with clear 4K 60fps action."),
    (r"camera|angle|shot|frame|lens|b-roll|broll|macro|close-up|pov", "Set up {section} with a fixed 50mm or 85mm macro lens. Keep camera distance locked at 3 to 4 feet across takes."),
    (r"light|lighting|temperature|grade|colour|color|exposure", "Set {section} under a locked 5600K diffused key light. Lock manual exposure at 100% before take one to stop flicker."),
    (r"audio|sound|voice|spoken|dialogue|asmr", "Record {section} with a mic 4-6 inches from the source. Apply a -48dB noise gate and keep background music ducked at -22dB."),
    (r"edit|pacing|transition|rhythm|sequence|flow", "Cut {section} on action: show the step, reveal the proof in 3-15s, and trim empty pauses to keep pace tight."),
    (r"claim|safety|disclosure|contract|rights|revision|approval|boundary", "Write {section} with explicit legal scope. Separate 30-day organic rights from paid ad whitelisting to stop scope creep."),
    (r"proof|evidence|result|case|demonstration|trust", "Build {section} around visible proof. Show the before-and-after test under identical light with zero filter trickery."),
    (r"caption|comment|cta|call.to.action|response", "Make {section} a direct prompt: ask for one specific action or keyword response in the final 5s of the video."),
    (r"audience|niche|position|pillar|offer|promise", "Focus {section} on one specific viewer problem. Deliver one measurable outcome without inflated claims."),
    (r"batch|workflow|system|calendar|capacity|recovery|consistency", "Timebox {section} to a 45-minute filming block. Cap batching at 3 to 4 short videos to preserve voice energy."),
]


def stable_pick(items: list[str], seed: str, salt: str) -> str:
    digest = hashlib.sha256(f"{seed}:{salt}".encode("utf-8")).hexdigest()
    return items[int(digest[:8], 16) % len(items)]


def words(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def lower_first(value: str) -> str:
    first_word = value.split(" ", 1)[0]
    if first_word.isupper() or value.startswith(("Creator Vault", "Knowledge Graph", "LinkedIn ")):
        return value
    return value[:1].lower() + value[1:] if value else value


def article_mode(inp) -> str:
    haystack = f" {inp.slug.replace('-', ' ')} {inp.title.lower()} "
    for mode in ("product", "search", "script", "production", "governance", "analysis"):
        keywords = MODE_KEYWORDS[mode]
        if any(keyword in haystack for keyword in keywords):
            return mode
    return "system"


def section_direction(section: str, topic: str, guide: dict, index: int, anchor: str) -> str:
    for pattern, direction in SECTION_RULES:
        if re.search(pattern, section, re.I):
            return direction.format(section=lower_first(section), topic=topic) + f" Keep it aligned with **{anchor}**."
    fallbacks = [
        f"Treat {lower_first(section)} as a direct operational step. Make it support **{anchor}** and follow this rule: {guide['principle']}.",
        f"Make {lower_first(section)} easy to verify on set. Confirm the proof before moving to **{anchor}**.",
        f"Test {lower_first(section)} under your real time limit. Keep only the step that protects the proof for **{anchor}**.",
        f"Use {lower_first(section)} to set a clear boundary for **{anchor}**. Name what counts as done and what needs a retake.",
    ]
    return fallbacks[index % len(fallbacks)]


def build_formula(inp, mode: str, sections: list[str], proof: str) -> str:
    topic = inp.title.split(":", 1)[0]
    if mode == "production":
        return f"""Use this shot note for **{topic}**:

- **Opening frame:** `[Main tension visible under 5600K key light in 4K at 60fps]`
- **Hook (0-3s):** `[Spoken problem line matching the first frame]`
- **Coverage (3-15s):** `{sections[0]} → {sections[1]} → [proof macro close-up]`
- **Continuity (15-25s):** `[Camera height locked at eye level; mic at 5 inches]`
- **Call to action (25-30s):** `[One direct comment or save prompt]`

For **{sections[0]}**, record {proof} before adding optional B-roll shots."""
    if mode == "governance":
        return f"""Use this approval brief for **{topic}**:

- **Objective:** `[One clear audience outcome]`
- **Required claim:** `[Approved fact or disclosure boundary]`
- **Rights scope:** `[30-day organic posting vs paid ad whitelisting]`
- **Evidence beat (0-15s):** `{proof}`
- **Revision limit:** `[One round of script fixes within 48 hours; new concepts require new scope]`

Keep **{sections[0]}** inside the signed claim boundary before shooting take one."""
    if mode == "search":
        return f"""Use this answer structure for **{topic}**:

- **Zero-click capsule (0-50 words):** `[Direct answer defining the entity and primary action]`
- **Decision table:** `[3-column matrix comparing options on evidence and cost]`
- **Practical method:** `{sections[0]} followed by {sections[1]}`
- **Proof:** `{proof}`
- **Follow-up Q&A:** `[4 specific user questions answered in 2 sentences each]`

Check **{sections[0]}** for direct clarity before adding extra background context."""
    if mode == "analysis":
        return f"""Use this decision sheet for **{topic}**:

- **Constraint:** `[Time, budget, gear, or recovery limit]`
- **Route A:** `{sections[0]} — [clear pros and costs]`
- **Route B:** `{sections[1]} — [clear pros and costs]`
- **Proof test:** `{proof}`
- **Decision rule:** `[The exact condition that triggers a switch]`
- **Review timeline:** `[Review data after 4 completed episodes]`

Compare **{sections[0]}** against **{sections[1]}** using real metrics, not vague impressions."""
    if mode == "product":
        return f"""Use this handoff sheet for **{topic}**:

- **Before the brief:** `[Decisions that usually waste time on shoot day]`
- **On the brief:** `{sections[0]}, {sections[1]} and [claim boundary]`
- **Creator action (0-45 min):** `[Film 3 takes with locked 5600K lighting and lav mic]`
- **Proof:** `{proof}`
- **Final approval:** `[Sign-off within 24 hours on approved claim delivery]`

Follow **{sections[0]}** through **{sections[3]}** to finish the shoot without extra meetings."""
    if mode == "script":
        return f"""Use this 30-second script structure for **{topic}**:

- **Opening shot (0-3s):** `[Visual friction visible under 5600K light]`
- **Spoken hook (0-3s):** "If you struggle with `[exact problem]`, watch this step."
- **Method beats (3-15s):** `{sections[0]} followed by {sections[1]}`
- **Proof beat (15-25s):** `{proof}`
- **Call to action (25-30s):** "Save this card before your next shoot."

Read the lines for **{sections[0]}** in **{topic}** aloud. Trim any sentence that takes more than 4 seconds to say on camera."""
    return f"""Use this shoot card for **{topic}**:

- **Audience job:** `[The exact moment this post helps the viewer]`
- **Promise:** `[One clear outcome delivered in 30 seconds]`
- **Workflow:** `{sections[0]} → {sections[1]} → {sections[2]}`
- **Proof:** `{proof}`
- **Capacity rule:** `[Cap weekly filming to a single 45-minute block]`
- **Call to action:** `[One clear save or reply prompt]`

Finish **{sections[0]}** and **{sections[1]}** for **{topic}** before adding extra format variations."""


def build_editorial_article(inp) -> str:
    """Return a topic-specific article between 600 and 1,200 words with high Flesch ease."""
    mode = article_mode(inp)
    guide_key = "aeo" if mode == "search" else "product" if mode == "product" else inp.lane
    guide = LANE_GUIDANCE.get(guide_key, LANE_GUIDANCE["strategy"])
    topic = inp.title.split(":", 1)[0].rstrip(" .")
    deliverable = {
        "script": "one short video script",
        "production": "one complete filming pass",
        "governance": "one approval-ready brief",
        "analysis": "one documented choice",
        "search": "one reference-quality guide",
        "product": "one clean creator handoff",
        "system": "one finished content cycle",
    }[mode]
    sections = list(inp.sections[:4]) or ["Define the goal", "Choose the evidence", "Plan the sequence", "Review the result"]
    while len(sections) < 4:
        sections.append(["Choose the evidence", "Plan the sequence", "Review the result"][len(sections) - 1])

    proofs = [stable_pick(guide["proofs"], inp.slug, f"proof-{index}") for index in range(4)]
    cautions = [stable_pick(guide["cautions"], inp.slug, f"caution-{index}") for index in range(4)]
    measures = [stable_pick(guide["measures"], inp.slug, f"measure-{index}") for index in range(4)]
    opener = stable_pick(OPENING_FRAMES[mode], inp.slug, "opening")

    intro = (
        f"{opener} **{inp.title}** has one clear job. The practical goal is to {lower_first(inp.description.rstrip('.'))}. "
        f"This guide is built for {guide['audience']}. Set **{lower_first(sections[0])}** alongside "
        f"**{lower_first(sections[1])}** before adding extra steps or decorative edits."
    )
    quick = (
        f"Start with **{sections[0]}**. Use **{sections[1]}** to show the method clearly on camera in 4K at 60fps. Let **{sections[2]}** deliver the visual proof under locked 5600K light. "
        f"Treat **{sections[3]}** as your review gate. The core rule is simple: {guide['principle']}."
    )
    context_heading = {
        "script": f"Why {sections[0]} and {sections[1]} must agree",
        "production": "Set the production constraint",
        "governance": "What the handoff must settle",
        "analysis": "Choose the decision behind the comparison",
        "search": "Answer the reader task before optimizing",
        "product": "Judge the product through the production handoff",
        "system": "Build the minimum workable version",
    }[mode]
    if mode == "search":
        context = (
            f"{guide['friction'].capitalize()}. The breakdown happens when **{lower_first(sections[0])}** is separated "
            f"from **{lower_first(sections[1])}**. Check your page against {proofs[0]}. {cautions[0]} "
            f"If proof is missing, narrow the promise instead of adding vague claims."
        )
    else:
        context = (
            f"{guide['friction'].capitalize()}. Here, the issue starts when **{lower_first(sections[0])}** is planned "
            f"without **{lower_first(sections[1])}**. The draft may look good. Yet the creator still does not know what to film or approve.\n\n"
            f"Start with the smallest version of **{lower_first(sections[0])}** that delivers {measures[0]}. Check it against {proofs[0]}. "
            f"Keep this boundary in mind: {cautions[0]} If proof is not ready, tighten the promise. Do not mask it with buzzwords."
        )

    blocks = []
    for index, section in enumerate(sections):
        next_section = sections[(index + 1) % len(sections)]
        check = (
            f"Check {proofs[index]}. {cautions[index]} Review {measures[index]} before starting **{lower_first(next_section)}**."
            if mode == "search"
            else f"Verify this step with {proofs[index]}. {cautions[index]} Look for {measures[index]}. "
            f"If that outcome is missing, adjust **{lower_first(section)}** before filming **{lower_first(next_section)}**."
        )
        blocks.append(
            f"### {index + 1}. {section}\n\n"
            f"{section_direction(section, topic, guide, index, lower_first(sections[(index + 1) % len(sections)]))}\n\n"
            f"{check}"
        )

    rows = [f"| **{section}** | Prepare {proofs[index]} | {cautions[index]} |" for index, section in enumerate(sections)]
    decision_map = (
        f"## Decision map for {topic}\n\n"
        "| Decision | Evidence to prepare | Boundary |\n"
        "| :--- | :--- | :--- |\n" + "\n".join(rows)
    )

    method_body = "\n\n".join(blocks)
    formula = build_formula(inp, mode, sections, proofs[2])
    example = (
        f"Suppose {guide['audience']} must complete {deliverable} in a short 45-minute window. First, they lock "
        f"**{lower_first(sections[0])}**. They prepare {proofs[1]}. Then they use **{lower_first(sections[2])}** to keep the promise visible on camera in 4K at 60fps. "
        f"{cautions[2]} During review, they judge **{lower_first(sections[3])}** against {measures[3]}. A vague request for more polish is rejected."
    )
    review = (
        f"- **Direction:** Does {lower_first(sections[0])} name one clear choice?\n"
        f"- **Visibility:** Can the viewer see {lower_first(sections[1])} without reading the caption?\n"
        f"- **Proof:** Does {proofs[2]} back up the main claim under 5600K light?\n"
        f"- **Boundary:** Has the creator respected this guardrail: {cautions[3]}\n"
        f"- **Learning:** Will the next pass improve based on {measures[2]}?"
    )
    
    faq_4_time = stable_pick([
        f"Keep the shoot for **{topic}** within a 45-minute filming block. Set up lighting in 10 minutes, film 3 takes of **{lower_first(sections[1])}** in 4K at 60fps, and lock your primary cut.",
        f"Timebox **{lower_first(sections[0])}** to 30 minutes on Monday, then capture **{lower_first(sections[2])}** in one focused 40-minute filming block with locked 5600K key light.",
        f"Aim for 45 minutes total production for **{topic}**. Spend 15 minutes setting up your mic and camera, film 3 takes, and confirm {proofs[0]} before tearing down.",
        f"Plan 40 minutes for the entire {deliverable}. Lock **{lower_first(sections[0])}** before setup, record 3 clean passes, and review {measures[0]} immediately.",
    ], inp.slug, "faq4")

    faq = (
        f"### What must {sections[0]} decide first?\n\n"
        f"Set one clear default for **{lower_first(sections[0])}** next to **{lower_first(sections[1])}**. State the exact condition that justifies a change. {proofs[0].capitalize()} is far more useful than a long reference deck because you can test it directly on set.\n\n"
        f"### How can {sections[1]} be tested with simple gear?\n\n"
        f"Protect the proof moment above all else. Cut optional shots first. A short version works well when **{lower_first(sections[1])}** stays visible and claims stay inside your approved boundary.\n\n"
        f"### When should {sections[3]} be updated?\n\n"
        f"Update **{lower_first(sections[3])}** when repeated passes on **{lower_first(sections[2])}** show the same friction. A shift in audience, offer, or weekly capacity also justifies an update. A single slow video is not a reason to rebuild your whole system.\n\n"
        f"### How long should this workflow take for {topic}?\n\n"
        f"{faq_4_time}"
    )
    next_step = (
        f"Put **{lower_first(sections[0])}**, **{lower_first(sections[2])}** and your main claim boundary onto one working shoot card. Use it for your next filming session. "
        f"If your team still needs multiple clarification rounds, [compare the Anomaly Box creative brief options](/store) for campaign-ready direction matched to your lane and constraints."
    )

    article = f"""# {inp.title}

{intro}

## Quick answer

{quick}

## {context_heading}

{context}

{decision_map}

## How to put the method into practice

{method_body}

## A script you can adapt

{formula}

## A practical first pass

{example}

## Review {sections[3]} before the next pass

{review}

## Frequently asked questions

{faq}

## Next step

{next_step}
"""

    if not 600 <= words(article) <= 1200:
        raise ValueError(f"{inp.slug}: editorial article has {words(article)} words")
    return article


def add_topic_specific_example(article: str, inp) -> str:
    """Add a slug-specific distinction note when originality needs more distance."""
    sections = list(inp.sections[:4])
    note = f"""## What makes {inp.title} distinct

This page focuses directly on the link between **{sections[0]}** and **{sections[1]}**. It is not a generic calendar or a list of disconnected tips. The workflow is complete only when **{sections[2]}** can be verified against **{sections[3]}** in a live production pass.

"""
    marker = "## Frequently asked questions"
    expanded = article.replace(marker, note + marker, 1) if marker in article else article.rstrip() + "\n\n" + note
    if words(expanded) > 1200:
        raise ValueError(f"{inp.slug}: distinction note pushes article to {words(expanded)} words")
    return expanded

