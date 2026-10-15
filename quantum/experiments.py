"""
P15 — Experimentation framework with governance gates (Section 19).

Rejects invalid/risky experiment types; enforces pre-registered stats fields
and minimum runtime before normal stop.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Literal

from quantum.models import new_id, utc_now

ExperimentStatus = Literal[
    "draft",
    "registered",
    "running",
    "stopped",
    "aborted",
    "rejected",
]

# Section 19.1 — allowed experiment classes
VALID_EXPERIMENT_TYPES: set[str] = {
    "comparison_matrix_vs_narrative",
    "interactive_calculator_vs_static",
    "short_answer_vs_extended_opening",
    "diagram_vs_text_only",
    "internal_link_module_variant",
    "cta_placement",
    "original_data_section",
}

# Section 19.2 — hard reject
INVALID_EXPERIMENT_TYPES: set[str] = {
    "keyword_stuffing",
    "hidden_content",
    "misleading_schema",
    "mass_near_duplicate_pages",
    "random_anchor_injection",
    "fake_authorship",
    "deceptive_freshness_dates",
    "detector_evasion_styling",
}

ALLOWED_ALLOCATIONS = {"50/50", "80/20", "90/10", "33/33/34"}


@dataclass
class ExperimentRecord:
    experiment_id: str
    site_id: str
    slug: str  # page under test
    experiment_type: str
    hypothesis: str
    primary_metric: str
    guardrail_metrics: list[str] = field(default_factory=list)
    allocation: str = "50/50"
    minimum_runtime_days: int = 21
    minimum_detectable_effect: str = "pre-registered"
    sample_size_method: str = "power analysis"
    alpha: float = 0.05
    statistical_power: float = 0.80
    multiple_testing_control: str = "Benjamini-Hochberg when applicable"
    novelty_effect_window: str = "excluded or modeled"
    stopping_rule: str = "predefined; no unplanned peeking"
    segment_analysis: str = "pre-registered"
    owner: str = "growth-editorial"
    status: ExperimentStatus = "draft"
    governance_failures: list[str] = field(default_factory=list)
    created_at: str = field(default_factory=utc_now)
    registered_at: str | None = None
    started_at: str | None = None
    stopped_at: str | None = None
    outcome_notes: str = ""
    primary_metric_result: float | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ExperimentRecord":
        return cls(**{k: data[k] for k in cls.__dataclass_fields__ if k in data})


def validate_experiment_fields(
    *,
    experiment_type: str,
    hypothesis: str,
    primary_metric: str,
    guardrail_metrics: list[str],
    allocation: str,
    minimum_runtime_days: int,
    alpha: float,
    statistical_power: float,
    stopping_rule: str,
    owner: str,
) -> list[str]:
    """Return governance failure codes (empty = registerable)."""
    fails: list[str] = []
    if experiment_type in INVALID_EXPERIMENT_TYPES:
        fails.append(f"invalid_experiment_type:{experiment_type}")
    elif experiment_type not in VALID_EXPERIMENT_TYPES:
        fails.append(f"unknown_experiment_type:{experiment_type}")
    if not hypothesis or len(hypothesis.strip()) < 12:
        fails.append("weak_hypothesis")
    if not primary_metric or primary_metric.strip() in {"traffic", "word_count", "ranking_position"}:
        # Section 17.3 / 19 — do not optimise solely around vanity
        fails.append(f"disallowed_or_missing_primary_metric:{primary_metric or 'empty'}")
    if not guardrail_metrics:
        fails.append("missing_guardrail_metrics")
    if allocation not in ALLOWED_ALLOCATIONS:
        fails.append(f"invalid_allocation:{allocation}")
    if minimum_runtime_days < 7:
        fails.append(f"minimum_runtime_days_too_short:{minimum_runtime_days}")
    if not (0 < alpha <= 0.1):
        fails.append(f"alpha_out_of_range:{alpha}")
    if not (0.5 <= statistical_power <= 0.99):
        fails.append(f"statistical_power_out_of_range:{statistical_power}")
    if "unplanned" in stopping_rule.lower() and "no unplanned" not in stopping_rule.lower():
        fails.append("stopping_rule_allows_unplanned_peeking")
    if not owner:
        fails.append("missing_owner")
    return fails


def _parse_ts(ts: str) -> datetime:
    return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)


class ExperimentStore:
    def __init__(self, root: Path | None = None) -> None:
        self.root = root or (
            Path(__file__).resolve().parents[1] / "quantum" / "data" / "experiments" / "records"
        )
        self.root.mkdir(parents=True, exist_ok=True)
        self.audit_path = self.root.parent / "audit.jsonl"

    def save(self, exp: ExperimentRecord) -> None:
        path = self.root / f"{exp.experiment_id}.json"
        path.write_text(json.dumps(exp.to_dict(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    def get(self, experiment_id: str) -> ExperimentRecord | None:
        path = self.root / f"{experiment_id}.json"
        if not path.exists():
            return None
        return ExperimentRecord.from_dict(json.loads(path.read_text(encoding="utf-8")))

    def list_all(self) -> list[ExperimentRecord]:
        items = [
            ExperimentRecord.from_dict(json.loads(p.read_text(encoding="utf-8")))
            for p in self.root.glob("*.json")
        ]
        items.sort(key=lambda e: e.created_at)
        return items

    def list_for_slug(self, slug: str) -> list[ExperimentRecord]:
        return [e for e in self.list_all() if e.slug == slug]

    def audit(self, event: str, **detail: Any) -> None:
        line = {"at": utc_now(), "event": event, **detail}
        with self.audit_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(line, ensure_ascii=False) + "\n")


class ExperimentService:
    def __init__(self, store: ExperimentStore | None = None) -> None:
        self.store = store or ExperimentStore()

    def create(
        self,
        *,
        slug: str,
        experiment_type: str,
        hypothesis: str,
        primary_metric: str,
        guardrail_metrics: list[str] | None = None,
        allocation: str = "50/50",
        minimum_runtime_days: int = 21,
        alpha: float = 0.05,
        statistical_power: float = 0.80,
        owner: str = "growth-editorial",
        site_id: str = "anomalybox",
        stopping_rule: str = "predefined; no unplanned peeking",
    ) -> ExperimentRecord:
        guardrails = guardrail_metrics or ["bounce_rate", "support_contact_rate", "page_speed"]
        failures = validate_experiment_fields(
            experiment_type=experiment_type,
            hypothesis=hypothesis,
            primary_metric=primary_metric,
            guardrail_metrics=guardrails,
            allocation=allocation,
            minimum_runtime_days=minimum_runtime_days,
            alpha=alpha,
            statistical_power=statistical_power,
            stopping_rule=stopping_rule,
            owner=owner,
        )
        exp = ExperimentRecord(
            experiment_id=new_id("exp"),
            site_id=site_id,
            slug=slug,
            experiment_type=experiment_type,
            hypothesis=hypothesis,
            primary_metric=primary_metric,
            guardrail_metrics=guardrails,
            allocation=allocation,
            minimum_runtime_days=minimum_runtime_days,
            alpha=alpha,
            statistical_power=statistical_power,
            stopping_rule=stopping_rule,
            owner=owner,
            status="rejected" if failures else "draft",
            governance_failures=failures,
        )
        if not failures:
            exp.status = "registered"
            exp.registered_at = utc_now()
        self.store.save(exp)
        self.store.audit(
            "experiment_created",
            experiment_id=exp.experiment_id,
            status=exp.status,
            failures=failures,
        )
        return exp

    def start(self, experiment_id: str, *, actor: str = "system") -> ExperimentRecord:
        exp = self.store.get(experiment_id)
        if not exp:
            raise KeyError(experiment_id)
        if exp.status == "rejected":
            raise RuntimeError("cannot_start_rejected_experiment")
        if exp.status not in {"registered", "draft"}:
            raise RuntimeError(f"cannot_start_from_{exp.status}")
        if exp.governance_failures:
            raise RuntimeError("governance_failures_block_start")
        # only one running experiment per slug
        for other in self.store.list_for_slug(exp.slug):
            if other.status == "running" and other.experiment_id != exp.experiment_id:
                raise RuntimeError(f"slug_already_has_running_experiment:{other.experiment_id}")
        exp.status = "running"
        exp.started_at = utc_now()
        self.store.save(exp)
        self.store.audit("experiment_started", experiment_id=experiment_id, actor=actor)
        return exp

    def stop(
        self,
        experiment_id: str,
        *,
        actor: str = "system",
        emergency: bool = False,
        outcome_notes: str = "",
        primary_metric_result: float | None = None,
        now: datetime | None = None,
    ) -> ExperimentRecord:
        exp = self.store.get(experiment_id)
        if not exp:
            raise KeyError(experiment_id)
        if exp.status != "running":
            raise RuntimeError(f"cannot_stop_from_{exp.status}")
        if not exp.started_at:
            raise RuntimeError("missing_started_at")

        current = now or datetime.now(timezone.utc)
        started = _parse_ts(exp.started_at)
        elapsed_days = (current - started).total_seconds() / 86400.0

        if not emergency and elapsed_days < exp.minimum_runtime_days:
            raise RuntimeError(
                f"minimum_runtime_not_met:{elapsed_days:.1f}<{exp.minimum_runtime_days}"
            )

        exp.stopped_at = current.strftime("%Y-%m-%dT%H:%M:%SZ")
        exp.outcome_notes = outcome_notes
        exp.primary_metric_result = primary_metric_result
        exp.status = "aborted" if emergency else "stopped"
        self.store.save(exp)
        self.store.audit(
            "experiment_stopped",
            experiment_id=experiment_id,
            actor=actor,
            emergency=emergency,
            elapsed_days=round(elapsed_days, 2),
        )
        return exp

    def export_snapshot(self) -> dict[str, Any]:
        items = [e.to_dict() for e in self.store.list_all()]
        from collections import Counter

        return {
            "experiments": items,
            "counts": {
                "total": len(items),
                "by_status": dict(Counter(e["status"] for e in items)),
            },
            "valid_types": sorted(VALID_EXPERIMENT_TYPES),
            "invalid_types": sorted(INVALID_EXPERIMENT_TYPES),
            "exported_at": utc_now(),
        }
