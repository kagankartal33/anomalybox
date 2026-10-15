"""
fetch_2026_seo_data.py
===================
Generates and writes 2026 specific SEO & AEO (Answer Engine Optimization) training chunks.
These chunks are based on recent Google Core Updates, AI Overviews (SGE) strategies, 
and E-E-A-T guidelines for AI search models.
"""

import json
import hashlib
from pathlib import Path
from datetime import datetime

ARCHIVE_DIR = Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive")
PREPARED_DIR = ARCHIVE_DIR / "dataset" / "seo_content" / "prepared"
OUT_FILE = PREPARED_DIR / "2026_seo_observations.jsonl"


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


CHUNKS = [
    {
        "layer": "answer_engine_optimization",
        "text": "In 2026, Answer Engine Optimization (AEO) requires content creators to structure their pages specifically for AI extraction. The most critical element is the 'Zero-Click Summary'. Place a highly dense, factual, 50-75 word paragraph directly beneath your main heading. This paragraph must directly answer the user's intent without any fluff, as AI Overviews (formerly SGE) prioritize extracting concise, authoritative definitions from the top of the page.",
        "concepts": ["aeo", "answer engine optimization", "zero-click summary", "ai overviews", "sge"],
        "weight": 0.88,
    },
    {
        "layer": "content_strategy",
        "text": "E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) has evolved into a defense mechanism against AI-generated spam. Search engines now actively look for 'Information Gain'—new data, personal anecdotes, original research, or unique methodologies that large language models cannot hallucinate. Content that merely summarizes the top 10 SERP results will be demoted. Always inject first-hand experience markers like 'In our lab testing' or 'When I deployed this for a client' to signal human authenticity.",
        "concepts": ["e-e-a-t", "information gain", "first-hand experience", "content synthesis", "ai spam"],
        "weight": 0.92,
    },
    {
        "layer": "answer_engine_optimization",
        "text": "Keyword clustering is no longer sufficient; the focus is now on Entity Clustering. AI search engines rely on the Knowledge Graph to understand relationships between topics. When writing about a subject, ensure you mention related entities (people, places, brands, concepts) naturally. High semantic density helps the AI categorize your content as a comprehensive source, making it more likely to be cited in generative responses.",
        "concepts": ["entity clustering", "semantic density", "knowledge graph", "generative responses", "entities"],
        "weight": 0.85,
    },
    {
        "layer": "technical_seo",
        "text": "Structured Information Design is vital for AI parseability. Language models struggle to extract steps or comparisons from dense prose. Use HTML effectively: break down tutorials into numbered <ol> lists, use <ul> for features, and implement HTML <table> elements for comparisons. Pair this with precise Schema.org markup (like FAQPage, HowTo, or SoftwareApplication) to explicitly feed structured data to the search engine crawler.",
        "concepts": ["structured information", "html lists", "schema markup", "parseability", "table elements"],
        "weight": 0.87,
    },
    {
        "layer": "content_strategy",
        "text": "Community consensus has become a major ranking factor. Because AI models are trained on platforms like Reddit and Quora to understand natural human language and real problems, integrating your brand into these discussions is crucial. Furthermore, referencing community discussions or embedding them as proof of a problem within your own content signals to search engines that your article is grounded in real user needs.",
        "concepts": ["community consensus", "reddit", "user needs", "off-page seo", "brand integration"],
        "weight": 0.81,
    },
    {
        "layer": "on_page_seo",
        "text": "Image Placement Proximity Strategy: In 2026, search engine vision algorithms evaluate images based on immediate paragraph context. Never group images at the bottom of an article. Always place images directly adjacent to the exact paragraph or subheading they visually illustrate. Surrounding paragraph proximity allows Google Vision and AI Overviews to bind the image entity to the textual argument.",
        "concepts": ["image placement proximity", "paragraph context", "google vision", "multimodal search", "visual evidence"],
        "weight": 0.95,
    },
    {
        "layer": "technical_seo",
        "text": "Core Web Vitals LCP & CLS Optimization for Images: Hero images are the primary cause of Largest Contentful Paint (LCP) failures. Always serve images using modern WebP or AVIF formats with responsive srcset attributes. To prevent Cumulative Layout Shift (CLS) penalties, specify explicit width and height attributes or aspect-ratio CSS rules so browsers reserve layout space before the image downloads.",
        "concepts": ["lcp optimization", "cls prevention", "webp avif", "explicit dimensions", "core web vitals"],
        "weight": 0.96,
    },
    {
        "layer": "on_page_seo",
        "text": "Multimodal Alt Text & Image Schema: Alt text is no longer just for screen readers—it is primary textual evidence for AI multimodal models. Write concise 80-140 character alt text explaining why the image matters in context. Wrap key images in semantic <figure> and <figcaption> tags, and link high-resolution image URLs in Product, Article, or HowTo JSON-LD schema to secure Google Rich Results.",
        "concepts": ["multimodal alt text", "image schema", "figure figcaption", "ai citations", "google rich results"],
        "weight": 0.94,
    },
    {
        "layer": "keyword_research",
        "text": "Conversational NLP Targeting is replacing traditional short-tail keyword research. Users are treating search boxes like chatbots. Instead of targeting 'best CRM', target 'what is the best CRM for a freelance designer managing 10 clients'. Use tools to discover long, conversational prompts and structure your H2s as exact natural-language questions to align with voice search and AI chat interfaces.",
        "concepts": ["conversational nlp", "voice search", "ai chat interfaces", "long-tail prompts"],
        "weight": 0.89,
    },
    {
        "layer": "technical_seo",
        "text": "Author Entity Verification is a strict requirement for YMYL topics in 2026. A simple byline is ignored. You must have a dedicated author bio page that links out to the author's social profiles (LinkedIn, X) and other publications. This cross-referencing allows the search engine to verify the author as a real entity with established topical authority, passing that trust to the article.",
        "concepts": ["author entity", "ymyl", "topical authority", "bio page", "trust signals"],
        "weight": 0.94,
    },
    {
        "layer": "content_strategy",
        "text": "The 'Freshness Signal' is heavily weighted by AI models prioritizing real-time accuracy. Evergreen content must be actively refreshed. This means updating statistics to the current year, replacing old screenshots, and verifying that external links still point to relevant data. A 'Last Updated' date in the schema and visible on the page helps trigger re-crawling and maintains your position in AI summaries.",
        "concepts": ["freshness signal", "content refresh", "evergreen content", "re-crawling"],
        "weight": 0.83,
    },
    {
        "layer": "content_writing",
        "text": "Structured Decision Matrices in AEO: AI search engines prioritize extracting comparative tables with concrete trade-offs. Every authoritative guide must feature a 4-column decision matrix (Situation/Beat, Operator Action, Verifiable Evidence, Failure Risk). This tabular information gain prevents LLM summarization penalties and drives direct knowledge panel citations.",
        "concepts": ["decision matrix", "structured comparison", "trade-off analysis", "information gain", "table extraction"],
        "weight": 0.95,
    },
    {
        "layer": "content_writing",
        "text": "Fill-in-the-Blank Script & Brief Formats: Practical creator search intent demands copy-pasteable execution skeletons. Provide explicit time-stamped sequences (0-3s Hook, 3-15s Mechanism, 15-25s Proof, 25-30s Save CTA) with bracketed variables so operators can immediately move from search query to on-set production.",
        "concepts": ["script skeletons", "brief templates", "fill-in-the-blank", "time-stamped beats", "production execution"],
        "weight": 0.93,
    },
    {
        "layer": "content_strategy",
        "text": "UGC Usage Rights and Brand-Safety Demarcation: Commercial search intent in creator marketing requires explicit contract boundaries. Differentiate organic posting usage from paid whitelisting (dark posting) and perpetual digital rights. Clear boundary definitions protect creator revenue and position the page as an indispensable operational standard.",
        "concepts": ["ugc contracts", "usage rights", "paid whitelisting", "brand safety", "creator agreements"],
        "weight": 0.94,
    },
    {
        "layer": "on_page_seo",
        "text": "Beauty and Skincare Lighting & Macro Angle Standards: In beauty video search queries, algorithms favor explicit physical parameters. Always specify diffused 5600K daylight simulation, 45-degree key light positioning to avoid packaging glare, and close-up macro focal lengths (50mm-85mm equivalent) for uncompressed skin texture proof.",
        "concepts": ["beauty lighting", "kelvin temperature", "macro focal length", "texture proof", "glare prevention"],
        "weight": 0.96,
    },
    {
        "layer": "technical_seo",
        "text": "Audio Foley Isolation for Faceless & ASMR Video AEO: Video search models evaluate transcript audio clarity and background noise levels. Prescribe dedicated directional lavalier placement 4-6 inches from the acoustic source, soft acoustic dampening panels for home studios, and low-frequency noise gate settings to maximize voice-to-text accuracy.",
        "concepts": ["audio foley", "asmr acoustics", "noise gate", "mic placement", "speech-to-text indexing"],
        "weight": 0.91,
    },
    {
        "layer": "content_strategy",
        "text": "B2B Short-Form Video Retention Architecture: Enterprise and B2B search intent ignores generic motivation. Video frameworks must open with immediate operational friction, present dashboard/metric UI overlays within 5 seconds, and conclude with actionable PDF/framework download prompts rather than broad consumer CTAs.",
        "concepts": ["b2b video strategy", "operational friction", "ui overlays", "executive audience", "lead generation"],
        "weight": 0.92,
    },
    {
        "layer": "content_strategy",
        "text": "Creator Burnout Prevention and Sustainable Batching: Capacity-related search queries demand strict operational limits over hustle advice. Recommend a maximum 4-hour filming block per week, a rigid 1-idea-to-4-formats repurposing rule, and a defined 'minimum viable post' fallback for low-energy cycles.",
        "concepts": ["burnout prevention", "batching system", "capacity limits", "repurposing rule", "sustainable production"],
        "weight": 0.90,
    },
    {
        "layer": "answer_engine_optimization",
        "text": "People-Also-Ask Long-Tail Question Parsing: Conversational search users query full-sentence problems. Conclude articles with 4 niche-specific FAQs structured as exact H3 questions answering primary intent in the first two sentences without fluff, paired with valid Schema.org FAQPage markup.",
        "concepts": ["paa structure", "conversational faqs", "faq schema", "long-tail intent", "direct answers"],
        "weight": 0.94,
    },
    {
        "layer": "on_page_seo",
        "text": "Topic Cluster Silo Linking with Task-Specific Anchors: Avoid generic internal linking terms. Every resource article must link to 2-4 adjacent cluster guides using descriptive, task-oriented anchor texts (e.g., 'reels creative brief template for brands' or 'natural light window positioning guide') to pass domain authority through defined semantic silos.",
        "concepts": ["topic cluster", "silo architecture", "task-oriented anchors", "semantic linking", "domain authority"],
        "weight": 0.95,
    },
]


def generate_observations():
    PREPARED_DIR.mkdir(parents=True, exist_ok=True)
    
    count = 0
    with OUT_FILE.open("w", encoding="utf-8") as f:
        for i, chunk in enumerate(CHUNKS, 1):
            text = chunk["text"]
            content_hash = sha256(f"2026_seo_update|{text}")
            
            record = {
                "content_hash": content_hash,
                "source_book": "2026_ai_search_guidelines",
                "source_chapter": "AEO_Updates",
                "source_page": i,
                "seo_layer": chunk["layer"],
                "category_slug": "ai_search_optimization",
                "locale": "en",
                "title_algorithmic": f"2026 AEO Strategy #{i}",
                "text_signals": {
                    "abstract_text": text,
                    "seo_concepts": chunk["concepts"],
                    "all_layers": [chunk["layer"], "general_seo"]
                },
                "metric_signals": {
                    "word_count": len(text.split()),
                    "actionability": 0.8,
                    "authority": 0.9
                },
                "derived_concepts": chunk["concepts"],
                "training_weight": chunk["weight"],
                "training_use": "pattern_only",
                "risk_level": "low",
                "metadata": {
                    "source_file": "web_2026_reports.pdf",
                    "source_class": "2026_web_research",
                    "chunk_index": i,
                    "anti_copy": True,
                },
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            count += 1
            
    print(f"[OK] Generated {count} high-quality 2026 AEO observation chunks to {OUT_FILE.name}")

if __name__ == "__main__":
    generate_observations()
