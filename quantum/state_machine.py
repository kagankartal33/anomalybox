"""Content job state machine (Section 3) — local durable JSON checkpointing."""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from quantum.models import new_id, utc_now

VALID_TRANSITIONS: dict[str, set[str]] = {
    "DISCOVERED": {"TRIAGED", "REJECTED"},
    "TRIAGED": {"JUSTIFIED", "REJECTED", "BLOCKED"},
    "JUSTIFIED": {"RESEARCH_PLANNED", "REJECTED"},
    "RESEARCH_PLANNED": {"SOURCES_ACQUIRED", "BLOCKED"},
    "SOURCES_ACQUIRED": {"EVIDENCE_READY", "BLOCKED"},
    "EVIDENCE_READY": {"BRIEF_APPROVED", "BLOCKED"},
    "BRIEF_APPROVED": {"DRAFTED"},
    "DRAFTED": {"VERIFIED", "FAILED_RETRYABLE"},
    "VERIFIED": {"EDITED", "FAILED_RETRYABLE"},
    "EDITED": {"SEO_VALIDATED", "FAILED_RETRYABLE"},
    "SEO_VALIDATED": {"POLICY_VALIDATED", "FAILED_RETRYABLE"},
    "POLICY_VALIDATED": {"HUMAN_APPROVED", "AUTO_APPROVED", "BLOCKED"},
    "HUMAN_APPROVED": {"ASSETS_READY"},
    "AUTO_APPROVED": {"ASSETS_READY"},
    "ASSETS_READY": {"RENDER_VALIDATED", "FAILED_RETRYABLE"},
    "RENDER_VALIDATED": {"SCHEDULED", "FAILED_RETRYABLE"},
    "SCHEDULED": {"PUBLISHED"},
    "PUBLISHED": {"MONITORED", "ROLLED_BACK"},
    "MONITORED": {"REFRESH_DUE", "CONSOLIDATE", "RETIRE", "ARCHIVED"},
    "FAILED_RETRYABLE": {"DRAFTED", "VERIFIED", "FAILED_PERMANENT"},
    "BLOCKED": {"TRIAGED", "FAILED_PERMANENT"},
    "REFRESH_DUE": {"RESEARCH_PLANNED", "DRAFTED"},
}


@dataclass
class Transition:
    at: str
    actor: str
    from_state: str
    to_state: str
    reason: str
    policy_version: str = "4.0"


@dataclass
class ContentJob:
    job_id: str
    page_id: str
    slug: str
    state: str
    idempotency_key: str
    history: list[dict[str, Any]] = field(default_factory=list)
    payload: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ContentJob":
        return cls(**data)


class JobStore:
    def __init__(self, root: Path | None = None) -> None:
        self.root = root or (Path(__file__).resolve().parents[1] / "quantum" / "data" / "jobs")
        self.root.mkdir(parents=True, exist_ok=True)

    def create(self, page_id: str, slug: str, site_id: str = "anomalybox") -> ContentJob:
        job_id = new_id("job")
        key = f"{site_id}:{slug}:v1"
        # idempotent create by key
        existing = self.find_by_idempotency(key)
        if existing:
            return existing
        job = ContentJob(
            job_id=job_id,
            page_id=page_id,
            slug=slug,
            state="DISCOVERED",
            idempotency_key=key,
            history=[
                {
                    "at": utc_now(),
                    "actor": "system",
                    "from_state": "",
                    "to_state": "DISCOVERED",
                    "reason": "created",
                    "policy_version": "4.0",
                }
            ],
        )
        self.save(job)
        return job

    def find_by_idempotency(self, key: str) -> ContentJob | None:
        for p in self.root.glob("*.json"):
            job = ContentJob.from_dict(json.loads(p.read_text(encoding="utf-8")))
            if job.idempotency_key == key:
                return job
        return None

    def get(self, job_id: str) -> ContentJob | None:
        path = self.root / f"{job_id}.json"
        if not path.exists():
            return None
        return ContentJob.from_dict(json.loads(path.read_text(encoding="utf-8")))

    def save(self, job: ContentJob) -> None:
        path = self.root / f"{job.job_id}.json"
        path.write_text(json.dumps(job.to_dict(), indent=2) + "\n", encoding="utf-8")

    def transition(
        self,
        job_id: str,
        to_state: str,
        *,
        actor: str,
        reason: str,
    ) -> ContentJob:
        job = self.get(job_id)
        if not job:
            raise KeyError(job_id)
        allowed = VALID_TRANSITIONS.get(job.state, set())
        if to_state not in allowed:
            raise ValueError(f"Illegal transition {job.state} -> {to_state}")
        tr = Transition(
            at=utc_now(),
            actor=actor,
            from_state=job.state,
            to_state=to_state,
            reason=reason,
        )
        job.history.append(asdict(tr))
        job.state = to_state
        self.save(job)
        return job
