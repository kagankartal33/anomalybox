import argparse
import csv
import hashlib
import json
import math
import os
import re
import sqlite3
import subprocess
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

csv.field_size_limit(1024 * 1024 * 64)

BOOK_CATEGORY_SLUGS = [
    "bureaucratic_comedy",
    "absurd_procedure",
    "book_launch_content",
    "literary_lifestyle",
    "narrative_serial_content",
    "comedy_worldbuilding",
    "visual_meme_post",
    "author_brand_content",
]

BOOK_SQLITE_TABLES = {
    "joke_mechanics",
    "learned_craft_patterns",
    "narrator_moves",
    "rhetorical_devices",
    "story_beats",
    "chapter_blueprints",
    "craft_pattern_instances",
    "evaluation_prompts",
    "eval_examples",
    "chapter_analysis",
    "scene_analysis",
    "setup_payoff_links",
    "style_features",
    "book_bible",
    "chapter_linkages",
}

BOOK_PRIORITY_PATHS = [
    "bookcomedyalgo",
    "codex_comedy_system_package",
    "x-post-generator",
    "pubfix",
    "omnibus_2li",
    "1.kitap",
    "2.kitap",
    "3.kitap",
    "4.kitap",
    "5.kitap",
    "6.kitap",
    "2bookreadyto",
]

SKIP_DIRS = {
    ".git",
    ".kilo",
    ".sixth",
    ".vscode",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    ".next",
    "dist",
    "build",
}

SKIP_SUFFIXES = {
    ".exe",
    ".dll",
    ".bin",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".ico",
    ".pdf",
    ".map",
    ".mp4",
    ".mov",
    ".zip",
}


def sha(value: str) -> str:
    return hashlib.sha256((value or "").encode("utf-8", errors="ignore")).hexdigest()


def file_sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def clean(value, limit=1200):
    value = re.sub(r"\s+", " ", str(value or "")).strip()
    return value[:limit].strip()


def content_identity(text: str) -> str:
    normalized = re.sub(r"\s+", " ", str(text or "").strip().lower())
    normalized = re.sub(r"[\"'`´“”‘’]+", "", normalized)
    normalized = re.sub(r"[^a-z0-9ığüşöçİĞÜŞÖÇ\s:_/-]+", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return sha(f"normalized_content|{normalized}")


def slug(value: str) -> str:
    s = str(value or "").lower()
    tr = str.maketrans({"ı": "i", "ğ": "g", "ü": "u", "ş": "s", "ö": "o", "ç": "c", "İ": "i"})
    s = s.translate(tr)
    s = s.replace("&", " and ").replace("+", " plus ")
    s = re.sub(r"[^a-z0-9]+", "_", s).strip("_")
    s = re.sub(r"_+", "_", s)
    return (s or "dataset_category")[:80].strip("_")


def sqlq(value) -> str:
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def json_sql(value) -> str:
    return sqlq(json.dumps(value, ensure_ascii=False, separators=(",", ":"))) + "::jsonb"


def array_sql(values) -> str:
    values = [str(v) for v in values or [] if str(v or "").strip()]
    return "array[" + ",".join(sqlq(v) for v in values) + "]::text[]"


def infer_platform(text, path):
    n = f"{text} {path}".lower()
    if "instagram" in n or "reels" in n:
        return "instagram_reels"
    if "tiktok" in n:
        return "tiktok"
    if "youtube" in n or "shorts" in n:
        return "youtube_shorts"
    if "twitter" in n or "x.com" in n or "x-post" in n:
        return "x"
    return "internet"


def infer_category(text):
    n = (text or "").lower()
    checks = [
        ("bureaucratic_comedy", r"bureaucr|forms?|paperwork|office|policy|procedure|compliance|approval|queue|stamp|kurum|bürokr"),
        ("absurd_procedure", r"absurd|surreal|nonsense|procedure|ritual|impossible process|logic loop"),
        ("book_launch_content", r"book launch|kdp|publish|author|cover|chapter|manuscript|epub|kindle|kitap|yayın"),
        ("literary_lifestyle", r"literary|reading|reader|novel|library|book club|writing life|yazar|okur"),
        ("narrative_serial_content", r"series|episode|chapter|serial|arc|cliffhanger|story beat|season"),
        ("comedy_worldbuilding", r"worldbuilding|character arc|lore|universe|cast|setting|fictional"),
        ("visual_meme_post", r"meme|visual identity|post batch|caption|qa score|template|x-post"),
        ("beauty", r"beauty|makeup|skin|hair|dermatology|salon|glow"),
        ("fashion", r"fashion|outfit|style|red carpet|jewelry|watch"),
        ("travel", r"travel|hotel|flight|tour|resort|route"),
        ("food", r"food|recipe|restaurant|coffee|cafe|bakery|taste"),
        ("luxury", r"luxury|premium|wealth|quiet luxury"),
        ("commerce_affiliate", r"shop|shopping|affiliate|commerce|brand deal|sponsor|product"),
        ("fitness_wellness_safe", r"fitness|wellness|gym|workout|nutrition|health"),
        ("creator_education", r"education|tutorial|how to|ai|tech|software|guide|lesson"),
        ("thought_leadership", r"opinion|politic|public figure|movement|leadership|analysis"),
        ("parenting_family", r"family|parent|baby|kid|child"),
        ("celebrity_fan_lore", r"celebrity|fan|fandom|lore|red carpet|award|premiere"),
        ("entertainment_comedy", r"comedy|funny|meme|joke|challenge|prank|entertainment|humor|mizah"),
    ]
    for name, pattern in checks:
        if re.search(pattern, n):
            return name
    return "lifestyle"


def book_category_for(text, rel):
    n = f"{text} {rel}".lower().replace("\\", "/")
    if "x-post-generator" in n or "visual_identity" in n or "performance.json" in n or "post_batch" in n:
        return "visual_meme_post"
    if "bookcomedyalgo" in n or "codex_comedy_system_package" in n:
        return "bureaucratic_comedy"
    if re.search(r"book launch|kdp|cover|publish|epub|kindle|bookready|pubfix", n):
        return "book_launch_content"
    if re.search(r"chapter|story beat|character|worldbuilding|lore|arc", n):
        return "comedy_worldbuilding"
    if re.search(r"serial|episode|cliffhanger|installment", n):
        return "narrative_serial_content"
    return infer_category(n)


def risk_for(text):
    n = (text or "").lower()
    if re.search(r"gambling|casino|tobacco|weapon|adult|explicit|dangerous|injury|choking|salt and ice", n):
        return "restricted"
    if re.search(r"health|medical|doctor|diet|weight|finance|investment|crypto|legal|law|child|kid|baby|politic|public figure|sponsor|affiliate|\bad\b", n):
        return "medium"
    return "low"


def patterns_for(text):
    n = (text or "").lower()
    pairs = [
        ("VTP-001", r"challenge|duet|stitch|nomination|participation"),
        ("VTP-002", r"nostalgia|throwback|2016|2017|2018|2019|yearbook|then and now"),
        ("VTP-003", r"meme|template|joke|humor|funny|remix|comedy|mizah"),
        ("VTP-004", r"transition|reveal|before|after|glow|transformation"),
        ("VTP-005", r"comment|poll|interactive|audience|viewer|live"),
        ("VTP-006", r"\bai\b|artificial intelligence|deepfake|synthetic"),
        ("VTP-036", r"\bai\b|artificial intelligence|deepfake|synthetic"),
        ("VTP-007", r"behind the scenes|bts|process|unfiltered|mistake|workflow|draft"),
        ("VTP-019", r"behind the scenes|bts|process|unfiltered|mistake|workflow|draft"),
        ("VTP-008", r"commerce|shopping|shop|buy|affiliate|brand deal|sponsor|\bad\b"),
        ("VTP-021", r"commerce|shopping|shop|buy|affiliate|brand deal|sponsor|\bad\b"),
        ("VTP-040", r"commerce|shopping|shop|buy|affiliate|brand deal|sponsor|\bad\b"),
        ("VTP-009", r"community|co-design|campaign|ugc|submission"),
        ("VTP-017", r"community|co-design|campaign|ugc|submission"),
        ("VTP-010", r"movement|values|solidarity|activism"),
        ("VTP-011", r"surreal|absurd|chaos|maximalism|fast edit|bureaucr|procedure|paperwork"),
        ("VTP-022", r"surreal|absurd|chaos|maximalism|fast edit"),
        ("VTP-012", r"fan|fandom|lore|celebrity|award|premiere|universe|worldbuilding"),
        ("VTP-023", r"expert|authority|explainer|analysis|breakdown|craft|rubric"),
        ("VTP-031", r"lore|ritual|symbol|recurring joke|inside joke"),
        ("VTP-013", r"how to|guide|checklist|search|tutorial|faq|save|template"),
        ("VTP-038", r"how to|guide|checklist|search|tutorial|faq|save|template"),
        ("VTP-014", r"series|episode|weekly|daily|recurring|chapter|serial"),
        ("VTP-029", r"series|episode|weekly|daily|recurring|shorts|long-form"),
        ("VTP-015", r"dm|broadcast|private|close friends"),
        ("VTP-030", r"dm|broadcast|private|close friends"),
        ("VTP-016", r"reaction|response|reply|take|opinion|objection"),
        ("VTP-032", r"reaction|response|reply|take|opinion|objection"),
        ("VTP-018", r"trend|curate|taste|editorial|filter"),
        ("VTP-020", r"curiosity|surprise|unexpected|why|cliffhanger|payoff"),
        ("VTP-025", r"proof|receipt|review|comparison|trust|myth|debunk"),
        ("VTP-028", r"proof|receipt|review|comparison|trust|myth|debunk"),
        ("VTP-035", r"proof|receipt|review|comparison|trust|myth|debunk"),
        ("VTP-037", r"local|turkey|regional|city|culture"),
        ("VTP-039", r"texture|sound|sensory|close-up|taste|touch|visual"),
    ]
    out = []
    for pid, pattern in pairs:
        if re.search(pattern, n) and pid not in out:
            out.append(pid)
    return out or ["VTP-026", "VTP-027"]


def triggers_for(text):
    n = (text or "").lower()
    out = ["curiosity", "recognition"]
    for label, pattern in [
        ("humor", r"funny|joke|meme|comedy|absurd|mizah"),
        ("trust", r"trust|proof|review|rubric|qa"),
        ("aspiration", r"luxury|premium|aspiration"),
        ("nostalgia", r"nostalgia|throwback"),
        ("debate", r"debate|comment|opinion|objection"),
        ("story_payoff", r"payoff|arc|cliffhanger|twist|chapter"),
    ]:
        if re.search(pattern, n):
            out.append(label)
    return list(dict.fromkeys(out))


def metric(row, *names):
    lower = {k.lower(): v for k, v in row.items()}
    for name in names:
        raw = str(lower.get(name.lower(), "")).replace(",", "")
        try:
            return float(raw) if raw else 0.0
        except ValueError:
            pass
    return 0.0


def weight_for(views, likes, comments, shares, saves, text, risk):
    engagement = likes + comments * 3 + shares * 5 + saves * 6
    base = 0.18
    if views > 0:
        base += min(0.34, math.log10(views + 10) / 20)
    if engagement > 0:
        base += min(0.28, math.log10(engagement + 10) / 18)
    if len(text or "") > 80:
        base += 0.08
    if risk == "restricted":
        base -= 0.18
    elif risk == "medium":
        base -= 0.06
    return round(max(0.05, min(1.0, base)), 4)


def book_weight_for(text, source_kind, rel):
    n = f"{text} {rel}".lower()
    base = 0.56
    if any(token in n for token in ["joke", "comedy", "absurd", "bureaucr", "payoff", "hook", "caption"]):
        base += 0.1
    if any(token in n for token in ["rubric", "qa", "evaluation", "performance", "visual_identity"]):
        base += 0.08
    if source_kind in {"sqlite", "json", "jsonl"}:
        base += 0.04
    if any(token in n for token in ["tinystories", "creative_writing", "hitchhiker"]):
        base -= 0.16
    return round(max(0.28, min(0.86, base)), 4)


def entity_refs(row, source_path, category, platform):
    refs = []
    for col in ["Name", "channel_title", "author", "author_handle", "Audience Country"]:
        value = clean(row.get(col), 180)
        if value and len(value) > 1:
            etype = "creator" if re.search(r"Name|channel|author", col) else "unknown"
            h = sha(f"{col}|{value}")[:16]
            refs.append({
                "entity_ref": f"{etype}_ref_{h}",
                "entity_type": etype,
                "entity_hash": h,
                "source_path": source_path,
                "category_slug": category,
                "platform": platform,
                "viral_context": "Internal provenance only; use category and mechanism, not identity.",
                "metadata": {"column": col, "value_hash": h, "anti_copy": True, "creator_visible": False},
            })
    return refs


def db_container():
    out = subprocess.check_output(["docker", "ps", "--format", "{{.Names}}"], text=True)
    names = out.splitlines()
    if "supabase_db_ViralBox" in names:
        return "supabase_db_ViralBox"
    for name in names:
        if name.startswith("supabase_db_"):
            return name
    raise RuntimeError("Could not find running Supabase database container. Run supabase start first.")


def run_sql(sql_text):
    proc = subprocess.run(
        ["docker", "exec", "-i", db_container(), "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-P", "pager=off"],
        input=sql_text,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stdout)
    return proc.stdout


def batched(items, size):
    for i in range(0, len(items), size):
        yield items[i:i + size]


def rel_path(path: Path, root: Path):
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def should_skip_path(path: Path, dataset: Path):
    rel_parts = [p.lower() for p in path.relative_to(dataset).parts]
    if any(part in SKIP_DIRS for part in rel_parts):
        return True, "skip_dir"
    if path.suffix.lower() in SKIP_SUFFIXES:
        return True, "skip_suffix"
    return False, None


def chunk_text(raw: str, max_chars=1800, min_chars=80):
    raw = re.sub(r"\r\n?", "\n", raw or "")
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


def flatten_json(value, limit=2200):
    values = []

    def walk(node, key=""):
        if len(" ".join(values)) > limit:
            return
        if isinstance(node, dict):
            for k, v in node.items():
                if str(k).lower() in {"id", "uuid", "created_at", "updated_at", "hash"}:
                    continue
                walk(v, str(k))
        elif isinstance(node, list):
            for item in node[:80]:
                walk(item, key)
        else:
            text = clean(node, 500)
            if text and not re.fullmatch(r"[-+]?\d+(\.\d+)?", text):
                values.append(f"{key}: {text}" if key else text)

    walk(value)
    return clean(" | ".join(values), limit)


def read_docx(path: Path):
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    texts = []
    for node in root.iter():
        if node.tag.endswith("}t") and node.text:
            texts.append(node.text)
    return "\n".join(texts)


def read_epub(path: Path):
    texts = []
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
            texts.append(raw)
    return "\n".join(texts)


def iter_sqlite_rows(path: Path):
    con = sqlite3.connect(str(path))
    con.row_factory = sqlite3.Row
    try:
        tables = [
            row["name"]
            for row in con.execute("select name from sqlite_master where type = 'table'")
            if row["name"] in BOOK_SQLITE_TABLES
        ]
        for table in tables:
            columns = [row["name"] for row in con.execute(f"pragma table_info({table})")]
            quoted_cols = ", ".join(f'"{c}"' for c in columns)
            for idx, row in enumerate(con.execute(f'select {quoted_cols} from "{table}"'), 1):
                data = dict(row)
                text = flatten_json(data, 2200)
                if len(text) >= 50:
                    yield table, idx, text, data
    finally:
        con.close()


def parse_sql_chunks(path: Path):
    lower_name = path.name.lower()
    if not any(table in lower_name for table in BOOK_SQLITE_TABLES | {"training_samples", "text_segments"}):
        return
    with path.open("r", encoding="utf-8", errors="replace") as f:
        buffer = []
        idx = 0
        for line in f:
            if not re.search(r"insert|values|\(|\)|'[A-Za-z0-9]", line, re.I):
                continue
            buffer.append(line.strip())
            if len(buffer) >= 20:
                idx += 1
                text = clean(" ".join(buffer), 1800)
                if len(text) >= 80:
                    yield idx, text
                buffer = []
        if buffer:
            idx += 1
            text = clean(" ".join(buffer), 1800)
            if len(text) >= 80:
                yield idx, text


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset-path", default="./dataset")
    ap.add_argument("--compile-version", default="2026-v2-dataset")
    ap.add_argument("--source-slug", default="dataset_full_training_v2")
    ap.add_argument("--trend-source", default=None)
    ap.add_argument("--mode", choices=["dataset", "book"], default="dataset")
    ap.add_argument("--batch-size", type=int, default=650)
    ap.add_argument("--max-training-examples", type=int, default=25000)
    ap.add_argument("--max-trend-signals", type=int, default=12000)
    ap.add_argument("--max-eval-cases", type=int, default=200)
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    if not re.match(r"^[a-z0-9]+(-[a-z0-9]+)*$", args.compile_version):
        raise SystemExit("compile version must be lowercase kebab-case")
    if not re.match(r"^[a-z0-9]+(_[a-z0-9]+)*$", args.source_slug):
        raise SystemExit("source slug must be lowercase snake_case")
    if args.trend_source is None:
        args.trend_source = "book_training_v1" if args.mode == "book" else "dataset_training_v2"

    root = Path.cwd()
    dataset = Path(args.dataset_path).resolve()
    seen_files, seen_obs = set(), set()
    observations, entities, categories = [], {}, {}
    stats = {
        "mode": args.mode,
        "source_slug": args.source_slug,
        "files": 0,
        "duplicate_files": 0,
        "skipped_files": 0,
        "quarantine_count": 0,
        "csv_rows": 0,
        "markdown_chunks": 0,
        "text_chunks": 0,
        "notebook_cells": 0,
        "json_rows": 0,
        "jsonl_rows": 0,
        "db_rows": 0,
        "sql_chunks": 0,
        "docx_chunks": 0,
        "epub_chunks": 0,
        "observations": 0,
        "duplicates": 0,
        "entities": 0,
    }

    def add_category(category, source_path, risk):
        if not category:
            return
        row = categories.setdefault(category, {"slug": category, "name": category.replace("_", " ").title(), "source_path": source_path, "source_count": 0, "risk_level": "low"})
        row["source_count"] += 1
        if risk == "restricted":
            row["risk_level"] = "restricted"
        elif risk == "medium" and row["risk_level"] == "low":
            row["risk_level"] = "medium"

    def add_observation(row):
        if row["content_hash"] in seen_obs:
            stats["duplicates"] += 1
            return
        seen_obs.add(row["content_hash"])
        observations.append(row)
        stats["observations"] += 1

    def add_book_observation(text, path, source_kind, row_number=None, chunk_index=None, extra=None):
        rel = rel_path(path, root)
        text = clean(text, 1800)
        if len(text) < 50:
            return
        platform = infer_platform(text, rel)
        category = book_category_for(text, rel)
        risk = risk_for(text)
        h = content_identity(text)
        training_use = "eval_only" if re.search(r"tinystories|creative_writing|hitchhiker|validation", rel, re.I) else ("negative_example" if risk == "restricted" else "pattern_only")
        metadata = {
            "anti_copy": True,
            "surface_not_allowed": True,
            "source_extension": path.suffix.lower(),
            "source_slug": args.source_slug,
            "source_class": "book_craft_training",
            "training_policy": "structure_or_pattern_only",
            "use_surface": False,
            "creator_visible": False,
        }
        if extra:
            metadata.update(extra)
        add_category(category, rel, risk)
        add_observation({
            "content_hash": h,
            "source_path": rel,
            "source_kind": source_kind,
            "row_number": row_number,
            "chunk_index": chunk_index,
            "platform": platform,
            "category_slug": category,
            "locale": "GLOBAL",
            "title_algorithmic": f"Book craft training signal {h[:12]}",
            "text_signals": {
                "abstract_text": text,
                "emotional_triggers": triggers_for(text),
                "source_policy": "internal_pattern_only_no_surface_copy",
            },
            "metric_signals": {},
            "derived_pattern_ids": patterns_for(text),
            "named_entity_refs": [],
            "training_weight": book_weight_for(text, source_kind, rel),
            "copy_risk": "high",
            "risk_level": risk,
            "training_use": training_use,
            "quarantine_reason": None,
            "metadata": metadata,
        })

    if args.mode == "book":
        for category in BOOK_CATEGORY_SLUGS:
            add_category(category, "book_source_policy", "low")

    allowed_suffixes = [".csv", ".md", ".ipynb"] if args.mode == "dataset" else [
        ".md", ".txt", ".json", ".jsonl", ".sql", ".db", ".sqlite", ".sqlite3", ".docx", ".epub"
    ]
    files = sorted([p for p in dataset.rglob("*") if p.is_file() and p.suffix.lower() in allowed_suffixes])
    for path in files:
        skip, reason = should_skip_path(path, dataset)
        if skip:
            stats["skipped_files"] += 1
            continue
        try:
            fh = file_sha(path)
        except Exception:
            stats["quarantine_count"] += 1
            continue
        if fh in seen_files:
            stats["duplicate_files"] += 1
            continue
        seen_files.add(fh)
        stats["files"] += 1
        rel = rel_path(path, root)
        ext = path.suffix.lower()

        try:
            if args.mode == "dataset" and ext == ".csv":
                with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as f:
                    reader = csv.DictReader(f)
                    for idx, row in enumerate(reader, 1):
                        stats["csv_rows"] += 1
                        text = clean(" ".join(str(row.get(k, "")) for k in [
                            "title", "Title", "description", "Description", "Hashtag", "hashtag", "hashtags",
                            "topic", "category", "Category", "tags", "sample_comments", "trend_label",
                            "sound_or_trend", "Content_Type", "post_type"
                        ]), 1200)
                        if not text:
                            text = f"dataset csv row {idx} from {rel}"
                        platform = infer_platform(f"{row.get('platform', '')} {text}", rel)
                        raw_cat = row.get("category") or row.get("Category") or row.get("topic") or ""
                        category = slug(raw_cat) if raw_cat else infer_category(text)
                        risk = risk_for(f"{text} {raw_cat}")
                        views, likes = metric(row, "views", "Views", "total_views"), metric(row, "likes", "Likes", "likes_sum")
                        comments, shares = metric(row, "comments", "Comments", "comments_sum"), metric(row, "shares", "Shares", "shares_sum")
                        saves = metric(row, "saves", "Saves", "saves_sum")
                        weight = weight_for(views, likes, comments, shares, saves, text, risk)
                        patterns = patterns_for(text)
                        training_use = "trend_signal_only" if weight < 0.23 or text.startswith("dataset csv row") else ("negative_example" if risk == "restricted" else "pattern_only")
                        content_hash = content_identity(f"{platform}|{category}|{text}|{views}|{likes}|{comments}|{shares}|{saves}")
                        refs = entity_refs(row, rel, category, platform)
                        for ref in refs:
                            entities[ref["entity_ref"]] = ref
                        add_category(category, rel, risk)
                        add_observation({
                            "content_hash": content_hash, "source_path": rel, "source_kind": "csv", "row_number": idx, "chunk_index": None,
                            "platform": platform, "category_slug": category, "locale": row.get("country") or row.get("region") or row.get("Audience Country") or "GLOBAL",
                            "title_algorithmic": f"Dataset pattern {content_hash[:12]}",
                            "text_signals": {"abstract_text": text, "emotional_triggers": triggers_for(text), "source_columns": list(row.keys())},
                            "metric_signals": {"views": views, "likes": likes, "comments": comments, "shares": shares, "saves": saves, "engagement_total": likes + comments + shares + saves},
                            "derived_pattern_ids": patterns, "named_entity_refs": [r["entity_ref"] for r in refs],
                            "training_weight": weight, "copy_risk": "high" if refs or risk != "low" else "medium",
                            "risk_level": risk, "training_use": training_use, "quarantine_reason": None,
                            "metadata": {"anti_copy": True, "surface_not_allowed": True, "source_extension": ".csv", "source_slug": args.source_slug, "creator_visible": False},
                        })
                continue

            if ext in {".md", ".txt"}:
                raw = path.read_text(encoding="utf-8", errors="replace")
                for idx, text in enumerate(chunk_text(raw, 1800, 80), 1):
                    if args.mode == "book":
                        stats["markdown_chunks" if ext == ".md" else "text_chunks"] += 1
                        add_book_observation(text, path, "markdown" if ext == ".md" else "text", chunk_index=idx)
                    else:
                        stats["markdown_chunks"] += 1
                        platform, category, risk = infer_platform(text, rel), infer_category(text), risk_for(text)
                        h = content_identity(text)
                        add_category(category, rel, risk)
                        add_observation({
                            "content_hash": h, "source_path": rel, "source_kind": "markdown", "row_number": None, "chunk_index": idx,
                            "platform": platform, "category_slug": category, "locale": "GLOBAL", "title_algorithmic": f"Markdown training pattern {h[:12]}",
                            "text_signals": {"abstract_text": text, "emotional_triggers": triggers_for(text), "source_doc": path.name},
                            "metric_signals": {}, "derived_pattern_ids": patterns_for(text), "named_entity_refs": [],
                            "training_weight": 0.72 if re.search(r"Ultimate|Algorithm|viral|fikir", rel, re.I) else 0.55,
                            "copy_risk": "high", "risk_level": risk, "training_use": "negative_example" if risk == "restricted" else "pattern_only",
                            "quarantine_reason": None, "metadata": {"anti_copy": True, "surface_not_allowed": True, "source_extension": ".md", "source_slug": args.source_slug, "creator_visible": False},
                        })
                continue

            if ext == ".ipynb":
                data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
                for idx, cell in enumerate(data.get("cells", []), 1):
                    source = clean("".join(cell.get("source") or []), 1600)
                    if len(source) < 60:
                        continue
                    stats["notebook_cells"] += 1
                    platform, category, risk = infer_platform(source, rel), infer_category(source), risk_for(source)
                    h = content_identity(f"{cell.get('cell_type')}|{source}")
                    add_category(category, rel, risk)
                    add_observation({
                        "content_hash": h, "source_path": rel, "source_kind": "notebook", "row_number": None, "chunk_index": idx,
                        "platform": platform, "category_slug": category, "locale": "GLOBAL", "title_algorithmic": f"Notebook training signal {h[:12]}",
                        "text_signals": {"abstract_text": source, "cell_type": cell.get("cell_type"), "emotional_triggers": triggers_for(source)},
                        "metric_signals": {}, "derived_pattern_ids": patterns_for(source), "named_entity_refs": [],
                        "training_weight": 0.48 if cell.get("cell_type") == "code" else 0.58,
                        "copy_risk": "medium", "risk_level": risk, "training_use": "eval_only",
                        "quarantine_reason": None, "metadata": {"anti_copy": True, "source_extension": ".ipynb", "source_slug": args.source_slug, "creator_visible": False},
                    })
                continue

            if args.mode == "book" and ext == ".json":
                data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
                rows = data if isinstance(data, list) else [data]
                for idx, item in enumerate(rows, 1):
                    text = flatten_json(item, 2200)
                    if len(text) >= 50:
                        stats["json_rows"] += 1
                        add_book_observation(text, path, "json", row_number=idx, extra={"json_root_type": type(data).__name__})
                continue

            if args.mode == "book" and ext == ".jsonl":
                with path.open("r", encoding="utf-8", errors="replace") as f:
                    for idx, line in enumerate(f, 1):
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            item = json.loads(line)
                        except json.JSONDecodeError:
                            stats["quarantine_count"] += 1
                            continue
                        text = flatten_json(item, 2200)
                        if len(text) >= 50:
                            stats["jsonl_rows"] += 1
                            add_book_observation(text, path, "jsonl", row_number=idx)
                continue

            if args.mode == "book" and ext in {".db", ".sqlite", ".sqlite3"}:
                for table, idx, text, data in iter_sqlite_rows(path):
                    stats["db_rows"] += 1
                    add_book_observation(text, path, "sqlite", row_number=idx, extra={"sqlite_table": table, "sqlite_columns": list(data.keys())})
                continue

            if args.mode == "book" and ext == ".sql":
                for idx, text in parse_sql_chunks(path) or []:
                    stats["sql_chunks"] += 1
                    add_book_observation(text, path, "sql", chunk_index=idx, extra={"sql_policy": "whitelist_export_pattern_only"})
                continue

            if args.mode == "book" and ext == ".docx":
                for idx, text in enumerate(chunk_text(read_docx(path), 1800, 120), 1):
                    stats["docx_chunks"] += 1
                    add_book_observation(text, path, "docx", chunk_index=idx)
                continue

            if args.mode == "book" and ext == ".epub":
                for idx, text in enumerate(chunk_text(read_epub(path), 1800, 120), 1):
                    stats["epub_chunks"] += 1
                    add_book_observation(text, path, "epub", chunk_index=idx)
                continue
        except Exception as exc:
            stats["quarantine_count"] += 1
            print(f"warning: quarantined {rel}: {exc}", file=sys.stderr)

    stats["entities"] = len(entities)
    if not args.apply:
        print(json.dumps(stats, ensure_ascii=False, indent=2))
        return

    for chunk in batched(list(categories.values()), args.batch_size):
        values = []
        for r in chunk:
            values.append("(" + ",".join([
                sqlq(r["slug"]), sqlq(r["name"]), sqlq(r["source_path"]), str(r["source_count"]), sqlq(r["risk_level"]),
                json_sql({"source": args.trend_source, "source_slug": args.source_slug, "creator_visible": False})
            ]) + ")")
        run_sql(f"""
insert into public.dataset_category_candidates (slug, name, source_path, source_count, risk_level, metadata)
values {",".join(values)}
on conflict (slug) do update set
  source_count = greatest(public.dataset_category_candidates.source_count, excluded.source_count),
  risk_level = case
    when public.dataset_category_candidates.risk_level = 'restricted' or excluded.risk_level = 'restricted' then 'restricted'::public.viral_training_risk_level
    when public.dataset_category_candidates.risk_level = 'medium' or excluded.risk_level = 'medium' then 'medium'::public.viral_training_risk_level
    else 'low'::public.viral_training_risk_level end,
  metadata = public.dataset_category_candidates.metadata || excluded.metadata,
  updated_at = now();
insert into public.categories (slug, name, family, risk_level, sort_order, metadata, enabled)
select slug, name, 'creator_content', risk_level::text, 9000,
  jsonb_build_object('source',{sqlq(args.trend_source)},'source_slug',{sqlq(args.source_slug)},'generator_use','dataset_category_discovery','creator_visible',true), true
from public.dataset_category_candidates
where status = 'approved'
on conflict (slug) do update set metadata = public.categories.metadata || excluded.metadata, enabled = true, updated_at = now();
""")

    for chunk in batched(list(entities.values()), args.batch_size):
        values = []
        for r in chunk:
            values.append("(" + ",".join([
                sqlq(r["entity_ref"]), sqlq(r["entity_type"]), sqlq(r["entity_hash"]), sqlq(r["source_path"]),
                sqlq(r["category_slug"]), sqlq(r["platform"]), sqlq(r["viral_context"]), json_sql(r["metadata"])
            ]) + ")")
        run_sql(f"""
insert into public.dataset_named_entity_provenance (entity_ref, entity_type, entity_hash, source_path, category_slug, platform, viral_context, metadata)
values {",".join(values)}
on conflict (entity_ref) do update set metadata = public.dataset_named_entity_provenance.metadata || excluded.metadata, updated_at = now();
""")

    for chunk in batched(observations, args.batch_size):
        values = []
        for r in chunk:
            values.append("(" + ",".join([
                sqlq(r["content_hash"]), sqlq(r["source_path"]), sqlq(r["source_kind"]),
                "null" if r["row_number"] is None else str(r["row_number"]),
                "null" if r["chunk_index"] is None else str(r["chunk_index"]),
                sqlq(r["platform"]), sqlq(r["category_slug"]), sqlq(r["locale"]), sqlq(r["title_algorithmic"]),
                json_sql(r["text_signals"]), json_sql(r["metric_signals"]), array_sql(r["derived_pattern_ids"]), array_sql(r["named_entity_refs"]),
                f"{r['training_weight']:.4f}", sqlq(r["copy_risk"]), f"'{r['risk_level']}'::public.viral_training_risk_level",
                sqlq(r["training_use"]), "null", json_sql(r["metadata"])
            ]) + ")")
        run_sql(f"""
insert into public.dataset_training_observations (
  content_hash, source_path, source_kind, row_number, chunk_index, platform, category_slug, locale,
  title_algorithmic, text_signals, metric_signals, derived_pattern_ids, named_entity_refs,
  training_weight, copy_risk, risk_level, training_use, quarantine_reason, metadata
) values {",".join(values)}
on conflict (content_hash) do update set
  metadata = public.dataset_training_observations.metadata || jsonb_build_object(
    'duplicate_seen_from_source_slug', excluded.metadata ->> 'source_slug',
    'duplicate_seen_from_source_path', excluded.source_path
  ),
  updated_at = now();
""")

    promote_sql = (
        PROMOTE_SQL
        .replace("__VERSION__", args.compile_version)
        .replace("__SOURCE_SLUG__", args.source_slug)
        .replace("__SOURCE_TITLE__", "Book Full Training v1" if args.mode == "book" else "Dataset Full Training v2")
        .replace("__SOURCE_URI__", str(dataset).replace("\\", "/"))
        .replace("__TREND_SOURCE__", args.trend_source)
        .replace("__SOURCE_TYPE__", "local_markdown")
        .replace("__SOURCE_CLASS__", "book_craft_training" if args.mode == "book" else "dataset_training")
        .replace("__SOURCE_NOTES__", "Book project additive training. Craft, comedy, narrative, hook/caption and editorial quality only; no creator-facing surface copy." if args.mode == "book" else "Additive dataset training from local markdown, notebook and CSV archives. Pattern-only and anti-copy; named entities are internal provenance only.")
        .replace("__MAX_TRAINING_EXAMPLES__", str(args.max_training_examples))
        .replace("__MAX_TREND_SIGNALS__", str(args.max_trend_signals))
        .replace("__MAX_EVAL_CASES__", str(args.max_eval_cases))
        .replace("__EVAL_PREFIX__", "book_eval" if args.mode == "book" else "dataset_eval")
        .replace("__TREND_FRESHNESS_MULTIPLIER__", "35" if args.mode == "book" else "100")
        .replace("__TREND_CONFIDENCE_OFFSET__", "0.22" if args.mode == "book" else "0.18")
    )
    run_sql(promote_sql)
    compile_sql = Path("supabase/seeds/viral_training_compile.sql").read_text(encoding="utf-8")
    compile_sql = compile_sql.replace("delete from public.viral_training_example_features;", f"delete from public.viral_training_example_features where training_version = '{args.compile_version}';")
    compile_sql = compile_sql.replace("2026-v1", args.compile_version)
    run_sql(compile_sql)
    validation = run_sql(
        VALIDATION_SQL
        .replace("__VERSION__", args.compile_version)
        .replace("__SOURCE_SLUG__", args.source_slug)
        .replace("__TREND_SOURCE__", args.trend_source)
        .replace("__EVAL_PREFIX__", "book_eval" if args.mode == "book" else "dataset_eval")
    )
    print(json.dumps({"dry_run_stats": stats, "applied": True, "compile_version": args.compile_version, "validation": validation}, ensure_ascii=False, indent=2))


PROMOTE_SQL = r"""
with source as (
  insert into public.viral_training_sources (slug, title, source_type, uri, coverage_start_year, coverage_end_year, reliability_notes, metadata, enabled)
  values ('__SOURCE_SLUG__','__SOURCE_TITLE__','__SOURCE_TYPE__','__SOURCE_URI__',2016,2026,
    '__SOURCE_NOTES__',
    jsonb_build_object('training_policy','pattern_only_anti_copy','source_class','__SOURCE_CLASS__','named_entity_policy','internal_provenance_only','compile_version','__VERSION__','creator_visible',false), true)
  on conflict (slug) do update set metadata = excluded.metadata, enabled = true, updated_at = now()
  returning id
),
ranked as (
  select observation.*,
    row_number() over (partition by coalesce(observation.category_slug, 'uncategorized'), observation.platform order by observation.training_weight desc, observation.imported_at desc) as segment_rank
  from public.dataset_training_observations observation
  where observation.training_use in ('pattern_only', 'negative_example', 'eval_only')
    and observation.quarantine_reason is null
    and observation.training_weight >= 0.24
    and observation.metadata ->> 'source_slug' = '__SOURCE_SLUG__'
    and not exists (
      select 1
      from public.viral_training_examples existing
      join public.viral_training_sources existing_source on existing_source.id = existing.source_id
      where existing.external_ref = observation.content_hash
        and existing_source.slug <> '__SOURCE_SLUG__'
    )
),
selected as (
  select * from ranked where segment_rank <= 1200 order by training_weight desc, imported_at desc limit __MAX_TRAINING_EXAMPLES__
)
insert into public.viral_training_examples (
  source_id, external_ref, year, platform, category_slug, title, phenomenon_type, abstracted_mechanism,
  reusable_pattern, participation_mode, emotional_triggers, format_signals, safety_risks, copy_risk, training_use, risk_level, metadata
)
select source.id, selected.content_hash, 2026, selected.platform, selected.category_slug, selected.title_algorithmic,
  case when selected.training_use = 'negative_example' then 'challenge'
       when 'VTP-006' = any(selected.derived_pattern_ids) then 'ai_format'
       when 'VTP-008' = any(selected.derived_pattern_ids) or 'VTP-040' = any(selected.derived_pattern_ids) then 'marketing_case'
       when 'VTP-001' = any(selected.derived_pattern_ids) then 'challenge'
       when 'VTP-037' = any(selected.derived_pattern_ids) then 'localization_case'
       else 'meme' end,
  case when '__SOURCE_CLASS__' = 'book_craft_training'
       then 'Book-derived craft/comedy/narrative observation; use only as an abstract mechanism and editorial quality signal, never as text, title, scene, character, quote or voice.'
       else 'Dataset-derived viral behavior observation; use only as abstract mechanism evidence, not as a title, person, sound, scene or exact format.' end,
  concat_ws(' + ', coalesce(selected.platform,'internet'), coalesce(selected.category_slug,'general'), array_to_string(selected.derived_pattern_ids,'+'), case when '__SOURCE_CLASS__' = 'book_craft_training' then 'craft signal => premium-safe pattern translation' else 'weighted signal => premium-safe pattern translation' end),
  case when '__SOURCE_CLASS__' = 'book_craft_training' then 'abstract craft/comedy/editorial structure signal' else 'dataset-derived abstract participation or trend signal' end,
  coalesce(array(select jsonb_array_elements_text(selected.text_signals -> 'emotional_triggers')), array['curiosity','recognition']::text[]),
  selected.derived_pattern_ids,
  array_remove(array[
    case when selected.risk_level in ('medium','restricted') then 'safety_review' end,
    case when selected.copy_risk = 'high' then 'copy_risk' end,
    case when cardinality(selected.named_entity_refs) > 0 then 'named_entity_internal_only' end,
    case when selected.training_use = 'negative_example' then 'negative_example_guardrail' end,
    case when '__SOURCE_CLASS__' = 'book_craft_training' then 'source_surface_never_copy' end
  ], null),
  selected.copy_risk,
  case selected.training_use when 'negative_example' then 'negative_example' when 'eval_only' then 'eval_only' else 'pattern_only' end,
  selected.risk_level,
  selected.metadata || jsonb_build_object('dataset_observation_id', selected.id, 'source_path', selected.source_path, 'training_weight', selected.training_weight, 'named_entity_refs', selected.named_entity_refs, 'named_entity_policy', 'internal_provenance_only', 'anti_copy', true, 'use_surface', false, 'creator_visible', false)
from source cross join selected
on conflict (source_id, external_ref) do update set metadata = excluded.metadata, updated_at = now();

delete from public.trend_signals
where source = '__TREND_SOURCE__';

insert into public.trend_signals (source, platform, locale, signal, metadata, freshness_score, confidence_score, expires_at)
select '__TREND_SOURCE__', observation.platform, observation.locale,
  concat('__TREND_SOURCE__:', observation.platform, ':', coalesce(observation.category_slug, 'general'), ':', observation.content_hash),
  jsonb_build_object('category_slug', observation.category_slug, 'metric_signals', observation.metric_signals, 'derived_pattern_ids', observation.derived_pattern_ids, 'training_weight', observation.training_weight, 'source_path', observation.source_path, 'source_class', '__SOURCE_CLASS__', 'creator_visible', false),
  round((observation.training_weight * __TREND_FRESHNESS_MULTIPLIER__)::numeric, 2),
  round((least(1.0, observation.training_weight + __TREND_CONFIDENCE_OFFSET__) * 100)::numeric, 2),
  now() + interval '180 days'
from public.dataset_training_observations observation
where observation.quarantine_reason is null
  and observation.metadata ->> 'source_slug' = '__SOURCE_SLUG__'
  and (observation.training_use = 'trend_signal_only' or observation.metric_signals <> '{}'::jsonb or '__SOURCE_CLASS__' = 'book_craft_training')
order by observation.training_weight desc, observation.imported_at desc
limit __MAX_TREND_SIGNALS__;

insert into public.generator_eval_cases (slug, title, category_slug, persona_slug, input_brief, expected_patterns, forbidden_patterns, quality_rubric, enabled)
select concat('__EVAL_PREFIX__', '_', substring(observation.content_hash from 1 for 18)),
  concat(case when '__SOURCE_CLASS__' = 'book_craft_training' then 'Book craft eval ' else 'Dataset eval ' end, substring(observation.content_hash from 1 for 12)),
  observation.category_slug, null,
  jsonb_build_object('brief', case when '__SOURCE_CLASS__' = 'book_craft_training'
    then 'Generate a premium Instagram idea using only abstract craft/comedy/narrative lessons. Do not copy source wording, character, title, scene, quote, file name or internal source.'
    else 'Generate a premium Instagram idea from this abstract dataset signal without copying names, titles, surfaces, sounds or exact scenes.' end,
    'platform', observation.platform, 'category_slug', observation.category_slug, 'named_entity_policy', 'do_not_use_names_or_likeness', 'creator_visible', false),
  observation.derived_pattern_ids,
  array['copy_surface','named_person_imitation','score_leak','dataset_source_leak','book_source_leak','exact_quote','source_filename_leak'],
  jsonb_build_object('must_include', jsonb_build_array('hook_performance_pack','brand_safety','production_plan','variant_pack','scene_script','pose_direction'), 'must_not_include', jsonb_build_array('real person name','source title','internal score','training source','exact quote','character name'), 'minimum_editorial_quality', 86, 'creator_visible', false),
  true
from public.dataset_training_observations observation
where observation.quarantine_reason is null
  and observation.metadata ->> 'source_slug' = '__SOURCE_SLUG__'
  and observation.training_weight >= 0.58
order by observation.training_weight desc, observation.imported_at desc
limit __MAX_EVAL_CASES__
on conflict (slug) do update set input_brief = excluded.input_brief, expected_patterns = excluded.expected_patterns, forbidden_patterns = excluded.forbidden_patterns, quality_rubric = excluded.quality_rubric, enabled = true, updated_at = now();
"""

VALIDATION_SQL = r"""
select 'dataset_observations' as metric, count(*)::text as value from public.dataset_training_observations
union all select 'source_observations', count(*)::text from public.dataset_training_observations where metadata ->> 'source_slug' = '__SOURCE_SLUG__'
union all select 'dataset_entities', count(*)::text from public.dataset_named_entity_provenance
union all select 'dataset_categories', count(*)::text from public.dataset_category_candidates
union all select 'training_examples', count(*)::text from public.viral_training_examples
union all select 'source_training_examples', count(*)::text from public.viral_training_examples example join public.viral_training_sources source on source.id = example.source_id where source.slug = '__SOURCE_SLUG__'
union all select 'trend_signals_source', count(*)::text from public.trend_signals where source = '__TREND_SOURCE__'
union all select 'eval_cases_source', count(*)::text from public.generator_eval_cases where slug like '__EVAL_PREFIX___%'
union all select 'active_compile', count(*)::text from public.viral_training_compilations where version = '__VERSION__' and active = true
order by metric;
"""


if __name__ == "__main__":
    main()