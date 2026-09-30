"""Offline, dependency-free data integrity and response-only SFT preparation."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

DATASET_VERSION = "card-sft-v2"
CURRICULUM_VERSION = "card-curriculum-v1"
PROMPT_VERSION = "idea-card-premium-v2.4.0-automatic"


def read_jsonl(path: Path) -> list[dict]:
    rows = []
    with path.open(encoding="utf-8-sig") as stream:
        for number, line in enumerate(stream, 1):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
            except ValueError:
                raise ValueError(f"Invalid JSON at row {number}") from None
            if not isinstance(row, dict):
                raise ValueError(f"Invalid record at row {number}")
            validate_messages(row)
            rows.append(row)
    return rows


def validate_messages(row: dict) -> None:
    messages = row.get("messages")
    if not isinstance(messages, list) or len(messages) != 3:
        raise ValueError("SFT requires exactly system, user and assistant messages")
    for message, role in zip(messages, ("system", "user", "assistant")):
        if not isinstance(message, dict) or set(message) != {"role", "content"} or message["role"] != role or not isinstance(message["content"], str) or not message["content"].strip():
            raise ValueError("Invalid SFT message contract")
    try:
        card = json.loads(messages[-1]["content"])
    except ValueError:
        raise ValueError("Assistant target must be complete JSON, not truncated text") from None
    if not isinstance(card, dict) or card.get("schemaVersion") != 2 or not isinstance(card.get("steps"), list):
        raise ValueError("Expected schema-v2 card target; re-export with the local quality gate")


def load_verified_dataset(directory: Path, require_ready: bool = True):
    manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("version") != DATASET_VERSION or manifest.get("curriculum_version") != CURRICULUM_VERSION or manifest.get("prompt_version") != PROMPT_VERSION or manifest.get("pipeline") != "idea_card_only" or manifest.get("language") != "en":
        raise ValueError("Stale or incompatible training manifest; re-export current verified cards")
    if require_ready and (manifest.get("training_ready") is not True or manifest.get("blockers") != []):
        raise ValueError("Training coverage is not ready; inspect manifest blockers")
    splits = {}
    seen_sources, seen_hashes, family_splits = set(), set(), {}
    for split in ("train", "validation", "test"):
        path = directory / f"{split}.jsonl"
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != manifest.get("file_hashes", {}).get(path.name):
            raise ValueError(f"Dataset file hash mismatch: {split}")
        rows = read_jsonl(path)
        if len(rows) != manifest.get("split_counts", {}).get(split):
            raise ValueError(f"Dataset count mismatch: {split}")
        for row in rows:
            meta = row.get("meta", {})
            family, source, content_hash = (meta.get(key) for key in ("family_id", "source_id", "content_hash"))
            if not all(isinstance(value, str) and value for value in (family, source, content_hash)) or meta.get("split") != split or meta.get("prompt_version") != PROMPT_VERSION or meta.get("curriculum_version") != CURRICULUM_VERSION:
                raise ValueError("Missing or stale dataset provenance")
            if source in seen_sources or content_hash in seen_hashes:
                raise ValueError("Duplicate source or target in dataset")
            if family in family_splits and family_splits[family] != split:
                raise ValueError("Source-family leakage between splits")
            seen_sources.add(source)
            seen_hashes.add(content_hash)
            family_splits[family] = split
        splits[split] = rows
    if require_ready and any(not rows for rows in splits.values()):
        raise ValueError("Train, validation and frozen test splits must all be nonempty")
    return manifest, splits


def encode_response_only(row: dict, tokenizer, max_length: int) -> dict:
    validate_messages(row)
    if not getattr(tokenizer, "chat_template", None):
        raise ValueError("A verified chat template is required; no generic Instruction/Response fallback")
    messages = row["messages"]
    prefix = tokenizer.apply_chat_template(messages[:-1], tokenize=True, add_generation_prompt=True)
    complete = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=False)
    if not prefix or complete[:len(prefix)] != prefix or len(complete) <= len(prefix):
        raise ValueError("Tokenizer chat template has an incompatible assistant boundary")
    if len(complete) > max_length:
        raise ValueError(f"Complete card needs {len(complete)} tokens; max sequence is {max_length}. Do not truncate JSON targets.")
    return {"input_ids": complete, "attention_mask": [1] * len(complete), "labels": [-100] * len(prefix) + complete[len(prefix):]}


def pad_response_batch(rows: list[dict], pad_token_id: int) -> dict:
    if not rows:
        raise ValueError("Empty training batch")
    width = max(len(row["input_ids"]) for row in rows)
    batch = {"input_ids": [], "attention_mask": [], "labels": []}
    for row in rows:
        padding = width - len(row["input_ids"])
        batch["input_ids"].append(row["input_ids"] + [pad_token_id] * padding)
        batch["attention_mask"].append(row["attention_mask"] + [0] * padding)
        batch["labels"].append(row["labels"] + [-100] * padding)
    return batch