"""
generate_white_favicon.py
===========================
Generates crisp, high-resolution favicons with a pure white background
to ensure the logo stands out sharply on dark and light browser tabs alike.
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "public"
APP_DIR = ROOT / "app"

# Source logo image
source_path = PUBLIC_DIR / "logo.png"
if not source_path.exists():
    source_path = PUBLIC_DIR / "favicon.png"

print(f"Loading source logo from: {source_path}")
logo_img = Image.open(source_path).convert("RGBA")

# Create 512x512 base canvas with white background
size = 512
canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))

# Draw white rounded rectangle background for the icon badge
draw = ImageDraw.Draw(canvas)
corner_radius = 90
draw.rounded_rectangle([(0, 0), (size, size)], radius=corner_radius, fill=(255, 255, 255, 255))

# Resize logo to fit with comfortable padding (80% of canvas)
padding = 45
target_size = size - (padding * 2)

# Maintain aspect ratio
logo_w, logo_h = logo_img.size
aspect = logo_w / logo_h

if aspect > 1:
    new_w = target_size
    new_h = int(target_size / aspect)
else:
    new_h = target_size
    new_w = int(target_size * aspect)

logo_resized = logo_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

# Paste logo centered onto white background
offset_x = (size - new_w) // 2
offset_y = (size - new_h) // 2
canvas.paste(logo_resized, (offset_x, offset_y), logo_resized)

# Convert to RGB / PNG with solid white background
final_512 = Image.new("RGB", (size, size), (255, 255, 255))
final_512.paste(canvas, (0, 0), canvas)

# Save outputs
print("Saving updated white-surrounded favicons...")

# 1. public/favicon.png (512x512)
final_512.save(PUBLIC_DIR / "favicon.png", "PNG")

# 2. app/icon.png (512x512)
final_512.save(APP_DIR / "icon.png", "PNG")

# 3. public/logo.png (512x512)
final_512.save(PUBLIC_DIR / "logo.png", "PNG")

# 4. public/favicon-32.png (32x32)
fav32 = final_512.resize((32, 32), Image.Resampling.LANCZOS)
fav32.save(PUBLIC_DIR / "favicon-32.png", "PNG")

# 5. public/favicon-48.png (48x48)
fav48 = final_512.resize((48, 48), Image.Resampling.LANCZOS)
fav48.save(PUBLIC_DIR / "favicon-48.png", "PNG")

# 6. public/apple-touch-icon.png (180x180)
apple_icon = final_512.resize((180, 180), Image.Resampling.LANCZOS)
apple_icon.save(PUBLIC_DIR / "apple-touch-icon.png", "PNG")

# 7. public/favicon.ico (Multi-size ICO)
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
final_512.save(PUBLIC_DIR / "favicon.ico", format="ICO", sizes=ico_sizes)

print("[SUCCESS] All favicons successfully re-generated with white background!")
