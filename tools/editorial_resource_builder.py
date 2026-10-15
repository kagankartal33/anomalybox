"""Build public resource articles without exposing generation or SEO instructions.

This module belongs to the SEO content pipeline.  It turns the topic metadata in
``lib/seo-content.ts`` into reader-facing editorial copy.  Internal quality rules
stay in code and audits; they must never appear as article sections.
"""

from __future__ import annotations

import hashlib
import re


LANE_GUIDANCE = {
    "ugc": {
        "audience": "UGC creators and brand teams",
        "friction": "revision rounds multiply when the brief leaves product truth, usage and proof open to interpretation",
        "principle": "agree on the claim, evidence and approval route before the first take",
        "proofs": ["a real-use demonstration", "an approved product detail", "a clearly labelled comparison", "a brief-to-final-frame check"],
        "measures": ["fewer avoidable revisions", "clearer approvals", "usable hook variations", "claim-safe final assets"],
        "cautions": ["Do not improvise a product claim on set.", "Separate paid usage from organic posting rights.", "Treat a new concept as new scope, not a small revision.", "Keep one feedback owner for each approval round."],
    },
    "beauty": {
        "audience": "beauty and skincare creators",
        "friction": "texture, finish and wear become unreliable when light or camera distance changes between shots",
        "principle": "show the product under repeatable conditions and describe only what the footage can support",
        "proofs": ["a texture close-up", "the same skin area under the same light", "a clearly timed wear check", "an unfiltered application sequence"],
        "measures": ["clearer product understanding", "more useful saves", "fewer unsupported claims", "stronger visual continuity"],
        "cautions": ["Lock white balance before comparison shots.", "Name the finish instead of calling it beautiful.", "Keep medical claims out of creator interpretation.", "Show application pressure and product amount when they affect the result."],
    },
    "fashion": {
        "audience": "fashion creators",
        "friction": "outfit videos blur together when they show clothes without explaining fit, movement or styling logic",
        "principle": "make the styling decision visible before adding transitions or decorative detail",
        "proofs": ["a full-silhouette movement shot", "a fabric or construction close-up", "the same piece styled two ways", "a before-and-after proportion check"],
        "measures": ["more specific saves", "recognisable styling logic", "better wardrobe reuse", "clearer viewer takeaways"],
        "cautions": ["Keep camera height consistent across comparisons.", "Do not hide fit behind fast cuts.", "Explain why a proportion works for the intended look.", "Let movement reveal the garment before the detail montage."],
    },
    "fitness": {
        "audience": "coaches and fitness creators",
        "friction": "a single flattering angle can hide the movement detail that viewers actually need to understand",
        "principle": "teach one cue at a time, show the relevant angle and keep outcome language responsible",
        "proofs": ["a second camera angle", "a slowed technique comparison", "a clearly labelled coaching cue", "a repeatable progression step"],
        "measures": ["better technique questions", "more qualified enquiries", "safer demonstrations", "repeatable educational formats"],
        "cautions": ["Avoid guaranteed body or income outcomes.", "State when a movement needs individual assessment.", "Keep music below the coaching cue.", "Show the common error before the correction."],
    },
    "food": {
        "audience": "food creators and hospitality teams",
        "friction": "a recipe or venue story loses appetite appeal when process, texture and practical details arrive out of order",
        "principle": "build the sequence around a sensory payoff and give the viewer enough context to act on it",
        "proofs": ["a texture close-up", "a real-time pour or sizzle", "a clearly shown technique", "a useful portion, timing or location detail"],
        "measures": ["recipe saves", "qualified venue interest", "clearer technique understanding", "stronger sensory recall"],
        "cautions": ["Turn off mixed overhead light when it greys the food.", "Do not skip the step that creates the final texture.", "Record clean natural sound before adding music.", "State practical details viewers need before visiting or cooking."],
    },
    "travel": {
        "audience": "travel creators",
        "friction": "generic montages create atmosphere but give viewers no route, timing or place-specific reason to save the post",
        "principle": "anchor every sequence in a real location detail and a useful route decision",
        "proofs": ["a route map", "a place-specific detail", "an honest arrival sequence", "a clearly stated timing or access note"],
        "measures": ["trip-planning saves", "specific questions", "recognisable place storytelling", "useful route completion"],
        "cautions": ["Do not reveal private or unsafe location details.", "Use real ambient sound when it helps describe the place.", "Avoid presenting one visit as a universal rule.", "Name when timing, season or access changes the experience."],
    },
    "faceless": {
        "audience": "privacy-first and faceless creators",
        "friction": "hands-only footage feels generic when objects, sound and movement have no recurring point of view",
        "principle": "choose a visual narrator and repeat a small set of identity cues without exposing private context",
        "proofs": ["a recurring object", "a purposeful point-of-view action", "a screen recording with private data removed", "a recognisable sound cue"],
        "measures": ["stronger format recognition", "safer production", "clearer stories without face-forward footage", "more consistent episodes"],
        "cautions": ["Check screens and reflections for private information.", "Keep text short enough to read without pausing.", "Give each B-roll shot a narrative job.", "Use sound as structure, not as decoration."],
    },
    "b2b": {
        "audience": "founders, consultants and B2B teams",
        "friction": "thought leadership sounds interchangeable when it opens with a job title instead of a real decision and its consequences",
        "principle": "lead with operational friction, show a receipt and explain the trade-off in plain language",
        "proofs": ["an anonymised workflow screen", "a before-and-after process", "a decision memo excerpt", "a metric with enough context to interpret it"],
        "measures": ["qualified replies", "sales-relevant questions", "stronger category recall", "clearer expertise signals"],
        "cautions": ["Do not publish confidential customer information.", "Give metrics a timeframe and baseline.", "Avoid turning one result into a universal promise.", "End with one relevant next action."],
    },
    "lighting": {
        "audience": "solo creators improving a small production setup",
        "friction": "buying more gear does not fix footage when exposure, white balance, distance and room sound change every session",
        "principle": "stabilise the setup with measurable defaults before adding equipment",
        "proofs": ["a locked-light comparison", "a labelled setup diagram", "a short audio test", "a repeatable camera-position marker"],
        "measures": ["faster setup", "consistent skin and product colour", "cleaner audio", "fewer unusable takes"],
        "cautions": ["Match colour temperature or switch one source off.", "Reserve space for the subject to move.", "Test audio at the actual recording distance.", "Save settings only after checking the proof shot."],
    },
    "aeo": {
        "audience": "creator brands publishing reference-quality pages",
        "friction": "a page may target the right phrase yet remain hard to cite when the answer is buried, vague or unsupported",
        "principle": "answer the question early, define entities clearly and support claims with first-hand or authoritative evidence",
        "proofs": ["a concise direct answer", "a clearly attributed source", "a first-hand process example", "a question-shaped section with a complete response"],
        "measures": ["relevant impressions", "qualified organic visits", "citations and branded searches", "engagement with the next useful page"],
        "cautions": ["Do not add FAQ schema for questions that are not visible.", "Refresh dates only when the content actually changes.", "Avoid claims that the cited source does not support.", "Write for the reader before optimising extraction."],
    },
    "product": {
        "audience": "creators and teams comparing direction systems",
        "friction": "a planning product creates more work when buyers cannot see what decisions it resolves before shoot day",
        "principle": "show the artifact, the handoff and the production decision it replaces",
        "proofs": ["a real Creator Vault brief", "a strategist-to-creator handoff", "a shot completed from the written direction", "a clear comparison of workflow steps"],
        "measures": ["faster handoff", "fewer clarification messages", "more complete shoots", "better fit between tier and job"],
        "cautions": ["Describe the contents without inventing results.", "Do not present colour as the only difference between tiers.", "Show what remains the creator's decision.", "Keep product claims aligned with the actual service."],
    },
    "visual": {
        "audience": "creators building a recognisable visual identity",
        "friction": "a feed feels inconsistent when camera height, light, crop and props change before any pattern has time to register",
        "principle": "set a small number of visual defaults, test them across formats and change one variable at a time",
        "proofs": ["a nine-post continuity check", "the same setup across two formats", "a labelled lighting reference", "a controlled before-and-after grade"],
        "measures": ["stronger visual recognition", "faster production decisions", "consistent product truth", "less format-to-format drift"],
        "cautions": ["Grade for truthful skin and product colour first.", "Keep props limited enough to become recognisable.", "Test the crop on feed, Stories and Reels covers.", "Do not mistake a preset for a complete visual system."],
    },
    "burnout": {
        "audience": "creators rebuilding a sustainable workload",
        "friction": "adding more tools or batching targets can increase pressure when the real problem is volume, boundaries or recovery debt",
        "principle": "reduce commitments first, then rebuild around a minimum cadence the creator can actually sustain",
        "proofs": ["a workload log", "a reduced publishing plan", "written revision boundaries", "a recovery check after each production block"],
        "measures": ["lower context switching", "fewer late-night sessions", "a sustainable minimum cadence", "more predictable recovery"],
        "cautions": ["A workflow is not medical or mental-health care.", "Do not turn recovery into another public challenge.", "Remove a format before adding a new system.", "Seek qualified support when health or daily functioning is affected."],
    },
    "strategy": {
        "audience": "creators building a repeatable publishing system",
        "friction": "ideas stay unfinished when audience promise, proof and production limits are decided after recording begins",
        "principle": "give each piece one job and resolve the opening, evidence and next action before filming",
        "proofs": ["a completed example", "a visible process step", "a before-and-after decision", "an audience question answered on screen"],
        "measures": ["more finished pieces", "useful saves and replies", "shorter planning time", "stronger format recognition"],
        "cautions": ["Do not make several promises in one piece.", "Choose a format that fits the evidence.", "Review comparable posts rather than isolated spikes.", "Remove any scene that does not support the point."],
    },
}

OPENERS = [
    "The hard part is rarely finding one more idea.",
    "A useful plan should reduce decisions, not rename them.",
    "Good execution starts before the camera or publishing screen opens.",
    "The strongest version of this topic is practical and specific.",
    "A polished result depends on a few early choices staying consistent.",
    "More options are not always more helpful.",
    "The work becomes easier once the evidence is defined first.",
    "A repeatable system leaves room for judgement without relying on guesswork.",
]


def stable_pick(items: list[str], seed: str, salt: str) -> str:
    digest = hashlib.sha256(f"{seed}:{salt}".encode("utf-8")).hexdigest()
    return items[int(digest[:8], 16) % len(items)]


def words(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def lower_first(value: str) -> str:
    return value[:1].lower() + value[1:] if value else value


def build_editorial_article(inp) -> str:
    """Return a 600-1,200 word, reader-facing article for an ArticleInput."""
    guide = LANE_GUIDANCE.get(inp.lane, LANE_GUIDANCE["strategy"])
    topic_base = re.sub(r"\s+in\s+\d{4}$", "", inp.title.split(":", 1)[0], flags=re.I)
    topic_ref = " ".join(topic_base.split()[:7]).rstrip("&,- ")
    sections = list(inp.sections[:4]) or ["Define the goal", "Choose the evidence", "Plan the sequence", "Review the result"]
    while len(sections) < 4:
        sections.append(["Choose the evidence", "Plan the sequence", "Review the result"][len(sections) - 1])

    opener = stable_pick(OPENERS, inp.slug, "opener")
    proof_by_section = [stable_pick(guide["proofs"], inp.slug, f"proof-{i}") for i in range(4)]
    caution_by_section = [stable_pick(guide["cautions"], inp.slug, f"caution-{i}") for i in range(4)]

    intro = (
        f"{opener} **{inp.title}** has one practical aim: {lower_first(inp.description.rstrip('.'))}. "
        f"This guide helps {guide['audience']} decide what to show, what to keep consistent and what to leave out "
        f"when time, access or production capacity is limited."
    )

    quick = (
        f"For **{inp.title}**, decide the audience outcome and credible evidence first. Use **{sections[0]}** to set direction, "
        f"**{sections[1]}** to make it concrete, and **{sections[2]}** to keep execution consistent. "
        f"The core principle is: {guide['principle']}."
    )

    problem = (
        f"{guide['friction'].capitalize()}. Adding more hooks, tools or visual references rarely fixes that on its own. "
        f"The missing piece is usually a decision about what must be seen, what can be claimed and what the audience "
        f"should take away. The practical goal is to {lower_first(inp.description.rstrip('.'))}.\n\n"
        f"Keep the scope narrow enough to finish. A complete small version of **{lower_first(sections[0])}**, supported by "
        f"**{lower_first(sections[1])}**, is more useful than an ambitious plan whose proof, timing or owner remains unclear."
    )

    rows = []
    for i, section in enumerate(sections):
        rows.append(
            f"| **{section}** | Set one visible choice | {proof_by_section[i]} | {caution_by_section[i]} |"
        )
    table = (
        "| Decision | What to settle | Evidence | Guardrail |\n"
        "| :--- | :--- | :--- | :--- |\n" + "\n".join(rows)
    )

    section_blocks = []
    transitions = [
        "Begin with the smallest decision that changes the result.",
        "Make this visible rather than leaving it in a caption or meeting note.",
        "Keep the choice stable long enough to judge it fairly.",
        "Use the final pass to remove ambiguity, not to add another idea.",
    ]
    decision_leads = [
        "Treat this as the decision that makes the evidence possible.",
        "Set the default before adding stylistic choices.",
        "Resolve the practical version before planning variations.",
        "Write the choice so it can survive a handoff.",
        "Start with the boundary, then define the preferred version.",
        "Keep the decision small enough to test in one pass.",
        "Tie the choice to something the audience can verify.",
        "Use the real constraint to shape the default.",
    ]
    evidence_leads = [
        "Test the decision with",
        "Use the following as the evidence check:",
        "The clearest check is",
        "Confirm the choice through",
        "Review the result against",
        "Make the decision visible with",
        "Support the point with",
        "Before moving on, verify it through",
    ]
    for i, section in enumerate(sections):
        measure = stable_pick(guide["measures"], inp.slug, f"measure-{i}")
        decision_lead = stable_pick(decision_leads, inp.slug, f"decision-lead-{i}")
        evidence_lead = stable_pick(evidence_leads, inp.slug, f"evidence-lead-{i}")
        section_blocks.append(
            f"### {i + 1}. {section}\n\n"
            f"{decision_lead} For **{lower_first(section)}**, {transitions[i].lower()} "
            f"Write one default and the single condition that would justify changing it.\n\n"
            f"{evidence_lead} {proof_by_section[i]}. If it is unavailable, narrow the promise. "
            f"{caution_by_section[i]} A successful pass should produce {measure} before you move to **{lower_first(sections[(i + 1) % len(sections)])}**."
        )

    method_blocks = "\n\n".join(section_blocks)

    script = (
        f"Use this draft to connect **{lower_first(sections[0])}** with **{lower_first(sections[3])}**, then replace every bracket with a real detail:\n\n"
        f"- **Opening:** “If you are trying to [desired outcome], start with {lower_first(sections[0])}.”\n"
        f"- **Context:** “The common problem is [specific friction], which makes [consequence] harder to avoid.”\n"
        f"- **Method:** “First, [action based on {lower_first(sections[1])}]. Then, [action based on {lower_first(sections[2])}].”\n"
        f"- **Evidence:** “Here is {proof_by_section[2]} so you can see what changed.”\n"
        f"- **Next action:** “Use this check before your next [relevant task].”\n\n"
        f"Read it aloud while checking **{lower_first(sections[0])}** and **{lower_first(sections[3])}**. Remove lines the images or example already communicate. "
        f"The wording should sound like the creator or brand."
    )

    first_pass = (
        f"1. Write the audience outcome in one sentence.\n"
        f"2. Turn **{sections[0]}** into one default choice and one boundary.\n"
        f"3. Prepare {proof_by_section[1]} before production or publishing begins.\n"
        f"4. Complete **{sections[2]}** without adding a second promise.\n"
        f"5. Review {stable_pick(guide['measures'], inp.slug, 'final-measure')} and record one change."
    )

    measurement = (
        f"Judge the method by whether **{lower_first(sections[2])}** improves. Useful signals include "
        f"{', '.join(guide['measures'][:3])}. Compare similar pieces or work periods; a single spike is not enough "
        f"to prove a repeatable system. Keep the format stable while testing one meaningful variable at a time."
    )

    faq = (
        f"### What should be prepared before starting {inp.title}?\n\n"
        f"Prepare the audience outcome, the default for {lower_first(sections[0])}, the evidence you can genuinely show, "
        f"and the main constraint. For this topic, {proof_by_section[0]} is a stronger starting point than a long list of references.\n\n"
        f"### Can this work with limited time or equipment?\n\n"
        f"Yes. Reduce the number of scenes, formats or deliverables before reducing clarity. Keep {lower_first(sections[1])} "
        f"and one proof moment; remove decorative work that does not help the audience understand the result.\n\n"
        f"### How do I keep the result from feeling generic?\n\n"
        f"Use details from the real situation: the actual constraint, product state, location, audience question or decision. "
        f"Keep **{sections[3]}** tied to evidence gathered during **{lower_first(sections[0])}**. Specific context creates distinction more reliably than a louder hook."
    )

    next_step = (
        f"Apply **{lower_first(sections[0])}** and **{lower_first(sections[3])}** to real work before expanding the system. If creative direction is still unresolved, "
        f"[explore the AnomalyBox dossier options](/store) and choose the level that fits the decisions you need resolved."
    )

    article = f"""# {inp.title}

{intro}

## Quick answer

{quick}

## What usually gets in the way

{problem}

## Decisions to make before you start

{table}

## How to put the method into practice

{method_blocks}

## A script you can adapt

{script}

## A practical first pass

{first_pass}

## How to review the result

{measurement}

## Frequently asked questions

{faq}

## Next step

{next_step}
"""

    if not 600 <= words(article) <= 1200:
        raise ValueError(f"{inp.slug}: editorial article has {words(article)} words")
    return article


def add_topic_specific_example(article: str, inp) -> str:
    """Add a compact worked example when the originality gate requests review."""
    guide = LANE_GUIDANCE.get(inp.lane, LANE_GUIDANCE["strategy"])
    sections = list(inp.sections[:4])
    proof = stable_pick(guide["proofs"], inp.slug, "review-proof")
    caution = stable_pick(guide["cautions"], inp.slug, "review-caution")
    example = f"""## A worked example

Picture {guide['audience']} testing **{inp.title}** on one real deliverable. They define **{sections[0]}** and capture {proof} before adding polish. **{sections[1]}** stays visible in the draft, while **{sections[2]}** is judged against the original promise rather than taste alone. {caution} During review, **{sections[3]}** decides what stays, what needs one revision and what should be removed next time. The small scope proves the method under a real constraint before the format expands.

"""
    marker = "## Frequently asked questions"
    expanded = article.replace(marker, example + marker, 1) if marker in article else article.rstrip() + "\n\n" + example
    if words(expanded) > 1200:
        raise ValueError(f"{inp.slug}: review example pushes article to {words(expanded)} words")
    return expanded
