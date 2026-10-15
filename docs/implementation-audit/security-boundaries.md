# Security Boundaries (P00)

## Trust zones

| Zone | Contains | Access |
|---|---|---|
| Public | SEO pages, marketing, login | Anonymous/read |
| Authenticated creator | Boxes, cards, profile | User session |
| Admin | Inventory, leads, generation | Admin role |
| Secrets | Stripe, Supabase service role, tokens | Server/env only |
| Training archive | Books, HF data (off app tree preferred) | Local/dev only |

## Rules

- Service-role keys never in client bundles.
- Viral training sources never surface in idea cards or SEO body as raw copies.
- Cross-tenant isolation is a Supabase/product concern; QUANTUM multi-tenant isolation not yet implemented as a platform layer.
- No QUANTUM publish system should auto-publish high-risk claims without human approval (Section 0.2).
