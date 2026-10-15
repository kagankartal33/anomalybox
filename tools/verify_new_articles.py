from pathlib import Path

ROOT = Path(r"c:\Users\Kagan\OneDrive\Desktop\ViralBox")
RESOURCES_DIR = ROOT / "content" / "resources"

NEW_SLUGS = [
    "why-reels-get-stuck-at-200-views-creative-audit",
    "first-3-seconds-hook-retention-framework",
    "why-similar-videos-perform-differently-distribution-audit",
    "creator-decision-fatigue-and-burnout-solution",
    "ai-slop-vs-human-authenticity-for-creators",
    "format-utility-decision-matrix-reels-vs-carousels",
    "save-worthy-vs-share-worthy-content-mechanics",
    "how-many-followers-from-1m-views-conversion-funnel",
    "viral-video-aftermath-how-to-capitalize-on-breakout-reach",
    "creator-pricing-packages-retainers-calculation-guide",
    "usage-rights-whitelisting-revisions-brand-deal-guide",
    "ugc-portfolio-first-paid-deal-conversion-playbook",
    "b2b-expert-linkedin-to-instagram-video-playbook",
    "faceless-content-authenticity-and-monetization-guide",
]

print("=== CHECKING NEW ARTICLE FILES ===")
all_ok = True
for slug in NEW_SLUGS:
    path = RESOURCES_DIR / f"{slug}.md"
    if path.exists():
        word_count = len(path.read_text(encoding="utf-8").split())
        print(f"[OK] {slug} ({word_count} words)")
    else:
        print(f"[MISSING] {slug}")
        all_ok = False

print(f"\nAll 14 articles verified: {all_ok}")
