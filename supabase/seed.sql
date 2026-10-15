insert into public.algorithm_definitions (
  id,
  family,
  name_tr,
  name_en,
  operator,
  formula,
  primary_triggers,
  ideal_platforms,
  risk_level,
  evidence_requirement,
  comedy_engine_tags,
  definition,
  enabled
) values
(
  'VIA-101',
  'comedy_remix',
  'Wrong Logic Game',
  'Wrong Logic Game',
  'Turns a familiar situation into a comedy game through confident wrong logic and pressure.',
  'familiar situation + confident wrong logic + pressure => comic game',
  array['recognition', 'share', 'comment'],
  array['instagram_reels', 'youtube_shorts', 'x'],
  'low',
  'none',
  array['base_reality', 'wrong_logic', 'pattern', 'escalation', 'button'],
  '{"safe_target":"behavior_or_system","quality_gate":"comedy_remix_integrity"}'::jsonb,
  true
),
(
  'VIA-104',
  'comedy_remix',
  'False Professionalism',
  'False Professionalism',
  'Treats a simple emotion or everyday moment with institutional, academic, or expert language until it becomes absurd.',
  'small human moment + institutional language + over-serious delivery => absurd shareable frame',
  array['quote', 'recognition', 'share'],
  array['x', 'instagram_reels', 'linkedin'],
  'low',
  'none',
  array['wrong_logic', 'status', 'language', 'button'],
  '{"safe_target":"system_language","best_for":["office","education","brand_humor"]}'::jsonb,
  true
),
(
  'VIA-111',
  'internet_humor',
  'Screenshot Collision',
  'Screenshot Collision',
  'Places an ordinary message, notification, or comment beside a context that changes how the audience reads it.',
  'ordinary text + context collision + audience inference => screenshot humor',
  array['dm_share', 'quick_laugh', 'remix'],
  array['instagram_carousel', 'x', 'story'],
  'medium',
  'light',
  array['screenshot', 'context', 'inference', 'compression'],
  '{"requires_permission_check":true,"avoid_real_private_messages":true}'::jsonb,
  true
),
(
  'VIA-118',
  'trust_safe_comedy',
  'Context Collapse Guarded Joke',
  'Context Collapse Guarded Joke',
  'Builds the joke so the intent and safe target are understandable even from a single screenshot.',
  'joke + visible intent + safe target + low misread risk => resilient shareable comedy',
  array['safe_share', 'trust', 'brand_fit'],
  array['x', 'instagram_reels', 'brand_social'],
  'low',
  'none',
  array['context_collapse', 'safe_target', 'button'],
  '{"quality_gate":"context_collapse_guard","safe_target_required":true}'::jsonb,
  true
),
(
  'VIA-120',
  'quality_control',
  'Button Selector',
  'Button Selector',
  'Generates five short endings for the same idea and selects the clearest, shortest, strongest one.',
  'premise + 5 endings + compression test => strongest button',
  array['retention', 'completion', 'quality'],
  array['instagram_reels', 'youtube_shorts', 'x', 'youtube_long'],
  'low',
  'none',
  array['button', 'compression', 'payoff'],
  '{"minimum_button_options":5,"selection_rule":"shortest_strong_connected"}'::jsonb,
  true
)
on conflict (id) do update set
  family = excluded.family,
  name_tr = excluded.name_tr,
  name_en = excluded.name_en,
  operator = excluded.operator,
  formula = excluded.formula,
  primary_triggers = excluded.primary_triggers,
  ideal_platforms = excluded.ideal_platforms,
  risk_level = excluded.risk_level,
  evidence_requirement = excluded.evidence_requirement,
  comedy_engine_tags = excluded.comedy_engine_tags,
  definition = excluded.definition,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.admin_configs (namespace, version, config, enabled)
values (
  'scoring.vps',
  '1.1.0-comedy-remix',
  '{
    "weights": {
      "hook_clarity": 0.14,
      "audience_relevance": 0.12,
      "novelty": 0.10,
      "share_trigger": 0.12,
      "save_utility": 0.09,
      "retention_tension": 0.13,
      "format_native_fit": 0.08,
      "context_fit": 0.06,
      "comedy_remix_fit": 0.05,
      "creator_fit": 0.05,
      "brand_fit": 0.04,
      "evidence_integrity": 0.02
    },
    "penalties": {
      "risk_penalty": 0.10,
      "fatigue_penalty": 0.05,
      "production_penalty": 0.05
    }
  }'::jsonb,
  true
)
on conflict (namespace, version) do update set
  config = excluded.config,
  enabled = excluded.enabled;

insert into public.categories (
  slug,
  name,
  family,
  risk_level,
  sort_order,
  metadata,
  enabled
) values
(
  'beauty',
  'Beauty',
  'creator_content',
  'low',
  10,
  '{"default_layers":["T02","T03","T06","T07"],"fit_notes":["routine","product_proof","before_after_without_harm"]}'::jsonb,
  true
),
(
  'fashion',
  'Fashion',
  'creator_content',
  'low',
  20,
  '{"default_layers":["T01","T02","T08","T09"],"fit_notes":["styling","identity","occasion_based_series"]}'::jsonb,
  true
),
(
  'travel',
  'Travel',
  'creator_content',
  'medium',
  30,
  '{"default_layers":["T02","T07","T08","T12"],"fit_notes":["itinerary","place_truth","budget_luxury_contrast"]}'::jsonb,
  true
),
(
  'lifestyle',
  'Lifestyle',
  'creator_content',
  'low',
  40,
  '{"default_layers":["T01","T02","T04","T05"],"fit_notes":["daily_ritual","relatable_pressure","community_prompt"]}'::jsonb,
  true
),
(
  'food',
  'Food',
  'creator_content',
  'low',
  50,
  '{"default_layers":["T02","T03","T07","T09"],"fit_notes":["taste_test","recipe_decision","saveable_steps"]}'::jsonb,
  true
),
(
  'fitness_wellness_safe',
  'Fitness & Wellness Safe',
  'creator_content',
  'medium',
  60,
  '{"default_layers":["T06","T07","T10","T12"],"fit_notes":["no_medical_claims","habit_support","safety_boundaries"]}'::jsonb,
  true
),
(
  'parenting_family',
  'Parenting & Family',
  'creator_content',
  'medium',
  70,
  '{"default_layers":["T02","T04","T05","T12"],"fit_notes":["privacy_first","safe_humor","family_boundary"]}'::jsonb,
  true
),
(
  'creator_education',
  'Creator Education',
  'creator_content',
  'low',
  80,
  '{"default_layers":["T07","T09","T10","T12"],"fit_notes":["tutorial","mistake_fix","framework"]}'::jsonb,
  true
),
(
  'entertainment_comedy',
  'Entertainment Comedy',
  'creator_content',
  'medium',
  90,
  '{"default_layers":["T01","T04","T05","T09"],"fit_notes":["safe_target","recognition","series_button"]}'::jsonb,
  true
),
(
  'thought_leadership',
  'Thought Leadership',
  'creator_content',
  'medium',
  100,
  '{"default_layers":["T07","T10","T12"],"fit_notes":["bold_take","evidence_boundary","reputation_guard"]}'::jsonb,
  true
),
(
  'commerce_affiliate',
  'Commerce & Affiliate',
  'creator_content',
  'medium',
  110,
  '{"default_layers":["T03","T07","T11"],"fit_notes":["disclosure","proof","conversion_without_overclaim"]}'::jsonb,
  true
),
(
  'luxury',
  'Luxury',
  'creator_content',
  'medium',
  120,
  '{"default_layers":["T01","T02","T08","T12"],"fit_notes":["aspiration_to_practical","editorial_taste","reputation_safe"]}'::jsonb,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  family = excluded.family,
  risk_level = excluded.risk_level,
  sort_order = excluded.sort_order,
  metadata = excluded.metadata,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.creator_personas (
  slug,
  name,
  description,
  tags,
  sort_order,
  metadata,
  enabled
) values
(
  'luxury_editor',
  'Luxury Editor',
  'Premium taste, restraint, editorship, high-trust recommendations.',
  array['premium','curated','editorial'],
  10,
  '{"best_categories":["beauty","fashion","travel","luxury"],"tone":["precise","tasteful","selective"]}'::jsonb,
  true
),
(
  'relatable_lifestyle',
  'Relatable Lifestyle',
  'Daily-life pressure, honest routines, friendly recognition loops.',
  array['relatable','warm','routine'],
  20,
  '{"best_categories":["lifestyle","beauty","food","parenting_family"],"tone":["direct","human","playful"]}'::jsonb,
  true
),
(
  'expert_guide',
  'Expert Guide',
  'Teaches clearly, gives frameworks, avoids overclaiming.',
  array['expert','educational','saveable'],
  30,
  '{"best_categories":["creator_education","fitness_wellness_safe","commerce_affiliate"],"tone":["clear","useful","evidence_aware"]}'::jsonb,
  true
),
(
  'beauty_tester',
  'Beauty Tester',
  'Proof-led beauty creator focused on routines, tests and honest boundaries.',
  array['testing','proof','beauty'],
  40,
  '{"best_categories":["beauty","commerce_affiliate"],"tone":["specific","honest","visual"]}'::jsonb,
  true
),
(
  'travel_curator',
  'Travel Curator',
  'Place-aware travel creator with itinerary, mood and reality checks.',
  array['travel','place','itinerary'],
  50,
  '{"best_categories":["travel","luxury","lifestyle"],"tone":["observant","practical","aspirational"]}'::jsonb,
  true
),
(
  'comedy_observer',
  'Comedy Observer',
  'Turns everyday absurdity into safe, recognizable social jokes.',
  array['comedy','observation','safe_target'],
  60,
  '{"best_categories":["entertainment_comedy","lifestyle"],"tone":["quick","recognizable","non_cruel"]}'::jsonb,
  true
),
(
  'product_reviewer',
  'Product Reviewer',
  'Commercially useful creator who balances proof, limits and conversion.',
  array['review','commerce','proof'],
  70,
  '{"best_categories":["commerce_affiliate","beauty","food","creator_education"],"tone":["useful","transparent","specific"]}'::jsonb,
  true
),
(
  'creator_teacher',
  'Creator Teacher',
  'Breaks down growth, content systems and creator operations.',
  array['creator_growth','teaching','framework'],
  80,
  '{"best_categories":["creator_education","thought_leadership"],"tone":["structured","encouraging","sharp"]}'::jsonb,
  true
),
(
  'fitness_athlete',
  'Fitness Athlete',
  'High-energy training, body transformations, discipline and motivation.',
  array['fitness','athlete','motivation','transformation'],
  90,
  '{"best_categories":["fitness_wellness_safe","lifestyle"],"tone":["energetic","motivating","real"]}'::jsonb,
  true
),
(
  'authentic_storyteller',
  'Authentic Storyteller',
  'Personal vlogs, honest stories, vulnerability and real-life moments.',
  array['authentic','story','vlog','relatable'],
  100,
  '{"best_categories":["lifestyle","parenting_family","entertainment_comedy"],"tone":["honest","warm","narrative"]}'::jsonb,
  true
),
(
  'niche_specialist',
  'Niche Specialist',
  'Deep dives into specific hobbies, subcultures and specialized expertise.',
  array['niche','deep','expert','community'],
  110,
  '{"best_categories":["creator_education","lifestyle"],"tone":["passionate","detailed","insider"]}'::jsonb,
  true
),
(
  'fashion_trendsetter',
  'Fashion Trendsetter',
  'Style leader, early adopter of trends and aesthetic direction.',
  array['fashion','style','trend','aesthetic'],
  120,
  '{"best_categories":["fashion","luxury","lifestyle"],"tone":["stylish","forward","visual"]}'::jsonb,
  true
),
(
  'family_creator',
  'Family Creator',
  'Parenting, family life, honest home routines and relatable chaos.',
  array['family','parent','home','relatable'],
  130,
  '{"best_categories":["parenting_family","lifestyle"],"tone":["warm","practical","loving"]}'::jsonb,
  true
),
(
  'entertainer_performer',
  'Entertainer',
  'Skits, challenges, high-energy fun and performance-driven content.',
  array['entertain','fun','challenge','performance'],
  140,
  '{"best_categories":["entertainment_comedy","lifestyle"],"tone":["energetic","charismatic","playful"]}'::jsonb,
  true
),
(
  'tech_reviewer',
  'Tech Reviewer',
  'Gadgets, apps, tech tutorials with honest reviews and clear demos.',
  array['tech','gadget','review','demo'],
  150,
  '{"best_categories":["creator_education","commerce_affiliate"],"tone":["clear","analytical","helpful"]}'::jsonb,
  true
),
(
  'foodie_creator',
  'Foodie Creator',
  'Recipes, restaurant experiences, cooking and flavor storytelling.',
  array['food','recipe','cooking','taste'],
  160,
  '{"best_categories":["food","lifestyle"],"tone":["appetizing","descriptive","joyful"]}'::jsonb,
  true
),
(
  'achiever_challenger',
  'Achiever',
  'Ambitious challenges, big goals, giveaways and high-production content.',
  array['challenge','giveaway','ambition','scale'],
  170,
  '{"best_categories":["entertainment_comedy","lifestyle"],"tone":["bold","energetic","generous"]}'::jsonb,
  true
),
(
  'credible_infotainer',
  'Credible Infotainer',
  'Educational yet entertaining content with trustworthy facts and personality.',
  array['education','info','entertain','trust'],
  180,
  '{"best_categories":["creator_education","entertainment_comedy"],"tone":["credible","fun","clear"]}'::jsonb,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  tags = excluded.tags,
  sort_order = excluded.sort_order,
  metadata = excluded.metadata,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.box_products (
  slug,
  name,
  price_usd_cents,
  idea_count,
  allocation,
  metadata,
  enabled
) values
(
  'viral_box_500',
  'Classic Red Box',
  900,
  2,
  '{"high":2}'::jsonb,
  '{
    "visible_to_creator": true,
    "shows_scores": false,
    "display_name": "Classic Red Box",
    "short_description": "2 campaign-ready creative briefs calibrated to your lane, creator mode, and production style.",
    "creator_positioning": "A focused private idea box for creators who want two polished directions they can actually shoot.",
    "public_benefits": [
      "2 campaign-ready creative briefs",
      "lane and creator-mode calibration",
      "scene, shot, caption and brand-safety guidance",
      "saved into the Creator Vault"
    ]
  }'::jsonb,
  true
),
(
  'premium_viral_box_1000',
  'SIGNATURE PURPLE BOX',
  1900,
  5,
  '{"high":5}'::jsonb,
  '{
    "visible_to_creator": true,
    "shows_scores": false,
    "display_name": "SIGNATURE PURPLE BOX",
    "short_description": "5 campaign-ready creative briefs with deeper production direction, brand-lift framing, and launch-ready creative angles.",
    "creator_positioning": "The fuller private selection for creators preparing campaigns, launches, or elevated content moments.",
    "public_benefits": [
      "5 campaign-ready creative briefs",
      "deeper execution direction",
      "brand-lift framing",
      "launch-ready creative angles",
      "saved into the Creator Vault"
    ]
  }'::jsonb,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  price_usd_cents = excluded.price_usd_cents,
  idea_count = excluded.idea_count,
  allocation = excluded.allocation,
  metadata = excluded.metadata,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.admin_configs (namespace, version, config, enabled)
values (
  'inventory.rules',
  '1.0.0',
  '{
    "scope": "category_persona",
    "score_bands": {
      "low": { "minimum_stock": 200, "reorder_threshold_fraction": 0.30 },
      "mid": { "minimum_stock": 100, "reorder_threshold_fraction": 0.30 },
      "high": { "minimum_stock": 100, "reorder_threshold_fraction": 0.30 }
    },
    "box_products": {
      "viral_box_500": { "low": 1, "high": 1 },
      "premium_viral_box_1000": { "low": 2, "mid": 1, "high": 2 }
    },
    "creator_visibility": {
      "show_scores": false,
      "show_score_band": false,
      "show_inventory_fields": false
    }
  }'::jsonb,
  true
)
on conflict (namespace, version) do update set
  config = excluded.config,
  enabled = excluded.enabled;

insert into public.admin_configs (namespace, version, config, enabled)
values (
  'generator.batch_import',
  '1.0.0',
  '{
    "accepted_format": "jsonl",
    "required_manifest_fields": [
      "batch_id",
      "category_slug",
      "persona_slug",
      "target_count",
      "language",
      "platform",
      "generator_version"
    ],
    "required_idea_fields": [
      "external_idea_id",
      "title",
      "one_sentence_premise",
      "mechanism_ids",
      "category_slug",
      "persona_tags",
      "content_style_layers",
      "hook_options",
      "story_beats",
      "idea_card",
      "safety_notes"
    ],
    "rejection_policy": "row_level_error_without_failing_batch"
  }'::jsonb,
  true
)
on conflict (namespace, version) do update set
  config = excluded.config,
  enabled = excluded.enabled;

insert into public.algorithm_definitions (
  id,
  family,
  name_tr,
  name_en,
  operator,
  formula,
  primary_triggers,
  ideal_platforms,
  risk_level,
  evidence_requirement,
  comedy_engine_tags,
  definition,
  enabled
) values
(
  'VIA-121',
  'bureaucratic_everyday',
  'Life as a Form',
  'Life as a Form',
  'Explains an emotion or decision through form fields, checkboxes, and impossible procedures.',
  'emotion_or_decision + form_fields + impossible_approval => bureaucratic everyday comedy',
  array['recognition', 'comment', 'share'],
  array['instagram_reels', 'instagram_carousel', 'story'],
  'low',
  'none',
  array['bureaucracy', 'wrong_logic', 'pattern', 'button'],
  '{"content_style_layers":["T04"],"safe_target":"system_or_behavior"}'::jsonb,
  true
),
(
  'VIA-126',
  'bureaucratic_everyday',
  'Bureaucratic Unboxing',
  'Bureaucratic Unboxing',
  'Packages a product or experience as an official opening protocol, checklist, and absurd approval sequence.',
  'product_or_experience + official_protocol + checklist => visual bureaucratic comedy',
  array['stop_power', 'share', 'brand_fit'],
  array['instagram_reels', 'youtube_shorts'],
  'low',
  'light',
  array['bureaucracy', 'product', 'visual_payoff'],
  '{"content_style_layers":["T03","T04","T11"],"disclosure_check":true}'::jsonb,
  true
),
(
  'VIA-131',
  'influencer_personalization',
  'Creator Signature Remix',
  'Creator Signature Remix',
  'Rebuilds the creator''s own permitted format pattern with new category tension and an original payoff.',
  'creator_dna + category_tension + original_payoff => signature-safe idea',
  array['loyalty', 'series', 'share'],
  array['instagram_reels', 'story', 'instagram_carousel'],
  'low',
  'none',
  array['creator_dna', 'series', 'signature'],
  '{"box_role":"signature_safe","requires_creator_owned_pattern":true}'::jsonb,
  true
),
(
  'VIA-132',
  'influencer_personalization',
  'Behind-the-Scenes Reality Crack',
  'Behind-the-Scenes Reality Crack',
  'Makes the preparation, friction, and real work behind a polished result visible.',
  'polished_result + hidden_work + honest_payoff => trust-building content',
  array['trust', 'comment', 'retention'],
  array['instagram_reels', 'story'],
  'low',
  'none',
  array['behind_the_scenes', 'authenticity', 'human_awareness'],
  '{"content_style_layers":["T02"],"privacy_boundary_required":true}'::jsonb,
  true
),
(
  'VIA-133',
  'commercial_integrity',
  'Sponsor Integrity Integration',
  'Sponsor Integrity Integration',
  'Integrates a brand promise through real-use context, clear boundaries, and evidence needs.',
  'brand_promise + real_use_context + disclosure + proof_boundary => trustworthy sponsored idea',
  array['trust', 'conversion', 'save'],
  array['instagram_reels', 'instagram_carousel', 'story'],
  'medium',
  'light',
  array['sponsor', 'disclosure', 'proof'],
  '{"content_style_layers":["T03","T11"],"disclosure_required":true,"claim_boundary_required":true}'::jsonb,
  true
),
(
  'VIA-136',
  'community_mining',
  'DM to Idea',
  'DM to Idea',
  'Turns a frequent follower question into a content idea without exposing private information.',
  'repeated_question + anonymized_context + answer + mini_proof => community-powered idea',
  array['community', 'trust', 'save'],
  array['instagram_reels', 'story', 'instagram_carousel'],
  'medium',
  'light',
  array['community', 'dm', 'privacy'],
  '{"content_style_layers":["T05"],"anonymization_required":true}'::jsonb,
  true
),
(
  'VIA-138',
  'reputation_guard',
  'High-Profile Visibility Pressure',
  'High-Profile Visibility Pressure',
  'Explains the human cost of visibility through privacy, agency, and boundary framing.',
  'visibility_pressure + human_boundary + agency_path => reputation-safe empathy content',
  array['empathy', 'trust', 'long_term_reputation'],
  array['instagram_reels', 'story', 'x'],
  'medium',
  'none',
  array['reputation', 'privacy', 'parasocial_boundary'],
  '{"content_style_layers":["T12"],"human_review_on_sensitive_context":true}'::jsonb,
  true
),
(
  'VIA-139',
  'community_mining',
  'Community Co-Edit',
  'Community Co-Edit',
  'Turns a creator draft into final content through follower choice and participation.',
  'creator_draft + audience_vote + final_version => participation and ownership',
  array['participation', 'follow_up', 'series'],
  array['story', 'instagram_reels'],
  'low',
  'none',
  array['community', 'series', 'poll'],
  '{"content_style_layers":["T05","T09"],"box_role":"community_dm"}'::jsonb,
  true
),
(
  'VIA-148',
  'thought_leadership',
  'Brand-Safe Bold Take',
  'Brand-Safe Bold Take',
  'Builds a strong point of view with evidence boundaries, respectful language, and non-toxic discussion framing.',
  'bold_take + evidence_boundary + non-toxic framing => quoteable reputation-safe idea',
  array['quote', 'discussion', 'trust'],
  array['x', 'instagram_carousel', 'instagram_reels'],
  'medium',
  'strong',
  array['thought_leadership', 'evidence', 'reputation'],
  '{"content_style_layers":["T12"],"claim_boundary_required":true}'::jsonb,
  true
),
(
  'VIA-150',
  'anti_imitation',
  'Principle Not Persona',
  'Principle Not Persona',
  'Creates original ideas by extracting creator-owned values, principles, and format logic instead of imitating a personality.',
  'creator_principle + new_subject + original_execution => non-imitation creator fit',
  array['originality', 'brand_fit', 'trust'],
  array['instagram_reels', 'story', 'instagram_carousel', 'x'],
  'low',
  'none',
  array['anti_imitation', 'creator_dna', 'novelty'],
  '{"content_style_layers":["T01"],"imitation_guard":true}'::jsonb,
  true
)
on conflict (id) do update set
  family = excluded.family,
  name_tr = excluded.name_tr,
  name_en = excluded.name_en,
  operator = excluded.operator,
  formula = excluded.formula,
  primary_triggers = excluded.primary_triggers,
  ideal_platforms = excluded.ideal_platforms,
  risk_level = excluded.risk_level,
  evidence_requirement = excluded.evidence_requirement,
  comedy_engine_tags = excluded.comedy_engine_tags,
  definition = excluded.definition,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.admin_configs (namespace, version, config, enabled)
values (
  'generator.influencer_box',
  '1.1.0',
  '{
    "generation_model": "pre_generated_inventory",
    "inventory_scope": "category_persona",
    "source_modes": [
      "admin_direct",
      "jsonl_import"
    ],
    "box_products": {
      "viral_box_500": {
        "price_usd_cents": 900,
        "idea_count": 2,
        "allocation": { "low": 1, "high": 1 }
      },
      "premium_viral_box_1000": {
        "price_usd_cents": 1900,
        "idea_count": 5,
        "allocation": { "low": 2, "mid": 1, "high": 2 }
      }
    },
    "content_style_layers": [
      "T01_SIGNATURE_RITUAL",
      "T02_BEHIND_THE_SCENES_TRUTH",
      "T03_PRODUCT_PROOF_HONEST_USE",
      "T04_BUREAUCRATIC_EVERYDAY_COMEDY",
      "T05_COMMUNITY_PROMPT_COMMENT_ENGINE",
      "T06_BEFORE_AFTER_WITHOUT_HARM",
      "T07_DECISION_SUPPORT_SAVEABLE_UTILITY",
      "T08_ASPIRATIONAL_TO_PRACTICAL_TRANSLATION",
      "T09_MINI_SERIES_UNIVERSE",
      "T10_CORRECTION_TRUST_REPAIR",
      "T11_COMMERCIAL_INTEGRATION",
      "T12_HIGH_PROFILE_REPUTATION_GUARD"
    ],
    "creator_visibility": {
      "show_scores": false,
      "show_score_band": false,
      "show_inventory_fields": false
    }
  }'::jsonb,
  true
)
on conflict (namespace, version) do update set
  config = excluded.config,
  enabled = excluded.enabled;


with source as (
  insert into public.viral_training_sources (
    slug,
    title,
    source_type,
    uri,
    coverage_start_year,
    coverage_end_year,
    reliability_notes,
    metadata,
    enabled
  ) values (
    'son_10_yil_viral_fikirler',
    'Son 10 Yilin Viral Fikirleri 2016-2026',
    'local_markdown',
    'son_10_yil_viral_fikirler.md',
    2016,
    2026,
    'Local research digest used as pattern corpus. Do not copy examples directly; extract abstract mechanisms only.',
    '{
      "training_policy": "pattern_only",
      "anti_copy_required": true,
      "covers": ["challenge", "meme", "short_video", "ai_formats", "social_commerce", "turkey_localization"],
      "review_note": "Dangerous challenges are negative examples and must not be recreated."
    }'::jsonb,
    true
  )
  on conflict (slug) do update set
    title = excluded.title,
    source_type = excluded.source_type,
    uri = excluded.uri,
    coverage_start_year = excluded.coverage_start_year,
    coverage_end_year = excluded.coverage_end_year,
    reliability_notes = excluded.reliability_notes,
    metadata = excluded.metadata,
    enabled = excluded.enabled
  returning id
)
insert into public.viral_training_examples (
  source_id,
  external_ref,
  year,
  platform,
  category_slug,
  title,
  phenomenon_type,
  abstracted_mechanism,
  reusable_pattern,
  participation_mode,
  emotional_triggers,
  format_signals,
  safety_risks,
  copy_risk,
  training_use,
  risk_level,
  metadata
)
select source.id, v.external_ref, v.year, v.platform, v.category_slug, v.title, v.phenomenon_type,
  v.abstracted_mechanism, v.reusable_pattern, v.participation_mode, v.emotional_triggers,
  v.format_signals, v.safety_risks, v.copy_risk, v.training_use, v.risk_level, v.metadata
from source
cross join (values
  ('2016_mannequin_challenge', 2016, 'instagram_reels', 'entertainment_comedy', 'Freeze Frame Group Performance', 'challenge', 'A simple physical constraint lets groups participate without needing talent-heavy execution.', 'easy_constraint + group_participation + camera_motion + recognizable audio => repeatable challenge loop', 'group recreation', array['novelty','belonging','spectacle'], array['single_take','group_scene','audio_anchor'], array[]::text[], 'high', 'pattern_only', 'low'::public.viral_training_risk_level, '{"original_example":"Mannequin Challenge","use_as":"abstract challenge mechanic"}'::jsonb),
  ('2016_bottle_flip', 2016, 'instagram_reels', 'entertainment_comedy', 'Low Skill Skill-Shot Loop', 'challenge', 'A tiny repeatable physical goal creates suspense, failed attempts and payoff.', 'simple_object + visible_attempt + near_miss + clean_success => replayable skill loop', 'solo or group recreation', array['suspense','satisfaction','competition'], array['attempt_loop','payoff_shot','reaction'], array[]::text[], 'medium', 'pattern_only', 'low'::public.viral_training_risk_level, '{"original_example":"Bottle Flip Challenge"}'::jsonb),
  ('2017_metoo', 2017, 'instagram_carousel', 'thought_leadership', 'Hashtag Testimony Cascade', 'social_movement', 'A shared phrase lowers the barrier for personal testimony and collective visibility.', 'shared_phrase + personal_boundary + solidarity_signal + resource_path => awareness cascade', 'opt-in testimony', array['solidarity','anger','recognition'], array['hashtag','plain_text','community_support'], array['trauma','privacy','harassment'], 'high', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"requires_human_review":true,"avoid_performative_activism":true}'::jsonb),
  ('2018_short_video_merger', 2018, 'tiktok', 'creator_education', 'Algorithmic Short Video Discovery', 'platform_shift', 'A feed that distributes content by viewer response instead of follower graph makes unknown creators discoverable.', 'short_loop + fast_feedback + remixable_audio + discovery_feed => creator breakout surface', 'platform-native remix', array['curiosity','speed','identity'], array['short_video','sound_reuse','remix'], array[]::text[], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"platform_shift":"TikTok/Musical.ly era"}'::jsonb),
  ('2019_ten_year_challenge', 2019, 'instagram_carousel', 'lifestyle', 'Before-Now Identity Contrast', 'challenge', 'A clear time gap lets creators show transformation, nostalgia or social commentary.', 'past_self + present_self + visible_delta + reflective_caption => identity contrast share', 'photo comparison', array['nostalgia','identity','reflection'], array['split_image','before_now','caption_prompt'], array['body_image','privacy','sensitive_identity'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"turkey_localization":"identity and social role discussion"}'::jsonb),
  ('2019_world_record_egg', 2019, 'instagram_feed', 'entertainment_comedy', 'Anti-Spectacle Participation Bet', 'meme', 'A deliberately simple object becomes a collective joke when the audience is invited to beat a visible status marker.', 'ordinary_object + impossible_goal + collective_participation + status_target => anti-spectacle meme', 'like/share campaign', array['absurdity','belonging','status_play'], array['single_image','minimal_caption','public_goal'], array[]::text[], 'medium', 'pattern_only', 'low'::public.viral_training_risk_level, '{"original_example":"World Record Egg","do_not_copy_object":true}'::jsonb),
  ('2020_dont_rush', 2020, 'instagram_reels', 'fashion', 'Pass-the-Object Transformation Chain', 'challenge', 'A simple handoff hides cuts and lets multiple creators join one visual transformation.', 'object_handoff + transformation_cut + group_sequence + style_reveal => collaborative transition challenge', 'multi-creator chain', array['glow_up','belonging','aesthetic_satisfaction'], array['transition','handoff','outfit_reveal'], array['beauty_pressure'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"safe_variant":"skill/process reveal instead of body comparison"}'::jsonb),
  ('2020_reels_shorts_shift', 2020, 'instagram_reels', 'creator_education', 'Cross-Platform Short Video Normalization', 'platform_shift', 'When every major platform adopts short video, ideas must be portable but execution must remain platform-native.', 'core_premise + platform_native_hook + variant_pack => multi-platform distribution', 'format adaptation', array['utility','speed'], array['reels','shorts','variant_pack'], array[]::text[], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"generator_link":"variant_pack_required"}'::jsonb),
  ('2021_glow_up_transition', 2021, 'instagram_reels', 'beauty', 'Transformation Reveal With Boundary', 'challenge', 'A reveal works when the visual change is clear, but premium creators need a non-harmful framing.', 'setup_state + transition_moment + upgraded_context + confidence_payoff => safe transformation reveal', 'solo transition', array['surprise','aspiration','confidence'], array['before_after','transition','beauty_reveal'], array['body_image','unrealistic_claims'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"safe_alternative":"routine reveal, lighting reveal, outfit context shift"}'::jsonb),
  ('2022_absurd_irony', 2022, 'instagram_reels', 'entertainment_comedy', 'Absurd Phrase Becomes Social Password', 'meme', 'A phrase can go viral because repeating it signals membership in the joke, not because it is objectively meaningful.', 'nonsense_phrase + shared_context + repetition + reaction_layer => social password meme', 'remix/reaction', array['absurdity','in_group','surprise'], array['short_phrase','reaction','remix'], array['brand_confusion'], 'high', 'pattern_only', 'low'::public.viral_training_risk_level, '{"use_with_caution":"needs creator-audience fit"}'::jsonb),
  ('2023_npc_lives', 2023, 'tiktok_live', 'entertainment_comedy', 'Gift-Triggered Performance Loop', 'commerce_format', 'Audience actions directly trigger creator micro-performances, making monetization visible and interactive.', 'audience_trigger + repeated_character_response + live_feedback + monetization_loop => participatory live format', 'live interaction', array['control','novelty','spectacle'], array['live','micro_response','gift_trigger'], array['dehumanization','over-commercialization'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"premium_variant":"comment-triggered editorial responses without dehumanizing creator"}'::jsonb),
  ('2024_ai_yearbook', 2024, 'instagram_reels', 'lifestyle', 'AI Nostalgia Self-Remix', 'ai_format', 'AI tools make identity play easy, but audience trust depends on transparency and human context.', 'ai_visual_transform + nostalgia_frame + creator_commentary + disclosure => safe AI self-remix', 'AI-assisted visual remix', array['nostalgia','curiosity','identity'], array['ai_image','throwback','disclosure'], array['deepfake','misrepresentation','unlicensed_style'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"disclosure_required":true}'::jsonb),
  ('2024_demure_brat_contrast', 2024, 'instagram_reels', 'fashion', 'Aesthetic Identity Label Flip', 'meme', 'Short labels let audiences sort themselves into aesthetic identities and argue/play in comments.', 'compact_label + aesthetic_behavior + contrast_pair + comment_prompt => identity sorting meme', 'self-label remix', array['identity','play','debate'], array['catchphrase','aesthetic','comment_prompt'], array['stereotyping'], 'medium', 'pattern_only', 'low'::public.viral_training_risk_level, '{"avoid_targeting_protected_classes":true}'::jsonb),
  ('2025_brain_rot', 2025, 'instagram_reels', 'entertainment_comedy', 'Chaotic Low-Context Humor', 'meme', 'Overloaded surreal edits reward fast recognition and in-group fluency, but fatigue rises quickly.', 'rapid_context_shift + absurd_audio + visual_overload + in_group_reference => chaos meme', 'remix/edit', array['chaos','in_group','novelty'], array['fast_cuts','surreal_audio','layered_text'], array['fatigue','brand_mismatch'], 'high', 'pattern_only', 'low'::public.viral_training_risk_level, '{"fatigue_penalty":true}'::jsonb),
  ('2026_new_2016', 2026, 'instagram_reels', 'lifestyle', 'Ten-Year Nostalgia Revival', 'meme', 'Aesthetic memory returns in cycles; creators can reactivate old formats with present-day self-awareness.', 'past_aesthetic + current_context + self_aware_update + audience_memory_prompt => nostalgia revival', 'throwback recreation', array['nostalgia','recognition','identity'], array['throwback','filter','then_now','sound_reuse'], array['copycat_fatigue'], 'medium', 'pattern_only', 'low'::public.viral_training_risk_level, '{"cycle_window_years":10}'::jsonb),
  ('2026_authenticity_backlash', 2026, 'instagram_reels', 'thought_leadership', 'Imperfect Human Proof', 'platform_shift', 'As AI-polished content increases, visible human process and small imperfections become trust signals.', 'polished_norm + human_process + small_imperfection + honest_boundary => authenticity trust lift', 'behind-the-scenes proof', array['trust','relief','recognition'], array['bts','unedited_moment','process_proof'], array['fake_authenticity'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"generator_link":"atmosphere_direction and production_plan should allow imperfect texture"}'::jsonb)
) as v(external_ref, year, platform, category_slug, title, phenomenon_type, abstracted_mechanism, reusable_pattern, participation_mode, emotional_triggers, format_signals, safety_risks, copy_risk, training_use, risk_level, metadata)
on conflict (source_id, external_ref) do update set
  year = excluded.year,
  platform = excluded.platform,
  category_slug = excluded.category_slug,
  title = excluded.title,
  phenomenon_type = excluded.phenomenon_type,
  abstracted_mechanism = excluded.abstracted_mechanism,
  reusable_pattern = excluded.reusable_pattern,
  participation_mode = excluded.participation_mode,
  emotional_triggers = excluded.emotional_triggers,
  format_signals = excluded.format_signals,
  safety_risks = excluded.safety_risks,
  copy_risk = excluded.copy_risk,
  training_use = excluded.training_use,
  risk_level = excluded.risk_level,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.viral_pattern_rules (
  id,
  name,
  family,
  pattern_formula,
  when_to_use,
  avoid_when,
  required_safety_checks,
  scoring_signals,
  generator_instructions,
  enabled
) values
(
  'VTP-001',
  'Participation Challenge Loop',
  'challenge',
  'simple_constraint + repeatable_action + visible_success_or_fail + nomination/comment_prompt',
  array['category has easy physical or decision-based participation', 'audience can recreate without special access'],
  array['dangerous stunts', 'health-risk behavior', 'humiliation or harassment'],
  array['harmful_challenge_filter', 'privacy_boundary', 'brand_safety_review'],
  '{"share_trigger":0.16,"comment_probability":0.10,"production_ease":0.10,"risk_penalty_if_unsafe":0.35}'::jsonb,
  'Use the challenge mechanic only as an abstract format. Create safe, low-risk participation prompts and never recreate dangerous viral challenges.',
  true
),
(
  'VTP-002',
  'Nostalgia Delta Loop',
  'nostalgia',
  'past_reference + present_identity + visible_delta + reflective_or_playful_prompt',
  array['creator has archive material', 'audience shares a generational memory', 'brand can use throwback safely'],
  array['sensitive identity change without consent', 'body comparison pressure', 'political trauma without human review'],
  array['privacy_boundary', 'body_image_guard', 'context_sensitivity_review'],
  '{"recognition":0.14,"save_or_share_memory":0.12,"comment_probability":0.12,"fatigue_penalty":0.05}'::jsonb,
  'Turn old trends into present-day commentary. Avoid copying old posts; translate the memory into a new creator-specific insight.',
  true
),
(
  'VTP-003',
  'Meme Template Translation',
  'meme',
  'known_emotional_shape + category_specific_tension + fresh wording + safe target',
  array['audience already understands the emotion', 'category has a common tension or contradiction'],
  array['direct imitation of a living creator', 'copyrighted assets', 'mocking protected traits'],
  array['anti_imitation_guard', 'copyright_asset_check', 'safe_target_required'],
  '{"recognition":0.15,"novelty":0.10,"comedy_fit":0.10,"copy_risk_penalty":0.20}'::jsonb,
  'Extract the emotional geometry of a meme, not its exact image, phrase, person or punchline.',
  true
),
(
  'VTP-004',
  'Transformation Without Harm',
  'transition',
  'setup_state + process_hint + reveal + agency_or_utility_payoff',
  array['beauty, fashion, home, travel or workflow categories', 'creator can show a real process'],
  array['body shame', 'medical claims', 'deceptive before/after'],
  array['claim_boundary', 'body_image_guard', 'evidence_note_if_claimed'],
  '{"retention_tension":0.13,"visual_hook":0.12,"save_utility":0.08,"risk_penalty_if_claimy":0.18}'::jsonb,
  'Replace harmful before/after framing with context shift, routine reveal, styling logic, lighting proof or process payoff.',
  true
),
(
  'VTP-005',
  'Interactive Live Trigger',
  'live_community',
  'audience_input + creator_micro_response + visible feedback + follow_up_asset',
  array['creator has active community', 'story poll/live/comment formats are available'],
  array['dehumanizing performance', 'over-monetized pressure', 'private data exposure'],
  array['community_privacy_guard', 'parasocial_boundary', 'commercial_boundary'],
  '{"community_depth":0.14,"comment_probability":0.13,"trust":0.08,"overcommercial_penalty":0.12}'::jsonb,
  'Use audience prompts to co-create, vote, refine or unlock follow-up content without turning creator into a gimmick.',
  true
),
(
  'VTP-006',
  'AI Assisted Self-Remix',
  'ai_ugc',
  'ai_transform + human_context + disclosure + original creator commentary',
  array['AI output is clearly disclosed', 'creator adds personal interpretation', 'format benefits from visual imagination'],
  array['deepfake of real people', 'unlicensed living artist imitation', 'misleading product proof'],
  array['ai_disclosure', 'likeness_permission', 'claim_boundary'],
  '{"novelty":0.12,"visual_hook":0.13,"trust":0.08,"disclosure_bonus":0.04,"misrepresentation_penalty":0.30}'::jsonb,
  'AI can be a prop or lens, not the authorial substance. The creator must add human context, disclosure and a non-deceptive use case.',
  true
),
(
  'VTP-007',
  'Imperfect Human Proof',
  'authenticity',
  'polished_expectation + visible_process + small_imperfection + honest boundary',
  array['premium creator needs trust lift', 'sponsored content risks feeling too polished', 'audience values process'],
  array['manufactured vulnerability', 'fake confession', 'private conflict exploitation'],
  array['authenticity_claim_check', 'privacy_boundary', 'sponsor_disclosure'],
  '{"trust":0.16,"brand_fit":0.10,"audience_aftertaste":0.12,"fake_authenticity_penalty":0.22}'::jsonb,
  'Let production feel intentional but human: a preparation moment, small correction, honest caveat or behind-the-scenes texture.',
  true
),
(
  'VTP-008',
  'Social Commerce Entertainment',
  'commerce',
  'entertainment_premise + product_context + honest proof + low-pressure conversion',
  array['commerce, beauty, fashion, food, travel and affiliate categories', 'product proof can be shown honestly'],
  array['medical/financial claims without evidence', 'hidden sponsorship', 'overstated outcomes'],
  array['disclosure_required', 'claim_boundary', 'proof_note'],
  '{"purchase_intent":0.12,"save_utility":0.10,"brand_safety":0.12,"claim_penalty":0.20}'::jsonb,
  'Blend product into a story, test, decision or ritual. Never make the content feel like a disguised ad.',
  true
)
on conflict (id) do update set
  name = excluded.name,
  family = excluded.family,
  pattern_formula = excluded.pattern_formula,
  when_to_use = excluded.when_to_use,
  avoid_when = excluded.avoid_when,
  required_safety_checks = excluded.required_safety_checks,
  scoring_signals = excluded.scoring_signals,
  generator_instructions = excluded.generator_instructions,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.generator_eval_cases (
  slug,
  title,
  category_slug,
  persona_slug,
  input_brief,
  expected_patterns,
  forbidden_patterns,
  quality_rubric,
  enabled
) values
(
  'beauty_premium_human_proof',
  'Beauty premium idea must use human proof without harmful before-after',
  'beauty',
  'beauty_tester',
  '{"platform":"instagram_reels","buyer_box":"premium_viral_box_1000","brief":"Create a premium beauty idea for a high-profile influencer launching a sponsored skincare routine."}'::jsonb,
  array['VTP-004','VTP-007','VTP-008'],
  array['unsafe_before_after','undisclosed_sponsor','medical_claim'],
  '{"must_include":["disclosure","claim_boundary","process_proof","micro_behavior_guide"],"must_hide":["score","score_band"],"minimum_score":0.80}'::jsonb,
  true
),
(
  'fashion_nostalgia_delta',
  'Fashion nostalgia idea must update the old trend instead of copying it',
  'fashion',
  'luxury_editor',
  '{"platform":"instagram_reels","brief":"Use a 2016-to-2026 nostalgia signal for a luxury fashion creator without copying a viral post."}'::jsonb,
  array['VTP-002','VTP-003'],
  array['direct_meme_copy','body_shame','celebrity_imitation'],
  '{"must_include":["present_day_point_of_view","brand_lift_statement","comment_prompt"],"minimum_score":0.78}'::jsonb,
  true
),
(
  'commerce_social_shop_safe',
  'Commerce idea must entertain before selling',
  'commerce_affiliate',
  'product_reviewer',
  '{"platform":"instagram_reels","brief":"Create a social commerce idea for a creator selling a curated box without showing internal scores."}'::jsonb,
  array['VTP-008','VTP-007'],
  array['hard_sell','fake_discount_urgency','score_band_leak'],
  '{"must_include":["honest_proof","low_pressure_cta","brand_safety"],"minimum_score":0.82}'::jsonb,
  true
)
on conflict (slug) do update set
  title = excluded.title,
  category_slug = excluded.category_slug,
  persona_slug = excluded.persona_slug,
  input_brief = excluded.input_brief,
  expected_patterns = excluded.expected_patterns,
  forbidden_patterns = excluded.forbidden_patterns,
  quality_rubric = excluded.quality_rubric,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.admin_configs (namespace, version, config, enabled)
values (
  'training.viral_corpus',
  '2016-2026-v1',
  '{
    "source_file": "son_10_yil_viral_fikirler.md",
    "training_mode": "pattern_only",
    "copy_policy": {
      "do_not_copy_named_viral_posts": true,
      "do_not_copy_creator_persona": true,
      "extract_mechanism_not_surface": true
    },
    "required_generator_rules": [
      "use VTP pattern ids as hidden planning aids",
      "never expose pattern ids, scores or bands to influencer UI",
      "turn dangerous challenges into negative examples only",
      "prefer safe participation, nostalgia delta, human proof and low-pressure commerce"
    ],
    "scoring_adjustments": {
      "participation_ease": 0.08,
      "nostalgia_recognition": 0.07,
      "authenticity_trust": 0.10,
      "format_fatigue_penalty": 0.08,
      "copy_risk_penalty": 0.18,
      "dangerous_challenge_penalty": 0.40
    }
  }'::jsonb,
  true
)
on conflict (namespace, version) do update set
  config = excluded.config,
  enabled = excluded.enabled;


with source as (
  insert into public.viral_training_sources (
    slug,
    title,
    source_type,
    uri,
    coverage_start_year,
    coverage_end_year,
    reliability_notes,
    metadata,
    enabled
  ) values (
    'deep_research_viral_training_2026',
    'Deep Research Viral Training Expansion 2025-2026',
    'external_research',
    'multi_source_research_2026',
    2025,
    2026,
    'Research-backed expansion from TikTok What''s Next 2025, YouTube Culture & Trends, Hootsuite Social Trends 2026, Sprout Instagram Trends 2026 and Pinterest Predicts 2026. Stored as mechanisms, not copied examples.',
    '{
      "training_policy": "pattern_only",
      "anti_copy_required": true,
      "sources": [
        "https://newsroom.tiktok.com/tiktok-whats-next-2025-trend-report-us",
        "https://www.youtube.com/trends/report/",
        "https://www.hootsuite.com/research/social-trends",
        "https://sproutsocial.com/insights/instagram-trends/",
        "https://newsroom.pinterest.com/en-gb/news/pinterest-predicts-nonconformity-self-preservation-and-escapism-drive-21-trends-for-2026/"
      ],
      "covers": ["brand_community_co_creation", "fandom", "social_search", "episodic_series", "broadcast_community", "ai_labeling", "curation_not_copying"]
    }'::jsonb,
    true
  )
  on conflict (slug) do update set
    title = excluded.title,
    source_type = excluded.source_type,
    uri = excluded.uri,
    coverage_start_year = excluded.coverage_start_year,
    coverage_end_year = excluded.coverage_end_year,
    reliability_notes = excluded.reliability_notes,
    metadata = excluded.metadata,
    enabled = excluded.enabled
  returning id
)
insert into public.viral_training_examples (
  source_id,
  external_ref,
  year,
  platform,
  category_slug,
  title,
  phenomenon_type,
  abstracted_mechanism,
  reusable_pattern,
  participation_mode,
  emotional_triggers,
  format_signals,
  safety_risks,
  copy_risk,
  training_use,
  risk_level,
  metadata
)
select source.id, v.external_ref, v.year, v.platform, v.category_slug, v.title, v.phenomenon_type,
  v.abstracted_mechanism, v.reusable_pattern, v.participation_mode, v.emotional_triggers,
  v.format_signals, v.safety_risks, v.copy_risk, v.training_use, v.risk_level, v.metadata
from source
cross join (values
  ('2025_tiktok_brand_fusion', 2025, 'tiktok', 'commerce_affiliate', 'Brand-Community Co-Design', 'marketing_case', 'Brand relevance rises when creators and communities visibly shape the idea instead of receiving a finished ad.', 'brand_prompt + creator_interpretation + community_feedback + final_asset => co-designed relevance', 'creator/community collaboration', array['belonging','agency','trust'], array['creator_partnership','community_prompt','iteration'], array['hidden_sponsorship','inauthentic_partnership'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"TikTok Brand Fusion","premium_use":"show creator taste without losing brand clarity"}'::jsonb),
  ('2025_tiktok_identity_osmosis', 2025, 'tiktok', 'lifestyle', 'Values Enter The Format', 'marketing_case', 'Audiences respond when brand identity absorbs evolving consumer values through behavior, not slogans.', 'audience_value + creator_behavior + brand_boundary + useful_scene => identity osmosis', 'values-in-action content', array['recognition','alignment','trust'], array['values_signal','routine','community_language'], array['performative_values','stereotyping'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"TikTok Identity Osmosis"}'::jsonb),
  ('2025_tiktok_creative_catalysts', 2025, 'tiktok', 'entertainment_comedy', 'Joyful Creative Risk', 'marketing_case', 'Playful, personality-led ideas can travel when risk is controlled and tied to a clear audience truth.', 'audience_truth + playful_risk + brand_personality + easy_remix => creative catalyst', 'remixable playful format', array['joy','surprise','recognition'], array['personality','remix','unexpected_frame'], array['brand_mismatch','forced_randomness'], 'medium', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"TikTok Creative Catalysts"}'::jsonb),
  ('2024_youtube_fandom_creators', 2024, 'youtube_shorts', 'entertainment_comedy', 'Fans Become Co-Creators', 'platform_shift', 'Fandom grows when viewers produce explanations, edits, reactions and alternate formats around a core object.', 'core_object + fan_role + derivative_format + recognition_loop => participatory fandom engine', 'fan-made derivative content', array['belonging','mastery','identity'], array['reaction','edit','explainer','fan_art'], array['copyright','harassment','parasocial_overreach'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"YouTube Fandom report","creator_use":"invite safe fan roles"}'::jsonb),
  ('2024_youtube_multiformat_franchise', 2024, 'youtube_shorts', 'creator_education', 'Digital Franchise Expansion', 'platform_shift', 'A single idea becomes durable when it can live as short clip, long explainer, reaction, livestream and community post.', 'core_premise + format_ladder + recurring_symbols + community_memory => digital franchise', 'multi-format series', array['anticipation','completion','belonging'], array['series','shorts','longform','live','community_post'], array['format_fatigue'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"YouTube Culture & Trends reports"}'::jsonb),
  ('2026_instagram_ai_labeling', 2026, 'instagram_reels', 'creator_education', 'AI Label Trust Gap', 'ai_format', 'AI can help production, but unlabeled AI-looking content creates distrust and comment backlash.', 'ai_assist + clear_label + human_reason + proof_anchor => trust-preserving AI workflow', 'AI-assisted disclosed content', array['trust','curiosity','relief'], array['ai_label','human_context','process_proof'], array['ai_slop','misrepresentation'], 'low', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"Sprout Instagram AI trend"}'::jsonb),
  ('2026_instagram_social_search', 2026, 'instagram_reels', 'creator_education', 'Searchable Social Answer', 'platform_shift', 'Instagram behaves like a discovery/search surface; ideas need clear query intent and native entertainment.', 'search_query + creator_answer + visual_proof + saveable_structure => social SEO reel', 'search-first educational content', array['utility','certainty','save'], array['keyword_overlay','answer_format','saveable_steps'], array['keyword_stuffing','overclaiming'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"Sprout/Hootsuite search-first social"}'::jsonb),
  ('2026_instagram_long_carousel', 2026, 'instagram_carousel', 'creator_education', 'Swipe-Based Depth', 'platform_shift', 'Carousels create active engagement because each swipe is a micro-commitment and can carry layered proof.', 'strong_cover + progressive_swipes + proof_or_steps + save_cta => carousel depth loop', 'carousel education/story', array['curiosity','mastery','save'], array['cover_hook','slide_progression','bookmark_cta'], array['information_overload'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"Sprout Instagram carousel trend"}'::jsonb),
  ('2026_instagram_founder_face', 2026, 'instagram_reels', 'thought_leadership', 'Leader-As-Human Trust Signal', 'marketing_case', 'A real face from behind the brand can outperform faceless polish because it creates accountability and proximity.', 'leader_face + specific_take + low_pressure_delivery + evidence_boundary => humanized trust', 'talking-head founder/leader clip', array['trust','proximity','authority'], array['talking_head','selfie_video','specific_take'], array['fake_vulnerability','over-scripted_ad'], 'medium', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"Sprout leadership trend","creator_use":"high-profile creator can act as curator/founder face"}'::jsonb),
  ('2026_instagram_episodic_series', 2026, 'instagram_reels', 'lifestyle', 'Recurring Series Anticipation', 'platform_shift', 'A repeatable series builds familiarity and return behavior when each episode has a stable promise and fresh variable.', 'recurring_promise + recognizable_frame + fresh_episode_variable + next_prompt => episodic retention', 'episodic content', array['anticipation','familiarity','investment'], array['series_title','episode_number','recurring_face'], array['stale_repetition'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"Sprout episodic content trend"}'::jsonb),
  ('2026_instagram_ugc_permission', 2026, 'instagram_reels', 'commerce_affiliate', 'Permissioned UGC Proof', 'commerce_format', 'UGC earns trust when it is permissioned, credited and transformed into proof without exploiting customers.', 'customer_asset + permission + creator_context + proof_use => ethical UGC trust', 'UGC proof/repost', array['trust','social_proof','community'], array['ugc','unboxing','review','credit'], array['permission_violation','testimonial_claims'], 'low', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"Sprout UGC trend"}'::jsonb),
  ('2026_instagram_broadcast_channel', 2026, 'instagram_stories', 'lifestyle', 'Private Community Loop', 'platform_shift', 'Broadcast channels and private-feeling updates create loyalty because followers opt into repeated closeness.', 'opt_in_channel + insider_prompt + poll_or_voice_note + public_payoff => private community loop', 'broadcast/community follow-up', array['belonging','insider_access','loyalty'], array['broadcast_channel','poll','voice_note','story_followup'], array['parasocial_pressure','privacy_boundary'], 'low', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"Sprout broadcast channel trend"}'::jsonb),
  ('2026_instagram_reaction_overlay', 2026, 'instagram_reels', 'thought_leadership', 'Talking-Head Reaction Context', 'meme', 'Reaction overlays hold attention because a human face interprets another stimulus in real time.', 'stimulus_clip_or_claim + immediate_face_reaction + expert_context + comment_question => reaction watchtime loop', 'talking-head reaction', array['curiosity','trust','debate'], array['picture_in_picture','hot_take','text_overlay'], array['copyright_clip','pile_on','misinformation'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"Sprout talking-head reaction trend"}'::jsonb),
  ('2026_instagram_meaningful_contest', 2026, 'instagram_carousel', 'commerce_affiliate', 'Meaningful UGC Contest', 'commerce_format', 'Giveaways work better when they ask for meaningful audience contribution instead of empty tag spam.', 'reward + meaningful_submission + reusable_content + permission_path => contest with residual value', 'UGC contest', array['motivation','belonging','utility'], array['giveaway','submission','story_share','permission'], array['spam_engagement','unclear_rules'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"Sprout contests trend"}'::jsonb),
  ('2026_hootsuite_chaos_culture', 2026, 'instagram_reels', 'entertainment_comedy', 'Chaos Culture With Brand Anchor', 'meme', 'Chaotic content travels when it has a stable brand/audience anchor; otherwise it becomes noise.', 'stable_identity + controlled_chaos + fast_context_shift + recognizable_payoff => anchored chaos', 'controlled chaotic edit', array['surprise','in_group','energy'], array['fast_cut','absurd_insert','caption_anchor'], array['brand_confusion','fatigue'], 'high', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"Hootsuite chaos culture"}'::jsonb),
  ('2026_hootsuite_side_quest', 2026, 'instagram_reels', 'lifestyle', 'Side Quest Identity Fragment', 'meme', 'Fragmented identities across apps make niche side quests and micro-personas shareable.', 'main_identity + side_quest + unexpected_competence + audience_label => micro-identity hook', 'side-quest reveal', array['identity','surprise','recognition'], array['side_quest','micro_persona','label_hook'], array['identity_stereotype'], 'medium', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"Hootsuite side quest trend"}'::jsonb),
  ('2026_hootsuite_cozy_slow', 2026, 'instagram_reels', 'lifestyle', 'Cozy Slow-Living Relief', 'meme', 'Overstimulated audiences share content that offers sensory relief, small rituals and frugal optimism.', 'noise_context + small_ritual + sensory_detail + relief_payoff => cozy attention reset', 'ritual/aesthetic reel', array['comfort','relief','optimism'], array['slow_broll','ritual','sensory_texture'], array['poverty_aesthetic','fake_simplicity'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"Hootsuite cozy aesthetic / Pinterest comfort"}'::jsonb),
  ('2026_pinterest_curate_not_copy', 2026, 'instagram_carousel', 'fashion', 'Curate, Not Copy', 'platform_shift', 'Trend fatigue makes audiences prefer personalized curation over mass trend replication.', 'trend_signal + personal_filter + selective_use + why_it_fits => curation credibility', 'curated trend interpretation', array['taste','identity','trust'], array['moodboard','editors_note','personal_filter'], array['copycat_trend','overconsumption'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"Pinterest Predicts 2026"}'::jsonb)
) as v(external_ref, year, platform, category_slug, title, phenomenon_type, abstracted_mechanism, reusable_pattern, participation_mode, emotional_triggers, format_signals, safety_risks, copy_risk, training_use, risk_level, metadata)
on conflict (source_id, external_ref) do update set
  year = excluded.year,
  platform = excluded.platform,
  category_slug = excluded.category_slug,
  title = excluded.title,
  phenomenon_type = excluded.phenomenon_type,
  abstracted_mechanism = excluded.abstracted_mechanism,
  reusable_pattern = excluded.reusable_pattern,
  participation_mode = excluded.participation_mode,
  emotional_triggers = excluded.emotional_triggers,
  format_signals = excluded.format_signals,
  safety_risks = excluded.safety_risks,
  copy_risk = excluded.copy_risk,
  training_use = excluded.training_use,
  risk_level = excluded.risk_level,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.viral_pattern_rules (
  id,
  name,
  family,
  pattern_formula,
  when_to_use,
  avoid_when,
  required_safety_checks,
  scoring_signals,
  generator_instructions,
  enabled
) values
(
  'VTP-009',
  'Brand Community Co-Design',
  'brand_fusion',
  'brand_prompt + creator_interpretation + community_feedback + final_asset',
  array['sponsored or commerce ideas', 'creator audience has strong opinions', 'brand can tolerate iteration'],
  array['hidden sponsorship', 'fake community voting', 'brand control disguised as co-creation'],
  array['sponsor_disclosure', 'community_permission', 'brand_boundary'],
  '{"trust":0.12,"comment_probability":0.12,"brand_fit":0.12,"inauthenticity_penalty":0.20}'::jsonb,
  'Let the creator and audience visibly shape the idea while keeping disclosure and brand boundaries clear.',
  true
),
(
  'VTP-010',
  'Values In Action',
  'identity_osmosis',
  'audience_value + creator_behavior + useful_scene + brand_boundary',
  array['lifestyle, parenting, wellness, sustainability, fashion or thought leadership', 'value can be shown through action'],
  array['performative activism', 'generic values language', 'sensitive social issue without review'],
  array['context_sensitivity_review', 'claim_boundary', 'representation_guard'],
  '{"audience_relevance":0.13,"trust":0.12,"brand_equity":0.10,"performative_penalty":0.25}'::jsonb,
  'Show values through a concrete creator choice, ritual, tradeoff or boundary; avoid slogans.',
  true
),
(
  'VTP-011',
  'Controlled Creative Risk',
  'creative_catalyst',
  'audience_truth + playful_risk + stable_brand_anchor + easy_remix',
  array['creator has a playful audience', 'category can support surprise without losing credibility'],
  array['randomness without audience truth', 'serious high-stakes claims', 'brand tone mismatch'],
  array['brand_anchor_check', 'safe_target_required', 'fatigue_check'],
  '{"novelty":0.14,"share_trigger":0.11,"creator_fit":0.12,"brand_mismatch_penalty":0.18}'::jsonb,
  'Use playful risk only when the audience truth is obvious and the creator identity remains recognizable.',
  true
),
(
  'VTP-012',
  'Fandom Participation Engine',
  'fandom',
  'core_object + fan_role + derivative_format + recognition_loop',
  array['creator has repeat viewers', 'idea can invite edits, explainers, reactions or remixes'],
  array['copyrighted clips without rights', 'harassment campaigns', 'parasocial overreach'],
  array['copyright_asset_check', 'community_safety', 'parasocial_boundary'],
  '{"community_depth":0.15,"share_trigger":0.12,"series_potential":0.12,"rights_penalty":0.25}'::jsonb,
  'Give followers a safe role in the content universe: interpreter, curator, tester, editor, voter or archivist.',
  true
),
(
  'VTP-013',
  'Searchable Social Answer',
  'social_search',
  'query_intent + creator_answer + visual_proof + saveable_structure',
  array['education, beauty, travel, finance-safe, food, tech and product discovery', 'audience searches for answers'],
  array['keyword stuffing', 'unverified advice', 'thin listicles'],
  array['evidence_note_if_claimed', 'claim_boundary', 'search_intent_check'],
  '{"save_utility":0.15,"hook_clarity":0.11,"search_fit":0.14,"thin_content_penalty":0.16}'::jsonb,
  'Write the idea like an answer people would search for, but deliver it as a native Reel/carousel with proof and payoff.',
  true
),
(
  'VTP-014',
  'Episodic Familiarity Loop',
  'series',
  'recurring_promise + recognizable_frame + fresh_variable + next_prompt',
  array['creator can repeat a format weekly', 'audience benefits from progression or anticipation'],
  array['stale repetition', 'series without payoff', 'too many recurring elements'],
  array['fatigue_check', 'episode_payoff_check', 'series_boundary'],
  '{"retention_tension":0.13,"return_behavior":0.15,"brand_memory":0.12,"staleness_penalty":0.12}'::jsonb,
  'Turn one idea into a repeatable show promise with a clear episode variable and reason to return.',
  true
),
(
  'VTP-015',
  'Private Community Loop',
  'community_channel',
  'opt_in_channel + insider_prompt + poll_or_voice_note + public_payoff',
  array['creator has loyal followers', 'story/broadcast/community tools are available'],
  array['privacy leakage', 'parasocial pressure', 'fake exclusivity'],
  array['privacy_boundary', 'parasocial_boundary', 'community_permission'],
  '{"community_depth":0.16,"trust":0.11,"comment_probability":0.09,"privacy_penalty":0.22}'::jsonb,
  'Use private-feeling tools to gather input or reward loyal followers, then turn it into a public-safe payoff.',
  true
),
(
  'VTP-016',
  'Reaction Context Layer',
  'reaction',
  'stimulus + immediate_human_reaction + expert_or_creator_context + comment_question',
  array['creator has expertise or strong POV', 'a trend/claim/product needs interpretation'],
  array['pile-ons', 'copyrighted clips without rights', 'misinformation amplification'],
  array['copyright_asset_check', 'non_toxic_framing', 'evidence_boundary'],
  '{"watch_time":0.14,"trust":0.12,"comment_probability":0.12,"pile_on_penalty":0.20}'::jsonb,
  'Use the human face as interpretation, not outrage bait. Add context, boundary and a useful question.',
  true
),
(
  'VTP-017',
  'Meaningful UGC Submission',
  'ugc',
  'reward + meaningful_submission + permission_path + reusable_asset',
  array['commerce, beauty, fashion, food, travel or community categories', 'audience can submit useful content'],
  array['tag-spam contests', 'unclear rights', 'fake winners'],
  array['permission_required', 'contest_rules_clarity', 'ugc_credit'],
  '{"participation_ease":0.10,"ugc_value":0.14,"trust":0.10,"spam_penalty":0.20}'::jsonb,
  'Ask for a real answer, photo, story, vote or use-case that creates residual content value, not empty engagement.',
  true
),
(
  'VTP-018',
  'Curate Not Copy',
  'curation',
  'trend_signal + personal_filter + selective_use + why_it_fits',
  array['fashion, beauty, travel, home, food and lifestyle trends', 'creator has a taste point of view'],
  array['copycat trend adoption', 'overconsumption pressure', 'trend without audience fit'],
  array['taste_filter_required', 'commercial_boundary', 'fatigue_check'],
  '{"brand_equity":0.14,"creator_fit":0.14,"audience_aftertaste":0.12,"copycat_penalty":0.20}'::jsonb,
  'Translate trend reports into a creator-specific edit: what to use, what to skip, and why it fits this audience.',
  true
)
on conflict (id) do update set
  name = excluded.name,
  family = excluded.family,
  pattern_formula = excluded.pattern_formula,
  when_to_use = excluded.when_to_use,
  avoid_when = excluded.avoid_when,
  required_safety_checks = excluded.required_safety_checks,
  scoring_signals = excluded.scoring_signals,
  generator_instructions = excluded.generator_instructions,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.generator_eval_cases (
  slug,
  title,
  category_slug,
  persona_slug,
  input_brief,
  expected_patterns,
  forbidden_patterns,
  quality_rubric,
  enabled
) values
(
  'creator_education_searchable_answer',
  'Creator education idea must be searchable but not thin SEO content',
  'creator_education',
  'creator_teacher',
  '{"platform":"instagram_reels","brief":"Create a search-first Reel for creators asking how to turn one viral format into a safe premium series."}'::jsonb,
  array['VTP-013','VTP-014','VTP-018'],
  array['keyword_stuffing','generic_listicle','pattern_id_leak'],
  '{"must_include":["query_intent","visual_proof","saveable_structure","series_prompt"],"minimum_score":0.82}'::jsonb,
  true
),
(
  'commerce_ugc_permission_loop',
  'Commerce idea must use UGC with permission and no hard sell',
  'commerce_affiliate',
  'product_reviewer',
  '{"platform":"instagram_reels","brief":"Create a premium commerce idea using customer UGC proof and a meaningful submission prompt."}'::jsonb,
  array['VTP-009','VTP-017','VTP-008'],
  array['hidden_sponsorship','unclear_permission','tag_spam'],
  '{"must_include":["permission_path","disclosure","low_pressure_conversion","comment_engine"],"minimum_score":0.84}'::jsonb,
  true
),
(
  'lifestyle_private_community_series',
  'Lifestyle idea must turn community input into an episodic public-safe format',
  'lifestyle',
  'relatable_lifestyle',
  '{"platform":"instagram_stories","brief":"Create a private-community-to-public-series idea for a high-profile lifestyle influencer."}'::jsonb,
  array['VTP-015','VTP-014','VTP-007'],
  array['privacy_leak','fake_exclusivity','parasocial_pressure'],
  '{"must_include":["privacy_boundary","story_poll","public_payoff","next_episode_prompt"],"minimum_score":0.80}'::jsonb,
  true
),
(
  'fashion_curated_trend_edit',
  'Fashion idea must curate a trend instead of copying it',
  'fashion',
  'luxury_editor',
  '{"platform":"instagram_carousel","brief":"Create a luxury fashion trend edit using 2026 trend fatigue and curation-not-copying logic."}'::jsonb,
  array['VTP-018','VTP-002','VTP-013'],
  array['copycat_trend','overconsumption_pressure','celebrity_imitation'],
  '{"must_include":["personal_filter","what_to_skip","why_it_fits","brand_lift_statement"],"minimum_score":0.83}'::jsonb,
  true
)
on conflict (slug) do update set
  title = excluded.title,
  category_slug = excluded.category_slug,
  persona_slug = excluded.persona_slug,
  input_brief = excluded.input_brief,
  expected_patterns = excluded.expected_patterns,
  forbidden_patterns = excluded.forbidden_patterns,
  quality_rubric = excluded.quality_rubric,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.admin_configs (namespace, version, config, enabled)
values (
  'training.viral_deep_research',
  '2026-v1',
  '{
    "training_mode": "pattern_only",
    "sources": [
      "TikTok What''s Next 2025",
      "YouTube Culture & Trends",
      "Hootsuite Social Trends 2026",
      "Sprout Instagram Trends 2026",
      "Pinterest Predicts 2026"
    ],
    "new_pattern_ids": ["VTP-009","VTP-010","VTP-011","VTP-012","VTP-013","VTP-014","VTP-015","VTP-016","VTP-017","VTP-018"],
    "generator_priorities": [
      "co-create with community without hiding sponsorship",
      "make ideas searchable without becoming thin SEO",
      "build episodic familiarity and private community loops",
      "use AI with labeling and human proof",
      "curate trend signals instead of copying them"
    ],
    "scoring_adjustments": {
      "search_fit": 0.08,
      "series_potential": 0.09,
      "community_depth": 0.10,
      "curation_credibility": 0.10,
      "permissioned_ugc_bonus": 0.07,
      "ai_labeling_trust_bonus": 0.05,
      "copycat_trend_penalty": 0.18
    }
  }'::jsonb,
  true
)
on conflict (namespace, version) do update set
  config = excluded.config,
  enabled = excluded.enabled;


with source as (
  insert into public.viral_training_sources (
    slug,
    title,
    source_type,
    uri,
    coverage_start_year,
    coverage_end_year,
    reliability_notes,
    metadata,
    enabled
  ) values (
    'deep_research_viral_training_2026_round_2',
    'Deep Research Viral Training Expansion Round 2',
    'external_research',
    'multi_source_research_2026_round_2',
    2024,
    2026,
    'Deeper research expansion using TikTok Next 2026, YouTube Culture & Trends, Think with Google fandom analysis, Sprout/Hootsuite social search and meaningful-content research. Mechanisms only; no surface copying.',
    '{
      "training_policy": "pattern_only",
      "anti_copy_required": true,
      "sources": [
        "https://ads.tiktok.com/business/en-US/next",
        "https://www.youtube.com/trends/report/",
        "https://business.google.com/us/think/search-and-video/gen-z-youtube-fandoms-and-video-marketing-trends/",
        "https://sproutsocial.com/insights/social-media-trends/",
        "https://sproutsocial.com/insights/instagram-trends/",
        "https://www.hootsuite.com/research/social-trends",
        "https://www.axios.com/2024/04/11/google-gen-z-search-engines-tiktok-youtube"
      ],
      "covers": ["unfiltered_process", "curiosity_detour", "emotional_roi", "fan_professionals", "creator_media_business", "shopping_trust_path", "calm_meaningful_content", "promise_packaging"]
    }'::jsonb,
    true
  )
  on conflict (slug) do update set
    title = excluded.title,
    source_type = excluded.source_type,
    uri = excluded.uri,
    coverage_start_year = excluded.coverage_start_year,
    coverage_end_year = excluded.coverage_end_year,
    reliability_notes = excluded.reliability_notes,
    metadata = excluded.metadata,
    enabled = excluded.enabled
  returning id
)
insert into public.viral_training_examples (
  source_id,
  external_ref,
  year,
  platform,
  category_slug,
  title,
  phenomenon_type,
  abstracted_mechanism,
  reusable_pattern,
  participation_mode,
  emotional_triggers,
  format_signals,
  safety_risks,
  copy_risk,
  training_use,
  risk_level,
  metadata
)
select source.id, v.external_ref, v.year, v.platform, v.category_slug, v.title, v.phenomenon_type,
  v.abstracted_mechanism, v.reusable_pattern, v.participation_mode, v.emotional_triggers,
  v.format_signals, v.safety_risks, v.copy_risk, v.training_use, v.risk_level, v.metadata
from source
cross join (values
  ('2026_tiktok_unfiltered_process', 2026, 'tiktok', 'lifestyle', 'Unfiltered Process Beats Polish', 'platform_shift', 'Audiences reward visible process, real people and unfinished edges when polished AI-like content feels interchangeable.', 'unfinished_process + real_person + honest_correction + useful_or_emotional_payoff => process trust', 'BTS/process proof', array['trust','relief','curiosity'], array['bts','raw_cut','mistake_repair','voice_note'], array['fake_authenticity','privacy_leak'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"TikTok Next 2026 unfiltered stories and BTS"}'::jsonb),
  ('2026_tiktok_curiosity_detour', 2026, 'tiktok', 'creator_education', 'Curiosity Detour Discovery', 'platform_shift', 'Search and recommendation can lead viewers from one intent into adjacent discoveries when the content opens a better question.', 'initial_query + surprising_adjacent_question + creator_answer + next_search_prompt => curiosity detour', 'search/discovery chain', array['curiosity','surprise','utility'], array['search_phrase','unexpected_pivot','followup_prompt'], array['clickbait','misdirection'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"TikTok search/discovery behavior"}'::jsonb),
  ('2026_tiktok_emotional_roi', 2026, 'instagram_reels', 'commerce_affiliate', 'Emotional ROI Purchase Logic', 'commerce_format', 'Intentional purchases spread when the creator explains the emotional return, use-case and tradeoff rather than only the product feature.', 'purchase_trigger + emotional_return + real_use_case + tradeoff_boundary => intentional commerce', 'purchase reasoning content', array['certainty','relief','identity'], array['decision_frame','tradeoff','honest_review'], array['overclaiming','hidden_sponsorship'], 'low', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"TikTok Next 2026 intentional/emotional purchasing"}'::jsonb),
  ('2025_youtube_maximalist_stack', 2025, 'youtube_shorts', 'entertainment_comedy', 'Maximalist Format Stack', 'platform_shift', 'Modern culture often layers edits, subtitles, references, reactions and formats; the trick is density with a clear promise.', 'clear_promise + layered_references + fast_context_aids + payoff_anchor => readable maximalism', 'dense edit / multi-layer clip', array['energy','recognition','completion'], array['captions','reaction_layer','reference_stack','payoff_anchor'], array['cognitive_overload','accessibility'], 'medium', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"YouTube Next Generation of Creativity / maximalist moment"}'::jsonb),
  ('2025_youtube_professional_fan', 2025, 'youtube_shorts', 'creator_education', 'Professional Fan Explainer', 'platform_shift', 'Fans who analyze, archive and explain culture become creators themselves; authority comes from care and specificity.', 'fan_knowledge + specific_receipt + explanatory_frame + community_invite => professional fan authority', 'fan explainer/reaction', array['belonging','mastery','trust'], array['explainer','receipt','timeline','fan_role'], array['copyright','parasocial_overreach'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"Think with Google Gen Z fandoms"}'::jsonb),
  ('2025_youtube_creator_media_business', 2025, 'youtube_shorts', 'creator_education', 'Creator As Media Business', 'platform_shift', 'Sustainable creators build repeatable shows, workflows, revenue paths and audience relationships rather than chasing isolated hits.', 'content_pillar + repeatable_workflow + monetization_fit + audience_relationship => creator media system', 'creator business system', array['trust','ambition','stability'], array['pillar','workflow','format_ladder','revenue_path'], array['overcommercialization'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"YouTube creator ecosystem reports"}'::jsonb),
  ('2025_youtube_shopping_trust_path', 2025, 'youtube_shorts', 'commerce_affiliate', 'Shopping Trust Pathway', 'commerce_format', 'Shopping content converts when discovery, review, comparison and post-purchase reassurance form one trust path.', 'discovery_hook + comparison_proof + honest_limit + next_action => shopping trust path', 'review/comparison funnel', array['certainty','relief','utility'], array['review','comparison','proof','affiliate_disclosure'], array['undisclosed_affiliate','false_claim'], 'low', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"YouTube Shopping culture report"}'::jsonb),
  ('2025_youtube_virtual_creator_boundary', 2025, 'youtube_shorts', 'entertainment_comedy', 'Virtual Creator Boundary', 'ai_format', 'Virtual or AI-assisted creator formats can entertain when fiction, authorship and audience relationship are explicit.', 'virtual_persona + clear_fiction_boundary + human_authorship_signal + audience_rule => safe virtual creator format', 'virtual/AI character content', array['novelty','play','curiosity'], array['virtual_avatar','fiction_label','lore_rule'], array['deception','likeness_confusion'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"YouTube virtual creators report"}'::jsonb),
  ('2026_hootsuite_meaningful_less_addictive', 2026, 'instagram_reels', 'lifestyle', 'Meaningful Less-Addictive Content', 'platform_shift', 'Users increasingly value content that feels meaningful, calming or useful over content engineered only for compulsion.', 'overstimulation_context + calm_or_meaningful_scene + useful_takeaway + gentle_exit => low-regret attention', 'calm utility/ritual content', array['calm','relief','meaning'], array['slow_scene','gentle_cta','saveable_takeaway'], array['wellness_overclaim','fake_simplicity'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"Hootsuite meaningful/cozy content"}'::jsonb),
  ('2026_sprout_social_search_proof', 2026, 'instagram_reels', 'creator_education', 'Social Search Proof Stack', 'platform_shift', 'Younger audiences use social search for how-tos, reviews and demos, so answers need evidence and lived perspective.', 'search_intent + lived_perspective + proof_stack + bookmark_cta => social search trust', 'how-to/review/search answer', array['utility','trust','certainty'], array['how_to','demo','review','save_cta'], array['unverified_advice','keyword_stuffing'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"Sprout social search trend"}'::jsonb),
  ('2026_sprout_format_choice', 2026, 'instagram_carousel', 'creator_education', 'Format Matches Story Depth', 'platform_shift', 'Reels carry voice/emotion while carousels carry layered context; strong generators choose format by narrative job.', 'story_job + format_strength + native_structure + CTA_fit => format-native idea', 'format strategy', array['clarity','utility','confidence'], array['reel_voice','carousel_depth','story_poll'], array['wrong_format_fatigue'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"Sprout Instagram format guidance"}'::jsonb),
  ('2026_sprout_real_people_story', 2026, 'instagram_reels', 'thought_leadership', 'Real Person Story Carrier', 'marketing_case', 'Stories feel credible when the person who lived the moment appears, instead of generic stock imagery or faceless claims.', 'real_person + lived_moment + specific_detail + brand_or_creator_lesson => embodied credibility', 'real-person story', array['trust','empathy','recognition'], array['founder_face','employee_story','customer_story'], array['privacy','tokenization'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"Sprout Instagram real people guidance"}'::jsonb),
  ('2026_comment_section_as_writer_room', 2026, 'instagram_reels', 'lifestyle', 'Comment Section Writer Room', 'meme', 'Comments become a content development surface when creators treat repeated questions, jokes and objections as next-episode material.', 'comment_pattern + creator_selection + anonymized_response + next_episode => comments-to-content loop', 'comment mining/series', array['belonging','recognition','anticipation'], array['comment_reply','series','pinned_comment'], array['privacy','pile_on'], 'low', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"community/comment engine synthesis"}'::jsonb),
  ('2026_remix_attribution_chain', 2026, 'instagram_reels', 'entertainment_comedy', 'Remix With Attribution Chain', 'meme', 'Remix culture travels farther when creators credit the source, add a clear transformation and invite a new branch.', 'source_credit + transformation_angle + creator_context + branch_prompt => ethical remix chain', 'remix/duet/stitch adaptation', array['play','belonging','novelty'], array['credit','remix','branch_prompt'], array['plagiarism','harassment'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"remix culture safety synthesis"}'::jsonb),
  ('2026_promise_packaging', 2026, 'youtube_shorts', 'creator_education', 'Promise Packaging Contract', 'platform_shift', 'Title, cover, first second and payoff must align; broken promises create short-term clicks and long-term trust decay.', 'specific_promise + immediate_proof + fulfilled_payoff + expectation_reset => trust-preserving hook', 'hook/packaging system', array['curiosity','trust','completion'], array['title','cover','first_second','payoff'], array['clickbait','overpromise'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"YouTube packaging and creator-system synthesis"}'::jsonb),
  ('2026_receipt_based_opinion', 2026, 'instagram_carousel', 'thought_leadership', 'Receipt-Based Opinion', 'marketing_case', 'Strong opinions travel safely when each claim has boundaries, examples and receipts rather than vague certainty.', 'bold_take + receipt_stack + claim_boundary + respectful_invite => discussable trust', 'thought leadership carousel/reel', array['trust','debate','clarity'], array['receipts','claim_boundary','comment_prompt'], array['misinformation','toxic_debate'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"trust and social search synthesis"}'::jsonb)
) as v(external_ref, year, platform, category_slug, title, phenomenon_type, abstracted_mechanism, reusable_pattern, participation_mode, emotional_triggers, format_signals, safety_risks, copy_risk, training_use, risk_level, metadata)
on conflict (source_id, external_ref) do update set
  year = excluded.year,
  platform = excluded.platform,
  category_slug = excluded.category_slug,
  title = excluded.title,
  phenomenon_type = excluded.phenomenon_type,
  abstracted_mechanism = excluded.abstracted_mechanism,
  reusable_pattern = excluded.reusable_pattern,
  participation_mode = excluded.participation_mode,
  emotional_triggers = excluded.emotional_triggers,
  format_signals = excluded.format_signals,
  safety_risks = excluded.safety_risks,
  copy_risk = excluded.copy_risk,
  training_use = excluded.training_use,
  risk_level = excluded.risk_level,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.viral_pattern_rules (
  id,
  name,
  family,
  pattern_formula,
  when_to_use,
  avoid_when,
  required_safety_checks,
  scoring_signals,
  generator_instructions,
  enabled
) values
(
  'VTP-019',
  'Unfiltered Process Proof',
  'process_proof',
  'unfinished_process + real_person + honest_correction + useful_or_emotional_payoff',
  array['AI-polished category fatigue is high', 'creator can safely show process', 'sponsor content needs human trust'],
  array['manufactured messiness', 'private workplace leaks', 'fake mistakes'],
  array['privacy_boundary', 'authenticity_claim_check', 'sponsor_disclosure'],
  '{"trust":0.16,"audience_aftertaste":0.12,"brand_fit":0.10,"fake_authenticity_penalty":0.24}'::jsonb,
  'Show real process, correction or decision texture. The imperfection must be relevant, not staged clutter.',
  true
),
(
  'VTP-020',
  'Curiosity Detour Discovery',
  'discovery_search',
  'initial_query + surprising_adjacent_question + creator_answer + next_search_prompt',
  array['education, review, travel, beauty, food or creator advice', 'there is an adjacent question viewers did not know to ask'],
  array['bait-and-switch', 'unrelated tangent', 'unsupported advice'],
  array['search_intent_check', 'evidence_note_if_claimed', 'promise_alignment'],
  '{"curiosity":0.15,"search_fit":0.13,"retention_tension":0.10,"misdirection_penalty":0.22}'::jsonb,
  'Start from what the audience searches, then open a more useful adjacent question and answer both cleanly.',
  true
),
(
  'VTP-021',
  'Emotional ROI Commerce',
  'commerce',
  'purchase_trigger + emotional_return + real_use_case + tradeoff_boundary',
  array['product, affiliate, beauty, fashion, home, food or travel buying decisions', 'creator can show actual use'],
  array['hard sell', 'fake urgency', 'unsupported transformation promise'],
  array['disclosure_required', 'claim_boundary', 'proof_note', 'commercial_boundary'],
  '{"purchase_intent":0.14,"trust":0.12,"save_utility":0.10,"overclaim_penalty":0.22}'::jsonb,
  'Explain not just what the product is, but what emotional job it does, who it is not for and what tradeoff exists.',
  true
),
(
  'VTP-022',
  'Readable Maximalism',
  'format_density',
  'clear_promise + layered_references + fast_context_aids + payoff_anchor',
  array['comedy, fandom, fashion, music, creator education', 'audience enjoys dense references'],
  array['accessibility failure', 'random overstimulation', 'no clear payoff'],
  array['accessibility_check', 'payoff_anchor_required', 'fatigue_check'],
  '{"novelty":0.13,"recognition":0.12,"watch_time":0.12,"overload_penalty":0.18}'::jsonb,
  'Layer references, captions and reactions only after the promise is clear; every layer must help comprehension or payoff.',
  true
),
(
  'VTP-023',
  'Professional Fan Authority',
  'fandom',
  'fan_knowledge + specific_receipt + explanatory_frame + community_invite',
  array['creator has deep niche knowledge', 'audience values analysis, archives or lore'],
  array['uncredited assets', 'gatekeeping toxicity', 'parasocial escalation'],
  array['copyright_asset_check', 'community_safety', 'non_toxic_framing'],
  '{"community_depth":0.15,"trust":0.13,"save_utility":0.09,"toxicity_penalty":0.18}'::jsonb,
  'Let the creator act as a generous expert fan: specific, credited, explanatory and welcoming.',
  true
),
(
  'VTP-024',
  'Creator Media System',
  'creator_business',
  'content_pillar + repeatable_workflow + monetization_fit + audience_relationship',
  array['creator education, thought leadership, business, commerce', 'idea should help long-term creator strategy'],
  array['one-off trend chase', 'over-monetized audience extraction', 'workflow too complex'],
  array['audience_contract_check', 'commercial_boundary', 'production_capacity_check'],
  '{"brand_equity":0.14,"series_potential":0.12,"creator_fit":0.12,"overcomplexity_penalty":0.14}'::jsonb,
  'Prefer ideas that can become a repeatable asset, not a single viral spike that drains the creator.',
  true
),
(
  'VTP-025',
  'Shopping Trust Path',
  'commerce_review',
  'discovery_hook + comparison_proof + honest_limit + next_action',
  array['affiliate, beauty, fashion, food, tech or travel product decisions', 'audience needs confidence before buying'],
  array['undisclosed affiliate', 'fake review', 'missing limitation'],
  array['affiliate_disclosure', 'proof_note', 'claim_boundary'],
  '{"purchase_intent":0.13,"trust":0.15,"save_utility":0.11,"fake_review_penalty":0.28}'::jsonb,
  'Build the buying journey: discovery, comparison, proof, limitation and low-pressure next action.',
  true
),
(
  'VTP-026',
  'Low-Regret Attention',
  'calm_meaning',
  'overstimulation_context + calm_or_meaningful_scene + useful_takeaway + gentle_exit',
  array['lifestyle, wellness-safe, travel, food, parenting, home, beauty rituals', 'audience is overstimulated'],
  array['pseudo-wellness claims', 'aestheticized hardship', 'empty calm with no takeaway'],
  array['wellness_claim_boundary', 'representation_guard', 'takeaway_required'],
  '{"audience_aftertaste":0.16,"save_utility":0.10,"trust":0.10,"emptiness_penalty":0.14}'::jsonb,
  'Design content people do not regret watching: sensory relief, meaning, small utility and a respectful exit.',
  true
),
(
  'VTP-027',
  'Promise Packaging Contract',
  'hook_integrity',
  'specific_promise + immediate_proof + fulfilled_payoff + expectation_reset',
  array['all premium idea cards', 'especially search, education, review and thought leadership'],
  array['clickbait', 'overpromising', 'payoff mismatch'],
  array['promise_alignment', 'claim_boundary', 'payoff_check'],
  '{"hook_clarity":0.13,"completion":0.13,"trust":0.13,"clickbait_penalty":0.30}'::jsonb,
  'The first second, title, cover, caption and payoff must all keep the same promise.',
  true
),
(
  'VTP-028',
  'Receipt-Based Opinion',
  'thought_leadership',
  'bold_take + receipt_stack + claim_boundary + respectful_invite',
  array['thought leadership, creator education, brand POV, social search answers', 'a claim needs debate-safe credibility'],
  array['unsupported hot take', 'toxic pile-on', 'sensitive claim without review'],
  array['evidence_boundary', 'non_toxic_framing', 'human_review_on_sensitive_context'],
  '{"quoteability":0.11,"trust":0.15,"comment_probability":0.11,"misinformation_penalty":0.26}'::jsonb,
  'Make the opinion strong but bounded: show receipts, limits and a respectful invitation to respond.',
  true
)
on conflict (id) do update set
  name = excluded.name,
  family = excluded.family,
  pattern_formula = excluded.pattern_formula,
  when_to_use = excluded.when_to_use,
  avoid_when = excluded.avoid_when,
  required_safety_checks = excluded.required_safety_checks,
  scoring_signals = excluded.scoring_signals,
  generator_instructions = excluded.generator_instructions,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.generator_eval_cases (
  slug,
  title,
  category_slug,
  persona_slug,
  input_brief,
  expected_patterns,
  forbidden_patterns,
  quality_rubric,
  enabled
) values
(
  'commerce_emotional_roi_review',
  'Commerce idea must show emotional ROI and honest limits',
  'commerce_affiliate',
  'product_reviewer',
  '{"platform":"instagram_reels","brief":"Create a premium commerce idea for a high-profile influencer reviewing a luxury product without hard-selling."}'::jsonb,
  array['VTP-021','VTP-025','VTP-027'],
  array['fake_urgency','missing_disclosure','overpromise'],
  '{"must_include":["emotional_return","honest_limit","proof_note","low_pressure_cta"],"minimum_score":0.85}'::jsonb,
  true
),
(
  'thought_leadership_receipt_opinion',
  'Thought leadership idea must be bold but receipt-based',
  'thought_leadership',
  'creator_teacher',
  '{"platform":"instagram_carousel","brief":"Create a strong opinion carousel about creator trends that is discussable, not toxic."}'::jsonb,
  array['VTP-028','VTP-013','VTP-027'],
  array['unsupported_hot_take','toxic_pile_on','pattern_id_leak'],
  '{"must_include":["receipt_stack","claim_boundary","respectful_invite","promise_alignment"],"minimum_score":0.84}'::jsonb,
  true
),
(
  'lifestyle_low_regret_attention',
  'Lifestyle idea must feel meaningful instead of addictive',
  'lifestyle',
  'relatable_lifestyle',
  '{"platform":"instagram_reels","brief":"Create a calming but premium lifestyle idea for an overstimulated audience."}'::jsonb,
  array['VTP-026','VTP-019','VTP-015'],
  array['fake_simplicity','pseudo_wellness_claim','empty_aesthetic'],
  '{"must_include":["small_ritual","useful_takeaway","gentle_exit","privacy_boundary"],"minimum_score":0.80}'::jsonb,
  true
),
(
  'creator_media_system_series',
  'Creator education idea must build a repeatable media system',
  'creator_education',
  'creator_teacher',
  '{"platform":"youtube_shorts","brief":"Create a creator education idea that turns one viral insight into a repeatable content system."}'::jsonb,
  array['VTP-024','VTP-014','VTP-027'],
  array['one_off_trend_chase','overcomplex_workflow','generic_advice'],
  '{"must_include":["content_pillar","repeatable_workflow","episode_variable","payoff_check"],"minimum_score":0.83}'::jsonb,
  true
),
(
  'fandom_professional_explainer',
  'Fandom idea must invite safe fan roles and avoid copyright risk',
  'entertainment_comedy',
  'comedy_observer',
  '{"platform":"instagram_reels","brief":"Create a fandom-style explainer/reaction idea around a public internet trend without using copyrighted clips."}'::jsonb,
  array['VTP-023','VTP-016','VTP-022'],
  array['uncredited_clip','gatekeeping_toxicity','harassment_prompt'],
  '{"must_include":["fan_role","specific_receipt","safe_asset_plan","comment_question"],"minimum_score":0.81}'::jsonb,
  true
)
on conflict (slug) do update set
  title = excluded.title,
  category_slug = excluded.category_slug,
  persona_slug = excluded.persona_slug,
  input_brief = excluded.input_brief,
  expected_patterns = excluded.expected_patterns,
  forbidden_patterns = excluded.forbidden_patterns,
  quality_rubric = excluded.quality_rubric,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.admin_configs (namespace, version, config, enabled)
values (
  'training.viral_deep_research_round_2',
  '2026-v2',
  '{
    "training_mode": "pattern_only",
    "sources": [
      "TikTok Next 2026",
      "YouTube Culture & Trends",
      "Think with Google Gen Z fandoms",
      "Sprout social search and Instagram trends",
      "Hootsuite Social Trends 2026",
      "Axios social search reporting"
    ],
    "new_pattern_ids": ["VTP-019","VTP-020","VTP-021","VTP-022","VTP-023","VTP-024","VTP-025","VTP-026","VTP-027","VTP-028"],
    "generator_priorities": [
      "show real process and human proof instead of polished sameness",
      "use curiosity detours without bait-and-switch",
      "make commerce explain emotional ROI and honest limits",
      "build creator media systems, not one-off trend chasing",
      "protect hook integrity with promise packaging",
      "make opinions receipt-based and debate-safe"
    ],
    "scoring_adjustments": {
      "process_trust": 0.10,
      "promise_alignment": 0.10,
      "emotional_roi": 0.08,
      "receipt_quality": 0.09,
      "low_regret_attention": 0.08,
      "creator_system_value": 0.09,
      "clickbait_penalty": 0.20,
      "fake_authenticity_penalty": 0.18
    }
  }'::jsonb,
  true
)
on conflict (namespace, version) do update set
  config = excluded.config,
  enabled = excluded.enabled;


with source as (
  insert into public.viral_training_sources (
    slug,
    title,
    source_type,
    uri,
    coverage_start_year,
    coverage_end_year,
    reliability_notes,
    metadata,
    enabled
  ) values (
    'ultra_deep_viral_training_2026_round_3',
    'Ultra Deep Viral Potential Research Round 3',
    'external_research',
    'multi_source_ultra_deep_research_2026_round_3',
    2024,
    2026,
    'Ultra-deep research expansion from platform culture reports, social search behavior, creator commerce, fandom and meaningful attention research. Stored as abstract mechanisms only.',
    '{
      "training_policy": "pattern_only",
      "anti_copy_required": true,
      "sources": [
        "https://ads.tiktok.com/business/en-US/next",
        "https://www.youtube.com/trends/report/",
        "https://business.google.com/us/think/search-and-video/gen-z-youtube-fandoms-and-video-marketing-trends/",
        "https://sproutsocial.com/insights/social-media-trends/",
        "https://sproutsocial.com/insights/instagram-trends/",
        "https://www.hootsuite.com/research/social-trends",
        "https://newsroom.pinterest.com/en-gb/news/pinterest-predicts-nonconformity-self-preservation-and-escapism-drive-21-trends-for-2026/",
        "https://www.axios.com/2024/04/11/google-gen-z-search-engines-tiktok-youtube"
      ],
      "covers": ["short_to_long_loyalty", "dm_decision_funnel", "creator_lore", "objection_handling", "micro_rituals", "dual_audience_packaging", "myth_flip", "human_led_ai", "localized_remix", "save_first_utility", "sensory_proof", "transparent_deal"]
    }'::jsonb,
    true
  )
  on conflict (slug) do update set
    title = excluded.title,
    source_type = excluded.source_type,
    uri = excluded.uri,
    coverage_start_year = excluded.coverage_start_year,
    coverage_end_year = excluded.coverage_end_year,
    reliability_notes = excluded.reliability_notes,
    metadata = excluded.metadata,
    enabled = excluded.enabled
  returning id
)
insert into public.viral_training_examples (
  source_id,
  external_ref,
  year,
  platform,
  category_slug,
  title,
  phenomenon_type,
  abstracted_mechanism,
  reusable_pattern,
  participation_mode,
  emotional_triggers,
  format_signals,
  safety_risks,
  copy_risk,
  training_use,
  risk_level,
  metadata
)
select source.id, v.external_ref, v.year, v.platform, v.category_slug, v.title, v.phenomenon_type,
  v.abstracted_mechanism, v.reusable_pattern, v.participation_mode, v.emotional_triggers,
  v.format_signals, v.safety_risks, v.copy_risk, v.training_use, v.risk_level, v.metadata
from source
cross join (values
  ('2026_short_to_long_loyalty', 2026, 'youtube_shorts', 'creator_education', 'Short Clip To Loyalty Bridge', 'platform_shift', 'Short video can create discovery, but durable value comes when it points to a deeper asset, series or community ritual.', 'short_hook + deeper_asset_tease + clear_next_step + recurring_reason => discovery-to-loyalty bridge', 'short-to-long funnel', array['curiosity','trust','anticipation'], array['shorts','series_tease','longform_bridge','community_post'], array['clickbait_bridge','dead_end_tease'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"YouTube Shorts plus culture report synthesis"}'::jsonb),
  ('2026_dm_decision_funnel', 2026, 'instagram_stories', 'commerce_affiliate', 'DM To Decision Funnel', 'commerce_format', 'High-intent viewers often move from public content to private questions; premium creator commerce needs a trusted answer path.', 'public_hook + story_qualifier + dm_keyword + saved_answer + soft_next_action => private decision funnel', 'DM/story conversion', array['certainty','trust','personal_attention'], array['story_poll','dm_keyword','saved_reply','highlight'], array['privacy','overautomation','hidden_sponsorship'], 'low', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"premium_use":"turn idea card into public content plus DM follow-up plan"}'::jsonb),
  ('2026_creator_lore_map', 2026, 'instagram_reels', 'lifestyle', 'Creator Lore Map', 'meme', 'Followers attach to recurring phrases, locations, rituals and characters when they can understand the lore quickly.', 'recurring_symbol + newcomer_context + fan_reward + next_lore_prompt => accessible creator lore', 'lore-building series', array['belonging','recognition','anticipation'], array['recurring_symbol','lore_caption','inside_joke','newcomer_note'], array['exclusion','parasocial_pressure'], 'medium', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"fandom plus episodic creator culture synthesis"}'::jsonb),
  ('2026_objection_writer_room', 2026, 'instagram_reels', 'commerce_affiliate', 'Audience Objection Writer Room', 'commerce_format', 'Repeated objections in comments are raw material for trust-building content if answered respectfully and specifically.', 'repeated_objection + creator_acknowledgment + proof_or_boundary + useful_reply => objection-to-content loop', 'comment mining', array['trust','relief','recognition'], array['comment_reply','objection_overlay','proof_demo'], array['mocking_commenters','privacy'], 'low', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"comment section as content development plus commerce trust"}'::jsonb),
  ('2026_micro_community_ritual', 2026, 'instagram_stories', 'lifestyle', 'Micro Community Ritual', 'platform_shift', 'Small repeated rituals can create belonging without needing massive trend participation.', 'weekly_ritual + audience_input + tiny_reward + archive_or_highlight => micro-community habit', 'weekly ritual', array['belonging','comfort','routine'], array['story_poll','highlight','recurring_name','tiny_reward'], array['fake_exclusivity','privacy'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"community and cozy/meaningful content reports"}'::jsonb),
  ('2026_dual_audience_packaging', 2026, 'youtube_shorts', 'entertainment_comedy', 'Newcomer And Fan Packaging', 'platform_shift', 'The same content can serve newcomers and existing fans when it gives context upfront and rewards deeper knowledge later.', 'newcomer_context + fan_signal + layered_payoff + optional_deep_link => dual-audience package', 'fandom explainer', array['belonging','mastery','curiosity'], array['context_card','fan_easter_egg','explainer','deep_link'], array['gatekeeping','copyright'], 'medium', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"YouTube fandom and professional fan research"}'::jsonb),
  ('2026_evidence_myth_flip', 2026, 'instagram_carousel', 'creator_education', 'Evidence-Led Myth Flip', 'marketing_case', 'Myth-busting spreads when it begins with a familiar wrong belief and replaces it with bounded evidence and a practical next step.', 'common_belief + evidence_flip + practical_step + comment_test => myth-to-utility loop', 'myth-bust carousel/reel', array['surprise','certainty','utility'], array['myth_overlay','receipt_stack','saveable_steps'], array['misinformation','overclaiming'], 'low', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"social search plus evidence-led trust"}'::jsonb),
  ('2026_human_led_ai_workflow', 2026, 'instagram_reels', 'creator_education', 'Human-Led AI Workflow', 'ai_format', 'AI content earns trust when the human decision, edit, rejection and final taste are visible.', 'ai_draft + human_selection + rejected_options + final_reason => human-led AI workflow', 'AI workflow BTS', array['trust','curiosity','mastery'], array['screen_record','selection_reason','ai_label','before_after_draft'], array['AI deception','unlicensed_style'], 'low', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"AI transparency and authenticity research"}'::jsonb),
  ('2026_localized_global_remix', 2026, 'instagram_reels', 'lifestyle', 'Localized Global Remix', 'meme', 'Global formats become more shareable when adapted to local humor, daily friction and language without stereotyping.', 'global_template_shape + local_friction + creator_context + respectful_translation => localized remix', 'localized remix', array['recognition','identity','humor'], array['local_phrase','daily_scene','template_translation'], array['stereotype','cultural_flattening'], 'medium', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"global/local trend adaptation synthesis"}'::jsonb),
  ('2026_save_first_utility_stack', 2026, 'instagram_carousel', 'creator_education', 'Save-First Utility Stack', 'platform_shift', 'Useful content gets shared later when it packages a problem, decision rule and reusable checklist.', 'specific_problem + decision_rule + checklist + future_use_case => save-first utility', 'checklist/carousel', array['relief','mastery','certainty'], array['checklist','decision_tree','bookmark_cta'], array['generic_advice','information_overload'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"social search and saveable content synthesis"}'::jsonb),
  ('2026_sensory_proof_loop', 2026, 'instagram_reels', 'food', 'Sensory Proof Loop', 'commerce_format', 'Products and places feel more believable when viewers can almost sense texture, sound, scale or movement.', 'sensory_detail + close_proof + creator_reaction + useful_context => sensory trust loop', 'sensory demo', array['desire','trust','satisfaction'], array['close_up','sound','texture','scale_reference'], array['deceptive_demo','overclaim'], 'low', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"food/beauty/product proof format synthesis"}'::jsonb),
  ('2026_transparent_deal_story', 2026, 'instagram_reels', 'commerce_affiliate', 'Transparent Deal Story', 'commerce_format', 'Sponsored content feels premium when the creator explains why the partnership fits, what was refused and what remains independent.', 'sponsor_fit + creator_standard + refused_boundary + honest_recommendation => transparent deal trust', 'sponsor transparency', array['trust','respect','certainty'], array['disclosure','brand_fit','boundary','honest_note'], array['hidden_sponsor','fake_independence'], 'low', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"creator commerce trust synthesis"}'::jsonb),
  ('2026_one_take_authority', 2026, 'instagram_reels', 'thought_leadership', 'One-Take Authority Clip', 'marketing_case', 'A clean one-take answer can outperform over-edited advice when the creator has a precise point and visible confidence.', 'specific_question + one_take_answer + concise_receipt + next_question => authority without overproduction', 'one-take answer', array['trust','clarity','authority'], array['one_take','talking_head','caption_receipt'], array['unsupported_authority'], 'low', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"authenticity, social search and thought leadership synthesis"}'::jsonb),
  ('2026_anti_trend_taste_signal', 2026, 'instagram_carousel', 'fashion', 'Anti-Trend Taste Signal', 'meme', 'Refusing a trend can be more brand-building than joining it when the refusal teaches the creator''s taste system.', 'popular_trend + taste_filter + refusal_reason + better_alternative => anti-trend authority', 'curation/opinion carousel', array['identity','trust','debate'], array['what_i_skip','taste_filter','alternative'], array['snobbery','shaming'], 'medium', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"trend fatigue plus curation research"}'::jsonb),
  ('2026_micro_case_study', 2026, 'instagram_carousel', 'creator_education', 'Micro Case Study', 'marketing_case', 'A tiny case with before-context, intervention and result teaches more than generic advice and feels saveable.', 'before_context + one_intervention + result_signal + transferable_rule => micro-case utility', 'case study carousel/reel', array['mastery','trust','save'], array['case_study','before_context','transferable_rule'], array['confidentiality','overclaim'], 'low', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"creator education and social search synthesis"}'::jsonb),
  ('2026_audience_identity_choice', 2026, 'instagram_stories', 'lifestyle', 'Audience Identity Choice', 'meme', 'Simple binary or tiered identity choices drive comments because viewers locate themselves socially.', 'identity_choice + nonjudgmental_options + creator_self_placement + comment_prompt => identity sorting without harm', 'poll/comment identity choice', array['identity','play','belonging'], array['poll','tier_list','comment_choice'], array['stereotyping','shaming'], 'medium', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"identity play and community trend synthesis"}'::jsonb),
  ('2026_quiet_luxury_proof', 2026, 'instagram_reels', 'luxury', 'Quiet Luxury Proof', 'marketing_case', 'Premium audiences respond to restraint when the proof is in material, edit, service or decision logic rather than loud status display.', 'status_pressure + restrained_choice + material_or_service_proof + taste_reason => quiet premium signal', 'luxury proof reel', array['aspiration','trust','taste'], array['detail_closeup','restraint','editors_note'], array['status_shaming','overconsumption'], 'medium', 'pattern_only', 'low'::public.viral_training_risk_level, '{"source_hint":"luxury creator and curation synthesis"}'::jsonb),
  ('2026_follow_up_receipt', 2026, 'instagram_reels', 'beauty', 'Follow-Up Receipt Content', 'commerce_format', 'Trust compounds when creators return after time has passed with what changed, what did not and what they would alter.', 'original_claim + time_gap + receipt_update + adjusted_recommendation => trust compounding follow-up', 'follow-up review', array['trust','certainty','relief'], array['follow_up','time_gap','receipt','adjustment'], array['unsupported_claim','hidden_change'], 'low', 'pattern_only', 'medium'::public.viral_training_risk_level, '{"source_hint":"review trust and creator accountability synthesis"}'::jsonb)
) as v(external_ref, year, platform, category_slug, title, phenomenon_type, abstracted_mechanism, reusable_pattern, participation_mode, emotional_triggers, format_signals, safety_risks, copy_risk, training_use, risk_level, metadata)
on conflict (source_id, external_ref) do update set
  year = excluded.year,
  platform = excluded.platform,
  category_slug = excluded.category_slug,
  title = excluded.title,
  phenomenon_type = excluded.phenomenon_type,
  abstracted_mechanism = excluded.abstracted_mechanism,
  reusable_pattern = excluded.reusable_pattern,
  participation_mode = excluded.participation_mode,
  emotional_triggers = excluded.emotional_triggers,
  format_signals = excluded.format_signals,
  safety_risks = excluded.safety_risks,
  copy_risk = excluded.copy_risk,
  training_use = excluded.training_use,
  risk_level = excluded.risk_level,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.viral_pattern_rules (
  id,
  name,
  family,
  pattern_formula,
  when_to_use,
  avoid_when,
  required_safety_checks,
  scoring_signals,
  generator_instructions,
  enabled
) values
(
  'VTP-029',
  'Short To Long Loyalty Bridge',
  'loyalty_bridge',
  'short_hook + deeper_asset_tease + clear_next_step + recurring_reason',
  array['short video discovery needs a deeper follow-up', 'creator has series, longform, newsletter, broadcast or product ecosystem'],
  array['dead-end teaser', 'clickbait bridge', 'unclear next step'],
  array['promise_alignment', 'next_step_clarity', 'payoff_check'],
  '{"retention_tension":0.10,"return_behavior":0.16,"brand_equity":0.11,"dead_end_penalty":0.20}'::jsonb,
  'Use short video as an entry point into a deeper asset or recurring relationship; make the next step specific and worth it.',
  true
),
(
  'VTP-030',
  'DM To Decision Funnel',
  'private_conversion',
  'public_hook + story_qualifier + dm_keyword + saved_answer + soft_next_action',
  array['premium commerce, service, travel, beauty, coaching or product decisions', 'audience needs private confidence'],
  array['privacy-invasive automation', 'hidden sponsorship', 'aggressive sales scripts'],
  array['privacy_boundary', 'sponsor_disclosure', 'commercial_boundary'],
  '{"purchase_intent":0.13,"trust":0.14,"community_depth":0.09,"privacy_penalty":0.22}'::jsonb,
  'Design public content plus a private-safe answer path. The DM mechanic should help the viewer decide, not pressure them.',
  true
),
(
  'VTP-031',
  'Creator Lore Map',
  'creator_lore',
  'recurring_symbol + newcomer_context + fan_reward + next_lore_prompt',
  array['creator has recurring jokes, rituals, locations, phrases or characters', 'audience includes both old fans and newcomers'],
  array['inside joke with no context', 'parasocial pressure', 'exclusionary fandom'],
  array['newcomer_context_required', 'parasocial_boundary', 'community_safety'],
  '{"recognition":0.14,"community_depth":0.14,"series_potential":0.12,"exclusion_penalty":0.16}'::jsonb,
  'Turn recurring creator elements into accessible lore: explain enough for newcomers and reward existing fans.',
  true
),
(
  'VTP-032',
  'Objection Writer Room',
  'comment_mining',
  'repeated_objection + creator_acknowledgment + proof_or_boundary + useful_reply',
  array['comments repeat the same objection or doubt', 'creator can answer with proof or clear limit'],
  array['mocking commenters', 'defensive tone', 'private comment exposure'],
  array['privacy_boundary', 'non_toxic_framing', 'proof_note'],
  '{"trust":0.15,"comment_probability":0.12,"save_utility":0.09,"defensiveness_penalty":0.16}'::jsonb,
  'Treat objections as a writing room: acknowledge, answer, prove or set a boundary without dunking on the audience.',
  true
),
(
  'VTP-033',
  'Micro Community Ritual',
  'community_ritual',
  'weekly_ritual + audience_input + tiny_reward + archive_or_highlight',
  array['creator wants loyalty not just reach', 'story, broadcast or highlight surfaces are available'],
  array['fake scarcity', 'private details', 'ritual with no reward'],
  array['privacy_boundary', 'community_permission', 'reward_clarity'],
  '{"community_depth":0.16,"return_behavior":0.14,"trust":0.10,"fake_exclusivity_penalty":0.16}'::jsonb,
  'Build small repeated rituals that followers can recognize, join and revisit.',
  true
),
(
  'VTP-034',
  'Dual Audience Packaging',
  'fandom_packaging',
  'newcomer_context + fan_signal + layered_payoff + optional_deep_link',
  array['fandom, entertainment, education, niche expertise or creator lore', 'content must serve new and existing viewers'],
  array['gatekeeping', 'contextless references', 'copyrighted assets without rights'],
  array['newcomer_context_required', 'copyright_asset_check', 'non_toxic_framing'],
  '{"hook_clarity":0.11,"recognition":0.13,"community_depth":0.12,"gatekeeping_penalty":0.18}'::jsonb,
  'Package content so a new viewer understands the premise and a fan gets a deeper reward.',
  true
),
(
  'VTP-035',
  'Evidence-Led Myth Flip',
  'myth_flip',
  'common_belief + evidence_flip + practical_step + comment_test',
  array['social search, education, beauty, fitness-safe, finance-safe, creator education', 'a common belief can be corrected safely'],
  array['medical/legal/financial claims without evidence', 'rage-bait correction', 'humiliating the audience'],
  array['evidence_boundary', 'claim_boundary', 'non_toxic_framing'],
  '{"curiosity":0.12,"trust":0.15,"save_utility":0.12,"overclaim_penalty":0.24}'::jsonb,
  'Start with the familiar belief, flip it with bounded evidence, then give one practical next step.',
  true
),
(
  'VTP-036',
  'Human-Led AI Workflow',
  'human_ai_workflow',
  'ai_draft + human_selection + rejected_options + final_reason',
  array['AI is used for ideation, visuals, editing, planning or moodboards', 'creator can show taste decisions'],
  array['AI deception', 'unlicensed style imitation', 'claiming AI output as real proof'],
  array['ai_disclosure', 'human_authorship_signal', 'likeness_permission'],
  '{"novelty":0.11,"trust":0.14,"creator_fit":0.11,"ai_deception_penalty":0.28}'::jsonb,
  'Show AI as a draft tool and the human as editor: what was selected, rejected and why.',
  true
),
(
  'VTP-037',
  'Localized Global Remix',
  'localized_remix',
  'global_template_shape + local_friction + creator_context + respectful_translation',
  array['global trend needs local audience fit', 'creator has local cultural fluency'],
  array['stereotyping', 'cultural flattening', 'copying trend surface without local meaning'],
  array['representation_guard', 'local_context_check', 'anti_copy_guard'],
  '{"audience_relevance":0.14,"recognition":0.12,"novelty":0.10,"stereotype_penalty":0.24}'::jsonb,
  'Translate the mechanism of a global trend into local daily friction, language and creator context.',
  true
),
(
  'VTP-038',
  'Save-First Utility Stack',
  'save_utility',
  'specific_problem + decision_rule + checklist + future_use_case',
  array['audience will need the idea later', 'content can become a checklist, map, rule or decision tree'],
  array['generic advice', 'information overload', 'unverified claims'],
  array['evidence_note_if_claimed', 'compression_check', 'save_utility_required'],
  '{"save_utility":0.18,"search_fit":0.11,"hook_clarity":0.10,"generic_penalty":0.18}'::jsonb,
  'Design the card around future usefulness: one problem, one rule, one checklist, one reason to save.',
  true
),
(
  'VTP-039',
  'Sensory Proof Loop',
  'sensory_proof',
  'sensory_detail + close_proof + creator_reaction + useful_context',
  array['food, beauty, travel, fashion, luxury, home or product demos', 'viewer can judge through sensory cues'],
  array['deceptive demo', 'unverifiable outcome', 'overstimulating without context'],
  array['proof_note', 'claim_boundary', 'editing_integrity_check'],
  '{"visual_hook":0.14,"trust":0.11,"desire":0.12,"deceptive_demo_penalty":0.24}'::jsonb,
  'Use texture, sound, scale and movement as proof, then add creator context so it is not just aesthetic.',
  true
),
(
  'VTP-040',
  'Transparent Deal Story',
  'sponsor_trust',
  'sponsor_fit + creator_standard + refused_boundary + honest_recommendation',
  array['sponsored posts, affiliate, luxury partnerships, product boxes', 'creator can explain why the deal fits'],
  array['hidden sponsorship', 'fake independence', 'sponsor overcontrol'],
  array['sponsor_disclosure', 'commercial_boundary', 'brand_fit_check'],
  '{"brand_fit":0.15,"trust":0.15,"partnership_signal":0.12,"hidden_sponsor_penalty":0.30}'::jsonb,
  'Make the partnership itself part of trust: why this brand, what the creator refused and what remains independent.',
  true
)
on conflict (id) do update set
  name = excluded.name,
  family = excluded.family,
  pattern_formula = excluded.pattern_formula,
  when_to_use = excluded.when_to_use,
  avoid_when = excluded.avoid_when,
  required_safety_checks = excluded.required_safety_checks,
  scoring_signals = excluded.scoring_signals,
  generator_instructions = excluded.generator_instructions,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.generator_eval_cases (
  slug,
  title,
  category_slug,
  persona_slug,
  input_brief,
  expected_patterns,
  forbidden_patterns,
  quality_rubric,
  enabled
) values
(
  'commerce_dm_decision_transparency',
  'Commerce idea must combine public proof with private-safe decision support',
  'commerce_affiliate',
  'product_reviewer',
  '{"platform":"instagram_stories","brief":"Create a premium commerce idea that uses a public Reel, Story poll and DM keyword without pressuring the buyer."}'::jsonb,
  array['VTP-030','VTP-032','VTP-040'],
  array['privacy_invasive_dm','hidden_sponsorship','hard_sell'],
  '{"must_include":["dm_keyword","saved_answer","sponsor_disclosure","honest_boundary"],"minimum_score":0.86}'::jsonb,
  true
),
(
  'creator_lore_dual_audience',
  'Lifestyle idea must make creator lore accessible to newcomers',
  'lifestyle',
  'relatable_lifestyle',
  '{"platform":"instagram_reels","brief":"Create a recurring lifestyle series idea that rewards long-time fans but gives newcomers enough context."}'::jsonb,
  array['VTP-031','VTP-034','VTP-033'],
  array['inside_joke_without_context','parasocial_pressure','fake_exclusivity'],
  '{"must_include":["newcomer_context","fan_reward","recurring_symbol","next_lore_prompt"],"minimum_score":0.82}'::jsonb,
  true
),
(
  'education_myth_flip_save_stack',
  'Creator education idea must flip a myth and become saveable',
  'creator_education',
  'creator_teacher',
  '{"platform":"instagram_carousel","brief":"Create a creator education carousel that corrects a common growth myth with evidence and a checklist."}'::jsonb,
  array['VTP-035','VTP-038','VTP-027'],
  array['unsupported_claim','generic_advice','clickbait'],
  '{"must_include":["common_belief","evidence_flip","decision_rule","future_use_case"],"minimum_score":0.85}'::jsonb,
  true
),
(
  'ai_workflow_human_taste',
  'AI-assisted idea must show human authorship and rejected options',
  'creator_education',
  'expert_guide',
  '{"platform":"instagram_reels","brief":"Create a premium AI-assisted workflow idea for a high-profile creator planning a campaign."}'::jsonb,
  array['VTP-036','VTP-019','VTP-027'],
  array['ai_deception','unlicensed_style','pattern_id_leak'],
  '{"must_include":["ai_disclosure","human_selection_reason","rejected_options","promise_alignment"],"minimum_score":0.84}'::jsonb,
  true
),
(
  'food_sensory_proof_save',
  'Food idea must use sensory proof and a saveable rule',
  'food',
  'product_reviewer',
  '{"platform":"instagram_reels","brief":"Create a food/product idea that makes viewers trust quality through sensory proof and gives a reusable buying rule."}'::jsonb,
  array['VTP-039','VTP-038','VTP-021'],
  array['deceptive_demo','overclaim','generic_caption'],
  '{"must_include":["sensory_detail","close_proof","decision_rule","honest_limit"],"minimum_score":0.83}'::jsonb,
  true
),
(
  'local_remix_turkey_safe',
  'Localized remix must avoid stereotypes and copycat trend use',
  'entertainment_comedy',
  'comedy_observer',
  '{"platform":"instagram_reels","brief":"Create a Turkey-localized remix of a global short-video format without copying its surface or using stereotypes."}'::jsonb,
  array['VTP-037','VTP-003','VTP-011'],
  array['stereotype','copycat_surface','mocking_protected_traits'],
  '{"must_include":["local_friction","creator_context","respectful_translation","safe_target"],"minimum_score":0.82}'::jsonb,
  true
)
on conflict (slug) do update set
  title = excluded.title,
  category_slug = excluded.category_slug,
  persona_slug = excluded.persona_slug,
  input_brief = excluded.input_brief,
  expected_patterns = excluded.expected_patterns,
  forbidden_patterns = excluded.forbidden_patterns,
  quality_rubric = excluded.quality_rubric,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.admin_configs (namespace, version, config, enabled)
values (
  'training.viral_ultra_deep_research_round_3',
  '2026-v3',
  '{
    "training_mode": "pattern_only",
    "new_pattern_ids": ["VTP-029","VTP-030","VTP-031","VTP-032","VTP-033","VTP-034","VTP-035","VTP-036","VTP-037","VTP-038","VTP-039","VTP-040"],
    "generator_priorities": [
      "bridge short-form discovery into long-term loyalty",
      "turn comment objections into trust-building content",
      "make creator lore accessible to newcomers and rewarding for fans",
      "use DM/story flows as private-safe decision support",
      "show human-led AI workflows with rejected options",
      "localize global formats through audience truth, not stereotypes",
      "make sensory proof and save-first utility part of premium idea cards",
      "make sponsored content transparent about fit, boundaries and independence"
    ],
    "scoring_adjustments": {
      "loyalty_bridge": 0.09,
      "private_decision_support": 0.08,
      "creator_lore_accessibility": 0.08,
      "objection_handling": 0.09,
      "save_first_utility": 0.10,
      "sensory_proof": 0.08,
      "localized_relevance": 0.08,
      "transparent_sponsor_fit": 0.10,
      "stereotype_penalty": 0.22,
      "privacy_violation_penalty": 0.28
    }
  }'::jsonb,
  true
)
on conflict (namespace, version) do update set
  config = excluded.config,
  enabled = excluded.enabled;
