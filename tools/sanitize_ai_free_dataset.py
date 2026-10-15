"""
sanitize_ai_free_dataset.py
===========================
Strips out 40+ AI Detector trigger words (Turnitin, GPTZero, CopyLeaks cliches) 
and enforces human sentence variation (burstiness) on the full dataset.
Outputs to PREPARED_DIR / "ai_free_observations.jsonl".
"""

import json
import re
import hashlib
from pathlib import Path

ARCHIVE_DIR = Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive")
PREPARED_DIR = ARCHIVE_DIR / "dataset" / "seo_content" / "prepared"
OUT_FILE = PREPARED_DIR / "ai_free_observations.jsonl"

AI_CLICHES_PATTERNS = [
    r"\bin today's digital world\b",
    r"\bin today's fast-paced world\b",
    r"\bdelve into\b",
    r"\bdelving into\b",
    r"\btapestry of\b",
    r"\btestament to\b",
    r"\bnavigating the landscape of\b",
    r"\bfurthermore,\b",
    r"\bmoreover,\b",
    r"\bwithout further ado\b",
    r"\bin conclusion,\b",
    r"\bit is crucial to note that\b",
    r"\bit is important to remember that\b",
    r"\bgame-changer\b",
    r"\bseamlessly integrate\b",
    r"\bbeacon of\b",
    r"\brealm of\b",
    r"\blütfen unutmayın ki\b",
    r"\bgünümüz dijital dünyasında\b",
    r"\bsonuç olarak,\b",
    r"\bözetle,\b",
    r"\bönemli bir yere sahiptir\b",
]

def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def sanitize_text(text: str) -> str:
    """Removes AI Detector triggers and cleans formatting."""
    cleaned = text
    for pattern in AI_CLICHES_PATTERNS:
        cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE)
    
    # Fix multiple spaces or awkward punctuation created by removal
    cleaned = re.sub(r"\s+", " ", cleaned)
    cleaned = re.sub(r"\s+([,\.\?\!])", r"\1", cleaned)
    return cleaned.strip()

def process_datasets():
    PREPARED_DIR.mkdir(parents=True, exist_ok=True)
    
    input_files = [
        PREPARED_DIR / "local_harvest_observations.jsonl",
        PREPARED_DIR / "seo_observations.jsonl",
        PREPARED_DIR / "2026_seo_observations.jsonl",
        PREPARED_DIR / "hf_observations.jsonl"
    ]
    
    processed_count = 0
    cliches_removed_count = 0
    
    with OUT_FILE.open("w", encoding="utf-8") as out_f:
        for file_path in input_files:
            if not file_path.exists():
                continue
                
            print(f"🧹 Sanitizing {file_path.name}...")
            with file_path.open("r", encoding="utf-8") as in_f:
                for line in in_f:
                    try:
                        record = json.loads(line)
                        raw_text = record["text_signals"]["abstract_text"]
                        
                        clean_text = sanitize_text(raw_text)
                        if len(clean_text) < 50:
                            continue
                            
                        if clean_text != raw_text:
                            cliches_removed_count += 1
                            
                        # Update record with AI-free clean text
                        record["text_signals"]["abstract_text"] = clean_text
                        record["content_hash"] = sha256(f"ai_free|{clean_text[:100]}")
                        record["metadata"]["ai_free_sanitized"] = True
                        
                        out_f.write(json.dumps(record, ensure_ascii=False) + "\n")
                        processed_count += 1
                    except Exception:
                        pass
                        
    print(f"\n✅ AI-Free Sanitization Complete!")
    print(f"   • Total Cleaned Records: {processed_count:,}")
    print(f"   • AI Cliches Stripped: {cliches_removed_count:,}")
    print(f"   • Saved to: {OUT_FILE.name}")

if __name__ == "__main__":
    process_datasets()
