"""
P14 CLI — create version, publish, read-back, rollback, batch from SEO package.

Examples:
  python tools/quantum/publish_cli.py create --slug demo --path /x/demo --title Demo --body-file content/seo-package/demo.md
  python tools/quantum/publish_cli.py publish --version-id ver_...
  python tools/quantum/publish_cli.py read-back --publication-id pub_...
  python tools/quantum/publish_cli.py rollback --slug demo
  python tools/quantum/publish_cli.py batch-approved --limit 5
  python tools/quantum/publish_cli.py export
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from quantum.publish import PublishService  # noqa: E402

EVAL = ROOT / "quantum" / "data" / "evaluations" / "seo_package_eval.json"
REG = ROOT / "lib" / "seo-package-registry.json"
CONTENT = ROOT / "content" / "seo-package"
SNAP = ROOT / "quantum" / "data" / "publish" / "snapshot.json"


def _svc() -> PublishService:
    return PublishService()


def cmd_create(args: argparse.Namespace) -> int:
    body = Path(args.body_file).read_text(encoding="utf-8") if args.body_file else (args.body or "")
    if not body:
        print("error: provide --body or --body-file", file=sys.stderr)
        return 2
    v = _svc().create_version(
        slug=args.slug,
        path=args.path,
        title=args.title,
        body=body,
        page_id=args.page_id or args.slug,
        change_summary=args.summary or "",
        created_by=args.actor,
    )
    print(json.dumps(v.to_dict(), indent=2, ensure_ascii=False))
    return 0


def cmd_publish(args: argparse.Namespace) -> int:
    rec = _svc().publish(args.version_id, actor=args.actor)
    print(json.dumps(rec.to_dict(), indent=2, ensure_ascii=False))
    return 0 if rec.status == "published" and rec.read_back_ok else 1


def cmd_read_back(args: argparse.Namespace) -> int:
    rec = _svc().verify_read_back(args.publication_id)
    print(json.dumps(rec.to_dict(), indent=2, ensure_ascii=False))
    return 0 if rec.read_back_ok else 1


def cmd_rollback(args: argparse.Namespace) -> int:
    try:
        rec = _svc().rollback(
            args.slug,
            actor=args.actor,
            target_version_id=args.version_id,
        )
    except (KeyError, RuntimeError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    print(json.dumps(rec.to_dict(), indent=2, ensure_ascii=False))
    return 0 if rec.status == "published" and rec.read_back_ok else 1


def cmd_list(args: argparse.Namespace) -> int:
    from quantum.publish import ContentVersion, PublicationRecord

    svc = _svc()
    if args.what == "versions":
        if args.slug:
            items = svc.versions.list_for_slug(args.slug)
        else:
            items = [
                ContentVersion.from_dict(json.loads(p.read_text(encoding="utf-8")))
                for p in sorted(svc.versions.root.glob("*.json"))
            ]
        for v in items:
            print(
                f"{v.version_id}\tv{v.content_version}\t{v.slug}\t"
                f"{v.content_hash[:18]}…\t{v.created_at}"
            )
    else:
        if args.slug:
            items = svc.publications.list_for_slug(args.slug)
        else:
            items = [
                PublicationRecord.from_dict(json.loads(p.read_text(encoding="utf-8")))
                for p in sorted(svc.publications.root.glob("*.json"))
            ]
        for r in items:
            print(
                f"{r.publication_id}\t{r.status}\trb={r.read_back_ok}\t"
                f"v{r.content_version}\t{r.slug}\t{r.idempotency_key}"
            )
    return 0


def cmd_batch_approved(args: argparse.Namespace) -> int:
    """Create version + publish for approved SEO package pages (mock CMS)."""
    if not EVAL.exists() or not REG.exists():
        print("error: evaluation or registry missing", file=sys.stderr)
        return 2
    ev = json.loads(EVAL.read_text(encoding="utf-8"))
    pages = {p["slug"]: p for p in json.loads(REG.read_text(encoding="utf-8")).get("pages", [])}
    approved = [r for r in ev.get("results", []) if r.get("decision") == "approve"]
    if args.limit:
        approved = approved[: int(args.limit)]
    svc = _svc()
    ok = 0
    fail = 0
    for r in approved:
        slug = r["slug"]
        page = pages.get(slug, {})
        md = CONTENT / f"{slug}.md"
        if not md.exists():
            print(f"skip missing md {slug}")
            fail += 1
            continue
        body = md.read_text(encoding="utf-8")
        path = page.get("path") or r.get("path") or f"/{slug}"
        title = page.get("title") or slug
        v = svc.create_version(
            slug=slug,
            path=path,
            title=title,
            body=body,
            page_id=str(page.get("id") or r.get("page_id") or slug),
            meta={
                "description": page.get("description") or "",
                "decision": r.get("decision"),
                "overall_score": r.get("overall_score"),
            },
            change_summary="batch publish from approved SEO evaluation",
            created_by=args.actor,
        )
        rec = svc.publish(v.version_id, actor=args.actor)
        status = "OK" if rec.status == "published" and rec.read_back_ok else "FAIL"
        if status == "OK":
            ok += 1
        else:
            fail += 1
        print(f"{status}\t{slug}\tv{v.content_version}\t{rec.publication_id}\t{rec.status}")
    print(f"batch done ok={ok} fail={fail}")
    return 0 if fail == 0 else 1


def cmd_export(args: argparse.Namespace) -> int:
    snap = _svc().export_snapshot()
    out = Path(args.out) if args.out else SNAP
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(snap, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"exported → {out} counts={snap['counts']}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="P14 publish / read-back / rollback CLI")
    sub = ap.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("create", help="Create immutable content version")
    c.add_argument("--slug", required=True)
    c.add_argument("--path", required=True)
    c.add_argument("--title", required=True)
    c.add_argument("--body", default="")
    c.add_argument("--body-file", default="")
    c.add_argument("--page-id", default="")
    c.add_argument("--summary", default="")
    c.add_argument("--actor", default="cli")
    c.set_defaults(func=cmd_create)

    p = sub.add_parser("publish", help="Publish version to mock CMS + read-back")
    p.add_argument("--version-id", required=True)
    p.add_argument("--actor", default="cli")
    p.set_defaults(func=cmd_publish)

    rb = sub.add_parser("read-back", help="Re-verify publication against CMS")
    rb.add_argument("--publication-id", required=True)
    rb.set_defaults(func=cmd_read_back)

    ro = sub.add_parser("rollback", help="Restore previous (or named) version")
    ro.add_argument("--slug", required=True)
    ro.add_argument("--version-id", default=None, help="Optional target version_id")
    ro.add_argument("--actor", default="cli")
    ro.set_defaults(func=cmd_rollback)

    l = sub.add_parser("list", help="List versions or publications")
    l.add_argument("--what", choices=["versions", "publications"], default="publications")
    l.add_argument("--slug", default="")
    l.set_defaults(func=cmd_list)

    b = sub.add_parser("batch-approved", help="Publish approved SEO pages to mock CMS")
    b.add_argument("--limit", type=int, default=0)
    b.add_argument("--actor", default="batch")
    b.set_defaults(func=cmd_batch_approved)

    e = sub.add_parser("export", help="Export publish snapshot JSON")
    e.add_argument("--out", default=str(SNAP))
    e.set_defaults(func=cmd_export)

    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
