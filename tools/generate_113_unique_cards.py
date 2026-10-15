"""
generate_113_unique_cards.py
==============================
Generates 113 unique high-resolution SVG visual card covers in public/assets/resource-cards/[slug].svg
Guarantees 100% visual uniqueness so no two resource cards share the same image file.
"""

import os
import re
import math
from pathlib import Path

RESOURCES_DIR = Path(r"c:\Users\Kagan\OneDrive\Desktop\ViralBox\content\resources")
OUTPUT_DIR = Path(r"c:\Users\Kagan\OneDrive\Desktop\ViralBox\public\assets\resource-cards")

COLOR_PALETTES = [
    ("#0F172A", "#1E293B", "#38BDF8", "#F0F9FF"), # Slate & Cyber Sky
    ("#18181B", "#27272A", "#A855F7", "#FAF5FF"), # Dark Violet & Purple
    ("#1C1917", "#292524", "#F97316", "#FFF7ED"), # Amber & Warm Slate
    ("#064E3B", "#047857", "#34D399", "#ECFDF5"), # Emerald & Mint
    ("#881337", "#9F1239", "#FB7185", "#FFF1F2"), # Crimson & Rose
    ("#1E1B4B", "#312E81", "#818CF8", "#EEF2FF"), # Indigo & Night
    ("#451A03", "#78350F", "#FBBF24", "#FEF3C7"), # Gold & Bronze
    ("#134E4A", "#0D9488", "#2DD4BF", "#F0FDFA"), # Teal & Aquamarine
]

def hash_string(s: str) -> int:
    h = 0
    for ch in s:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h

def generate_svg(slug: str, title: str) -> str:
    h_val = hash_string(slug)
    palette = COLOR_PALETTES[h_val % len(COLOR_PALETTES)]
    bg_dark, bg_mid, accent, text_light = palette
    
    # Generate unique geometry parameters based on slug hash
    circle_x = 100 + (h_val % 400)
    circle_y = 80 + ((h_val >> 3) % 250)
    circle_r = 120 + ((h_val >> 5) % 180)
    
    rect_rot = (h_val % 45) - 20
    grid_opacity = 0.05 + ((h_val % 10) / 100.0)
    
    clean_title = re.sub(r'[^a-zA-Z0-9 ]', '', title).upper()
    words = clean_title.split()
    line1 = " ".join(words[:3]) if len(words) >= 3 else clean_title
    line2 = " ".join(words[3:7]) if len(words) > 3 else ""

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{bg_dark}" />
      <stop offset="100%" stop-color="{bg_mid}" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{accent}" stop-opacity="0.8" />
      <stop offset="100%" stop-color="{accent}" stop-opacity="0.2" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FFFFFF" stroke-opacity="{grid_opacity}" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="800" height="450" fill="url(#bgGrad)" />
  <rect width="800" height="450" fill="url(#grid)" />

  <!-- Abstract Geometry -->
  <circle cx="{circle_x}" cy="{circle_y}" r="{circle_r}" fill="{accent}" opacity="0.15" />
  <rect x="500" y="50" width="220" height="220" rx="24" fill="none" stroke="{accent}" stroke-width="2" opacity="0.3" transform="rotate({rect_rot} 610 160)" />

  <!-- Content Container -->
  <g transform="translate(60, 220)">
    <!-- Accent Pill -->
    <rect x="0" y="-120" width="180" height="32" rx="16" fill="url(#accentGrad)" />
    <text x="16" y="-99" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#FFFFFF" letter-spacing="1.5">ANOMALYBOX DOSSIER</text>

    <!-- Title Lines -->
    <text x="0" y="-30" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="800" fill="#FFFFFF" letter-spacing="-0.5">{line1}</text>
    <text x="0" y="15" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="{accent}" letter-spacing="-0.5">{line2}</text>
    
    <!-- Footer Subtitle -->
    <text x="0" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#94A3B8" letter-spacing="0.5">Physical Creative Direction &amp; Shoot-Ready Specification</text>
  </g>

  <!-- Decorative Corner Icon -->
  <g transform="translate(710, 360)">
    <circle cx="20" cy="20" r="24" fill="{accent}" opacity="0.2"/>
    <path d="M12 20 L28 20 M20 12 L20 28" stroke="{accent}" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>"""
    return svg

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    files = list(RESOURCES_DIR.glob("*.md"))
    print(f"Generating {len(files)} unique SVG visual cards...")
    
    count = 0
    for f in files:
        slug = f.stem
        title = slug.replace("-", " ").title()
        
        # Read actual title if present
        lines = f.read_text(encoding="utf-8").splitlines()
        for l in lines:
            if l.startswith("# "):
                title = l.replace("# ", "").strip()
                break

        svg_content = generate_svg(slug, title)
        out_path = OUTPUT_DIR / f"{slug}.svg"
        out_path.write_text(svg_content, encoding="utf-8")
        count += 1
        
    print(f"SUCCESS: Generated {count} dedicated unique SVG visual cards in public/assets/resource-cards/")

if __name__ == "__main__":
    main()
