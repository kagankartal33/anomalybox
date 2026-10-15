# P14 — Publish, Read-Back, Rollback

## Commands

```text
python -m unittest discover -s tests/quantum -v
python tools/quantum/publish_cli.py create --slug demo --path /x/demo --title Demo --body-file content/seo-package/<slug>.md
python tools/quantum/publish_cli.py publish --version-id ver_…
python tools/quantum/publish_cli.py read-back --publication-id pub_…
python tools/quantum/publish_cli.py rollback --slug demo
python tools/quantum/publish_cli.py batch-approved --limit 5
python tools/quantum/publish_cli.py export
make publish-batch
make publish-export
```

## What was built

| Piece | Path |
|---|---|
| CMS adapter + mock | `quantum/cms_adapter.py` |
| Versions + publish service | `quantum/publish.py` |
| CLI | `tools/quantum/publish_cli.py` |
| Tests | `tests/quantum/test_publish.py` (8 cases) |
| Data | `quantum/data/publish/{versions,publications,cms_mock,audit.jsonl,snapshot.json}` |

## Behaviours verified

| Scenario | Result |
|---|---|
| Publish + content-hash read-back | OK |
| Duplicate publish (same `site:path:vN`) | Idempotent — same `publication_id` |
| Immutable version overwrite | Rejected |
| CMS hard fail before write | `status=failed`, no live doc |
| Partial failure after write | `status=partial` |
| Corrupt CMS body vs hash | `status=mismatch`, `read_back_ok=false` |
| Rollback to previous version | Live body restored; prior pub `rolled_back` |
| Rollback with no previous | RuntimeError |

## Idempotency

```text
publish key = site_id + canonical_path + content_version
restore key = site_id + path + restore + vN + prior_pub + rst_id
```

## Notes

- Mock CMS only — no live WordPress/Contentful account required.
- SEO package “publish” here means **operations demo to mock CMS**, not Next.js deploy.
- Next.js site continues to serve `content/seo-package` via the existing import pipeline.

## Next

- P15 lifecycle (refresh / merge / retire)
- Wire job state machine `SCHEDULED → PUBLISHED → ROLLED_BACK` into PublishService transitions
- Optional admin UI for publication history
