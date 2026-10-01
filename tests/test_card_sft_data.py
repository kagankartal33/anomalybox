"""No GPU, network or third-party dependencies required."""

import hashlib
import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from card_sft_data import (DATASET_VERSION, CURRICULUM_VERSION, PROMPT_VERSION, QUALITY_GATE_VERSION, SPLIT_METHOD, CATEGORIES, RECIPE_KEYS, card_training_split, dataset_coverage, encode_response_only, pad_response_batch, validate_messages, load_verified_dataset, configure_training_cache, training_time_limit_callback)


class FakeTokenizer:
    chat_template = "test-template"

    def apply_chat_template(self, messages, tokenize, add_generation_prompt, return_dict=True):
        assert return_dict is False
        prefix = "".join(f"<{item['role']}>{item['content']}<end>" for item in messages)
        if add_generation_prompt:
            prefix += "<assistant>"
        return list(prefix.encode())


def sample():
    card = {key: "Fixture text" for key in ("id", "title", "conceptSummary", "format", "audience", "viewerTakeaway", "whyItWorks", "personaSlug")}
    card.update({"schemaVersion": 2, "category": "beauty", "platform": "instagram_reels", "durationSeconds": 12, "difficulty": "easy", "requiredItems": ["Mirror"], "overallProductionNotes": ["Film vertically"], "hookId": "visible_constraint", "shootFormat": "talking_head", "presenceMode": "editorial_insider"})
    card["steps"] = []
    for index, stage in enumerate(("hook", "demonstration", "takeaway")):
        card["steps"].append({"id": str(index), "order": index + 1, "stage": stage, "startSecond": index * 4, "endSecond": (index + 1) * 4, "purpose": "Show the sample", "goal": "Compare the result", "action": "Hold the sample", **{key: None for key in ("spokenLine", "shot", "onScreenText", "editNote", "performanceNote")}})
    return {"messages": [{"role": "system", "content": "Write a card"}, {"role": "user", "content": "Use this brief"}, {"role": "assistant", "content": json.dumps(card)}]}


class CardSftTests(unittest.TestCase):
    def test_cache_is_process_local(self):
        import os
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as temp, patch.dict(os.environ, {"TORCHINDUCTOR_CACHE_DIR": "missing-drive/cache"}):
            configured = configure_training_cache(Path(temp) / "training")
            self.assertEqual(os.environ["TORCHINDUCTOR_CACHE_DIR"], str(configured / "inductor"))
            self.assertTrue(configured.is_dir())

    def test_response_only_and_padding(self):
        tokenizer = FakeTokenizer()
        row = sample()
        encoded = encode_response_only(row, tokenizer, 10000)
        prefix = tokenizer.apply_chat_template(row["messages"][:-1], True, True, return_dict=False)
        self.assertEqual(encoded["labels"][:len(prefix)], [-100] * len(prefix))
        self.assertEqual(encoded["labels"][len(prefix):], encoded["input_ids"][len(prefix):])
        shorter = {key: value[:-2] for key, value in encoded.items()}
        batch = pad_response_batch([encoded, shorter], 0)
        self.assertEqual(batch["labels"][1][-2:], [-100, -100])
        self.assertEqual(batch["attention_mask"][1][-2:], [0, 0])

    def test_no_silent_truncation(self):
        with self.assertRaisesRegex(ValueError, "Do not truncate"):
            encode_response_only(sample(), FakeTokenizer(), 50)

    def test_time_limit_uses_step_end_and_saves(self):
        from types import SimpleNamespace
        now = [100.0]
        callback = training_time_limit_callback(object, 1, clock=lambda: now[0])
        control = SimpleNamespace(should_training_stop=False, should_save=False, should_evaluate=False)
        callback.on_train_begin(None, None, control)
        now[0] = 159.0
        callback.on_step_end(None, None, control)
        self.assertFalse(control.should_training_stop)
        now[0] = 160.0
        callback.on_step_end(None, None, control)
        self.assertTrue(control.should_training_stop and control.should_save and control.should_evaluate)
        self.assertTrue(callback.stopped)

    def test_complete_json_required(self):
        row = sample()
        row["messages"][-1]["content"] = '{"schemaVersion":2,"steps":['
        with self.assertRaisesRegex(ValueError, "complete JSON"):
            validate_messages(row)

    def test_chat_template_required(self):
        tokenizer = FakeTokenizer()
        tokenizer.chat_template = None
        with self.assertRaisesRegex(ValueError, "chat template"):
            encode_response_only(sample(), tokenizer, 1000)

    def test_chat_boundary_must_match(self):
        class BadTokenizer(FakeTokenizer):
            def apply_chat_template(self, messages, tokenize, add_generation_prompt, return_dict=False):
                return [1, 2] if add_generation_prompt else [3, 4, 5]
        with self.assertRaisesRegex(ValueError, "assistant boundary"):
            encode_response_only(sample(), BadTokenizer(), 1000)

    def test_wrong_roles_and_legacy_format(self):
        with self.assertRaises(ValueError):
            validate_messages({"instruction": "Write", "output": "schemaVersion steps"})
        row = sample()
        row["messages"][1]["role"] = "assistant"
        with self.assertRaises(ValueError):
            validate_messages(row)

    def dataset(self, directory):
        manifest = {"version": DATASET_VERSION, "curriculum_version": CURRICULUM_VERSION, "prompt_version": PROMPT_VERSION, "quality_gate_version": QUALITY_GATE_VERSION, "split_method": SPLIT_METHOD, "pipeline": "idea_card_only", "language": "en", "training_ready": False, "file_hashes": {}, "split_counts": {}, "accepted_count": 3}
        splits = {}
        for split in ("train", "validation", "test"):
            row = sample()
            family = next(f"family-{i}" for i in range(1000) if card_training_split(f"family-{i}") == split)
            card = json.loads(row["messages"][-1]["content"])
            card["title"] = f"Fixture for {split}"
            row["messages"][-1]["content"] = json.dumps(card)
            recipe_values = ("creative-taxonomy-v1", "visible_constraint", "controlled_comparison", "visual_action", "compare_choices", "curiosity_to_clarity", "clean_editorial", "controlled_side_by_side", "side_by_side_decision", "save_reference", "talking_head", "editorial_insider")
            recipe = dict(zip(RECIPE_KEYS, recipe_values))
            row["meta"] = {"family_id": family, "source_id": split, "content_hash": hashlib.sha256(split.encode()).hexdigest(), "target_hash": hashlib.sha256(row["messages"][-1]["content"].encode()).hexdigest(), "category": "beauty", "creative_recipe": recipe, "creative_signature": "creative-signature-v2:" + json.dumps(recipe_values, separators=(",", ":")), "concept": {"recipe": recipe, "runtimeProfile": "quick_payoff"}, "split": split, "curriculum_version": CURRICULUM_VERSION, "prompt_version": PROMPT_VERSION}
            splits[split] = [row]
            data = (json.dumps(row) + "
            (directory / f"{split}.jsonl").write_bytes(data)
            manifest["file_hashes"][f"{split}.jsonl"] = hashlib.sha256(data).hexdigest()
            manifest["split_counts"][split] = 1
        manifest["category_counts"], manifest["duration_counts"], manifest["blockers"] = dataset_coverage(splits)
        (directory / "manifest.json").write_text(json.dumps(manifest))
        return manifest

    def test_manifest_and_file_integrity(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            self.dataset(directory)
            load_verified_dataset(directory, require_ready=False)
            with self.assertRaisesRegex(ValueError, "coverage is not ready"):
                load_verified_dataset(directory)
            (directory / "train.jsonl").write_text("tampered")
            with self.assertRaisesRegex(ValueError, "hash mismatch"):
                load_verified_dataset(directory, require_ready=False)

    def test_source_family_cannot_cross_splits(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            manifest = self.dataset(directory)
            path = directory / "test.jsonl"
            row = json.loads(path.read_text())
            row["meta"]["family_id"] = json.loads((directory / "train.jsonl").read_text())["meta"]["family_id"]
            data = (json.dumps(row) + "
            path.write_bytes(data)
            manifest["file_hashes"][path.name] = hashlib.sha256(data).hexdigest()
            (directory / "manifest.json").write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, "Source-family leakage"):
                load_verified_dataset(directory, require_ready=False)

    def test_ready_flag_cannot_bypass_minimum_corpus(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            manifest = self.dataset(directory)
            manifest.update(training_ready=True, blockers=[])
            (directory / "manifest.json").write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, "coverage differs"):
                load_verified_dataset(directory)

    def test_target_and_frozen_assignment_are_independently_bound(self):
        for mutation, message in (("target", "target hash"), ("family", "frozen hash split"), ("recipe", "creative or runtime provenance"), ("duplicate", "Duplicate assistant target")):
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as temp:
                directory = Path(temp)
                manifest = self.dataset(directory)
                path = directory / "test.jsonl"
                row = json.loads(path.read_text())
                if mutation == "target":
                    card = json.loads(row["messages"][-1]["content"])
                    card["title"] = "Unverified replacement"
                    row["messages"][-1]["content"] = json.dumps(card)
                elif mutation == "family":
                    row["meta"]["family_id"] = next(f"new-family-{i}" for i in range(1000) if card_training_split(f"new-family-{i}") != "test")
                elif mutation == "recipe":
                    row["meta"]["concept"]["runtimeProfile"] = "deep_process"
                else:
                    card = json.loads(json.loads((directory / "train.jsonl").read_text())["messages"][-1]["content"])
                    card["id"] = "different-storage-id"
                    row["messages"][-1]["content"] = json.dumps(card)
                    row["meta"]["target_hash"] = hashlib.sha256(row["messages"][-1]["content"].encode()).hexdigest()
                data = (json.dumps(row) + "
                path.write_bytes(data)
                manifest["file_hashes"][path.name] = hashlib.sha256(data).hexdigest()
                (directory / "manifest.json").write_text(json.dumps(manifest))
                with self.assertRaisesRegex(ValueError, message):
                    load_verified_dataset(directory, require_ready=False)

    def test_full_coverage_is_recomputed_per_category_and_axis(self):
        splits = {split: [] for split in ("train", "validation", "test")}
        for lane in CATEGORIES:
            for index in range(60):
                duration = (12, 16, 20, 25, 32, 45)[index % 6]
                runtime = ("quick_payoff", "quick_payoff", "single_proof", "single_proof", "story_proof", "deep_process")[index % 6]
                recipe = {key: f"fixture-{index % minimum}" for key, minimum in (("genreId", 8), ("hookTypeId", 8), ("emotionArcId", 6), ("vibePresetId", 8))}
                row = {"meta": {"category": lane, "family_id": f"{lane}-{index}", "concept": {"runtimeProfile": runtime}, "creative_recipe": recipe}, "messages": [{"content": json.dumps({"durationSeconds": duration})}]}
                splits["train" if index < 48 else "validation" if index < 54 else "test"].append(row)
        self.assertEqual(dataset_coverage(splits)[2], [])
        for key, code in (("genreId", "genre"), ("hookTypeId", "hook"), ("emotionArcId", "emotion"), ("vibePresetId", "vibe")):
            collapsed = copy.deepcopy(splits)
            for rows in collapsed.values():
                for row in rows:
                    if row["meta"]["category"] == "travel":
                        row["meta"]["creative_recipe"][key] = "same-fixture"
            self.assertIn(f"insufficient_{code}_coverage:travel", dataset_coverage(collapsed)[2])
        missing = copy.deepcopy(splits)
        missing["test"] = [row for row in missing["test"] if row["meta"]["category"] != "travel"]
        self.assertIn("insufficient_split_coverage:travel", dataset_coverage(missing)[2])

    def test_incomplete_or_leaked_assistant_targets_rejected(self):
        for mutation in ("empty_steps", "legacy_metadata", "missing_payoff", "timing_gap"):
            row = sample()
            card = json.loads(row["messages"][-1]["content"])
            if mutation == "empty_steps":
                card["steps"] = []
            elif mutation == "legacy_metadata":
                card["category_layer_pack"] = {"internal_score": 99}
            elif mutation == "missing_payoff":
                del card["viewerTakeaway"]
            else:
                card["steps"][1]["startSecond"] = 5
            row["messages"][-1]["content"] = json.dumps(card)
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                validate_messages(row)


if __name__ == "__main__":
    unittest.main()