# Content Consolidation Plan — anomalybox.com

Date: 16 Oct 2026 · Status: Phase 1 is on a branch and has not been deployed. Phase 2 needs editorial work.

## Summary

The technical SEO is clean: every URL returns 200 and has a correct canonical. Google is still declining to index 146 URLs (108 crawled but not indexed, 38 discovered but not indexed). The cause is content duplication on a domain with almost no authority. Of the 233 public articles, 97 come from one templated registry package, and on a median registry page **64% of 6-word phrases also appear on at least five other pages**. Many of these pages also target the same query, for example seven separate burnout or fatigue pages and five "how to find content ideas" pages. Six legacy resources also compete with the product pages themselves (`/dossiers/*`, `/pricing`, `/store`, `/atelier`).

Phase 1 (implemented on this branch) merges **46 URLs into 31 cluster winners**:

| | Before | After |
|---|---:|---:|
| Sitemap URLs | 257 | 211 |
| Public article pages (registry + legacy + segment pages) | 238 | 192 |
| `/resources` hub pages | 11 | 8 |
| `/services` articles | 8 | 3 |

All 46 merged URLs, plus the three hub pages that no longer exist (`/resources/p/9`–`11`), answer with a **308 to their winner in one hop**. In Search Console they will move to "Page with redirect". That status is expected and is not an error.

Phase 2 (below) covers about 38 more URLs where both pages have real, distinct prose. Those need an editor to merge the text first, so they were left alone.

## Method

1. **Inventory.** Pages were taken from `lib/seo-package-registry.json` (110 entries: 97 public plus 13 purchase-protected templates), the legacy list `resources` in `lib/seo-content.ts` (137 entries: 136 public), and the `segments` in `lib/seo-content.ts` (12, of which 5 render their own thin page). The body text came from `content/seo-package/*.md` and `content/resources/*.md`.
2. **Similarity.** Each pair of the 233 article bodies was scored three ways:
   - TF-IDF cosine on content words.
   - Overlap of 6-word phrases ("shingles"): the shared share of the smaller page.
   - Title-token Jaccard.

   "Boilerplate" is the share of a page's 6-word phrases that also appear on five or more other pages.
3. **Intent check.** Every candidate pair was read for search intent (the query it should rank for), not only for how similar the text is. Pages that share a template but serve different intents stay, for example `/resources/idea-to-shoot-ready-brief` and `/content-ideas/ecommerce-content-ideas` (cosine 0.82).
4. **Choosing the winner,** in this order:
   1. A money page, when the article is a product explainer.
   2. The URL that matches the head keyword.
   3. The page with more unique prose (lower boilerplate).
   4. The page that is already linked from a hub.

**Thin pages.** Word counts are not the problem: only 2 of 233 pages are under 600 words. The thin pages are the five legacy `/content-ideas/{segment}` pages, which have three bullet points each. All five are merged here. The other "thin" signal is template repetition, which the boilerplate column measures.

## Phase 1 — implemented on this branch

Clusters are listed in priority order. **P0** clusters are tied to money pages, **P1** clusters are high-volume informational intents that feed them, and **P2** clusters are lane/persona duplicates.

The cosine and shingle columns compare each merged page with its winner. "<0.35" (or a low score) means the pages target the same intent but are worded differently, which is common for legacy-versus-registry pairs. Those pages were merged on intent, not on text overlap.

#### P0 · Classic Red product page

Winner `/dossiers/classic-red` (money page) · primary keyword **classic red creative brief**

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/anomalybox-classic-red-dossier-review` | 1077 | 43% | n/a | n/a |

#### P0 · Signature Purple product page

Winner `/dossiers/signature-purple` (money page) · primary keyword **signature purple creative brief**

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/anomalybox-signature-purple-aesthetic-dossier` | 1054 | 46% | n/a | n/a |

#### P0 · Atelier custom brief page

Winner `/atelier` (money page) · primary keyword **custom campaign creative brief**

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/anomalybox-atelier-black-box-for-agencies` | 1059 | 45% | n/a | n/a |

#### P0 · Brief comparison and pricing

Winner `/pricing` (money page) · primary keyword **creator shoot brief pricing**

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/creative-direction-box-dossier-system` | 1053 | 43% | n/a | n/a |
| `/resources/anomalybox-unboxing-and-creator-dossier-walkthrough` | 1081 | 45% | n/a | n/a |

#### P0 · Brief configuration and ordering

Winner `/store` (money page) · primary keyword **order a custom creative brief**

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/custom-creative-direction-box-ordering-guide` | 1003 | 43% | n/a | n/a |

#### P0 · Creative briefs vs templates and AI prompts

Winner `/resources/physical-creative-direction-box-vs-digital-templates` (1044 words, 44% shared boilerplate) · primary keyword **creative brief vs template** · money links `/pricing`, `/dossiers/signature-purple`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/why-physical-dossiers-beat-ai-prompt-generators` | 1108 | 42% | 0.55 | 39% |

#### P0 · Creative direction service

Winner `/services/creative-direction-for-content-creators` (729 words, 53% shared boilerplate) · primary keyword **creative direction for content creators** · money links `/dossiers/signature-purple`, `/pricing`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/services/reels-creative-direction` | 645 | 67% | 0.71 | 58% |
| `/services/personal-brand-creative-direction` | 654 | 66% | 0.61 | 54% |

#### P0 · Custom Instagram content plan service

Winner `/services/custom-instagram-content-plan` (743 words, 71% shared boilerplate) · primary keyword **custom instagram content plan** · money links `/dossiers/classic-red`, `/pricing`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/services/content-strategist-for-instagram` | 653 | 67% | 0.63 | 66% |
| `/services/content-planning-service-for-creators` | 643 | 68% | 0.61 | 69% |
| `/services/instagram-content-strategy-service` | 684 | 65% | 0.61 | 56% |
| `/resources/custom-instagram-content-plan-framework` | 1040 | 45% | <0.35 | n/a |

The last row is the same keyword as the winner, served by a legacy explainer.

#### P1 · Creator burnout and fatigue

Winner `/resources/content-creator-burnout` (771 words, 58% shared boilerplate) · primary keyword **content creator burnout** · money links `/dossiers/classic-red`, `/pricing`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/creator-fatigue` | 777 | 64% | 0.65 | 43% |
| `/resources/content-fatigue` | 772 | 64% | 0.58 | 42% |
| `/resources/instagram-burnout` | 790 | 58% | 0.67 | 39% |
| `/resources/social-media-burnout-creator` | 795 | 68% | 0.67 | 48% |
| `/reels/reels-burnout` | 795 | 66% | 0.67 | 49% |
| `/resources/is-everyone-feeling-creator-burnout-q1-fix` | 1054 | 40% | <0.35 | n/a |

The last row is a seasonal ("Q1") take on the same query.

#### P1 · Creator decision fatigue

Winner `/resources/creator-decision-fatigue-and-burnout-solution` (781 words, 0% shared boilerplate; pre-decided shot lists are the product's own pitch) · primary keyword **content creation decision fatigue** · money links `/dossiers/classic-red`, `/pricing`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/content-creation-decision-fatigue` | 777 | 63% | <0.35 | n/a |

The merged page shares the burnout template: cosine 0.77 with `/resources/creator-fatigue`.

#### P1 · Finding content ideas

Winner `/resources/how-to-come-up-with-content-ideas` (910 words, 64% shared boilerplate) · primary keyword **how to come up with content ideas** · money links `/dossiers/classic-red`, `/pricing`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/how-to-find-content-ideas` | 861 | 66% | 0.59 | 66% |
| `/resources/how-to-never-run-out-of-content-ideas` | 741 | 70% | 0.58 | 70% |
| `/resources/running-out-of-content-ideas` | 875 | 65% | 0.55 | 63% |
| `/resources/content-ideas-when-stuck` | 886 | 64% | 0.56 | 62% |

#### P1 · Creative block

Winner `/resources/creative-block-content-creator` (852 words, 66% shared boilerplate) · primary keyword **creative block content creator** · money links `/dossiers/classic-red`, `/pricing`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/instagram-content-block` | 858 | 66% | 0.55 | 64% |

#### P1 · What to post on Instagram

Winner `/resources/what-to-post-on-instagram` (754 words, 59% shared boilerplate) · primary keyword **what to post on instagram** · money links `/dossiers/classic-red`, `/pricing`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/i-dont-know-what-to-post-on-instagram` | 770 | 66% | 0.67 | 65% |

#### P1 · Content bank

Winner `/resources/how-to-build-a-content-bank` (757 words, 30% shared boilerplate) · primary keyword **how to build a content bank** · money links `/dossiers/signature-purple`, `/pricing`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/content-bank-ideas` | 640 | 0% | 0.58 | 55% |

#### P1 · Content batching

Winner `/resources/batch-content-without-burnout` (989 words, 20% shared boilerplate) · primary keyword **how to batch content** · money links `/dossiers/signature-purple`, `/pricing`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/how-to-batch-content` | 662 | 68% | <0.35 | n/a |

The head-keyword URL was the more templated page (cosine 0.76 with `/resources/how-to-stay-consistent-on-instagram`), so the richer page wins. Its title already contains "how to batch content".

#### P1 · Posting consistently

Winner `/resources/how-to-create-content-consistently` (735 words, 57% shared boilerplate) · primary keyword **how to create content consistently** · money links `/dossiers/classic-red`, `/pricing`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/how-to-stay-consistent-on-instagram` | 666 | 69% | 0.65 | 51% |

#### P1 · Content creation workflow

Winner `/resources/content-creation-workflow` (760 words, 64% shared boilerplate) · primary keyword **content creation workflow** · money links `/pricing`, `/store`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/content-planning-workflow` | 749 | 64% | 0.63 | 74% |

#### P1 · Repeatable content system

Winner `/resources/how-to-build-a-repeatable-content-system` (1090 words, 45% shared boilerplate) · primary keyword **repeatable content system** · money links `/pricing`, `/store`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/repeatable-content-system` | 712 | 71% | 0.12 | 0% |

The two titles have a token Jaccard of 0.80. The registry page is the templated copy.

#### P1 · Why content creation feels hard

Winner `/resources/why-is-content-creation-so-hard` (763 words, 25% shared boilerplate) · primary keyword **why is content creation so hard** · money links `/dossiers/classic-red`, `/pricing`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/content-creation-overwhelm` | 681 | 1% | 0.60 | 57% |

#### P1 · Content strategy for creators

Winner `/resources/content-strategy-for-creators` (767 words, 64% shared boilerplate) · primary keyword **content strategy for creators** · money links `/pricing`, `/store`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/creator-personas/content-strategy-for-small-creators` | 787 | 62% | 0.67 | 70% |
| `/content-ideas/creator-content-strategy` | ~40 (3 bullets) | segment template | n/a | n/a |

#### P1 · Low-capacity content strategy

Winner `/resources/minimum-viable-content-strategy` (688 words, 29% shared boilerplate) · primary keyword **minimum viable content strategy** · money links `/dossiers/classic-red`, `/pricing`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/sustainable-content-strategy` | 629 | 22% | 0.62 | 60% |
| `/creator-personas/content-strategy-for-busy-creators` | 711 | 73% | 0.18 | 4% |

The busy-creators persona page is a template copy: cosine 0.80 with `/creator-personas/ugc-content-strategy`.

#### P2 · Beauty and skincare Reels ideas

Winner `/creator-lanes/beauty-reels-ideas` (899 words, 66% shared boilerplate) · primary keyword **beauty reels ideas** · money links `/pricing`, `/dossiers/classic-red`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/creator-lanes/skincare-reels-ideas` | 908 | 67% | 0.70 | 65% |

#### P2 · Beauty and skincare content strategy

Winner `/creator-lanes/beauty-content-strategy` (686 words, 69% shared boilerplate) · primary keyword **beauty content strategy** · money links `/pricing`, `/dossiers/signature-purple`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/creator-lanes/skincare-content-strategy` | 687 | 74% | 0.45 | 25% |

The merged page is the most templated lane page: cosine 0.80 with the busy-creators persona page.

#### P2 · Beauty and skincare product video ideas

Winner `/creator-lanes/beauty-product-video-ideas` (643 words, 3% shared boilerplate) · primary keyword **beauty product video ideas** · money links `/pricing`, `/dossiers/classic-red`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/creator-lanes/skincare-product-video-ideas` | 652 | 3% | 0.58 | 30% |

#### P2 · Fashion and luxury content strategy

Winner `/creator-lanes/fashion-content-strategy` (749 words, 70% shared boilerplate) · primary keyword **fashion content strategy** · money links `/pricing`, `/dossiers/signature-purple`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/creator-lanes/luxury-content-strategy` | 746 | 70% | 0.62 | 73% |

#### P2 · Founder and thought leadership content strategy

Winner `/creator-lanes/content-strategy-for-founders` (694 words, 74% shared boilerplate) · primary keyword **content strategy for founders** · money links `/atelier`, `/pricing`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/creator-lanes/thought-leadership-content-strategy` | 699 | 72% | 0.68 | 72% |

#### P2 · AI Overviews and answer engines

Winner `/resources/answer-engine-optimization-for-creators` (1074 words, 43% shared boilerplate) · primary keyword **answer engine optimization for creators** · money links `/pricing`

| Merged URL (308 to winner) | Words | Boilerplate | Cosine vs winner | Shingle overlap |
|---|---:|---:|---:|---:|
| `/resources/how-to-optimize-creator-content-for-ai-overviews` | 1073 | 41% | 0.41 | 37% |

Both pages target "AI Overviews and AI Mode".

#### P2 · Thin segment pages (three bullets each)

| Merged URL (308) | Winner | Primary keyword |
|---|---|---|
| `/content-ideas/reels-content-ideas` | `/reels/instagram-reels-ideas` | instagram reels ideas |
| `/content-ideas/fashion-content-ideas` | `/content-ideas/fashion-luxury-content-ideas` | fashion content ideas |
| `/content-ideas/founder-content-ideas` | `/creator-lanes/founder-content-ideas` | founder content ideas |
| `/content-ideas/lifestyle-content-ideas` | `/content-ideas/instagram-content-ideas` | instagram content ideas |
| `/content-ideas/creator-content-strategy` | `/resources/content-strategy-for-creators` | content strategy for creators |

Retired hub pages: `/resources/p/9`, `/resources/p/10` and `/resources/p/11` now 308 to `/resources`. The hub fell from 97 to 66 articles, which is 8 pages of 9.

### How it is implemented

- **Single source of truth: `lib/seo-consolidation.json`.** It holds the clusters (winner, primary keyword, money links, merged URLs) and the retired hub pages. Reverting one merge means deleting that path from this file. The markdown and registry entries are kept on purpose.
- **`next.config.ts`** emits a `permanent: true` (308) redirect for every merged URL and every retired hub page. These run before any route renders.
- **`lib/seo-package.ts`** drops merged pages from `registryPages` and `legacyResourcePages`. As a result, hubs, hub pagination, static params and related-guide links no longer include them. A related link that pointed at a merged page now points at its winner (deduplicated, never a self-link). If the winner is a money page, the link is dropped instead.
- **`lib/llms-pages.ts`** keeps merged pages out of `/sitemap.xml`, `/feed.xml` and `/llms.txt`. In `app/sitemap.ts` and `app/content-ideas/[slug]/page.tsx`, merged segment pages are no longer listed or prerendered.
- **`components/SeoPackageArticle.tsx`**: each article winner now carries a contextual in-body line, "Ready to film instead of plan? You can …", with descriptive anchor links to its `/dossiers/*`, `/pricing`, `/store` or `/atelier` page. Before, articles linked only to `/store?box=…` query URLs.
- **`tools/check-seo-package-integrity.mjs`** (runs in `prebuild`, so a bad map fails the build) checks that:
  - every merged URL is a current public article;
  - no URL is listed twice;
  - no winner is itself merged (no redirect chains);
  - winners are live pages;
  - money links only target money pages;
  - retired hub pages are really past the new last page.
- `lib/cluster-links.ts` is not imported anywhere. Its two links to merged pages were repointed anyway.

## Phase 2 — editorial merges (not implemented)

Each pair below has real, distinct prose on both sides. To merge one:

1. Move the loser's unique sections (listed) into the winner's markdown, written in the winner's voice.
2. Add the loser to `lib/seo-consolidation.json`.
3. Rebuild. The integrity check and the crawl below verify the result.

Expected yield is about 38 more URLs.

| Cluster | Winner | Merge in | Unique material to keep |
|---|---|---|---|
| Faceless | `/content-ideas/faceless-content-ideas` (ideas) and `/resources/faceless-content-production-guide` (how-to) | `/creator-personas/faceless-content-strategy`, `/creator-personas/content-ideas-for-camera-shy-creators`, `/resources/faceless-reels-ideas-for-busy-creators`, `/resources/reels-ideas-for-introverted-creators`, `/resources/faceless-content-authenticity-and-monetization-guide` | Camera-shy formats; monetization modes; hands/screen/ambient directing modes |
| Shot lists | `/resources/short-form-video-shot-list` and `/resources/b-roll-shot-list` | `/reels/instagram-reels-shot-list` (627 words, 76% boilerplate, the most templated page on the site), `/resources/cinematic-b-roll-shot-list-for-lifestyle-creators` | Reels-specific opening shots; lifestyle B-roll sequence |
| B2B / founder video | `/resources/saas-founder-linkedin-video-strategy`, `/resources/founder-storytelling-reels-framework`, `/resources/thought-leadership-video-system-for-consultants` | `/resources/b2b-saas-linkedin-video-systems`, `/resources/founder-tradeoff-storytelling-framework`, `/resources/b2b-expert-linkedin-to-instagram-video-playbook` (517 words, thinnest article), `/creator-personas/content-strategy-for-experts` | 45-second case-study architecture; tradeoff story beats |
| AI search for creators | `/resources/answer-engine-optimization-for-creators` | `/resources/eeat-experience-markers-for-ai-search`, `/resources/search-engine-generative-citation-guide`, `/resources/zero-click-summary-architecture-guide`, `/resources/voice-search-h2-question-architecture`, `/resources/multimodal-image-alt-text-for-ai-engines`, `/resources/entity-clustering-for-instagram-creators`, `/resources/knowledge-graph-entity-building-for-brands`, `/resources/structured-data-schema-for-creative-briefs`, `/resources/conversational-nlp-targeting-for-video-creators` | One section each. This topic does not lead buyers to the product, so one strong page is enough. |
| Visual signature | `/resources/visual-signature-guide` | `/resources/how-to-create-a-uniquely-recognizable-visual-signature`, `/resources/building-a-recognizable-reels-brand-aesthetic`, `/resources/visual-brand-identity-checklist-for-creators` | Signature audit checklist |
| UGC deal terms | `/resources/usage-rights-whitelisting-revisions-brand-deal-guide` | `/resources/perpetual-usage-rights-vs-organic-post-fees`, `/resources/normal-revision-limits-for-brand-deals`, `/resources/handling-major-ugc-revision-requests` | Fee table; revision scripts |
| UGC briefs | `/resources/brand-safe-ugc-brief` | `/resources/how-to-make-a-solid-ugc-brief`, `/resources/skincare-brand-ugc-brief-framework` | Skincare claim-safety examples |
| Studio and gear | `/resources/filming-reels-without-a-cameraman`, `/resources/small-space-content-creation-studio-setup`, `/resources/studio-lighting-setups-for-solo-creators`, `/resources/how-to-film-high-quality-reels-with-iphone-only` | `/resources/solo-creator-tripod-and-mount-hacks`, `/resources/minimalist-aesthetic-home-studio-setup`, `/resources/zero-budget-lighting-hacks-for-creators`, `/resources/iphone-cinematic-mode-for-reels` | Mount list; no-cost light setups; cinematic-mode settings |
| Craft filming | `/resources/hands-only-craft-and-product-filming` | `/resources/handmade-craft-product-process-filming` | Process-sequence shots |
| Fitness | `/resources/fitness-coach-high-ticket-content-plan` | `/resources/wellness-fitness-high-ticket-lead-gen` | Lead-gen CTA structure |
| Instagram plan (legacy) | `/services/custom-instagram-content-plan` | `/resources/content-strategist-for-instagram-creators`, `/resources/done-for-you-content-planning-structure` | DIY vs strategist vs brief comparison |
| Time and overwhelm | `/resources/why-is-content-creation-so-hard` | `/resources/content-creation-takes-too-much-time` (shingle overlap 67%) | Time-audit section |
| Batching | `/resources/batch-content-without-burnout` | `/resources/one-hour-a-week-content-batching-system` | One-hour weekly schedule |

Other editorial follow-ups:

- **Retitle `/resources/batch-content-without-burnout`** to lead with "How to Batch Content", and set its registry `keyword` to `how to batch content`.
- **The `/reels` hub now lists two articles.** Either move reels-specific legacy guides into the section (`/resources/reels-script-frameworks`, `/resources/instagram-reels-shoot-plan`), which needs registry entries and WebP art, or fold `/reels` into `/content-ideas`.
- **The registry template is the underlying problem.** The remaining registry pages still share 55–75% of their phrasing:
  - "Quick answer"
  - "First remove the performance demand"
  - "Deliverables / Working process / Quality and originality standard"
  - "Judge the product through the production handoff"

  Rewriting the repeated sections page by page, starting with the cluster winners above, matters more than adding pages. Pause new page production until the indexed share rises.
- **Differentiate** `/resources/idea-to-shoot-ready-brief` from `/content-ideas/ecommerce-content-ideas` (cosine 0.82, from a shared template, with different intents).

## Kept as they are

These pages were reviewed and stay separate because they serve a different intent or are the only page for their query:

- **Tools:** all six `/tools/*` registry pages, plus the three interactive tools.
- **Niche content-ideas pillars:** comedy, education, parenting, ecommerce, food, fitness, travel, UGC and makeup.
- **Skincare:** `/creator-lanes/skincare-content-ideas`, kept because "skincare content ideas" has its own volume.
- **Outfits:** `/creator-lanes/outfit-reels-ideas`, cosine 0.41 with the fashion page.
- **Personas:** `/creator-personas/brand-ready-creator` and `/creator-personas/ugc-content-strategy`.
- **Services:** `/services/ugc-creative-strategy-service`, the brand-side commercial intent.
- **`/resources/private-creative-direction-instagram-creators`:** cosine 0.15 with the creative-direction service page, and a strategy guide rather than a service page.

## Before deploying (needs the owner)

1. **Check winners against what Google has indexed.** In Search Console, open Pages, then Indexed, and export the list. If a merged URL is indexed but its winner is not, swap the two in `lib/seo-consolidation.json`. That is a one-line change, and the integrity check will catch chains.
2. **Deploy to production.** This needs the owner's approval. This branch has not been deployed.
3. **After deploying:**
   - Resubmit `https://anomalybox.com/sitemap.xml`.
   - Use URL Inspection and "Request indexing" on the P0 and P1 winners.
   - Ping IndexNow (`npm run distribution:indexnow`).
4. **Monitor for 4–6 weeks.**
   - The 46 merged URLs should move to "Page with redirect".
   - "Crawled – currently not indexed" should shrink.
   - Watch impressions on the primary keywords above.
   - Do not remove the redirects. Keep them permanently.

## Verification (this branch)

- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run build`, including `prebuild` (integrity, editorial and readability audits): pass. The integrity check reports "46 URLs consolidated into 31 winners".
- **Local crawl** of `next start`, run with `npm run audit:consolidation -- http://localhost:3123` (`tools/check-consolidation-crawl.mjs`):
  - All **211** sitemap URLs return 200, have a self-referencing canonical, and carry no `noindex` (meta or header).
  - All **49** redirects (46 articles and 3 hub pages) return 308 to the expected winner, and the winner returns 200, so each is one hop.
  - No crawled page links to a merged URL.
  - `/feed.xml` and `/llms.txt` no longer list merged URLs.
