# AnomalyBox Site Content, SEO and Visual Polish Audit

Date: 2026-08-10  
Scope: all 257 URLs in the production sitemap, all 235 article Markdown sources, the 112-page curated SEO registry, 123 legacy resources, and the 286-route production build.

## Executive summary

The public routing and metadata foundation is healthy: the crawl found no HTTP failures, broken internal links, H1 errors, missing metadata, or canonical errors. The most visible defect was the custom Markdown renderer. It printed Markdown links and lists as plain text, while 35 articles also rendered two Related guides sections. Those defects are fixed in this pass, together with six malformed code fences that trapped the rest of an article inside a code block.

The editorial source pass is now complete. All 235 Markdown sources meet the 600–1,200 word range, contain no empty or repeated H2 headings, and pass the public-language audit. The 123 resource articles also pass the originality gate without exact duplicate paragraphs, near-duplicate bodies, internal pipeline language or viral-card training bleed.

## Evidence and current gates

### Live crawl before this pass

- Sitemap URLs: 257
- HTTP errors: 0
- Broken internal links: 0
- H1 errors: 0
- Metadata errors: 0
- Canonical errors: 0
- Duplicate Related guides sections: 35 pages
- Unresolved Markdown links visible as text: 114 pages
- Internal production/SEO terminology visible: 235 pages
- Pages flagged for unlabelled decorative images: 2

### Clean-build crawl after the fixes

- Sitemap URLs: 257
- Internal links discovered: 132
- HTTP errors: 0
- Broken internal links: 0
- H1 errors: 0
- Metadata errors: 0
- Canonical errors: 0
- Duplicate Related guides sections: 0
- Duplicate rendered H2 headings: 0
- Unresolved Markdown: 0
- Missing image alt/decoration semantics: 0
- Internal production terminology: 0, excluding terminology intentionally used as the topic of its own guide

## Fixed in this pass

1. Markdown links now render as real internal Next.js links or safe external anchors.
2. Consecutive bullet and numbered items now use semantic `ul` and `ol` markup.
3. Blockquotes, inline code, italics, horizontal rules, tables and fenced code blocks receive explicit rendering.
4. Embedded Markdown Related guides blocks are removed before rendering; the validated link graph owns the single visible module.
5. Related guide targets are filtered for valid paths, self-links and duplicates.
6. Six malformed inline code-fence openings were corrected and the 235-entry Markdown map was regenerated.
7. Empty and repeated H2 headings are suppressed in rendered output.
8. Decorative images are explicitly marked as presentation-only.
9. A dependency-free full-site crawler was added as `npm run audit:live-content`.
10. Prebuild integrity now rejects unbalanced code fences, stale Markdown maps and invalid related-link targets.

## Remaining findings

### Completed — Source-content originality and usefulness

- All 235 source files are between 600 and 1,200 words.
- Empty and repeated H2 headings: 0.
- Public editorial-instruction and internal pipeline leaks: 0.
- Exact repeated paragraphs in the 123-resource corpus: 0.
- Duplicate title-stripped resource bodies: 0.
- Near-duplicate resource pairs at Jaccard >= 0.70: 0.
- Originality gate: 123 PASS, 0 REVIEW_REQUIRED, 0 FAIL_DUPLICATE.
- The resource pipeline remains isolated from viral-card training data.

### P1 — Search intent and cannibalization

- Compare the 123 legacy `/resources/*` pages against the 112 curated pages by primary intent, not slug alone.
- For each overlap choose one action: merge and 301 redirect, retain with a narrower intent, or remove from the sitemap and apply `noindex` during review.
- Preserve useful backlinks and existing URLs through redirects; do not delete legacy routes in bulk.
- Rewrite repeated FAQs so each page answers topic-specific questions rather than shared boilerplate.
- Add visible reviewer/last-reviewed information where it improves trust, while keeping machine dates aligned with actual edits.

### P1 — Article visual polish

- Reduce long-form reading width from the current broad `max-w-4xl` treatment to a 65–75 character text measure while allowing images, tables and code to break wider.
- Add a compact on-page contents navigation for articles with at least four meaningful H2 sections; collapse it on mobile.
- Keep one visual treatment per content role: Quick take, decision table, code/template, FAQ and next step. Avoid styling every paragraph as a card.
- Improve Related guides cards with a clearer directional cue, visible focus state and concise section label.
- Add a quiet “reviewed” line and reading-time estimate only if calculated from the final rendered copy.

### P1 — Hub visual polish

- The 112-card `/resources` grid is too dense as a first decision surface.
- Introduce server-rendered section filters, keyword search and a featured/most-useful first row.
- Use progressive pagination or “load more” without hiding indexable links from the initial HTML/sitemap.
- Keep one primary decision per card and avoid adding extra badges or competing CTAs.

### P2 — Performance and accessibility

- Run desktop and mobile Lighthouse against the hub plus one page from each route template.
- Validate LCP, INP and CLS after adding navigation or filtering; keep image dimensions reserved.
- Complete keyboard traversal for header, filters, article links, tables and Related guides.
- Test 390 px, 768 px and 1440 px widths; specifically check long headings, code blocks and tables for horizontal overflow.
- Respect reduced motion and avoid decorative animation in long-form reading views.

## Delivery plan

### Phase 1 — Editorial source cleanup (completed)

1. Produce a page-level inventory of duplicate paragraphs, empty sections and repeated FAQs.
2. Prioritize the 112 curated pages, starting with the five sub-600-word pages and the pages with three repeated sections.
3. Rewrite in clusters of 10–15 pages with a human review checkpoint after each cluster.
4. Regenerate `seo-package-markdown.json` and require the content integrity gate before merge/deploy.

Exit gate met: no empty H2s, no duplicate H2s within a page, every article is 600–1,200 words, and no cross-topic or internal pipeline language remains.

### Phase 2 — Legacy consolidation

1. Build a semantic overlap matrix between 123 legacy and 112 curated pages.
2. Decide keep/merge/redirect/noindex per URL.
3. Rewrite retained legacy pages for distinct intent and evidence.
4. Update sitemap, internal links and redirect map together.

Exit gate: one primary URL per search intent, no redirect chains, no orphaned retained pages and no sitemap URLs returning non-200 responses.

### Phase 3 — Article and hub polish

1. Refine reading measure, table/code width and responsive spacing.
2. Add accessible contents navigation and improve Related guides interaction.
3. Recompose `/resources` with filters, featured routes and progressive discovery.
4. Test keyboard, mobile and reduced-motion behavior.

Exit gate: desktop/mobile visual review approved, no overflow at target widths, and Lighthouse/CWV checks recorded.

### Phase 4 — Ongoing release gate

Run before every production release:

```powershell
npm.cmd run test:seo-package
npm.cmd run audit:seo
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run audit:live-content
```

The live-content audit should run against the preview deployment first and production after promotion.
