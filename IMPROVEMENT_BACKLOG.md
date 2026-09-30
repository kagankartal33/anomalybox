# ViralBox Improvement Backlog

## P1 - Premium Quality and Launch Confidence

- Add scheduled raw review-video cleanup.
- Add production DB/storage usage monitoring.
- Add admin lead status updates for ATELIER BLACK BOX.
- Add richer admin inventory health filters by category, persona, and product.
- Add browser-based visual regression screenshots for desktop and mobile.
- Add accessibility audit for keyboard navigation and heading order.
- Add Stripe webhook replay test script.
- Add production demo-account reset script.
- Add polished Resend email templates.

## P1 - UX

- Improve Creator Vault sealed-box mobile interaction for devices without hover.
- Add category search and grouping polish during onboarding.
- Add clearer empty states when creator has no boxes or no reviews.
- Add visible confirmation when review upload succeeds.
- Add admin filter for `under_review`, `revision_requested`, and `ready_to_post`.

## P1 - Data Quality

- Run `npm run audit:leaks` after every finalist export.
- Sample 50 random finalist cards per export for editorial quality.
- Add export-size guard to warn if production finalist package grows beyond Supabase Free comfort zone.
- Add top category/persona stock report to the admin inventory page.

## P2 - Growth

- Add analytics funnel:
  - homepage view
  - onboarding completed
  - store viewed
  - checkout started
  - checkout completed
  - box opened
  - card viewed
  - review submitted
- Add Sentry or equivalent error monitoring.
- Add lifecycle emails:
  - welcome
  - box delivered
  - box unopened reminder
  - review feedback ready
  - Atelier request received
- Add admin restock assistant.
- Add optional AI-assisted video compliance review after manual workflow is stable.

## P2 - Product Expansion

- Native mobile app.
- Team/manager accounts for creators.
- Sponsor campaign workspace.
- Custom ATELIER card previews.
- Limited invite-only creator cohorts.