-- SEO Content Writing Rules Seed
-- 50 curated rules derived from:
--   The Art of SEO, Content Chemistry, Product-led SEO,
--   Answer Engine Optimization, Everybody Writes, They Ask You Answer,
--   SEO-2024-Checklist, Technical SEO Guide
--
-- Each rule follows the SCR-NNN format and maps to an seo_layer.

insert into public.seo_content_rules (id, rule_name, seo_layer, rule_text, when_to_apply, avoid_when, examples, priority) values

-- ═══════════════════════════════════════════════════════════════════
-- ON-PAGE SEO (SCR-001 → SCR-010)
-- ═══════════════════════════════════════════════════════════════════
('SCR-001', 'Primary Keyword in H1', 'on_page_seo',
 'The H1 tag must contain the primary target keyword naturally. Place it as close to the beginning as readability allows. Every page should have exactly one H1.',
 array['blog posts', 'landing pages', 'product pages', 'pillar content'],
 array['brand storytelling pages', 'about pages where brand name is the H1'],
 '[{"good":"How to Do Keyword Research: A Step-by-Step Guide","bad":"A Guide You Need to Read"}]'::jsonb, 95),

('SCR-002', 'Meta Description with CTA', 'on_page_seo',
 'Write a meta description between 150-160 characters. Include the primary keyword naturally and end with a clear call-to-action or value proposition. This is your SERP ad copy.',
 array['all indexable pages', 'blog posts', 'product pages'],
 array['noindex pages', 'paginated archive pages'],
 '[{"good":"Learn keyword research in 7 steps. Discover free tools, competitor analysis tips & long-tail strategies. Start ranking today →","bad":"This page is about keyword research and SEO tips."}]'::jsonb, 94),

('SCR-003', 'Descriptive URL Slugs', 'on_page_seo',
 'Keep URL slugs short (3-5 words), lowercase, hyphen-separated, and keyword-rich. Remove stop words (a, the, and, of). Never use auto-generated IDs or dates in URLs.',
 array['new pages', 'blog posts', 'category pages'],
 array['API endpoints', 'temporary redirect pages'],
 '[{"good":"/keyword-research-guide","bad":"/2026/08/05/the-ultimate-guide-to-doing-keyword-research-for-seo"}]'::jsonb, 90),

('SCR-004', 'Image Alt Text Optimization', 'on_page_seo',
 'Every image must have descriptive alt text that naturally includes a relevant keyword. Describe what the image shows for accessibility first, SEO second. Keep under 125 characters.',
 array['blog images', 'product photos', 'infographics', 'diagrams'],
 array['decorative spacer images', 'CSS background images'],
 '[{"good":"alt=\"Keyword research spreadsheet showing search volume and difficulty columns\"","bad":"alt=\"image1\" or alt=\"keyword research keyword research SEO\""}]'::jsonb, 88),

('SCR-005', 'Header Hierarchy (H2-H4)', 'on_page_seo',
 'Use H2 tags for main sections and H3/H4 for subsections. Include secondary and LSI keywords in subheadings. Headers should create a scannable outline of the content. Never skip heading levels.',
 array['long-form content', 'guides', 'how-to articles'],
 array['short social posts', 'email content'],
 '[{"good":"H2: Types of Keywords → H3: Short-Tail Keywords → H3: Long-Tail Keywords","bad":"Using bold text instead of proper heading tags"}]'::jsonb, 87),

('SCR-006', 'Internal Linking Strategy', 'on_page_seo',
 'Include 2-5 internal links per 1000 words pointing to relevant pillar pages, related posts, or conversion pages. Use descriptive anchor text with relevant keywords — never "click here".',
 array['blog posts', 'pillar content', 'resource pages'],
 array['landing pages focused on conversion', 'exit-intent pages'],
 '[{"good":"Learn more in our <a href=\"/keyword-research-guide\">complete keyword research guide</a>","bad":"Click <a href=\"/page\">here</a> for more"}]'::jsonb, 86),

('SCR-007', 'First Paragraph Answer', 'on_page_seo',
 'Answer the primary search query within the first 100 words. This increases chances of appearing in featured snippets and satisfies user intent immediately. Use the inverted pyramid style.',
 array['informational queries', 'how-to content', 'definition pages'],
 array['narrative storytelling', 'opinion pieces', 'case studies that need buildup'],
 '[{"good":"Keyword research is the process of finding and analyzing search terms that people enter into search engines. It helps you understand what your audience is looking for and prioritize content creation.","bad":"In this article, we will discuss many things about SEO and eventually talk about keywords..."}]'::jsonb, 92),

('SCR-008', 'Keyword in First 100 Words', 'on_page_seo',
 'Include the primary keyword within the first 100 words of body content. This signals topic relevance to search engines and confirms user intent match immediately.',
 array['all content pages', 'blog posts', 'landing pages'],
 array['creative fiction', 'brand manifesto pages'],
 '[]'::jsonb, 85),

('SCR-009', 'Optimal Content Length', 'on_page_seo',
 'Match content length to search intent: informational/guide queries need 1,500-3,000+ words; transactional/product pages need 300-800 focused words. Check top 10 SERP results for length benchmarks.',
 array['new content creation', 'content updates', 'competitive content'],
 array['FAQ answers that should be concise', 'news/time-sensitive content'],
 '[]'::jsonb, 80),

('SCR-010', 'Schema Markup Implementation', 'on_page_seo',
 'Add appropriate schema markup (JSON-LD): Article, FAQ, HowTo, Product, BreadcrumbList, Organization. This enables rich snippets in SERPs and increases CTR by 20-30%.',
 array['blog posts (Article)', 'FAQ pages (FAQPage)', 'tutorials (HowTo)', 'product pages (Product)'],
 array['internal tools', 'login/dashboard pages'],
 '[]'::jsonb, 83),

-- ═══════════════════════════════════════════════════════════════════
-- CONTENT WRITING (SCR-011 → SCR-020)
-- ═══════════════════════════════════════════════════════════════════
('SCR-011', 'Bucket Brigades for Retention', 'content_writing',
 'Use bucket brigade phrases to keep readers scrolling: "Here''s the thing:", "But wait, there''s more:", "Now, here''s where it gets interesting:", "The best part?". Place them every 200-300 words in long content.',
 array['long-form blog posts', 'guides over 1500 words', 'listicles'],
 array['academic/formal content', 'technical documentation', 'legal pages'],
 '[{"good":"You might think keyword research is simple. Here''s the deal: most people skip the most critical step...","bad":"Additionally, the next point to consider is..."}]'::jsonb, 78),

('SCR-012', 'Power Words in Headlines', 'content_writing',
 'Include at least one power word in headlines: Ultimate, Proven, Essential, Complete, Step-by-Step, Free, Secret, Mistakes, Boost, Transform. Combine with numbers for higher CTR.',
 array['blog post titles', 'email subject lines', 'social media headlines'],
 array['formal reports', 'academic papers', 'legal documents'],
 '[{"good":"7 Proven Keyword Research Strategies That Actually Work","bad":"Information About Keyword Research Methods"}]'::jsonb, 82),

('SCR-013', 'Scannable Content Structure', 'content_writing',
 'Make content scannable: short paragraphs (2-3 sentences max), bullet points for lists, bold key phrases, use whitespace generously. 79% of users scan rather than read word-by-word.',
 array['all web content', 'blog posts', 'landing pages'],
 array['long-form narratives intentionally designed for deep reading'],
 '[]'::jsonb, 85),

('SCR-014', 'Active Voice Priority', 'content_writing',
 'Write in active voice at least 80% of the time. Active voice is clearer, more engaging, and typically shorter. "Google ranks pages" not "Pages are ranked by Google".',
 array['all content types', 'especially instructional content'],
 array['scientific/academic writing where passive is convention'],
 '[{"good":"Google uses over 200 ranking factors to evaluate your page.","bad":"Over 200 ranking factors are used by Google for the evaluation of your page."}]'::jsonb, 76),

('SCR-015', 'Table of Contents for Long Content', 'content_writing',
 'Add a clickable table of contents with anchor links for content over 2,000 words. This improves UX, enables sitelink-like SERP features, and reduces bounce rate.',
 array['guides', 'pillar content', 'tutorials', 'resource pages'],
 array['short posts under 1000 words', 'news articles', 'product pages'],
 '[]'::jsonb, 74),

('SCR-016', 'Compelling Introduction Formula', 'content_writing',
 'Use the PAS formula for introductions: Problem (identify pain), Agitate (amplify the problem), Solution (promise the answer). Alternative: Hook → Context → Promise. Never start with "In this article...".',
 array['blog posts', 'landing pages', 'email content'],
 array['technical docs', 'API documentation', 'changelog entries'],
 '[{"good":"Spending hours on keyword research with zero results? You''re not alone—83% of marketers waste time on vanity keywords. This guide shows you the exact 7-step process top SEOs use.","bad":"In this article, we will discuss keyword research and its importance for SEO."}]'::jsonb, 84),

('SCR-017', 'Strategic CTA Placement', 'content_writing',
 'Place calls-to-action at 3 points: after the introduction (soft CTA), mid-content (contextual CTA), and at the conclusion (strong CTA). Match CTA to the content''s search intent stage.',
 array['blog posts', 'landing pages', 'product content'],
 array['purely educational content where hard selling hurts trust'],
 '[]'::jsonb, 77),

('SCR-018', 'Data and Statistics Usage', 'content_writing',
 'Support claims with data, statistics, and research citations. Link to original sources. Content with data gets 73% more backlinks. Use recent stats (within 2 years) when possible.',
 array['thought leadership', 'research-backed content', 'comparison posts'],
 array['opinion pieces clearly labeled as personal views'],
 '[{"good":"According to a 2024 Ahrefs study, 96.55% of pages get zero organic traffic from Google.","bad":"Most pages don''t get any traffic."}]'::jsonb, 79),

('SCR-019', 'Readability Score Target', 'content_writing',
 'Aim for a Flesch Reading Ease score of 60-70 (8th-9th grade level) for general audiences. Use short sentences (under 20 words), simple vocabulary, and conversational tone.',
 array['B2C content', 'general audience blogs', 'how-to guides'],
 array['B2B enterprise content', 'medical/legal specialized content'],
 '[]'::jsonb, 72),

('SCR-020', 'Transition Words Usage', 'content_writing',
 'Use transition words in at least 30% of sentences: Furthermore, However, Therefore, In addition, As a result, For example, Meanwhile. This improves readability and logical flow.',
 array['all content types'],
 array['poetic/creative content where transitions may feel forced'],
 '[]'::jsonb, 68),

-- ═══════════════════════════════════════════════════════════════════
-- CONTENT STRATEGY (SCR-021 → SCR-028)
-- ═══════════════════════════════════════════════════════════════════
('SCR-021', 'Topic Cluster Architecture', 'content_strategy',
 'Organize content in topic clusters: one comprehensive pillar page (3,000+ words) surrounded by 8-15 cluster pages that link back to the pillar. Each cluster targets a specific long-tail variation of the pillar topic.',
 array['content planning', 'site architecture', 'new topic launches'],
 array['one-off promotional content', 'news/time-sensitive topics'],
 '[]'::jsonb, 88),

('SCR-022', 'Search Intent Matching', 'content_strategy',
 'Identify and match search intent before writing: Informational (how/what/why → guide/tutorial), Navigational (brand → landing page), Commercial (best/review → comparison), Transactional (buy/price → product page). Never create content that mismatches intent.',
 array['all content creation', 'content audits', 'keyword selection'],
 array[]::text[],
 '[{"good":"Query ''best keyword tools'' → Write a comparison/review post with pros, cons, pricing","bad":"Query ''best keyword tools'' → Write a generic definition of keyword research"}]'::jsonb, 93),

('SCR-023', 'Content Gap Analysis', 'content_strategy',
 'Analyze top 10 SERP competitors for your target keyword. Identify topics, subtopics, and questions they cover that you don''t. Create content that fills these gaps AND adds unique value (original data, expert quotes, better visuals).',
 array['competitive content', 'content updates', 'pillar page creation'],
 array['brand-new topics with no SERP competition'],
 '[]'::jsonb, 82),

('SCR-024', 'E-E-A-T Signals', 'content_strategy',
 'Demonstrate Experience, Expertise, Authoritativeness, and Trustworthiness: author bio with credentials, cite authoritative sources, show first-hand experience, include original research/screenshots, link to .edu/.gov sources when relevant.',
 array['YMYL content', 'health/finance topics', 'all content for trust building'],
 array[]::text[],
 '[]'::jsonb, 91),

('SCR-025', 'Content Refresh Cadence', 'content_strategy',
 'Audit and refresh top-performing content every 6-12 months: update statistics, add new sections, refresh screenshots, improve internal links. Refreshed content can recover and exceed its original ranking.',
 array['existing content over 6 months old', 'declining traffic pages', 'evergreen content'],
 array['time-stamped news articles', 'event-specific content'],
 '[]'::jsonb, 75),

('SCR-026', 'They Ask You Answer Framework', 'content_strategy',
 'Create content that directly answers your audience''s real questions. Focus on: pricing/cost transparency, problems with your product/service, comparisons with competitors, reviews, and "best of" lists. Radical transparency builds trust and organic traffic.',
 array['service businesses', 'B2B content', 'SaaS blogs'],
 array['entertainment content', 'creative/artistic content'],
 '[]'::jsonb, 80),

('SCR-027', 'Evergreen vs Trending Balance', 'content_strategy',
 'Maintain an 80/20 content ratio: 80% evergreen (permanently relevant) and 20% trending/timely. Evergreen content compounds traffic over time; trending content captures spikes and freshness signals.',
 array['content calendar planning', 'editorial strategy'],
 array['pure news sites', 'event-focused publications'],
 '[]'::jsonb, 73),

('SCR-028', 'Product-Led SEO Approach', 'content_strategy',
 'Create content where your product is the natural solution to the search query. The content should be genuinely useful even without the product, but the product should feel like the obvious next step.',
 array['SaaS blogs', 'tool-related content', 'product feature pages'],
 array['awareness-stage content', 'pure thought leadership'],
 '[]'::jsonb, 79),

-- ═══════════════════════════════════════════════════════════════════
-- KEYWORD RESEARCH (SCR-029 → SCR-034)
-- ═══════════════════════════════════════════════════════════════════
('SCR-029', 'Long-Tail Keyword Priority', 'keyword_research',
 'Prioritize long-tail keywords (3-5 words) for new and low-authority sites. They have lower competition, higher conversion intent, and are easier to rank for. Group related long-tails into content clusters.',
 array['new websites', 'competitive niches', 'conversion-focused pages'],
 array['established high-authority sites targeting head terms'],
 '[{"good":"Target ''best keyword research tools for beginners 2026'' (low KD, high intent)","bad":"Target ''SEO'' or ''keywords'' (extremely competitive, vague intent)"}]'::jsonb, 86),

('SCR-030', 'Search Intent Classification', 'keyword_research',
 'Classify every target keyword by intent before creating content: Informational (learn), Commercial Investigation (compare), Transactional (buy), Navigational (find). Map intent to content format: info → guide, commercial → comparison, transactional → product page.',
 array['keyword selection', 'content planning', 'SERP analysis'],
 array[]::text[],
 '[]'::jsonb, 89),

('SCR-031', 'Keyword Clustering', 'keyword_research',
 'Group semantically related keywords into clusters. Target one cluster per page rather than one keyword. A single well-optimized page can rank for 100+ related keywords. Use SERP overlap analysis to validate clusters.',
 array['content planning', 'existing content optimization', 'site architecture'],
 array['single-product landing pages with one clear target'],
 '[]'::jsonb, 84),

('SCR-032', 'SERP Feature Targeting', 'keyword_research',
 'Analyze SERP features for target keywords (featured snippets, PAA, image pack, video carousel, knowledge panel). Format content specifically to win these features: tables for comparison snippets, numbered lists for how-to snippets, concise definitions for definition snippets.',
 array['informational queries', 'question-based queries', 'comparison queries'],
 array['navigational queries', 'branded queries'],
 '[]'::jsonb, 81),

('SCR-033', 'Competitor Keyword Gap', 'keyword_research',
 'Identify keywords your competitors rank for that you don''t. Prioritize keywords where multiple competitors rank but you''re absent — these represent proven demand and achievable opportunities.',
 array['content strategy', 'SEO audits', 'quarterly planning'],
 array['brand-new market categories with no competitors'],
 '[]'::jsonb, 78),

('SCR-034', 'Semantic Keyword Expansion', 'keyword_research',
 'Expand beyond exact-match keywords to include LSI (Latent Semantic Indexing) terms, synonyms, related entities, and natural language variations. Use tools like Google''s "People Also Ask" and "Related Searches" for expansion.',
 array['content writing', 'on-page optimization', 'content enrichment'],
 array[]::text[],
 '[]'::jsonb, 77),

-- ═══════════════════════════════════════════════════════════════════
-- TECHNICAL SEO (SCR-035 → SCR-040)
-- ═══════════════════════════════════════════════════════════════════
('SCR-035', 'Core Web Vitals Optimization', 'technical_seo',
 'Meet Google''s Core Web Vitals thresholds: LCP (Largest Contentful Paint) < 2.5s, INP (Interaction to Next Paint) < 200ms, CLS (Cumulative Layout Shift) < 0.1. These are ranking factors since 2021.',
 array['all public pages', 'especially mobile pages'],
 array['internal admin tools', 'development environments'],
 '[]'::jsonb, 90),

('SCR-036', 'Canonical URL Strategy', 'technical_seo',
 'Set self-referencing canonical tags on all pages. For duplicate/similar content, point canonicals to the preferred version. This prevents keyword cannibalization and consolidates link equity.',
 array['all indexable pages', 'paginated content', 'filtered/sorted pages'],
 array['noindex pages'],
 '[]'::jsonb, 85),

('SCR-037', 'XML Sitemap Best Practices', 'technical_seo',
 'Include only indexable, canonical URLs in your XML sitemap. Keep sitemaps under 50,000 URLs / 50MB. Use lastmod dates accurately. Submit via Google Search Console. Exclude noindex, redirected, and 4xx pages.',
 array['site launches', 'large sites', 'after major content changes'],
 array['small sites under 10 pages with good internal linking'],
 '[]'::jsonb, 80),

('SCR-038', 'Mobile-First Content Design', 'technical_seo',
 'Design and write content mobile-first: responsive images, readable font sizes (16px+ body), touch-friendly buttons (44x44px+), no horizontal scrolling. Google uses mobile-first indexing for all sites.',
 array['all web content', 'redesigns', 'new page templates'],
 array['desktop-only internal tools'],
 '[]'::jsonb, 88),

('SCR-039', 'Robots.txt and Crawl Budget', 'technical_seo',
 'Configure robots.txt to block crawling of low-value pages (admin, search results, tag archives, login). Preserve crawl budget for important content. Never block CSS/JS files needed for rendering.',
 array['large sites (1000+ pages)', 'sites with faceted navigation', 'e-commerce sites'],
 array['small sites under 100 pages'],
 '[]'::jsonb, 76),

('SCR-040', 'HTTPS and Security', 'technical_seo',
 'Ensure all pages use HTTPS. Implement HSTS headers. HTTPS has been a ranking signal since 2014. Mixed content (HTTP resources on HTTPS pages) can cause security warnings and ranking issues.',
 array['all public websites'],
 array['local development environments'],
 '[]'::jsonb, 82),

-- ═══════════════════════════════════════════════════════════════════
-- LINK BUILDING (SCR-041 → SCR-044)
-- ═══════════════════════════════════════════════════════════════════
('SCR-041', 'Linkable Asset Creation', 'link_building',
 'Create content specifically designed to attract backlinks: original research/surveys, comprehensive guides, free tools/calculators, infographics with embed codes, industry statistics pages. These "linkable assets" earn links passively.',
 array['content marketing', 'link building campaigns', 'authority building'],
 array['product/sales pages', 'transactional content'],
 '[]'::jsonb, 83),

('SCR-042', 'Anchor Text Diversity', 'link_building',
 'Maintain natural anchor text distribution in your link profile: ~50% branded, ~20% URL/naked, ~15% generic ("click here", "learn more"), ~10% partial match, ~5% exact match. Over-optimized anchor text triggers penalties.',
 array['link building', 'internal linking audits', 'guest posting'],
 array[]::text[],
 '[]'::jsonb, 79),

('SCR-043', 'Broken Link Reclamation', 'link_building',
 'Find broken links pointing to competitors'' dead pages. Create equivalent or better content on your site. Reach out to linking sites offering your content as a replacement. This is one of the highest-converting outreach tactics.',
 array['link building campaigns', 'competitive SEO'],
 array['new sites with no competitive intelligence'],
 '[]'::jsonb, 74),

('SCR-044', 'Digital PR for Links', 'link_building',
 'Create newsworthy content (surveys, studies, data analysis, expert roundups) and pitch to journalists/bloggers via personalized outreach. One high-authority .edu or .gov backlink can outweigh hundreds of low-quality links.',
 array['authority building', 'brand awareness campaigns'],
 array['local businesses with hyper-local focus only'],
 '[]'::jsonb, 76),

-- ═══════════════════════════════════════════════════════════════════
-- ANSWER ENGINE OPTIMIZATION (SCR-045 → SCR-048)
-- ═══════════════════════════════════════════════════════════════════
('SCR-045', 'Featured Snippet Optimization', 'answer_engine_optimization',
 'Structure content to win featured snippets: use a concise 40-60 word definition paragraph immediately after the H2 question, create comparison tables, use numbered/ordered lists for processes. The "snippet bait" technique: ask the question in H2, answer in the next element.',
 array['informational queries', 'how-to queries', 'definition queries'],
 array['transactional queries', 'navigational queries'],
 '[{"good":"## What Is Keyword Research?\\nKeyword research is the SEO practice of finding, analyzing, and selecting search terms that people type into search engines to use that data for content strategy and optimization.","bad":"Keyword research is very important and there are many things to know about it..."}]'::jsonb, 87),

('SCR-046', 'People Also Ask Targeting', 'answer_engine_optimization',
 'Research and include "People Also Ask" questions as H2/H3 subheadings in your content. Provide concise 2-3 sentence answers immediately below each question heading. This dramatically increases visibility in PAA boxes.',
 array['informational content', 'FAQ pages', 'comprehensive guides'],
 array['product pages', 'checkout flows'],
 '[]'::jsonb, 83),

('SCR-047', 'FAQ Schema Implementation', 'answer_engine_optimization',
 'Add FAQPage schema markup for pages with Q&A content. Each FAQ should have a unique question and substantive answer (50+ words). Limit to 5-10 FAQs per page for best results. This can double your SERP real estate.',
 array['FAQ sections', 'service pages', 'product pages', 'category pages'],
 array['pages with fewer than 3 genuine questions'],
 '[]'::jsonb, 81),

('SCR-048', 'AI Overview and SGE Optimization', 'answer_engine_optimization',
 'Optimize for AI-generated search results: provide clear, factual, well-structured answers; cite authoritative sources; use structured data; create content that AI can easily extract and cite. Focus on being the definitive source for your topic.',
 array['all informational content', 'especially YMYL topics'],
 array['purely promotional content', 'thin content'],
 '[]'::jsonb, 85),

-- ═══════════════════════════════════════════════════════════════════
-- SEO ANALYTICS & LOCAL SEO (SCR-049 → SCR-050)
-- ═══════════════════════════════════════════════════════════════════
('SCR-049', 'GA4 Event Tracking for Content', 'seo_analytics',
 'Set up GA4 custom events to track content engagement: scroll depth (25/50/75/100%), time on page thresholds (30s/60s/120s), CTA clicks, internal link clicks, and content downloads. Use this data to identify high-engagement content patterns.',
 array['content performance measurement', 'conversion optimization'],
 array['pages with no meaningful user interaction to measure'],
 '[]'::jsonb, 71),

('SCR-050', 'Google Business Profile Optimization', 'local_seo',
 'Optimize GBP: complete all fields, add 10+ high-quality photos, post weekly updates, respond to all reviews within 24h, use primary keyword in business description, add products/services with descriptions. Consistent NAP across all citations.',
 array['local businesses', 'multi-location businesses', 'service area businesses'],
 array['pure online businesses with no physical presence', 'SaaS companies'],
 '[]'::jsonb, 70),

-- ═══════════════════════════════════════════════════════════════════
-- 2026 AI SEARCH & AEO UPDATES (SCR-051 → SCR-060)
-- ═══════════════════════════════════════════════════════════════════
('SCR-051', 'Zero-Click Answer Summaries', 'answer_engine_optimization',
 'Provide a direct, bolded, 50-100 word summary answering the core intent of the page immediately below the H1 or introductory paragraph. This snippet is designed to be extracted directly by AI Overviews and SGE.',
 array['informational articles', 'how-to guides', 'definition pages'],
 array['creative storytelling pages', 'highly subjective personal essays'],
 '[{"good":"Provide a 2-sentence direct answer immediately after the intro.","bad":"Bury the answer in the 5th paragraph after long anecdotes."}]'::jsonb, 96),

('SCR-052', 'First-Hand Experience (E-E-A-T for AI)', 'content_strategy',
 'AI engines actively demote generic synthesis. Inject first-hand experience indicators: "In our testing of X...", "When I implemented Y...", original data, unique screenshots, and personal methodologies that AI cannot hallucinate.',
 array['reviews', 'tutorials', 'opinion pieces', 'case studies'],
 array['objective definition dictionaries', 'legal statutes'],
 '[]'::jsonb, 94),

('SCR-053', 'Entity Clustering and Semantic Density', 'answer_engine_optimization',
 'Shift from keywords to entities. Ensure your content mentions related people, places, concepts, and brands that exist in the Knowledge Graph. High entity density signals deep topical coverage to AI models.',
  array['comprehensive guides', 'pillar pages', 'industry overviews'],
  array[]::text[],
  '[]'::jsonb, 92),

('SCR-054', 'Structured Information Design', 'technical_seo',
 'AI models parse structure better than prose. Use bulleted lists, numbered steps, comparison tables, and definition formats (Term: Definition). Ensure every section has a clear, descriptive H2 or H3.',
  array['product comparisons', 'how-to tutorials', 'feature breakdowns'],
  array['narrative fiction', 'flow-of-consciousness writing'],
  '[]'::jsonb, 90),

('SCR-055', 'Community Signal Integration', 'content_strategy',
 'AI search highly weights community consensus (e.g., Reddit, Quora). Address common questions sourced directly from these communities, and if possible, embed or cite community discussions as proof of real user problems.',
  array['troubleshooting guides', 'product reviews', 'trend analysis'],
  array['purely academic papers', 'highly formal corporate announcements'],
  '[]'::jsonb, 88),

('SCR-056', 'Information Gain Optimization', 'content_writing',
 'Do not just summarize the top 10 SERP results. Add net-new information (Information Gain): a new perspective, original data, expert quote, or novel framework. If it doesn''t add new info, AI won''t cite it.',
  array['blog posts', 'industry reports', 'thought leadership'],
  array['standard operating procedures', 'legal terms'],
  '[]'::jsonb, 93),

('SCR-057', 'Conversational NLP Targeting', 'keyword_research',
 'Optimize for long, conversational AI prompts rather than short keywords. Target phrases like "What are the exact steps to..." or "Explain the difference between X and Y for a beginner" instead of just "X vs Y".',
  array['FAQ sections', 'informational hubs', 'glossaries'],
  array['ecommerce product titles', 'navigational pages'],
  '[]'::jsonb, 89),

('SCR-058', 'Frequent Content Refresh (Freshness Signal)', 'content_strategy',
 'AI engines prioritize up-to-date data. Add a "Last Updated: [Date]" and actively revise statistics, screenshots, and tools at least every 6-12 months. Mention the current year in context organically.',
  array['software reviews', 'SEO guides', 'industry benchmarks'],
  array['historical facts', 'evergreen timeless stories'],
  '[]'::jsonb, 91),

('SCR-059', 'Author Entity Verification', 'technical_seo',
 'Link content clearly to a verified human author with a dedicated bio page. The bio page must link to social profiles, publications, and credentials. AI must recognize the author as a verified entity in that niche.',
  array['YMYL (Your Money or Your Life) topics', 'expert blogs'],
  array['anonymous corporate press releases'],
  '[]'::jsonb, 95),

('SCR-060', 'Multimedia Contextualization', 'on_page_seo',
 'AI parses surrounding text to understand images/video. Always provide highly descriptive alt text, captions, and ensure the surrounding paragraph perfectly describes the visual asset to maximize multimodal search visibility.',
  array['image-heavy guides', 'data visualizations', 'infographics'],
  array['pure text pages'],
  '[]'::jsonb, 87),

-- ═══════════════════════════════════════════════════════════════════
-- GOOGLE HELPFUL CONTENT & INFORMATION GAIN (SCR-061 → SCR-065)
-- ═══════════════════════════════════════════════════════════════════
('SCR-061', 'Information Gain & Net-New Value', 'content_strategy',
 'Never spin or paraphrase competitor articles. Every piece of content must contain at least one net-new element: an original decision matrix, first-hand data, proprietary methodology, or unique case study.',
  array['all pillar content', 'how-to guides', 'industry reviews'],
  array['raw news reporting', 'legal statutory quotes'],
  '[]'::jsonb, 98),

('SCR-062', 'Anti-Article-Spinning Architecture', 'content_writing',
 'Do not follow the paragraph structure of top SERP competitors. Transform research notes using a new structural outline: Research Notes + Independent Sources + User Intent -> Unique Structure + Original Examples.',
  array['long-form blogs', 'guides', 'comparisons'],
  array[]::text[],
  '[]'::jsonb, 97),

('SCR-063', 'Source Grounding and Citation Ledger', 'content_strategy',
 'Every factual claim or statistic must link to a verified source_id in the Source Ledger. Refuse to generate unverified claims or hallucinated studies.',
  array['informational content', 'statistics guides', 'YMYL pages'],
  array['fiction', 'pure creative writing'],
  '[]'::jsonb, 96),

('SCR-064', 'Human Burstiness & Sentence Variety', 'content_writing',
 'Vary sentence length deliberately. Alternate 5-word impactful sentences with 25-word compound explanatory sentences to mimic natural human cadence and pass AI detector evaluations.',
  array['all articles', 'blog posts', 'guides'],
  array[]::text[],
  '[]'::jsonb, 94),

('SCR-065', 'Editorial Quality Gate Enforcement', 'content_strategy',
 'No content may be auto-published. Every draft must pass 3-layer deduplication (Exact Hash, 5-gram Jaccard < 0.70, Cosine Similarity < 0.88) and score >= 80% on the Editorial Quality Gate before final human approval.',
  array['publishing pipelines', 'cms integrations', 'wordpress drafts'],
  array[]::text[],
  '[]'::jsonb, 99),

-- ═══════════════════════════════════════════════════════════════════
-- IMAGE PLACEMENT & MULTIMODAL SEO (SCR-066 → SCR-070)
-- ═══════════════════════════════════════════════════════════════════
('SCR-066', 'Paragraph Proximity for Image Placement', 'on_page_seo',
 'Place images immediately adjacent to the exact paragraph or subheading they visually illustrate. Never clump images at the bottom of the article. Proximity allows Google Vision & AI Overviews to bind the image to the paragraph context.',
  array['blog posts', 'tutorials', 'product reviews'],
  array['generic image dumps'],
  '[]'::jsonb, 95),

('SCR-067', 'LCP Optimization with Modern Formats', 'technical_seo',
 'Ensure the Hero/LCP image uses Next.js Image or modern WebP/AVIF format with priority loading and srcset. Preload LCP images to pass Core Web Vitals.',
  array['above-the-fold hero sections', 'landing pages'],
  array[]::text[],
  '[]'::jsonb, 96),

('SCR-068', 'CLS Prevention via Explicit Dimensions', 'technical_seo',
 'Always specify explicit width and height attributes or aspect-ratio CSS for all image elements to reserve layout space and prevent Cumulative Layout Shift (CLS) penalties.',
  array['all responsive web pages', 'mobile templates'],
  array[]::text[],
  '[]'::jsonb, 94),

('SCR-069', 'Multimodal Alt Text & AI Context', 'on_page_seo',
 'Write concise, 80-140 character descriptive alt text explaining WHY the image matters in context. AI models treat alt text as primary textual evidence for generative citations.',
  array['all content images', 'infographics', 'diagrams'],
  array['decorative dividers (use alt="")'],
  '[]'::jsonb, 93),

('SCR-070', 'Image Structured Data & Figure Captions', 'technical_seo',
 'Wrap key images in semantic <figure> tags with <figcaption> and include high-resolution image URLs in Product, Article, or HowTo JSON-LD schema for Google Rich Results.',
  array['how-to guides', 'product showcases', 'case studies'],
  array[]::text[],
  '[]'::jsonb, 92),

-- ═══════════════════════════════════════════════════════════════════
-- ADVANCED 2026 AEO, INFORMATION GAIN & DECISION PROTOCOLS (SCR-071 → SCR-085)
-- ═══════════════════════════════════════════════════════════════════
('SCR-071', 'Conversational Voice & LLM Query Alignment', 'keyword_research',
 'Structure H2s and problem statements as explicit conversational questions mimicking natural speech and chatbot prompts (e.g., "What is the exact lighting setup for..." instead of "Lighting Overview").',
  array['guides', 'how-to articles', 'faq sections'],
  array['brand overview pages'],
  '[]'::jsonb, 96),

('SCR-072', 'Entity Authority & Graph Node Density', 'content_strategy',
 'Explicitly name connected entities (hardware models, software tools, industry standards, kelvin scales, codec specs) rather than using generic terminology, anchoring the article firmly in the knowledge graph.',
  array['all pillar content', 'technical tutorials', 'reviews'],
  array[]::text[],
  '[]'::jsonb, 97),

('SCR-073', 'Decision Matrix & Structured Trade-off Design', 'content_writing',
 'Every comprehensive guide must provide a 4-column structured decision matrix detailing the situation, operator action, verifiable evidence, and failure risk.',
  array['comparison guides', 'workflow articles', 'pillar resources'],
  array['short news posts'],
  '[]'::jsonb, 98),

('SCR-074', 'Direct Operational Proof Markers', 'content_writing',
 'Incorporate concrete, filmable parameters into instructions—such as exact lighting color temperatures (5600K vs 3200K), audio distances, or focal lengths—to establish undeniable first-party authority.',
  array['production guides', 'script breakdowns', 'tutorials'],
  array['philosophical essays'],
  '[]'::jsonb, 95),

('SCR-075', 'Zero-Fluff Answer Capsule Architecture', 'answer_engine_optimization',
 'Provide an unhedged, authoritative 50-70 word answer directly following the title/H1 that search engine AI Overviews and answer engines can cite word-for-word.',
  array['definition pages', 'process guides', 'how-to resources'],
  array['narrative fiction'],
  '[]'::jsonb, 99),

('SCR-076', 'Fillable Script & Brief Skeleton Formatting', 'content_writing',
 'Include copy-pasteable script and brief skeletons with defined bracketed variables, enabling creators to transfer advice directly to the shoot floor.',
  array['script guides', 'brief templates', 'ugc workflows'],
  array[]::text[],
  '[]'::jsonb, 93),

('SCR-077', 'First-Take Production Feasibility Check', 'content_strategy',
 'Ensure all recommended workflows can be executed within defined creator constraints (solo creator, home studio, constrained weekly capacity) rather than assuming full studio crews.',
  array['creator guides', 'batching systems', 'solo workflows'],
  array['enterprise commercial broadcast guides'],
  '[]'::jsonb, 91),

('SCR-078', 'Multimodal Spatial Context & Lighting Specifications', 'on_page_seo',
 'Describe spatial arrangement and lighting geometry in surrounding paragraphs so multimodal search crawlers can correlate text with accompanying diagrams and hero imagery.',
  array['visual guides', 'lighting tutorials', 'studio setups'],
  array[]::text[],
  '[]'::jsonb, 94),

('SCR-079', 'Audio Foley & Room Noise Standards for Video AEO', 'technical_seo',
 'Specify directional mic placement, background dB limits, and acoustic dampening rules to optimize short-form video transcripts for speech-to-text semantic indexing.',
  array['audio setup guides', 'asmr guides', 'video production tutorials'],
  array[]::text[],
  '[]'::jsonb, 90),

('SCR-080', 'Topic Cluster Silo Internal Anchor Linking', 'on_page_seo',
 'Include 2-4 contextual links to sister cluster articles with rich, descriptive anchor text reflecting the exact user job to build tight semantic topic silos.',
  array['all resource pages', 'pillar guides', 'templates'],
  array['isolated conversion checkout pages'],
  '[]'::jsonb, 96),

('SCR-081', 'Anti-AI Burstiness & Human Cadence Rhythm', 'content_writing',
 'Enforce varied sentence lengths across all paragraphs—combining short punchy directives with descriptive multi-clause explanations—to maintain natural human cadence.',
  array['all articles', 'guides', 'faqs'],
  array[]::text[],
  '[]'::jsonb, 97),

('SCR-082', 'Brand-Safety and Usage-Rights Boundary Enforcement', 'content_strategy',
 'Explicitly distinguish organic posting permissions from paid whitelisting and perpetual usage rights in creator contracts to eliminate ambiguity.',
  array['ugc contracts', 'brand briefs', 'creator agreements'],
  array[]::text[],
  '[]'::jsonb, 95),

('SCR-083', 'People-Also-Ask Long-Tail Semantic FAQ Structure', 'answer_engine_optimization',
 'End articles with at least 4 unique, highly specific FAQs directly matching common conversational questions in search engine knowledge panels.',
  array['all resource articles', 'service guides'],
  array[]::text[],
  '[]'::jsonb, 96),

('SCR-084', 'Source Transparency & Information Gain Verification', 'content_strategy',
 'Verify that each article introduces net-new frameworks, proprietary decision boundaries, or original checklists not present in competitor summaries.',
  array['all indexable resources', 'pillar content'],
  array[]::text[],
  '[]'::jsonb, 98),

('SCR-085', 'Core Web Vitals Preload & Next-Gen Visual Encoding', 'technical_seo',
 'Ensure editorial visual assets are encoded in modern WebP/AVIF format with explicit dimensions and preloaded LCP priorities to guarantee sub-second visual stability.',
  array['all public web pages', 'resource articles'],
  array[]::text[],
  '[]'::jsonb, 95)

on conflict (id) do update set
  rule_name = excluded.rule_name,
  seo_layer = excluded.seo_layer,
  rule_text = excluded.rule_text,
  when_to_apply = excluded.when_to_apply,
  avoid_when = excluded.avoid_when,
  examples = excluded.examples,
  priority = excluded.priority,
  updated_at = now();
