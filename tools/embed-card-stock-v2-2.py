"""Full-corpus, versioned multilingual embeddings. Dry-run by default.
No quality decisions are patched: run the scorer after embedding.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
import urllib.parse
import urllib.request
from typing import Any

MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
DOCUMENT_VERSION = "card-semantic-v2"


def rest(base: str, key: str, path: str, method: str = "GET", payload: Any = None, prefer: str | None = None) -> Any:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    if prefer:
        headers["Prefer"] = prefer
    request = urllib.request.Request(f"{base.rstrip('/')}/rest/v1/{path}", data=body, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=60) as response:
        raw = response.read()
        return json.loads(raw) if raw else None


def first(*values: Any) -> Any:
    return next((v for v in values if v is not None), None)


def card_text(card: dict[str, Any]) -> str:
    """Must match lib/generation/automatic-policy.ts semanticDocument."""
    summary = card.get("idea_summary") or {}
    fields = [first(card.get("title"), summary.get("title")),
              first(card.get("conceptSummary"), card.get("one_sentence_premise"), summary.get("premise"), summary.get("one_sentence_premise")),
              first(card.get("viewerTakeaway"), summary.get("creator_takeaway"), summary.get("viewer_takeaway"))]
    steps = card.get("steps") if isinstance(card.get("steps"), list) else card.get("scene_script", [])
    for step in steps:
        if isinstance(step, dict):
            fields.extend([step.get("purpose"), step.get("goal"), first(step.get("action"), step.get("visual_action")),
                           first(step.get("spokenLine"), step.get("voiceover"), step.get("spoken_line")),
                           first(step.get("shot"), step.get("shot_type")), first(step.get("onScreenText"), step.get("on_screen_text")),
                           first(step.get("editNote"), step.get("edit_note"))])
    def flatten(value: Any) -> list[str]:
        if isinstance(value, list):
            return [item for child in value for item in flatten(child)]
        return [value.strip()] if isinstance(value, str) and value.strip() else []
    return "\n".join(item for value in fields for item in flatten(value))


def encode_complete(model: Any, texts: list[str]) -> tuple[Any, list[int]]:
    """Encode every token, not just the first max_seq_length tokens."""
    import numpy as np
    tokenizer = model.tokenizer
    budget = int(model.max_seq_length) - tokenizer.num_special_tokens_to_add(pair=False) - 4
    if budget < 8:
        raise ValueError("Unsupported embedding context length")
    chunks, owners, counts = [], [], []
    for index, text in enumerate(texts):
        tokens = tokenizer.encode(text, add_special_tokens=False)
        if not tokens:
            raise ValueError("Empty semantic document")
        count = 0
        # Decode/re-tokenize can expand token counts; shrink until it truly fits.
        start = 0
        while start < len(tokens):
            end = min(start + budget, len(tokens))
            chunk = tokenizer.decode(tokens[start:end], skip_special_tokens=True)
            while len(tokenizer.encode(chunk, add_special_tokens=False)) > budget:
                end -= 1
                if end <= start:
                    raise ValueError("Cannot encode token without truncation")
                chunk = tokenizer.decode(tokens[start:end], skip_special_tokens=True)
            chunks.append(chunk)
            owners.append(index)
            count += 1
            start = end
        counts.append(count)
    encoded = model.encode(chunks, normalize_embeddings=True, show_progress_bar=True)
    vectors = np.zeros((len(texts), encoded.shape[1]), dtype=np.float32)
    for owner, vector in zip(owners, encoded):
        vectors[owner] += vector
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    if not np.isfinite(vectors).all() or (norms <= 0).any():
        raise ValueError("Invalid embedding vector")
    return vectors / norms, counts


def global_neighbours(vectors: Any) -> list[tuple[float, int | None]]:
    count = len(vectors)
    if count == 1:
        return [(0.0, None)]
    output = []
    for start in range(0, count, 256):
        similarities = vectors[start:start + 256] @ vectors.T
        for local in range(len(similarities)):
            similarities[local, start + local] = -2.0
            nearest = int(similarities[local].argmax())
            output.append((min(1.0, max(0.0, float(similarities[local, nearest]))), nearest))
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--limit", type=int, default=50000, help="Safety cap; exceeding it fails, never silently truncates")
    parser.add_argument("--revision", default=os.getenv("VIRALBOX_EMBEDDING_MODEL_REVISION"))
    args = parser.parse_args()
    base = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not base or not key:
        raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    parsed = urllib.parse.urlsplit(base)
    if not parsed.hostname or parsed.username or parsed.password or (parsed.scheme != "https" and not (parsed.hostname in {"localhost", "127.0.0.1", "::1"} and parsed.scheme == "http")):
        raise SystemExit("SUPABASE_URL must use HTTPS without credentials")
    if not args.revision or not re.fullmatch(r"[0-9a-f]{40}", args.revision):
        raise SystemExit("An immutable 40-character Hugging Face commit SHA is required")
    def corpus_state() -> dict[str, Any]:
        rows = rest(base, key, "idea_embedding_corpus_state?select=card_count,revision")
        if not rows or len(rows) != 1:
            raise ValueError("Corpus state unavailable; apply the automatic-quality migration")
        return rows[0]
    before = corpus_state()
    count = int(before["card_count"])
    if count > args.limit or args.limit < 1:
        raise SystemExit("Corpus exceeds --limit; refusing partial duplicate coverage")
    rows = []
    while len(rows) < count:
        query = urllib.parse.urlencode({"select": "idea_id,card", "order": "idea_id.asc", "limit": 1000, "offset": len(rows)})
        page = rest(base, key, f"idea_cards?{query}") or []
        rows.extend(page)
        if len(page) < 1000:
            break
    if len(rows) != count or corpus_state() != before:
        raise SystemExit("Corpus changed during read; rerun on a stable snapshot")
    if not rows:
        print(json.dumps({"count": 0, "mode": "apply" if args.apply else "dry_run"}))
        return
    from sentence_transformers import SentenceTransformer
    texts = [card_text(row["card"]) for row in rows]
    model = SentenceTransformer(MODEL, revision=args.revision, trust_remote_code=False)
    vectors, chunk_counts = encode_complete(model, texts)
    nearest = global_neighbours(vectors)
    if corpus_state() != before:
        raise SystemExit("Corpus changed during embedding; no results written")
    output = []
    for index, row in enumerate(rows):
        score, neighbour = nearest[index]
        # DB numeric(5,4): round conservatively so stored quality and evidence agree.
        score = math.ceil(score * 10000) / 10000
        nearest_id = None if neighbour is None else rows[neighbour]["idea_id"]
        output.append({"idea_id": row["idea_id"], "score": score, "duplicate_of": nearest_id})
        if args.apply:
            payload = {
                "idea_id": row["idea_id"], "embedding_model": MODEL, "embedding": [float(value) for value in vectors[index]],
                "source_text_hash": hashlib.sha256(texts[index].encode("utf-8")).hexdigest(),
                "metadata": {"model_version": args.revision, "document_version": DOCUMENT_VERSION, "chunk_count": chunk_counts[index],
                             "comparison_scope": "global", "corpus_complete": True, "corpus_revision": before["revision"],
                             "corpus_count": count, "nearest_similarity": score, "nearest_idea_id": nearest_id, "creator_visible": False},
            }
            rest(base, key, "idea_semantic_embeddings?on_conflict=idea_id", "POST", payload, "resolution=merge-duplicates,return=minimal")
    if corpus_state() != before:
        raise SystemExit("Corpus changed during write. Results are stale and publication will refuse them; rerun.")
    output.sort(key=lambda row: row["score"], reverse=True)
    print(json.dumps({"mode": "apply" if args.apply else "dry_run", "model": MODEL, "revision": args.revision,
                      "count": count, "top_matches": output[:30], "next_step": "Rescore the batch; embedding alone never approves cards"}, indent=2))


if __name__ == "__main__":
    main()
