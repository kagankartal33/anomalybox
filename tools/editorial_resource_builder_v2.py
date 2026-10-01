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
        "The value of a creative brief is easiest to judge through the handoff it improves.",
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
    (r"hook|opening|pattern interrupt|first frame", "Open {section} with the result, tension or visual change the audience can understand before any setup. The spoken line and first frame should make one promise together."),
    (r"camera|angle|shot|frame|lens|b-roll|broll|macro|close-up|pov", "Translate {section} into a finite coverage list: one orientation shot, one action shot and one proof detail. Keep camera distance measurable so footage can be compared across takes."),
    (r"light|lighting|temperature|grade|colour|color|exposure", "Give {section} a repeatable light direction, white-balance choice and exposure reference. Record those settings before filming; a preset cannot repair inconsistent source light."),
    (r"audio|sound|voice|spoken|dialogue|asmr", "Define what {section} must communicate and where the microphone will capture it. Record a clean version before music so the point remains clear with or without the soundtrack."),
    (r"edit|pacing|transition|rhythm|sequence|flow", "Build {section} around comprehension: establish, demonstrate, confirm, then move on. Cut decorative beats before cutting the moment that proves the point."),
    (r"claim|safety|disclosure|contract|rights|revision|approval|boundary", "Write {section} as a boundary another person can approve without interpretation. Separate required facts from creative preference, and never imply a result the evidence cannot support."),
    (r"proof|evidence|result|case|demonstration|trust", "Choose {section} before writing the strongest claim. The evidence should show the mechanism or decision under real conditions, with enough context to understand its limit."),
    (r"caption|comment|cta|call.to.action|response", "Make {section} the natural continuation of the value already delivered. Ask for one relevant action rather than switching to a broader promise at the end."),
    (r"audience|niche|position|pillar|offer|promise", "Narrow {section} to one audience situation and one useful change. That constraint creates a recognisable point of view without inflated positioning language."),
    (r"batch|workflow|system|calendar|capacity|recovery|consistency", "Set {section} against the creator's actual weekly capacity. The chosen version should survive a low-energy week before it expands into a larger routine."),
]


def stable_pick(items: list[str], seed: str, salt: str) -> str:
    digest = hashlib.sha256(f"{seed}:{salt}".encode("utf-8")).hexdigest()
    return items[int(digest[:8], 16) % len(items)]


def words(text: str) -> int:
    return len(re.findall(r"\\\\b[\\\\w'-]+\\\\b", text))


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
            return direction.format(section=lower_first(section), topic=topic) + f" Keep it consistent with **{anchor}**."
    fallbacks = [
        f"Write {lower_first(section)} as one choice the creator can act on without another meeting. It should support {anchor} and this rule: {guide['principle']}.",
        f"Make {lower_first(section)} observable. If a reader or teammate cannot verify it, decide what evidence must appear before moving to **{anchor}**.",
        f"Test {lower_first(section)} under the real production constraint before adding variations. Keep only the version that preserves the promise and the proof needed for **{anchor}**.",
        f"Use {lower_first(section)} to set the review boundary before **{anchor}**. Name what counts as complete, what needs correction and what would become a different piece of work.",
    ]
    return fallbacks[index % len(fallbacks)]


def build_formula(inp, mode: str, sections: list[str], proof: str) -> str:
    topic = inp.title.split(":", 1)[0]
    if mode == "production":
        return f"""Use this shot note for **{topic}**:

- **Opening frame:** `[the result or tension already visible]`
- **Coverage:** `{sections[0]} → {sections[1]} → [proof close-up]`
- **Continuity:** `[camera height, light direction and object position]`
- **Spoken or on-screen line:** `[one sentence the footage can support]`
- **Backup route:** `[three shots that preserve the same proof]`

For **{sections[0]}**, the proof frame should be {proof}. Record it before optional transitions or atmosphere shots."""
    if mode == "governance":
        return f"""Use this approval language for **{topic}**:

- **Objective:** `[one audience action or understanding]`
- **Required truth:** `[approved fact, disclosure or product detail]`
- **Flexible execution:** `[where the creator may use their own words or framing]`
- **Evidence:** `{proof}`
- **Revision boundary:** `[correction versus new scope]`
- **Final approver:** `[one named role]`

Read the **{sections[0]}** brief once as the creator and once as the approver. A sentence with two reasonable interpretations still needs a decision."""
    if mode == "search":
        return f"""Draft the answer block for **{topic}** in this order:

1. **Direct answer:** `[answer the query in two plain sentences]`
2. **Entity and context:** `[name who, what and where the advice applies]`
3. **Evidence:** `{proof}`
4. **Boundary:** `[state what the evidence does not establish]`
5. **Next useful question:** `[link to the reader's next decision]`

If the answer about **{sections[0]}** depends on repeating the keyword in every line, rewrite it for the reader before publishing."""
    if mode == "analysis":
        return f"""Turn **{topic}** into a decision note:

- **Current constraint:** `[time, budget, access, trust or recovery limit]`
- **Option A:** `{sections[0]} — [benefit and cost]`
- **Option B:** `{sections[1]} — [benefit and cost]`
- **Evidence:** `{proof}`
- **Decision rule:** `[the condition that changes the choice]`
- **Review date:** `[when comparable evidence will exist]`

When comparing **{sections[0]}** with **{sections[1]}**, choose a route for the stated constraint. Do not pretend one route is universally superior."""
    if mode == "product":
        return f"""Use this handoff test for **{topic}**:

- **Before the artifact:** `[decision that usually lives in chat or notes]`
- **On the artifact:** `{sections[0]}, {sections[1]} and [claim boundary]`
- **Creator action:** `[what can be filmed without another clarification]`
- **Proof:** `{proof}`
- **Remaining choice:** `[what still belongs to the creator]`

The walkthrough from **{sections[0]}** to **{sections[3]}** is complete when the viewer can see how the artifact changes a production decision."""
    if mode == "script":
        return f"""Build the spoken and visual beats for **{topic}** together:

- **First image:** `[specific friction already visible]`
- **Opening line:** `[plain-language tension that matches the image]`
- **Method beat:** `{sections[0]} followed by {sections[1]}`
- **Proof beat:** `{proof}`
- **Payoff:** `[what the viewer now understands or can do]`
- **Response prompt:** `[one relevant save, reply or next step]`

Read the lines for **{sections[0]}** and **{sections[1]}** aloud. Shorten any sentence that forces the creator to rush past the proof."""
    return f"""Write one working card for **{topic}**:

- **Audience situation:** `[the moment this becomes useful]`
- **Working promise:** `[one change the content can honestly deliver]`
- **Method:** `{sections[0]} → {sections[1]} → {sections[2]}`
- **Proof:** `{proof}`
- **Capacity limit:** `[what must be removed on a constrained week]`
- **Next action:** `[one relevant response, save or production step]`

Keep the card for **{sections[0]}** and **{sections[1]}** narrow enough to finish once before turning it into a recurring format."""


def build_editorial_article(inp) -> str:
    """Return a topic-specific article between 600 and 1,200 words."""
    mode = article_mode(inp)
    guide_key = "aeo" if mode == "search" else "product" if mode == "product" else inp.lane
    guide = LANE_GUIDANCE.get(guide_key, LANE_GUIDANCE["strategy"])
    topic = inp.title.split(":", 1)[0].rstrip(" .")
    deliverable = {
        "script": "one short-form script",
        "production": "one complete shoot",
        "governance": "one approval-ready brief",
        "analysis": "one documented decision",
        "search": "one reference-quality page",
        "product": "one creator handoff",
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
        f"This guide is for {guide['audience']}. Connect **{lower_first(sections[0])}** to "
        f"**{lower_first(sections[1])}** before adding extra formats or visual polish."
    )
    quick = (
        f"Start with **{sections[0]}**. Use **{sections[1]}** to make the method visible. Let **{sections[2]}** carry the proof. "
        f"Treat **{sections[3]}** as the final boundary or review point. The governing rule is to {guide['principle']}."
    )
    context_heading = {
        "script": f"Why {sections[0]} and {sections[1]} must agree",
        "production": "Set the production constraint",
        "governance": "What the handoff must settle",
        "analysis": "Choose the decision behind the comparison",
        "search": "Answer the reader task before optimising",
        "product": "Judge the product through the production handoff",
        "system": "Build the minimum workable version",
    }[mode]
    if mode == "search":
        context = (
            f"{guide['friction'].capitalize()}. The problem appears here when **{lower_first(sections[0])}** is separated "
            f"from **{lower_first(sections[1])}**. Check the page against {proofs[0]}. {cautions[0]} "
            f"No proof available? Narrow the answer instead of strengthening the language."
        )
    else:
        context = (
            f"{guide['friction'].capitalize()}. Here, the problem starts when **{lower_first(sections[0])}** is decided "
            f"apart from **{lower_first(sections[1])}**. The result may look complete. The creator is still unsure what to film, say or approve.
            f"Start with the smallest version of **{lower_first(sections[0])}** that can produce {measures[0]}. Check it against {proofs[0]}. "
            f"Keep this boundary visible: {cautions[0]} If the proof is unavailable, narrow the promise. Do not replace it with stronger language."
        )

    blocks = []
    for index, section in enumerate(sections):
        next_section = sections[(index + 1) % len(sections)]
        check = (
            f"Check {proofs[index]}. {cautions[index]} Review {measures[index]} before moving to **{lower_first(next_section)}**."
            if mode == "search"
            else f"Verify this choice with {proofs[index]}. {cautions[index]} Look for {measures[index]}. "
            f"If that result is not visible, revise **{lower_first(section)}** before moving to **{lower_first(next_section)}**."
        )
        blocks.append(
            f"## {section}: the decision to make
            f"{section_direction(section, topic, guide, index, lower_first(sections[(index + 1) % len(sections)]))}
            f"{check}"
        )

    if mode in {"governance", "analysis", "product", "search"}:
        rows = [f"| **{section}** | {proofs[index]} | {cautions[index]} |" for index, section in enumerate(sections)]
        decision_map = (
            f"## Decision map: {sections[0]} to {sections[3]}
            "| Decision | Evidence to prepare | Boundary |
            "| :--- | :--- | :--- |
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
        f"Suppose {guide['audience']} must finish {deliverable} in a short production window. First, they lock "
        f"**{lower_first(sections[0])}**. They prepare {proofs[1]}. Then they use **{lower_first(sections[2])}** to keep the promise visible. "
        f"{cautions[2]} During review, they judge **{lower_first(sections[3])}** against {measures[3]}. A vague request for more polish is not enough."
    )
    review = (
        f"- **Direction:** Does {lower_first(sections[0])} name one clear choice?
        f"- **Visibility:** Can the audience see {lower_first(sections[1])} without relying on the caption?
        f"- **Proof:** Does {proofs[2]} support the strongest statement in this piece?
        f"- **Boundary:** Has the team followed this guardrail: {cautions[3]}
        f"- **Learning:** Will the next pass change one variable based on {measures[2]}?"
    )
    faq = (
        f"### What must {sections[0]} decide here?
        f"Set one default for **{lower_first(sections[0])}** alongside **{lower_first(sections[1])}**. Also name the condition that would justify a change. {proofs[0].capitalize()} is more useful than a long reference list because the team can check it in the work.
        f"### How can {sections[1]} be tested with limited time or equipment?
        f"Protect the proof moment. Reduce optional scenes first. A smaller version remains useful when **{lower_first(sections[1])}** stays visible and the claim remains inside the approved boundary.
        f"### When should {sections[3]} be revised?
        f"Revise **{lower_first(sections[3])}** when comparable work on **{lower_first(sections[2])}** shows a repeated problem. A change in audience, offer, access or capacity can also justify a revision. One isolated performance spike is not enough reason to rebuild the method."
    )
    next_step = (
        f"Put **{lower_first(sections[0])}**, **{lower_first(sections[2])}** and the main claim boundary onto one working card. Use it for the next production. "
        f"If the team still needs several clarification rounds, [compare the Anomaly Box creative brief options](/store) for campaign-ready direction matched to the creator's lane and constraints."
    )

    article = f"""# {inp.title}

{intro}

## Quick answer

{quick}

## {context_heading}

{context}

{decision_map}

{"

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
    expanded = article.replace(marker, note + marker, 1) if marker in article else article.rstrip() + "
    if words(expanded) > 1200:
        raise ValueError(f"{inp.slug}: distinction note pushes article to {words(expanded)} words")
    return expanded