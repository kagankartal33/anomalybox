from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Iterable

import pdfplumber
from bs4 import BeautifulSoup
from ebooklib import ITEM_DOCUMENT, epub


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "Book-Train"
DEFAULT_OUTPUT = ROOT / "dataset" / "book_train" / "prepared"


LAYER_KEYWORDS = {
    "cinematography_visual_language": [
        "frame", "framing", "composition", "lens", "light", "lighting", "camera", "angle",
        "blocking", "depth", "contrast", "color", "image", "visual", "shot", "close-up",
        "wide shot", "movement", "exposure", "görsel", "kamera", "ışık", "isik", "çekim", "cekim",
    ],
    "film_grammar_scene_logic": [
        "screen direction", "continuity", "axis", "eyeline", "reverse", "master shot",
        "coverage", "scene", "sequence", "grammar", "cutaway", "match", "180", "sahne",
        "devamlılık", "devamlilik", "plan", "sekans",
    ],
    "editing_rhythm_payoff": [
        "edit", "editing", "cut", "rhythm", "pace", "timing", "montage", "transition",
        "blink", "reveal", "payoff", "compression", "trim", "tempo", "kurgu", "kesme",
    ],
    "sound_design_emotion": [
        "sound", "audio", "silence", "dialogue", "voice", "noise", "ambience", "music",
        "effect", "mix", "microphone", "listening", "ses", "sessizlik", "diyalog", "müzik", "muzik",
    ],
    "screenplay_story_engine": [
        "story", "structure", "character", "conflict", "premise", "scene objective", "turn",
        "beat", "act", "dialogue", "subtext", "plot", "climax", "resolution", "senaryo",
        "karakter", "çatışma", "catisma", "hikaye", "öykü", "oyku",
    ],
    "premium_video_blueprint": [
        "practical", "practice", "technique", "example", "method", "how", "rule", "principle",
        "checklist", "workflow", "production", "director", "viewer", "audience", "uygulama",
        "teknik", "yöntem", "yontem", "izleyici",
    ],
}


LAYER_CATEGORY = {
    "cinematography_visual_language": "creator_education",
    "film_grammar_scene_logic": "creator_education",
    "editing_rhythm_payoff": "entertainment_comedy",
    "sound_design_emotion": "creator_education",
    "screenplay_story_engine": "entertainment_comedy",
    "premium_video_blueprint": "lifestyle",
}


LAYER_PATTERNS = {
    "cinematography_visual_language": ["VTP-023", "VTP-039", "VTP-013"],
    "film_grammar_scene_logic": ["VTP-023", "VTP-038", "VTP-013"],
    "editing_rhythm_payoff": ["VTP-020", "VTP-014", "VTP-029"],
    "sound_design_emotion": ["VTP-039", "VTP-025", "VTP-023"],
    "screenplay_story_engine": ["VTP-014", "VTP-020", "VTP-003"],
    "premium_video_blueprint": ["VTP-013", "VTP-038", "VTP-019"],
}


BAD_SURFACE_PATTERNS = [
    r"\\bisbn\\b",
    r"anna.?s archive",
    r"\\bcopyright\\b",
    r"all rights reserved",
    r"\\backnowledg",
    r"\\bbibliograph",
    r"\\bindex\\b",
    r"\\bcontents\\b",
]


def sha(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8", errors="ignore")).hexdigest()


def clean(value: Any, limit: int = 2400) -> str:
    text = re.sub(r"\\s+", " ", str(value or "")).strip()
    return text[:limit].strip()


def safe_ref(index: int) -> str:
    return f"book_train_source_{index:02d}"


def detect_language(text: str, filename: str) -> str:
    n = f"{text} {filename}".lower()
    if re.search(r"\\b(ve|bir|senaryo|karakter|çekim|cekim|sahne|öykü|oyku|film örnekleri|ornekleri)\\b", n):
        return "tr"
    return "en"


def extraction_method(path: Path) -> str:
    ext = path.suffix.lower()
    if ext == ".pdf":
        return "pdfplumber"
    if ext == ".epub":
        return "ebooklib_bs4"
    if ext == ".azw3":
        return "calibre_ebook_convert"
    return "unsupported"


def extract_pdf(path: Path) -> Iterable[tuple[str, int | None, int | None]]:
    with pdfplumber.open(path) as pdf:
        for page_index, page in enumerate(pdf.pages, 1):
            text = clean(page.extract_text() or "", 5000)
            if text:
                yield text, page_index, None


def extract_epub(path: Path) -> Iterable[tuple[str, int | None, int | None]]:
    book = epub.read_epub(str(path))
    doc_index = 0
    for item in book.get_items():
        if item.get_type() != ITEM_DOCUMENT:
            continue
        doc_index += 1
        soup = BeautifulSoup(item.get_content(), "html.parser")
        for tag in soup(["script", "style", "nav"]):
            tag.decompose()
        text = clean(soup.get_text(" "), 8000)
        if text:
            yield text, None, doc_index


def extract_azw3(path: Path) -> Iterable[tuple[str, int | None, int | None]]:
    converter = shutil.which("ebook-convert")
    if not converter:
        raise RuntimeError("Calibre ebook-convert not found in PATH")
    with tempfile.TemporaryDirectory(prefix="viralbox_book_train_") as tmp:
        out = Path(tmp) / "converted.txt"
        subprocess.run(
            [converter, str(path), str(out)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=True,
        )
        raw = out.read_text(encoding="utf-8", errors="replace")
        for idx, chunk in enumerate(chunk_text(raw, 2200, 500), 1):
            yield chunk, None, idx


def extract_source(path: Path) -> Iterable[tuple[str, int | None, int | None]]:
    ext = path.suffix.lower()
    if ext == ".pdf":
        yield from extract_pdf(path)
    elif ext == ".epub":
        yield from extract_epub(path)
    elif ext == ".azw3":
        yield from extract_azw3(path)


def chunk_text(raw: str, max_chars: int, min_chars: int) -> Iterable[str]:
    raw = re.sub(r"\
\
    pieces = re.split(r"(?m)(?:\
    buffer = ""
    for piece in pieces:
        piece = clean(piece, max_chars * 2)
        if not piece:
            continue
        if len(buffer) + len(piece) + 1 <= max_chars:
            buffer = clean(f"{buffer} {piece}", max_chars)
            continue
        if len(buffer) >= min_chars:
            yield buffer
        buffer = piece[:max_chars]
    if len(buffer) >= min_chars:
        yield buffer


def layer_scores(text: str) -> dict[str, int]:
    n = text.lower()
    scores: dict[str, int] = {}
    for layer, keywords in LAYER_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword in n:
                score += 1
        scores[layer] = score
    return scores


def best_layer(text: str) -> str:
    scores = layer_scores(text)
    layer, score = max(scores.items(), key=lambda item: (item[1], item[0]))
    return layer if score > 0 else "premium_video_blueprint"


def craft_features(text: str, layer: str) -> list[str]:
    n = text.lower()
    features = [layer]
    checks = [
        ("actionable_rule", r"\\b(rule|principle|technique|method|must|should|never|always|yöntem|yontem|kural)\\b"),
        ("attention_control", r"\\b(attention|viewer|audience|curiosity|reveal|surprise|izleyici|merak)\\b"),
        ("scene_objective", r"\\b(objective|conflict|turn|beat|scene|sahne|çatışma|catisma)\\b"),
        ("visual_specificity", r"\\b(frame|lens|light|color|angle|composition|kamera|ışık|isik)\\b"),
        ("rhythm_timing", r"\\b(rhythm|timing|pace|cut|edit|tempo|kurgu)\\b"),
        ("sound_emotion", r"\\b(sound|silence|voice|music|ambience|ses|sessizlik|diyalog)\\b"),
        ("production_usable", r"\\b(production|workflow|practice|setup|checklist|uygulama)\\b"),
    ]
    for label, pattern in checks:
        if re.search(pattern, n):
            features.append(label)
    return list(dict.fromkeys(features))


def emotional_triggers(features: list[str], layer: str) -> list[str]:
    triggers = ["curiosity", "recognition"]
    if "attention_control" in features:
        triggers.append("anticipation")
    if "scene_objective" in features:
        triggers.append("story_payoff")
    if "visual_specificity" in features or layer == "cinematography_visual_language":
        triggers.append("aesthetic_pull")
    if "sound_emotion" in features:
        triggers.append("mood")
    return list(dict.fromkeys(triggers))


def quarantine_reason(text: str, extracted_chars_for_source: int) -> str | None:
    n = text.lower()
    if extracted_chars_for_source < 1200:
        return "low_text_extraction"
    for pattern in BAD_SURFACE_PATTERNS:
        if re.search(pattern, n):
            return "frontmatter_or_rights_surface"
    if len(re.findall(r"\\b(isbn|archive|copyright|publisher|edition)\\b", n)) >= 2:
        return "bibliographic_surface"
    return None


def training_weight(text: str, layer: str, features: list[str], language: str, reason: str | None) -> float:
    score = 0.42
    score += min(0.22, len(features) * 0.035)
    score += 0.08 if layer in {"editing_rhythm_payoff", "screenplay_story_engine", "cinematography_visual_language"} else 0.04
    score += 0.06 if "actionable_rule" in features else 0
    score += 0.05 if "production_usable" in features else 0
    score += 0.05 if language == "tr" else 0
    if reason:
        score -= 0.25
    return round(max(0.12, min(0.92, score)), 4)


def abstract_text(params: dict[str, Any]) -> str:
    layer = params["layer"]
    features = ", ".join(params["features"])
    return (
        f"Cinema craft observation. Layer={layer}. "
        f"Feature flags: {features}. "
        f"Language={params['language']}. "
        f"Raw surface hidden; raw_text_hash={params['raw_hash'][:16]}. "
        "Use only as abstract premium video craft guidance for scene_script, shot_list, b_roll, "
        "editing_timeline, atmosphere_direction and production_plan. Do not copy source wording, "
        "title, author, publication identifier, file name, character, example scene, or quote."
    )


def observation_for_chunk(
    text: str,
    source_ref: str,
    source_kind: str,
    extraction: str,
    language: str,
    page_number: int | None,
    doc_index: int | None,
    chunk_index: int,
    extracted_chars_for_source: int,
) -> dict[str, Any]:
    raw_hash = sha(re.sub(r"\\s+", " ", text.lower()).strip())
    layer = best_layer(text)
    features = craft_features(text, layer)
    reason = quarantine_reason(text, extracted_chars_for_source)
    h = sha(f"book_train_cinema_v1|{source_ref}|{page_number}|{doc_index}|{chunk_index}|{raw_hash}")
    return {
        "content_hash": h,
        "source_ref": source_ref,
        "source_kind": source_kind,
        "extraction_method": extraction,
        "chunk_id": f"{source_ref}_{chunk_index:06d}",
        "page_number": page_number,
        "doc_index": doc_index,
        "platform": "instagram_reels",
        "category_slug": LAYER_CATEGORY[layer],
        "locale": language,
        "language": language,
        "source_family": "book_train_cinema",
        "source_intent": "premium_video_craft_pattern",
        "book_train_layer": layer,
        "abstract_text": abstract_text({"layer": layer, "features": features, "language": language, "raw_hash": raw_hash}),
        "metrics": {
            "raw_length_chars": len(text),
            "feature_count": len(features),
            "page_number": page_number,
            "doc_index": doc_index,
        },
        "craft_features": features,
        "surface_features": features,
        "derived_pattern_ids": LAYER_PATTERNS[layer],
        "training_weight": training_weight(text, layer, features, language, reason),
        "training_use": "pattern_only",
        "risk_level": "low" if not reason else "medium",
        "quarantine_reason": reason,
        "copy_risk": "high",
        "raw_text_hash": raw_hash,
        "rights_policy": "pattern_only_no_surface",
    }


def source_files(input_dir: Path) -> list[Path]:
    return sorted(
        [p for p in input_dir.iterdir() if p.is_file() and p.suffix.lower() in {".pdf", ".epub", ".azw3"}],
        key=lambda path: path.name.lower(),
    )


def selected_sources(input_dir: Path, source_filter: str | None) -> list[tuple[int, Path]]:
    all_sources = list(enumerate(source_files(input_dir), 1))
    if not source_filter:
        return all_sources

    needle = source_filter.lower()
    selected: list[tuple[int, Path]] = []
    for source_index, path in all_sources:
        if needle == safe_ref(source_index).lower() or needle in path.name.lower():
            selected.append((source_index, path))
    return selected


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default=str(DEFAULT_INPUT))
    parser.add_argument("--out-dir", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--output-name", default="book_train_cinema_v1.jsonl")
    parser.add_argument("--source-filter", default="")
    parser.add_argument("--max-chunks-per-book", type=int, default=12000)
    parser.add_argument("--min-chunk-chars", type=int, default=300)
    parser.add_argument("--max-chunk-chars", type=int, default=1800)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    input_dir = Path(args.input_dir).resolve()
    out_dir = Path(args.out_dir).resolve()
    output_path = out_dir / args.output_name
    manifest_path = out_dir / args.output_name.replace(".jsonl", ".manifest.json")

    files = selected_sources(input_dir, args.source_filter.strip() or None)
    sources = [
        {
            "source_ref": safe_ref(i),
            "extension": path.suffix.lower(),
            "size": path.stat().st_size,
            "extraction_method": extraction_method(path),
        }
        for i, path in files
    ]
    plan = {
        "mode": "book_train_cinema_prepare",
        "input_ref": "book_train_sources",
        "output_file": output_path.name,
        "source_count": len(files),
        "max_chunks_per_book": args.max_chunks_per_book,
        "sources": sources,
        "apply": args.apply,
    }
    if not args.apply:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
        return

    out_dir.mkdir(parents=True, exist_ok=True)
    total_rows = 0
    stats = []
    seen_hashes = set()
    with output_path.open("w", encoding="utf-8") as out:
        for source_index, path in files:
            source_ref = safe_ref(source_index)
            extraction = extraction_method(path)
            source_kind = path.suffix.lower().lstrip(".")
            extracted_units = list(extract_source(path))
            extracted_chars = sum(len(text) for text, _, _ in extracted_units)
            prepared = quarantined = duplicates = 0
            chunk_counter = 0
            language_seed = " ".join(text[:400] for text, _, _ in extracted_units[:4])
            language = detect_language(language_seed, path.name)
            for text, page_number, doc_index in extracted_units:
                for chunk in chunk_text(text, args.max_chunk_chars, args.min_chunk_chars):
                    if chunk_counter >= args.max_chunks_per_book:
                        break
                    chunk_counter += 1
                    row = observation_for_chunk(
                        chunk,
                        source_ref,
                        source_kind,
                        extraction,
                        language,
                        page_number,
                        doc_index,
                        chunk_counter,
                        extracted_chars,
                    )
                    if row["content_hash"] in seen_hashes:
                        duplicates += 1
                        continue
                    seen_hashes.add(row["content_hash"])
                    if row["quarantine_reason"]:
                        quarantined += 1
                    prepared += 1
                    total_rows += 1
                    out.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\
                if chunk_counter >= args.max_chunks_per_book:
                    break
            stats.append({
                "source_ref": source_ref,
                "extension": path.suffix.lower(),
                "extraction_method": extraction,
                "language": language,
                "units": len(extracted_units),
                "extracted_chars": extracted_chars,
                "prepared_observations": prepared,
                "quarantined_chunks": quarantined,
                "duplicate_hashes": duplicates,
            })

    manifest = {
        **plan,
        "apply": True,
        "total_rows": total_rows,
        "stats": stats,
        "policy": "pattern_only_no_surface_copy",
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
