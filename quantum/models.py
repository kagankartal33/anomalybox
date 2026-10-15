"""Typed records for QUANTUM evidence and evaluation (Section 5)."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal
import hashlib
import json
import uuid


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def sha256_text(text: str) -> str:
    return "sha256:" + hashlib.sha256(text.encode("utf-8")).hexdigest()


ClaimType = Literal["factual", "analytical", "opinion", "recommendation"]
RiskLevel = Literal["low", "medium", "high", "critical"]
VerificationStatus = Literal[
    "unverified",
    "verified",
    "unsupported",
    "contradicted",
    "stale",
    "restricted",
]


@dataclass
class SourceRecord:
    source_id: str
    url: str
    title: str
    publisher: str
    author: str = ""
    published_at: str | None = None
    retrieved_at: str = field(default_factory=utc_now)
    source_type: str = "official_documentation"
    jurisdiction: str | None = None
    language: str = "en"
    freshness_class: str = "current"
    trust_score: float = 0.5
    primary_source: bool = False
    access_status: str = "available"
    license_notes: str = ""
    content_hash: str = ""
    excerpt: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "SourceRecord":
        return cls(**{k: data[k] for k in cls.__dataclass_fields__ if k in data})


@dataclass
class SupportingSource:
    source_id: str
    evidence_span: str
    support_strength: float


@dataclass
class ClaimRecord:
    claim_id: str
    statement: str
    claim_type: ClaimType = "factual"
    risk_level: RiskLevel = "medium"
    required_support: int = 1
    supporting_sources: list[SupportingSource] = field(default_factory=list)
    contradicting_sources: list[str] = field(default_factory=list)
    confidence: float = 0.0
    valid_until: str | None = None
    verification_status: VerificationStatus = "unverified"
    page_id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        return d

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ClaimRecord":
        supports = [
            SupportingSource(**s) if isinstance(s, dict) else s
            for s in data.get("supporting_sources", [])
        ]
        payload = {k: data.get(k) for k in cls.__dataclass_fields__ if k != "supporting_sources"}
        return cls(supporting_sources=supports, **payload)  # type: ignore[arg-type]


@dataclass
class PageEvaluation:
    page_id: str
    slug: str
    path: str
    overall_score: float
    decision: str
    hard_gate_failures: list[str]
    dimensions: dict[str, float]
    required_repairs: list[str]
    evaluated_at: str = field(default_factory=utc_now)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
