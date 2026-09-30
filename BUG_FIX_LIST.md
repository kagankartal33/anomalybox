# ViralBox Bug Fix List

Date: 2026-07-11

## Fixed

- Card page no longer exposes the visual shooting guide/video component.
- `components/ShootingGuideVideo.tsx` removed because it was unused and conflicted with the current card presentation direction.
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

## Not A Bug / Expected

- Admin files may reference inventory, internal rank, or safety sections because admin needs those controls.
- Creator leak scanner passes, so those internal terms are not currently detected in creator-facing surfaces.
