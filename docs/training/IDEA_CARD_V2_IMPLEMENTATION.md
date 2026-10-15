# Idea Card v2 implementation (viralboxUP.md)

## Architecture map

```text
Generation:
  docs/prompts/generate-ideas-system.md
  supabase/functions/admin-generation-batches
  supabase/functions/generate-ideas

Storage:
  public.idea_cards.card  (JSON blob; legacy or schemaVersion 2)

Compatibility:
  lib/idea-card/adapt-legacy.ts  → IdeaCard schemaVersion 2
  lib/idea-card/quality.ts       → language + timeline issues
  lib/idea-card/schema.ts        → Zod structural schema
  lib/idea-card/time.ts          → parse/format seconds

Creator UI:
  app/cards/[ideaId]/page.tsx
  components/idea-card/IdeaCardView.tsx
    ├── IdeaCardHeader (title, concept, metadata, viewer takeaway)
    ├── VideoFlowOverview (time · stage · purpose)
    └── ShootPlan (detailed Goal / Action / Say this / Shot / …)

Legacy path (admin sections still available):
  lib/card-sections.ts
  components/CardSections.tsx
```

## Rules enforced

- One field, one job (no Action/Say this clones when quality-checked)
- Continuous timeline from 0s
- Banned vague phrases (warning/error)
- Old cards adapt without migration
- New labels: Video Flow, Shoot Plan, Context, Demonstration, Takeaway, Action, Say this, Shot, Performance note

## Tests

```powershell
npm run test:idea-card
npm run typecheck
```

## Out of scope (per brief)

Home, Store, Pricing, Vault shelf, Atelier, branding, checkout, auth redesign.
