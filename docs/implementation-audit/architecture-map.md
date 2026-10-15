# Architecture Map (P00)

## Surfaces

```text
Public web (Next.js)
  ├── Marketing/store/auth
  ├── SEO package pages (112)  → content/seo-package + lib/seo-package-registry.json
  └── Creator app (boxes/cards/profile)

Supabase
  ├── Auth + inventory + idea_cards
  ├── viral_training_* (idea generation)
  └── admin edge functions

Tooling (Python/PS)
  ├── SEO package import/audit
  ├── originality_gate
  └── quantum/ pack validators
```

## QUANTUM Target Overlay (not yet built)

```text
Demand → Justification → Research/Evidence → Brief → Draft
  → Verify → Edit → SEO/Graph → Policy → Human Review
  → Assets/Schema → Render QA → Publish → Monitor → Refresh
```

Existing ViralBox covers only **partial publish surface** and **partial originality checks**.
