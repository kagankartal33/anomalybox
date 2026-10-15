"""
P14 — CMS adapter contract + filesystem mock (no live CMS required).

Idempotency key for publish side-effects: site_id + canonical_url + content_version.
"""
from __future__ import annotations

import json
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from quantum.models import new_id, utc_now


@dataclass
class CmsDocument:
    """Live document as the CMS believes it is published."""

    cms_record_id: str
    site_id: str
    slug: str
    path: str
    content_version: int
    content_hash: str
    title: str
    body: str
    meta: dict[str, Any] = field(default_factory=dict)
    status: str = "published"  # published | unpublished
    updated_at: str = field(default_factory=utc_now)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "CmsDocument":
        return cls(**{k: data[k] for k in cls.__dataclass_fields__ if k in data})


@dataclass
class CmsWriteResult:
    ok: bool
    cms_record_id: str = ""
    error: str = ""
    partial: bool = False  # side-effect may have started


class CmsAdapter(ABC):
    @abstractmethod
    def upsert(self, doc: CmsDocument, *, idempotency_key: str) -> CmsWriteResult:
        ...

    @abstractmethod
    def read(self, *, site_id: str, path: str) -> CmsDocument | None:
        ...

    @abstractmethod
    def unpublish(self, *, site_id: str, path: str, idempotency_key: str) -> CmsWriteResult:
        ...


class MockCmsAdapter(CmsAdapter):
    """
    Durable mock CMS under a root directory.
    Failure modes (for tests):
      - fail_on_upsert: raise/return error before durable write
      - partial_on_upsert: write then return failure (simulates crash after side-effect)
      - corrupt_read_hash: mutate stored body after successful write (read-back mismatch)
    """

    def __init__(
        self,
        root: Path | None = None,
        *,
        fail_on_upsert: bool = False,
        partial_on_upsert: bool = False,
        corrupt_read_hash: bool = False,
    ) -> None:
        self.root = root or (
            Path(__file__).resolve().parents[1] / "quantum" / "data" / "publish" / "cms_mock"
        )
        self.root.mkdir(parents=True, exist_ok=True)
        self.fail_on_upsert = fail_on_upsert
        self.partial_on_upsert = partial_on_upsert
        self.corrupt_read_hash = corrupt_read_hash
        self._idempotency: dict[str, str] = {}  # key -> cms_record_id
        self._load_idempotency()

    def _doc_path(self, site_id: str, path: str) -> Path:
        safe = path.strip("/").replace("/", "__") or "root"
        return self.root / site_id / f"{safe}.json"

    def _idemp_path(self) -> Path:
        return self.root / "_idempotency.json"

    def _load_idempotency(self) -> None:
        p = self._idemp_path()
        if p.exists():
            self._idempotency = json.loads(p.read_text(encoding="utf-8"))

    def _save_idempotency(self) -> None:
        self._idemp_path().write_text(
            json.dumps(self._idempotency, indent=2) + "\n", encoding="utf-8"
        )

    def upsert(self, doc: CmsDocument, *, idempotency_key: str) -> CmsWriteResult:
        if idempotency_key in self._idempotency:
            existing_id = self._idempotency[idempotency_key]
            # return prior success — no duplicate write of a new record id
            live = self.read(site_id=doc.site_id, path=doc.path)
            if live and live.cms_record_id == existing_id:
                return CmsWriteResult(ok=True, cms_record_id=existing_id)
            # key known but document missing: re-apply same id
            doc.cms_record_id = existing_id

        if self.fail_on_upsert and idempotency_key not in self._idempotency:
            return CmsWriteResult(ok=False, error="cms_upsert_failed", partial=False)

        if not doc.cms_record_id:
            doc.cms_record_id = new_id("cms")
        doc.updated_at = utc_now()
        doc.status = "published"

        path = self._doc_path(doc.site_id, doc.path)
        path.parent.mkdir(parents=True, exist_ok=True)

        to_store = doc
        if self.corrupt_read_hash:
            # store deliberately wrong body while reporting the intended hash
            corrupted = CmsDocument(**{**doc.to_dict(), "body": doc.body + "\n<!--corrupt-->\n"})
            to_store = corrupted

        path.write_text(json.dumps(to_store.to_dict(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        self._idempotency[idempotency_key] = doc.cms_record_id
        self._save_idempotency()

        if self.partial_on_upsert:
            return CmsWriteResult(
                ok=False,
                cms_record_id=doc.cms_record_id,
                error="cms_partial_failure_after_write",
                partial=True,
            )

        return CmsWriteResult(ok=True, cms_record_id=doc.cms_record_id)

    def read(self, *, site_id: str, path: str) -> CmsDocument | None:
        p = self._doc_path(site_id, path)
        if not p.exists():
            return None
        return CmsDocument.from_dict(json.loads(p.read_text(encoding="utf-8")))

    def unpublish(self, *, site_id: str, path: str, idempotency_key: str) -> CmsWriteResult:
        if idempotency_key in self._idempotency:
            return CmsWriteResult(ok=True, cms_record_id=self._idempotency[idempotency_key])
        doc = self.read(site_id=site_id, path=path)
        if not doc:
            # idempotent no-op
            rid = new_id("cms")
            self._idempotency[idempotency_key] = rid
            self._save_idempotency()
            return CmsWriteResult(ok=True, cms_record_id=rid)
        doc.status = "unpublished"
        doc.updated_at = utc_now()
        p = self._doc_path(site_id, path)
        p.write_text(json.dumps(doc.to_dict(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        self._idempotency[idempotency_key] = doc.cms_record_id
        self._save_idempotency()
        return CmsWriteResult(ok=True, cms_record_id=doc.cms_record_id)
