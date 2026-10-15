"""
generate_unique_resources.py
============================
SEO CONTENT PIPELINE ONLY.

Regenerates public resource SEO articles in content/resources/*.md.

Does NOT generate viral idea cards. Does NOT load viral_training_*, VTP patterns,
cinema craft packs, or comedy systems. Those belong to the viral card pipeline.

Training (SEO only, pattern_only):
  - tools/training_knowledge.py → SCR rules + 2026 AEO + SEO concept signals
  - Behaviors: zero-click, PAS intro, FAQ/PAA, intent match, E-E-A-T language
  - Never prints book titles, SCR ids, or source quotations
  - OriginalityGate: other resource articles + SEO training refs (not viral corpus)

See: docs/architecture/content-pipelines-separation.md
"""

from __future__ import annotations

import hashlib
import re
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESOURCES_DIR = ROOT / "content" / "resources"
SEO_CONTENT_PATH = ROOT / "lib" / "seo-content.ts"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from originality_gate import OriginalityGate  # noqa: E402
from training_knowledge import (  # noqa: E402
    FORBIDDEN_CLICHES,
    TrainingProfile,
    profile_for,
    rule_operator_bullets,
    training_status_report,
)


# ---------------------------------------------------------------------------
# Metadata load
# ---------------------------------------------------------------------------

@dataclass
class ResourceMeta:
    slug: str
    title: str
    description: str
    sections: list[str]


def load_resources_from_ts() -> list[ResourceMeta]:
    text = SEO_CONTENT_PATH.read_text(encoding="utf-8")
    pattern = re.compile(
        r'\{\s*slug:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*'
        r'description:\s*"([^"]+)",\s*sections:\s*\[([^\]]+)\]',
        re.MULTILINE,
    )
    out: list[ResourceMeta] = []
    for m in pattern.finditer(text):
        slug, title, description, sections_raw = m.groups()
        sections = re.findall(r'"([^"]+)"', sections_raw)
        if not sections:
            sections = ["Core execution", "Proof system", "Production constraints", "Conversion path"]
        out.append(ResourceMeta(slug=slug, title=title, description=description, sections=sections))
    return out


# ---------------------------------------------------------------------------
# Topic fingerprinting
# ---------------------------------------------------------------------------

LANE_KEYWORDS = {
    "ugc": ["ugc", "brief", "revision", "rights", "contract", "brand-deal", "non-payment", "portfolio"],
    "beauty": ["beauty", "skincare", "cosmeceutical", "texture", "serum"],
    "fashion": ["fashion", "lookbook", "outfit", "clothes", "styling", "wardrobe"],
    "fitness": ["fitness", "wellness", "coach", "form", "workout"],
    "food": ["food", "recipe", "coffee", "beverage", "culinary", "restaurant", "hospitality"],
    "travel": ["travel", "itinerary", "route", "neighborhood", "luxury-travel"],
    "faceless": ["faceless", "asmr", "b-roll", "broll", "quiet", "hands-only", "screen-recording", "pov"],
    "b2b": ["b2b", "saas", "linkedin", "founder", "consultant", "expert", "knowledge", "thought-leadership", "webinar", "high-ticket"],
    "lighting": ["lighting", "studio", "window", "kelvin", "temperature", "iphone", "tripod", "sound", "capcut"],
    "aeo": ["aeo", "ai-overview", "entity", "schema", "zero-click", "voice-search", "eeat", "knowledge-graph", "multimodal", "citation", "nlp"],
    "product": ["anomalybox", "dossier", "creative-direction-box", "physical", "atelier", "unboxing", "ordering"],
    "visual": ["visual-signature", "aesthetic", "color-grading", "props", "camera-height", "editorial", "continuity", "audio-track"],
    "burnout": ["burnout", "consistency", "repurposing", "niche", "creative-block", "one-hour", "batching"],
}


def detect_lanes(slug: str, title: str) -> list[str]:
    hay = f"{slug} {title}".lower()
    hits = [lane for lane, kws in LANE_KEYWORDS.items() if any(k in hay for k in kws)]
    return hits or ["strategy"]


def stable_pick(options: list[str], seed: str, salt: str = "") -> str:
    h = hashlib.sha256(f"{seed}:{salt}".encode("utf-8")).hexdigest()
    idx = int(h[:8], 16) % len(options)
    return options[idx]


def stable_pick_n(options: list[str], seed: str, n: int, salt: str = "") -> list[str]:
    """Pick n unique items in stable order without reshuffling into same sequence."""
    if n >= len(options):
        return list(options)
    scored = []
    for i, opt in enumerate(options):
        h = hashlib.sha256(f"{seed}:{salt}:{i}:{opt}".encode("utf-8")).hexdigest()
        scored.append((h, opt))
    scored.sort(key=lambda x: x[0])
    return [opt for _, opt in scored[:n]]


# ---------------------------------------------------------------------------
# Content banks (modular, but combinations are per-slug unique)
# ---------------------------------------------------------------------------

FRICTION_BY_LANE = {
    "ugc": [
        "briefs that sound clear in Slack still leave creators guessing about hooks, claims, and deliverable formats",
        "revision loops explode when usage rights and aesthetic boundaries were never written down before the first take",
        "portfolio reels look pretty but fail brand QA because proof moments and claim language are missing",
    ],
    "beauty": [
        "filtered beauty clips hide texture truth, so viewers stop trusting product claims after one swipe",
        "inconsistent lighting makes the same serum look like three different formulas across a campaign",
        "routine videos stall because steps are narrated without visible absorption or finish proof",
    ],
    "fashion": [
        "outfit posts feel interchangeable when silhouette, movement, and styling logic never get explained",
        "buying new pieces every week burns budget without building a recognizable wardrobe language",
        "lookbook pacing collapses when transitions ignore fabric detail and fit decisions",
    ],
    "fitness": [
        "form is hard to judge in a single wide shot, so authority content turns into empty motivation",
        "high-ticket offers feel pushy when the video never shows a measurable coaching system",
        "viewers save technique clips only when angles, cues, and safety boundaries are explicit",
    ],
    "food": [
        "food looks dull under mixed household light, and sizzle audio gets buried under room noise",
        "recipes fail to convert saves when process beats jump without sensory close-ups",
        "overhead framing alone is not enough if color temperature and plating rhythm fight each other",
    ],
    "travel": [
        "generic skyline montages could be anywhere, so destination videos get no saves or trip planning value",
        "itineraries stay vague without route logic, timing, and place-specific detail",
        "luxury travel content flops when atmosphere is claimed in captions but never shown on camera",
    ],
    "faceless": [
        "faceless channels stall when hands, objects, and sound never form a repeatable visual signature",
        "privacy-first creators still need identity cues: recurring props, color grade, and audio rhythm",
        "B-roll dumps without narrative order read as stock footage, not a channel worth following",
    ],
    "b2b": [
        "executive buyers skip talking-head posts that open with soft branding instead of operational friction",
        "thought leadership without receipts becomes opinion noise in a crowded LinkedIn feed",
        "high-ticket CTAs feel salesy when the video never proves a decision framework first",
    ],
    "lighting": [
        "mixed color temperatures make skin and products look different every shoot day",
        "solo creators lose hours re-framing because mounts, remotes, and exposure are improvised",
        "clean audio and controlled light matter more than buying another camera body",
    ],
    "aeo": [
        "AI overviews extract the first clear answer block, so buried advice never gets cited",
        "entity-weak pages compete on keywords but fail to own a topical cluster",
        "video transcripts without question-shaped structure stay invisible to answer engines",
    ],
    "product": [
        "digital prompt packs create more decisions instead of ending them on set",
        "teams lose alignment when creative direction lives in five chat threads and zero physical cards",
        "agencies need shoot-ready artifacts that survive handoff between strategist, creator, and editor",
    ],
    "visual": [
        "feeds look random when camera height, props, and grade change every post",
        "presets cannot replace a lighting identity that survives different rooms",
        "stories, reels, and feed posts feel like three brands when continuity rules are missing",
    ],
    "burnout": [
        "posting more without a lighter system accelerates fatigue instead of growth",
        "perfect drafts pile up while the calendar stays empty",
        "restarting a channel fails when niche, format, and capacity are not renegotiated together",
    ],
    "strategy": [
        "ad-hoc posting burns energy without building a system audiences can recognize",
        "ideas stay stuck in notes apps because production steps are never specified",
        "creators chase trends that do not match their proof style or capacity",
    ],
}

WHO_SEARCHES = {
    "ugc": "UGC creators, brand managers, and small agencies writing briefs and negotiating deliverables",
    "beauty": "beauty and skincare creators filming texture, routine, and product-truth content",
    "fashion": "fashion creators building styling systems without constant new purchases",
    "fitness": "coaches and fitness creators turning form and systems into high-trust content",
    "food": "food creators and hospitality marketers who need sensory-first short video",
    "travel": "travel creators planning route-led, place-specific filming systems",
    "faceless": "introverted and privacy-first creators building channels without face-forward footage",
    "b2b": "founders, consultants, and B2B operators using short video for authority and inbound",
    "lighting": "solo creators improving production quality with limited gear and space",
    "aeo": "creator brands and strategists optimizing content for AI search and citations",
    "product": "creators and teams evaluating physical creative-direction systems versus templates",
    "visual": "creators formalizing a recognizable visual identity across surfaces",
    "burnout": "creators rebuilding sustainable output after fatigue or inconsistency",
    "strategy": "creators who need a practical production system rather than more vague inspiration",
}

TACTIC_OPENERS = [
    "Start from the viewer job, not the aesthetic moodboard.",
    "Treat every scene as a decision the creator must make on set.",
    "If a step cannot be filmed in one continuous action, rewrite it.",
    "Proof beats adjectives: show the rule working in real conditions.",
    "Keep one promise from hook through payoff; never switch the offer mid-video.",
]

SCRIPT_SKELETONS = [
    (
        "Hook → Friction → Method → Proof → Save CTA",
        [
            '"If you still {old_habit}, watch this."',
            '"Use the {method_name}: {step_a}, then {step_b}."',
            '"Proof: {proof_moment}."',
            '"Save this before your next {context}."',
        ],
    ),
    (
        "Mistake → Correction → Why it works → Comment prompt",
        [
            '"The {topic_noun} mistake I keep seeing:"',
            '"Do this instead: {fix_action}."',
            '"It works because {mechanism}."',
            '"Comment {keyword} if you want the one-page checklist."',
        ],
    ),
    (
        "Outcome first → Reverse steps → Constraint note → Offer",
        [
            '"Finished {outcome} in {time_box} — here is the reverse order."',
            '"{step_a} → {step_b} → {step_c}."',
            '"Hard rule: {constraint}."',
            '"Want cards instead of notes? Use a Creative Direction dossier."',
        ],
    ),
    (
        "Question → Direct answer → 3-part breakdown → Next action",
        [
            '"{search_question}"',
            '"{direct_answer}."',
            '"Three moves: {p1}; {p2}; {p3}."',
            '"Today: {next_action}."',
        ],
    ),
]

# Lane-specific tactical inserts so sections are not generic filler
LANE_TACTICS = {
    "ugc": [
        "Write claim language the creator can say without legal cleanup later.",
        "Require at least two hook opens that do not depend on the same first frame.",
        "Separate organic usage from paid usage in the same brief line item.",
        "Mark revision scope as script-error only versus aesthetic preference.",
    ],
    "beauty": [
        "Show texture in the first two seconds before any packaging hero shot.",
        "Keep light direction identical when comparing two products.",
        "Name the finish (dewy, matte, film) instead of saying it looks nice.",
        "If you make a result claim, show the same skin area before and after under one light.",
    ],
    "fashion": [
        "Lead with silhouette movement, then cut to fabric detail.",
        "State the styling rule in text so the outfit teaches something reusable.",
        "Film walk cycles at a consistent camera height for feed recognition.",
        "Reuse three base pieces across looks to prove wardrobe leverage.",
    ],
    "fitness": [
        "Show the joint angle that usually fails, not only the finished rep.",
        "Use a second angle for form correction before the CTA.",
        "Avoid outcome guarantees; teach the cue system instead.",
        "Keep music quieter than coaching audio on technique clips.",
    ],
    "food": [
        "Isolate sizzle or pour audio before you grade color.",
        "Use one warm key and kill mixed overheads that grey out food.",
        "Plate in-frame so the payoff is earned, not stock-inserted.",
        "Caption the technique name, not only the dish name.",
    ],
    "travel": [
        "Open on a place-specific detail most visitors miss.",
        "Map the route order on screen so the video is savable as a plan.",
        "Keep audio honest: street bed, not stock lo-fi over every city.",
        "If faceless, use hands, tickets, or path markers as the narrator.",
    ],
    "faceless": [
        "Pick one recurring prop that appears in every episode open.",
        "Treat Foley as brand: same keyboard, pour, or page-turn character.",
        "Text blocks stay under five words and land on the same vertical band.",
        "Never rely on face substitutes that still leak private context.",
    ],
    "b2b": [
        "Name the operational cost in the first line, not your job title.",
        "Show a receipt: metric, memo excerpt, or workflow screenshot.",
        "End with a keyword CTA only after one usable framework.",
        "Keep posture and framing consistent so authority is visual, not shouted.",
    ],
    "lighting": [
        "Lock white balance and exposure before the first take.",
        "Match Kelvin across key and practicals or kill one of them.",
        "Measure distance to subject so face/product size stays stable.",
        "Audio distance is part of the lighting setup checklist, not an afterthought.",
    ],
    "aeo": [
        "Put a 50–70 word direct answer under the H1 before narrative setup.",
        "Shape H2s as questions people actually type or speak.",
        "Ground claims with first-hand process language, not buzzwords.",
        "Cluster entities (person, method, product, outcome) on the same page.",
    ],
    "product": [
        "Describe what is on the physical card, not only the brand story.",
        "Show handoff: strategist marks, creator films, editor cuts from the same artifact.",
        "Contrast decision latency of chats versus a single card on set.",
        "Name the box tier by job-to-be-done, not color preference alone.",
    ],
    "visual": [
        "Freeze camera height for thirty days before judging the aesthetic.",
        "Limit the prop kit so recognition beats novelty.",
        "Grade for skin/product truth first, mood second.",
        "Mirror the same crop logic on feed, stories, and reels covers.",
    ],
    "burnout": [
        "Cap weekly formats before you cap posting frequency.",
        "Batch only after scripts exist; batching chaos is still chaos.",
        "Define a stop rule for revisions so rest is real.",
        "Measure consistency as finished cards, not hours spiraling in notes.",
    ],
    "strategy": [
        "One audience promise per system, not a moodboard of five.",
        "Separate ideation days from shoot days on the calendar.",
        "Review saves and replies before changing the format.",
        "Kill any step that cannot be explained in one sentence on a card.",
    ],
}

SHORT_AUDIENCE = {
    "ugc": "UGC creators and brand managers",
    "beauty": "beauty creators",
    "fashion": "fashion creators",
    "fitness": "coaches and fitness creators",
    "food": "food creators",
    "travel": "travel creators",
    "faceless": "faceless creators",
    "b2b": "founders and consultants",
    "lighting": "solo creators",
    "aeo": "search-focused creator brands",
    "product": "creators evaluating direction systems",
    "visual": "creators building visual identity",
    "burnout": "creators rebuilding capacity",
    "strategy": "system-minded creators",
}

INTRO_FRAMES = [
    "Skip the hype inventory. This page is a working brief.",
    "You do not need another inspiration dump. You need decisions that survive shoot day.",
    "If a tip cannot become a card, it is not ready for production.",
    "Treat this as an operating manual, not a vibe board.",
    "The goal is repeatable output under real constraints.",
]

CONVERSION_VARIANTS = [
    """## From reading to shoot-ready execution

Close the loop with three artifacts before camera:
1. Audience promise in one sentence.
2. Three-beat card (action / line / proof).
3. Claim boundary for your niche.

If those still live only in chat threads, move them onto physical Creative Direction cards so the team stops renegotiating mid-take.
""",
    """## Put the system on set

Articles change thinking. Cards change behavior.

Convert **{title}** into a pocket brief: shot order, spoken line, proof insert, and stop rules. When the plan is tactile, batching stops depending on motivation.
""",
    """## Next production move

Do not bookmark this and return “someday.”
- Draft one card for **{section0}** today.
- Film the smallest proof for **{section1}** this week.
- Only then expand into a full series.

Physical dossiers exist for teams that want that card stack pre-built instead of rebuilt every Monday.
""",
]

PROOF_DEVICES = [
    "side-by-side before/after under identical light",
    "on-screen timer that proves the process length",
    "macro insert that makes the detail undeniable",
    "screen recording of the real workflow, not a staged mock",
    "voiceover that names the decision, not just the vibe",
    "text card that states the rule in under eight words",
    "recurring prop that reappears as a brand cue",
    "route map or checklist overlay viewers can screenshot",
]

CONSTRAINT_NOTES = [
    "one camera, one light source, no crew",
    "under 20 minutes of setup including audio check",
    "no new purchases — only gear you already own",
    "film in a corner no larger than a desk depth",
    "claim-safe language only; no medical or income guarantees",
    "privacy-first: no face, no private screens, no doxxable locations",
    "must work for both organic Reels and paid UGC cutdowns",
    "batchable: four variants from one setup",
]

FAQ_PAIRS_GENERIC = [
    (
        "How long should this take to implement the first time?",
        "Plan one focused session: 15–25 minutes to define rules, then one short shoot to validate them on camera. Speed comes after the first clean pass, not before.",
    ),
    (
        "Do I need expensive gear for this to work?",
        "No. Consistency of framing, light, and decision rules beats camera body upgrades. Fix exposure lock, audio distance, and scene order first.",
    ),
    (
        "How do I know the system is working?",
        "Track saves, meaningful replies, and whether you can repeat the same format next week without reinventing the plan. Vanity spikes without repeatability are noise.",
    ),
    (
        "What should I avoid when copying competitor formats?",
        "Copy the mechanism (hook type, proof order, utility), never the surface (their props, catchphrases, face, or exact scene). Rebuild the idea for your proof style.",
    ),
    (
        "How does this connect to shoot-ready dossiers?",
        "Articles teach the logic. Physical Creative Direction cards lock shot order, spoken lines, and constraints so you stop re-deciding on set.",
    ),
    (
        "Can this work for both organic and brand work?",
        "Yes, if you separate audience utility from claim boundaries. Organic posts can be more personal; brand assets need explicit proof and disclosure rules.",
    ),
]


def topic_nouns(meta: ResourceMeta) -> dict[str, str]:
    words = re.findall(r"[a-zA-Z0-9]+", meta.title.lower())
    stop = {
        "a", "an", "the", "and", "or", "for", "to", "of", "in", "on", "with", "without",
        "your", "you", "how", "why", "what", "from", "vs", "into", "after", "when",
        "guide", "system", "framework", "template",
    }
    content_words = [w for w in words if w not in stop and len(w) > 2]
    primary = content_words[0] if content_words else "system"
    secondary = content_words[1] if len(content_words) > 1 else "method"
    lane = detect_lanes(meta.slug, meta.title)[0]
    desc = meta.description.rstrip(".")
    return {
        "topic_noun": f"{primary} {secondary}",
        "method_name": f"{primary.title()} {secondary.title()} Method",
        "audience": SHORT_AUDIENCE.get(lane, SHORT_AUDIENCE["strategy"]),
        "old_habit": stable_pick(
            [
                "post random ideas without a shot plan",
                "rewrite the brief after every draft",
                "chase trends that ignore your proof style",
                "hit record before the payoff is defined",
                "stack effects instead of clarifying the message",
            ],
            meta.slug,
            "old_habit",
        ),
        "proof_moment": stable_pick(PROOF_DEVICES, meta.slug, "proof"),
        "context": stable_pick(
            ["shoot day", "client review", "weekly batch", "campaign kickoff", "content reset"],
            meta.slug,
            "context",
        ),
        "fix_action": stable_pick(meta.sections, meta.slug, "fix") if meta.sections else "one clear proof step",
        "mechanism": desc,
        "keyword": stable_pick(["PLAN", "SYSTEM", "BRIEF", "DOSSIER", "FRAME", "ROUTE"], meta.slug, "kw"),
        "outcome": stable_pick(meta.sections, meta.slug, "outcome") if meta.sections else "usable plan",
        "time_box": stable_pick(["12 minutes", "one lunch break", "a single batch block", "under an hour"], meta.slug, "time"),
        "step_a": meta.sections[0] if meta.sections else "Define the promise",
        "step_b": meta.sections[1] if len(meta.sections) > 1 else "Film the proof",
        "step_c": meta.sections[2] if len(meta.sections) > 2 else "Package the CTA",
        "constraint": stable_pick(CONSTRAINT_NOTES, meta.slug, "constraint"),
        "search_question": f"How do you actually run {meta.title} without guessing on set?",
        "direct_answer": desc,
        "p1": meta.sections[0] if meta.sections else "Clarify intent",
        "p2": meta.sections[1] if len(meta.sections) > 1 else "Build proof",
        "p3": meta.sections[2] if len(meta.sections) > 2 else "Ship consistently",
        "next_action": f"draft one card for “{meta.sections[0]}”" if meta.sections else "draft one shoot card",
    }


def expand_section(
    meta: ResourceMeta,
    section: str,
    idx: int,
    lane: str,
    profile: TrainingProfile | None = None,
) -> str:
    """Write a unique paragraph for one resource section (training craft-aware)."""
    seed = f"{meta.slug}:{section}:{idx}"
    tactics = LANE_TACTICS.get(lane, LANE_TACTICS["strategy"])
    tactic = tactics[(idx + int(hashlib.sha256(seed.encode()).hexdigest()[:4], 16)) % len(tactics)]
    # SEO pipeline: no viral craft cues
    craft = ""
    prin = ""
    # Only surface entity coverage when the principle layer is on-topic for this lane
    if profile and profile.principles and lane in ("aeo", "strategy", "b2b", "product", "ugc"):
        p = profile.principles[idx % len(profile.principles)]
        if p.concept and p.concept != p.layer:
            prin = f"Related entities to cover in plain language: {p.concept}."
    openers = [
        f"**{section}** decides whether “{meta.title}” stays theoretical or becomes filmable.",
        f"On **{section}**, write only choices a creator can check without a second meeting.",
        f"**{section}** has one job: change what appears in frame for this topic.",
        f"If **{section}** cannot be audited on set, rewrite it before you shoot.",
    ]
    middles = [
        f"For this resource, connect {section.lower()} to the promise: {meta.description.rstrip('.')}.",
        f"Force every beat under {section.lower()} to include a visible proof device — not an adjective.",
        f"Name framing, duration, and spoken line for {section.lower()}; style words alone fail QA.",
        f"Keep the operator language tight: angle, prop, claim boundary, cut point.",
    ]
    closers = [
        "Done means another person can film from the note alone.",
        "If you still need a voice memo to interpret it, it is not shoot-ready.",
        "Write the default and the one allowed exception.",
        "Hold the default for two weeks before you tweak aesthetics.",
    ]
    prin_line = f" {prin}" if prin else ""
    tactic_clean = tactic.rstrip(".")
    return (
        f"### {idx}. {section}\n\n"
        f"{stable_pick(openers, seed, 'o')} "
        f"{stable_pick(middles, seed, 'm')} "
        f"Tactical rule: {tactic_clean}.{prin_line} "
        f"Proof device: {stable_pick(PROOF_DEVICES, seed, 'pd')}. "
        f"{stable_pick(closers, seed, 'c')}\n"
    )


def build_script_block(meta: ResourceMeta, angle: int) -> str:
    nouns = topic_nouns(meta)
    skeleton = SCRIPT_SKELETONS[angle % len(SCRIPT_SKELETONS)]
    name, lines = skeleton
    filled = []
    for line in lines:
        try:
            filled.append(line.format(**nouns))
        except KeyError:
            filled.append(line)
    body = "\n".join(f"- {ln}" for ln in filled)
    return f"""## Fill-in-the-blank script formula

Use this **{name}** skeleton for **{meta.title}**. Replace braces with your niche specifics; keep the order.

{body}

**Production notes for this script**
- First spoken line must match the cover text promise.
- Insert {nouns['proof_moment']} between the method and the CTA.
- Constraint: {nouns['constraint']}.
"""


def build_steps(meta: ResourceMeta, lane: str, angle: int = 0) -> str:
    steps = []
    base = list(meta.sections[:4])
    while len(base) < 4:
        base.append(f"Validate {lane} quality bar")
    tactics = LANE_TACTICS.get(lane, LANE_TACTICS["strategy"])
    action_sets = [
        [
            f"Write the audience promise from: “{meta.description.rstrip('.')}.”",
            f"Board three shots for “{base[0]}” (action + line + on-screen text).",
            f"Film one locked-light proof pass for “{base[1]}”.",
            f"Edit for comprehension; CTA only supports “{base[-1]}”.",
        ],
        [
            f"List constraints for this topic ({stable_pick(CONSTRAINT_NOTES, meta.slug, f's{angle}')}).",
            f"Draft spoken lines that teach “{base[0]}” without jargon.",
            f"Capture proof for “{base[1]}” using {stable_pick(PROOF_DEVICES, meta.slug, f'p{angle}')}.",
            f"Publish only if “{base[2] if len(base)>2 else base[-1]}” is visible in the cut.",
        ],
        [
            f"Translate “{base[0]}” into a card a teammate can film alone.",
            f"Run a 10-minute rehearsal focused on “{base[1]}”.",
            f"Apply lane rule: {tactics[angle % len(tactics)]}",
            f"Ship, then review saves/replies before changing “{base[-1]}”.",
        ],
    ]
    actions = action_sets[angle % len(action_sets)]
    for i, (section, action) in enumerate(zip(base, actions), 1):
        steps.append(f"{i}. **{section}:** {action}")
    return "## Step-by-step implementation\n\n" + "\n".join(steps) + "\n"


def build_faqs(meta: ResourceMeta, lane: str, profile: TrainingProfile | None = None) -> str:
    """SCR-046 PAA-style: H3 question → immediate 2–3 sentence answer."""
    who = WHO_SEARCHES.get(lane, WHO_SEARCHES["strategy"])
    specific = [
        (
            f"What is {meta.title} in one sentence?",
            f"{meta.description.rstrip('.')}. It is built for {who} who need filmable rules, not inspiration dumps.",
        ),
        (
            f"Who should use {meta.title}?",
            f"{who.capitalize()}. If you only want motivational posts with no production rules, this will feel strict on purpose.",
        ),
        (
            f"How is this different from generic {lane} tips?",
            f"Tips list ideas. This page forces filmable decisions around {', '.join(meta.sections[:3])}. "
            f"Each decision must show up as action, spoken line, and proof.",
        ),
        (
            f"What should I produce immediately after reading {meta.title}?",
            f"One shoot card: promise, three beats for “{meta.sections[0] if meta.sections else 'the core step'}”, "
            f"proof device, claim boundary, and CTA. If an editor cannot film from it, rewrite the card.",
        ),
    ]
    if profile and profile.principles and lane in ("aeo", "strategy", "b2b", "product", "ugc"):
        p = profile.principles[0]
        if p.concept and p.concept != p.layer:
            specific.append(
                (
                    f"Which related topics should {meta.title} cover for topical depth?",
                    f"Include related entities in plain language ({p.concept}) so the page can rank and be cited for a cluster, not a single keyword.",
                )
            )
    extras = stable_pick_n(FAQ_PAIRS_GENERIC, meta.slug, 2, "faq")
    pairs = specific + extras
    seen = set()
    blocks = ["## Frequently asked questions\n"]
    for q, a in pairs:
        if q in seen:
            continue
        seen.add(q)
        # ensure answer length roughly 50+ words for SCR-047 spirit without schema noise
        if len(a.split()) < 35:
            a = (
                a
                + " Keep the answer specific to your niche constraints, claim boundaries, and the exact proof you can film this week."
            )
        blocks.append(f"### {q}\n{a}\n")
    return "\n".join(blocks)


def build_matrix(meta: ResourceMeta, lane: str) -> str:
    headers = {
        "ugc": ["Brief layer", "Creator must do", "Brand must define", "Failure mode"],
        "beauty": ["Scene", "Texture/proof", "Light rule", "Trust risk"],
        "fashion": ["Look beat", "Movement", "Detail insert", "Styling note"],
        "fitness": ["Cue", "Angle", "Safety note", "Authority signal"],
        "food": ["Beat", "Angle", "Audio", "Appetite risk"],
        "travel": ["Route beat", "Place detail", "Atmosphere", "Utility for viewer"],
        "faceless": ["Narrator", "Visual anchor", "Sound layer", "Identity cue"],
        "b2b": ["Beat", "Friction named", "Receipt shown", "CTA type"],
        "lighting": ["Setup", "Gear minimum", "Lock setting", "Common miss"],
        "aeo": ["Page block", "Extraction job", "Entity signal", "Quality bar"],
        "product": ["Artifact", "On-set use", "Team handoff", "Why physical"],
        "visual": ["Identity layer", "Default rule", "Across surfaces", "Drift risk"],
        "burnout": ["Capacity lever", "Weekly default", "Stop rule", "Recovery signal"],
        "strategy": ["System layer", "Operator action", "Proof of work", "Stop-doing"],
    }[lane if lane in {
        "ugc", "beauty", "fashion", "fitness", "food", "travel", "faceless", "b2b",
        "lighting", "aeo", "product", "visual", "burnout", "strategy",
    } else "strategy"]

    rows = []
    for i, section in enumerate(meta.sections[:4]):
        col2 = stable_pick(
            [
                f"Execute “{section}” as a visible action",
                f"Film one proof for {section.lower()}",
                f"Write the spoken line for {section.lower()}",
                f"Lock the constraint around {section.lower()}",
            ],
            meta.slug,
            f"r2{i}",
        )
        col3 = stable_pick(
            [
                "Define claim boundary and CTA keyword",
                "Approve reference frames before shoot",
                "Name success metric (save, reply, DM)",
                "Provide product truth / context notes",
            ],
            meta.slug,
            f"r3{i}",
        )
        col4 = stable_pick(
            [
                "Vague adjectives instead of actions",
                "Proof arrives after the CTA",
                "Mixed light kills continuity",
                "Second promise sneaks into the ending",
            ],
            meta.slug,
            f"r4{i}",
        )
        rows.append(f"| **{section}** | {col2} | {col3} | {col4} |")

    head = f"| {headers[0]} | {headers[1]} | {headers[2]} | {headers[3]} |"
    sep = "| :--- | :--- | :--- | :--- |"
    return (
        f"## Decision matrix for {meta.title}\n\n"
        f"{head}\n{sep}\n" + "\n".join(rows) + "\n"
    )


def build_intro(meta: ResourceMeta, lane: str, angle: int, profile: TrainingProfile | None = None) -> str:
    """PAS-style intro + SCR-051 zero-click summary (training-backed)."""
    frictions = FRICTION_BY_LANE.get(lane, FRICTION_BY_LANE["strategy"])
    friction = frictions[angle % len(frictions)]
    who = WHO_SEARCHES.get(lane, WHO_SEARCHES["strategy"])
    frame = INTRO_FRAMES[angle % len(INTRO_FRAMES)]
    opener = TACTIC_OPENERS[angle % len(TACTIC_OPENERS)]
    desc = meta.description.rstrip(".") + "."
    # SCR-051: 50-100 word direct answer under H1
    zero = (
        f"{meta.title} is a practical operating guide for {who}. "
        f"{desc} "
        f"You get filmable decisions, a fill-in-the-blank script formula, "
        f"and production constraints you can move onto a shoot card the same day."
    )
    section_join = ", ".join(meta.sections[:3]) if meta.sections else "promise, proof, and CTA"
    # SCR-016 PAS: Problem → Agitate → Solution
    pas = (
        f"**Problem:** {friction}.\n\n"
        f"**Agitate:** When that stays unfixed, {who} burn shoot days on taste debates "
        f"and publish generic clips that cannot be saved or cited.\n\n"
        f"**Solution:** Lock operator rules for {section_join}. {opener}"
    )
    intent_line = (
        f"Search intent for **{meta.title}** is informational-to-commercial: "
        f"people want a working system, not a moodboard. Working definition: **{desc}**"
    )
    return f"""> **Zero-Click Summary:** {zero}

---

## Search intent and the real problem

{frame}

{pas}

{intent_line}
"""


def build_training_operator_block(meta: ResourceMeta, profile: TrainingProfile) -> str:
    """
    Apply SEO training rules as an operator block.
    Public-safe: no SCR ids, no book names, no viral craft (pattern_only).
    """
    bullets = rule_operator_bullets(profile, max_items=6)
    lines = "\n".join(f"- {b}" for b in bullets)
    return f"""## SEO operator rules for this page

These rules are selected for **{meta.title}** from the **SEO/AEO training profile only** (search intent, structure, extractability). They are not viral idea-card patterns and not book quotations.

{lines}
"""


def build_tactical(meta: ResourceMeta, lane: str, profile: TrainingProfile | None = None) -> str:
    parts = [f"## Tactical breakdown: {meta.title}\n"]
    parts.append(
        f"Scope lock: this breakdown only covers **{meta.slug.replace('-', ' ')}**. "
        f"Each heading is a production decision that belongs on a card, not in a group chat.\n"
    )
    for i, section in enumerate(meta.sections, 1):
        parts.append(expand_section(meta, section, i, lane, profile=profile))
    return "\n".join(parts)


def build_conversion(meta: ResourceMeta, lane: str, angle: int = 0) -> str:
    if lane == "product":
        return """## From reading to shoot-ready execution

You have the decision logic. The remaining friction is keeping those decisions in front of the camera.

Physical Creative Direction dossiers turn this article into holdable cards: shot order, spoken line, proof insert, and claim boundary on one surface. That is the gap between saving a guide and finishing a batch the same afternoon.
"""
    section0 = meta.sections[0] if meta.sections else "the core promise"
    section1 = meta.sections[1] if len(meta.sections) > 1 else "proof"
    template = CONVERSION_VARIANTS[angle % len(CONVERSION_VARIANTS)]
    return template.format(title=meta.title, section0=section0, section1=section1)


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def strip_forbidden_cliches(text: str) -> str:
    out = text
    for phrase in FORBIDDEN_CLICHES:
        # case-insensitive soft remove
        out = re.sub(re.escape(phrase), "", out, flags=re.IGNORECASE)
    out = re.sub(r" {2,}", " ", out)
    return out


def assemble_article(meta: ResourceMeta, angle: int = 0, profile: TrainingProfile | None = None) -> str:
    lanes = detect_lanes(meta.slug, meta.title)
    lane = lanes[angle % len(lanes)]
    if profile is None:
        profile = profile_for(
            slug=meta.slug,
            title=meta.title,
            sections=meta.sections,
            lane=lane,
        )
    # Vary section order slightly by angle so sibling topics do not share identical flow
    blocks = [
        ("intro", build_intro(meta, lane, angle, profile=profile)),
        ("training", build_training_operator_block(meta, profile)),
        ("matrix", build_matrix(meta, lane)),
        ("tactical", build_tactical(meta, lane, profile=profile)),
        ("script", build_script_block(meta, angle)),
        ("steps", build_steps(meta, lane, angle)),
        ("conversion", build_conversion(meta, lane, angle)),
        ("faqs", build_faqs(meta, lane, profile=profile)),
    ]
    if angle % 3 == 1:
        order = ["intro", "training", "script", "matrix", "tactical", "steps", "conversion", "faqs"]
    elif angle % 3 == 2:
        order = ["intro", "tactical", "training", "steps", "script", "matrix", "conversion", "faqs"]
    else:
        order = ["intro", "training", "matrix", "tactical", "script", "steps", "conversion", "faqs"]
    by_key = dict(blocks)
    parts = [f"# {meta.title}\n"] + [by_key[k] for k in order]
    doc = "\n".join(parts).strip() + "\n"
    doc = strip_forbidden_cliches(doc)
    wc = word_count(doc)
    if wc < 600:
        failures = [
            "using the topic name in captions while filming a generic talking head",
            "explaining the method without showing the decisive insert",
            "ending on a follow prompt unrelated to the utility just delivered",
            "designing a weekly plan that assumes free evenings you do not have",
            "mixing color temperatures so proof shots cannot be compared",
            "writing briefs that leave claim boundaries to improvisation",
        ]
        f1, f2, f3 = stable_pick_n(failures, meta.slug, 3, f"fail{angle}")
        extra = f"""
## Operator checklist for {meta.title}

- Promise check: first three seconds match the final CTA.
- Proof check: {stable_pick(PROOF_DEVICES, meta.slug, f'extra{angle}')} is on the timeline.
- Constraint check: honor “{stable_pick(CONSTRAINT_NOTES, meta.slug, f'c{angle}')}”.
- Section check: footage exists for {', '.join(meta.sections)}.
- Language check: delete empty modifiers; keep visible actions.
- Handoff check: another creator could film from the card alone.

If any box fails, rewrite the card. Post cannot invent a decision you never made.

## Common failure patterns

1. {f1.capitalize()}.
2. {f2.capitalize()}.
3. {f3.capitalize()}.

Correcting these is how you keep “{meta.description.rstrip('.')}” honest under repetition.
""".strip()
        doc = doc.rstrip() + "\n\n" + extra + "\n"
    return doc



import argparse
from ai_content_generator import ArticleInput
from editorial_resource_builder_v2 import add_topic_specific_example, build_editorial_article


def generate_unique_article(
    meta: ResourceMeta,
    gate: OriginalityGate,
    max_angles: int = 8,
) -> tuple[str, str, TrainingProfile]:
    lanes = detect_lanes(meta.slug, meta.title)
    lane = lanes[0]
    profile = profile_for(
        slug=meta.slug,
        title=meta.title,
        sections=meta.sections,
        lane=lane,
    )

    cluster_links = [
        {"slug": "brand-safe-ugc-brief", "title": "Brand-Safe UGC Brief", "anchorText": "Brand-Safe UGC Briefing Guidelines"},
        {"slug": "ugc-creator-portfolio-shot-list", "title": "UGC Portfolio Shot List", "anchorText": "UGC Portfolio Framework"},
    ]

    inp = ArticleInput(
        slug=meta.slug,
        title=meta.title,
        description=meta.description,
        sections=meta.sections,
        lane=lane,
        cluster_links=cluster_links,
        profile=profile,
    )

    candidate = build_editorial_article(inp)
    result = gate.evaluate(candidate)
    if result.status == "REVIEW_REQUIRED":
        candidate = add_topic_specific_example(candidate, inp)
        result = gate.evaluate(candidate)
    return candidate, result.status, profile



def seed_gate_with_training(gate: OriginalityGate) -> int:
    """Register training principle texts so articles cannot near-copy training chunks."""
    from originality_gate import get_shingles, sha256_text
    from training_knowledge import get_all_principles, get_all_rules

    n = 0
    for r in get_all_rules():
        text = r.text
        rid = f"train-rule-{r.id}"
        gate.references.append({"id": rid, "text": text})
        gate.ref_hashes[sha256_text(text)] = rid
        gate.ref_shingles[rid] = get_shingles(text)
        n += 1
    for i, p in enumerate(get_all_principles()):
        text = p.operator_text
        if len(text.split()) < 12:
            continue
        rid = f"train-prin-{i}"
        gate.references.append({"id": rid, "text": text})
        gate.ref_hashes[sha256_text(text)] = rid
        gate.ref_shingles[rid] = get_shingles(text)
        n += 1
    return n


def main() -> int:

    parser = argparse.ArgumentParser(description="Deep Search Intent Content Engine CLI")
    parser.add_argument("--slug", type=str, help="Target a single article slug to generate on demand")
    parser.add_argument("--count", type=int, help="Limit number of articles to generate")
    parser.add_argument("--all", action="store_true", help="Generate all articles in corpus")
    args = parser.parse_args()

    resources = load_resources_from_ts()
    if not resources:
        print("ERROR: No resources parsed from lib/seo-content.ts")
        return 1

    if args.slug:
        resources = [r for r in resources if r.slug == args.slug]
        if not resources:
            print(f"ERROR: Slug '{args.slug}' not found in lib/seo-content.ts")
            return 1
    elif args.count:
        resources = resources[:args.count]

    status = training_status_report()
    print("=== DEEP SEARCH INTENT CONTENT ENGINE ===")
    print(f"pipeline={status.get('pipeline')} viral_attached={status.get('viral_training_attached')}")
    print(f"SEO rules: {status['seo_rules_count']} | principles: {status['principles_count']}")
    print(f"Target count: {len(resources)} articles")

    RESOURCES_DIR.mkdir(parents=True, exist_ok=True)
    gate = OriginalityGate(references=[])
    train_refs = seed_gate_with_training(gate)
    print(f"OriginalityGate seeded with {train_refs} anti-copy references.")

    stats = {"PASS": 0, "REVIEW_REQUIRED": 0, "FAIL_DUPLICATE": 0}
    word_stats = []

    print(f"\nGenerating high-authority articles on-demand...")
    for i, meta in enumerate(resources, 1):
        article, gate_status, profile = generate_unique_article(meta, gate)
        out_path = RESOURCES_DIR / f"{meta.slug}.md"
        out_path.write_text(article, encoding="utf-8")
        stats[gate_status] = stats.get(gate_status, 0) + 1
        wc = word_count(article)
        word_stats.append(wc)

        from originality_gate import get_shingles, sha256_text
        gate.references.append({"id": meta.slug, "text": article})
        gate.ref_hashes[sha256_text(article)] = meta.slug
        gate.ref_shingles[meta.slug] = get_shingles(article)
        print(f"[{i}/{len(resources)}] {meta.slug}: {gate_status}, words={wc}")

    print("\n=== GENERATION SUMMARY ===")
    print(f"Processed: {len(resources)}")
    print(f"Gate evaluation: {stats}")
    if word_stats:
        print(f"Word count min/avg/max: {min(word_stats)}/{sum(word_stats)//len(word_stats)}/{max(word_stats)}")
    if stats.get("FAIL_DUPLICATE", 0):
        print("FAIL: Originality gate found near-duplicate articles.")
        return 2
    print("SUCCESS: Engine completed generation pass successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
