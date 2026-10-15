# PHASE RUNBOOK

This file is an execution index. The normative rules remain in the V4 specification.

## Global Gate

No phase starts until the previous phase's P0 requirements are verified or a named approved exception exists.

## P00 — Baseline and Safety

**Read:** Sections 0, 20, 45–50, 54–60.  
**Create:** Audit folder and `.agent/` state.  
**Verify:** Repository inventory, baseline commands, dirty-file protection, requirement extraction.  
**Exit:** No product code changed; current state is reproducible.

## P01 — Repository and Local Runtime

**Read:** Sections 21, 31, 32, 44.  
**Create:** Stable bootstrap, migrate, seed, test, and dev commands.  
**Verify:** Clean checkout mock path runs without live credentials.

## P02 — Configuration and Secrets

**Read:** Sections 20, 31, 32, 52, 57.  
**Create:** Typed config validation, `.env.example`, secret scanning.  
**Verify:** Missing critical production config fails closed; no secrets committed.

## P03 — Persistence and Migrations

**Read:** Sections 22, 33, 36, 39, 51.  
**Create:** Core schema, migrations, constraints, rollback plan.  
**Verify:** Forward migration, representative backfill, rollback or compensating path.

## P04 — Identity and Tenant Isolation

**Read:** Sections 20 and 35.  
**Create:** Roles, permissions, tenant-scoped access.  
**Verify:** Allowed and denied paths; cross-tenant read/write denial.

## P05 — Contracts, API, and Events

**Read:** Sections 3, 22, 23, 37.  
**Create:** Typed schemas, error envelope, job and event contracts.  
**Verify:** Compatibility, validation, idempotency-key behavior, concurrency conflict.

## P06 — Durable Orchestration

**Read:** Sections 3, 14, 33.  
**Create:** State machine, checkpoints, retries, backpressure, DLQ.  
**Verify:** Crash, duplicate, timeout, cancellation, and replay scenarios.

## P07 — Evidence Ledger

**Read:** Sections 5, 20, 36.  
**Create:** Source and claim records, trust/freshness, citation mapping.  
**Verify:** Unsupported, stale, conflicting, restricted, and injected sources fail safely.

## P08 — Opportunity and Page Justification

**Read:** Sections 4 and 9.  
**Create:** Intent and distinct-value gates.  
**Verify:** Duplicate opportunity is rejected or routed to merge/refresh.

## P09 — Blueprint and Generation

**Read:** Sections 6–8.  
**Create:** Brief, blueprint, deterministic mock provider, pass pipeline.  
**Verify:** Evidence-constrained output and bounded regeneration.

## P10 — Validation and Quality

**Read:** Sections 6, 9, 15.  
**Create:** Claim, contradiction, duplication, policy, and score evaluations.  
**Verify:** Hard gates override weighted score.

## P11 — Entities, Schema, and Links

**Read:** Sections 10 and 11.  
**Create:** Entity registry, schema eligibility, link scoring.  
**Verify:** Ineligible schema and irrelevant links are rejected.

## P12 — Assets, Rendering, Accessibility

**Read:** Sections 12, 13, 58.  
**Create:** Asset registry, rights checks, render QA, accessibility states.  
**Verify:** Restricted assets, invalid alt text, broken layout, and accessibility failures block publish.

## P13 — Human Review and Dashboard

**Read:** Sections 16, 42, 58.  
**Create:** Review queues, source inspection, diffs, decisions, audit history.  
**Verify:** Role checks, double-submit protection, keyboard and screen-reader flow.

## P14 — Publish, Read-Back, Rollback

**Read:** Sections 13, 18, 23, 44.  
**Create:** CMS adapter and mock, immutable versions, rollback.  
**Verify:** Duplicate publish, partial failure, read-back mismatch, rollback.

## P15 — Lifecycle and Experiments

**Read:** Sections 18 and 19.  
**Create:** Refresh rules, merge/redirect/retire, experiment records.  
**Verify:** Statistical and governance constraints.

## P16 — Observability and Reliability

**Read:** Sections 17, 28, 33.  
**Create:** Traces, metrics, alerts, backup, restore, degraded modes.  
**Verify:** One trace spans workflow; restore and DLQ runbooks execute.

## P17 — Security, Privacy, Rights

**Read:** Sections 20, 35, 36.  
**Create:** Threat controls, retention, deletion, correction, takedown.  
**Verify:** Request lifecycle and audit proof.

## P18 — Evaluation and Economics

**Read:** Sections 34, 38, 40, 43.  
**Create:** Golden suites, model registry, budget controls.  
**Verify:** Regression blocks release; hard budget pauses noncritical work.

## P19 — Deployment and Graduation

**Read:** Sections 24, 25, 39, 45, 59.  
**Create:** CI/CD, canary, release evidence, compliance matrix.  
**Verify:** Clean-room demonstration and explicit release decision.
