"""P14 publish / read-back / rollback tests."""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from quantum.cms_adapter import MockCmsAdapter  # noqa: E402
from quantum.publish import PublicationStore, PublishService, VersionStore, publish_idempotency_key  # noqa: E402
from quantum.models import sha256_text  # noqa: E402


class PublishTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        base = Path(self.tmp.name)
        self.cms = MockCmsAdapter(root=base / "cms")
        self.svc = PublishService(
            versions=VersionStore(root=base / "versions"),
            publications=PublicationStore(root=base / "pubs"),
            cms=self.cms,
            audit_path=base / "audit.jsonl",
        )

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def _ver(self, body: str = "hello body", slug: str = "demo-page", n_title: str = "Demo") -> str:
        v = self.svc.create_version(
            slug=slug,
            path=f"/content-ideas/{slug}",
            title=n_title,
            body=body,
            change_summary="test",
            created_by="test",
        )
        return v.version_id

    def test_publish_and_read_back_ok(self) -> None:
        vid = self._ver("clean content for publish")
        rec = self.svc.publish(vid, actor="alice")
        self.assertEqual(rec.status, "published")
        self.assertTrue(rec.read_back_ok)
        self.assertEqual(rec.content_hash, sha256_text("clean content for publish"))
        live = self.cms.read(site_id="anomalybox", path="/content-ideas/demo-page")
        assert live is not None
        self.assertEqual(live.body, "clean content for publish")

    def test_duplicate_publish_idempotent(self) -> None:
        vid = self._ver("same version twice")
        a = self.svc.publish(vid, actor="a")
        b = self.svc.publish(vid, actor="b")
        self.assertEqual(a.publication_id, b.publication_id)
        self.assertEqual(a.idempotency_key, publish_idempotency_key("anomalybox", "/content-ideas/demo-page", 1))
        # only one publication file for this key
        pubs = self.svc.publications.list_for_slug("demo-page")
        self.assertEqual(len(pubs), 1)

    def test_immutable_version_cannot_overwrite(self) -> None:
        vid = self._ver("locked")
        v = self.svc.versions.get(vid)
        assert v is not None
        with self.assertRaises(RuntimeError):
            self.svc.versions.save(v)

    def test_partial_failure(self) -> None:
        base = Path(self.tmp.name) / "partial"
        cms = MockCmsAdapter(root=base / "cms", partial_on_upsert=True)
        svc = PublishService(
            versions=VersionStore(root=base / "versions"),
            publications=PublicationStore(root=base / "pubs"),
            cms=cms,
            audit_path=base / "audit.jsonl",
        )
        v = svc.create_version(
            slug="partial-page",
            path="/x/partial-page",
            title="P",
            body="partial body",
        )
        rec = svc.publish(v.version_id, actor="test")
        self.assertEqual(rec.status, "partial")
        # document may still exist on CMS after partial
        live = cms.read(site_id="anomalybox", path="/x/partial-page")
        self.assertIsNotNone(live)

    def test_read_back_mismatch(self) -> None:
        base = Path(self.tmp.name) / "mismatch"
        cms = MockCmsAdapter(root=base / "cms", corrupt_read_hash=True)
        svc = PublishService(
            versions=VersionStore(root=base / "versions"),
            publications=PublicationStore(root=base / "pubs"),
            cms=cms,
            audit_path=base / "audit.jsonl",
        )
        v = svc.create_version(
            slug="bad-rb",
            path="/x/bad-rb",
            title="Bad",
            body="intended body",
        )
        rec = svc.publish(v.version_id, actor="test")
        self.assertEqual(rec.status, "mismatch")
        self.assertFalse(rec.read_back_ok)
        self.assertIn("mismatch", rec.read_back_error)

    def test_upsert_hard_fail(self) -> None:
        base = Path(self.tmp.name) / "fail"
        cms = MockCmsAdapter(root=base / "cms", fail_on_upsert=True)
        svc = PublishService(
            versions=VersionStore(root=base / "versions"),
            publications=PublicationStore(root=base / "pubs"),
            cms=cms,
            audit_path=base / "audit.jsonl",
        )
        v = svc.create_version(
            slug="fail-page",
            path="/x/fail-page",
            title="F",
            body="no write",
        )
        rec = svc.publish(v.version_id, actor="test")
        self.assertEqual(rec.status, "failed")
        self.assertIsNone(cms.read(site_id="anomalybox", path="/x/fail-page"))

    def test_rollback_restores_previous_body(self) -> None:
        v1 = self.svc.create_version(
            slug="rb-page",
            path="/x/rb-page",
            title="V1",
            body="version one body",
            change_summary="first",
        )
        p1 = self.svc.publish(v1.version_id, actor="ed")
        self.assertTrue(p1.read_back_ok)

        v2 = self.svc.create_version(
            slug="rb-page",
            path="/x/rb-page",
            title="V2",
            body="version two body",
            change_summary="second",
        )
        self.assertEqual(v2.content_version, 2)
        self.assertEqual(v2.previous_version_id, v1.version_id)
        p2 = self.svc.publish(v2.version_id, actor="ed")
        self.assertTrue(p2.read_back_ok)
        live = self.cms.read(site_id="anomalybox", path="/x/rb-page")
        assert live is not None
        self.assertEqual(live.body, "version two body")

        restored = self.svc.rollback("rb-page", actor="ed")
        self.assertEqual(restored.status, "published")
        self.assertTrue(restored.read_back_ok)
        self.assertEqual(restored.version_id, v1.version_id)
        self.assertEqual(restored.rolled_back_from, p2.publication_id)
        live2 = self.cms.read(site_id="anomalybox", path="/x/rb-page")
        assert live2 is not None
        self.assertEqual(live2.body, "version one body")
        self.assertEqual(live2.content_version, 1)

        # prior live marked rolled_back
        old = self.svc.publications.get(p2.publication_id)
        assert old is not None
        self.assertEqual(old.status, "rolled_back")

    def test_rollback_without_previous_fails(self) -> None:
        v1 = self.svc.create_version(
            slug="only",
            path="/x/only",
            title="Only",
            body="one",
        )
        self.svc.publish(v1.version_id, actor="ed")
        with self.assertRaises(RuntimeError):
            self.svc.rollback("only", actor="ed")


if __name__ == "__main__":
    unittest.main()
