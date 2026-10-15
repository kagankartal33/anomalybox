"""
sync_content_to_nextjs.py
=========================
Copies all 112 World-Class generated Markdown files from
ViralBox-training-archive/world_class_output to ViralBox/content/resources/
slugged matching names so Next.js can render the full content dynamically.
"""

import os
import shutil
from pathlib import Path

SOURCE_DIR = Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\world_class_output")
DEST_DIR = Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox\content\resources")

def sync():
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    count = 0
    
    for file_path in SOURCE_DIR.glob("*_world_class.md"):
        # Slugify filename by removing _world_class.md
        slug = file_path.name.replace("_world_class.md", "") + ".md"
        dest_file = DEST_DIR / slug
        shutil.copy(file_path, dest_file)
        count += 1
        
    print(f"✅ Successfully synced {count} World-Class markdown content files to {DEST_DIR}")

if __name__ == "__main__":
    sync()
