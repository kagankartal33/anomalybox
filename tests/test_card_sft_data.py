"""No GPU, network or third-party dependencies required."""
import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from card_sft_data import (DATASET_VERSION, CURRICULUM_VERSION, PROMPT_VERSION, encode_response_only, pad_response_batch, validate_messages, load_verified_dataset)


class FakeTokenizer:
    chat_template = "test-template"

    def apply_chat_template(self, messages, tokenize, add_generation_prompt):
        prefix = "".join(f"<{item['role']}>{item['content']}<end>" for item in messages)
        if add_generation_prompt:
            prefix += "<assistant>"
        return list(prefix.encode())


def sample():
    return {"messages": [{"role": "system", "content": "Write a card"}, {"role": "user", "content": "Use this brief"}, {"role": "assistant", "content": json.dumps({"schemaVersion": 2, "steps": []})}]}


class CardSftTests(unittest.TestCase):
    def test_response_only_and_padding(self):
        tokenizer = FakeTokenizer()
        row = sample()
        encoded = encode_response_only(row, tokenizer, 1000)
        prefix = tokenizer.apply_chat_template(row["messages"][:-1], True, True)
        self.assertEqual(encoded["labels"][:len(prefix)], [-100] * len(prefix))
        self.assertEqual(encoded["labels"][len(prefix):], encoded["input_ids"][len(prefix):])
        shorter = {key: value[:-2] for key, value in encoded.items()}
        batch = pad_response_batch([encoded, shorter], 0)
        self.assertEqual(batch["labels"][1][-2:], [-100, -100])
        self.assertEqual(batch["attention_mask"][1][-2:], [0, 0])

    def test_no_silent_truncation(self):
        with self.assertRaisesRegex(ValueError, "Do not truncate"):
            encode_response_only(sample(), FakeTokenizer(), 50)

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
            def apply_chat_template(self, messages, tokenize, add_generation_prompt):
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
        manifest = {"version": DATASET_VERSION, "curriculum_version": CURRICULUM_VERSION, "prompt_version": PROMPT_VERSION, "pipeline": "idea_card_only", "language": "en", "training_ready": False, "blockers": ["fixture_only"], "file_hashes": {}, "split_counts": {}}
        for split in ("train", "validation", "test"):
            row = sample()
            row["meta"] = {"family_id": split, "source_id": split, "content_hash": split, "split": split, "curriculum_version": CURRICULUM_VERSION, "prompt_version": PROMPT_VERSION}
            data = (json.dumps(row) + "\
            (directory / f"{split}.jsonl").write_bytes(data)
            manifest["file_hashes"][f"{split}.jsonl"] = hashlib.sha256(data).hexdigest()
            manifest["split_counts"][split] = 1
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
            row["meta"]["family_id"] = "train"
            data = (json.dumps(row) + "\
            path.write_bytes(data)
            manifest["file_hashes"][path.name] = hashlib.sha256(data).hexdigest()
            (directory / "manifest.json").write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, "Source-family leakage"):
                load_verified_dataset(directory, require_ready=False)


if __name__ == "__main__":
    unittest.main()