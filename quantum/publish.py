"""
P14 — Immutable content versions, publish, read-back verification, rollback.

Publication idempotency: site_id + canonical_url + content_version
(Section 3 / 14 / 44).
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from quantum.cms_adapter import CmsAdapter, CmsDocument, MockCmsAdapter
from quantum.models import new_id, sha256_text, utc_now


@dataclass
class ContentVersion:
    version_id: str
    site_id: str
    page_id: str
    slug: str
    path: str
    content_version: int
    content_hash: str
    title: str
    body: str
    meta: dict[str, Any] = field(default_factory=dict)
    change_summary: str = ""
    created_by: str = "system"
    created_at: str = field(default_factory=utc_now)
    previous_version_id: str | None = None  # rollback pointer

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ContentVersion":
        return cls(**{k: data[k] for k in cls.__dataclass_fields__ if k in data})


@dataclass
class PublicationRecord:
    publication_id: str
    version_id: str
    site_id: str
    page_id: str
    slug: str
    path: str
    content_version: int
    content_hash: str
    idempotency_key: str
    cms_record_id: str
    status: str  # published | failed | rolled_back | mismatch | partial
    published_by: str
    published_at: str = field(default_factory=utc_now)
    read_back_ok: bool = False
    read_back_at: str | None = None
    read_back_hash: str | None = None
    read_back_error: str = ""
    error: str = ""
    rolled_back_from: str | None = None  # prior publication_id if this is a rollback publish

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "PublicationRecord":
        return cls(**{k: data[k] for k in cls.__dataclass_fields__ if k in data})


def publish_idempotency_key(site_id: str, path: str, content_version: int) -> str:
    canonical = path if path.startswith("/") else f"/{path}"
    return f"{site_id}:{canonical}:v{content_version}"


class VersionStore:
    """Append-only immutable version records."""

    def __init__(self, root: Path | None = None) -> None:
        self.root = root or (
            Path(__file__).resolve().parents[1] / "quantum" / "data" / "publish" / "versions"
        )
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, version_id: str) -> Path:
        return self.root / f"{version_id}.json"

    def save(self, version: ContentVersion) -> None:
        path = self._path(version.version_id)
        if path.exists():
            raise RuntimeError(f"immutable version already exists: {version.version_id}")
        path.write_text(
            json.dumps(version.to_dict(), indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    def get(self, version_id: str) -> ContentVersion | None:
        path = self._path(version_id)
        if not path.exists():
            return None
        return ContentVersion.from_dict(json.loads(path.read_text(encoding="utf-8")))

    def list_for_slug(self, slug: str, site_id: str = "anomalybox") -> list[ContentVersion]:
        out: list[ContentVersion] = []
        for p in self.root.glob("*.json"):
            v = ContentVersion.from_dict(json.loads(p.read_text(encoding="utf-8")))
            if v.slug == slug and v.site_id == site_id:
                out.append(v)
        out.sort(key=lambda x: x.content_version)
        return out

    def latest(self, slug: str, site_id: str = "anomalybox") -> ContentVersion | None:
        items = self.list_for_slug(slug, site_id=site_id)
        return items[-1] if items else None

    def next_content_version(self, slug: str, site_id: str = "anomalybox") -> int:
        latest = self.latest(slug, site_id=site_id)
        return 1 if latest is None else latest.content_version + 1


class PublicationStore:
    def __init__(self, root: Path | None = None) -> None:
        self.root = root or (
            Path(__file__).resolve().parents[1] / "quantum" / "data" / "publish" / "publications"
        )
        self.root.mkdir(parents=True, exist_ok=True)

    def save(self, rec: PublicationRecord) -> None:
        path = self.root / f"{rec.publication_id}.json"
        path.write_text(
            json.dumps(rec.to_dict(), indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    def get(self, publication_id: str) -> PublicationRecord | None:
        path = self.root / f"{publication_id}.json"
        if not path.exists():
            return None
        return PublicationRecord.from_dict(json.loads(path.read_text(encoding="utf-8")))

    def find_by_idempotency(self, key: str) -> PublicationRecord | None:
        for p in self.root.glob("*.json"):
            rec = PublicationRecord.from_dict(json.loads(p.read_text(encoding="utf-8")))
            if rec.idempotency_key == key:
                return rec
        return None

    def list_for_slug(self, slug: str, site_id: str = "anomalybox") -> list[PublicationRecord]:
        out: list[PublicationRecord] = []
        for p in self.root.glob("*.json"):
            rec = PublicationRecord.from_dict(json.loads(p.read_text(encoding="utf-8")))
            if rec.slug == slug and rec.site_id == site_id:
                out.append(rec)
        out.sort(key=lambda x: x.published_at)
        return out

    def current_live(self, slug: str, site_id: str = "anomalybox") -> PublicationRecord | None:
        """Latest successfully read-back-verified publication that is not rolled_back."""
        candidates = [
            r
            for r in self.list_for_slug(slug, site_id=site_id)
            if r.status == "published" and r.read_back_ok
        ]
        return candidates[-1] if candidates else None


class PublishService:
    def __init__(
        self,
        *,
        versions: VersionStore | None = None,
        publications: PublicationStore | None = None,
        cms: CmsAdapter | None = None,
        audit_path: Path | None = None,
    ) -> None:
        self.versions = versions or VersionStore()
        self.publications = publications or PublicationStore()
        self.cms = cms or MockCmsAdapter()
        self.audit_path = audit_path or (
            Path(__file__).resolve().parents[1] / "quantum" / "data" / "publish" / "audit.jsonl"
        )
        self.audit_path.parent.mkdir(parents=True, exist_ok=True)

    def _audit(self, event: str, **detail: Any) -> None:
        line = {"at": utc_now(), "event": event, **detail}
        with self.audit_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(line, ensure_ascii=False) + "\n")

    def create_version(
        self,
        *,
        slug: str,
        path: str,
        title: str,
        body: str,
        page_id: str | None = None,
        site_id: str = "anomalybox",
        meta: dict[str, Any] | None = None,
        change_summary: str = "",
        created_by: str = "system",
    ) -> ContentVersion:
        prev = self.versions.latest(slug, site_id=site_id)
        cv = self.versions.next_content_version(slug, site_id=site_id)
        version = ContentVersion(
            version_id=new_id("ver"),
            site_id=site_id,
            page_id=page_id or slug,
            slug=slug,
            path=path if path.startswith("/") else f"/{path}",
            content_version=cv,
            content_hash=sha256_text(body),
            title=title,
            body=body,
            meta=meta or {},
            change_summary=change_summary,
            created_by=created_by,
            previous_version_id=prev.version_id if prev else None,
        )
        self.versions.save(version)
        self._audit(
            "version_created",
            version_id=version.version_id,
            slug=slug,
            content_version=cv,
            actor=created_by,
        )
        return version

    def publish(
        self,
        version_id: str,
        *,
        actor: str = "system",
        skip_if_duplicate: bool = True,
    ) -> PublicationRecord:
        version = self.versions.get(version_id)
        if not version:
            raise KeyError(f"unknown version {version_id}")

        key = publish_idempotency_key(version.site_id, version.path, version.content_version)
        existing = self.publications.find_by_idempotency(key)
        if existing and skip_if_duplicate:
            self._audit(
                "publish_idempotent_hit",
                publication_id=existing.publication_id,
                version_id=version_id,
                actor=actor,
            )
            return existing

        doc = CmsDocument(
            cms_record_id="",
            site_id=version.site_id,
            slug=version.slug,
            path=version.path,
            content_version=version.content_version,
            content_hash=version.content_hash,
            title=version.title,
            body=version.body,
            meta=dict(version.meta),
        )
        result = self.cms.upsert(doc, idempotency_key=key)

        rec = PublicationRecord(
            publication_id=new_id("pub"),
            version_id=version.version_id,
            site_id=version.site_id,
            page_id=version.page_id,
            slug=version.slug,
            path=version.path,
            content_version=version.content_version,
            content_hash=version.content_hash,
            idempotency_key=key,
            cms_record_id=result.cms_record_id,
            status="failed",
            published_by=actor,
            error=result.error,
        )

        if result.partial:
            rec.status = "partial"
            rec.error = result.error or "partial_failure"
            self.publications.save(rec)
            self._audit("publish_partial", publication_id=rec.publication_id, error=rec.error)
            # still attempt read-back for ops visibility
            self.verify_read_back(rec.publication_id)
            return self.publications.get(rec.publication_id) or rec

        if not result.ok:
            rec.status = "failed"
            self.publications.save(rec)
            self._audit("publish_failed", publication_id=rec.publication_id, error=rec.error)
            return rec

        rec.status = "published"
        rec.cms_record_id = result.cms_record_id
        self.publications.save(rec)
        self._audit(
            "publish_ok",
            publication_id=rec.publication_id,
            version_id=version_id,
            actor=actor,
        )
        return self.verify_read_back(rec.publication_id)

    def verify_read_back(self, publication_id: str) -> PublicationRecord:
        rec = self.publications.get(publication_id)
        if not rec:
            raise KeyError(publication_id)

        live = self.cms.read(site_id=rec.site_id, path=rec.path)
        rec.read_back_at = utc_now()
        if live is None:
            rec.read_back_ok = False
            rec.read_back_error = "missing_on_read_back"
            if rec.status == "published":
                rec.status = "mismatch"
            self.publications.save(rec)
            self._audit("read_back_missing", publication_id=publication_id)
            return rec

        live_hash = sha256_text(live.body)
        rec.read_back_hash = live_hash
        if live.content_hash != rec.content_hash or live_hash != rec.content_hash:
            rec.read_back_ok = False
            rec.read_back_error = "content_hash_mismatch"
            if rec.status in {"published", "partial"}:
                rec.status = "mismatch"
            self.publications.save(rec)
            self._audit(
                "read_back_mismatch",
                publication_id=publication_id,
                expected=rec.content_hash,
                got=live_hash,
            )
            return rec

        if live.content_version != rec.content_version:
            rec.read_back_ok = False
            rec.read_back_error = "content_version_mismatch"
            if rec.status == "published":
                rec.status = "mismatch"
            self.publications.save(rec)
            self._audit("read_back_version_mismatch", publication_id=publication_id)
            return rec

        rec.read_back_ok = True
        rec.read_back_error = ""
        if rec.status == "mismatch":
            rec.status = "published"
        self.publications.save(rec)
        self._audit("read_back_ok", publication_id=publication_id)
        return rec

    def rollback(
        self,
        slug: str,
        *,
        actor: str = "system",
        site_id: str = "anomalybox",
        target_version_id: str | None = None,
    ) -> PublicationRecord:
        """
        Restore a previous immutable version onto the CMS.
        Does not mutate version blobs. Creates a new publication record with a
        restore-specific idempotency key so re-apply is allowed after a newer publish.
        """
        if target_version_id:
            target = self.versions.get(target_version_id)
            if not target or target.slug != slug or target.site_id != site_id:
                raise KeyError(f"target version not found for slug: {target_version_id}")
        else:
            latest = self.versions.latest(slug, site_id=site_id)
            if not latest or not latest.previous_version_id:
                raise RuntimeError(f"no rollback target for {slug}")
            target = self.versions.get(latest.previous_version_id)
            if not target:
                raise KeyError(latest.previous_version_id)

        current = self.publications.current_live(slug, site_id=site_id)
        prior_pub_id = current.publication_id if current else None
        if current:
            current.status = "rolled_back"
            self.publications.save(current)
            self._audit(
                "mark_rolled_back",
                publication_id=current.publication_id,
                actor=actor,
            )

        # Unique restore key: allows CMS re-apply of an older content_version
        restore_key = (
            f"{site_id}:{target.path}:restore:v{target.content_version}:"
            f"{prior_pub_id or 'none'}:{new_id('rst')}"
        )
        doc = CmsDocument(
            cms_record_id="",
            site_id=target.site_id,
            slug=target.slug,
            path=target.path,
            content_version=target.content_version,
            content_hash=target.content_hash,
            title=target.title,
            body=target.body,
            meta=dict(target.meta),
        )
        result = self.cms.upsert(doc, idempotency_key=restore_key)

        rec = PublicationRecord(
            publication_id=new_id("pub"),
            version_id=target.version_id,
            site_id=target.site_id,
            page_id=target.page_id,
            slug=target.slug,
            path=target.path,
            content_version=target.content_version,
            content_hash=target.content_hash,
            idempotency_key=restore_key,
            cms_record_id=result.cms_record_id,
            status="failed",
            published_by=actor,
            error=result.error,
            rolled_back_from=prior_pub_id,
        )
        if not result.ok:
            if result.partial:
                rec.status = "partial"
            self.publications.save(rec)
            self._audit("rollback_failed", publication_id=rec.publication_id, error=rec.error)
            return rec

        rec.status = "published"
        rec.cms_record_id = result.cms_record_id
        self.publications.save(rec)
        verified = self.verify_read_back(rec.publication_id)
        self._audit(
            "rollback",
            slug=slug,
            target_version_id=target.version_id,
            publication_id=verified.publication_id,
            actor=actor,
        )
        return verified

    def export_snapshot(self) -> dict[str, Any]:
        versions = [
            ContentVersion.from_dict(json.loads(p.read_text(encoding="utf-8"))).to_dict()
            for p in sorted(self.versions.root.glob("*.json"))
        ]
        pubs = [
            PublicationRecord.from_dict(json.loads(p.read_text(encoding="utf-8"))).to_dict()
            for p in sorted(self.publications.root.glob("*.json"))
        ]
        return {
            "versions": versions,
            "publications": pubs,
            "exported_at": utc_now(),
            "counts": {
                "versions": len(versions),
                "publications": len(pubs),
                "published_ok": sum(1 for x in pubs if x["status"] == "published" and x["read_back_ok"]),
                "mismatch": sum(1 for x in pubs if x["status"] == "mismatch"),
                "failed": sum(1 for x in pubs if x["status"] == "failed"),
                "rolled_back": sum(1 for x in pubs if x["status"] == "rolled_back"),
            },
        }
