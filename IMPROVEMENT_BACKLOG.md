# ViralBox Improvement Backlog

## P1 - Premium Quality and Launch Confidence

- Add production DB/storage usage monitoring.
- ~~Add admin lead status updates for ATELIER BLACK BOX.~~
- ~~Add richer admin inventory health filters by category, persona, and product.~~
- Add browser-based visual regression screenshots for desktop and mobile.
- ~~Add accessibility audit for keyboard navigation and heading order.~~ (partial: keyboard for vault dialog + card boards done; full page audit still open)
- ~~Add Stripe webhook replay test script.~~ (`npm run test:stripe-webhook`)
- ~~Add production demo-account reset script.~~ (`npm run demo:reset`)
- Add polished Resend email templates.

## P1 - UX

- Improve Creator Vault sealed-box mobile interaction for devices without hover (re-QA on real device).
- Add category search and grouping polish during onboarding.
- ~~Add clearer empty states when creator has no boxes or no reviews.~~ (vault + notifications done)

## P1 - Data Quality

- Run `npm run audit:leaks` after every finalist export.
- ~~Sample 50 random finalist cards per export for editorial quality.~~ (`npm run audit:finalist-sample`)
- ~~Add export-size guard to warn if production finalist package grows beyond Supabase Free comfort zone.~~ (`npm run audit:export-size`)
- ~~Add top category/persona stock report to the admin inventory page.~~ (summary tiles + priority restock list on inventory admin)

## P2 - Growth

- Add analytics funnel:
  - homepage view
  - onboarding completed
  - store viewed
  - checkout started
  - checkout completed
  - box opened
  - card viewed
- Add Sentry or equivalent error monitoring.
- Add lifecycle emails:
  - welcome
  - box delivered
  - box unopened reminder
  - Atelier request received
- Add admin restock assistant.

## P2 - Product Expansion

- Team/manager accounts for creators.
- Sponsor campaign workspace.
- Custom ATELIER card previews.
- Limited invite-only creator cohorts.
