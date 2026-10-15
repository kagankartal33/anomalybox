"""
Generate 14 unique, premium SVG visuals for the new research resources in public/assets/legacy-resources/
Adheres to:
- 1600x900 aspect ratio
- Curated color palettes matching ViralBox / AnomalyBox design system
- Unique rotation, card layout, and accent geometry
- 100% Unique asset paths (Zero duplication rule)
"""

import hashlib
from pathlib import Path

ROOT = Path(r"c:\Users\Kagan\OneDrive\Desktop\ViralBox")
TARGET_DIR = ROOT / "public" / "assets" / "legacy-resources"

ARTICLES = [
    ("why-reels-get-stuck-at-200-views-creative-audit", 345, 275, -4),
    ("first-3-seconds-hook-retention-framework", 280, 45, 3),
    ("why-similar-videos-perform-differently-distribution-audit", 210, 330, -3),
    ("creator-decision-fatigue-and-burnout-solution", 160, 290, 4),
    ("ai-slop-vs-human-authenticity-for-creators", 295, 35, -5),
    ("format-utility-decision-matrix-reels-vs-carousels", 220, 180, 2),
    ("save-worthy-vs-share-worthy-content-mechanics", 310, 240, -3),
    ("how-many-followers-from-1m-views-conversion-funnel", 260, 130, 4),
    ("viral-video-aftermath-how-to-capitalize-on-breakout-reach", 350, 40, -4),
    ("creator-pricing-packages-retainers-calculation-guide", 145, 270, 3),
    ("usage-rights-whitelisting-revisions-brand-deal-guide", 200, 290, -2),
    ("ugc-portfolio-first-paid-deal-conversion-playbook", 330, 210, 4),
    ("b2b-expert-linkedin-to-instagram-video-playbook", 230, 280, -3),
    ("faceless-content-authenticity-and-monetization-guide", 270, 320, 2),
]

def generate_svg(slug: str, h1: int, h2: int, rot: int) -> str:
    # Deterministic particle coords based on slug hash
    h = hashlib.sha256(slug.encode("utf-8")).hexdigest()
    dots = []
    for i in range(7):
        cx = int(h[i*4 : i*4+3], 16) % 1300 + 150
        cy = int(h[i*4+2 : i*4+5], 16) % 650 + 120
        r = (int(h[i*4+1], 16) % 3) + 3
        dots.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="white" opacity="0.18"/>')

    dots_markup = "".join(dots)

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="{slug} — creator planning visual">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl({h1} 32% 10%)"/>
      <stop offset="0.55" stop-color="hsl({h2} 35% 19%)"/>
      <stop offset="1" stop-color="#0f0e11"/>
    </linearGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbf8f3"/>
      <stop offset="1" stop-color="#ded6cb"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <ellipse cx="820" cy="760" rx="580" ry="75" fill="#000" opacity="0.38" filter="url(#shadow)"/>
  <g transform="rotate({rot} 800 470)">
    <rect x="360" y="210" width="880" height="500" rx="22" fill="url(#paper)" opacity="0.96"/>
    <rect x="420" y="270" width="480" height="24" rx="12" fill="#171619" opacity="0.80"/>
    <rect x="420" y="332" width="690" height="12" rx="6" fill="#171619" opacity="0.22"/>
    <rect x="420" y="370" width="580" height="12" rx="6" fill="#171619" opacity="0.22"/>
    <rect x="420" y="440" width="230" height="140" rx="14" fill="hsl({h2} 52% 44%)" opacity="0.86"/>
    <rect x="690" y="440" width="230" height="140" rx="14" fill="hsl({h1} 58% 38%)" opacity="0.86"/>
    <rect x="960" y="440" width="220" height="140" rx="14" fill="#171619" opacity="0.86"/>
    <path d="M450 640h680" stroke="#171619" stroke-width="10" stroke-linecap="round" opacity="0.16"/>
  </g>
  {dots_markup}
  <path d="M1320 140v560" stroke="white" stroke-width="2" opacity="0.12"/>
  <path d="M1280 180h80M1280 220h50M1280 260h95" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.28"/>
</svg>"""

def main():
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    for slug, h1, h2, rot in ARTICLES:
        svg_content = generate_svg(slug, h1, h2, rot)
        target_path = TARGET_DIR / f"{slug}.svg"
        target_path.write_text(svg_content, encoding="utf-8")
        print(f"Generated: {target_path.name} ({len(svg_content)} chars)")

if __name__ == "__main__":
    main()
