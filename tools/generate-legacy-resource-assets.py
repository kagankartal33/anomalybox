"""Create lightweight, unique fallback editorial visuals for legacy resources.

The 112 premium package pages use supplied photographic WebP assets. Legacy
resource pages receive a restrained, text-free studio illustration so every
public canonical URL has a crawlable, unique image without reusing stock art.
"""
from __future__ import annotations

import hashlib
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "legacy-resources"
RESOURCES = ROOT / "content" / "resources"


def svg_for(slug: str) -> str:
    digest = hashlib.sha256(slug.encode("utf-8")).hexdigest()
    hue = int(digest[:4], 16) % 360
    accent = int(digest[4:8], 16) % 360
    tilt = int(digest[8:12], 16) % 18 - 9
    dots = []
    for index in range(7):
        x = 140 + (int(digest[12 + index * 3 : 15 + index * 3], 16) % 1240)
        y = 120 + (int(digest[33 - index * 2 : 36 - index * 2], 16) % 560)
        dots.append(f'<circle cx="{x}" cy="{y}" r="{3 + index % 3}" fill="white" opacity="0.18"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="Premium creator planning visual">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl({hue} 28% 9%)"/>
      <stop offset="0.55" stop-color="hsl({accent} 31% 18%)"/>
      <stop offset="1" stop-color="#111012"/>
    </linearGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8f4ee"/>
      <stop offset="1" stop-color="#d8d0c5"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="20"/></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <ellipse cx="820" cy="760" rx="570" ry="70" fill="#000" opacity="0.36" filter="url(#shadow)"/>
  <g transform="rotate({tilt} 800 470)">
    <rect x="360" y="210" width="880" height="500" rx="20" fill="url(#paper)" opacity="0.96"/>
    <rect x="420" y="270" width="470" height="22" rx="11" fill="#171619" opacity="0.78"/>
    <rect x="420" y="332" width="690" height="12" rx="6" fill="#171619" opacity="0.2"/>
    <rect x="420" y="370" width="580" height="12" rx="6" fill="#171619" opacity="0.2"/>
    <rect x="420" y="440" width="230" height="140" rx="14" fill="hsl({accent} 50% 42%)" opacity="0.84"/>
    <rect x="690" y="440" width="230" height="140" rx="14" fill="hsl({hue} 56% 36%)" opacity="0.84"/>
    <rect x="960" y="440" width="220" height="140" rx="14" fill="#171619" opacity="0.84"/>
    <path d="M450 640h680" stroke="#171619" stroke-width="10" stroke-linecap="round" opacity="0.16"/>
  </g>
  {''.join(dots)}
  <path d="M1320 140v560" stroke="white" stroke-width="2" opacity="0.12"/>
  <path d="M1280 180h80M1280 220h50M1280 260h95" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.28"/>
</svg>'''


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    files = sorted(RESOURCES.glob("*.md"))
    for path in files:
        slug = path.stem
        (OUT / f"{slug}.svg").write_text(svg_for(slug), encoding="utf-8")
    print(f"generated {len(files)} legacy resource visuals in {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())