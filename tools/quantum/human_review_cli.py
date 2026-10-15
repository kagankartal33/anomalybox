"""
P13 CLI — build review queue from evaluation, list, decide, export snapshot.

Examples:
  python tools/quantum/human_review_cli.py build-queue
  python tools/quantum/human_review_cli.py list
  python tools/quantum/human_review_cli.py decide --item-id rev_xxx --action approve --actor alice --role editor --reason "score ok" --key k1
  python tools/quantum/human_review_cli.py export
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from quantum.human_review import HumanReviewStore  # noqa: E402

EVAL = ROOT / "quantum" / "data" / "evaluations" / "seo_package_eval.json"
SNAP = ROOT / "quantum" / "data" / "human_review" / "queue_snapshot.json"


def cmd_build(args: argparse.Namespace) -> int:
    store = HumanReviewStore()
    items = store.enqueue_from_evaluation(Path(args.eval) if args.eval else EVAL)
    print(f"queue size (touched)={len(items)} open={len(store.list_queue(status='queued'))}")
    return 0


def cmd_list(args: argparse.Namespace) -> int:
    store = HumanReviewStore()
    items = store.list_queue(status=args.status if args.status != "all" else None)
    for i in items:
        print(
            f"{i.item_id}\t{i.status}\t{i.risk_level}\t{i.overall_score:.1f}\t"
            f"{i.decision_auto}\t{i.slug}\trepairs={len(i.required_repairs)}"
        )
    print(f"count={len(items)}")
    return 0


def cmd_decide(args: argparse.Namespace) -> int:
    store = HumanReviewStore()
    try:
        d = store.submit_decision(
            args.item_id,
            action=args.action,
            actor=args.actor,
            role=args.role,
            reason=args.reason,
            idempotency_key=args.key,
            notes=args.notes or "",
        )
    except (PermissionError, KeyError, RuntimeError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    print(json.dumps(d.to_dict(), indent=2))
    return 0


def cmd_export(args: argparse.Namespace) -> int:
    store = HumanReviewStore()
    snap = store.export_snapshot()
    out = Path(args.out) if args.out else SNAP
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(snap, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"exported → {out} queued={len(snap['queued'])} decided={len(snap['decided'])}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="P13 human review CLI")
    sub = ap.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("build-queue", help="Enqueue pages from evaluation JSON")
    b.add_argument("--eval", default=str(EVAL))
    b.set_defaults(func=cmd_build)

    l = sub.add_parser("list", help="List review items")
    l.add_argument("--status", default="queued", choices=["queued", "in_review", "decided", "all"])
    l.set_defaults(func=cmd_list)

    d = sub.add_parser("decide", help="Record a review decision")
    d.add_argument("--item-id", required=True)
    d.add_argument("--action", required=True, choices=["approve", "reject", "edit_required", "escalate"])
    d.add_argument("--actor", required=True)
    d.add_argument("--role", required=True, choices=["editor", "senior_editor", "legal", "admin"])
    d.add_argument("--reason", required=True)
    d.add_argument("--key", required=True, help="Idempotency key (double-submit safe)")
    d.add_argument("--notes", default="")
    d.set_defaults(func=cmd_decide)

    e = sub.add_parser("export", help="Export queue snapshot JSON")
    e.add_argument("--out", default=str(SNAP))
    e.set_defaults(func=cmd_export)

    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
