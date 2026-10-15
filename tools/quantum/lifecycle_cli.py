"""
P15 CLI — lifecycle decisions + experiments.

Examples:
  python tools/quantum/lifecycle_cli.py decide --slug x --path /x --useful 0
  python tools/quantum/lifecycle_cli.py decide --slug x --path /x --stale 1 --apply
  python tools/quantum/lifecycle_cli.py apply --record-id life_…
  python tools/quantum/lifecycle_cli.py exp-create --slug x --type cta_placement --hypothesis "…" --metric qualified_trial_start_rate
  python tools/quantum/lifecycle_cli.py exp-start --id exp_…
  python tools/quantum/lifecycle_cli.py exp-stop --id exp_… --emergency
  python tools/quantum/lifecycle_cli.py scan-eval --limit 10
  python tools/quantum/lifecycle_cli.py export
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from quantum.cms_adapter import MockCmsAdapter  # noqa: E402
from quantum.experiments import ExperimentService, VALID_EXPERIMENT_TYPES  # noqa: E402
from quantum.lifecycle import LifecycleService, LifecycleSignals  # noqa: E402

EVAL = ROOT / "quantum" / "data" / "evaluations" / "seo_package_eval.json"
REG = ROOT / "lib" / "seo-package-registry.json"
LIFE_SNAP = ROOT / "quantum" / "data" / "lifecycle" / "snapshot.json"
EXP_SNAP = ROOT / "quantum" / "data" / "experiments" / "snapshot.json"


def _life() -> LifecycleService:
    return LifecycleService(cms=MockCmsAdapter())


def _exp() -> ExperimentService:
    return ExperimentService()


def cmd_decide(args: argparse.Namespace) -> int:
    triggers = [t.strip() for t in (args.triggers or "").split(",") if t.strip()]
    signals = LifecycleSignals(
        still_useful=not args.not_useful,
        core_intent_unchanged=not args.intent_changed,
        facts_stale=bool(args.stale),
        performance_weak_due_to_overlap=bool(args.overlap),
        triggers=triggers,
        notes=args.notes or "",
    )
    svc = _life()
    if args.apply:
        rec = svc.evaluate_and_apply(
            slug=args.slug,
            path=args.path,
            signals=signals,
            actor=args.actor,
            target_slug=args.target_slug or None,
            redirect_path=args.redirect_path or None,
            auto_apply_safe=True,
        )
    else:
        rec = svc.evaluate(
            slug=args.slug,
            path=args.path,
            signals=signals,
            actor=args.actor,
            target_slug=args.target_slug or None,
            redirect_path=args.redirect_path or None,
        )
    print(json.dumps(rec.to_dict(), indent=2, ensure_ascii=False))
    return 0


def cmd_apply(args: argparse.Namespace) -> int:
    rec = _life().apply(args.record_id, actor=args.actor)
    print(json.dumps(rec.to_dict(), indent=2, ensure_ascii=False))
    return 0 if rec.status == "applied" else 1


def cmd_list_life(args: argparse.Namespace) -> int:
    svc = _life()
    items = svc.store.list_for_slug(args.slug) if args.slug else svc.store.list_all()
    for r in items:
        print(
            f"{r.record_id}\t{r.status}\t{r.action}\t{r.slug}\t"
            f"human={r.requires_human}\t{r.reason}"
        )
    print(f"count={len(items)}")
    return 0


def cmd_exp_create(args: argparse.Namespace) -> int:
    guardrails = [g.strip() for g in (args.guardrails or "").split(",") if g.strip()]
    exp = _exp().create(
        slug=args.slug,
        experiment_type=args.type,
        hypothesis=args.hypothesis,
        primary_metric=args.metric,
        guardrail_metrics=guardrails or None,
        allocation=args.allocation,
        minimum_runtime_days=args.min_days,
        owner=args.owner,
    )
    print(json.dumps(exp.to_dict(), indent=2, ensure_ascii=False))
    return 0 if exp.status != "rejected" else 2


def cmd_exp_start(args: argparse.Namespace) -> int:
    try:
        exp = _exp().start(args.id, actor=args.actor)
    except (KeyError, RuntimeError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    print(json.dumps(exp.to_dict(), indent=2, ensure_ascii=False))
    return 0


def cmd_exp_stop(args: argparse.Namespace) -> int:
    try:
        exp = _exp().stop(
            args.id,
            actor=args.actor,
            emergency=bool(args.emergency),
            outcome_notes=args.notes or "",
            primary_metric_result=args.result,
        )
    except (KeyError, RuntimeError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    print(json.dumps(exp.to_dict(), indent=2, ensure_ascii=False))
    return 0


def cmd_exp_list(args: argparse.Namespace) -> int:
    items = _exp().store.list_for_slug(args.slug) if args.slug else _exp().store.list_all()
    for e in items:
        print(
            f"{e.experiment_id}\t{e.status}\t{e.experiment_type}\t{e.slug}\t"
            f"fails={len(e.governance_failures)}"
        )
    print(f"count={len(items)}")
    return 0


def cmd_scan_eval(args: argparse.Namespace) -> int:
    """Seed lifecycle decisions from evaluation soft signals (demo scan)."""
    if not EVAL.exists():
        print("error: evaluation missing", file=sys.stderr)
        return 2
    pages = {}
    if REG.exists():
        pages = {p["slug"]: p for p in json.loads(REG.read_text(encoding="utf-8")).get("pages", [])}
    results = json.loads(EVAL.read_text(encoding="utf-8")).get("results", [])
    svc = _life()
    n = 0
    for r in results:
        repairs = r.get("required_repairs") or []
        hard = r.get("hard_gate_failures") or []
        score = float(r.get("overall_score") or 0)
        signals = None
        if hard or r.get("decision") in {"reject_score", "reject_hard_gate"}:
            signals = LifecycleSignals(
                still_useful=True,
                facts_stale=True,
                triggers=["contradictory_evidence", "manual"],
                notes="scan: hard/reject evaluation",
            )
        elif any("near_duplicate" in x for x in repairs):
            signals = LifecycleSignals(
                still_useful=True,
                performance_weak_due_to_overlap=True,
                triggers=["overlap_detected"],
                notes="scan: near-dup warn",
            )
        elif score < 84:
            signals = LifecycleSignals(
                still_useful=True,
                triggers=["traffic_decline", "manual"],
                notes="scan: low score band",
            )
        if not signals:
            continue
        slug = r["slug"]
        path = (pages.get(slug) or {}).get("path") or r.get("path") or f"/{slug}"
        rec = svc.evaluate_and_apply(
            slug=slug,
            path=path,
            signals=signals,
            actor="scan-eval",
            auto_apply_safe=True,
        )
        print(f"{rec.action}\t{rec.status}\t{slug}\t{rec.reason}")
        n += 1
        if args.limit and n >= args.limit:
            break
    print(f"scanned_decisions={n}")
    return 0


def cmd_export(args: argparse.Namespace) -> int:
    life = _life().export_snapshot()
    exp = _exp().export_snapshot()
    LIFE_SNAP.parent.mkdir(parents=True, exist_ok=True)
    EXP_SNAP.parent.mkdir(parents=True, exist_ok=True)
    LIFE_SNAP.write_text(json.dumps(life, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    EXP_SNAP.write_text(json.dumps(exp, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"lifecycle → {LIFE_SNAP} counts={life['counts']}")
    print(f"experiments → {EXP_SNAP} counts={exp['counts']}")
    return 0


def cmd_types(_: argparse.Namespace) -> int:
    print("valid:")
    for t in sorted(VALID_EXPERIMENT_TYPES):
        print(f"  {t}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="P15 lifecycle + experiments CLI")
    sub = ap.add_subparsers(dest="cmd", required=True)

    d = sub.add_parser("decide", help="Run lifecycle decision tree")
    d.add_argument("--slug", required=True)
    d.add_argument("--path", required=True)
    d.add_argument("--not-useful", action="store_true")
    d.add_argument("--intent-changed", action="store_true")
    d.add_argument("--stale", action="store_true")
    d.add_argument("--overlap", action="store_true")
    d.add_argument("--triggers", default="", help="comma-separated trigger ids")
    d.add_argument("--target-slug", default="")
    d.add_argument("--redirect-path", default="")
    d.add_argument("--notes", default="")
    d.add_argument("--apply", action="store_true", help="auto-apply safe actions")
    d.add_argument("--actor", default="cli")
    d.set_defaults(func=cmd_decide)

    a = sub.add_parser("apply", help="Apply a decided lifecycle record")
    a.add_argument("--record-id", required=True)
    a.add_argument("--actor", default="cli")
    a.set_defaults(func=cmd_apply)

    ll = sub.add_parser("list", help="List lifecycle records")
    ll.add_argument("--slug", default="")
    ll.set_defaults(func=cmd_list_life)

    ec = sub.add_parser("exp-create", help="Register experiment (or reject by governance)")
    ec.add_argument("--slug", required=True)
    ec.add_argument("--type", required=True)
    ec.add_argument("--hypothesis", required=True)
    ec.add_argument("--metric", required=True)
    ec.add_argument("--guardrails", default="")
    ec.add_argument("--allocation", default="50/50")
    ec.add_argument("--min-days", type=int, default=21)
    ec.add_argument("--owner", default="growth-editorial")
    ec.set_defaults(func=cmd_exp_create)

    es = sub.add_parser("exp-start", help="Start a registered experiment")
    es.add_argument("--id", required=True)
    es.add_argument("--actor", default="cli")
    es.set_defaults(func=cmd_exp_start)

    est = sub.add_parser("exp-stop", help="Stop running experiment")
    est.add_argument("--id", required=True)
    est.add_argument("--emergency", action="store_true")
    est.add_argument("--notes", default="")
    est.add_argument("--result", type=float, default=None)
    est.add_argument("--actor", default="cli")
    est.set_defaults(func=cmd_exp_stop)

    el = sub.add_parser("exp-list", help="List experiments")
    el.add_argument("--slug", default="")
    el.set_defaults(func=cmd_exp_list)

    sc = sub.add_parser("scan-eval", help="Seed decisions from SEO evaluation")
    sc.add_argument("--limit", type=int, default=20)
    sc.set_defaults(func=cmd_scan_eval)

    sub.add_parser("exp-types", help="List valid experiment types").set_defaults(func=cmd_types)
    sub.add_parser("export", help="Export lifecycle + experiment snapshots").set_defaults(func=cmd_export)

    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
