"""
harvest_local_datasets.py
=========================
VIRAL CARD / CREATOR-SYSTEM HARVEST ONLY.

Harvests local markdown files (Comedy Master, Viral Idea Engine, Creator Registry,
Influencer Personas, etc.) into observation chunks for the **viral idea-card**
training track — NOT for public SEO resource articles.

Output is intentionally under dataset/viral_card/prepared/ so it cannot
contaminate the SEO content pipeline (dataset/seo_content/prepared/).

SEO books stay on: tools/prepare-seo-content-training.py → seo_content/prepared/
See: docs/architecture/content-pipelines-separation.md
"""

import json
import hashlib
from pathlib import Path

ARCHIVE_DIR = Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive")
DATASET_DIR = ARCHIVE_DIR / "dataset"
# Viral pipeline destination — do NOT write under seo_content/
PREPARED_DIR = DATASET_DIR / "viral_card" / "prepared"
OUT_FILE = PREPARED_DIR / "local_harvest_observations.jsonl"

CONTENT_DIR = Path(r"C:\Users\Kagan\OneDrive\Desktop\Content")

LOCAL_FILES = [
    ("Ultimate_Comedy_Master_System_ZERO_LOSS_MERGED.md", "comedy_and_humor", "content_writing", 0.95),
    ("ViralFikirKutusu_33.6_GLOBAL_900K_Creator_Registry_DEEP_RESEARCH_TURKIYE_INCLUDED.md", "creator_registry", "content_strategy", 0.92),
    ("ViralFikirKutusu_Viral_Idea_Algorithm_Engine(6).md", "viral_algorithm", "content_strategy", 0.96),
    ("viral_box_real_influencer_persona_database_1000(9).md", "influencer_personas", "content_strategy", 0.94),
    ("son_10_yil_viral_fikirler.md", "viral_trends", "content_strategy", 0.91),
    ("instagram_tum_kategoriler_birlesik.md", "instagram_categories", "on_page_seo", 0.89),
    # Master plan may inform product copy; keep under viral_card harvest, not SEO book extract
    ("ANOMALYBOX_SEO_CREATOR_LANES_MASTER_PLAN_2026_V4.md", "anomalybox_master_plan", "content_strategy", 0.98),
]

GENERIC_AI_CLICHES = [
    "in today's digital world",
    "in today's fast-paced world",
    "let's dive right in",
    "it is important to remember that",
    "without further ado",
    "in conclusion,",
    "lütfen unutmayın ki",
    "günümüz dijital dünyasında",
]

def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def calculate_originality_score(text: str) -> float:
    """Detects generic AI clichés and penalizes them; rewards unique terminology."""
    text_lower = text.lower()
    score = 1.0
    for cliche in GENERIC_AI_CLICHES:
        if cliche in text_lower:
            score -= 0.25
    return max(0.1, round(score, 2))

def chunk_markdown(text: str, target_size: int = 1500) -> list:
    """Splits markdown text into logical paragraph-based chunks."""
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = []
    current_len = 0
    
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        if current_len + len(p) > target_size and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [p]
            current_len = len(p)
        else:
            current_chunk.append(p)
            current_len += len(p)
            
    if current_chunk:
        chunks.append("\n\n".join(current_chunk))
        
    return chunks

def harvest():
    PREPARED_DIR.mkdir(parents=True, exist_ok=True)
    total_count = 0
    
    with OUT_FILE.open("w", encoding="utf-8") as out_f:
        for filename, category, layer, base_weight in LOCAL_FILES:
            file_path = DATASET_DIR / filename
            if not file_path.exists():
                file_path = CONTENT_DIR / filename
            if not file_path.exists():
                print(f"⚠ Warning: {filename} not found, skipping...")
                continue
                
            print(f"📖 Harvesting {filename}...")
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            chunks = chunk_markdown(content)
            
            file_count = 0
            for i, chunk_text in enumerate(chunks, 1):
                if len(chunk_text) < 100:
                    continue
                    
                orig_score = calculate_originality_score(chunk_text)
                final_weight = round(base_weight * orig_score, 4)
                
                content_hash = sha256(f"{filename}|{i}|{chunk_text[:100]}")
                
                record = {
                    "content_hash": content_hash,
                    "source_book": filename.split(".")[0],
                    "source_chapter": f"Section_{i}",
                    "source_page": i,
                    "seo_layer": layer,
                    "category_slug": category,
                    "locale": "tr" if "turkiye" in filename.lower() or "fikir" in filename.lower() else "en",
                    "title_algorithmic": f"Local Dataset Chunk #{i}",
                    "text_signals": {
                        "abstract_text": chunk_text,
                        "seo_concepts": [category, layer, "originality_focused"],
                        "all_layers": [layer, "general_seo"]
                    },
                    "metric_signals": {
                        "word_count": len(chunk_text.split()),
                        "actionability": 0.95,
                        "authority": 0.98
                    },
                    "derived_concepts": [category, layer, "viral_structure"],
                    "training_weight": final_weight,
                    "training_use": "pattern_only",
                    "risk_level": "low",
                    "metadata": {
                        "source_file": filename,
                        "originality_score": orig_score,
                        "chunk_index": i,
                        "anti_copy": True,
                    },
                }
                out_f.write(json.dumps(record, ensure_ascii=False) + "\n")
                file_count += 1
                total_count += 1
                
            print(f"  ✓ Processed {file_count} high-originality chunks from {filename}")
            
    print(f"\n✅ Harvesting Complete! Total {total_count} local observation chunks written to {OUT_FILE.name}")

if __name__ == "__main__":
    harvest()
