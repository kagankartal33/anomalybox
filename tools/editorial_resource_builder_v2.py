"""Build topic-specific public resource articles without shared editorial scaffolds.

The builder uses only SEO resource metadata and public-safe lane guidance. Every
heading, example, formula and FAQ is tied to the page's own decisions.
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
        "A usable script begins with the image the viewer sees, not with a paragraph the creator must recite.",
        "The opening line only works when the first frame makes the same promise.",
        "Natural delivery comes from clear beats, not from memorising a dense block of copy.",
        "A strong script gives every spoken line a visual job and every visual a reason to stay.",
    ],
    "production": [
        "Production gets faster when camera, light and coverage decisions are settled before the first take.",
        "The most expensive shot is often the one recreated because its purpose was unclear.",
        "Reliable footage comes from repeatable positions and priorities, not from adding more equipment.",
        "A short shot plan should show what must be visible even when time runs short.",
    ],
    "governance": [
        "A useful brief removes avoidable interpretation while preserving the creator's natural delivery.",
        "Most revision disputes begin with an approval decision that was never written down.",
        "Creative freedom works best when claims, deliverables and decision owners are explicit.",
        "A brand-safe handoff separates non-negotiable facts from flexible execution choices.",
    ],
    "analysis": [
        "The useful question is not which option sounds better, but which trade-off fits the real constraint.",
        "A comparison works only when both choices are judged against the same job and evidence.",
        "The visible symptom is rarely the whole problem; the production decision underneath it matters more.",
        "A practical analysis should end with a choice the reader can test, not a balanced list with no conclusion.",
    ],
    "search": [
        "Search visibility starts with a complete answer that a reader can verify without decoding SEO language.",
        "A page becomes citeable when it names the entity, answers the question and shows where the evidence came from.",
        "Search structure should make useful information easier to find, not make the copy sound written for a crawler.",
        "The best answer-engine work is ordinary editorial clarity supported by specific evidence.",
    ],
    "product": [
        "A planning product earns its place when it removes decisions from shoot day instead of adding another dashboard.",
        "The value of a creative dossier is easiest to judge through the handoff it improves.",
        "A product comparison should show which production decisions arrive resolved and which remain with the creator.",
        "A useful walkthrough follows the artifact from configuration to camera, not only through its packaging.",
    ],
    "system": [
        "A repeatable content system is a small set of defaults that still works on a constrained week.",
        "The plan becomes useful when the creator can act without reopening every strategic decision.",
        "Consistency is easier to protect when each piece has one audience job and one visible form of proof.",
        "A practical workflow reduces context switching before it tries to increase output.",
    ],
}

SECTION_RULES = [
    (r"hook|opening|pattern interrupt|first frame", "Open {section} with the result, tension or visual change the audience can understand before any setup. In {topic}, the spoken line and first frame should make one promise together."),
    (r"camera|angle|shot|frame|lens|b-roll|broll|macro|close-up|pov", "Translate {section} into a finite coverage list: one orientation shot, one action shot and one proof detail. Keep camera distance measurable so footage for {topic} can be compared across takes."),
    (r"light|lighting|temperature|grade|colour|color|exposure", "Give {section} a repeatable light direction, white-balance choice and exposure reference. Record those settings before filming {topic}; a preset cannot repair inconsistent source light."),
    (r"audio|sound|voice|spoken|dialogue|asmr", "Define what {section} must communicate and where the microphone will capture it. Record a clean version before music so {topic} remains understandable with or without the soundtrack."),
    (r"edit|pacing|transition|rhythm|sequence|flow", "Build {section} around comprehension: establish, demonstrate, confirm, then move on. For {topic}, cut decorative beats before cutting the moment that proves the point."),
    (r"claim|safety|disclosure|contract|rights|revision|approval|boundary", "Write {section} as a boundary another person can approve without interpretation. Separate required facts from creative preference, and do not let {topic} imply a result the evidence cannot support."),
    (r"proof|evidence|result|case|demonstration|trust", "Choose {section} before writing the strongest claim. The proof used in {topic} should show the mechanism or decision under real conditions, with enough context to understand its limit."),
    (r"caption|comment|cta|call.to.action|response", "Make {section} the natural continuation of the value already delivered. A CTA for {topic} should ask for one relevant action rather than switching to a broader promise at the end."),
    (r"audience|niche|position|pillar|offer|promise", "Narrow {section} to one audience situation and one useful change. That constraint gives {topic} a recognisable point of view without inflated positioning language."),
    (r"batch|workflow|system|calendar|capacity|recovery|consistency", "Set {section} against the creator's actual weekly capacity. The version used in {topic} should survive a low-energy week before it expands into a larger routine."),
]


def stable_pick(items: list[str], seed: str, salt: str) -> str:
    digest = hashlib.sha256(f"{seed}:{salt}".encode("utf-8")).hexdigest()
    return items[int(digest[:8], 16) % len(items)]


def words(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def lower_first(value: str) -> str:
    return value[:1].lower() + value[1:] if value else value


def article_mode(inp) -> str:
    haystack = f" {inp.slug.replace('-', ' ')} {inp.title.lower()} "
    for mode, keywords in MODE_KEYWORDS.items():
        if any(keyword in haystack for keyword in keywords):
            return mode
    return "system"


def section_direction(section: str, topic: str, guide: dict) -> str:
    for pattern, direction in SECTION_RULES:
        if re.search(pattern, section, re.I):
            return direction.format(section=lower_first(section), topic=topic)
    return (
        f"Define {lower_first(section)} as an observable choice inside {topic}. "
        f"Use this rule: {guide['principle']}. Remove any instruction that cannot be checked in the finished work."
    )


def build_formula(inp, mode: str, sections: list[str], proof: str) -> str:
    topic = inp.title.split(":", 1)[0]
    if mode == "production":
        return f"""Use this shot note for **{topic}**:

- **Opening frame:** `[the result or tension already visible]`
- **Coverage:** `{sections[0]} → {sections[1]} → [proof close-up]`
- **Continuity:** `[camera height, light direction and object position]`
- **Spoken or on-screen line:** `[one sentence the footage can support]`
- **Backup route:** `[three shots that preserve the same proof]`

The proof frame should be {proof}. Record it before optional transitions or atmosphere shots."""
    if mode == "governance":
        return f"""Use this approval language for **{topic}**:

- **Objective:** `[one audience action or understanding]`
- **Required truth:** `[approved fact, disclosure or product detail]`
- **Flexible execution:** `[where the creator may use their own words or framing]`
- **Evidence:** `{proof}`
- **Revision boundary:** `[correction versus new scope]`
- **Final approver:** `[one named role]`

Read the brief once as the creator and once as the approver. A sentence with two reasonable interpretations still needs a decision."""
    if mode == "search":
        return f"""Draft the answer block for **{topic}** in this order:

1. **Direct answer:** `[answer the query in two plain sentences]`
2. **Entity and context:** `[name who, what and where the advice applies]`
3. **Evidence:** `{proof}`
4. **Boundary:** `[state what the evidence does not establish]`
5. **Next useful question:** `[link to the reader's next decision]`

If the answer depends on repeating the keyword in every line, rewrite it for the reader before publishing."""
    if mode == "analysis":
        return f"""Turn **{topic}** into a decision note:

- **Current constraint:** `[time, budget, access, trust or recovery limit]`
- **Option A:** `{sections[0]} — [benefit and cost]`
- **Option B:** `{sections[1]} — [benefit and cost]`
- **Evidence:** `{proof}`
- **Decision rule:** `[the condition that changes the choice]`
- **Review date:** `[when comparable evidence will exist]`

Choose a route for the stated constraint. Do not pretend one route is universally superior."""
    if mode == "product":
        return f"""Use this handoff test for **{topic}**:

- **Before the artifact:** `[decision that usually lives in chat or notes]`
- **On the artifact:** `{sections[0]}, {sections[1]} and [claim boundary]`
- **Creator action:** `[what can be filmed without another clarification]`
- **Proof:** `{proof}`
- **Remaining choice:** `[what still belongs to the creator]`

The walkthrough is complete when the viewer can see how the artifact changes a production decision."""
    if mode == "script":
        return f"""Build the spoken and visual beats for **{topic}** together:

- **First image:** `[specific friction already visible]`
- **Opening line:** `[plain-language tension that matches the image]`
- **Method beat:** `{sections[0]} followed by {sections[1]}`
- **Proof beat:** `{proof}`
- **Payoff:** `[what the viewer now understands or can do]`
- **Response prompt:** `[one relevant save, reply or next step]`

Read the lines aloud. Shorten any sentence that forces the creator to rush past the proof."""
    return f"""Write one working card for **{topic}**:

- **Audience situation:** `[the moment this becomes useful]`
- **Working promise:** `[one change the content can honestly deliver]`
- **Method:** `{sections[0]} → {sections[1]} → {sections[2]}`
- **Proof:** `{proof}`
- **Capacity limit:** `[what must be removed on a constrained week]`
- **Next action:** `[one relevant response, save or production step]`

Keep the card narrow enough to finish once before turning it into a recurring format."""


def build_editorial_article(inp) -> str:
    """Return a topic-specific article between 600 and 1,200 words."""
    guide = LANE_GUIDANCE.get(inp.lane, LANE_GUIDANCE["strategy"])
    mode = article_mode(inp)
    topic = inp.title.split(":", 1)[0].rstrip(" .")
    sections = list(inp.sections[:4]) or ["Define the goal", "Choose the evidence", "Plan the sequence", "Review the result"]
    while len(sections) < 4:
        sections.append(["Choose the evidence", "Plan the sequence", "Review the result"][len(sections) - 1])

    proofs = [stable_pick(guide["proofs"], inp.slug, f"proof-{index}") for index in range(4)]
    cautions = [stable_pick(guide["cautions"], inp.slug, f"caution-{index}") for index in range(4)]
    measures = [stable_pick(guide["measures"], inp.slug, f"measure-{index}") for index in range(4)]
    opener = stable_pick(OPENING_FRAMES[mode], inp.slug, "opening")

    intro = (
        f"{opener} **{inp.title}** focuses on a specific job: {lower_first(inp.description.rstrip('.'))}. "
        f"For {guide['audience']}, the useful version connects **{lower_first(sections[0])}** to "
        f"**{lower_first(sections[1])}** before extra formats or visual polish are added."
    )
    quick = (
        f"Use **{sections[0]}** to establish direction, **{sections[1]}** to make the method visible, and "
        f"**{sections[2]}** to carry proof through the finished piece. Treat **{sections[3]}** as the boundary or review point. "
        f"For {topic}, the governing rule is to {guide['principle']}."
    )
    context_heading = {
        "script": f"Why {sections[0]} and {sections[1]} must agree",
        "production": f"Set the production constraint for {topic}",
        "governance": f"What the {topic} handoff must settle",
        "analysis": f"Choose the decision behind {topic}",
        "search": f"Answer the reader task before optimising {topic}",
        "product": f"Judge {topic} through the production handoff",
        "system": f"Build the minimum workable version of {topic}",
    }[mode]
    context = (
        f"{guide['friction'].capitalize()}. In {topic}, that friction appears when **{lower_first(sections[0])}** is decided "
        f"separately from **{lower_first(sections[1])}**. The result may look complete while leaving the creator unsure what to film, say or approve.\
        f"Start with the smallest version that can produce {measures[0]}. Use {proofs[0]} as the evidence check and keep this boundary visible: "
        f"{cautions[0]} If that proof is unavailable, narrow the promise instead of replacing it with stronger language."
    )

    blocks = []
    for index, section in enumerate(sections):
        next_section = sections[(index + 1) % len(sections)]
        blocks.append(
            f"## {section}: the decision to make\
            f"{section_direction(section, topic, guide)}\
            f"Verify this choice with {proofs[index]}. {cautions[index]} "
            f"A useful result is {measures[index]}; if that result cannot be observed, revise **{lower_first(section)}** before moving to **{lower_first(next_section)}**."
        )

    if mode in {"governance", "analysis", "product", "search"}:
        rows = [f"| **{section}** | {proofs[index]} | {cautions[index]} |" for index, section in enumerate(sections)]
        decision_map = (
            f"## Decision map for {topic}\
            "| Decision | Evidence to prepare | Boundary |\
            "| :--- | :--- | :--- |\
        )
    else:
        decision_map = f"""## Working sequence for {topic}

1. Lock **{sections[0]}** and record the condition that would change it.
2. Prepare {proofs[1]} for **{lower_first(sections[1])}**.
3. Complete **{sections[2]}** before adding optional coverage.
4. Use **{sections[3]}** to decide what stays, changes or stops.
5. Record whether the pass produced {measures[2]}."""

    formula = build_formula(inp, mode, sections, proofs[2])
    example = (
        f"Suppose {guide['audience']} must finish **{topic}** within a short production window. They lock "
        f"**{lower_first(sections[0])}**, prepare {proofs[1]}, and use **{lower_first(sections[2])}** to keep the promise visible. "
        f"{cautions[2]} During review, **{lower_first(sections[3])}** is judged against {measures[3]}, not against a vague request to make the work feel more polished."
    )
    review = (
        f"- **Direction:** Does {lower_first(sections[0])} name one clear choice?\
        f"- **Visibility:** Can the audience see {lower_first(sections[1])} without relying on the caption?\
        f"- **Proof:** Does {proofs[2]} support the strongest statement in {topic}?\
        f"- **Boundary:** Has the team followed this guardrail: {cautions[3]}\
        f"- **Learning:** Will the next pass change one variable based on {measures[2]}?"
    )
    faq = (
        f"### What must {sections[0]} decide in {topic}?\
        f"It should settle the default direction and the condition that would justify changing it. For this topic, {proofs[0]} is more useful than a long reference list because it can be checked in the work.\
        f"### How can {sections[1]} be tested with limited time or equipment?\
        f"Protect the proof moment and reduce optional scenes first. A smaller version of {topic} remains useful when **{lower_first(sections[1])}** stays visible and the claim remains inside the approved boundary.\
        f"### When should {sections[3]} be revised?\
        f"Revise it after comparable work shows a repeated problem, or when the audience, offer, access or production constraint changes. One isolated performance spike is not enough reason to rebuild the method."
    )
    next_step = (
        f"Put **{lower_first(sections[0])}**, **{lower_first(sections[2])}** and the main boundary onto one working card for the next production. "
        f"If those decisions still require several clarification rounds, [compare the Anomaly Box dossier options](/store) for a campaign-ready brief matched to the creator's lane and constraints."
    )

    article = f"""# {inp.title}

{intro}

## Quick answer

{quick}

## {context_heading}

{context}

{decision_map}

{"\

## A working formula for {topic}

{formula}

## Worked example: {sections[0]} under a real constraint

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

This page is specifically about the relationship between **{sections[0]}** and **{sections[1]}**. It is not a substitute for a general calendar, contract or list of unrelated hooks. The method is complete only when **{sections[2]}** can be checked against **{sections[3]}** in a real production pass.

"""
    marker = "## Frequently asked questions"
    expanded = article.replace(marker, note + marker, 1) if marker in article else article.rstrip() + "\
    if words(expanded) > 1200:
        raise ValueError(f"{inp.slug}: distinction note pushes article to {words(expanded)} words")
    return expanded