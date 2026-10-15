"""P15 lifecycle decision tree + apply/merge/retire tests."""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from quantum.cms_adapter import MockCmsAdapter  # noqa: E402
from quantum.lifecycle import (  # noqa: E402
    LifecycleService,
    LifecycleSignals,
    LifecycleStore,
    decide_lifecycle,
)
from quantum.publish import PublishService, VersionStore, PublicationStore  # noqa: E402


class LifecycleDecisionTests(unittest.TestCase):
    def test_retire_when_not_useful(self) -> None:
        d = decide_lifecycle(LifecycleSignals(still_useful=False))
        self.assertEqual(d.action, "retire")
        self.assertTrue(d.requires_human)

    def test_redirect_when_not_useful_with_intent_shift(self) -> None:
        d = decide_lifecycle(
            LifecycleSignals(still_useful=False, triggers=["intent_shift"])
        )
        self.assertEqual(d.action, "redirect")

    def test_rebrief_on_intent_change(self) -> None:
        d = decide_lifecycle(
            LifecycleSignals(still_useful=True, core_intent_unchanged=False)
        )
        self.assertEqual(d.action, "rebrief_or_split")

    def test_refresh_when_facts_stale(self) -> None:
        d = decide_lifecycle(LifecycleSignals(facts_stale=True))
        self.assertEqual(d.action, "refresh_evidence")

    def test_merge_on_overlap(self) -> None:
        d = decide_lifecycle(
            LifecycleSignals(performance_weak_due_to_overlap=True, triggers=["overlap_detected"])
        )
        self.assertEqual(d.action, "merge")

    def test_improve_on_traffic_decline(self) -> None:
        d = decide_lifecycle(LifecycleSignals(triggers=["traffic_decline"]))
        self.assertEqual(d.action, "improve_utility")

    def test_keep_monitor_stable(self) -> None:
        d = decide_lifecycle(LifecycleSignals())
        self.assertEqual(d.action, "keep_monitor")


class LifecycleServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        base = Path(self.tmp.name)
        self.cms = MockCmsAdapter(root=base / "cms")
        self.svc = LifecycleService(
            store=LifecycleStore(root=base / "life"),
            cms=self.cms,
        )
        # seed a published page in CMS
        pub = PublishService(
            versions=VersionStore(root=base / "ver"),
            publications=PublicationStore(root=base / "pub"),
            cms=self.cms,
            audit_path=base / "pub_audit.jsonl",
        )
        v = pub.create_version(
            slug="old-page",
            path="/content-ideas/old-page",
            title="Old",
            body="old body content here",
        )
        pub.publish(v.version_id, actor="test")

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_auto_apply_refresh(self) -> None:
        rec = self.svc.evaluate_and_apply(
            slug="old-page",
            path="/content-ideas/old-page",
            signals=LifecycleSignals(facts_stale=True, triggers=["scheduled_freshness"]),
            actor="ops",
        )
        self.assertEqual(rec.action, "refresh_evidence")
        self.assertEqual(rec.status, "applied")

    def test_merge_fails_without_target(self) -> None:
        rec = self.svc.evaluate(
            slug="old-page",
            path="/content-ideas/old-page",
            signals=LifecycleSignals(performance_weak_due_to_overlap=True),
            actor="ops",
        )
        self.assertEqual(rec.action, "merge")
        applied = self.svc.apply(rec.record_id, actor="ops")
        self.assertEqual(applied.status, "failed")
        self.assertIn("missing", applied.error)

    def test_merge_with_target_unpublishes_source(self) -> None:
        rec = self.svc.evaluate(
            slug="old-page",
            path="/content-ideas/old-page",
            signals=LifecycleSignals(performance_weak_due_to_overlap=True),
            actor="ops",
            target_slug="canonical-page",
            redirect_path="/content-ideas/canonical-page",
        )
        applied = self.svc.apply(rec.record_id, actor="ops")
        self.assertEqual(applied.status, "applied")
        live = self.cms.read(site_id="anomalybox", path="/content-ideas/old-page")
        assert live is not None
        self.assertEqual(live.status, "unpublished")

    def test_retire_unpublishes(self) -> None:
        rec = self.svc.evaluate(
            slug="old-page",
            path="/content-ideas/old-page",
            signals=LifecycleSignals(still_useful=False),
            actor="ops",
        )
        self.assertEqual(rec.action, "retire")
        applied = self.svc.apply(rec.record_id, actor="ops")
        self.assertEqual(applied.status, "applied")
        live = self.cms.read(site_id="anomalybox", path="/content-ideas/old-page")
        assert live is not None
        self.assertEqual(live.status, "unpublished")


if __name__ == "__main__":
    unittest.main()
