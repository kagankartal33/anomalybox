# P15 — Lifecycle and Experiments

## Commands

```text
python -m unittest discover -s tests/quantum -v
python tools/quantum/lifecycle_cli.py decide --slug x --path /x --stale --apply
python tools/quantum/lifecycle_cli.py decide --slug x --path /x --not-useful --target-slug y --redirect-path /y
python tools/quantum/lifecycle_cli.py apply --record-id life_…
python tools/quantum/lifecycle_cli.py exp-create --slug x --type cta_placement --hypothesis "…" --metric qualified_trial_start_rate
python tools/quantum/lifecycle_cli.py exp-start --id exp_…
python tools/quantum/lifecycle_cli.py exp-stop --id exp_… --emergency
python tools/quantum/lifecycle_cli.py scan-eval --limit 20
python tools/quantum/lifecycle_cli.py export
make lifecycle-scan
make lifecycle-export
```

## Lifecycle (Section 18)

| Piece | Path |
|---|---|
| Decision tree + service | `quantum/lifecycle.py` |
| CLI | `tools/quantum/lifecycle_cli.py` |
| Tests | `tests/quantum/test_lifecycle.py` |
| Data | `quantum/data/lifecycle/{records,audit.jsonl,snapshot.json}` |

### Decision tree

```text
still useful?
  no  → retire | redirect (if intent_shift / overlap signal)
  yes → intent unchanged?
          no  → rebrief_or_split
          yes → facts stale / freshness trigger?
                  yes → refresh_evidence
                  no  → overlap weakness?
                          yes → merge
                          no  → traffic/feedback stress?
                                  yes → improve_utility
                                  no  → keep_monitor
```

### Apply rules

- Safe actions auto-apply when `--apply`: `keep_monitor`, `improve_utility`, `refresh_evidence`
- Human actions (`merge`, `redirect`, `retire`, `rebrief_or_split`) stay `decided` until `apply`
- `merge` / `redirect` without target → `failed` with `missing_merge_or_redirect_target`
- Retire / merge / redirect can unpublish source path via mock CMS

## Experiments (Section 19)

| Piece | Path |
|---|---|
| Governance + service | `quantum/experiments.py` |
| Tests | `tests/quantum/test_experiments.py` |
| Data | `quantum/data/experiments/{records,audit.jsonl,snapshot.json}` |

### Governance

- Invalid types rejected: keyword stuffing, hidden content, misleading schema, mass near-dup, etc.
- Vanity primary metrics blocked: `traffic`, `word_count`, `ranking_position`
- Requires hypothesis, guardrails, allocation, α, power, min runtime ≥ 7 days
- One running experiment per slug
- Normal stop blocked before `minimum_runtime_days`; emergency abort allowed

## Verification

- **39** quantum unit tests OK (includes 11 lifecycle + 9 experiment cases)

## Next

- P16 observability (traces, metrics, backup/restore)
- Wire lifecycle actions into job state machine (`MONITORED` → `REFRESH_DUE` / `RETIRE`)
- Admin UI for lifecycle queue + experiment board
