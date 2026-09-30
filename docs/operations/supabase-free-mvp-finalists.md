# Supabase Free MVP Finalist Inventory

## Purpose

The production MVP uses Supabase Free as a slim app database. The local generator can create and score large batches, but production only receives final creator-facing cards required for purchase, vault reveal, and review.

## Rule

- Scope: each enabled category routed to one creator mode.
- Minimum: 5 final approved cards.
- Target: 7 final approved cards.
- Delivery compatibility: every exported route must include at least `low:2`, `mid:1`, and `high:2` internally so both Classic Red Box and SIGNATURE PURPLE BOX can be delivered.
- Creator-facing UI never shows internal score, band, training source, run id, or Quality Gate language.

## Export

Dry run:

```powershell
powershell -ExecutionPolicy Bypass -File .	ools\export-production-finalists.ps1 -DryRun
```

Write an export package:

```powershell
powershell -ExecutionPolicy Bypass -File .	ools\export-production-finalists.ps1
```

Output:

```text
production_exports/
  mvp_finalists_YYYYMMDD_HHMMSS/
    manifest.json
    finalist_cards.jsonl
    missing_routes.jsonl
    route_summary.json
```

## Import

Dry run validation:

```powershell
powershell -ExecutionPolicy Bypass -File .	ools\import-production-finalists.ps1 -InputPath .\production_exports\...\finalist_cards.jsonl
```

Apply to the configured database container:

```powershell
powershell -ExecutionPolicy Bypass -File .	ools\import-production-finalists.ps1 -InputPath .\production_exports\...\finalist_cards.jsonl -Apply
```

The import writes only:

- minimal `idea_candidates` identity rows for selected finalists,
- `idea_cards`,
- `idea_inventory`.

It does not import training tables, rejected ideas, full candidate history, score logs, or quality check rows.

## Products

- `viral_box_500` stays the backend slug and displays as **Classic Red Box**.
- `premium_viral_box_1000` stays the backend slug and displays as **SIGNATURE PURPLE BOX**.
- **ATELIER BLACK BOX** is a contact-only concierge service, not a checkout product.