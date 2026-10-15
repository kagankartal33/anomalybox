"""P15 experiment governance + runtime tests."""
from __future__ import annotations

import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from quantum.experiments import (  # noqa: E402
    ExperimentService,
    ExperimentStore,
    validate_experiment_fields,
)


class ExperimentGovernanceTests(unittest.TestCase):
    def test_reject_keyword_stuffing(self) -> None:
        fails = validate_experiment_fields(
            experiment_type="keyword_stuffing",
            hypothesis="Stuff keywords to rank higher in search results",
            primary_metric="qualified_trial_start_rate",
            guardrail_metrics=["bounce_rate"],
            allocation="50/50",
            minimum_runtime_days=21,
            alpha=0.05,
            statistical_power=0.8,
            stopping_rule="predefined; no unplanned peeking",
            owner="growth",
        )
        self.assertTrue(any("invalid_experiment_type" in f for f in fails))

    def test_reject_traffic_only_metric(self) -> None:
        fails = validate_experiment_fields(
            experiment_type="cta_placement",
            hypothesis="Moving CTA improves qualified starts",
            primary_metric="traffic",
            guardrail_metrics=["bounce_rate"],
            allocation="50/50",
            minimum_runtime_days=21,
            alpha=0.05,
            statistical_power=0.8,
            stopping_rule="predefined; no unplanned peeking",
            owner="growth",
        )
        self.assertTrue(any("primary_metric" in f for f in fails))

    def test_valid_passes(self) -> None:
        fails = validate_experiment_fields(
            experiment_type="cta_placement",
            hypothesis="CTA above fold improves qualified trial starts",
            primary_metric="qualified_trial_start_rate",
            guardrail_metrics=["bounce_rate", "page_speed"],
            allocation="50/50",
            minimum_runtime_days=21,
            alpha=0.05,
            statistical_power=0.8,
            stopping_rule="predefined; no unplanned peeking",
            owner="growth-editorial",
        )
        self.assertEqual(fails, [])


class ExperimentServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.svc = ExperimentService(store=ExperimentStore(root=Path(self.tmp.name)))

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_create_registers_valid(self) -> None:
        exp = self.svc.create(
            slug="demo-page",
            experiment_type="diagram_vs_text_only",
            hypothesis="Diagram improves task completion versus text only",
            primary_metric="task_completion_rate",
        )
        self.assertEqual(exp.status, "registered")
        self.assertEqual(exp.governance_failures, [])

    def test_create_rejects_invalid(self) -> None:
        exp = self.svc.create(
            slug="demo-page",
            experiment_type="hidden_content",
            hypothesis="Hide extra keywords for ranking gains over baseline",
            primary_metric="qualified_trial_start_rate",
        )
        self.assertEqual(exp.status, "rejected")
        self.assertTrue(exp.governance_failures)

    def test_start_and_early_stop_blocked(self) -> None:
        exp = self.svc.create(
            slug="demo-page",
            experiment_type="cta_placement",
            hypothesis="CTA mid-page improves qualified trial starts",
            primary_metric="qualified_trial_start_rate",
            minimum_runtime_days=21,
        )
        exp = self.svc.start(exp.experiment_id, actor="ed")
        self.assertEqual(exp.status, "running")
        with self.assertRaises(RuntimeError) as ctx:
            self.svc.stop(exp.experiment_id, actor="ed")
        self.assertIn("minimum_runtime_not_met", str(ctx.exception))

    def test_emergency_stop_allowed(self) -> None:
        exp = self.svc.create(
            slug="demo-page",
            experiment_type="internal_link_module_variant",
            hypothesis="Related guides module improves qualified navigation",
            primary_metric="qualified_internal_click_rate",
        )
        self.svc.start(exp.experiment_id, actor="ed")
        stopped = self.svc.stop(
            exp.experiment_id,
            actor="ed",
            emergency=True,
            outcome_notes="guardrail breach",
        )
        self.assertEqual(stopped.status, "aborted")

    def test_stop_after_min_runtime(self) -> None:
        exp = self.svc.create(
            slug="demo-page",
            experiment_type="short_answer_vs_extended_opening",
            hypothesis="Short direct answer improves task completion rate",
            primary_metric="task_completion_rate",
            minimum_runtime_days=21,
        )
        exp = self.svc.start(exp.experiment_id, actor="ed")
        # simulate started 30 days ago
        exp.started_at = (datetime.now(timezone.utc) - timedelta(days=30)).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        )
        self.svc.store.save(exp)
        stopped = self.svc.stop(
            exp.experiment_id,
            actor="ed",
            outcome_notes="winner short answer",
            primary_metric_result=0.12,
        )
        self.assertEqual(stopped.status, "stopped")
        self.assertEqual(stopped.primary_metric_result, 0.12)

    def test_one_running_per_slug(self) -> None:
        a = self.svc.create(
            slug="same",
            experiment_type="cta_placement",
            hypothesis="Variant A improves qualified trial starts",
            primary_metric="qualified_trial_start_rate",
        )
        b = self.svc.create(
            slug="same",
            experiment_type="diagram_vs_text_only",
            hypothesis="Variant B diagram improves task completion",
            primary_metric="task_completion_rate",
        )
        self.svc.start(a.experiment_id, actor="ed")
        with self.assertRaises(RuntimeError):
            self.svc.start(b.experiment_id, actor="ed")


if __name__ == "__main__":
    unittest.main()
