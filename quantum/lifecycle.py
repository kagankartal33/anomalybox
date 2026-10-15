"""
P15 — Content lifecycle: refresh decision tree, merge, redirect, retire (Section 18).

Filesystem-backed; optional CMS unpublish on retire/redirect.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Literal

from quantum.models import new_id, utc_now

RefreshTrigger = Literal[
    "source_change",
    "product_release",
    "price_change",
    "policy_change",
    "intent_shift",
    "traffic_decline",
    "conversion_decline",
    "broken_source",
    "contradictory_evidence",
    "competitor_shift",
    "user_feedback",
    "scheduled_freshness",
    "overlap_detected",
    "manual",
]

LifecycleAction = Literal[
    "keep_monitor",
    "improve_utility",
    "refresh_evidence",
    "rebrief_or_split",
    "merge",
    "redirect",
    "retire",
]

VALID_TRIGGERS: set[str] = {
    "source_change",
    "product_release",
    "price_change",
    "policy_change",
    "intent_shift",
    "traffic_decline",
    "conversion_decline",
    "broken_source",
    "contradictory_evidence",
    "competitor_shift",
    "user_feedback",
    "scheduled_freshness",
    "overlap_detected",
    "manual",
}


@dataclass
class LifecycleSignals:
    """Inputs to the Section 18.2 decision tree."""

    still_useful: bool = True
    core_intent_unchanged: bool = True
    facts_stale: bool = False
    performance_weak_due_to_overlap: bool = False
    triggers: list[str] = field(default_factory=list)
    notes: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "LifecycleSignals":
        return cls(**{k: data[k] for k in cls.__dataclass_fields__ if k in data})


@dataclass
class LifecycleDecision:
    action: LifecycleAction
    reason: str
    triggers: list[str] = field(default_factory=list)
    requires_human: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class LifecycleRecord:
    record_id: str
    site_id: str
    slug: str
    path: str
    action: LifecycleAction
    status: str  # decided | applied | failed
    reason: str
    triggers: list[str] = field(default_factory=list)
    signals: dict[str, Any] = field(default_factory=dict)
    target_slug: str | None = None  # merge/redirect target
    redirect_path: str | None = None
    actor: str = "system"
    created_at: str = field(default_factory=utc_now)
    applied_at: str | None = None
    error: str = ""
    requires_human: bool = False
    related_publication_id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "LifecycleRecord":
        return cls(**{k: data[k] for k in cls.__dataclass_fields__ if k in data})


def decide_lifecycle(signals: LifecycleSignals) -> LifecycleDecision:
    """
    Section 18.2 refresh decision tree (deterministic).

    Is the page still useful?
      No  -> retire (or redirect if overlap/intent shift with a target later)
      Yes -> core intent unchanged?
              No  -> rebrief_or_split
              Yes -> facts stale?
                      Yes -> refresh_evidence
                      No  -> performance weak due to overlap?
                              Yes -> merge
                              No  -> improve_utility (or keep_monitor if no stress triggers)
    """
    bad_triggers = [t for t in signals.triggers if t not in VALID_TRIGGERS]
    triggers = [t for t in signals.triggers if t in VALID_TRIGGERS]

    if not signals.still_useful:
        # Prefer redirect language when intent/overlap implies a successor exists
        if "intent_shift" in triggers or "overlap_detected" in triggers:
            return LifecycleDecision(
                action="redirect",
                reason="page_no_longer_useful_with_successor_signal",
                triggers=triggers,
                requires_human=True,
            )
        return LifecycleDecision(
            action="retire",
            reason="page_no_longer_useful",
            triggers=triggers,
            requires_human=True,
        )

    if not signals.core_intent_unchanged:
        return LifecycleDecision(
            action="rebrief_or_split",
            reason="core_intent_changed",
            triggers=triggers,
            requires_human=True,
        )

    freshness_triggers = {
        "source_change",
        "product_release",
        "price_change",
        "policy_change",
        "broken_source",
        "contradictory_evidence",
        "scheduled_freshness",
    }
    if signals.facts_stale or any(t in triggers for t in freshness_triggers):
        return LifecycleDecision(
            action="refresh_evidence",
            reason="facts_stale_or_freshness_trigger",
            triggers=triggers,
            requires_human=False,
        )

    if signals.performance_weak_due_to_overlap or "overlap_detected" in triggers:
        return LifecycleDecision(
            action="merge",
            reason="performance_weak_due_to_overlap",
            triggers=triggers,
            requires_human=True,
        )

    stress = any(
        t in triggers
        for t in ("traffic_decline", "conversion_decline", "user_feedback", "competitor_shift")
    )
    if stress:
        return LifecycleDecision(
            action="improve_utility",
            reason="performance_or_feedback_without_stale_facts",
            triggers=triggers,
            requires_human=False,
        )

    reason = "stable_monitor"
    if bad_triggers:
        reason = f"stable_monitor_ignored_unknown_triggers:{','.join(bad_triggers)}"
    return LifecycleDecision(
        action="keep_monitor",
        reason=reason,
        triggers=triggers,
        requires_human=False,
    )


class LifecycleStore:
    def __init__(self, root: Path | None = None) -> None:
        self.root = root or (
            Path(__file__).resolve().parents[1] / "quantum" / "data" / "lifecycle" / "records"
        )
        self.root.mkdir(parents=True, exist_ok=True)
        self.audit_path = self.root.parent / "audit.jsonl"

    def save(self, rec: LifecycleRecord) -> None:
        path = self.root / f"{rec.record_id}.json"
        path.write_text(json.dumps(rec.to_dict(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    def get(self, record_id: str) -> LifecycleRecord | None:
        path = self.root / f"{record_id}.json"
        if not path.exists():
            return None
        return LifecycleRecord.from_dict(json.loads(path.read_text(encoding="utf-8")))

    def list_for_slug(self, slug: str) -> list[LifecycleRecord]:
        out: list[LifecycleRecord] = []
        for p in self.root.glob("*.json"):
            rec = LifecycleRecord.from_dict(json.loads(p.read_text(encoding="utf-8")))
            if rec.slug == slug:
                out.append(rec)
        out.sort(key=lambda r: r.created_at)
        return out

    def list_all(self) -> list[LifecycleRecord]:
        out = [
            LifecycleRecord.from_dict(json.loads(p.read_text(encoding="utf-8")))
            for p in self.root.glob("*.json")
        ]
        out.sort(key=lambda r: r.created_at)
        return out

    def audit(self, event: str, **detail: Any) -> None:
        line = {"at": utc_now(), "event": event, **detail}
        with self.audit_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(line, ensure_ascii=False) + "\n")


class LifecycleService:
    def __init__(
        self,
        store: LifecycleStore | None = None,
        *,
        cms: Any | None = None,
    ) -> None:
        self.store = store or LifecycleStore()
        self.cms = cms  # optional MockCmsAdapter / CmsAdapter

    def evaluate(
        self,
        *,
        slug: str,
        path: str,
        signals: LifecycleSignals,
        site_id: str = "anomalybox",
        actor: str = "system",
        target_slug: str | None = None,
        redirect_path: str | None = None,
    ) -> LifecycleRecord:
        decision = decide_lifecycle(signals)
        rec = LifecycleRecord(
            record_id=new_id("life"),
            site_id=site_id,
            slug=slug,
            path=path if path.startswith("/") else f"/{path}",
            action=decision.action,
            status="decided",
            reason=decision.reason,
            triggers=list(decision.triggers),
            signals=signals.to_dict(),
            target_slug=target_slug,
            redirect_path=redirect_path,
            actor=actor,
            requires_human=decision.requires_human,
        )
        # governance: merge/redirect need a target before apply
        if rec.action in {"merge", "redirect"} and not (target_slug or redirect_path):
            rec.requires_human = True
        self.store.save(rec)
        self.store.audit(
            "lifecycle_decided",
            record_id=rec.record_id,
            slug=slug,
            action=rec.action,
            actor=actor,
        )
        return rec

    def apply(self, record_id: str, *, actor: str = "system") -> LifecycleRecord:
        rec = self.store.get(record_id)
        if not rec:
            raise KeyError(record_id)
        if rec.status == "applied":
            return rec

        if rec.action in {"merge", "redirect"}:
            if not rec.target_slug and not rec.redirect_path:
                rec.status = "failed"
                rec.error = "missing_merge_or_redirect_target"
                self.store.save(rec)
                self.store.audit("lifecycle_failed", record_id=record_id, error=rec.error)
                return rec

        if rec.action in {"retire", "redirect", "merge"} and self.cms is not None:
            # unpublish source path in mock CMS (idempotent)
            try:
                key = f"{rec.site_id}:{rec.path}:lifecycle:{rec.action}:{rec.record_id}"
                result = self.cms.unpublish(
                    site_id=rec.site_id,
                    path=rec.path,
                    idempotency_key=key,
                )
                if not result.ok:
                    rec.status = "failed"
                    rec.error = result.error or "cms_unpublish_failed"
                    self.store.save(rec)
                    self.store.audit("lifecycle_failed", record_id=record_id, error=rec.error)
                    return rec
            except Exception as exc:  # noqa: BLE001 — surface as failed record
                rec.status = "failed"
                rec.error = f"cms_error:{exc}"
                self.store.save(rec)
                return rec

        rec.status = "applied"
        rec.applied_at = utc_now()
        rec.actor = actor
        rec.error = ""
        self.store.save(rec)
        self.store.audit(
            "lifecycle_applied",
            record_id=record_id,
            action=rec.action,
            actor=actor,
            target=rec.target_slug or rec.redirect_path,
        )
        return rec

    def evaluate_and_apply(
        self,
        *,
        slug: str,
        path: str,
        signals: LifecycleSignals,
        site_id: str = "anomalybox",
        actor: str = "system",
        target_slug: str | None = None,
        redirect_path: str | None = None,
        auto_apply_safe: bool = True,
    ) -> LifecycleRecord:
        rec = self.evaluate(
            slug=slug,
            path=path,
            signals=signals,
            site_id=site_id,
            actor=actor,
            target_slug=target_slug,
            redirect_path=redirect_path,
        )
        # Safe auto-apply: keep/improve/refresh without human; human actions stay decided
        if auto_apply_safe and not rec.requires_human and rec.action in {
            "keep_monitor",
            "improve_utility",
            "refresh_evidence",
        }:
            return self.apply(rec.record_id, actor=actor)
        return rec

    def export_snapshot(self) -> dict[str, Any]:
        records = [r.to_dict() for r in self.store.list_all()]
        from collections import Counter

        actions = Counter(r["action"] for r in records)
        statuses = Counter(r["status"] for r in records)
        return {
            "records": records,
            "counts": {"total": len(records), "by_action": dict(actions), "by_status": dict(statuses)},
            "exported_at": utc_now(),
        }
