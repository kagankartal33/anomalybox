"""P13 human review store tests — roles, double-submit, queue."""
from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from quantum.human_review import HumanReviewStore, ReviewItem


class HumanReviewTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.store = HumanReviewStore(root=Path(self.tmp.name))

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def _item(self) -> ReviewItem:
        item = ReviewItem(
            item_id="rev_test1",
            page_id="AB-001",
            slug="sample-page",
            path="/content-ideas/sample-page",
            risk_level="medium",
            overall_score=84.0,
            decision_auto="approve_with_minor_repairs",
            required_repairs=["near_duplicate_warn:other:0.72"],
            hard_gate_failures=[],
        )
        self.store.save_item(item)
        return item

    def test_role_permission_denied(self) -> None:
        item = self._item()
        with self.assertRaises(PermissionError):
            self.store.submit_decision(
                item.item_id,
                action="escalate",
                actor="bob",
                role="editor",
                reason="need legal",
                idempotency_key="k-deny",
            )

    def test_decision_and_double_submit(self) -> None:
        item = self._item()
        d1 = self.store.submit_decision(
            item.item_id,
            action="approve",
            actor="alice",
            role="editor",
            reason="repairs acceptable",
            idempotency_key="k-once",
        )
        d2 = self.store.submit_decision(
            item.item_id,
            action="approve",
            actor="alice",
            role="editor",
            reason="repairs acceptable",
            idempotency_key="k-once",
        )
        self.assertEqual(d1.decision_id, d2.decision_id)
        refreshed = self.store.get_item(item.item_id)
        assert refreshed is not None
        self.assertEqual(refreshed.status, "decided")
        # second different key on already-decided item fails
        with self.assertRaises(RuntimeError):
            self.store.submit_decision(
                item.item_id,
                action="reject",
                actor="alice",
                role="editor",
                reason="changed mind",
                idempotency_key="k-two",
            )

    def test_enqueue_from_evaluation(self) -> None:
        eval_path = Path(self.tmp.name) / "eval.json"
        eval_path.write_text(
            json.dumps(
                {
                    "results": [
                        {
                            "page_id": "AB-9",
                            "slug": "demo-slug",
                            "path": "/x/demo-slug",
                            "overall_score": 83.5,
                            "decision": "approve_with_minor_repairs",
                            "required_repairs": ["near_duplicate_warn:a:0.71"],
                            "hard_gate_failures": [],
                        },
                        {
                            "page_id": "AB-10",
                            "slug": "ok-slug",
                            "path": "/x/ok-slug",
                            "overall_score": 90.0,
                            "decision": "approve",
                            "required_repairs": [],
                            "hard_gate_failures": [],
                        },
                    ]
                }
            ),
            encoding="utf-8",
        )
        items = self.store.enqueue_from_evaluation(eval_path)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].slug, "demo-slug")
        self.assertEqual(len(self.store.list_queue(status="queued")), 1)

    def test_audit_written(self) -> None:
        item = self._item()
        self.store.submit_decision(
            item.item_id,
            action="edit_required",
            actor="cara",
            role="senior_editor",
            reason="fix FAQ",
            idempotency_key="k-audit",
        )
        tail = self.store.audit_tail(5)
        self.assertTrue(any(x.get("event") == "decision" for x in tail))


if __name__ == "__main__":
    unittest.main()
