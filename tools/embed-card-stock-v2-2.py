"""Compute real multilingual card embeddings and persist nearest-neighbour scores.

Requires sentence-transformers. Dry-run is the default; pass --apply to write.
The model is deliberately independent of the card generator.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import urllib.parse
import urllib.request
from collections import defaultdict
from typing import Any

MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
MODEL_VERSION = "v1-384"


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
    return "\n".join(str(f) for f in fields if f)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--limit", type=int, default=5000)
    args = parser.parse_args()
    base = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not base or not key:
        raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:
        raise SystemExit("Install sentence-transformers in the local embedding worker environment") from exc

    query = urllib.parse.urlencode({"select": "idea_id,card,idea_candidates(category_id,persona_id,platform,language)", "limit": min(max(args.limit, 1), 50000)})
    rows = rest(base, key, f"idea_cards?{query}") or []
    texts = [card_text(row["card"]) for row in rows]
    model = SentenceTransformer(MODEL)
    vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=True)
    lanes: dict[tuple[Any, ...], list[int]] = defaultdict(list)
    for index, row in enumerate(rows):
        candidate = row.get("idea_candidates") or {}
        lanes[(candidate.get("category_id"), candidate.get("persona_id"), candidate.get("platform"), candidate.get("language"))].append(index)

    output = []
    for indices in lanes.values():
        for index in indices:
            nearest_score, nearest_id = 0.0, None
            for other in indices:
                if other == index:
                    continue
                score = float(vectors[index] @ vectors[other])
                if score > nearest_score:
                    nearest_score, nearest_id = score, rows[other]["idea_id"]
            output.append({"idea_id": rows[index]["idea_id"], "score": round(nearest_score, 6), "duplicate_of": nearest_id})
            if args.apply:
                source_hash = hashlib.sha256(texts[index].encode("utf-8")).hexdigest()
                embedding_payload = {
                    "idea_id": rows[index]["idea_id"], "embedding_model": MODEL,
                    "embedding": [float(value) for value in vectors[index]], "source_text_hash": source_hash,
                    "metadata": {"model_version": MODEL_VERSION, "creator_visible": False},
                }
                rest(base, key, "idea_semantic_embeddings?on_conflict=idea_id", "POST", embedding_payload, "resolution=merge-duplicates,return=minimal")
                quality_payload = {
                    "semantic_duplicate_score": nearest_score,
                    "embedding_duplicate_score": nearest_score,
                    "embedding_model": MODEL,
                    "embedding_model_version": MODEL_VERSION,
                    "duplicate_of_idea_id": nearest_id,
                }
                rest(base, key, f"idea_quality_checks?idea_id=eq.{rows[index]['idea_id']}", "PATCH", quality_payload, "return=minimal")
    output.sort(key=lambda item: item["score"], reverse=True)
    print(json.dumps({"mode": "apply" if args.apply else "dry_run", "model": MODEL, "model_version": MODEL_VERSION, "count": len(output), "top_matches": output[:30]}, indent=2))


if __name__ == "__main__":
    main()