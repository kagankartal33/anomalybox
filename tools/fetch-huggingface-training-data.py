from __future__ import annotations

import argparse
import json
import math
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "dataset" / "huggingface"
BASE_URL = "https://datasets-server.huggingface.co"


SOURCES = [
    {
        "repo": "SocialGrep/one-million-reddit-jokes",
        "config": "default",
        "split": "train",
        "family": "reddit_score",
        "intent": "comedy_mechanics",
        "platform": "internet",
        "category": "entertainment_comedy",
        "license": "cc-by-4.0",
        "priority": "P0",
    },
    {
        "repo": "SocialGrep/one-million-reddit-questions",
        "config": "default",
        "split": "train",
        "family": "reddit_score",
        "intent": "comment_trigger_questions",
        "platform": "internet",
        "category": "lifestyle",
        "license": "cc-by-4.0",
        "priority": "P0",
    },
    {
        "repo": "SocialGrep/one-million-reddit-confessions",
        "config": "default",
        "split": "train",
        "family": "reddit_score",
        "intent": "relatable_confession_structure",
        "platform": "internet",
        "category": "lifestyle",
        "license": "cc-by-4.0",
        "priority": "P0",
    },
    {
        "repo": "tskolm/youtube_top_popular_videos_comments",
        "config": "default",
        "split": "train",
        "family": "youtube_comments",
        "intent": "comment_engine_reaction_mining",
        "platform": "youtube_shorts",
        "category": "entertainment_comedy",
        "license": "unknown",
        "priority": "P0",
    },
    {
        "repo": "prakhars/instagram_captions",
        "config": "default",
        "split": "train",
        "family": "instagram_caption",
        "intent": "caption_style_cluster",
        "platform": "instagram_reels",
        "category": "lifestyle",
        "license": "unknown",
        "priority": "P1",
    },
    {
        "repo": "databoks-irfan/labeled-instagram-comments",
        "config": "default",
        "split": "train",
        "family": "instagram_comments",
        "intent": "comment_safety_quality",
        "platform": "instagram_reels",
        "category": "lifestyle",
        "license": "unknown",
        "priority": "P1",
    },
    {
        "repo": "cardiffnlp/tweet_eval",
        "config": "irony",
        "split": "train",
        "family": "tweet_eval",
        "intent": "irony_tone_eval",
        "platform": "x",
        "category": "entertainment_comedy",
        "license": "unknown",
        "priority": "P1",
        "eval_only": True,
    },
    {
        "repo": "cardiffnlp/tweet_eval",
        "config": "emotion",
        "split": "train",
        "family": "tweet_eval",
        "intent": "emotion_tone_eval",
        "platform": "x",
        "category": "lifestyle",
        "license": "unknown",
        "priority": "P1",
        "eval_only": True,
    },
]


def request_json(path: str, params: dict[str, object], timeout: int = 45) -> dict:
    url = f"{BASE_URL}{path}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def clean(value: object, limit: int = 1800) -> str:
    text = re.sub(r"\\s+", " ", str(value or "")).strip()
    return text[:limit].strip()


def num(value: object) -> float:
    try:
        return float(str(value or "0").replace(",", ""))
    except ValueError:
        return 0.0


def patterns_for(text: str, family: str) -> list[str]:
    n = text.lower()
    patterns = []
    if family.startswith("reddit"):
        patterns.extend(["VTP-003", "VTP-005"])
    if "?" in text or re.search(r"\\bwhat|why|how|who|which|siz|ne|neden\\b", n):
        patterns.extend(["VTP-005", "VTP-020"])
    if re.search(r"joke|funny|humor|irony|absurd|lol|comedy", n):
        patterns.extend(["VTP-003", "VTP-011"])
    if re.search(r"comment|reply|like|question", n):
        patterns.append("VTP-016")
    if re.search(r"story|confession|tifu|today i|i was|when i", n):
        patterns.extend(["VTP-014", "VTP-020"])
    if re.search(r"caption|instagram|reels|save|share", n):
        patterns.extend(["VTP-013", "VTP-038"])
    if re.search(r"hate|offensive|toxic|nsfw|adult", n):
        patterns.append("VTP-025")
    return list(dict.fromkeys(patterns or ["VTP-026"]))


def weight_from_metrics(metrics: dict[str, float], text: str, eval_only: bool) -> float:
    if eval_only:
        return 0.48
    engagement = (
        metrics.get("score", 0)
        + metrics.get("likes", 0)
        + metrics.get("like_count", 0)
        + metrics.get("comments", 0) * 3
        + metrics.get("reply_count", 0) * 3
    )
    value = 0.36 + min(0.42, math.log10(max(1, engagement) + 10) / 12)
    if len(text) > 100:
        value += 0.06
    return round(max(0.2, min(0.92, value)), 4)


def normalize(source: dict, row: dict, row_index: int) -> dict | None:
    family = source["family"]
    if family == "reddit_score":
        title = clean(row.get("title"), 900)
        body = clean(row.get("selftext"), 900)
        text = clean(f"{title}. {body}".strip(), 1800)
        metrics = {"score": num(row.get("score"))}
        row_id = row.get("id") or row_index
    elif family == "youtube_comments":
        title = clean(row.get("title"), 600)
        description = clean(row.get("description"), 500)
        comment = clean(row.get("comment"), 700)
        text = clean(f"Video title: {title}. Description signal: {description}. Audience comment: {comment}", 1800)
        metrics = {"like_count": num(row.get("like_count")), "reply_count": num(row.get("reply_count"))}
        row_id = row.get("comment_id") or row.get("id") or row_index
    elif family == "instagram_caption":
        text = clean(row.get("text"), 1400)
        metrics = {"label": num(row.get("label"))}
        row_id = row_index
    elif family == "instagram_comments":
        text = clean(" ".join(str(v) for v in row.values() if isinstance(v, (str, int, float))), 1400)
        metrics = {}
        row_id = row_index
    elif family == "tweet_eval":
        text = clean(row.get("text"), 1000)
        metrics = {"label": num(row.get("label"))}
        row_id = row_index
    else:
        return None

    if len(text) < 30:
        return None

    eval_only = bool(source.get("eval_only"))
    return {
        "hf_repo_id": source["repo"],
        "hf_config": source["config"],
        "hf_split": source["split"],
        "hf_row_id": str(row_id),
        "row_index": row_index,
        "platform": source["platform"],
        "category_slug": source["category"],
        "locale": "GLOBAL",
        "source_family": family,
        "source_intent": source["intent"],
        "priority": source["priority"],
        "license": source.get("license", "unknown"),
        "rights_policy": "pattern_only_or_eval_only",
        "abstract_text": text,
        "metrics": metrics,
        "derived_pattern_ids": patterns_for(text, family),
        "training_weight": weight_from_metrics(metrics, text, eval_only),
        "training_use": "eval_only" if eval_only else "pattern_only",
        "eval_only": eval_only,
        "copy_risk": "high",
    }


def iter_rows(source: dict, max_rows: int, page_size: int) -> tuple[list[dict], dict]:
    out = []
    offset = 0
    stats = {"repo": source["repo"], "config": source["config"], "split": source["split"], "fetched": 0, "kept": 0, "errors": []}
    while len(out) < max_rows:
        length = min(page_size, max_rows - len(out))
        try:
            data = request_json("/rows", {
                "dataset": source["repo"],
                "config": source["config"],
                "split": source["split"],
                "offset": offset,
                "length": length,
            })
        except Exception as exc:
            stats["errors"].append(str(exc))
            break
        rows = data.get("rows") or []
        if not rows:
            break
        for wrapped in rows:
            stats["fetched"] += 1
            normalized = normalize(source, wrapped.get("row", {}), offset + int(wrapped.get("row_idx", stats["fetched"])))
            if normalized:
                out.append(normalized)
                stats["kept"] += 1
            if len(out) >= max_rows:
                break
        if len(rows) < length:
            break
        offset += len(rows)
        time.sleep(0.05)
    return out, stats


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT))
    parser.add_argument("--max-rows-per-source", type=int, default=1000)
    parser.add_argument("--page-size", type=int, default=100)
    parser.add_argument("--include-p1", action="store_true")
    parser.add_argument("--apply", action="store_true", help="Write files. Without this flag, only prints a dry-run plan.")
    args = parser.parse_args()

    selected = [s for s in SOURCES if s["priority"] == "P0" or args.include_p1]
    plan = {
        "selected_sources": selected,
        "max_rows_per_source": args.max_rows_per_source,
        "apply": args.apply,
    }
    if not args.apply:
        print(json.dumps(plan, indent=2, ensure_ascii=False))
        return

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    output_path = out_dir / "hf_social_training_v1.jsonl"
    manifest_path = out_dir / "manifest.json"
    all_stats = []
    total = 0
    with output_path.open("w", encoding="utf-8") as f:
        for source in selected:
            rows, stats = iter_rows(source, args.max_rows_per_source, min(100, max(1, args.page_size)))
            all_stats.append(stats)
            for row in rows:
                f.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\
                total += 1

    manifest = {
        "source_slug": "hf_social_training_v1",
        "compile_version": "2026-v5-hf-social",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "output_file": str(output_path).replace("", "/"),
        "total_rows": total,
        "sources": all_stats,
        "policy": "pattern_only_anti_copy",
    }
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(manifest, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
