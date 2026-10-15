"""
Filesystem Evidence Ledger (QUANTUM Section 5) — mock path without live credentials.

Storage root: quantum/data/ledger/
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from quantum.models import (
    ClaimRecord,
    SourceRecord,
    SupportingSource,
    new_id,
    sha256_text,
    utc_now,
)

DEFAULT_ROOT = Path(__file__).resolve().parents[1] / "quantum" / "data" / "ledger"


class EvidenceLedger:
    def __init__(self, root: Path | None = None) -> None:
        self.root = root or DEFAULT_ROOT
        self.sources_dir = self.root / "sources"
        self.claims_dir = self.root / "claims"
        self.sources_dir.mkdir(parents=True, exist_ok=True)
        self.claims_dir.mkdir(parents=True, exist_ok=True)

    # --- sources ---
    def add_source(
        self,
        *,
        url: str,
        title: str,
        publisher: str,
        excerpt: str = "",
        author: str = "",
        source_type: str = "official_documentation",
        trust_score: float = 0.5,
        primary_source: bool = False,
        access_status: str = "available",
        license_notes: str = "",
        published_at: str | None = None,
    ) -> SourceRecord:
        if access_status == "fabricated":
            raise ValueError("Fabricated sources are prohibited (Section 0.2 / 5.4)")
        if not url or not title:
            raise ValueError("url and title are required")
        content_hash = sha256_text(excerpt or f"{url}|{title}")
        rec = SourceRecord(
            source_id=new_id("src"),
            url=url,
            title=title,
            publisher=publisher,
            author=author,
            published_at=published_at,
            retrieved_at=utc_now(),
            source_type=source_type,
            trust_score=max(0.0, min(1.0, trust_score)),
            primary_source=primary_source,
            access_status=access_status,
            license_notes=license_notes,
            content_hash=content_hash,
            excerpt=excerpt,
        )
        if rec.access_status not in {"available", "restricted", "paywalled", "offline"}:
            raise ValueError(f"Invalid access_status: {rec.access_status}")
        self._write(self.sources_dir / f"{rec.source_id}.json", rec.to_dict())
        return rec

    def get_source(self, source_id: str) -> SourceRecord | None:
        path = self.sources_dir / f"{source_id}.json"
        if not path.exists():
            return None
        return SourceRecord.from_dict(json.loads(path.read_text(encoding="utf-8")))

    def list_sources(self) -> list[SourceRecord]:
        return [
            SourceRecord.from_dict(json.loads(p.read_text(encoding="utf-8")))
            for p in sorted(self.sources_dir.glob("*.json"))
        ]

    # --- claims ---
    def add_claim(
        self,
        *,
        statement: str,
        claim_type: str = "factual",
        risk_level: str = "medium",
        required_support: int = 1,
        page_id: str | None = None,
        valid_until: str | None = None,
    ) -> ClaimRecord:
        if not statement.strip():
            raise ValueError("claim statement required")
        rec = ClaimRecord(
            claim_id=new_id("clm"),
            statement=statement.strip(),
            claim_type=claim_type,  # type: ignore[arg-type]
            risk_level=risk_level,  # type: ignore[arg-type]
            required_support=max(1, required_support),
            page_id=page_id,
            valid_until=valid_until,
            verification_status="unverified",
        )
        self._write(self.claims_dir / f"{rec.claim_id}.json", rec.to_dict())
        return rec

    def attach_support(
        self,
        claim_id: str,
        source_id: str,
        evidence_span: str,
        support_strength: float = 0.8,
    ) -> ClaimRecord:
        claim = self.get_claim(claim_id)
        if not claim:
            raise KeyError(f"unknown claim {claim_id}")
        source = self.get_source(source_id)
        if not source:
            raise KeyError(f"unknown source {source_id}")
        if source.access_status == "restricted":
            raise ValueError("Restricted sources cannot support public claims without rights clearance")
        if source.access_status not in {"available", "paywalled"}:
            raise ValueError(f"Source not usable for support: {source.access_status}")
        if not evidence_span.strip():
            raise ValueError("evidence_span required")

        claim.supporting_sources.append(
            SupportingSource(
                source_id=source_id,
                evidence_span=evidence_span.strip(),
                support_strength=max(0.0, min(1.0, support_strength)),
            )
        )
        claim.verification_status = self.verify_claim(claim).verification_status
        self._write(self.claims_dir / f"{claim.claim_id}.json", claim.to_dict())
        return claim

    def mark_contradiction(self, claim_id: str, source_id: str) -> ClaimRecord:
        claim = self.get_claim(claim_id)
        if not claim:
            raise KeyError(claim_id)
        if source_id not in claim.contradicting_sources:
            claim.contradicting_sources.append(source_id)
        claim.verification_status = "contradicted"
        self._write(self.claims_dir / f"{claim.claim_id}.json", claim.to_dict())
        return claim

    def get_claim(self, claim_id: str) -> ClaimRecord | None:
        path = self.claims_dir / f"{claim_id}.json"
        if not path.exists():
            return None
        return ClaimRecord.from_dict(json.loads(path.read_text(encoding="utf-8")))

    def list_claims(self, page_id: str | None = None) -> list[ClaimRecord]:
        claims = [
            ClaimRecord.from_dict(json.loads(p.read_text(encoding="utf-8")))
            for p in sorted(self.claims_dir.glob("*.json"))
        ]
        if page_id:
            claims = [c for c in claims if c.page_id == page_id]
        return claims

    def verify_claim(self, claim: ClaimRecord) -> ClaimRecord:
        """Deterministic verification against ledger rules (Section 5.4)."""
        if claim.contradicting_sources:
            claim.verification_status = "contradicted"
            claim.confidence = 0.0
            return claim

        usable = []
        for s in claim.supporting_sources:
            src = self.get_source(s.source_id)
            if not src:
                continue
            if src.access_status in {"available", "paywalled"} and s.support_strength >= 0.5:
                usable.append((s, src))

        if claim.claim_type == "opinion":
            claim.verification_status = "verified"
            claim.confidence = 0.6
            return claim

        if len(usable) < claim.required_support:
            claim.verification_status = "unsupported"
            claim.confidence = min(0.4, 0.2 * len(usable))
            return claim

        # stale check: if valid_until in the past
        if claim.valid_until:
            if claim.valid_until < utc_now()[:10]:
                claim.verification_status = "stale"
                claim.confidence = 0.3
                return claim

        strengths = [s.support_strength for s, _ in usable]
        claim.confidence = round(sum(strengths) / len(strengths), 3)
        claim.verification_status = "verified"
        return claim

    def reverify_all(self, page_id: str | None = None) -> list[ClaimRecord]:
        out = []
        for claim in self.list_claims(page_id=page_id):
            verified = self.verify_claim(claim)
            self._write(self.claims_dir / f"{verified.claim_id}.json", verified.to_dict())
            out.append(verified)
        return out

    def coverage_metrics(self, page_id: str | None = None) -> dict[str, float | int]:
        claims = self.reverify_all(page_id=page_id)
        critical = [c for c in claims if c.risk_level == "critical"]
        material = [c for c in claims if c.risk_level in {"medium", "high", "critical"}]
        factual = [c for c in claims if c.claim_type == "factual"]

        def rate(subset: list[ClaimRecord]) -> float:
            if not subset:
                return 1.0
            ok = sum(1 for c in subset if c.verification_status == "verified")
            return round(ok / len(subset), 4)

        return {
            "total_claims": len(claims),
            "critical_claim_support_rate": rate(critical),
            "material_claim_support_rate": rate(material),
            "factual_claim_support_rate": rate(factual),
            "unsupported_count": sum(1 for c in claims if c.verification_status == "unsupported"),
            "contradicted_count": sum(1 for c in claims if c.verification_status == "contradicted"),
            "stale_count": sum(1 for c in claims if c.verification_status == "stale"),
        }

    def hard_gate_failures(self, page_id: str | None = None) -> list[str]:
        """Section 15.2 subset for evidence integrity."""
        metrics = self.coverage_metrics(page_id=page_id)
        failures: list[str] = []
        claims = self.list_claims(page_id=page_id)
        for c in claims:
            if c.risk_level == "critical" and c.verification_status != "verified":
                failures.append(f"critical_unsupported_claim:{c.claim_id}")
            if c.verification_status == "contradicted" and c.risk_level in {"high", "critical"}:
                failures.append(f"unresolved_high_risk_contradiction:{c.claim_id}")
        for s in self.list_sources():
            if s.access_status == "fabricated":
                failures.append(f"fabricated_source:{s.source_id}")
        if metrics["critical_claim_support_rate"] < 1.0 and any(
            c.risk_level == "critical" for c in claims
        ):
            failures.append("critical_claim_support_rate_below_100")
        return failures

    @staticmethod
    def _write(path: Path, data: dict) -> None:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def seed_brand_sources(ledger: EvidenceLedger) -> list[SourceRecord]:
    """First-party sources safe for Anomaly Box product claims."""
    return [
        ledger.add_source(
            url="https://anomalybox.com/store",
            title="Anomaly Box Store — Creative Direction Dossiers",
            publisher="Anomaly Box",
            author="Anomaly Box",
            source_type="official_documentation",
            trust_score=0.95,
            primary_source=True,
            excerpt="Anomaly Box sells private creative direction dossiers; it does not guarantee virality, reach, or sales.",
            license_notes="First-party brand documentation",
        ),
        ledger.add_source(
            url="https://anomalybox.com/methodology",
            title="Anomaly Box Methodology",
            publisher="Anomaly Box",
            author="Anomaly Box",
            source_type="official_documentation",
            trust_score=0.9,
            primary_source=True,
            excerpt="Shoot-ready direction systems emphasize proof, constraints, and claim-safe language.",
        ),
    ]
