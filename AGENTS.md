# Premium Design Intelligence Rules

Before implementing or modifying UI:

1. Read:
   - `design-intelligence/derived/PREMIUM_WEB_DESIGN_PLAYBOOK.md`
   - `design-intelligence/derived/premium-pattern-library.md`
   - `design-intelligence/derived/anti-pattern-library.md`
   - `design-intelligence/derived/seo-marketing-implementation-rules.md`
   - `design-intelligence/derived/premium-image-direction.md`
   - `design-intelligence/derived/box-reveal-motion-spec.md`

2. Use reference materials to derive principles only. Never copy:
   - brand names,
   - logos,
   - source text,
   - exact layouts,
   - unique visual motifs,
   - third-party assets,
   - unverified source code.

3. Prioritize:
   - clear hierarchy,
   - restrained typography,
   - intentional whitespace,
   - one main CTA per decision point,
   - semantic HTML,
   - keyboard-accessible controls,
   - responsive recomposition,
   - premium product imagery,
   - state-explaining motion,
   - Core Web Vitals,
   - truthful SEO metadata and structured data.

4. Reject generic AI-site patterns:
   - excessive gradient/glass effects,
   - undifferentiated card grids,
   - fake metrics or testimonials,
   - multiple competing CTAs,
   - low-contrast text,
   - motion without user-value,
   - placeholder copy,
   - copied visual identity.

5. Before declaring a page complete:
   - test desktop and mobile,
   - audit keyboard navigation,
   - check heading structure,
   - validate structured data only where relevant,
   - run performance checks,
   - review visual hierarchy against the approved design rules.

## Extended Deep Reasoning & Thought Protocol (Effort Level: 1.0 / Maximum)
- Always execute with maximum internal reasoning, deep multi-step cognitive planning, and rigorous verification.
- Never guess code logic, component props, or file paths without inspecting authoritative sources.
- Enforce 4-Pass content generation, anti-AI humanization, and 100% Originality Gate deduplication.
- Verify static Next.js compilation, TypeScript types, and Multimodal SEO images for every single page.
- Ensure all markdown outputs are rendered using rich, responsive React components (no raw unrendered text).

## Strict Content Realism & Visual Uniqueness Rules (Master Plan V4 Aligned)
1. **Length Target:** Every resource article must be between 600 and 1,200 words.
2. **Zero Template Copy-Pasting:** Every single article must have a custom introduction, custom tactical breakdown, custom fill-in-the-blank script formulas, custom step-by-step implementation, and custom FAQs.
3. **Zero Cross-Topic Leaks:** Never leak visual signature copy or irrelevant intro text into non-visual or specialized articles.
4. **Zero Image Duplication:** Every page MUST use a 100% unique visual asset path. Never reuse an image across multiple resource pages.

## Pipeline Separation (mandatory)

SEO content and viral idea cards are **separate systems**. See `docs/architecture/content-pipelines-separation.md`.

| | SEO content | Viral idea cards |
|---|---|---|
| Output | `content/resources/*.md` | `idea_cards` / inventory |
| Training | `seo_content_rules.sql`, `dataset/seo_content/` | `viral_training_*`, book craft, HF, real viral seeds |
| Generator | `tools/generate_unique_resources.py` | `docs/prompts/generate-ideas-system.md` + stock/admin generators |

- Never load viral VTP / idea_card training into resource SEO generation.
- Never write resource markdown from the viral card generator.
- Never dump comedy/persona/viral harvest JSONL under `seo_content/prepared/`.

