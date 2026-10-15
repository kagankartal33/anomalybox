from pathlib import Path

ROOT = Path(r"c:\Users\Kagan\OneDrive\Desktop\ViralBox")
LEGACY_DIR = ROOT / "public" / "assets" / "legacy-resources"

NEW_SLUGS = [
    ("why-reels-get-stuck-at-200-views-creative-audit", "200-View Cohort Drop-Off Diagnostic", "Hook Pacing & Retention Architecture"),
    ("first-3-seconds-hook-retention-framework", "Multi-Sensory Hook Triad Framework", "Visual, Audio & Text Synchronicity"),
    ("why-similar-videos-perform-differently-distribution-audit", "Distribution Divergence Analysis", "Sub-Second Pacing & Completion Variables"),
    ("creator-decision-fatigue-and-burnout-solution", "Pre-Decided Shot List Directing System", "Cognitive Friction & Batching Flow"),
    ("ai-slop-vs-human-authenticity-for-creators", "Voice Preservation & Anti-Slop Guardrails", "Human Texture in the Algorithmic Era"),
    ("format-utility-decision-matrix-reels-vs-carousels", "Format Utility Decision Router", "Information Job Matching (Video vs Slide vs Text)"),
    ("save-worthy-vs-share-worthy-content-mechanics", "Save vs Share Directing Architecture", "Intra-Personal Utility & Social Currency"),
    ("how-many-followers-from-1m-views-conversion-funnel", "Breakout View-to-Follower Funnel", "Profile Positioning & Bio Alignment Architecture"),
    ("viral-video-aftermath-how-to-capitalize-on-breakout-reach", "72-Hour Viral Momentum Playbook", "Algorithmic Retention & Sequel Briefs"),
    ("creator-pricing-packages-retainers-calculation-guide", "Commercial Pricing & Retainer Formula", "Economic Creation Value (ECV) Calculation"),
    ("usage-rights-whitelisting-revisions-brand-deal-guide", "Contract Protection & Usage Terms Guide", "Whitelisting, Perpetual Rights & Revision Caps"),
    ("ugc-portfolio-first-paid-deal-conversion-playbook", "Direct-Response UGC Pitch Playbook", "High-Converting Portfolio Architecture"),
    ("b2b-expert-linkedin-to-instagram-video-playbook", "B2B Authority Video Conversion System", "45-Second Knowledge Simplification"),
    ("faceless-content-authenticity-and-monetization-guide", "Privacy-First Faceless Directing Blueprint", "Tactile Macro Framing & Acoustic ASMR"),
]

missing = []
for slug, title, subtitle in NEW_SLUGS:
    svg_path = LEGACY_DIR / f"{slug}.svg"
    if not svg_path.exists():
        missing.append((slug, title, subtitle))
    else:
        print(f"[FOUND] {slug}.svg ({svg_path.stat().st_size} bytes)")

print(f"\nMissing SVGs: {len(missing)}")
