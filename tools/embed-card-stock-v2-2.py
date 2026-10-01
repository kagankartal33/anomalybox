"""Compute real multilingual card embeddings and persist nearest-neighbour scores.

Requires sentence-transformers. Dry-run is the default; pass --apply to write.
The model is deliberately independent of the card generator.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import urllib.parse
import urllib.request
from collections import defaultdict
from typing import Any

MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


def rest(base: str, key: str, path: str, method: str = "GET", payload: Any = None, prefer: str | None = None) -> Any:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    if prefer:
        headers["Prefer"] = prefer
    request = urllib.request.Request(f"{base.rstrip('/')}/rest/v1/{path}", data=body, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=60) as response:
        raw = response.read()
        return json.loads(raw) if raw else None


def card_text(card: dict[str, Any]) -> str:
    steps = card.get("steps") or card.get("scene_script") or []
    fields = [card.get("title"), card.get("conceptSummary"), card.get("viewerTakeaway"), card.get("category"), card.get("personaSlug")]
    for step in steps:
        if isinstance(step, dict):
            fields.extend([step.get("purpose"), step.get("goal"), step.get("action"), step.get("spokenLine"), step.get("shot")])
    return "


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--limit", type=int, default=5000)
    parser.add_argument("--revision", default=os.getenv("VIRALBOX_EMBEDDING_MODEL_REVISION"))
    args = parser.parse_args()
    base = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not base or not key:
        raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    parsed_base = urllib.parse.urlsplit(base)
    is_local = parsed_base.hostname in {"localhost", "127.0.0.1", "::1"}
    if not parsed_base.hostname or parsed_base.username or parsed_base.password or (parsed_base.scheme != "https" and not (is_local and parsed_base.scheme == "http")):
        raise SystemExit("SUPABASE_URL must use HTTPS and must not contain credentials")
    if args.apply and not args.revision:
        raise SystemExit("--apply requires an immutable --revision (Hugging Face commit/tag) for reproducible quality records")
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:
        raise SystemExit("Install sentence-transformers in the local embedding worker environment") from exc

    row_limit = min(max(args.limit, 1), 50000)
    rows: list[dict[str, Any]] = []
    while len(rows) < row_limit:
        page_limit = min(1000, row_limit - len(rows))
        query = urllib.parse.urlencode({
            "select": "idea_id,card,idea_candidates(category_id,persona_id,platform,language)",
            "order": "idea_id.asc",
            "limit": page_limit,
            "offset": len(rows),
        })
        page = rest(base, key, f"idea_cards?{query}") or []
        rows.extend(page)
        if len(page) < page_limit:
            break
    if not rows:
        print(json.dumps({"mode": "apply" if args.apply else "dry_run", "model": MODEL, "count": 0, "top_matches": []}, indent=2))
        return
    texts = [card_text(row["card"]) for row in rows]
    model_version = args.revision or "unversioned-dry-run"
    model = SentenceTransformer(MODEL, revision=args.revision)
    vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=True)
    lanes: dict[tuple[Any, ...], list[int]] = defaultdict(list)
    for index, row in enumerate(rows):
        candidate = row.get("idea_candidates") or {}
        lanes[(candidate.get("category_id"), candidate.get("persona_id"), candidate.get("platform"), candidate.get("language"))].append(index)

    nearest_by_index: dict[int, tuple[float, Any]] = {}
    for indices in lanes.values():
        if len(indices) == 1:
            nearest_by_index[indices[0]] = (0.0, None)
            continue
        lane_vectors = vectors[indices]
        for start in range(0, len(indices), 256):
            end = min(start + 256, len(indices))
            similarities = lane_vectors[start:end] @ lane_vectors.T
            for local_row, global_position in enumerate(range(start, end)):
                similarities[local_row, global_position] = -1.0
            nearest_positions = similarities.argmax(axis=1)
            for local_row, nearest_position in enumerate(nearest_positions):
                global_index = indices[start + local_row]
                nearest_score = max(0.0, float(similarities[local_row, nearest_position]))
                nearest_by_index[global_index] = (nearest_score, rows[indices[int(nearest_position)]]["idea_id"])

    output = []
    for index, row in enumerate(rows):
        nearest_score, nearest_id = nearest_by_index[index]
        output.append({"idea_id": row["idea_id"], "score": round(nearest_score, 6), "duplicate_of": nearest_id})
        if args.apply:
            source_hash = hashlib.sha256(texts[index].encode("utf-8")).hexdigest()
            embedding_payload = {
                "idea_id": row["idea_id"], "embedding_model": MODEL,
                "embedding": [float(value) for value in vectors[index]], "source_text_hash": source_hash,
                "metadata": {
                    "model_version": model_version,
                    "nearest_similarity": round(nearest_score, 6),
                    "nearest_idea_id": nearest_id,
                    "creator_visible": False,
                },
            }
            rest(base, key, "idea_semantic_embeddings?on_conflict=idea_id", "POST", embedding_payload, "resolution=merge-duplicates,return=minimal")
            quality_payload = {
                "semantic_duplicate_score": nearest_score,
                "embedding_duplicate_score": nearest_score,
                "embedding_model": MODEL,
                "embedding_model_version": model_version,
                "duplicate_of_idea_id": nearest_id,
            }
            rest(base, key, f"idea_quality_checks?idea_id=eq.{row['idea_id']}", "PATCH", quality_payload, "return=minimal")
    output.sort(key=lambda item: item["score"], reverse=True)
    print(json.dumps({"mode": "apply" if args.apply else "dry_run", "model": MODEL, "model_version": model_version, "count": len(output), "top_matches": output[:30]}, indent=2))


if __name__ == "__main__":
    main()