from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
import math
import re
import tarfile
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "Book-Train"
DEFAULT_OUTPUT = ROOT / "dataset" / "book_train" / "prepared" / "extended"
csv.field_size_limit(1024 * 1024 * 128)


SOURCES = [
    {
        "family": "seo_glossary",
        "path": "seo1/seo_glossary.jsonl",
        "kind": "jsonl",
        "platform": "web",
        "category": "creator_education",
        "intent": "seo_knowledge_to_premium_webcopy",
        "license": "dataset_local",
        "max_rows": 20000,
    },
    {
        "family": "leadgen_seo_qa",
        "path": "seo2/leadsblue_dataset.json",
        "kind": "json_items",
        "platform": "web",
        "category": "creator_education",
        "intent": "leadgen_seo_qa_to_trust_and_disclosure_patterns",
        "license": "dataset_local",
        "max_rows": 20000,
        "eval_only": True,
    },
    {
        "family": "seo_serp_signals",
        "path": "archive2/SEO_data.csv",
        "kind": "csv_header",
        "platform": "web",
        "category": "creator_education",
        "intent": "serp_title_snippet_h1_structure",
        "license": "dataset_local",
        "max_rows": 30000,
        "max_scan_rows": 250000,
    },
    {
        "family": "twitter_sentiment",
        "path": "archive/training.1600000.processed.noemoticon.csv",
        "kind": "csv_no_header",
        "columns": ["sentiment", "tweet_id", "date", "query", "username", "text"],
        "platform": "instagram_reels",
        "category": "lifestyle",
        "intent": "short_social_sentiment_and_relatability",
        "license": "dataset_local",
        "max_rows": 30000,
        "max_scan_rows": 350000,
    },
    {
        "family": "amazon_review_polarity_train",
        "path": "archive1/train.csv",
        "kind": "csv_no_header",
        "columns": ["sentiment", "title", "review"],
        "platform": "web",
        "category": "product_reviews",
        "intent": "product_review_proof_objection_language",
        "license": "dataset_local",
        "max_rows": 30000,
        "max_scan_rows": 350000,
    },
    {
        "family": "amazon_review_polarity_test",
        "path": "archive1/test.csv",
        "kind": "csv_no_header",
        "columns": ["sentiment", "title", "review"],
        "platform": "web",
        "category": "product_reviews",
        "intent": "product_review_proof_objection_language",
        "license": "dataset_local",
        "max_rows": 12000,
        "max_scan_rows": 120000,
    },
    {
        "family": "amazon_review_polarity_archive",
        "path": "archive1/amazon_review_polarity_csv.tgz",
        "kind": "tgz_csv_no_header",
        "columns": ["sentiment", "title", "review"],
        "platform": "web",
        "category": "product_reviews",
        "intent": "product_review_proof_objection_language",
        "license": "dataset_local",
        "max_rows": 12000,
        "max_scan_rows": 120000,
    },
]


PATTERN_BY_FEATURE = {
    "seo_intent": ["VTP-008", "VTP-040"],
    "technical_trust": ["VTP-038", "VTP-040"],
    "clear_value_prop": ["VTP-020", "VTP-038"],
    "proof_objection": ["VTP-016", "VTP-032"],
    "negative_sentiment": ["VTP-019", "VTP-020"],
    "positive_sentiment": ["VTP-032", "VTP-038"],
    "question_answer": ["VTP-005", "VTP-020"],
    "premium_claim_boundary": ["VTP-038", "VTP-040"],
    "social_microcopy": ["VTP-005", "VTP-016"],
}


def sha(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8", errors="ignore")).hexdigest()


def clean(value: Any, limit: int = 2400) -> str:
    text = re.sub(r"\\s+", " ", str(value or "")).strip()
    return text[:limit].strip()


def normalized(value: str) -> str:
    value = re.sub(r"https?://\\S+", " ", value or "")
    value = re.sub(r"@\\w+", " ", value)
    value = re.sub(r"\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b", " ", value, flags=re.I)
    value = re.sub(r"\\s+", " ", value).strip().lower()
    return value


def safe_get(row: dict[str, Any], *keys: str) -> Any:
    lowered = {str(k).lower(): v for k, v in row.items()}
    for key in keys:
        if key.lower() in lowered:
            return lowered[key.lower()]
    return None


def iter_jsonl(path: Path) -> Iterable[dict[str, Any]]:
    with path.open("r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    item = json.loads(line)
                except json.JSONDecodeError:
                    decoder = json.JSONDecoder()
                    cursor = 0
                    while cursor < len(line):
                        while cursor < len(line) and line[cursor].isspace():
                            cursor += 1
                        if cursor >= len(line):
                            break
                        try:
                            item, cursor = decoder.raw_decode(line, cursor)
                        except json.JSONDecodeError:
                            break
                        if isinstance(item, dict):
                            yield item
                    continue
                if isinstance(item, dict):
                    yield item


def iter_json_items(path: Path) -> Iterable[dict[str, Any]]:
    raw = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    if isinstance(raw, dict) and isinstance(raw.get("items"), list):
        yield from raw["items"]
    elif isinstance(raw, list):
        yield from raw
    else:
        yield raw


def iter_csv(path: Path, columns: list[str] | None = None) -> Iterable[dict[str, Any]]:
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as f:
        if columns:
            reader = csv.reader(f)
            for raw in reader:
                yield {column: raw[index] if index < len(raw) else "" for index, column in enumerate(columns)}
        else:
            yield from csv.DictReader(f)


def iter_tgz_csv(path: Path, columns: list[str]) -> Iterable[dict[str, Any]]:
    with tarfile.open(path, "r:gz") as archive:
        members = [m for m in archive.getmembers() if m.isfile() and m.name.lower().endswith(".csv")]
        for member in sorted(members, key=lambda item: item.name):
            handle = archive.extractfile(member)
            if handle is None:
                continue
            with gzip.open(handle, "rt", encoding="utf-8", errors="replace", newline="") if member.name.endswith(".gz") else handle as raw_handle:
                text_handle = raw_handle
                if not hasattr(text_handle, "readline") or isinstance(text_handle.readline(0), bytes):
                    import io

                    text_handle = io.TextIOWrapper(raw_handle, encoding="utf-8", errors="replace", newline="")
                reader = csv.reader(text_handle)
                for raw in reader:
                    yield {column: raw[index] if index < len(raw) else "" for index, column in enumerate(columns)}


def iter_source_rows(input_dir: Path, source: dict[str, Any]) -> Iterable[dict[str, Any]]:
    path = input_dir / source["path"]
    if source["kind"] == "jsonl":
        yield from iter_jsonl(path)
    elif source["kind"] == "json_items":
        yield from iter_json_items(path)
    elif source["kind"] == "csv_header":
        yield from iter_csv(path)
    elif source["kind"] == "csv_no_header":
        yield from iter_csv(path, source["columns"])
    elif source["kind"] == "tgz_csv_no_header":
        yield from iter_tgz_csv(path, source["columns"])
    else:
        raise ValueError(f"Unknown source kind: {source['kind']}")


def source_text(source: dict[str, Any], row: dict[str, Any]) -> str:
    family = source["family"]
    if family == "seo_glossary":
        return clean(f"{safe_get(row, 'term')} {safe_get(row, 'definition')} {safe_get(row, 'category')} {safe_get(row, 'importance')} {safe_get(row, 'related_terms')}")
    if family == "leadgen_seo_qa":
        return clean(f"{safe_get(row, 'question')} {safe_get(row, 'answer')} {safe_get(row, 'keywords')}")
    if family == "seo_serp_signals":
        return clean(f"{safe_get(row, 'words')} {safe_get(row, 'rank')} {safe_get(row, 'title')} {safe_get(row, 'h1')} {safe_get(row, 'snippet')}")
    if family == "twitter_sentiment":
        return clean(safe_get(row, "text"), 1000)
    if family.startswith("amazon_review"):
        return clean(f"{safe_get(row, 'title')} {safe_get(row, 'review')}", 1600)
    return clean(" ".join(str(v) for v in row.values()))


def feature_flags(source: dict[str, Any], row: dict[str, Any], text: str) -> list[str]:
    n = text.lower()
    family = source["family"]
    flags: list[str] = []
    if "seo" in family:
        flags.append("seo_intent")
    if re.search(r"\\b(technical|crawl|index|schema|structured|robots|sitemap|canonical|rank|h1|snippet)\\b", n):
        flags.append("technical_trust")
    if re.search(r"\\b(keyword|intent|title|description|readability|content|landing|conversion|lead)\\b", n):
        flags.append("clear_value_prop")
    if re.search(r"\\?|what|how|why|when|is it|difference", n):
        flags.append("question_answer")
    if re.search(r"\\b(legal|claim|compliance|can-spam|disclosure|safe|risk|evidence)\\b", n):
        flags.append("premium_claim_boundary")
    if family == "twitter_sentiment":
        flags.append("social_microcopy")
        sentiment = str(safe_get(row, "sentiment") or "")
        flags.append("positive_sentiment" if sentiment == "4" else "negative_sentiment")
    if family.startswith("amazon_review"):
        flags.append("proof_objection")
        sentiment = str(safe_get(row, "sentiment") or "")
        flags.append("positive_sentiment" if sentiment == "2" else "negative_sentiment")
    return list(dict.fromkeys(flags or ["clear_value_prop"]))


def derived_patterns(flags: list[str]) -> list[str]:
    patterns: list[str] = []
    for flag in flags:
        patterns.extend(PATTERN_BY_FEATURE.get(flag, []))
    return list(dict.fromkeys(patterns or ["VTP-038"]))


def risk_level(source: dict[str, Any], text: str) -> str:
    n = text.lower()
    if source.get("eval_only"):
        return "medium"
    if re.search(r"\\b(suicide|self harm|weapon|murder|rape|porn|explicit)\\b", n):
        return "restricted"
    if re.search(r"\\b(legal|finance|medical|health|child|kid|politic|hate|claim|guarantee|can-spam)\\b", n):
        return "medium"
    return "low"


def observation(source: dict[str, Any], row: dict[str, Any], row_index: int) -> dict[str, Any] | None:
    text = source_text(source, row)
    norm = normalized(text)
    if len(norm) < 20:
        return None
    raw_hash = sha(norm)
    content_hash = sha(f"book_train_extended_v1|{source['family']}|{raw_hash}")
    flags = feature_flags(source, row, text)
    risk = risk_level(source, text)
    rank = 0.0
    try:
        rank = float(str(safe_get(row, "rank") or "0").replace(",", ""))
    except ValueError:
        rank = 0.0
    sentiment = str(safe_get(row, "sentiment") or "")
    weight = 0.44 + min(0.18, len(flags) * 0.025)
    if "seo" in source["family"]:
        weight += 0.12
    if rank and rank <= 10:
        weight += 0.08
    if sentiment in {"2", "4"}:
        weight += 0.05
    if risk == "medium":
        weight -= 0.08
    if risk == "restricted":
        weight -= 0.25
    weight = round(max(0.12, min(0.92, weight)), 4)
    training_use = "eval_only" if source.get("eval_only") else ("negative_example" if risk == "restricted" else "pattern_only")
    if source["family"] == "seo_serp_signals" and rank > 25:
        training_use = "trend_signal_only"
    abstract = (
        f"Book-Train extended observation. Family={source['family']}. "
        f"Intent={source['intent']}. Feature flags: {', '.join(flags)}. "
        f"Raw surface hidden; raw_text_hash={raw_hash[:16]}. "
        "Use only as abstract SEO, premium web-copy, caption/comment, sentiment, trust, "
        "objection-handling or brand-safety signal. Do not copy raw row text, URL, username, "
        "email, source wording, product review, brand claim or exact phrase."
    )
    return {
        "content_hash": content_hash,
        "hf_repo_id": f"book_train/{source['family']}",
        "hf_config": source["kind"],
        "hf_split": "prepared",
        "hf_row_id": f"{source['family']}_{row_index}",
        "row_index": row_index,
        "platform": source["platform"],
        "category_slug": source["category"],
        "locale": "GLOBAL",
        "source_family": source["family"],
        "source_intent": source["intent"],
        "license": source["license"],
        "rights_policy": "pattern_only_no_surface",
        "abstract_text": abstract,
        "metrics": {
            "row_index": row_index,
            "rank": rank,
            "sentiment_label": sentiment,
            "raw_length_chars": len(text),
        },
        "surface_features": flags,
        "craft_features": flags,
        "book_train_layer": "extended_marketing_seo_social",
        "derived_pattern_ids": derived_patterns(flags),
        "training_weight": weight,
        "training_use": training_use,
        "risk_level": risk,
        "copy_risk": "high",
        "raw_text_hash": raw_hash,
        "source_ref": source["family"],
    }


def deterministic_keep(raw_hash: str, target_rows: int, max_scan_rows: int) -> bool:
    if max_scan_rows <= target_rows:
        return True
    threshold = min(1.0, target_rows / max_scan_rows)
    bucket = int(raw_hash[:12], 16) / float(0xFFFFFFFFFFFF)
    return bucket <= threshold


def select_source_rows(input_dir: Path, source: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    selected: dict[str, dict[str, Any]] = {}
    scanned = eligible = duplicates = restricted = 0
    max_rows = int(source.get("max_rows", 10000))
    max_scan_rows = int(source.get("max_scan_rows", max_rows * 5))
    for index, row in enumerate(iter_source_rows(input_dir, source), 1):
        if max_scan_rows > 0 and index > max_scan_rows:
            break
        scanned += 1
        obs = observation(source, row, index)
        if not obs:
            continue
        if not deterministic_keep(obs["content_hash"], max_rows * 3, max_scan_rows):
            continue
        eligible += 1
        if obs["training_use"] == "negative_example":
            restricted += 1
        key = obs["content_hash"]
        existing = selected.get(key)
        if existing:
            duplicates += 1
            if float(obs["training_weight"]) > float(existing["training_weight"]):
                selected[key] = obs
            continue
        selected[key] = obs
    rows = sorted(selected.values(), key=lambda item: (-float(item["training_weight"]), item["content_hash"]))[:max_rows]
    return rows, {
        "family": source["family"],
        "path": source["path"],
        "scanned": scanned,
        "eligible": eligible,
        "selected": len(rows),
        "duplicates": duplicates,
        "restricted": restricted,
        "max_rows": max_rows,
        "max_scan_rows": max_scan_rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default=str(DEFAULT_INPUT))
    parser.add_argument("--out-dir", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--output-name", default="book_train_extended_v1.jsonl")
    parser.add_argument("--source-filter", default="")
    parser.add_argument("--max-rows-per-source", type=int, default=0)
    parser.add_argument("--max-scan-rows-per-source", type=int, default=0)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    input_dir = Path(args.input_dir).resolve()
    out_dir = Path(args.out_dir).resolve()
    output_path = out_dir / args.output_name
    manifest_path = out_dir / args.output_name.replace(".jsonl", ".manifest.json")

    source_filter = args.source_filter.strip().lower()
    sources = []
    for source in SOURCES:
        adjusted = dict(source)
        if source_filter and source_filter not in adjusted["family"].lower() and source_filter not in adjusted["path"].lower():
            continue
        if args.max_rows_per_source > 0:
            adjusted["max_rows"] = min(int(adjusted.get("max_rows", args.max_rows_per_source)), args.max_rows_per_source)
        if args.max_scan_rows_per_source > 0:
            adjusted["max_scan_rows"] = min(int(adjusted.get("max_scan_rows", args.max_scan_rows_per_source)), args.max_scan_rows_per_source)
        if not (input_dir / adjusted["path"]).exists():
            continue
        sources.append(adjusted)

    plan = {
        "mode": "book_train_extended_prepare",
        "input_ref": str(input_dir),
        "output_file": str(output_path),
        "source_count": len(sources),
        "sources": [{"family": s["family"], "path": s["path"], "kind": s["kind"]} for s in sources],
        "apply": args.apply,
    }
    if not args.apply:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
        return

    out_dir.mkdir(parents=True, exist_ok=True)
    total = 0
    stats = []
    seen = set()
    with output_path.open("w", encoding="utf-8") as out:
        for source in sources:
            rows, source_stats = select_source_rows(input_dir, source)
            stats.append(source_stats)
            for row in rows:
                if row["content_hash"] in seen:
                    continue
                seen.add(row["content_hash"])
                out.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\
                total += 1
    manifest = {
        **plan,
        "apply": True,
        "total_rows": total,
        "stats": stats,
        "policy": "pattern_only_no_surface_copy",
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()