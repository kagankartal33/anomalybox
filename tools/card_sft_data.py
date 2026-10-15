"""Offline, dependency-free data integrity and response-only SFT preparation."""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
from collections import Counter
from pathlib import Path

DATASET_VERSION = "card-sft-v3.1"
CURRICULUM_VERSION = "card-curriculum-v2"
PROMPT_VERSION = "idea-card-premium-v3.0.0-automatic"
QUALITY_GATE_VERSION = "quality-gate-v3.0.1-automatic"
SPLIT_METHOD = "source_family_sha256_80_10_10_v1"
CATEGORIES = (
    "beauty", "fashion", "commerce_affiliate", "creator_education", "entertainment_comedy",
    "fitness_wellness_safe", "food", "lifestyle", "luxury", "parenting_family", "thought_leadership", "travel",
)
RUNTIME_RANGES = {"quick_payoff": (12, 18), "single_proof": (19, 27), "story_proof": (28, 39), "deep_process": (40, 60)}
RECIPE_KEYS = (
    "taxonomyVersion", "hookTypeId", "genreId", "hookDeliveryId", "promiseTypeId", "emotionArcId",
    "vibePresetId", "proofDeviceId", "payoffTypeId", "audienceActionId", "shootFormat", "presenceMode",
)


def card_training_split(family_id: str) -> str:
    bucket = int(hashlib.sha256(f"card-sft-split-v1:{family_id}".encode()).hexdigest()[:8], 16) % 100
    return "train" if bucket < 80 else "validation" if bucket < 90 else "test"


def configure_training_cache(directory: Path) -> Path:
    """Process-local cache; never inherit a removed external-drive cache path."""
    directory = directory.resolve()
    directory.mkdir(parents=True, exist_ok=True)
    os.environ["TORCHINDUCTOR_CACHE_DIR"] = str(directory / "inductor")
    os.environ["TRITON_CACHE_DIR"] = str(directory / "triton")
    return directory


def training_time_limit_callback(callback_base, max_minutes: float, clock=time.monotonic):
    class TimeLimitCallback(callback_base):
        started = 0.0
        stopped = False

        def on_train_begin(self, args, state, control, **kwargs):
            self.started = clock()
            return control

        def on_step_end(self, args, state, control, **kwargs):
            if (clock() - self.started) / 60 >= max_minutes:
                control.should_training_stop = True
                control.should_save = True
                control.should_evaluate = True
                self.stopped = True
            return control

    return TimeLimitCallback()


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
    if not isinstance(card, dict) or card.get("schemaVersion") != 2 or not isinstance(card.get("steps"), list) or not 3 <= len(card["steps"]) <= 8:
        raise ValueError("Expected schema-v2 card target; re-export with the local quality gate")
    string_fields = ("id", "title", "conceptSummary", "format", "category", "platform", "audience", "viewerTakeaway", "whyItWorks", "hookId", "shootFormat", "presenceMode", "personaSlug")
    expected_fields = set(string_fields) | {"schemaVersion", "durationSeconds", "difficulty", "requiredItems", "overallProductionNotes", "steps"}
    if set(card) != expected_fields or any(not isinstance(card[key], str) or not card[key].strip() for key in string_fields):
        raise ValueError("Incomplete or unknown card target fields")
    if card["category"] not in CATEGORIES or card["platform"] != "instagram_reels" or card["difficulty"] not in ("easy", "medium", "advanced") or type(card["durationSeconds"]) is not int or not 12 <= card["durationSeconds"] <= 60:
        raise ValueError("Invalid card production contract")
    for field, limit in (("requiredItems", 12), ("overallProductionNotes", 10)):
        if not isinstance(card[field], list) or not 1 <= len(card[field]) <= limit or any(not isinstance(item, str) or not item.strip() for item in card[field]):
            raise ValueError("Invalid card production contract")
    required_step_text = ("id", "purpose", "goal", "action")
    optional_step_text = ("spokenLine", "shot", "onScreenText", "editNote", "performanceNote")
    step_fields = set(required_step_text + optional_step_text) | {"order", "stage", "startSecond", "endSecond"}
    end, ids = 0, set()
    for index, step in enumerate(card["steps"], 1):
        if not isinstance(step, dict) or set(step) != step_fields or any(not isinstance(step[key], str) or not step[key].strip() for key in required_step_text):
            raise ValueError("Invalid card step contract")
        if any(step[key] is not None and (not isinstance(step[key], str) or not step[key].strip()) for key in optional_step_text):
            raise ValueError("Invalid card step contract")
        if step["id"] in ids or step["stage"] not in ("hook", "context", "demonstration", "takeaway", "cta") or any(type(step[key]) is not int for key in ("order", "startSecond", "endSecond")) or step["order"] != index or step["startSecond"] != end or step["endSecond"] <= end:
            raise ValueError("Invalid card timing or step identity")
        ids.add(step["id"])
        end = step["endSecond"]
    if end != card["durationSeconds"]:
        raise ValueError("Card duration differs from its completed timeline")


def dataset_coverage(splits: dict) -> tuple[dict, dict, list[str]]:
    """Recompute readiness from rows; a manifest's ready flag is not evidence."""
    categories, durations, families, profiles, creative = {}, Counter(), Counter(), {}, {}
    count = sum(len(rows) for rows in splits.values())
    for split, rows in splits.items():
        for row in rows:
            meta = row["meta"]
            card = json.loads(row["messages"][-1]["content"])
            lane = meta["category"]
            categories.setdefault(lane, {"train": 0, "validation": 0, "test": 0})[split] += 1
            durations[str(card["durationSeconds"])] += 1
            families[meta["family_id"]] += 1
            profiles.setdefault(lane, set()).add(meta["concept"]["runtimeProfile"])
            coverage = creative.setdefault(lane, {key: set() for key in ("genreId", "hookTypeId", "emotionArcId", "vibePresetId")})
            for key in coverage:
                coverage[key].add(meta["creative_recipe"][key])
    blockers = ["fewer_than_720_verified_cards"] if count < 720 else []
    for lane in CATEGORIES:
        lane_counts = categories.get(lane, {})
        if any(lane_counts.get(split, 0) < minimum for split, minimum in (("train", 48), ("validation", 6), ("test", 6))):
            blockers.append(f"insufficient_split_coverage:{lane}")
        if len(profiles.get(lane, set())) < 3:
            blockers.append(f"insufficient_runtime_diversity:{lane}")
        for key, minimum, label in (("genreId", 8, "genre"), ("hookTypeId", 8, "hook"), ("emotionArcId", 6, "emotion"), ("vibePresetId", 8, "vibe")):
            if len(creative.get(lane, {}).get(key, set())) < minimum:
                blockers.append(f"insufficient_{label}_coverage:{lane}")
    if max(durations.values(), default=0) / max(1, count) > .2:
        blockers.append("fixed_duration_overrepresented")
    blockers.extend(f"category_overrepresented:{lane}" for lane, counts in categories.items() if sum(counts.values()) / max(1, count) > .12)
    if max(families.values(), default=0) / max(1, count) > .1:
        blockers.append("source_family_overrepresented")
    return categories, dict(durations), blockers


def load_verified_dataset(directory: Path, require_ready: bool = True):
    manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("version") != DATASET_VERSION or manifest.get("curriculum_version") != CURRICULUM_VERSION or manifest.get("prompt_version") != PROMPT_VERSION or manifest.get("quality_gate_version") != QUALITY_GATE_VERSION or manifest.get("split_method") != SPLIT_METHOD or manifest.get("pipeline") != "idea_card_only" or manifest.get("language") != "en":
        raise ValueError("Stale or incompatible training manifest; re-export current verified cards")
    if require_ready and (manifest.get("training_ready") is not True or manifest.get("blockers") != []):
        raise ValueError("Training coverage is not ready; inspect manifest blockers")
    splits = {}
    seen_sources, seen_hashes, seen_targets, family_splits = set(), set(), set(), {}
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
            if card_training_split(family) != split:
                raise ValueError("Source family differs from its frozen hash split")
            content = row["messages"][-1]["content"]
            if not re.fullmatch(r"[a-f0-9]{64}", content_hash) or meta.get("target_hash") != hashlib.sha256(content.encode()).hexdigest():
                raise ValueError("Assistant target hash differs from verified export")
            card = json.loads(content)
            recipe, concept = meta.get("creative_recipe"), meta.get("concept")
            if not isinstance(recipe, dict) or set(recipe) != set(RECIPE_KEYS) or any(not isinstance(recipe[key], str) or not recipe[key] for key in RECIPE_KEYS) or recipe["taxonomyVersion"] != "creative-taxonomy-v1" or not isinstance(concept, dict) or concept.get("recipe") != recipe:
                raise ValueError("Missing or inconsistent creative recipe provenance")
            signature = "creative-signature-v2:" + json.dumps([recipe[key] for key in RECIPE_KEYS], ensure_ascii=False, separators=(",", ":"))
            bounds = RUNTIME_RANGES.get(concept.get("runtimeProfile"))
            if meta.get("creative_signature") != signature or card["category"] != meta.get("category") or card["hookId"] != recipe["hookTypeId"] or card["shootFormat"] != recipe["shootFormat"] or card["presenceMode"] != recipe["presenceMode"] or not bounds or not bounds[0] <= card["durationSeconds"] <= bounds[1]:
                raise ValueError("Target differs from creative or runtime provenance")
            target_identity = json.dumps({key: value for key, value in card.items() if key != "id"}, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            if target_identity in seen_targets:
                raise ValueError("Duplicate assistant target under a different storage identity")
            seen_sources.add(source)
            seen_hashes.add(content_hash)
            seen_targets.add(target_identity)
            family_splits[family] = split
        splits[split] = rows
    categories, durations, blockers = dataset_coverage(splits)
    if manifest.get("accepted_count") != sum(len(rows) for rows in splits.values()) or manifest.get("category_counts") != categories or manifest.get("duration_counts") != durations:
        raise ValueError("Manifest coverage counts differ from dataset rows")
    if manifest.get("training_ready") is not (not blockers) or manifest.get("blockers") != blockers:
        raise ValueError("Manifest training coverage differs from dataset rows")
    if require_ready and blockers:
        raise ValueError("Training coverage is not ready; inspect computed blockers")
    return manifest, splits


def encode_response_only(row: dict, tokenizer, max_length: int) -> dict:
    validate_messages(row)
    if not getattr(tokenizer, "chat_template", None):
        raise ValueError("A verified chat template is required; no generic Instruction/Response fallback")
    messages = row["messages"]
    # Transformers 5 can default to BatchEncoding; make the token-list contract
    # explicit rather than treating dictionary length as sequence length.
    prefix = tokenizer.apply_chat_template(messages[:-1], tokenize=True, add_generation_prompt=True, return_dict=False)
    complete = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=False, return_dict=False)
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
