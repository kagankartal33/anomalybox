"""
CI gate runner for QUANTUM SEO package checks.

Exit non-zero when:
  - render QA has any fail
  - evaluation has reject_hard_gate or reject_score
  - (optional) hard near-duplicate count > 0

Soft minor repairs do not fail CI by default (tracked for human review).
Set STRICT_APPROVE=1 to also fail when any page is not pure approve.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def run(cmd: list[str]) -> int:
    print("+", " ".join(cmd), flush=True)
    return subprocess.call(cmd, cwd=str(ROOT))


def main() -> int:
    rc = 0
    if run([sys.executable, "tools/quantum/render_qa_seo_package.py"]) != 0:
        rc = 1
    if run([sys.executable, "tools/quantum/evaluate_seo_package.py"]) != 0:
        rc = 1

    eval_path = ROOT / "quantum" / "data" / "evaluations" / "seo_package_eval.json"
    qa_path = ROOT / "quantum" / "data" / "evaluations" / "seo_package_render_qa.json"

    if not eval_path.exists() or not qa_path.exists():
        print("missing evaluation artifacts", file=sys.stderr)
        return 1

    ev = json.loads(eval_path.read_text(encoding="utf-8"))
    qa = json.loads(qa_path.read_text(encoding="utf-8"))

    hard = int(ev.get("reject_hard_gate") or 0)
    reject = int(ev.get("reject_score") or 0)
    minor = int(ev.get("approve_with_minor_repairs") or 0)
    approve = int(ev.get("approve") or 0)
    qa_fail = int(qa.get("fail") or 0)

    print(
        f"GATE summary: approve={approve} minor={minor} reject_score={reject} "
        f"hard={hard} render_fail={qa_fail} avg={ev.get('avg_score')}"
    )

    if qa_fail > 0:
        print(f"FAIL: render QA failures={qa_fail}", file=sys.stderr)
        rc = 1
    if hard > 0:
        print(f"FAIL: hard gate rejects={hard}", file=sys.stderr)
        rc = 1
    if reject > 0:
        print(f"FAIL: score rejects={reject}", file=sys.stderr)
        rc = 1

    if os.environ.get("STRICT_APPROVE", "").strip() in {"1", "true", "yes"}:
        if minor > 0 or approve < int(ev.get("count") or 0):
            print(f"FAIL: STRICT_APPROVE minor={minor}", file=sys.stderr)
            rc = 1

    # near-dup hard inside required_repairs / hard_gate_failures
    near_hard = 0
    for r in ev.get("results") or []:
        for f in r.get("hard_gate_failures") or []:
            if "near_duplicate" in f and "warn" not in f:
                near_hard += 1
    if near_hard:
        print(f"FAIL: hard near-duplicate flags={near_hard}", file=sys.stderr)
        rc = 1

    if rc == 0:
        print("PASS: SEO CI gates")
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
