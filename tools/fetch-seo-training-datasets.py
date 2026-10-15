"""
fetch-seo-training-datasets.py
==============================
SEO CONTENT TRAINING PIPELINE ONLY.

Downloads external SEO, AEO, and search intent datasets from Hugging Face:
  1. metehan777/global-seo-knowledge (2,065 terms and algorithmic concepts)
  2. parameterlab/c-seo-bench (conversational SEO query-to-answer documents)
  3. 2026 AEO & GEO comprehensive training signals (Google AI Overviews, Information Gain, Perplexity)

Output destinations:
  - ViralBox-training-archive/dataset/seo_content/prepared/
  - local dataset/seo_content/prepared/ (fallback)
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive")
PREPARED_DIR = ARCHIVE / "dataset" / "seo_content" / "prepared"
LOCAL_PREPARED = ROOT / "dataset" / "seo_content" / "prepared"

HF_BASE_URL = "https://datasets-server.huggingface.co"


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


def fetch_hf_rows(repo: str, config: str = "default", split: str = "train", offset: int = 0, length: int = 100) -> list[dict]:
    params = urllib.parse.urlencode({
        "dataset": repo,
        "config": config,
        "split": split,
        "offset": offset,
        "length": length,
    })
    url = f"{HF_BASE_URL}/rows?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "ViralBox-SEO-Training/2026.1"})
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            data = json.loads(res.read().decode("utf-8"))
            return [item.get("row", {}) for item in data.get("rows", [])]
    except Exception as e:
        print(f"  [WARN] Failed to fetch {repo} (offset {offset}): {e}")
        return []


def download_global_seo_knowledge(limit: int = 500) -> list[dict]:
    print("\n[1/3] Fetching metehan777/global-seo-knowledge from Hugging Face...")
    records = []
    offset = 0
    batch_size = 100
    while len(records) < limit:
        rows = fetch_hf_rows("metehan777/global-seo-knowledge", "default", "train", offset, batch_size)
        if not rows:
            break
        for r in rows:
            term = (r.get("term") or "").strip()
            definition = (r.get("definition") or "").strip()
            category = (r.get("category") or "Technical SEO").strip()
            importance = (r.get("importance") or "Medium").strip()
            related = r.get("related_terms") or []
            if term and definition:
                records.append({
                    "content_hash": sha256(f"hf_global_seo|{term}|{definition}"),
                    "source": "hf:metehan777/global-seo-knowledge",
                    "term": term,
                    "definition": definition,
                    "category": category,
                    "importance": importance,
                    "related_terms": related,
                    "seo_layer": "technical_seo" if "technical" in category.lower() else "on_page_seo",
                    "training_weight": 0.85,
                })
        offset += len(rows)
        print(f"   Fetched {len(records)} global SEO terms...")
        if len(rows) < batch_size:
            break
        time.sleep(0.3)
    return records


def download_conversational_seo_bench(limit: int = 300) -> list[dict]:
    print("\n[2/3] Fetching parameterlab/c-seo-bench from Hugging Face...")
    records = []
    splits = ["web", "retail", "books"]
    for sp in splits:
        if len(records) >= limit:
            break
        rows = fetch_hf_rows("parameterlab/c-seo-bench", "default", sp, 0, min(100, limit - len(records)))
        for r in rows:
            query = (r.get("query") or "").strip()
            doc = (r.get("document") or "").strip()
            if query and doc and len(doc) > 80:
                # Clean doc down to first 300 words
                clean_doc = " ".join(doc.split()[:180])
                records.append({
                    "content_hash": sha256(f"hf_c_seo|{query}"),
                    "source": f"hf:parameterlab/c-seo-bench:{sp}",
                    "query": query,
                    "document_extract": clean_doc,
                    "seo_layer": "answer_engine_optimization",
                    "training_weight": 0.90,
                })
        print(f"   Fetched {len(records)} conversational SEO QA pairs (split {sp})...")
        time.sleep(0.3)
    return records


def synthesize_2026_aeo_geo_signals() -> list[dict]:
    print("\n[3/3] Synthesizing 2026 AEO, GEO & Information Gain Knowledge signals...")
    signals = [
        {
            "topic": "Citation-Ready Answer Capsules",
            "layer": "answer_engine_optimization",
            "concept": "zero_click_capsule",
            "principle": "Place an unhedged, authoritative 40-70 word direct answer immediately under the main heading. LLMs and AI Overviews extract the first declarative paragraph for search intent resolution.",
            "action": "State the direct definition or answer, the target operator, and the primary constraint in the first 2 sentences.",
            "weight": 0.98,
        },
        {
            "topic": "Information Gain and Non-Redundancy",
            "layer": "content_strategy",
            "concept": "information_gain",
            "principle": "Search engines evaluate novelty against consensus knowledge. Articles merely summarizing top 10 search results receive severe de-ranking penalties. Inject net-new decision matrices, real telemetry, and first-party proof.",
            "action": "Always feature a 4-column decision matrix with verifiable parameters (Kelvin, dB, angles, boundaries).",
            "weight": 0.99,
        },
        {
            "topic": "Radical Readability and Cognitive Ease",
            "layer": "content_writing",
            "concept": "flesch_reading_ease",
            "principle": "Complex jargon creates cognitive friction. Target Flesch Reading Ease scores between 50.0 and 65.0 with average sentence lengths of 12-18 words and active voice verbs.",
            "action": "Avoid multi-clause bureaucratized sentences. Use short punchy directives and clear bulleted rest stops.",
            "weight": 0.96,
        },
        {
            "topic": "Conversational Intent & People-Also-Ask Parsing",
            "layer": "keyword_research",
            "concept": "conversational_nlp",
            "principle": "Voice search and chatbot queries require full-sentence natural question architecture. Structure subheadings and FAQ headers as direct user dilemmas.",
            "action": "Format H3 FAQs as exact search queries answered definitively in the first 2 sentences.",
            "weight": 0.95,
        },
        {
            "topic": "Multimodal Proximity & Alt Text Semantics",
            "layer": "on_page_seo",
            "concept": "multimodal_search",
            "principle": "Google Vision and Multimodal models bind image entities to immediate adjacent paragraphs. Image alt text acts as primary textual evidence for rich answer citations.",
            "action": "Write descriptive 80-140 character alt texts describing why the visual evidence matters to the argument.",
            "weight": 0.94,
        },
        {
            "topic": "Brand-Safety & Creator Contract Guardrails",
            "layer": "content_strategy",
            "concept": "contract_boundaries",
            "principle": "Commercial intent in creator economy workflows demands strict legal boundary demarcation between organic rights, whitelisting, and perpetual digital licenses.",
            "action": "Specify clear claim boundaries and separate creative preference from non-negotiable fact.",
            "weight": 0.93,
        },
    ]

    records = []
    for s in signals:
        records.append({
            "content_hash": sha256(f"2026_geo_signal|{s['topic']}"),
            "source": "2026_aeo_geo_synthesis",
            "topic": s["topic"],
            "seo_layer": s["layer"],
            "concept": s["concept"],
            "principle": s["principle"],
            "action": s["action"],
            "training_weight": s["weight"],
        })
    return records


def main() -> int:
    print("=" * 60)
    print("  SEO & AEO TRAINING DATASET HARVESTER (2026 ECOSYSTEM)")
    print("=" * 60)

    PREPARED_DIR.mkdir(parents=True, exist_ok=True)
    LOCAL_PREPARED.mkdir(parents=True, exist_ok=True)

    # 1. Fetch Hugging Face global SEO
    global_seo = download_global_seo_knowledge(limit=500)

    # 2. Fetch Hugging Face conversational SEO
    c_seo = download_conversational_seo_bench(limit=300)

    # 3. Synthesize 2026 AEO / GEO signals
    geo_signals = synthesize_2026_aeo_geo_signals()

    # Write datasets
    for target_dir in [PREPARED_DIR, LOCAL_PREPARED]:
        # Save HF observations
        hf_out = target_dir / "hf_seo_knowledge.jsonl"
        with hf_out.open("w", encoding="utf-8") as f:
            for item in global_seo + c_seo:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")

        # Save 2026 GEO synthesis
        geo_out = target_dir / "2026_geo_signals.jsonl"
        with geo_out.open("w", encoding="utf-8") as f:
            for item in geo_signals:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print("\n" + "=" * 60)
    print(f"  HARVEST COMPLETE:")
    print(f"  - Global SEO terms (HF):        {len(global_seo)}")
    print(f"  - Conversational SEO QA (HF):    {len(c_seo)}")
    print(f"  - 2026 AEO/GEO Signals:          {len(geo_signals)}")
    print(f"  - Total Harvested Signals:       {len(global_seo) + len(c_seo) + len(geo_signals)}")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
