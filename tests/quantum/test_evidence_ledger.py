"""Unit tests for QUANTUM Evidence Ledger (P07-T001)."""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from quantum.evidence_ledger import EvidenceLedger  # noqa: E402


class EvidenceLedgerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.ledger = EvidenceLedger(root=Path(self.tmp.name))

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_add_source_and_support_claim(self) -> None:
        src = self.ledger.add_source(
            url="https://example.org/docs",
            title="Example Docs",
            publisher="Example",
            excerpt="Feature X is available in plan Pro.",
            trust_score=0.9,
            primary_source=True,
        )
        claim = self.ledger.add_claim(
            statement="Feature X is available in plan Pro.",
            claim_type="factual",
            risk_level="medium",
            required_support=1,
            page_id="page1",
        )
        claim = self.ledger.attach_support(claim.claim_id, src.source_id, "Feature X is available in plan Pro.")
        self.assertEqual(claim.verification_status, "verified")
        metrics = self.ledger.coverage_metrics("page1")
        self.assertEqual(metrics["unsupported_count"], 0)
        self.assertEqual(self.ledger.hard_gate_failures("page1"), [])

    def test_unsupported_critical_claim_hard_gate(self) -> None:
        claim = self.ledger.add_claim(
            statement="This product cures disease.",
            claim_type="factual",
            risk_level="critical",
            required_support=2,
            page_id="page2",
        )
        verified = self.ledger.verify_claim(claim)
        self.assertEqual(verified.verification_status, "unsupported")
        failures = self.ledger.hard_gate_failures("page2")
        self.assertTrue(any("critical" in f for f in failures))

    def test_fabricated_source_rejected(self) -> None:
        with self.assertRaises(ValueError):
            self.ledger.add_source(
                url="https://fake.example",
                title="Fake",
                publisher="Nobody",
                access_status="fabricated",
            )

    def test_contradiction_blocks_verification(self) -> None:
        src = self.ledger.add_source(
            url="https://example.org/a",
            title="A",
            publisher="A",
            excerpt="yes",
        )
        claim = self.ledger.add_claim(statement="Claim", page_id="p3", required_support=1)
        self.ledger.attach_support(claim.claim_id, src.source_id, "yes")
        claim = self.ledger.mark_contradiction(claim.claim_id, src.source_id)
        self.assertEqual(claim.verification_status, "contradicted")


if __name__ == "__main__":
    unittest.main()
