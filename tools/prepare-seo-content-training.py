"""
prepare-seo-content-training.py
===============================
Extracts SEO knowledge from books (PDF/EPUB/AZW3) and structured datasets
(JSONL/JSON) into training-ready JSONL files for Supabase import.

Sources:
  - Content/ directory: 12 SEO/content marketing books
  - Book-Train/seo1/: seo_glossary.jsonl (2,068 terms)
  - Book-Train/seo2/: leadsblue_dataset.json (1,000 Q&A pairs)

Output:
  - seo_observations.jsonl  (book chunks with SEO layer labels)
  - seo_glossary.jsonl       (pass-through, reformatted for DB)
  - seo_qa_bank.jsonl        (Q&A pairs with layer labels)

Usage:
  python tools/prepare-seo-content-training.py
  python tools/prepare-seo-content-training.py --content-dir "C:/path/to/Content"
  python tools/prepare-seo-content-training.py --dry-run
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Generator

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
CONTENT_DIR = Path(r"C:\Users\Kagan\OneDrive\Desktop\Content")
ARCHIVE_DIR = Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive")
SEO1_DIR = ARCHIVE_DIR / "Book-Train" / "seo1"
SEO2_DIR = ARCHIVE_DIR / "Book-Train" / "seo2"
DEFAULT_OUT = ARCHIVE_DIR / "dataset" / "seo_content" / "prepared"

# ---------------------------------------------------------------------------
# SEO Layer Detection Keywords
# ---------------------------------------------------------------------------
SEO_LAYER_KEYWORDS: dict[str, list[str]] = {
    "on_page_seo": [
        "title tag", "meta description", "header tag", "h1", "h2",
        "keyword density", "keyword placement", "alt text", "image seo",
        "internal linking", "content optimization", "readability", "url structure",
        "on-page", "onpage", "meta tag", "snippet", "anchor text",
        "başlık etiketi", "meta açıklama", "anahtar kelime yoğunluğu",
    ],
    "technical_seo": [
        "robots.txt", "sitemap", "canonical", "hreflang", "schema markup",
        "structured data", "page speed", "core web vitals", "crawl budget",
        "indexing", "rendering", "javascript seo", "mobile-first",
        "http status", "redirect", "301", "302", "404", "ssl", "https",
        "cdn", "lazy load", "minif", "compress",
        "teknik seo", "site haritası", "sayfa hızı",
    ],
    "content_strategy": [
        "content pillar", "topic cluster", "content calendar", "editorial",
        "buyer persona", "content audit", "content gap", "evergreen",
        "skyscraper", "hub and spoke", "content silo", "content marketing",
        "content plan", "content framework", "they ask you answer",
        "içerik stratejisi", "içerik takvimi", "hedef kitle",
    ],
    "keyword_research": [
        "keyword research", "search intent", "long-tail", "seed keyword",
        "keyword difficulty", "search volume", "serp analysis", "competitor keyword",
        "keyword clustering", "semantic keyword", "lsi keyword",
        "keyword tool", "keyword planner", "ahrefs", "semrush",
        "anahtar kelime araştırma", "arama niyeti",
    ],
    "link_building": [
        "backlink", "link building", "domain authority", "guest post",
        "broken link", "link earning", "anchor text", "nofollow", "dofollow",
        "outreach", "link profile", "referring domain", "link equity",
        "page authority", "link juice", "digital pr",
        "bağlantı oluşturma", "geri bağlantı",
    ],
    "content_writing": [
        "headline", "hook", "call to action", "cta", "copywriting",
        "storytelling", "readability score", "flesch", "engagement",
        "scannable", "bullet point", "subheading", "introduction",
        "bucket brigade", "power word", "active voice", "passive voice",
        "content format", "listicle", "how-to", "guide",
        "başlık yazma", "metin yazarlığı", "çağrı",
    ],
    "seo_analytics": [
        "google analytics", "ga4", "search console", "click-through rate",
        "bounce rate", "dwell time", "conversion", "organic traffic",
        "ranking", "position", "impression", "serp feature",
        "kpi", "roi", "attribution", "funnel",
        "analitik", "dönüşüm oranı", "organik trafik",
    ],
    "local_seo": [
        "google business", "local pack", "nap", "citation", "local search",
        "map pack", "geo-targeting", "local listing", "gmb",
        "google my business", "review management",
        "yerel seo", "google işletme",
    ],
    "ecommerce_seo": [
        "product page", "category page", "product description", "rich snippet",
        "shopping", "merchant", "product schema", "ecommerce",
        "product seo", "collection page", "faceted navigation",
        "ürün sayfası", "e-ticaret seo",
    ],
    "answer_engine_optimization": [
        "featured snippet", "people also ask", "answer box", "voice search",
        "zero-click", "faq schema", "how-to schema", "passage ranking",
        "ai overview", "sge", "generative search", "answer engine",
        "paa", "knowledge panel", "rich result",
        "öne çıkan snippet", "sesli arama",
    ],
}

# Compiled patterns for fast matching
_LAYER_PATTERNS: dict[str, re.Pattern] = {}
for _layer, _kws in SEO_LAYER_KEYWORDS.items():
    escaped = [re.escape(kw) for kw in _kws]
    _LAYER_PATTERNS[_layer] = re.compile(r"|".join(escaped), re.IGNORECASE)

# ---------------------------------------------------------------------------
# Book slug mapping
# ---------------------------------------------------------------------------
BOOK_SLUG_MAP: list[tuple[str, str]] = [
    ("Art of SEO", "the_art_of_seo"),
    ("Content Chemistry", "content_chemistry"),
    ("Product-led SEO", "product_led_seo"),
    ("Answer Engine Optimization", "answer_engine_optimization"),
    ("Everybody Writes", "everybody_writes"),
    ("They Ask, You Answer", "they_ask_you_answer"),
    ("Marketing Rebellion", "marketing_rebellion"),
    ("GA4-101", "ga4_101"),
    ("GA4-102", "ga4_102"),
    ("SEO-2024-Checklist", "seo_2024_checklist"),
    ("Technical_SEO_Guide", "technical_seo_guide"),
]


def book_slug_for(filename: str) -> str:
    lower = filename.lower()
    for pattern, slug in BOOK_SLUG_MAP:
        if pattern.lower() in lower:
            return slug
    # Fallback: clean filename
    s = re.sub(r"[^a-z0-9]+", "_", lower)
    s = re.sub(r"_+", "_", s).strip("_")
    return (s or "unknown_book")[:60]


# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------
def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


def content_identity(text: str) -> str:
    normalized = re.sub(r"\s+", " ", text.strip().lower())
    normalized = re.sub(r"[\"'`]+", "", normalized)
    normalized = re.sub(r"[^a-z0-9ığüşöçİĞÜŞÖÇ\s:_/-]+", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return sha256(f"seo_content|{normalized}")


def clean(text: str, limit: int = 1800) -> str:
    text = re.sub(r"\s+", " ", str(text or "")).strip()
    return text[:limit].strip()


def detect_seo_layers(text: str) -> list[str]:
    """Detect which SEO layers a text chunk belongs to. Returns sorted list."""
    text_lower = text.lower()
    scores: dict[str, int] = {}
    for layer, pattern in _LAYER_PATTERNS.items():
        matches = pattern.findall(text_lower)
        if matches:
            scores[layer] = len(matches)
    if not scores:
        return ["general_seo"]
    # Return layers sorted by match count (descending)
    sorted_layers = sorted(scores, key=lambda k: scores[k], reverse=True)
    return sorted_layers[:3]  # Max 3 layers per chunk


def primary_layer(text: str) -> str:
    layers = detect_seo_layers(text)
    return layers[0]


def extract_concepts(text: str) -> list[str]:
    """Extract SEO concepts mentioned in the text."""
    concepts = set()
    text_lower = text.lower()
    for layer, keywords in SEO_LAYER_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                concepts.add(kw.lower())
    return sorted(concepts)[:20]  # Cap at 20


def quality_score(text: str, concepts: list[str]) -> dict[str, float]:
    """Compute quality metrics for a text chunk."""
    word_count = len(text.split())
    sentence_count = max(1, len(re.split(r"[.!?]+", text)))
    avg_sentence_len = word_count / sentence_count

    # Concept density: how many unique SEO concepts per 100 words
    concept_density = round(len(concepts) / max(1, word_count) * 100, 3)

    # Actionability: presence of action words
    action_words = re.findall(
        r"\b(use|create|add|implement|optimize|write|include|avoid|ensure|check|set|build|target|improve|analyze)\b",
        text, re.I
    )
    actionability = round(min(1.0, len(action_words) / max(1, sentence_count) * 0.5), 3)

    # Authority: presence of data/source indicators
    authority_signals = re.findall(
        r"\b(study|research|data|according|percent|%|statistic|survey|report|analysis|google|moz|ahrefs|semrush)\b",
        text, re.I
    )
    authority = round(min(1.0, len(authority_signals) * 0.15), 3)

    return {
        "concept_density": concept_density,
        "actionability": actionability,
        "authority": authority,
        "word_count": word_count,
        "avg_sentence_length": round(avg_sentence_len, 1),
    }


def training_weight(text: str, concepts: list[str], metrics: dict) -> float:
    """Compute training weight (0.0-1.0) for a chunk."""
    base = 0.40
    # Concept density bonus
    if metrics["concept_density"] > 2.0:
        base += 0.15
    elif metrics["concept_density"] > 1.0:
        base += 0.08
    # Actionability bonus
    base += metrics["actionability"] * 0.15
    # Authority bonus
    base += metrics["authority"] * 0.10
    # Length penalty/bonus
    wc = metrics["word_count"]
    if wc < 50:
        base -= 0.15
    elif wc > 100:
        base += 0.05
    elif wc > 300:
        base += 0.10
    # Multiple concepts = more valuable
    if len(concepts) >= 5:
        base += 0.08
    elif len(concepts) >= 3:
        base += 0.04
    return round(max(0.10, min(0.95, base)), 4)


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------
def chunk_text(raw: str, max_chars: int = 1800, min_chars: int = 80) -> Generator[str, None, None]:
    """Split text into semantic chunks."""
    raw = re.sub(r"\r\n?", "\n", raw or "")
    # Split on headings, list markers, or double newlines
    pieces = re.split(r"(?m)(?:^#{1,4}\s+|^\s*[-*]\s{2,}|\n{2,})", raw)
    carry = ""
    for piece in pieces:
        piece = clean(piece, max_chars)
        if not piece:
            continue
        if len(piece) < min_chars:
            carry = clean(f"{carry} {piece}", max_chars)
            if len(carry) < min_chars:
                continue
            piece, carry = carry, ""
        yield piece
    if len(carry) >= min_chars:
        yield carry


def read_epub_text(path: Path) -> str:
    """Extract text from EPUB file."""
    texts = []
    try:
        with zipfile.ZipFile(path) as z:
            for name in z.namelist():
                if not name.lower().endswith((".xhtml", ".html", ".htm")):
                    continue
                try:
                    raw = z.read(name).decode("utf-8", errors="replace")
                except Exception:
                    continue
                raw = re.sub(r"<script\b[^>]*>.*?</script>", " ", raw, flags=re.I | re.S)
                raw = re.sub(r"<style\b[^>]*>.*?</style>", " ", raw, flags=re.I | re.S)
                raw = re.sub(r"<[^>]+>", " ", raw)
                raw = re.sub(r"&\w+;", " ", raw)
                texts.append(raw)
    except Exception as e:
        print(f"  ⚠ EPUB read error {path.name}: {e}", file=sys.stderr)
    return "\n".join(texts)


def read_pdf_text(path: Path) -> str:
    """Extract text from PDF file using pdfplumber if available, fallback to basic."""
    try:
        import pdfplumber
        texts = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    texts.append(text)
        return "\n".join(texts)
    except ImportError:
        print("  ⚠ pdfplumber not installed. Attempting basic PDF text extraction.", file=sys.stderr)
        return _read_pdf_basic(path)
    except Exception as e:
        print(f"  ⚠ PDF read error {path.name}: {e}", file=sys.stderr)
        return _read_pdf_basic(path)


def _read_pdf_basic(path: Path) -> str:
    """Very basic PDF text extraction without pdfplumber."""
    try:
        # Try PyPDF2 / pypdf
        try:
            from pypdf import PdfReader
        except ImportError:
            from PyPDF2 import PdfReader
        reader = PdfReader(str(path))
        texts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                texts.append(text)
        return "\n".join(texts)
    except Exception as e:
        print(f"  ⚠ Basic PDF extraction failed for {path.name}: {e}", file=sys.stderr)
        return ""


def read_azw3_text(path: Path) -> str:
    """Try to extract text from AZW3 via Calibre CLI."""
    try:
        # Try ebook-convert to txt
        tmp_txt = path.with_suffix(".tmp.txt")
        result = subprocess.run(
            ["ebook-convert", str(path), str(tmp_txt)],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode == 0 and tmp_txt.exists():
            text = tmp_txt.read_text(encoding="utf-8", errors="replace")
            tmp_txt.unlink(missing_ok=True)
            return text
    except FileNotFoundError:
        print("  ⚠ Calibre ebook-convert not found. Skipping AZW3.", file=sys.stderr)
    except Exception as e:
        print(f"  ⚠ AZW3 conversion error {path.name}: {e}", file=sys.stderr)
    return ""


# ---------------------------------------------------------------------------
# Q&A Layer Inference
# ---------------------------------------------------------------------------
def qa_layer(question: str, answer: str, keywords: list) -> str:
    """Infer the SEO layer for a Q&A pair."""
    kw_strs = [str(k) if not isinstance(k, dict) else str(k.get("keyword", k.get("term", ""))) for k in keywords]
    combined = f"{question} {answer} {' '.join(kw_strs)}"
    return primary_layer(combined)


def qa_weight(question: str, answer: str, keywords: list) -> float:
    """Compute training weight for a Q&A pair."""
    combined = f"{question} {answer}"
    concepts = extract_concepts(combined)
    metrics = quality_score(combined, concepts)
    base = 0.45
    if len(keywords) >= 3:
        base += 0.10
    if len(answer) > 200:
        base += 0.08
    base += metrics["actionability"] * 0.10
    return round(max(0.20, min(0.85, base)), 4)


# ---------------------------------------------------------------------------
# Main Processing
# ---------------------------------------------------------------------------
def process_books(content_dir: Path, seen: set[str]) -> list[dict]:
    """Process all books in the content directory."""
    observations = []
    supported = {".pdf", ".epub", ".azw3"}

    for path in sorted(content_dir.iterdir()):
        if path.is_dir() or path.suffix.lower() not in supported:
            continue
        if path.suffix.lower() == ".crdownload":
            continue

        book = book_slug_for(path.name)
        print(f"\n📖 Processing: {path.name}")
        print(f"   Slug: {book}")

        # Extract text
        ext = path.suffix.lower()
        if ext == ".pdf":
            raw_text = read_pdf_text(path)
        elif ext == ".epub":
            raw_text = read_epub_text(path)
        elif ext == ".azw3":
            raw_text = read_azw3_text(path)
        else:
            continue

        if not raw_text or len(raw_text) < 100:
            print(f"   ⚠ Insufficient text extracted ({len(raw_text or '')} chars)")
            continue

        # Chunk and process
        chunk_count = 0
        for idx, chunk in enumerate(chunk_text(raw_text), 1):
            if len(chunk) < 80:
                continue

            h = content_identity(chunk)
            if h in seen:
                continue
            seen.add(h)

            layer = primary_layer(chunk)
            concepts = extract_concepts(chunk)
            metrics = quality_score(chunk, concepts)
            weight = training_weight(chunk, concepts, metrics)

            observations.append({
                "content_hash": h,
                "source_book": book,
                "source_chapter": None,
                "source_page": None,
                "seo_layer": layer,
                "category_slug": "seo_content_writing",
                "locale": "en",
                "title_algorithmic": f"SEO training signal {book} #{idx}",
                "text_signals": {
                    "abstract_text": chunk,
                    "seo_concepts": concepts,
                    "all_layers": detect_seo_layers(chunk),
                },
                "metric_signals": metrics,
                "derived_concepts": concepts,
                "training_weight": weight,
                "training_use": "pattern_only",
                "risk_level": "low",
                "metadata": {
                    "source_file": path.name,
                    "source_extension": ext,
                    "source_class": "seo_book_training",
                    "chunk_index": idx,
                    "anti_copy": True,
                    "surface_not_allowed": True,
                },
            })
            chunk_count += 1

        print(f"   ✓ Extracted {chunk_count} chunks (layer distribution below)")
        layer_dist = {}
        for obs in observations[-chunk_count:] if chunk_count else []:
            l = obs["seo_layer"]
            layer_dist[l] = layer_dist.get(l, 0) + 1
        for l, c in sorted(layer_dist.items(), key=lambda x: -x[1]):
            print(f"     {l}: {c}")

    return observations


def process_glossary(seo1_dir: Path) -> list[dict]:
    """Process seo_glossary.jsonl into structured records."""
    glossary_path = seo1_dir / "seo_glossary.jsonl"
    if not glossary_path.exists():
        print(f"\n⚠ Glossary not found: {glossary_path}")
        return []

    print(f"\n📚 Processing glossary: {glossary_path.name}")
    records = []
    with glossary_path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue

            records.append({
                "term": item.get("term", "").strip(),
                "definition": item.get("definition", "").strip(),
                "category": item.get("category", "General SEO").strip(),
                "importance": item.get("importance", "Medium").strip(),
                "related_terms": item.get("related_terms", []),
            })

    # Filter out empty terms
    records = [r for r in records if r["term"] and r["definition"]]
    print(f"   ✓ Loaded {len(records)} glossary terms")
    return records


def process_qa(seo2_dir: Path) -> list[dict]:
    """Process leadsblue_dataset.json into Q&A records."""
    qa_path = seo2_dir / "leadsblue_dataset.json"
    if not qa_path.exists():
        print(f"\n⚠ Q&A dataset not found: {qa_path}")
        return []

    print(f"\n❓ Processing Q&A dataset: {qa_path.name}")
    records = []
    with qa_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    items = data if isinstance(data, list) else data.get("items", [])

    for item in items:
        question = (item.get("question") or "").strip()
        answer = (item.get("answer") or "").strip()
        raw_keywords = item.get("keywords", [])
        # Normalize keywords: some entries have dicts instead of strings
        keywords = []
        for k in raw_keywords:
            if isinstance(k, str):
                keywords.append(k)
            elif isinstance(k, dict):
                keywords.append(str(k.get("keyword", k.get("term", str(k)))))
            else:
                keywords.append(str(k))
        source_url = item.get("source_url", "")

        if not question or not answer:
            continue

        layer = qa_layer(question, answer, keywords)
        weight = qa_weight(question, answer, keywords)

        records.append({
            "question": question,
            "answer": answer,
            "keywords": keywords,
            "source_url": source_url,
            "seo_layer": layer,
            "training_weight": weight,
        })

    print(f"   ✓ Loaded {len(records)} Q&A pairs")
    return records


def write_jsonl(records: list[dict], path: Path, label: str) -> int:
    """Write records to JSONL file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"\n💾 Wrote {len(records)} {label} records to {path}")
    return len(records)


def print_summary(observations: list, glossary: list, qa: list):
    """Print a summary report."""
    print("\n" + "=" * 60)
    print("  SEO CONTENT TRAINING — PREPARATION SUMMARY")
    print("=" * 60)

    print(f"\n  📖 Book observations: {len(observations)}")
    if observations:
        layer_dist: dict[str, int] = {}
        book_dist: dict[str, int] = {}
        weights = []
        for obs in observations:
            layer_dist[obs["seo_layer"]] = layer_dist.get(obs["seo_layer"], 0) + 1
            book_dist[obs["source_book"]] = book_dist.get(obs["source_book"], 0) + 1
            weights.append(obs["training_weight"])

        print("\n  Layer distribution:")
        for layer, count in sorted(layer_dist.items(), key=lambda x: -x[1]):
            print(f"    {layer:40s} {count:>5d}")

        print("\n  Book distribution:")
        for book, count in sorted(book_dist.items(), key=lambda x: -x[1]):
            print(f"    {book:40s} {count:>5d}")

        avg_w = sum(weights) / len(weights) if weights else 0
        print(f"\n  Avg training weight: {avg_w:.4f}")
        print(f"  Min weight: {min(weights):.4f}  Max weight: {max(weights):.4f}")

    print(f"\n  📚 Glossary terms: {len(glossary)}")
    if glossary:
        cat_dist: dict[str, int] = {}
        for g in glossary:
            cat_dist[g["category"]] = cat_dist.get(g["category"], 0) + 1
        for cat, count in sorted(cat_dist.items(), key=lambda x: -x[1]):
            print(f"    {cat:40s} {count:>5d}")

    print(f"\n  ❓ Q&A pairs: {len(qa)}")
    if qa:
        qa_layer_dist: dict[str, int] = {}
        for q in qa:
            qa_layer_dist[q["seo_layer"]] = qa_layer_dist.get(q["seo_layer"], 0) + 1
        for layer, count in sorted(qa_layer_dist.items(), key=lambda x: -x[1]):
            print(f"    {layer:40s} {count:>5d}")

    total = len(observations) + len(glossary) + len(qa)
    print(f"\n  📊 TOTAL TRAINING SIGNALS: {total}")
    print("=" * 60)


def main():
    ap = argparse.ArgumentParser(
        description="Prepare SEO content training data from books and datasets"
    )
    ap.add_argument(
        "--content-dir",
        default=str(CONTENT_DIR),
        help="Directory containing SEO books (PDF/EPUB/AZW3)",
    )
    ap.add_argument(
        "--seo1-dir",
        default=str(SEO1_DIR),
        help="Directory containing seo_glossary.jsonl",
    )
    ap.add_argument(
        "--seo2-dir",
        default=str(SEO2_DIR),
        help="Directory containing leadsblue_dataset.json",
    )
    ap.add_argument(
        "--output-dir",
        default=str(DEFAULT_OUT),
        help="Output directory for prepared JSONL files",
    )
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="Only show what would be processed, don't write files",
    )
    args = ap.parse_args()

    content_dir = Path(args.content_dir)
    seo1_dir = Path(args.seo1_dir)
    seo2_dir = Path(args.seo2_dir)
    output_dir = Path(args.output_dir)

    print("=" * 60)
    print("  SEO CONTENT TRAINING DATA PREPARATION")
    print("=" * 60)
    print(f"\n  Content dir: {content_dir}")
    print(f"  SEO1 dir:    {seo1_dir}")
    print(f"  SEO2 dir:    {seo2_dir}")
    print(f"  Output dir:  {output_dir}")
    print(f"  Dry run:     {args.dry_run}")

    # Check directories exist
    for label, d in [("Content", content_dir), ("SEO1", seo1_dir), ("SEO2", seo2_dir)]:
        if not d.exists():
            print(f"\n⚠ {label} directory not found: {d}")
            if label == "Content":
                print("  Cannot proceed without content directory.")
                sys.exit(1)

    # Process all sources
    seen: set[str] = set()
    observations = process_books(content_dir, seen)
    glossary = process_glossary(seo1_dir)
    qa = process_qa(seo2_dir)

    # Summary
    print_summary(observations, glossary, qa)

    # Write output
    if not args.dry_run:
        obs_count = write_jsonl(observations, output_dir / "seo_observations.jsonl", "observation")
        gls_count = write_jsonl(glossary, output_dir / "seo_glossary.jsonl", "glossary")
        qa_count = write_jsonl(qa, output_dir / "seo_qa_bank.jsonl", "Q&A")

        # Write metadata
        meta = {
            "prepared_at": __import__("datetime").datetime.now().isoformat(),
            "observation_count": obs_count,
            "glossary_count": gls_count,
            "qa_count": qa_count,
            "total": obs_count + gls_count + qa_count,
            "content_dir": str(content_dir),
            "output_dir": str(output_dir),
        }
        meta_path = output_dir / "preparation_metadata.json"
        with meta_path.open("w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)
        print(f"\n📋 Metadata written to {meta_path}")
    else:
        print("\n🔍 DRY RUN — no files written.")

    print("\n✅ Preparation complete.")


if __name__ == "__main__":
    main()
