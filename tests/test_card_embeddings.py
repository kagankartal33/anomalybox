"""Offline embedding regressions; no database, model downloads or provider calls."""
import importlib.util
import pathlib
import sys
import unittest
import numpy as np

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("embedding_worker", pathlib.Path(__file__).resolve().parents[1] / "tools/embed-card-stock-v2-2.py")
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)


class Tokenizer:
    def encode(self, text, add_special_tokens=False):
        return text.split()

    def decode(self, tokens, skip_special_tokens=True):
        return " ".join(tokens)

    def num_special_tokens_to_add(self, pair=False):
        return 2


class Model:
    tokenizer = Tokenizer()
    max_seq_length = 16

    def __init__(self):
        self.seen = []

    def encode(self, chunks, **kwargs):
        self.seen = chunks
        return np.array([[1, len(text)] for text in chunks], dtype=np.float32)


class EmbeddingTests(unittest.TestCase):
    def test_legacy_scene_content(self):
        text = worker.card_text({"idea_summary": {"title": "A title", "premise": "A premise", "viewer_takeaway": "Takeaway"},
                                "scene_script": [{"visual_action": "Open the bag", "voiceover": "Our words", "shot_type": "Wide",
                                                  "on_screen_text": ["Top", "Bottom"], "edit_note": "Cut"}]})
        self.assertEqual(text, "A title\nA premise\nTakeaway\nOpen the bag\nOur words\nWide\nTop\nBottom\nCut")

    def test_v2_priority_and_whitespace(self):
        self.assertEqual(worker.card_text({"title": " x ", "conceptSummary": " y ", "one_sentence_premise": "redundant",
                                          "steps": [{"purpose": " z ", "goal": " a ", "action": "b", "spokenLine": "c"}]}), "x\ny\nz\na\nb\nc")

    def test_full_text_not_truncated(self):
        model = Model()
        text = " ".join(f"word{i}" for i in range(131))
        vectors, counts = worker.encode_complete(model, [text])
        self.assertEqual(" ".join(model.seen), text)
        self.assertGreater(counts[0], 1)
        self.assertTrue(all(len(chunk.split()) <= 10 for chunk in model.seen))
        self.assertAlmostEqual(float(np.linalg.norm(vectors[0])), 1, places=5)

    def test_empty_document_fails(self):
        with self.assertRaises(ValueError):
            worker.encode_complete(Model(), [""])

    def test_global_not_category_scoped(self):
        vectors = np.array([[1., 0], [0, 1.], [1., 0]])
        nearest = worker.global_neighbours(vectors)
        self.assertEqual(nearest[0], (1., 2))
        self.assertEqual(nearest[2], (1., 0))
        self.assertTrue(all(index != match for index, (_, match) in enumerate(nearest)))

    def test_singleton(self):
        self.assertEqual(worker.global_neighbours(np.array([[1., 0]])), [(0., None)])


if __name__ == "__main__":
    unittest.main()
