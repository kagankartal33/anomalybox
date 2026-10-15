# FINAL NO-OMISSION CHECKLIST

The implementation agent must answer every item with `PASS`, `FAIL`, `BLOCKED`, or `NOT_APPLICABLE_WITH_REASON`.

## Traceability

- [ ] Every normative requirement has an immutable ID.
- [ ] Every changed file maps to at least one requirement.
- [ ] Every verified requirement maps to execution evidence.
- [ ] Every blocker and exception is explicit.
- [ ] No requirement is omitted from the final matrix.

## Repository Safety

- [ ] Pre-existing user changes were preserved.
- [ ] Baseline failures are distinguished from regressions.
- [ ] No unrelated dependency upgrades or formatting rewrites occurred.
- [ ] Database changes have safe migration and rollback/compensation.
- [ ] Public contract compatibility is tested.

## Security and Tenancy

- [ ] Authentication and authorization tests pass.
- [ ] Cross-tenant read/write tests fail closed.
- [ ] Secrets scans pass.
- [ ] Logs and errors contain no secrets or cross-tenant data.
- [ ] Prompt injection cannot override policy or tool boundaries.

## Content Integrity

- [ ] Unsupported claims cannot publish.
- [ ] Human-review gates cannot be bypassed.
- [ ] Rights-restricted assets cannot publish.
- [ ] Structured data matches visible eligible content.
- [ ] Duplicate or unjustified pages are rejected or consolidated.

## Reliability

- [ ] Duplicate delivery is idempotent.
- [ ] Out-of-order events are handled.
- [ ] Worker crash and replay are tested.
- [ ] DLQ and replay work.
- [ ] Backup and restore are tested.
- [ ] Publication is verified by read-back.
- [ ] Rollback restores the intended immutable version.

## UI and Accessibility

- [ ] Loading, empty, error, denied, partial, stale, retry, and success states exist.
- [ ] Reviewer critical flows have end-to-end tests.
- [ ] Keyboard navigation passes.
- [ ] Screen-reader labeling and focus order pass.
- [ ] Responsive rendering is verified.

## Release

- [ ] Clean checkout setup succeeds.
- [ ] Mandatory test categories pass.
- [ ] Evaluation regression floors pass.
- [ ] Budget controls work.
- [ ] Compliance matrix is complete.
- [ ] Final decision uses one allowed release status.
