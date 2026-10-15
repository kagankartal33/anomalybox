"""
P13 — Human review queue, decisions, and audit history (Section 16 stub).

Filesystem-backed, role-aware. Double-submit protected via decision idempotency keys.
Not a full ops UI; provides the domain layer + CLI-friendly API for later dashboard wiring.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Literal

from quantum.models import new_id, utc_now

DecisionAction = Literal["approve", "reject", "edit_required", "escalate"]
ReviewerRole = Literal["editor", "senior_editor", "legal", "admin"]

ROLE_PERMISSIONS: dict[ReviewerRole, set[DecisionAction]] = {
    "editor": {"approve", "reject", "edit_required"},
    "senior_editor": {"approve", "reject", "edit_required", "escalate"},
    "legal": {"approve", "reject", "escalate"},
    "admin": {"approve", "reject", "edit_required", "escalate"},
}

RISK_ROUTING: dict[str, ReviewerRole] = {
    "low": "editor",
    "medium": "editor",
    "high": "senior_editor",
    "critical": "legal",
}


@dataclass
class ReviewItem:
    item_id: str
    page_id: str
    slug: str
    path: str
    risk_level: str
    overall_score: float
    decision_auto: str
    required_repairs: list[str]
    hard_gate_failures: list[str]
    status: str = "queued"  # queued | in_review | decided
    assigned_role: str = "editor"
    created_at: str = field(default_factory=utc_now)
    updated_at: str = field(default_factory=utc_now)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ReviewItem":
        return cls(**{k: data[k] for k in cls.__dataclass_fields__ if k in data})


@dataclass
class ReviewDecision:
    decision_id: str
    item_id: str
    slug: str
    action: DecisionAction
    actor: str
    role: ReviewerRole
    reason: str
    idempotency_key: str
    at: str = field(default_factory=utc_now)
    notes: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ReviewDecision":
        return cls(**{k: data[k] for k in cls.__dataclass_fields__ if k in data})


class HumanReviewStore:
    def __init__(self, root: Path | None = None) -> None:
        base = root or (Path(__file__).resolve().parents[1] / "quantum" / "data" / "human_review")
        self.root = base
        self.queue_dir = base / "queue"
        self.decisions_dir = base / "decisions"
        self.audit_path = base / "audit.jsonl"
        self.queue_dir.mkdir(parents=True, exist_ok=True)
        self.decisions_dir.mkdir(parents=True, exist_ok=True)

    def _item_path(self, item_id: str) -> Path:
        return self.queue_dir / f"{item_id}.json"

    def save_item(self, item: ReviewItem) -> None:
        item.updated_at = utc_now()
        self._item_path(item.item_id).write_text(
            json.dumps(item.to_dict(), indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    def get_item(self, item_id: str) -> ReviewItem | None:
        path = self._item_path(item_id)
        if not path.exists():
            return None
        return ReviewItem.from_dict(json.loads(path.read_text(encoding="utf-8")))

    def find_by_slug(self, slug: str) -> ReviewItem | None:
        for p in self.queue_dir.glob("*.json"):
            item = ReviewItem.from_dict(json.loads(p.read_text(encoding="utf-8")))
            if item.slug == slug and item.status != "decided":
                return item
        return None

    def list_queue(self, *, status: str | None = "queued") -> list[ReviewItem]:
        items: list[ReviewItem] = []
        for p in sorted(self.queue_dir.glob("*.json")):
            item = ReviewItem.from_dict(json.loads(p.read_text(encoding="utf-8")))
            if status is None or item.status == status:
                items.append(item)
        return items

    def enqueue_from_evaluation(
        self,
        eval_path: Path,
        *,
        include_decisions: set[str] | None = None,
    ) -> list[ReviewItem]:
        """Build/refresh queue from seo_package_eval.json."""
        include = include_decisions or {
            "approve_with_minor_repairs",
            "reject_score",
            "reject_hard_gate",
        }
        data = json.loads(eval_path.read_text(encoding="utf-8"))
        created: list[ReviewItem] = []
        for r in data.get("results", []):
            if r.get("decision") not in include:
                continue
            existing = self.find_by_slug(r["slug"])
            if existing:
                # refresh scores but keep queue identity
                existing.overall_score = float(r.get("overall_score") or 0)
                existing.decision_auto = r.get("decision") or existing.decision_auto
                existing.required_repairs = list(r.get("required_repairs") or [])
                existing.hard_gate_failures = list(r.get("hard_gate_failures") or [])
                self.save_item(existing)
                created.append(existing)
                continue
            risk = "medium"
            if r.get("hard_gate_failures"):
                risk = "high"
            elif r.get("decision") == "reject_score":
                risk = "medium"
            elif float(r.get("overall_score") or 0) >= 86:
                risk = "low"
            item = ReviewItem(
                item_id=new_id("rev"),
                page_id=str(r.get("page_id") or r["slug"]),
                slug=r["slug"],
                path=r.get("path") or "",
                risk_level=risk,
                overall_score=float(r.get("overall_score") or 0),
                decision_auto=r.get("decision") or "",
                required_repairs=list(r.get("required_repairs") or []),
                hard_gate_failures=list(r.get("hard_gate_failures") or []),
                assigned_role=RISK_ROUTING.get(risk, "editor"),
            )
            self.save_item(item)
            self._audit("enqueue", item.item_id, actor="system", detail=item.slug)
            created.append(item)
        return created

    def _find_decision_by_key(self, key: str) -> ReviewDecision | None:
        for p in self.decisions_dir.glob("*.json"):
            d = ReviewDecision.from_dict(json.loads(p.read_text(encoding="utf-8")))
            if d.idempotency_key == key:
                return d
        return None

    def _audit(self, event: str, item_id: str, *, actor: str, detail: str = "") -> None:
        line = {
            "at": utc_now(),
            "event": event,
            "item_id": item_id,
            "actor": actor,
            "detail": detail,
        }
        with self.audit_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(line, ensure_ascii=False) + "\n")

    def submit_decision(
        self,
        item_id: str,
        *,
        action: DecisionAction,
        actor: str,
        role: ReviewerRole,
        reason: str,
        idempotency_key: str,
        notes: str = "",
    ) -> ReviewDecision:
        if action not in ROLE_PERMISSIONS.get(role, set()):
            raise PermissionError(f"role {role} cannot {action}")

        existing = self._find_decision_by_key(idempotency_key)
        if existing:
            # double-submit protection: return original, do not mutate again
            return existing

        item = self.get_item(item_id)
        if not item:
            raise KeyError(f"unknown review item {item_id}")
        if item.status == "decided":
            raise RuntimeError(f"item {item_id} already decided (use new idempotency key only for retries of same submit)")

        decision = ReviewDecision(
            decision_id=new_id("dec"),
            item_id=item_id,
            slug=item.slug,
            action=action,
            actor=actor,
            role=role,
            reason=reason,
            idempotency_key=idempotency_key,
            notes=notes,
        )
        self.decisions_dir.joinpath(f"{decision.decision_id}.json").write_text(
            json.dumps(decision.to_dict(), indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        item.status = "decided"
        self.save_item(item)
        self._audit(
            "decision",
            item_id,
            actor=actor,
            detail=f"{action}:{role}:{reason[:120]}",
        )
        return decision

    def audit_tail(self, n: int = 50) -> list[dict[str, Any]]:
        if not self.audit_path.exists():
            return []
        lines = self.audit_path.read_text(encoding="utf-8").strip().splitlines()
        return [json.loads(x) for x in lines[-n:]]

    def export_snapshot(self) -> dict[str, Any]:
        return {
            "queued": [i.to_dict() for i in self.list_queue(status="queued")],
            "in_review": [i.to_dict() for i in self.list_queue(status="in_review")],
            "decided": [i.to_dict() for i in self.list_queue(status="decided")],
            "audit_tail": self.audit_tail(20),
            "exported_at": utc_now(),
        }
