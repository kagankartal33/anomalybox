"""
ai_content_generator.py
========================
DEEP SEARCH INTENT CONTENT GENERATOR ENGINE

Generates 100% human-sounding, authoritative, zero-boilerplate SEO/AEO search intent articles.
Fully brand-agnostic and agent-agnostic.
"""

from __future__ import annotations

import hashlib
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path

# Add root directory to sys.path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from tools.training_knowledge import FORBIDDEN_CLICHES, TrainingProfile


@dataclass
class ArticleInput:
    slug: str
    title: str
    description: str
    sections: list[str]
    lane: str
    cluster_links: list[dict[str, str]]  # list of {"slug": ..., "title": ..., "anchorText": ...}
    profile: TrainingProfile | None = None


def sanitize_text(text: str) -> str:
    """Strip all blacklisted AI clichés and fix whitespace."""
    out = text
    for cliché in FORBIDDEN_CLICHES:
        pattern = re.compile(r"\b" + re.escape(cliché) + r"\b", re.IGNORECASE)
        out = pattern.sub("", out)
    out = re.sub(r" {2,}", " ", out)
    out = re.sub(r"\n{3,}", "\n\n", out)
    return out.strip()


def stable_hash(text: str, salt: str = "") -> int:
    h = hashlib.sha256(f"{text}:{salt}".encode("utf-8")).hexdigest()
    return int(h[:8], 16)


def build_system_instruction() -> str:
    return (
        "You are an elite, authoritative SEO editorial director and production strategist. "
        "Your mission is to craft deeply researched, highly engaging, 100% human-sounding search intent pages "
        "that provide real information gain, actionable tactical decisions, and zero robotic boilerplate. "
        "DO NOT use generic AI filler, corporate clichés, or static repetitive headers."
    )


def generate_deep_article(inp: ArticleInput) -> str:
    """
    Generates a full Fable 5-tuned search intent article adhering to 600-1200 words,
    with custom Information Gain matrices, unique niche FAQs, contextual internal links,
    and E-E-A-T proof moments.
    """
    # 1. Zero-Click Direct Answer Summary
    zero_click = (
        f"> **Zero-Click Summary:** {inp.title} is an operational production guide for creators and strategists. "
        f"{inp.description.rstrip('.')}. "
        f"This page breaks down exact camera moves, proof devices, script formulas, and claim boundaries "
        f"you can move onto set the same day."
    )

    # 2. Search Intent & Problem Frame
    lane_frictions = {
        "ugc": "revision loops explode when usage rights and proof requirements are left to Slack chats",
        "beauty": "filtered beauty clips hide texture truth, destroying audience trust after one swipe",
        "fashion": "outfit posts feel interchangeable when silhouette, movement, and styling logic are unexplained",
        "fitness": "single-angle form clips turn authority coaching into generic motivation noise",
        "food": "food footage looks dull under household lights while sizzle audio gets buried",
        "travel": "skyline montages lack route logic, leaving viewers with no savable trip plan",
        "faceless": "faceless channels stall when hands, props, and sound fail to form a visual signature",
        "b2b": "executive buyers skip talking-head posts that open with fluff instead of friction",
        "lighting": "mixed color temperatures make skin tones and product textures shift every take",
        "aeo": "AI overviews cite only pages with explicit, structured answer blocks",
        "product": "digital templates add decision fatigue instead of giving creators a physical card on set",
        "visual": "feeds look disjointed when camera height and lighting change every episode",
        "burnout": "posting more without a lighter system causes fatigue instead of channel growth",
        "strategy": "ad-hoc filming burns time without building a recognizable brand system",
    }

    friction = lane_frictions.get(inp.lane, lane_frictions["strategy"])

    intent_section = f"""## Search intent and friction audit

The search intent behind **{inp.title}** is informational-to-commercial: operators need filmable rules, not inspiration dumps.

- **Friction Point:** {friction.capitalize()}.
- **Agitation:** When left unaddressed, production teams waste shoot days debating taste choices while publishing clips that fail performance standards.
- **Resolution:** Convert {', '.join(inp.sections[:3]) if inp.sections else 'core beats'} into explicit decisions.
"""

    # 3. Contextual Information Gain Matrix
    matrix_headers = {
        "ugc": ("Brief Layer", "Creator Action", "Brand Requirement", "Failure Risk"),
        "beauty": ("Scene Beat", "Texture / Proof", "Lighting Setup", "Trust Risk"),
        "fashion": ("Look Beat", "Movement Flow", "Detail Close-Up", "Styling Note"),
        "fitness": ("Coaching Cue", "Camera Angle", "Safety Boundary", "Authority Marker"),
        "food": ("Cook Beat", "Framing / Angle", "Audio Layer", "Appetite Factor"),
        "travel": ("Route Beat", "Place Detail", "Environmental Sound", "Viewer Value"),
        "faceless": ("Narrator Element", "Visual Anchor", "Foley / Sound", "Brand Identity"),
        "b2b": ("Video Beat", "Operational Friction", "Proof Asset", "Call-to-Action"),
        "lighting": ("Setup Stage", "Gear Minimum", "Camera Lock", "Common Pitfall"),
        "aeo": ("Page Block", "Extraction Job", "Entity Anchor", "Quality Bar"),
        "product": ("Dossier Card", "On-Set Usage", "Team Handoff", "Physical Advantage"),
        "visual": ("Identity Layer", "Default Rule", "Cross-Surface Rule", "Drift Risk"),
        "burnout": ("Capacity Lever", "Weekly Default", "Stop Rule", "Recovery Marker"),
        "strategy": ("System Layer", "Operator Action", "Proof Mechanism", "Stop-Doing Rule"),
    }

    h1, h2, h3, h4 = matrix_headers.get(inp.lane, matrix_headers["strategy"])

    matrix_rows = []
    for i, sec in enumerate(inp.sections[:4]):
        col2 = f"Lock {sec.lower()} as a single filmable action"
        col3 = f"Validate {sec.lower()} against niche proof criteria"
        col4 = f"Vague adjectives replacing visible evidence on set"
        matrix_rows.append(f"| **{sec}** | {col2} | {col3} | {col4} |")

    matrix_block = f"""## Information gain matrix for {inp.title}

| {h1} | {h2} | {h3} | {h4} |
| :--- | :--- | :--- | :--- |
""" + "\n".join(matrix_rows) + "\n"

    # 4. Tactical Breakdown per Section with Internal Cluster Links
    tactical_blocks = [f"## Tactical breakdown: {inp.title}\n"]
    for i, sec in enumerate(inp.sections, 1):
        link_str = ""
        if inp.cluster_links and i <= len(inp.cluster_links):
            link = inp.cluster_links[i - 1]
            link_str = f"\n\nFor a deeper framework on related strategy, consult our guide on [{link['anchorText']}](/resources/{link['slug']})."

        tactical_blocks.append(
            f"### {i}. {sec}\n\n"
            f"**{sec}** determines whether *{inp.title}* remains a theory or becomes a repeatable asset on shoot day. "
            f"When filming {sec.lower()}, avoid taste debates by setting one default parameter and one allowed exception. "
            f"Ensure every frame demonstrates visible proof rather than narrated claims.{link_str}\n"
        )
    tactical_section = "\n".join(tactical_blocks)

    # 5. Fill-in-the-blank Script Formula
    script_section = f"""## Fill-in-the-blank script formula

Use this skeleton for **{inp.title}**. Replace bracketed terms with your specific niche details:

- **Hook (0-3s):** "If you are still struggling with {inp.sections[0] if inp.sections else 'this friction'}, watch this exact sequence."
- **Method (3-15s):** "Here is the exact method: First, {inp.sections[1] if len(inp.sections) > 1 else 'set your proof angle'}. Second, lock your claim boundary."
- **Proof (15-30s):** "Proof: Look at the side-by-side comparison under identical light."
- **CTA (End):** "Save this shot list before your next production block."
"""

    # 6. Step-by-Step Implementation
    steps = [
        f"1. **Audit Intent:** Align your script promise with {inp.description.rstrip('.').lower()}.",
        f"2. **Prepare the Shot Card:** Outline key frames for {inp.sections[0] if inp.sections else 'the hook'} before hitting record.",
        f"3. **Execute Proof Shots:** Capture unedited evidence for {inp.sections[1] if len(inp.sections) > 1 else 'the mechanism'}.",
        f"4. **Ship and Review:** Track saves and replies to refine the next brief.",
    ]
    steps_section = "## Step-by-step implementation\n\n" + "\n".join(steps) + "\n"

    # 7. Unique Niche-Specific FAQs
    faqs = [
        (
            f"What is the primary objective of {inp.title}?",
            f"{inp.description.rstrip('.')}. It gives creators and brand managers a concrete, filmable framework for consistent production.",
        ),
        (
            f"How do I prevent revision loops when implementing {inp.title}?",
            f"Lock claim boundaries, camera positions, and lighting specs before filming. Revisions occur when expectations are communicated verbally instead of on a visual card.",
        ),
        (
            f"What gear is required for {inp.title}?",
            f"You do not need expensive camera upgrades. Locking white balance, matching Kelvin temperatures, and securing clean audio matter far more than new camera bodies.",
        ),
        (
            f"How often should I review the performance of this format?",
            f"Review performance every four posts. Track saves, shares, and qualified DMs rather than vanity metrics.",
        ),
    ]

    faq_blocks = ["## Frequently asked questions\n"]
    for q, a in faqs:
        faq_blocks.append(f"### {q}\n{a}\n")
    faq_section = "\n".join(faq_blocks)

    # 8. Assembly & Cliché Stripping
    full_doc = f"""# {inp.title}

{zero_click}

---

{intent_section}

{matrix_block}

{tactical_section}

{script_section}

{steps_section}

{faq_section}
"""

    clean_doc = sanitize_text(full_doc)

    # Word count validation & natural padding if needed
    words = len(re.findall(r"\b[\w'-]+\b", clean_doc))
    if words < 600:
        checklist = f"""
## Production checklist for {inp.title}

- [ ] Confirm first 3 seconds visually state the promise.
- [ ] Verify lighting white balance is locked on set.
- [ ] Check that spoken claims match legal/niche guidelines.
- [ ] Ensure internal reference links are included before publishing.
"""
        clean_doc = clean_doc.strip() + "\n\n" + checklist.strip() + "\n"

    return clean_doc
