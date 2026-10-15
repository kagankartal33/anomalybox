"""State machine + idempotency tests."""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from quantum.state_machine import JobStore  # noqa: E402


class StateMachineTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.store = JobStore(root=Path(self.tmp.name))

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_idempotent_create(self) -> None:
        a = self.store.create("p1", "slug-a")
        b = self.store.create("p1", "slug-a")
        self.assertEqual(a.job_id, b.job_id)

    def test_legal_transition(self) -> None:
        job = self.store.create("p2", "slug-b")
        job = self.store.transition(job.job_id, "TRIAGED", actor="test", reason="ok")
        self.assertEqual(job.state, "TRIAGED")

    def test_illegal_transition(self) -> None:
        job = self.store.create("p3", "slug-c")
        with self.assertRaises(ValueError):
            self.store.transition(job.job_id, "PUBLISHED", actor="test", reason="nope")


if __name__ == "__main__":
    unittest.main()
