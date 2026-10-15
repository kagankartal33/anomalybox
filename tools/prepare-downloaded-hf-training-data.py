from __future__ import annotations

import argparse
import gzip
import hashlib
import heapq
import json
import math
import re
from pathlib import Path
from typing import Any, Iterable

import pyarrow.parquet as pq


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "dataset" / "huggingface" / "raw"
OUT_DIR = ROOT / "dataset" / "huggingface"


SOURCES = [
    {
        "repo": "SocialGrep/one-million-reddit-jokes",
        "path": RAW_DIR / "SocialGrep_one-million-reddit-jokes" / "default" / "train" / "0000.parquet",
        "kind": "parquet",
        "family": "reddit_jokes",
        "intent": "score_weighted_comedy_mechanics",
        "platform": "internet",
        "category": "entertainment_comedy",
        "license": "cc-by-4.0",
    },
    {
        "repo": "SocialGrep/one-million-reddit-questions",
        "path": RAW_DIR / "SocialGrep_one-million-reddit-questions" / "default" / "train" / "0000.parquet",
        "kind": "parquet",
        "family": "reddit_questions",
        "intent": "comment_trigger_question_hooks",
        "platform": "internet",
        "category": "lifestyle",
        "license": "cc-by-4.0",
    },
    {
        "repo": "SocialGrep/one-million-reddit-confessions",
        "path": RAW_DIR / "SocialGrep_one-million-reddit-confessions" / "default" / "train",
        "kind": "parquet_dir",
        "family": "reddit_confessions",
        "intent": "relatable_confession_arcs",
        "platform": "internet",
        "category": "lifestyle",
        "license": "cc-by-4.0",
    },
    {
        "repo": "ctr4si/reddit_tifu",
        "path": RAW_DIR / "ctr4si_reddit_tifu" / "raw" / "tifu_all_tokenized_and_filtered.json.gz",
        "kind": "json_gz",
        "family": "reddit_tifu",
        "intent": "story_arc_tldr_payoff",
        "platform": "internet",
        "category": "entertainment_comedy",
        "license": "mit",
    },
    {
        "repo": "tskolm/youtube_top_popular_videos_comments",
        "path": RAW_DIR / "tskolm_youtube_top_popular_videos_comments" / "default" / "train" / "0000.parquet",
        "kind": "parquet",
        "family": "youtube_comments",
        "intent": "audience_reaction_comment_engine",
        "platform": "youtube_shorts",
        "category": "entertainment_comedy",
        "license": "unknown",
    },
]


def sha(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8", errors="ignore")).hexdigest()


def clean(value: Any, limit: int = 2200) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()[:limit]


def num(value: Any) -> float:
    try:
        return float(str(value or "0").replace(",", ""))
    except ValueError:
        return 0.0


def safe_get(row: dict[str, Any], *names: str) -> Any:
    lowered = {str(k).lower(): v for k, v in row.items()}
    for name in names:
        if name.lower() in lowered:
            return lowered[name.lower()]
    return None


def risk_for(raw: str, nsfw: bool = False) -> str:
    n = raw.lower()
    if nsfw or re.search(r"\b(nsfw|explicit|porn|suicide|self harm|weapon|kill|murder|rape)\b", n):
        return "restricted"
    if re.search(r"\b(health|medical|doctor|finance|investment|crypto|legal|child|kid|baby|politic|hate|offensive)\b", n):
        return "medium"
    return "low"


def feature_flags(raw: str, family: str) -> list[str]:
    n = raw.lower()
    flags = []
    checks = [
        ("question_hook", r"\?|\bwhat\b|\bwhy\b|\bhow\b|\bwhich\b|\bwho\b"),
        ("confession_frame", r"\bi\b|\bmy\b|\bconfession\b|\boffmychest\b"),
        ("mistake_payoff", r"\btifu\b|\bfucked up\b|\bmistake\b|\bwrong\b|\bforgot\b"),
        ("setup_payoff", r"\bjoke\b|\bfunny\b|\bpunchline\b|\blaugh\b"),
        ("debate_trigger", r"\bshould\b|\bwould you\b|\bopinion\b|\bcontroversial\b"),
        ("comment_reaction", r"\bcomment\b|\breply\b|\blike\b"),
        ("story_arc", r"\bthen\b|\bwhen\b|\bafter\b|\bbecause\b|\bfinally\b"),
        ("curiosity_gap", r"\bsecret\b|\bwhy\b|\bnever\b|\bno one\b|\bactually\b"),
        ("relatable_pain", r"\bembarrass\b|\bawkward\b|\banxiety\b|\bpanic\b|\bregret\b"),
    ]
    for label, pattern in checks:
        if re.search(pattern, n):
            flags.append(label)
    if family.startswith("reddit_"):
        flags.append("community_score_signal")
    if family == "youtube_comments":
        flags.append("audience_comment_signal")
    return list(dict.fromkeys(flags or ["generic_social_signal"]))


def pattern_ids(flags: Iterable[str], family: str) -> list[str]:
    mapping = {
        "question_hook": ["VTP-005", "VTP-020"],
        "confession_frame": ["VTP-014", "VTP-020"],
        "mistake_payoff": ["VTP-003", "VTP-020"],
        "setup_payoff": ["VTP-003", "VTP-011"],
        "debate_trigger": ["VTP-005", "VTP-016"],
        "comment_reaction": ["VTP-016", "VTP-005"],
        "story_arc": ["VTP-014", "VTP-020"],
        "curiosity_gap": ["VTP-020"],
        "relatable_pain": ["VTP-019", "VTP-020"],
        "audience_comment_signal": ["VTP-016"],
        "community_score_signal": ["VTP-005"],
    }
    out = []
    for flag in flags:
        out.extend(mapping.get(flag, []))
    if family == "reddit_jokes":
        out.extend(["VTP-003", "VTP-011"])
    if family == "youtube_comments":
        out.extend(["VTP-016", "VTP-032"])
    return list(dict.fromkeys(out or ["VTP-026"]))


def source_metrics(source: dict[str, Any], row: dict[str, Any]) -> dict[str, float]:
    family = source["family"]
    if family.startswith("reddit_") and family != "reddit_tifu":
        return {"score": num(safe_get(row, "score"))}
    if family == "reddit_tifu":
        return {
            "score": num(safe_get(row, "score")),
            "ups": num(safe_get(row, "ups")),
            "num_comments": num(safe_get(row, "num_comments")),
            "upvote_ratio": num(safe_get(row, "upvote_ratio")),
        }
    if family == "youtube_comments":
        return {
            "like_count": num(safe_get(row, "like_count")),
            "reply_count": num(safe_get(row, "reply_count")),
        }
    return {}


def raw_text_for(source: dict[str, Any], row: dict[str, Any]) -> str:
    family = source["family"]
    if family.startswith("reddit_") and family != "reddit_tifu":
        return clean(f"{safe_get(row, 'title')} {safe_get(row, 'selftext')}", 2400)
    if family == "reddit_tifu":
        return clean(f"{safe_get(row, 'title')} {safe_get(row, 'selftext', 'document')} {safe_get(row, 'tldr')}", 2400)
    if family == "youtube_comments":
        return clean(f"{safe_get(row, 'title')} {safe_get(row, 'description')} {safe_get(row, 'comment')}", 2400)
    return clean(" ".join(str(v) for v in row.values()), 2400)


def abstract_observation(source: dict[str, Any], row: dict[str, Any], row_index: int) -> dict[str, Any] | None:
    raw = raw_text_for(source, row)
    if len(raw) < 25:
        return None
    nsfw = str(safe_get(row, "subreddit.nsfw") or "").lower() in {"true", "1", "yes"}
    risk = risk_for(raw, nsfw)
    flags = feature_flags(raw, source["family"])
    metrics = source_metrics(source, row)
    engagement = (
        metrics.get("score", 0)
        + metrics.get("ups", 0)
        + metrics.get("like_count", 0)
        + metrics.get("num_comments", 0) * 3
        + metrics.get("reply_count", 0) * 4
    )
    weight = 0.34 + min(0.46, math.log10(max(1.0, engagement) + 10) / 11)
    if len(raw) > 180:
        weight += 0.05
    if risk == "medium":
        weight -= 0.08
    if risk == "restricted":
        weight -= 0.22
    weight = round(max(0.12, min(0.96, weight)), 4)
    raw_hash = sha(re.sub(r"\s+", " ", raw.lower()).strip())
    content_hash = sha(f"hf_raw_v2|{source['repo']}|{source['family']}|{row_index}|{raw_hash}")
    text = (
        f"{source['family']} {source['intent']} observation. "
        f"Surface hidden; raw_text_hash={raw_hash[:16]}. "
        f"Feature flags: {', '.join(flags)}. "
        f"Approx length={len(raw)} chars. "
        f"Engagement signal={round(engagement, 2)}. "
        "Use only the abstract mechanism, not wording, title, username, URL, scene, or exact joke/comment."
    )
    return {
        "content_hash": content_hash,
        "hf_repo_id": source["repo"],
        "hf_config": "raw" if source["family"] == "reddit_tifu" else "default",
        "hf_split": "raw" if source["family"] == "reddit_tifu" else "train",
        "hf_row_id": str(safe_get(row, "id", "comment_id", "permalink") or row_index),
        "row_index": row_index,
        "platform": source["platform"],
        "category_slug": source["category"],
        "locale": "GLOBAL",
        "source_family": source["family"],
        "source_intent": source["intent"],
        "license": source["license"],
        "rights_policy": "pattern_only_no_surface",
        "abstract_text": text,
        "metrics": {
            **metrics,
            "engagement_signal": round(engagement, 2),
            "raw_length_chars": len(raw),
        },
        "surface_features": flags,
        "derived_pattern_ids": pattern_ids(flags, source["family"]),
        "training_weight": weight,
        "training_use": "negative_example" if risk == "restricted" else "pattern_only",
        "copy_risk": "high",
        "raw_text_hash": raw_hash,
    }


def iter_parquet_rows(path: Path, columns: list[str] | None = None) -> Iterable[dict[str, Any]]:
    parquet = pq.ParquetFile(path)
    for batch in parquet.iter_batches(batch_size=20000, columns=columns):
        data = batch.to_pylist()
        for row in data:
            yield row


def iter_source_rows(source: dict[str, Any]) -> Iterable[dict[str, Any]]:
    path = Path(source["path"])
    if source["kind"] == "parquet":
        yield from iter_parquet_rows(path)
    elif source["kind"] == "parquet_dir":
        for shard in sorted(path.glob("*.parquet")):
            yield from iter_parquet_rows(shard)
    elif source["kind"] == "json_gz":
        with gzip.open(path, "rt", encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if line:
                    yield json.loads(line)
    else:
        raise ValueError(f"Unknown source kind: {source['kind']}")


def deterministic_bucket(content_hash: str) -> float:
    return int(content_hash[:12], 16) / float(0xFFFFFFFFFFFF)


def select_rows(source: dict[str, Any], max_rows: int) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    top_target = max(1, int(max_rows * 0.7))
    sample_target = max_rows - top_target
    top_heap: list[tuple[float, str, dict[str, Any]]] = []
    sample_heap: list[tuple[float, str, dict[str, Any]]] = []
    seen = set()
    scanned = kept = duplicates = 0
    restricted = 0
    for index, row in enumerate(iter_source_rows(source), 1):
        scanned += 1
        obs = abstract_observation(source, row, index)
        if not obs:
            continue
        if obs["content_hash"] in seen:
            duplicates += 1
            continue
        seen.add(obs["content_hash"])
        if obs["training_use"] == "negative_example":
            restricted += 1
        kept += 1
        top_key = float(obs["training_weight"])
        top_item = (top_key, obs["content_hash"], obs)
        if len(top_heap) < top_target:
            heapq.heappush(top_heap, top_item)
        elif top_item > top_heap[0]:
            heapq.heapreplace(top_heap, top_item)

        sample_key = -deterministic_bucket(obs["content_hash"])
        sample_item = (sample_key, obs["content_hash"], obs)
        if sample_target > 0:
            if len(sample_heap) < sample_target:
                heapq.heappush(sample_heap, sample_item)
            elif sample_item > sample_heap[0]:
                heapq.heapreplace(sample_heap, sample_item)

    selected = {item[1]: item[2] for item in top_heap}
    for item in sample_heap:
        selected.setdefault(item[1], item[2])
    rows = sorted(selected.values(), key=lambda item: (-float(item["training_weight"]), item["content_hash"]))
    return rows[:max_rows], {
        "repo": source["repo"],
        "family": source["family"],
        "scanned": scanned,
        "eligible": kept,
        "selected": min(len(rows), max_rows),
        "duplicates": duplicates,
        "restricted": restricted,
    }


def main() -> None:
    global RAW_DIR
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw-dir", default=str(RAW_DIR))
    parser.add_argument("--out-dir", default=str(OUT_DIR))
    parser.add_argument("--max-rows-per-source", type=int, default=50000)
    parser.add_argument("--output-name", default="hf_social_training_v2_prepared.jsonl")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    RAW_DIR = Path(args.raw_dir).resolve()
    out_dir = Path(args.out_dir).resolve()
    output_path = out_dir / args.output_name
    manifest_path = out_dir / args.output_name.replace(".jsonl", ".manifest.json")

    sources = []
    for source in SOURCES:
        adjusted = dict(source)
        adjusted["path"] = Path(str(source["path"]).replace(str(ROOT / "dataset" / "huggingface" / "raw"), str(RAW_DIR)))
        if not Path(adjusted["path"]).exists():
            raise SystemExit(f"Missing downloaded source: {adjusted['path']}")
        sources.append(adjusted)

    plan = {
        "mode": "prepare_downloaded_hf",
        "max_rows_per_source": args.max_rows_per_source,
        "output_path": str(output_path),
        "sources": [{"repo": s["repo"], "family": s["family"], "path": str(s["path"])} for s in sources],
        "apply": args.apply,
    }
    if not args.apply:
        print(json.dumps(plan, indent=2, ensure_ascii=False))
        return

    out_dir.mkdir(parents=True, exist_ok=True)
    total = 0
    stats = []
    with output_path.open("w", encoding="utf-8") as f:
        for source in sources:
            rows, source_stats = select_rows(source, args.max_rows_per_source)
            stats.append(source_stats)
            for row in rows:
                f.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")
                total += 1
    manifest = {
        **plan,
        "apply": True,
        "total_rows": total,
        "stats": stats,
        "policy": "pattern_only_no_surface_copy",
    }
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(manifest, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
