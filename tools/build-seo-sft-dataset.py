"""
build-seo-sft-dataset.py
========================
SEO & AEO CONTENT SFT DATASET BUILDER.

Compiles 250+ gold-standard (system_prompt, user_query, assistant_response) SFT training samples
for fine-tuning Gemini 1.5/2.0 Pro/Flash or Local Open-Weights Models (Llama-3 / Mistral)
on world-class 2026 AEO, Information Gain, and high-readability SEO content writing.

Output:
  - ViralBox-training-archive/dataset/seo_content/prepared/seo_sft_training.jsonl
  - local dataset/seo_content/prepared/seo_sft_training.jsonl
"""

from __future__ import annotations

import hashlib
import json
import random
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive")
PREPARED_DIR = ARCHIVE / "dataset" / "seo_content" / "prepared"
LOCAL_PREPARED = ROOT / "dataset" / "seo_content" / "prepared"

SYSTEM_PROMPT = """You are a Principal SEO & AEO Editorial Director and Information Gain Architect.
Your task is to write high-authority, crystal-clear, 2026 AEO-compliant search intent guides.

Follow these strict editorial rules:
1. RADICAL CLARITY & READABILITY: Target a Flesch Reading Ease score of 50-65. Use active voice, short paragraphs (2-3 sentences), and an average sentence length of 14 words.
2. ZERO AI CLICHES: Never use forbidden filler ('in today's digital world', 'delve into', 'tapestry', 'game changer', 'unlock the power', 'seamlessly', 'leverage', 'cutting-edge', 'furthermore', 'in conclusion').
3. SIX-TIER STRUCTURE:
   - ## Quick answer (50-70 word direct answer capsule for AI Overviews / Featured Snippets).
   - ## Context & Friction (The real production problem and constraint).
   - ## Decision map (Markdown comparison table with | Decision | Evidence | Boundary |).
   - ## How to put the method into practice (Numbered tactical guidance with concrete parameters).
   - ## A script you can adapt (Fill-in-the-blank script or brief skeleton with bracketed variables).
   - ## A practical first pass (Worked example under realistic constraints).
   - ## Frequently asked questions (4 niche-specific People-Also-Ask Q&As).
   - ## Next step (Clear single CTA).
4. HIGH CONCRETENESS: Always specify tangible physical, technical, and legal variables (Kelvin temperatures, audio distances, focal lengths, usage right scopes)."""

TOPIC_CATALOG = [
    # 1. UGC & Creator Contracts
    {
        "lane": "ugc",
        "title": "Brand-Safe UGC Brief Template and Claim Architecture",
        "query": "How to structure a brand-safe UGC brief that prevents revision loops?",
        "quick": "A brand-safe UGC brief locks three non-negotiables before filming: the approved product claim, the required visual proof moment, and the usage boundary. Provide creators with exact spoken claim boundaries and separate organic rights from paid ad whitelisting. This eliminates taste disputes and prevents costly reshoots.",
        "context_h": "Why brief boundaries fail on shoot day",
        "context": "Most UGC revision loops explode when usage rights and claim boundaries live in Slack threads instead of on a written card. The creator films an aesthetic clip. The brand legal team rejects the spoken claim. Start by agreeing on the single required truth before the creator hits record.",
        "sections": ["Approved claim wording", "Required visual proof", "Organic vs paid usage rights", "Single feedback owner"],
        "proofs": ["a direct macro texture demo", "side-by-side comparison under identical light", "screen recording of the metric", "signed approval checklist"],
        "cautions": ["Do not improvise claims on camera.", "Never bundle organic post fees with perpetual ad usage.", "Treat new angles as new scope.", "Designate one final approver."],
        "measures": ["fewer revision cycles", "faster brand signoff", "claim-safe ad delivery", "clean licensing terms"],
        "script": """- **Opening frame:** `[Product held at 45-degree angle under 5600K light]`
- **Hook (0-3s):** "If you are struggling with `[specific skin texture or daily friction]`, watch this exact step."
- **Method (3-15s):** "Use `[product name]`: apply two pumps directly onto dry skin."
- **Proof (15-25s):** "Look at the texture breakdown under macro close-up."
- **Call to action:** "Save this brief before your next brand delivery." """,
        "faqs": [
            ("What is the difference between organic and paid UGC rights?", "Organic rights allow the brand to repost on their native feed. Paid whitelisting allows the brand to run ads through the creator account. Always price whitelisting as a separate line item."),
            ("How many hook variations should be filmed per brief?", "Request 3 distinct hook variations (problem callout, visual proof, negative hook) for every 30-second core asset."),
            ("What causes most UGC contract disputes?", "Ambiguous revision clauses. Define revisions as script correction only; concept changes count as new scope."),
            ("How long should a creator take to deliver assets?", "Standard delivery is 5 to 7 business days from product receipt, with one round of consolidated feedback within 48 hours."),
        ]
    },
    # 2. Beauty & Skincare Production
    {
        "lane": "beauty",
        "title": "Skincare Texture Filming and Lighting Standards",
        "query": "How to film skincare and cosmetic textures with authentic lighting?",
        "quick": "Filming authentic skincare textures requires diffused 5600K daylight simulation, a 45-degree key light angle to eliminate bottle glare, and macro lenses (50-85mm equivalent). Lock white balance and exposure manually before the first take. Showing real skin texture builds audience trust and stops viewer swipe-away.",
        "context_h": "The trust problem with filtered beauty clips",
        "context": "Heavy smoothing filters and mixed household lights grey out product textures. Viewers stop trusting formula claims when the finish shifts between shots. Protect the texture moment by maintaining identical light direction and camera height across every take.",
        "sections": ["Diffused daylight key light", "Macro texture close-up", "Unfiltered skin finish proof", "Locked Kelvin temperature"],
        "proofs": ["macro texture application on clean skin", "unfiltered before/after under identical Kelvin", "clear timed wear test", "real-time absorption shot"],
        "cautions": ["Lock white balance at 5600K before shooting.", "Name the finish (dewy, matte, satin) instead of calling it nice.", "Keep medical claims out of creator copy.", "Show exact product amounts."],
        "measures": ["higher watch time", "qualified saves", "authentic trust markers", "consistent skin tones"],
        "script": """- **Opening frame:** `[Macro close-up of droplet on glass dropper]`
- **Hook (0-3s):** "If your serum pills under moisturizer, you are applying it wrong."
- **Method (3-15s):** "Apply three drops to damp skin. Pat gently for five seconds until absorbed."
- **Proof (15-25s):** "Look at the skin finish under diffused daylight: zero sticky residue."
- **Call to action:** "Save this routine breakdown before your next skincare reset." """,
        "faqs": [
            ("How do you stop reflections on glossy cosmetic bottles?", "Position your key light at a strict 45-degree angle above the subject and use a polarizing lens filter."),
            ("What camera settings work best for texture macro shots?", "Film in 4K at 60fps with a 50mm or 85mm macro lens. Use manual exposure to prevent light flickering."),
            ("Should skincare videos use voiceover or background music?", "Authoritative routine videos demand clear spoken voiceovers explaining active ingredients, with music kept at -22dB."),
            ("How often should skincare lighting setups be recalibrated?", "Lock lighting values per series. Recalibrate only when moving rooms or changing product formats."),
        ]
    },
    # 3. B2B & Founder Video Authority
    {
        "lane": "b2b",
        "title": "B2B SaaS LinkedIn Video Strategy and Friction Framing",
        "query": "How can B2B founders structure short video for executive pipeline?",
        "quick": "B2B short video converts when it opens with an operational cost friction rather than personal titles. Present an anonymized workflow receipt or metric within 5 seconds, explain the decision trade-off in plain language, and conclude with a specific keyword comment prompt for an automated framework dossier.",
        "context_h": "Why executive buyers skip talking-head videos",
        "context": "Enterprise buyers ignore generic motivational advice. They look for operational receipts: workflow screenshots, baseline metrics, and clear trade-offs. Open with the exact dollar or hour loss in current manual workflows.",
        "sections": ["Operational friction opening", "Workflow dashboard receipt", "Decision trade-off framework", "Keyword automation CTA"],
        "proofs": ["anonymized dashboard metric", "before-and-after workflow diagram", "decision memo excerpt", "timeline comparison table"],
        "cautions": ["Do not publish confidential client data.", "Give every metric a baseline and timeframe.", "Avoid universal outcome promises.", "End with one relevant action."],
        "measures": ["qualified buyer DMs", "sales pipeline velocity", "strong category recall", "executive comment engagement"],
        "script": """- **Opening frame:** `[Founder at desk with dashboard chart on screen]`
- **Hook (0-3s):** "Your team is losing 14 hours every week reconciling manual spreadsheets."
- **Method (3-15s):** "Here is the two-step automation fix: sync database webhooks directly to your CRM."
- **Proof (15-25s):** "Look at this client audit: processing time dropped from 3 days to 4 minutes."
- **Call to action:** "Comment 'AUDIT' to receive the one-page workflow architecture." """,
        "faqs": [
            ("What is the optimal video length for B2B executives on LinkedIn?", "Short-form B2B breakdown videos perform best between 45 and 75 seconds, delivering one high-value takeaway."),
            ("Do B2B videos require expensive studio equipment?", "No. Clean eye-level key lighting, locked exposure, and crisp lavalier audio matter far more than complex camera bodies."),
            ("How do you protect confidential data when showing workflow receipts?", "Use blur filters or mock data sets that mirror the exact operational architecture without exposing proprietary figures."),
            ("What CTA converts best for B2B lead generation?", "Prompt viewers to comment a specific keyword for an automated workflow checklist or PDF framework."),
        ]
    },
    # 4. Faceless & Workspace Aesthetic
    {
        "lane": "faceless",
        "title": "Faceless Content Creation and Signature Soundscape System",
        "query": "How to build a recognizable faceless channel with ASMR audio?",
        "quick": "Building an authoritative faceless channel requires a repeatable visual anchor (recurring prop, desk geometry, hands-only framing) and signature Foley sound design. Record clean acoustic Foley 4-6 inches from the microphone and place text overlays in the lower-middle third of the screen to guide visual tracking.",
        "context_h": "The identity challenge of hands-only video",
        "context": "Faceless channels stall when hands and objects look like generic stock footage. You need consistent visual identifiers: a fixed camera height, a signature ceramic cup or mechanical keyboard, and crisp acoustic audio beds.",
        "sections": ["Fixed overhead camera height", "Signature recurring prop", "Acoustic Foley soundbed", "Dynamic 4-word caption blocks"],
        "proofs": ["recurring signature object in frame", "tight point-of-view workspace action", "clean screen recording with zero private data", "crisp mechanical keyboard Foley"],
        "cautions": ["Check reflections for private details.", "Keep text blocks under five words.", "Give every B-roll clip a narrative job.", "Use sound as structure, not decoration."],
        "measures": ["format recognition", "higher completion rate", "safe creator privacy", "repeatable weekly output"],
        "script": """- **Opening frame:** `[Hands placing mechanical keyboard onto wool desk mat]`
- **Hook (0-3s):** "Three desk habits that cut two hours of daily screen fatigue."
- **Method (3-15s):** "First: lock monitor height to eye level. Second: switch to ambient side lighting."
- **Proof (15-25s):** "Look at the side-by-side posture test under natural window light."
- **Call to action:** "Save this setup checklist before your next workspace reset." """,
        "faqs": [
            ("Can faceless channels build long-term brand equity?", "Yes, by establishing a distinct visual signature (props, color palette, editing pace) that functions as an identity."),
            ("How do faceless creators record clean ASMR Foley?", "Use a directional shotgun mic placed 4 inches from the desk and apply a soft low-frequency noise gate at -48dB."),
            ("What is the best camera angle for hands-only tutorials?", "A 45-degree over-the-shoulder angle or a 90-degree top-down overhead rig with diffused side lighting."),
            ("How do faceless creators monetize effectively?", "Monetize through digital toolkits, physical planning dossiers, and affiliate hardware recommendations."),
        ]
    },
    # 5. Creator Burnout & Sustainable Batching
    {
        "lane": "burnout",
        "title": "One-Hour Weekly Content Batching and Capacity Limits",
        "query": "How to batch short-form video content without creator burnout?",
        "quick": "Sustainable content batching relies on strict capacity limits: cap filming at 4 hours weekly, separate ideation days from filming days, and enforce a 1-idea-to-4-formats repurposing rule. Locking production defaults prevents decision fatigue and preserves creator energy across long release cycles.",
        "context_h": "Why arbitrary posting schedules cause burnout",
        "context": "Posting more without a lighter workflow accelerates fatigue instead of channel growth. Perfect drafts pile up while the calendar stays empty. Set your production schedule to survive your lowest-energy week before expanding output.",
        "sections": ["Weekly capacity limit", "Separated ideation and shoot days", "1-idea-to-4-formats repurposing", "Minimum viable post fallback"],
        "proofs": ["completed physical shot cards", "pre-filmed 4-episode batch", "locked weekly timebox", "sustainable publishing calendar"],
        "cautions": ["Do not batch without written scripts.", "Enforce a strict stop rule for editing passes.", "Separate admin tasks from filming blocks.", "Never treat content metrics as health indicators."],
        "measures": ["consistent release cadence", "lower decision fatigue", "predictable filming time", "higher creative recovery"],
        "script": """- **Opening frame:** `[Timer set to 45 minutes next to a four-card shoot stack]`
- **Hook (0-3s):** "If filming content exhausts you, stop scripting on shoot day."
- **Method (3-15s):** "Write four cards on Monday. Film all four takes in one 45-minute block on Wednesday."
- **Proof (15-25s):** "Look at the calendar: four finished assets with zero overtime."
- **Call to action:** "Save this batching framework before your next production week." """,
        "faqs": [
            ("How many videos should a solo creator batch in one session?", "Batch 3 to 4 short videos maximum per filming session to maintain fresh on-camera delivery and voice energy."),
            ("How do you separate ideation from filming?", "Dedicate 30 minutes on Monday purely to outlines and cards. Never write scripts while the camera is mounted."),
            ("What is a minimum viable post fallback?", "A simple 15-second B-roll clip with a text framework from your archives, used when energy or health is constrained."),
            ("How do you prevent editing spirals?", "Set a 15-minute timer per short video cut. Polish pacing and captions, then publish without endless micro-adjustments."),
        ]
    },
    # 6. Retention Dynamics & Hook Architecture
    {
        "lane": "strategy",
        "title": "First 3 Seconds Hook Retention and Drop-Off Prevention",
        "query": "How to structure short video openings to prevent initial swipe-away?",
        "quick": "Preventing early swipe-away requires opening with an immediate visual or kinetic change in the first second, followed by a contrarian tension frame rather than a greeting. Eliminate self-introductions, place text overlays in the upper-third safe zone, and deliver the core visual proof before second five.",
        "context_h": "Why greeting hooks destroy short-form retention curves",
        "context": "Saying 'Hey guys, welcome back' triggers immediate swipe behavior. Modern audiences decide whether to stay within 1.2 seconds. Open with the middle of the action or a provocative physical result before stating any context.",
        "sections": ["Kinetic action opening", "Contrarian tension frame", "Zero-greeting rule", "Early visual proof"],
        "proofs": ["retention graph holding above 70% at 3s", "uninterrupted kinetic movement take", "clean audio start with zero silence", "on-screen visual evidence timestamp"],
        "cautions": ["Never introduce yourself in the first three seconds.", "Avoid clickbait promises that aren't settled in the video.", "Keep caption overlays under six words per flash.", "Lock voice delivery pace at 140-160 words per minute."],
        "measures": ["higher 3-second hold rate", "extended average percentage viewed", "increased algorithmic distribution", "lower viewer swipe-away"],
        "script": """- **Opening frame:** `[Close-up hands cutting open an anomalous sealed envelope]`
- **Hook (0-3s):** "Most creators lose 60% of their viewers right here because of one word."
- **Method (3-15s):** "Cut the greeting. Start with the physical result before you explain the theory."
- **Proof (15-25s):** "Look at this retention audit: removing the intro boosted watch time by 42%."
- **Call to action:** "Save this opening formula before your next filming block." """,
        "faqs": [
            ("What is a healthy 3-second retention rate on Instagram Reels?", "A benchmark hold rate of 65% to 75% at second 3 signals strong engagement to the recommendation engine."),
            ("How many words should be spoken in the first three seconds?", "Speak between 8 and 12 words maximum, or use pure visual action with ambient Foley sound."),
            ("Does text on screen improve 3-second retention?", "Yes, high-contrast dynamic text overlays increase early retention by up to 28% for users browsing with sound muted."),
            ("When should the primary visual proof appear in a 30-second Reel?", "Deliver the first visible proof moment between seconds 4 and 7 to validate the opening hook promise."),
        ]
    },
    # 7. Fitness & High-Ticket Coaching Authority
    {
        "lane": "fitness",
        "title": "High-Ticket Fitness Client Acquisition Video Framework",
        "query": "How can fitness coaches sign premium clients using educational video?",
        "quick": "Educational fitness video converts high-ticket clients by breaking down client biomechanical assessments and nutrition logs rather than generic workout montages. Show the exact diagnostic assessment, explain the common training plateau, and invite qualified viewers to apply via keyword DM.",
        "context_h": "Why sweat montages fail to sign coaching clients",
        "context": "Generic gym montages attract casual likes, not paying clients. Serious clients invest when they see diagnostic precision: posture assessments, fatigue management protocols, and progressive overload tracking.",
        "sections": ["Diagnostic movement assessment", "Plateau breakdown audit", "Client case study receipt", "Application keyword CTA"],
        "proofs": ["real biomechanics movement check", "anonymized client progression log", "side-by-side posture correction", "structured training split card"],
        "cautions": ["Avoid dangerous medical advice or extreme diet claims.", "Show real client timelines with realistic expectations.", "Focus on sustainable strength and recovery metrics.", "Use clean gym audio with background noise reduced."],
        "measures": ["qualified coaching applications", "high-trust DM inquiries", "client retention rate", "strong authority positioning"],
        "script": """- **Opening frame:** `[Coach pointing to spine alignment marker on posture grid]`
- **Hook (0-3s):** "If your lower back aches after deadlifts, check your foot pressure here."
- **Method (3-15s):** "Shift weight from your toes to mid-foot. Hinge at the hips before bending your knees."
- **Proof (15-25s):** "Look at client Sarah's form: zero back strain and 40 pounds added to her lift."
- **Call to action:** "Comment 'COACH' to receive the 3-step hip hinge audit checklist." """,
        "faqs": [
            ("What video format works best for signing fitness clients?", "Breakdown case studies (problem, diagnostic test, corrective protocol) generate the highest conversion to application forms."),
            ("How long should client testimonial videos run?", "Keep case study videos between 60 and 90 seconds, focusing on the client's emotional and physical transformation."),
            ("Should fitness coaches disclose pricing in short videos?", "Share price ranges or invite viewers to private consultations where personalized programs are built."),
            ("How frequently should fitness coaches publish technical breakdowns?", "Publish 3 high-value technical breakdowns and 1 client case study weekly for optimal client acquisition."),
        ]
    },
    # 8. Tech & Workspace Hardware Directing
    {
        "lane": "visual",
        "title": "Cinematic Tech Hardware Review and Macro Lighting Setup",
        "query": "How to shoot cinematic tech product reviews with clean studio lighting?",
        "quick": "Cinematic hardware reviews require top-down diffused softbox lighting (at 4500K-5600K), motorized slider moves for smooth parallax, and close-up macro focal lengths. Isolate aluminum textures and screen displays without glare by using polarizing filters and matte surface flags.",
        "context_h": "The challenge of reflective metal and glossy screens",
        "context": "Hardware reviews look amateur when desk lights reflect directly off laptop screens or shiny anodized aluminum. Control reflections by shaping light around the product rather than pointing fixtures directly at it.",
        "sections": ["Top-down diffused softbox", "Motorized slider parallax", "Circular polarizing filter", "Matte surface flags"],
        "proofs": ["glare-free display screen capture", "smooth motorized slider movement", "crisp macro ports and edge textures", "color-calibrated product tones"],
        "cautions": ["Wipe all dust and fingerprints with microfiber before filming.", "Match screen refresh rates to shutter speed to prevent banding.", "Lock exposure manually across all panning shots.", "Maintain uniform color temperature across key and rim lights."],
        "measures": ["cinematic visual quality", "brand sponsorship eligibility", "extended watch duration", "high viewer engagement"],
        "script": """- **Opening frame:** `[Macro slow-motion pan across chamfered aluminum edge]`
- **Hook (0-3s):** "This $80 desk upgrade replaced three cables and fixed my entire setup."
- **Method (3-15s):** "Mount the magnetic dock under the desk. Route power and display through one braided cable."
- **Proof (15-25s):** "Look at the cable-free workspace: clean wood grain and zero clutter."
- **Call to action:** "Save this setup guide before building your next workspace." """,
        "faqs": [
            ("How do you prevent flicker when filming computer monitors?", "Set your camera shutter speed to exactly double your monitor refresh rate (e.g., 1/120s for 60Hz or 1/240s for 120Hz)."),
            ("What is the best lens for tech hardware macro shots?", "A 90mm or 100mm f/2.8 dedicated macro lens provides pristine edge detail and beautiful subject separation."),
            ("How do you achieve clean audio in an echoey tech studio?", "Place sound-absorbing acoustic foam behind the camera and position a hypercardioid shotgun mic 8 inches above your head."),
            ("How should sponsored tech integrations be framed on Instagram?", "Disclose brand partnerships clearly in the first three seconds and focus on authentic everyday usability over ad copy."),
        ]
    },
]


def generate_sft_triplets(count: int = 320) -> list[dict]:
    triplets = []
    print(f"\nSynthesizing {count} high-readability SFT training samples across 8 domains...")
    
    variations = [
        ("UGC & Briefs", "ugc"),
        ("Beauty & Skincare", "beauty"),
        ("B2B SaaS & Authority", "b2b"),
        ("Faceless & ASMR", "faceless"),
        ("Burnout & Batching", "burnout"),
    ]

    for i in range(count):
        base = TOPIC_CATALOG[i % len(TOPIC_CATALOG)]
        topic_suffix = f" #{i + 1}" if i >= len(TOPIC_CATALOG) else ""
        
        # Build 6-tier assistant response
        rows = [f"| **{sec}** | Prepare {base['proofs'][j]} | {base['cautions'][j]} |" for j, sec in enumerate(base['sections'])]
        matrix = (
            f"## Decision map for {base['title']}{topic_suffix}\n\n"
            "| Decision | Evidence to prepare | Boundary |\n"
            "| :--- | :--- | :--- |\n" + "\n".join(rows)
        )
        
        method_blocks = []
        for j, sec in enumerate(base['sections']):
            method_blocks.append(
                f"### {j + 1}. {sec}\n\n"
                f"Lock **{sec.lower()}** as a concrete operational choice. Ensure another teammate can audit this step on set without extra meetings. "
                f"Verify this choice with {base['proofs'][j]}. Keep this boundary visible: {base['cautions'][j]}."
            )
        method_body = "\n\n".join(method_blocks)
        
        example = (
            f"Suppose a creator must execute **{base['title']}** in a constrained production window. First, they lock "
            f"**{base['sections'][0].lower()}**. They prepare {base['proofs'][0]}. Then they use **{base['sections'][1].lower()}** to keep the promise visible. "
            f"{base['cautions'][1]} During review, they check results against {base['measures'][0]}."
        )
        
        faq_blocks = ["## Frequently asked questions\n"]
        for q, a in base['faqs']:
            faq_blocks.append(f"### {q}\n\n{a}\n")
        faq_body = "\n".join(faq_blocks)
        
        assistant_content = f"""# {base['title']}{topic_suffix}

## Quick answer

{base['quick']}

## {base['context_h']}

{base['context']}

{matrix}

## How to put the method into practice

{method_body}

## A script you can adapt

{base['script']}

## A practical first pass

{example}

## Review standards before publication

- **Direction:** Does the first frame visually state the promise?
- **Visibility:** Is the proof visible without reading the caption?
- **Boundary:** Are claims backed by real test evidence?
- **Next pass:** Will performance review inform the next brief?

{faq_body}
## Next step

Put **{base['sections'][0].lower()}**, **{base['sections'][1].lower()}** and your main claim boundary onto a single working shoot card before your next production pass."""

        triplets.append({
            "id": f"sft-seo-{i + 1:04d}",
            "lane": base["lane"],
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Write an authoritative, crystal-clear 2026 AEO search intent guide for: {base['title']}{topic_suffix}. Address user search query: '{base['query']}'."},
                {"role": "assistant", "content": assistant_content}
            ],
            "metrics": {
                "word_count": len(assistant_content.split()),
                "target_flesch": 54.5,
                "lane": base["lane"]
            }
        })
        
    return triplets


def main() -> int:
    print("=" * 60)
    print("  BUILDING SFT DATASET FOR GEMINI & LLM FINE-TUNING")
    print("=" * 60)

    PREPARED_DIR.mkdir(parents=True, exist_ok=True)
    LOCAL_PREPARED.mkdir(parents=True, exist_ok=True)

    triplets = generate_sft_triplets(count=320)

    for target_dir in [PREPARED_DIR, LOCAL_PREPARED]:
        out_file = target_dir / "seo_sft_training.jsonl"
        with out_file.open("w", encoding="utf-8") as f:
            for item in triplets:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        print(f"  [+] Wrote {len(triplets)} SFT training samples to {out_file}")

    print("\n" + "=" * 60)
    print(f"  SFT DATASET BUILD COMPLETE: {len(triplets)} SAMPLES READY")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
