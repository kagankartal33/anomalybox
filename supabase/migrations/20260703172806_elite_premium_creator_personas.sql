insert into public.creator_personas (slug, name, description, tags, enabled, sort_order, metadata)
values
  (
    'luxury_editor',
    'Luxury Editor',
    'For creators who make taste feel selective, composed, and expensive without becoming distant.',
    array['premium','curated','editorial']::text[],
    true,
    10,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Turns taste into calm, trusted decision-making.",
      "content_mechanics": ["taste filter", "quiet proof", "selective comparison", "saveable decision rule"],
      "visual_style": "restrained framing, clean surfaces, controlled accents, confident pauses",
      "best_categories": ["beauty", "fashion", "travel", "luxury"],
      "internal_taxonomy_hint": ["P035", "P064", "P080", "P092"]
    }'::jsonb
  ),
  (
    'relatable_lifestyle',
    'Relatable Lifestyle',
    'For creators who turn everyday friction, routines, and honest context into content people save and share.',
    array['relatable','warm','routine']::text[],
    true,
    20,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Makes the audience feel recognized and practically helped.",
      "content_mechanics": ["daily friction", "routine reset", "honest correction", "peer recommendation"],
      "visual_style": "warm natural light, lived-in details, low-pressure camera presence",
      "best_categories": ["lifestyle", "family", "home", "wellness"],
      "internal_taxonomy_hint": ["P055", "P091", "P093", "P096"]
    }'::jsonb
  ),
  (
    'expert_guide',
    'Expert Guide',
    'For creators who earn trust through clear frameworks, evidence-aware language, and useful explanation.',
    array['expert','educational','saveable']::text[],
    true,
    30,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Gives the audience a cleaner way to understand or decide.",
      "content_mechanics": ["framework", "myth reset", "proof boundary", "teachable checklist"],
      "visual_style": "direct-to-camera clarity, annotated overlays, simple examples",
      "best_categories": ["creator_education", "business", "fitness_wellness_safe", "commerce_affiliate"],
      "internal_taxonomy_hint": ["P045", "P074", "P109", "P111"]
    }'::jsonb
  ),
  (
    'beauty_tester',
    'Beauty Tester',
    'For beauty creators who use visual proof, routine context, and honest boundaries instead of overclaiming.',
    array['testing','proof','beauty']::text[],
    true,
    40,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Helps the audience judge beauty choices with context and visual evidence.",
      "content_mechanics": ["wear test", "shade context", "texture close-up", "routine boundary"],
      "visual_style": "macro close-ups, mirror checks, skin-safe framing, soft proof moments",
      "best_categories": ["beauty", "cosmetics", "skin", "hair"],
      "internal_taxonomy_hint": ["P038", "P039", "P040", "P042"]
    }'::jsonb
  ),
  (
    'travel_curator',
    'Travel Curator',
    'For place-aware creators who turn routes, venues, hotels, and local context into cinematic decisions.',
    array['travel','place','itinerary']::text[],
    true,
    50,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Makes a place feel easier to choose and richer to experience.",
      "content_mechanics": ["route map", "local tip", "service test", "place comparison"],
      "visual_style": "movement-led openings, location texture, map overlays, sensory details",
      "best_categories": ["travel", "hotel", "restaurant", "city", "venue"],
      "internal_taxonomy_hint": ["P061", "P062", "P063", "P064", "P066"]
    }'::jsonb
  ),
  (
    'comedy_observer',
    'Comedy Observer',
    'For creators who convert recognizable social tension into safe, repeatable, comment-first humor.',
    array['comedy','observation','safe_target']::text[],
    true,
    60,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Gives the audience a clean laugh at a shared situation, not at a vulnerable target.",
      "content_mechanics": ["POV recognition", "social rule flip", "comment improvisation", "character contrast"],
      "visual_style": "fast setup, expressive beat, minimal props, readable punchline frame",
      "best_categories": ["entertainment_comedy", "lifestyle", "creator_content"],
      "internal_taxonomy_hint": ["P001", "P003", "P005", "P006"]
    }'::jsonb
  ),
  (
    'product_reviewer',
    'Product Reviewer',
    'For creators who help audiences decide with comparison, proof, disclosure, and sponsor-safe restraint.',
    array['review','commerce','proof']::text[],
    true,
    70,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Turns buying anxiety into a clear, honest decision filter.",
      "content_mechanics": ["conditional review", "pros and cons", "buyer boundary", "proof-in-use"],
      "visual_style": "hands-on demos, comparison tables, use-case b-roll, clear disclosure moments",
      "best_categories": ["commerce_affiliate", "retail", "product", "tech", "beauty"],
      "internal_taxonomy_hint": ["P038", "P068", "P108"]
    }'::jsonb
  ),
  (
    'creator_teacher',
    'Creator Teacher',
    'For creators who teach content systems, platform decisions, and repeatable creator operations.',
    array['creator_growth','teaching','framework']::text[],
    true,
    80,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Gives creators a practical system they can apply today.",
      "content_mechanics": ["workflow teardown", "template", "platform explanation", "creator playbook"],
      "visual_style": "screen notes, whiteboard logic, numbered overlays, concise examples",
      "best_categories": ["creator_education", "thought_leadership", "ai", "marketing"],
      "internal_taxonomy_hint": ["P067", "P069", "P070", "P074"]
    }'::jsonb
  ),
  (
    'cinematic_storyteller',
    'Cinematic Storyteller',
    'For creators who make moments feel cinematic through atmosphere, sequence, movement, and emotional payoff.',
    array['cinematic','story','atmosphere']::text[],
    true,
    90,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Makes the audience feel inside a polished story, not just a post.",
      "content_mechanics": ["opening image", "sensory arc", "scene progression", "emotional payoff"],
      "visual_style": "wide-to-close rhythm, natural motion, textured b-roll, intentional silence",
      "best_categories": ["travel", "film", "lifestyle", "art", "luxury"],
      "internal_taxonomy_hint": ["P017", "P062", "P080", "P112"]
    }'::jsonb
  ),
  (
    'founder_operator',
    'Founder Operator',
    'For business creators who turn decisions, constraints, launches, and operating lessons into authority.',
    array['founder','operator','business']::text[],
    true,
    100,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Makes business judgment feel specific, earned, and repeatable.",
      "content_mechanics": ["decision memo", "operator lesson", "constraint reveal", "post-mortem"],
      "visual_style": "desk notes, founder walk-throughs, sharp captions, low-fluff proof",
      "best_categories": ["business", "startup", "founder", "career", "sales"],
      "internal_taxonomy_hint": ["P073", "P074", "P075", "P078"]
    }'::jsonb
  ),
  (
    'live_community_host',
    'Live Community Host',
    'For streamers, hosts, and community-led creators who turn participation into the main event.',
    array['live','community','fandom']::text[],
    true,
    110,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Makes followers feel like they are part of the room, vote, or event.",
      "content_mechanics": ["audience prompt", "live reaction", "guest moment", "community challenge"],
      "visual_style": "high-energy cuts, comment overlays, room energy, visible audience loop",
      "best_categories": ["gaming", "live", "fandom", "entertainment", "community"],
      "internal_taxonomy_hint": ["P021", "P099", "P101", "P119"]
    }'::jsonb
  ),
  (
    'performance_athlete',
    'Performance Athlete',
    'For sport, fitness, and performance creators who translate discipline, preparation, and safe challenge into content.',
    array['performance','athlete','discipline']::text[],
    true,
    120,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Makes effort, preparation, and progress visible without unsafe promises.",
      "content_mechanics": ["training day", "technical breakdown", "safe challenge", "behind-the-scenes preparation"],
      "visual_style": "controlled motion, warm-up details, measured proof, recovery context",
      "best_categories": ["sports", "fitness", "motoring", "outdoor", "performance"],
      "internal_taxonomy_hint": ["P007", "P008", "P011", "P018", "P043"]
    }'::jsonb
  ),
  (
    'artist_worldbuilder',
    'Artist Worldbuilder',
    'For artists, musicians, designers, and visual creators who build a recognizable creative universe.',
    array['artist','worldbuilding','visual_identity']::text[],
    true,
    130,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Lets the audience enter a coherent world of symbols, process, and taste.",
      "content_mechanics": ["studio diary", "symbol reveal", "mood system", "process-to-payoff"],
      "visual_style": "recurring motifs, tactile process, visual fragments, gallery-like pacing",
      "best_categories": ["art", "music", "design", "photography", "fashion_designer"],
      "internal_taxonomy_hint": ["P019", "P023", "P079", "P080", "P082"]
    }'::jsonb
  ),
  (
    'food_experience_maker',
    'Food Experience Maker',
    'For food creators who make taste, place, recipe systems, and sensory proof feel irresistible.',
    array['food','sensory','experience']::text[],
    true,
    140,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Helps the audience taste, choose, or recreate the experience before they act.",
      "content_mechanics": ["recipe system", "taste test", "sensory close-up", "local discovery"],
      "visual_style": "macro texture, sound detail, plate reveal, map or ingredient context",
      "best_categories": ["food", "restaurant", "cafe", "recipe", "bakery"],
      "internal_taxonomy_hint": ["P049", "P051", "P052", "P054", "P066"]
    }'::jsonb
  ),
  (
    'style_strategist',
    'Style Strategist',
    'For fashion and style creators who turn aesthetics into usable rules, capsules, edits, and trend translation.',
    array['style','fashion','strategy']::text[],
    true,
    150,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Makes style feel intentional, repeatable, and easier to apply.",
      "content_mechanics": ["outfit formula", "capsule rule", "trend translation", "one-item-many-ways"],
      "visual_style": "mirror logic, outfit sequencing, detail crops, clean comparison frames",
      "best_categories": ["fashion", "style", "clothing", "luxury", "jewelry"],
      "internal_taxonomy_hint": ["P031", "P032", "P033", "P034", "P035"]
    }'::jsonb
  ),
  (
    'science_tech_explainer',
    'Science & Tech Explainer',
    'For tech, AI, science, and knowledge creators who make complex ideas visual, useful, and evidence-aware.',
    array['science','tech','ai','explainer']::text[],
    true,
    160,
    '{
      "tier": "elite_product_mode",
      "audience_promise": "Turns complexity into a clear, memorable, source-aware explanation.",
      "content_mechanics": ["visual analogy", "tool walkthrough", "bench test", "myth versus fact"],
      "visual_style": "screen capture, diagram overlays, demo table, controlled comparison",
      "best_categories": ["tech", "ai", "science", "education", "tools"],
      "internal_taxonomy_hint": ["P067", "P068", "P071", "P109", "P111"]
    }'::jsonb
  )
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    tags = excluded.tags,
    enabled = excluded.enabled,
    sort_order = excluded.sort_order,
    metadata = public.creator_personas.metadata || excluded.metadata,
    updated_at = now();
