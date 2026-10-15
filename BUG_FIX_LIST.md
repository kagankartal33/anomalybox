# ViralBox Bug Fix List

Date: 2026-07-11

## Fixed

- Scene Flow no longer shows the old preview/time-bar block when a modern range board exists.
- Range cards show creator-friendly fields with clear separation:
  - Action
  - Camera
  - Say
  - On-screen text
  - Creator touch
  - Edit
- Creator personalization highlights restored.
- Lint warnings in `CardSections.tsx` fixed.
- Malformed JSX in the Scene Flow time bar fixed.
- Visible malformed time separator in the fallback timeline fixed.
- Box reveal dialog is keyboard-accessible (Escape, focus trap, labeled dialog).
- Card section accordions and edit-assembly stages expose proper ARIA relationships and arrow-key movement.
- Creator Vault empty state and notification empty state give a next action instead of a dead end.
- Admin inventory page supports category/persona/status/product filters and stock summary.
- Admin can update Atelier lead status with optional private notes.
- Stripe webhook path has signature + duplicate-event replay coverage.
- Demo account can be reset/recreated with a single local script.
- Card quality feedback uses card reports only (no creator video upload path).

## Not A Bug / Expected

- Admin files may reference inventory, internal rank, or safety sections because admin needs those controls.
- Creator leak scanner passes, so those internal terms are not currently detected in creator-facing surfaces.

