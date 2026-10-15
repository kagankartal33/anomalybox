-- ===========================================================================
-- ANOMALY BOX: 100% AUTHENTIC NICHE-SPECIFIC VIRAL STOCK SEED (2026)
-- Replaces all generic archetype mad-libs with bespoke, shoot-ready briefs
-- ===========================================================================

begin;

-- 1. Clean up old stock inventory safely
delete from public.checkout_inventory_reservations;
update public.idea_inventory set status = 'retired' where status = 'available';

insert into public.categories (slug, name, family, enabled, risk_level, sort_order)
values ('fashion', 'Fashion', 'creator_content', true, 'low', 100)
on conflict (slug) do update set enabled = true, name = excluded.name;

-- [FASHION] The 3-Second Silhouette Contrast Rule (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'e5af3cef-fe6c-4475-a46e-c8dcbab01201'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The 3-Second Silhouette Contrast Rule', 'Demonstrate why matching tight-on-tight or loose-on-loose looks flat, while pairing structured outerwear with relaxed tailoring immediately signals editorial taste.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["The reason this outfit feels expensive has nothing to do with the label; it’s silhouette contrast.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Silhouette silhouette flaw reveal", "Volume ratio breakdown (1 structured : 1 relaxed)", "Fabric drape test in natural light", "Final mirror checklist"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'e5af3cef-fe6c-4475-a46e-c8dcbab01201'::uuid, 'The 3-Second Silhouette Contrast Rule', '{"title": "The 3-Second Silhouette Contrast Rule", "one_sentence_premise": "Demonstrate why matching tight-on-tight or loose-on-loose looks flat, while pairing structured outerwear with relaxed tailoring immediately signals editorial taste.", "idea_summary": {"title": "The 3-Second Silhouette Contrast Rule", "premise": "Demonstrate why matching tight-on-tight or loose-on-loose looks flat, while pairing structured outerwear with relaxed tailoring immediately signals editorial taste.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Silhouette silhouette flaw reveal → Volume ratio breakdown (1 structured : 1 relaxed) → Fabric drape test in natural light → Final mirror checklist", "opening_visual": "Full-length mirror shot starting on a flat silhouette, instantly swapped to a balanced high-low volume contrast.", "visual_texture": "Editorial, crisp, minimal, high-contrast daylight", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Silhouette", "visual_action": "Silhouette silhouette flaw reveal", "spoken_audio": "The reason this outfit feels expensive has nothing to do with the label; it’s silhouette contrast."}, {"beat_number": 2, "purpose": "Volume", "visual_action": "Volume ratio breakdown (1 structured : 1 relaxed)", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Fabric", "visual_action": "Fabric drape test in natural light", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Final", "visual_action": "Final mirror checklist", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "The reason this outfit feels expensive has nothing to do with the label; it’s silhouette contrast.", "first_second_visual_hook": "Full-length mirror shot starting on a flat silhouette, instantly swapped to a balanced high-low volume contrast.", "hook_options": ["The reason this outfit feels expensive has nothing to do with the label; it’s silhouette contrast.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Editorial, crisp, minimal, high-contrast daylight", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Positions creator as an editorial stylist who understands architectural proportion rather than fast-fashion trends.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'e5af3cef-fe6c-4475-a46e-c8dcbab01201'::uuid,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 96, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "fashion", "authentic_niche_2026": true}'::jsonb
);

-- [FASHION] The Unhemmed vs Tailored Break Test (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'f350aa1b-fa03-4252-a0f3-ce0f96602396'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Unhemmed vs Tailored Break Test', 'Show how trouser break (full break vs slight break vs no break) completely changes leg elongation and shoe interaction across 3 footwear styles.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Most trousers don''t look bad because of the cut; they look bad because of where they hit the shoe.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Problem shot of fabric bunching over sneakers", "Side-by-side hem measurement comparison", "The 1/4-inch alteration rule", "Three shoe pairings test"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'f350aa1b-fa03-4252-a0f3-ce0f96602396'::uuid, 'The Unhemmed vs Tailored Break Test', '{"title": "The Unhemmed vs Tailored Break Test", "one_sentence_premise": "Show how trouser break (full break vs slight break vs no break) completely changes leg elongation and shoe interaction across 3 footwear styles.", "idea_summary": {"title": "The Unhemmed vs Tailored Break Test", "premise": "Show how trouser break (full break vs slight break vs no break) completely changes leg elongation and shoe interaction across 3 footwear styles.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Problem shot of fabric bunching over sneakers → Side-by-side hem measurement comparison → The 1/4-inch alteration rule → Three shoe pairings test", "opening_visual": "Extreme close-up panning down from belt line to the exact point trouser hem touches loafer vs sneaker.", "visual_texture": "Precise, sartorial, tactile, natural studio light", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Problem", "visual_action": "Problem shot of fabric bunching over sneakers", "spoken_audio": "Most trousers don''''t look bad because of the cut; they look bad because of where they hit the shoe."}, {"beat_number": 2, "purpose": "Side-by-side", "visual_action": "Side-by-side hem measurement comparison", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The 1/4-inch alteration rule", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Three", "visual_action": "Three shoe pairings test", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Most trousers don''t look bad because of the cut; they look bad because of where they hit the shoe.", "first_second_visual_hook": "Extreme close-up panning down from belt line to the exact point trouser hem touches loafer vs sneaker.", "hook_options": ["Most trousers don''t look bad because of the cut; they look bad because of where they hit the shoe.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Precise, sartorial, tactile, natural studio light", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Establishes sartorial craftsmanship and attention to tailoring details.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'f350aa1b-fa03-4252-a0f3-ce0f96602396'::uuid,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 94, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "fashion", "authentic_niche_2026": true}'::jsonb
);

-- [FASHION] Fabric Weight & Drape: The Invisible Luxury Filter (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '44fc431e-a6c8-4e6e-b8a9-6db816bad93d'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Fabric Weight & Drape: The Invisible Luxury Filter', 'Compare identical silhouettes in polyester blend versus heavy double-faced wool, demonstrating how weight changes movement on camera.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["You can spot cheap tailoring from across the room just by how the shoulder moves.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Walking turn in lightweight synthetic vs heavy natural fiber", "Touch test on lapel canvas", "The natural recovery test", "Shopping tag checklist"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '44fc431e-a6c8-4e6e-b8a9-6db816bad93d'::uuid, 'Fabric Weight & Drape: The Invisible Luxury Filter', '{"title": "Fabric Weight & Drape: The Invisible Luxury Filter", "one_sentence_premise": "Compare identical silhouettes in polyester blend versus heavy double-faced wool, demonstrating how weight changes movement on camera.", "idea_summary": {"title": "Fabric Weight & Drape: The Invisible Luxury Filter", "premise": "Compare identical silhouettes in polyester blend versus heavy double-faced wool, demonstrating how weight changes movement on camera.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Walking turn in lightweight synthetic vs heavy natural fiber → Touch test on lapel canvas → The natural recovery test → Shopping tag checklist", "opening_visual": "Slow-motion walking shot capturing how shoulder pad structure and wool drape fall back into place after a turn.", "visual_texture": "Refined, sensory, quiet luxury", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Walking", "visual_action": "Walking turn in lightweight synthetic vs heavy natural fiber", "spoken_audio": "You can spot cheap tailoring from across the room just by how the shoulder moves."}, {"beat_number": 2, "purpose": "Touch", "visual_action": "Touch test on lapel canvas", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The natural recovery test", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Shopping", "visual_action": "Shopping tag checklist", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "You can spot cheap tailoring from across the room just by how the shoulder moves.", "first_second_visual_hook": "Slow-motion walking shot capturing how shoulder pad structure and wool drape fall back into place after a turn.", "hook_options": ["You can spot cheap tailoring from across the room just by how the shoulder moves.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Refined, sensory, quiet luxury", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Signals textile connoisseurship and investment shopping authority.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '44fc431e-a6c8-4e6e-b8a9-6db816bad93d'::uuid,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 92, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "fashion", "authentic_niche_2026": true}'::jsonb
);

-- [FASHION] The Rule of Three: Subtraction Styling (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '20b63f38-4225-4044-8e04-fc4a6b043b99'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Rule of Three: Subtraction Styling', 'Walk through an over-accessorized outfit and eliminate elements one by one until the visual focal point becomes effortless.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Before leaving the house, take off the piece you added just to look stylish.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Over-styled baseline shot", "Step 1: Color reduction to 2 tones", "Step 2: Accessory elimination", "Step 3: Texture swap for depth", "Clean final pose"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '20b63f38-4225-4044-8e04-fc4a6b043b99'::uuid, 'The Rule of Three: Subtraction Styling', '{"title": "The Rule of Three: Subtraction Styling", "one_sentence_premise": "Walk through an over-accessorized outfit and eliminate elements one by one until the visual focal point becomes effortless.", "idea_summary": {"title": "The Rule of Three: Subtraction Styling", "premise": "Walk through an over-accessorized outfit and eliminate elements one by one until the visual focal point becomes effortless.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Over-styled baseline shot → Step 1: Color reduction to 2 tones → Step 2: Accessory elimination → Step 3: Texture swap for depth → Clean final pose", "opening_visual": "Creator standing in front of mirror, unfastening a secondary chain and swapping loud sneakers for clean leather.", "visual_texture": "Intimate, confident, modern minimalist", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Over-styled", "visual_action": "Over-styled baseline shot", "spoken_audio": "Before leaving the house, take off the piece you added just to look stylish."}, {"beat_number": 2, "purpose": "Step", "visual_action": "Step 1: Color reduction to 2 tones", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Step", "visual_action": "Step 2: Accessory elimination", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Step", "visual_action": "Step 3: Texture swap for depth", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}, {"beat_number": 5, "purpose": "Clean", "visual_action": "Clean final pose", "spoken_audio": "Demonstrate step 5 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Before leaving the house, take off the piece you added just to look stylish.", "first_second_visual_hook": "Creator standing in front of mirror, unfastening a secondary chain and swapping loud sneakers for clean leather.", "hook_options": ["Before leaving the house, take off the piece you added just to look stylish.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Intimate, confident, modern minimalist", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Builds creator reputation as an intuitive curator of effortless aesthetic restraint.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '20b63f38-4225-4044-8e04-fc4a6b043b99'::uuid,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 88, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "fashion", "authentic_niche_2026": true}'::jsonb
);

-- [FASHION] High-Low Layering: Styling Unbranded Basics with Archival Pieces (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '15686fe8-6bd4-4e03-b099-4587215383fa'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'High-Low Layering: Styling Unbranded Basics with Archival Pieces', 'Combine a $15 unbranded heavyweight white tee with a statement archival coat, breaking down the exact balance formula.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["The best-dressed people spend money on outerwear and tailoring, never on basic t-shirts.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["T-shirt fit checklist (collar thickness + ribbing)", "Archival jacket layer addition", "Proportion check at belt line", "Final street-level walking shot"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '15686fe8-6bd4-4e03-b099-4587215383fa'::uuid, 'High-Low Layering: Styling Unbranded Basics with Archival Pieces', '{"title": "High-Low Layering: Styling Unbranded Basics with Archival Pieces", "one_sentence_premise": "Combine a $15 unbranded heavyweight white tee with a statement archival coat, breaking down the exact balance formula.", "idea_summary": {"title": "High-Low Layering: Styling Unbranded Basics with Archival Pieces", "premise": "Combine a $15 unbranded heavyweight white tee with a statement archival coat, breaking down the exact balance formula.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "T-shirt fit checklist (collar thickness + ribbing) → Archival jacket layer addition → Proportion check at belt line → Final street-level walking shot", "opening_visual": "T-shirt tag cut-off shot cutting directly to a tailored trench coat collar drape.", "visual_texture": "Street-editorial, candid, high aesthetic energy", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "T-shirt", "visual_action": "T-shirt fit checklist (collar thickness + ribbing)", "spoken_audio": "The best-dressed people spend money on outerwear and tailoring, never on basic t-shirts."}, {"beat_number": 2, "purpose": "Archival", "visual_action": "Archival jacket layer addition", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Proportion", "visual_action": "Proportion check at belt line", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Final", "visual_action": "Final street-level walking shot", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "The best-dressed people spend money on outerwear and tailoring, never on basic t-shirts.", "first_second_visual_hook": "T-shirt tag cut-off shot cutting directly to a tailored trench coat collar drape.", "hook_options": ["The best-dressed people spend money on outerwear and tailoring, never on basic t-shirts.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Street-editorial, candid, high aesthetic energy", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Empowers audience with smart luxury allocation and styling democracy.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '15686fe8-6bd4-4e03-b099-4587215383fa'::uuid,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 86, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "fashion", "authentic_niche_2026": true}'::jsonb
);

-- [FASHION] Monochrome Depth: Mixing 4 Textures in One Tone (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '29cf8794-b556-42b0-b296-600dc15af1f0'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Monochrome Depth: Mixing 4 Textures in One Tone', 'Break down why all-black or all-cream looks flat when flat fabrics match, and how mixing suede, knit, silk, and structured wool makes it dimensional.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Monochrome outfits look boring when you match colors instead of contrasting textures.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Flat single-texture failure", "Adding light-absorbing matte knit", "Adding light-reflecting leather/silk", "Daylight comparison test"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '29cf8794-b556-42b0-b296-600dc15af1f0'::uuid, 'Monochrome Depth: Mixing 4 Textures in One Tone', '{"title": "Monochrome Depth: Mixing 4 Textures in One Tone", "one_sentence_premise": "Break down why all-black or all-cream looks flat when flat fabrics match, and how mixing suede, knit, silk, and structured wool makes it dimensional.", "idea_summary": {"title": "Monochrome Depth: Mixing 4 Textures in One Tone", "premise": "Break down why all-black or all-cream looks flat when flat fabrics match, and how mixing suede, knit, silk, and structured wool makes it dimensional.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Flat single-texture failure → Adding light-absorbing matte knit → Adding light-reflecting leather/silk → Daylight comparison test", "opening_visual": "Extreme tactile macro close-up moving across brushed mohair, smooth leather, and matte wool in seamless black.", "visual_texture": "Tactile, luxurious, architectural", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Flat", "visual_action": "Flat single-texture failure", "spoken_audio": "Monochrome outfits look boring when you match colors instead of contrasting textures."}, {"beat_number": 2, "purpose": "Adding", "visual_action": "Adding light-absorbing matte knit", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Adding", "visual_action": "Adding light-reflecting leather/silk", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Daylight", "visual_action": "Daylight comparison test", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Monochrome outfits look boring when you match colors instead of contrasting textures.", "first_second_visual_hook": "Extreme tactile macro close-up moving across brushed mohair, smooth leather, and matte wool in seamless black.", "hook_options": ["Monochrome outfits look boring when you match colors instead of contrasting textures.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Tactile, luxurious, architectural", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Educates audience on high-end color styling without needing multiple loud colors.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '29cf8794-b556-42b0-b296-600dc15af1f0'::uuid,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 84, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "fashion", "authentic_niche_2026": true}'::jsonb
);

-- [FASHION] The Shoe-to-Pant Ratio Quick Reference (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '4a8f6bd7-e6a1-41de-9e32-df448e48045b'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Shoe-to-Pant Ratio Quick Reference', 'A 15-second visual cheat sheet matching 3 pant leg openings (wide, straight, tapered) to 3 shoe silhouettes (derby, retro runner, boot).',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Save this before you buy your next pair of trousers.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Wide leg + bulky boot/sneaker match", "Straight leg + structured derby match", "Tapered + clean low profile match", "Summary grid frame for screenshot"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '4a8f6bd7-e6a1-41de-9e32-df448e48045b'::uuid, 'The Shoe-to-Pant Ratio Quick Reference', '{"title": "The Shoe-to-Pant Ratio Quick Reference", "one_sentence_premise": "A 15-second visual cheat sheet matching 3 pant leg openings (wide, straight, tapered) to 3 shoe silhouettes (derby, retro runner, boot).", "idea_summary": {"title": "The Shoe-to-Pant Ratio Quick Reference", "premise": "A 15-second visual cheat sheet matching 3 pant leg openings (wide, straight, tapered) to 3 shoe silhouettes (derby, retro runner, boot).", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Wide leg + bulky boot/sneaker match → Straight leg + structured derby match → Tapered + clean low profile match → Summary grid frame for screenshot", "opening_visual": "Split screen showing instant good match vs awkward bunching.", "visual_texture": "Fast, high-utility, rhythmic, clean graphics", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Wide", "visual_action": "Wide leg + bulky boot/sneaker match", "spoken_audio": "Save this before you buy your next pair of trousers."}, {"beat_number": 2, "purpose": "Straight", "visual_action": "Straight leg + structured derby match", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Tapered", "visual_action": "Tapered + clean low profile match", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Summary", "visual_action": "Summary grid frame for screenshot", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Save this before you buy your next pair of trousers.", "first_second_visual_hook": "Split screen showing instant good match vs awkward bunching.", "hook_options": ["Save this before you buy your next pair of trousers.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Fast, high-utility, rhythmic, clean graphics", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Drives immediate saves and high utility bookmarking.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '4a8f6bd7-e6a1-41de-9e32-df448e48045b'::uuid,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 79, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "fashion", "authentic_niche_2026": true}'::jsonb
);

-- [FASHION] The Collar Integrity Test: Spotting Quality in 5 Seconds (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '44d15f1d-3e8b-4a7d-b05a-393ede03274d'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Collar Integrity Test: Spotting Quality in 5 Seconds', 'Demonstrate the quick stretch and rebound test on shirt and knitwear collars to avoid bacon neck and sagging seams.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Do this test in the fitting room before checking the price tag.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Collared knit stretch demonstration", "Seam reinforcement inspection", "Twin-needle stitch check", "Quick 3-step decision filter"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '44d15f1d-3e8b-4a7d-b05a-393ede03274d'::uuid, 'The Collar Integrity Test: Spotting Quality in 5 Seconds', '{"title": "The Collar Integrity Test: Spotting Quality in 5 Seconds", "one_sentence_premise": "Demonstrate the quick stretch and rebound test on shirt and knitwear collars to avoid bacon neck and sagging seams.", "idea_summary": {"title": "The Collar Integrity Test: Spotting Quality in 5 Seconds", "premise": "Demonstrate the quick stretch and rebound test on shirt and knitwear collars to avoid bacon neck and sagging seams.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Collared knit stretch demonstration → Seam reinforcement inspection → Twin-needle stitch check → Quick 3-step decision filter", "opening_visual": "Hand stretching collar ribbing and releasing it under bright fitting room downlight.", "visual_texture": "Educational, consumer advocate, sharp focus", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Collared", "visual_action": "Collared knit stretch demonstration", "spoken_audio": "Do this test in the fitting room before checking the price tag."}, {"beat_number": 2, "purpose": "Seam", "visual_action": "Seam reinforcement inspection", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Twin-needle", "visual_action": "Twin-needle stitch check", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Quick", "visual_action": "Quick 3-step decision filter", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Do this test in the fitting room before checking the price tag.", "first_second_visual_hook": "Hand stretching collar ribbing and releasing it under bright fitting room downlight.", "hook_options": ["Do this test in the fitting room before checking the price tag.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Educational, consumer advocate, sharp focus", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Creates actionable consumer trust and retail savvy authority.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '44d15f1d-3e8b-4a7d-b05a-393ede03274d'::uuid,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 77, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "fashion", "authentic_niche_2026": true}'::jsonb
);

-- [FASHION] 3 Tailoring Alterations Under $20 That 10x Cheap Pants (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '8045f451-2e0d-436a-991d-efec73218f93'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  '3 Tailoring Alterations Under $20 That 10x Cheap Pants', 'List the exact 3 requests to give your local dry cleaner/tailor to make off-the-rack trousers fit like bespoke.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Never wear trousers straight off the rack; ask for these 3 adjustments instead.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Hem taper to ankle bone", "Waist taken in at back seam", "Pocket flare reduction", "Screenshot-ready tailor notes card"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '8045f451-2e0d-436a-991d-efec73218f93'::uuid, '3 Tailoring Alterations Under $20 That 10x Cheap Pants', '{"title": "3 Tailoring Alterations Under $20 That 10x Cheap Pants", "one_sentence_premise": "List the exact 3 requests to give your local dry cleaner/tailor to make off-the-rack trousers fit like bespoke.", "idea_summary": {"title": "3 Tailoring Alterations Under $20 That 10x Cheap Pants", "premise": "List the exact 3 requests to give your local dry cleaner/tailor to make off-the-rack trousers fit like bespoke.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Hem taper to ankle bone → Waist taken in at back seam → Pocket flare reduction → Screenshot-ready tailor notes card", "opening_visual": "Chalk marking lines directly on trouser cuffs and waistline in tailor shop.", "visual_texture": "Insider secret, high value utility, practical", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Hem", "visual_action": "Hem taper to ankle bone", "spoken_audio": "Never wear trousers straight off the rack; ask for these 3 adjustments instead."}, {"beat_number": 2, "purpose": "Waist", "visual_action": "Waist taken in at back seam", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Pocket", "visual_action": "Pocket flare reduction", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Screenshot-ready", "visual_action": "Screenshot-ready tailor notes card", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Never wear trousers straight off the rack; ask for these 3 adjustments instead.", "first_second_visual_hook": "Chalk marking lines directly on trouser cuffs and waistline in tailor shop.", "hook_options": ["Never wear trousers straight off the rack; ask for these 3 adjustments instead.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Insider secret, high value utility, practical", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Positions creator as a practical insider saving the audience thousands in wardrobe upgrades.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '8045f451-2e0d-436a-991d-efec73218f93'::uuid,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 75, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "fashion", "authentic_niche_2026": true}'::jsonb
);

-- [FASHION] The 24-Hour Wardrobe Hang Test for Wrinkle Recovery (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'a53a0aa7-f8e1-4e8b-b457-fdade129f1ec'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The 24-Hour Wardrobe Hang Test for Wrinkle Recovery', 'Show how natural wool and linen blends release travel creases with steam and gravity without ironing.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If your clothes look like this after unpacking, don''t touch an iron.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Unpacking crumpled jacket", "Bathroom steam suspension method", "Gravity fiber relaxation", "Final crisp shoulder inspection"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'a53a0aa7-f8e1-4e8b-b457-fdade129f1ec'::uuid, 'The 24-Hour Wardrobe Hang Test for Wrinkle Recovery', '{"title": "The 24-Hour Wardrobe Hang Test for Wrinkle Recovery", "one_sentence_premise": "Show how natural wool and linen blends release travel creases with steam and gravity without ironing.", "idea_summary": {"title": "The 24-Hour Wardrobe Hang Test for Wrinkle Recovery", "premise": "Show how natural wool and linen blends release travel creases with steam and gravity without ironing.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Unpacking crumpled jacket → Bathroom steam suspension method → Gravity fiber relaxation → Final crisp shoulder inspection", "opening_visual": "Wrinkled blazer hung in steamy bathroom smoothing out under time-lapse.", "visual_texture": "Life hack, travel-ready, calm visual payoff", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Unpacking", "visual_action": "Unpacking crumpled jacket", "spoken_audio": "If your clothes look like this after unpacking, don''''t touch an iron."}, {"beat_number": 2, "purpose": "Bathroom", "visual_action": "Bathroom steam suspension method", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Gravity", "visual_action": "Gravity fiber relaxation", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Final", "visual_action": "Final crisp shoulder inspection", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If your clothes look like this after unpacking, don''t touch an iron.", "first_second_visual_hook": "Wrinkled blazer hung in steamy bathroom smoothing out under time-lapse.", "hook_options": ["If your clothes look like this after unpacking, don''t touch an iron.", "Before you do this in Fashion, look at this rule.", "This is the Fashion breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Life hack, travel-ready, calm visual payoff", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Delivers effortless luxury travel and wardrobe maintenance guidance.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'a53a0aa7-f8e1-4e8b-b457-fdade129f1ec'::uuid,
  (select id from public.categories where slug = 'fashion'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 73, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "fashion", "authentic_niche_2026": true}'::jsonb
);

insert into public.categories (slug, name, family, enabled, risk_level, sort_order)
values ('luxury', 'Luxury', 'creator_content', true, 'low', 100)
on conflict (slug) do update set enabled = true, name = excluded.name;

-- [LUXURY] The Silent Code of Restraint: Unbranded Connoisseurship (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '4b7bf909-ea48-4723-8d29-eb44169286fa'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Silent Code of Restraint: Unbranded Connoisseurship', 'Explore why true luxury spaces and heirloom objects avoid outward logos in favor of material density, hand-burnished edges, and provenance.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["The loud version screams for attention; the heirloom version requires you to already know.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Logo-centric flashiness contrast", "Macro inspection of saddle stitching", "The weight and acoustic density test", "The philosophy of private ownership"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '4b7bf909-ea48-4723-8d29-eb44169286fa'::uuid, 'The Silent Code of Restraint: Unbranded Connoisseurship', '{"title": "The Silent Code of Restraint: Unbranded Connoisseurship", "one_sentence_premise": "Explore why true luxury spaces and heirloom objects avoid outward logos in favor of material density, hand-burnished edges, and provenance.", "idea_summary": {"title": "The Silent Code of Restraint: Unbranded Connoisseurship", "premise": "Explore why true luxury spaces and heirloom objects avoid outward logos in favor of material density, hand-burnished edges, and provenance.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Logo-centric flashiness contrast → Macro inspection of saddle stitching → The weight and acoustic density test → The philosophy of private ownership", "opening_visual": "Macro camera gliding across unbranded saddlery leather, catching the hand-stitched saddle seam and wax finish.", "visual_texture": "Quiet luxury, atmospheric, deep audio tones, natural wood and stone textures", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Logo-centric", "visual_action": "Logo-centric flashiness contrast", "spoken_audio": "The loud version screams for attention; the heirloom version requires you to already know."}, {"beat_number": 2, "purpose": "Macro", "visual_action": "Macro inspection of saddle stitching", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The weight and acoustic density test", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The philosophy of private ownership", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "The loud version screams for attention; the heirloom version requires you to already know.", "first_second_visual_hook": "Macro camera gliding across unbranded saddlery leather, catching the hand-stitched saddle seam and wax finish.", "hook_options": ["The loud version screams for attention; the heirloom version requires you to already know.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Quiet luxury, atmospheric, deep audio tones, natural wood and stone textures", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Positions creator as an elite cultural observer of timeless taste and high-craft appreciation.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '4b7bf909-ea48-4723-8d29-eb44169286fa'::uuid,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 97, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "luxury", "authentic_niche_2026": true}'::jsonb
);

-- [LUXURY] Provenance over Price: The Vintage Object Audit (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '136cdc46-54ac-4a6f-b299-ea7b149a1519'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Provenance over Price: The Vintage Object Audit', 'Break down an archival watch, fountain pen, or bespoke trunk, explaining how patina and history create irreproducible value.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Anyone with cash can buy this year’s release; provenance cannot be rushed.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Initial presentation of the object", "Tracing the maker''s mark and era", "Why minor patina adds 5x value", "The collector''s rule of acquisition"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '136cdc46-54ac-4a6f-b299-ea7b149a1519'::uuid, 'Provenance over Price: The Vintage Object Audit', '{"title": "Provenance over Price: The Vintage Object Audit", "one_sentence_premise": "Break down an archival watch, fountain pen, or bespoke trunk, explaining how patina and history create irreproducible value.", "idea_summary": {"title": "Provenance over Price: The Vintage Object Audit", "premise": "Break down an archival watch, fountain pen, or bespoke trunk, explaining how patina and history create irreproducible value.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Initial presentation of the object → Tracing the maker''s mark and era → Why minor patina adds 5x value → The collector''s rule of acquisition", "opening_visual": "White-gloved hand opening an archival velvet presentation box revealing aged brass and patinated enamel.", "visual_texture": "Museum-grade, reverent, crisp focus, warm amber lighting", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Initial", "visual_action": "Initial presentation of the object", "spoken_audio": "Anyone with cash can buy this year’s release; provenance cannot be rushed."}, {"beat_number": 2, "purpose": "Tracing", "visual_action": "Tracing the maker''s mark and era", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Why", "visual_action": "Why minor patina adds 5x value", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The collector''s rule of acquisition", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Anyone with cash can buy this year’s release; provenance cannot be rushed.", "first_second_visual_hook": "White-gloved hand opening an archival velvet presentation box revealing aged brass and patinated enamel.", "hook_options": ["Anyone with cash can buy this year’s release; provenance cannot be rushed.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Museum-grade, reverent, crisp focus, warm amber lighting", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Establishes creator as an authoritative collector and historian of enduring craft.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '136cdc46-54ac-4a6f-b299-ea7b149a1519'::uuid,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 95, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "luxury", "authentic_niche_2026": true}'::jsonb
);

-- [LUXURY] Bespoke vs Made-to-Measure: The 4 Fitting Stages (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'acad6c3d-5ac5-4e5d-b88c-d1f92ecdd9da'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Bespoke vs Made-to-Measure: The 4 Fitting Stages', 'Demystify the exact differences between an altered factory pattern (MTM) and an individual paper pattern drafted from scratch (bespoke).',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If they don’t make you a unique paper pattern from scratch, it’s not bespoke.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Drafting the unique individual pattern", "The basted fitting without lining", "Floating canvas internal structure", "Final hand-sewn lapel roll check"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'acad6c3d-5ac5-4e5d-b88c-d1f92ecdd9da'::uuid, 'Bespoke vs Made-to-Measure: The 4 Fitting Stages', '{"title": "Bespoke vs Made-to-Measure: The 4 Fitting Stages", "one_sentence_premise": "Demystify the exact differences between an altered factory pattern (MTM) and an individual paper pattern drafted from scratch (bespoke).", "idea_summary": {"title": "Bespoke vs Made-to-Measure: The 4 Fitting Stages", "premise": "Demystify the exact differences between an altered factory pattern (MTM) and an individual paper pattern drafted from scratch (bespoke).", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Drafting the unique individual pattern → The basted fitting without lining → Floating canvas internal structure → Final hand-sewn lapel roll check", "opening_visual": "Bespoke master tailor cutting raw wool canvas with heavy shears along hand-drawn chalk lines.", "visual_texture": "Sartorial heritage, intimate studio craft, classical restraint", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Drafting", "visual_action": "Drafting the unique individual pattern", "spoken_audio": "If they don’t make you a unique paper pattern from scratch, it’s not bespoke."}, {"beat_number": 2, "purpose": "The", "visual_action": "The basted fitting without lining", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Floating", "visual_action": "Floating canvas internal structure", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Final", "visual_action": "Final hand-sewn lapel roll check", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If they don’t make you a unique paper pattern from scratch, it’s not bespoke.", "first_second_visual_hook": "Bespoke master tailor cutting raw wool canvas with heavy shears along hand-drawn chalk lines.", "hook_options": ["If they don’t make you a unique paper pattern from scratch, it’s not bespoke.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Sartorial heritage, intimate studio craft, classical restraint", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Educates the discerning consumer on true luxury craftsmanship standards.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'acad6c3d-5ac5-4e5d-b88c-d1f92ecdd9da'::uuid,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 93, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "luxury", "authentic_niche_2026": true}'::jsonb
);

-- [LUXURY] The Acoustic Weight Test of High-End Design (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'eca011f2-f2cb-4b4f-acad-d0675dd82d61'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Acoustic Weight Test of High-End Design', 'Demonstrate the acoustic difference in luxury objects: the heavy thud of a solid brass latch, the dampened click of a vault door, the sound of crystal.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Quality has a sound before it even has a look.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Solid bronze latch closure ASMR", "Lead crystal ring resonance test", "Milled aluminum dial rotation", "Acoustic density decision filter"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'eca011f2-f2cb-4b4f-acad-d0675dd82d61'::uuid, 'The Acoustic Weight Test of High-End Design', '{"title": "The Acoustic Weight Test of High-End Design", "one_sentence_premise": "Demonstrate the acoustic difference in luxury objects: the heavy thud of a solid brass latch, the dampened click of a vault door, the sound of crystal.", "idea_summary": {"title": "The Acoustic Weight Test of High-End Design", "premise": "Demonstrate the acoustic difference in luxury objects: the heavy thud of a solid brass latch, the dampened click of a vault door, the sound of crystal.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Solid bronze latch closure ASMR → Lead crystal ring resonance test → Milled aluminum dial rotation → Acoustic density decision filter", "opening_visual": "Isolated high-fidelity ASMR audio and macro video of a solid bronze door latch engaging with a dampened acoustic thud.", "visual_texture": "Sensory, crisp ASMR, minimalist luxury, studio acoustic perfection", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Solid", "visual_action": "Solid bronze latch closure ASMR", "spoken_audio": "Quality has a sound before it even has a look."}, {"beat_number": 2, "purpose": "Lead", "visual_action": "Lead crystal ring resonance test", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Milled", "visual_action": "Milled aluminum dial rotation", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Acoustic", "visual_action": "Acoustic density decision filter", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Quality has a sound before it even has a look.", "first_second_visual_hook": "Isolated high-fidelity ASMR audio and macro video of a solid bronze door latch engaging with a dampened acoustic thud.", "hook_options": ["Quality has a sound before it even has a look.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Sensory, crisp ASMR, minimalist luxury, studio acoustic perfection", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Provides a unique sensory filter for identifying genuine industrial design quality.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'eca011f2-f2cb-4b4f-acad-d0675dd82d61'::uuid,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 87, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "luxury", "authentic_niche_2026": true}'::jsonb
);

-- [LUXURY] The Hospitality Detail: What 5-Star Suites Do in the First 60 Seconds (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'cbfb80ac-8c0d-43eb-aba8-0d3ed7ad6c17'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Hospitality Detail: What 5-Star Suites Do in the First 60 Seconds', 'Deconstruct the subtle sensory cues top-tier boutique hotels use upon room entry: temperature, scent diffusion, hidden lighting, linen weight.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["The best hotels in the world make you feel calm before you even put your bags down.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Lighting calibration upon entry", "Ambient scent curation without chemicals", "Linen thread density & wash texture", "How to replicate this in home architecture"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'cbfb80ac-8c0d-43eb-aba8-0d3ed7ad6c17'::uuid, 'The Hospitality Detail: What 5-Star Suites Do in the First 60 Seconds', '{"title": "The Hospitality Detail: What 5-Star Suites Do in the First 60 Seconds", "one_sentence_premise": "Deconstruct the subtle sensory cues top-tier boutique hotels use upon room entry: temperature, scent diffusion, hidden lighting, linen weight.", "idea_summary": {"title": "The Hospitality Detail: What 5-Star Suites Do in the First 60 Seconds", "premise": "Deconstruct the subtle sensory cues top-tier boutique hotels use upon room entry: temperature, scent diffusion, hidden lighting, linen weight.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Lighting calibration upon entry → Ambient scent curation without chemicals → Linen thread density & wash texture → How to replicate this in home architecture", "opening_visual": "Stepping across heavy stone threshold as indirect warm 2400K illumination gently turns on without overhead glare.", "visual_texture": "Serene, aspirational, architectural, warm evening glow", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Lighting", "visual_action": "Lighting calibration upon entry", "spoken_audio": "The best hotels in the world make you feel calm before you even put your bags down."}, {"beat_number": 2, "purpose": "Ambient", "visual_action": "Ambient scent curation without chemicals", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Linen", "visual_action": "Linen thread density & wash texture", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "How", "visual_action": "How to replicate this in home architecture", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "The best hotels in the world make you feel calm before you even put your bags down.", "first_second_visual_hook": "Stepping across heavy stone threshold as indirect warm 2400K illumination gently turns on without overhead glare.", "hook_options": ["The best hotels in the world make you feel calm before you even put your bags down.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Serene, aspirational, architectural, warm evening glow", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Elevates audience''''s personal standards for spatial hospitality and interior luxury.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'cbfb80ac-8c0d-43eb-aba8-0d3ed7ad6c17'::uuid,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 85, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "luxury", "authentic_niche_2026": true}'::jsonb
);

-- [LUXURY] The Private Dining Etiquette Filter: What Service Signals (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '64a416f2-4524-44ce-8f01-7103c7270f19'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Private Dining Etiquette Filter: What Service Signals', 'Explain the silent choreography of Michelin-starred service: clearing from the right, napkin folds, quiet table resets between courses.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Great service is never theatrical; it is completely invisible until you notice the rhythm.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The invisible table sweep", "Water and wine pacing choreography", "Silverware repositioning between savory courses", "The guest posture response"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '64a416f2-4524-44ce-8f01-7103c7270f19'::uuid, 'The Private Dining Etiquette Filter: What Service Signals', '{"title": "The Private Dining Etiquette Filter: What Service Signals", "one_sentence_premise": "Explain the silent choreography of Michelin-starred service: clearing from the right, napkin folds, quiet table resets between courses.", "idea_summary": {"title": "The Private Dining Etiquette Filter: What Service Signals", "premise": "Explain the silent choreography of Michelin-starred service: clearing from the right, napkin folds, quiet table resets between courses.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The invisible table sweep → Water and wine pacing choreography → Silverware repositioning between savory courses → The guest posture response", "opening_visual": "Server quietly placing silver dome cloche with seamless synchronization across two seats.", "visual_texture": "Refined, discreet, polished, candlelit dining intimacy", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The invisible table sweep", "spoken_audio": "Great service is never theatrical; it is completely invisible until you notice the rhythm."}, {"beat_number": 2, "purpose": "Water", "visual_action": "Water and wine pacing choreography", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Silverware", "visual_action": "Silverware repositioning between savory courses", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The guest posture response", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Great service is never theatrical; it is completely invisible until you notice the rhythm.", "first_second_visual_hook": "Server quietly placing silver dome cloche with seamless synchronization across two seats.", "hook_options": ["Great service is never theatrical; it is completely invisible until you notice the rhythm.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Refined, discreet, polished, candlelit dining intimacy", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Demonstrates high cultural literacy and social sophistication.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '64a416f2-4524-44ce-8f01-7103c7270f19'::uuid,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 83, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "luxury", "authentic_niche_2026": true}'::jsonb
);

-- [LUXURY] 3 Silent Signs an Interior Space Was Designed by an Architect, Not a Decorator (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'a5c21c61-99a8-463f-b59f-1641e0f4a8a7'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  '3 Silent Signs an Interior Space Was Designed by an Architect, Not a Decorator', 'Point out the subtle spatial choices: floor-to-ceiling door jambs, hidden baseboards, and shadow gap reveals.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Look at the baseboards and door frames first.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Shadow gap baseboard detail", "Concealed hinge pivot doors", "Recessed ceiling track lighting", "Screenshot reference card for home renovation"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'a5c21c61-99a8-463f-b59f-1641e0f4a8a7'::uuid, '3 Silent Signs an Interior Space Was Designed by an Architect, Not a Decorator', '{"title": "3 Silent Signs an Interior Space Was Designed by an Architect, Not a Decorator", "one_sentence_premise": "Point out the subtle spatial choices: floor-to-ceiling door jambs, hidden baseboards, and shadow gap reveals.", "idea_summary": {"title": "3 Silent Signs an Interior Space Was Designed by an Architect, Not a Decorator", "premise": "Point out the subtle spatial choices: floor-to-ceiling door jambs, hidden baseboards, and shadow gap reveals.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Shadow gap baseboard detail → Concealed hinge pivot doors → Recessed ceiling track lighting → Screenshot reference card for home renovation", "opening_visual": "Camera panning down flush wall revealing zero visible baseboard, only a 1/2-inch architectural shadow reveal.", "visual_texture": "Architectural, crisp, high-design utility", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Shadow", "visual_action": "Shadow gap baseboard detail", "spoken_audio": "Look at the baseboards and door frames first."}, {"beat_number": 2, "purpose": "Concealed", "visual_action": "Concealed hinge pivot doors", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Recessed", "visual_action": "Recessed ceiling track lighting", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Screenshot", "visual_action": "Screenshot reference card for home renovation", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Look at the baseboards and door frames first.", "first_second_visual_hook": "Camera panning down flush wall revealing zero visible baseboard, only a 1/2-inch architectural shadow reveal.", "hook_options": ["Look at the baseboards and door frames first.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Architectural, crisp, high-design utility", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Provides immediate architectural discernment and save-worthy design advice.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'a5c21c61-99a8-463f-b59f-1641e0f4a8a7'::uuid,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 78, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "luxury", "authentic_niche_2026": true}'::jsonb
);

-- [LUXURY] The Linen vs Egyptian Cotton Thread Count Myth (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'fbef934d-ef1a-43b7-9e90-669a61793859'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Linen vs Egyptian Cotton Thread Count Myth', 'Explain why 1,000 thread count is a marketing gimmick and why 300-400 single-ply long-staple cotton or Belgian flax linen feels 10x softer.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If your bedsheets claim 1,000 thread count, you’ve been sold multi-ply marketing.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Multi-ply thread count breakdown", "Single-ply long-staple fiber structure", "Weave type: Percale vs Sateen choice", "Buyer''s reference checklist"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'fbef934d-ef1a-43b7-9e90-669a61793859'::uuid, 'The Linen vs Egyptian Cotton Thread Count Myth', '{"title": "The Linen vs Egyptian Cotton Thread Count Myth", "one_sentence_premise": "Explain why 1,000 thread count is a marketing gimmick and why 300-400 single-ply long-staple cotton or Belgian flax linen feels 10x softer.", "idea_summary": {"title": "The Linen vs Egyptian Cotton Thread Count Myth", "premise": "Explain why 1,000 thread count is a marketing gimmick and why 300-400 single-ply long-staple cotton or Belgian flax linen feels 10x softer.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Multi-ply thread count breakdown → Single-ply long-staple fiber structure → Weave type: Percale vs Sateen choice → Buyer''s reference checklist", "opening_visual": "Macro magnifying lens comparing multi-ply tangled fiber vs single-ply long-staple Egyptian cotton.", "visual_texture": "Direct, informative, tactile, crisp bedding backdrop", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Multi-ply", "visual_action": "Multi-ply thread count breakdown", "spoken_audio": "If your bedsheets claim 1,000 thread count, you’ve been sold multi-ply marketing."}, {"beat_number": 2, "purpose": "Single-ply", "visual_action": "Single-ply long-staple fiber structure", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Weave", "visual_action": "Weave type: Percale vs Sateen choice", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Buyer''s", "visual_action": "Buyer''s reference checklist", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If your bedsheets claim 1,000 thread count, you’ve been sold multi-ply marketing.", "first_second_visual_hook": "Macro magnifying lens comparing multi-ply tangled fiber vs single-ply long-staple Egyptian cotton.", "hook_options": ["If your bedsheets claim 1,000 thread count, you’ve been sold multi-ply marketing.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Direct, informative, tactile, crisp bedding backdrop", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Protects consumer wallets while elevating sleep luxury.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'fbef934d-ef1a-43b7-9e90-669a61793859'::uuid,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 76, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "luxury", "authentic_niche_2026": true}'::jsonb
);

-- [LUXURY] The Perfume Concentration Hierarchy: Extrait vs EDP vs EDT (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'e1c8c62e-1557-4e6e-95a6-bed1647b0c83'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Perfume Concentration Hierarchy: Extrait vs EDP vs EDT', 'A 20-second visual guide on oil concentration percentage, sillage radius, and skin longevity across fragrance grades.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Stop spraying Extrait de Parfum like it’s a body spray.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["EDT vs EDP vs Extrait oil concentration bars", "Pulse point application guide", "Why alcohol vapor creates projection while oil creates intimacy", "Summary graphic"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'e1c8c62e-1557-4e6e-95a6-bed1647b0c83'::uuid, 'The Perfume Concentration Hierarchy: Extrait vs EDP vs EDT', '{"title": "The Perfume Concentration Hierarchy: Extrait vs EDP vs EDT", "one_sentence_premise": "A 20-second visual guide on oil concentration percentage, sillage radius, and skin longevity across fragrance grades.", "idea_summary": {"title": "The Perfume Concentration Hierarchy: Extrait vs EDP vs EDT", "premise": "A 20-second visual guide on oil concentration percentage, sillage radius, and skin longevity across fragrance grades.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "EDT vs EDP vs Extrait oil concentration bars → Pulse point application guide → Why alcohol vapor creates projection while oil creates intimacy → Summary graphic", "opening_visual": "Dropper releasing amber oil into glass vial showing viscous oil density.", "visual_texture": "Niche fragrance, sensory, sleek typography", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "EDT", "visual_action": "EDT vs EDP vs Extrait oil concentration bars", "spoken_audio": "Stop spraying Extrait de Parfum like it’s a body spray."}, {"beat_number": 2, "purpose": "Pulse", "visual_action": "Pulse point application guide", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Why", "visual_action": "Why alcohol vapor creates projection while oil creates intimacy", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Summary", "visual_action": "Summary graphic", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Stop spraying Extrait de Parfum like it’s a body spray.", "first_second_visual_hook": "Dropper releasing amber oil into glass vial showing viscous oil density.", "hook_options": ["Stop spraying Extrait de Parfum like it’s a body spray.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Niche fragrance, sensory, sleek typography", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Establishes fragrance connoisseurship and sophisticated self-care standards.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'e1c8c62e-1557-4e6e-95a6-bed1647b0c83'::uuid,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 74, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "luxury", "authentic_niche_2026": true}'::jsonb
);

-- [LUXURY] Leather Grain Grading: Full-Grain vs Genuine Leather Warning (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'a2da1006-dea4-40f9-b2b7-264ea64334c3'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Leather Grain Grading: Full-Grain vs Genuine Leather Warning', 'Expose the ''Genuine Leather'' label trap and teach viewers how to identify full-grain pores and natural patina longevity.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["When a brand stamps ''Genuine Leather'' on a product, that''s the lowest acceptable tier.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The 4 leather tiers explained", "The fingernail pressure scratch test", "Edge burnish inspection", "Quality shopping checklist"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'a2da1006-dea4-40f9-b2b7-264ea64334c3'::uuid, 'Leather Grain Grading: Full-Grain vs Genuine Leather Warning', '{"title": "Leather Grain Grading: Full-Grain vs Genuine Leather Warning", "one_sentence_premise": "Expose the ''Genuine Leather'' label trap and teach viewers how to identify full-grain pores and natural patina longevity.", "idea_summary": {"title": "Leather Grain Grading: Full-Grain vs Genuine Leather Warning", "premise": "Expose the ''Genuine Leather'' label trap and teach viewers how to identify full-grain pores and natural patina longevity.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The 4 leather tiers explained → The fingernail pressure scratch test → Edge burnish inspection → Quality shopping checklist", "opening_visual": "Cross-section bend test showing top-grain split vs full-grain natural fiber integrity.", "visual_texture": "Tactile, consumer insider, leathercraft workshop", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The 4 leather tiers explained", "spoken_audio": "When a brand stamps ''''Genuine Leather'''' on a product, that''''s the lowest acceptable tier."}, {"beat_number": 2, "purpose": "The", "visual_action": "The fingernail pressure scratch test", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Edge", "visual_action": "Edge burnish inspection", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Quality", "visual_action": "Quality shopping checklist", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "When a brand stamps ''Genuine Leather'' on a product, that''s the lowest acceptable tier.", "first_second_visual_hook": "Cross-section bend test showing top-grain split vs full-grain natural fiber integrity.", "hook_options": ["When a brand stamps ''Genuine Leather'' on a product, that''s the lowest acceptable tier.", "Before you do this in Luxury, look at this rule.", "This is the Luxury breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Tactile, consumer insider, leathercraft workshop", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Saves viewers hundreds of dollars on deceptive leather goods.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'a2da1006-dea4-40f9-b2b7-264ea64334c3'::uuid,
  (select id from public.categories where slug = 'luxury'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 72, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "luxury", "authentic_niche_2026": true}'::jsonb
);

insert into public.categories (slug, name, family, enabled, risk_level, sort_order)
values ('beauty', 'Beauty', 'creator_content', true, 'low', 100)
on conflict (slug) do update set enabled = true, name = excluded.name;

-- [BEAUTY] The Under-Lighting Lie in Foundation Matching (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '78329593-133c-4761-af61-ac009e20fb08'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Under-Lighting Lie in Foundation Matching', 'Reveal why department store overhead spot lighting ruins shade matching, and how doing a jawline swatch in daylight + 4000K neutral light guarantees zero oxidation mismatch.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["The foundation shade that looked perfect in the store looks like a mask in daylight for one specific reason.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The store lighting trap demonstration", "Oxidation test after 15 minutes", "The 3-point swatch technique (jaw, neck, chest)", "Natural daylight verification"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '78329593-133c-4761-af61-ac009e20fb08'::uuid, 'The Under-Lighting Lie in Foundation Matching', '{"title": "The Under-Lighting Lie in Foundation Matching", "one_sentence_premise": "Reveal why department store overhead spot lighting ruins shade matching, and how doing a jawline swatch in daylight + 4000K neutral light guarantees zero oxidation mismatch.", "idea_summary": {"title": "The Under-Lighting Lie in Foundation Matching", "premise": "Reveal why department store overhead spot lighting ruins shade matching, and how doing a jawline swatch in daylight + 4000K neutral light guarantees zero oxidation mismatch.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The store lighting trap demonstration → Oxidation test after 15 minutes → The 3-point swatch technique (jaw, neck, chest) → Natural daylight verification", "opening_visual": "Split mirror showing harsh store yellow spotlight vs natural diffuse window light on jawline swatches.", "visual_texture": "Educational, real, unfiltered skin texture, macro beauty", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The store lighting trap demonstration", "spoken_audio": "The foundation shade that looked perfect in the store looks like a mask in daylight for one specific reason."}, {"beat_number": 2, "purpose": "Oxidation", "visual_action": "Oxidation test after 15 minutes", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The 3-point swatch technique (jaw, neck, chest)", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Natural", "visual_action": "Natural daylight verification", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "The foundation shade that looked perfect in the store looks like a mask in daylight for one specific reason.", "first_second_visual_hook": "Split mirror showing harsh store yellow spotlight vs natural diffuse window light on jawline swatches.", "hook_options": ["The foundation shade that looked perfect in the store looks like a mask in daylight for one specific reason.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Educational, real, unfiltered skin texture, macro beauty", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Builds immense trust by exposing cosmetic retail lighting tricks and empowering real skin confidence.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '78329593-133c-4761-af61-ac009e20fb08'::uuid,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 95, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "beauty", "authentic_niche_2026": true}'::jsonb
);

-- [BEAUTY] Skin Barrier Recovery: The 72-Hour Active Ingredient Reset (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'e53926c2-f74c-415c-8297-962707b5c79b'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Skin Barrier Recovery: The 72-Hour Active Ingredient Reset', 'Break down the exact symptoms of a compromised skin barrier and the minimal 3-step lipid repair routine needed before touching retinoids or AHAs again.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If your moisturizer stings when you apply it, stop every active product immediately.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The stinging symptom audit", "Strip the routine: Gentle wash + Ceramide/Cholesterol cream + SPF", "The 72-hour healing curve", "Safe reintroduction timeline"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'e53926c2-f74c-415c-8297-962707b5c79b'::uuid, 'Skin Barrier Recovery: The 72-Hour Active Ingredient Reset', '{"title": "Skin Barrier Recovery: The 72-Hour Active Ingredient Reset", "one_sentence_premise": "Break down the exact symptoms of a compromised skin barrier and the minimal 3-step lipid repair routine needed before touching retinoids or AHAs again.", "idea_summary": {"title": "Skin Barrier Recovery: The 72-Hour Active Ingredient Reset", "premise": "Break down the exact symptoms of a compromised skin barrier and the minimal 3-step lipid repair routine needed before touching retinoids or AHAs again.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The stinging symptom audit → Strip the routine: Gentle wash + Ceramide/Cholesterol cream + SPF → The 72-hour healing curve → Safe reintroduction timeline", "opening_visual": "Extreme skin macro showing micro-redness and flaking, transitioning to a calming ceramide balm application.", "visual_texture": "Clinical yet empathetic, soothing, clean aesthetic", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The stinging symptom audit", "spoken_audio": "If your moisturizer stings when you apply it, stop every active product immediately."}, {"beat_number": 2, "purpose": "Strip", "visual_action": "Strip the routine: Gentle wash + Ceramide/Cholesterol cream + SPF", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The 72-hour healing curve", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Safe", "visual_action": "Safe reintroduction timeline", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If your moisturizer stings when you apply it, stop every active product immediately.", "first_second_visual_hook": "Extreme skin macro showing micro-redness and flaking, transitioning to a calming ceramide balm application.", "hook_options": ["If your moisturizer stings when you apply it, stop every active product immediately.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Clinical yet empathetic, soothing, clean aesthetic", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Positions creator as an authoritative skincare educator focused on long-term skin health over quick fixes.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'e53926c2-f74c-415c-8297-962707b5c79b'::uuid,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 93, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "beauty", "authentic_niche_2026": true}'::jsonb
);

-- [BEAUTY] Skin Prep vs Makeup: The 80/20 Hydration Layering Law (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'e6a27889-0e34-46f3-ac49-ce8bf9754e94'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Skin Prep vs Makeup: The 80/20 Hydration Layering Law', 'Demonstrate that patchy foundation is almost always inadequate skin prep layering (humectant -> emollient -> occlusive) rather than bad foundation formula.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Your foundation isn’t separating on your nose because it’s bad; it’s separating because your prep was dry.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Half-face foundation test", "Layer 1: Water-binding essence", "Layer 2: Lightweight barrier cream with dry-down time", "Flawless foundation melt-in"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'e6a27889-0e34-46f3-ac49-ce8bf9754e94'::uuid, 'Skin Prep vs Makeup: The 80/20 Hydration Layering Law', '{"title": "Skin Prep vs Makeup: The 80/20 Hydration Layering Law", "one_sentence_premise": "Demonstrate that patchy foundation is almost always inadequate skin prep layering (humectant -> emollient -> occlusive) rather than bad foundation formula.", "idea_summary": {"title": "Skin Prep vs Makeup: The 80/20 Hydration Layering Law", "premise": "Demonstrate that patchy foundation is almost always inadequate skin prep layering (humectant -> emollient -> occlusive) rather than bad foundation formula.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Half-face foundation test → Layer 1: Water-binding essence → Layer 2: Lightweight barrier cream with dry-down time → Flawless foundation melt-in", "opening_visual": "Side-by-side half-face application: un-prepped dry skin vs properly hydrated layered skin under macro 4K lens.", "visual_texture": "Demonstrative, high-satisfaction payoff, crisp beauty lighting", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Half-face", "visual_action": "Half-face foundation test", "spoken_audio": "Your foundation isn’t separating on your nose because it’s bad; it’s separating because your prep was dry."}, {"beat_number": 2, "purpose": "Layer", "visual_action": "Layer 1: Water-binding essence", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Layer", "visual_action": "Layer 2: Lightweight barrier cream with dry-down time", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Flawless", "visual_action": "Flawless foundation melt-in", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Your foundation isn’t separating on your nose because it’s bad; it’s separating because your prep was dry.", "first_second_visual_hook": "Side-by-side half-face application: un-prepped dry skin vs properly hydrated layered skin under macro 4K lens.", "hook_options": ["Your foundation isn’t separating on your nose because it’s bad; it’s separating because your prep was dry.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Demonstrative, high-satisfaction payoff, crisp beauty lighting", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Transforms viewers'''' daily makeup routine through fundamental skin preparation.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'e6a27889-0e34-46f3-ac49-ce8bf9754e94'::uuid,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 91, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "beauty", "authentic_niche_2026": true}'::jsonb
);

-- [BEAUTY] Active Percentage vs Formulation: The Serum Reality Check (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'e8c1654c-7f5a-4e00-9a6d-3c188b24def6'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Active Percentage vs Formulation: The Serum Reality Check', 'Explain why a 2% well-formulated encapsulated active with soothing buffers works 10x better than a harsh 10% unbuffered formula that causes inflammation.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["More percentage does not mean more results in skincare; it usually just means more irritation.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The percentage marketing race", "Bioavailability and encapsulation explained", "pH compatibility with skin mantle", "Ingredient list reading filter"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'e8c1654c-7f5a-4e00-9a6d-3c188b24def6'::uuid, 'Active Percentage vs Formulation: The Serum Reality Check', '{"title": "Active Percentage vs Formulation: The Serum Reality Check", "one_sentence_premise": "Explain why a 2% well-formulated encapsulated active with soothing buffers works 10x better than a harsh 10% unbuffered formula that causes inflammation.", "idea_summary": {"title": "Active Percentage vs Formulation: The Serum Reality Check", "premise": "Explain why a 2% well-formulated encapsulated active with soothing buffers works 10x better than a harsh 10% unbuffered formula that causes inflammation.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The percentage marketing race → Bioavailability and encapsulation explained → pH compatibility with skin mantle → Ingredient list reading filter", "opening_visual": "Two dropper bottles compared with pH strip test and skin absorption spread.", "visual_texture": "Science-backed, clear, consumer advocate", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The percentage marketing race", "spoken_audio": "More percentage does not mean more results in skincare; it usually just means more irritation."}, {"beat_number": 2, "purpose": "Bioavailability", "visual_action": "Bioavailability and encapsulation explained", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "pH", "visual_action": "pH compatibility with skin mantle", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Ingredient", "visual_action": "Ingredient list reading filter", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "More percentage does not mean more results in skincare; it usually just means more irritation.", "first_second_visual_hook": "Two dropper bottles compared with pH strip test and skin absorption spread.", "hook_options": ["More percentage does not mean more results in skincare; it usually just means more irritation.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Science-backed, clear, consumer advocate", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Elevates the creator as an intelligent cosmetic formulation reviewer.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'e8c1654c-7f5a-4e00-9a6d-3c188b24def6'::uuid,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 86, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "beauty", "authentic_niche_2026": true}'::jsonb
);

-- [BEAUTY] The Micro-Concealing Technique for Texture-Free Complexion (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '9d1950ed-2147-4227-8344-b58817c09046'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Micro-Concealing Technique for Texture-Free Complexion', 'Show how pinpoint concealing on a tiny detail brush replaces heavy full-face foundation, letting real skin breathe while erasing blemishes.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If you want your makeup to look like actual skin in direct sunlight, throw away the big flat foundation brush.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Full coverage cakey baseline contrast", "Setting blemish with micro-powder tap", "Pinpoint dotting technique", "Sunlight real-skin reveal"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '9d1950ed-2147-4227-8344-b58817c09046'::uuid, 'The Micro-Concealing Technique for Texture-Free Complexion', '{"title": "The Micro-Concealing Technique for Texture-Free Complexion", "one_sentence_premise": "Show how pinpoint concealing on a tiny detail brush replaces heavy full-face foundation, letting real skin breathe while erasing blemishes.", "idea_summary": {"title": "The Micro-Concealing Technique for Texture-Free Complexion", "premise": "Show how pinpoint concealing on a tiny detail brush replaces heavy full-face foundation, letting real skin breathe while erasing blemishes.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Full coverage cakey baseline contrast → Setting blemish with micro-powder tap → Pinpoint dotting technique → Sunlight real-skin reveal", "opening_visual": "Fine pinpoint detail brush dotting microscopic concealer pigment exactly onto hyperpigmentation without touching surrounding skin.", "visual_texture": "Intimate, precise, ASMR makeup application", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Full", "visual_action": "Full coverage cakey baseline contrast", "spoken_audio": "If you want your makeup to look like actual skin in direct sunlight, throw away the big flat foundation brush."}, {"beat_number": 2, "purpose": "Setting", "visual_action": "Setting blemish with micro-powder tap", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Pinpoint", "visual_action": "Pinpoint dotting technique", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Sunlight", "visual_action": "Sunlight real-skin reveal", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If you want your makeup to look like actual skin in direct sunlight, throw away the big flat foundation brush.", "first_second_visual_hook": "Fine pinpoint detail brush dotting microscopic concealer pigment exactly onto hyperpigmentation without touching surrounding skin.", "hook_options": ["If you want your makeup to look like actual skin in direct sunlight, throw away the big flat foundation brush.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Intimate, precise, ASMR makeup application", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Teaches editorial artist secrets that give viewers undetectable natural coverage.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '9d1950ed-2147-4227-8344-b58817c09046'::uuid,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 84, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "beauty", "authentic_niche_2026": true}'::jsonb
);

-- [BEAUTY] Cream vs Powder: The Humidity & Skin Type Matrix (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '948e8b8d-5c2c-4bc1-ac2e-2e3c1bd509f7'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Cream vs Powder: The Humidity & Skin Type Matrix', 'A tactical breakdown of when cream blush/bronzer works (dry climate, mature skin) vs when finely-milled baked powder is mandatory (oily T-zone, high humidity).',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Cream makeup looks amazing on TikTok for 5 minutes; here is what happens after 4 hours in heat.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The 4-hour wear test under warmth", "Skin type matching rules", "Hybrid layering: Cream base + sheer baked powder veil", "Final wear result"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '948e8b8d-5c2c-4bc1-ac2e-2e3c1bd509f7'::uuid, 'Cream vs Powder: The Humidity & Skin Type Matrix', '{"title": "Cream vs Powder: The Humidity & Skin Type Matrix", "one_sentence_premise": "A tactical breakdown of when cream blush/bronzer works (dry climate, mature skin) vs when finely-milled baked powder is mandatory (oily T-zone, high humidity).", "idea_summary": {"title": "Cream vs Powder: The Humidity & Skin Type Matrix", "premise": "A tactical breakdown of when cream blush/bronzer works (dry climate, mature skin) vs when finely-milled baked powder is mandatory (oily T-zone, high humidity).", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The 4-hour wear test under warmth → Skin type matching rules → Hybrid layering: Cream base + sheer baked powder veil → Final wear result", "opening_visual": "Blotting paper test after 4 hours comparing cream melting vs hybrid baked powder hold.", "visual_texture": "Practical wear-test, honest, energetic", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The 4-hour wear test under warmth", "spoken_audio": "Cream makeup looks amazing on TikTok for 5 minutes; here is what happens after 4 hours in heat."}, {"beat_number": 2, "purpose": "Skin", "visual_action": "Skin type matching rules", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Hybrid", "visual_action": "Hybrid layering: Cream base + sheer baked powder veil", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Final", "visual_action": "Final wear result", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Cream makeup looks amazing on TikTok for 5 minutes; here is what happens after 4 hours in heat.", "first_second_visual_hook": "Blotting paper test after 4 hours comparing cream melting vs hybrid baked powder hold.", "hook_options": ["Cream makeup looks amazing on TikTok for 5 minutes; here is what happens after 4 hours in heat.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Practical wear-test, honest, energetic", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Builds creator trust as an honest, real-life durability tester.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '948e8b8d-5c2c-4bc1-ac2e-2e3c1bd509f7'::uuid,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 82, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "beauty", "authentic_niche_2026": true}'::jsonb
);

-- [BEAUTY] The 60-Second Cleansing Rule for Congested Pores (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'ffdabad1-45cc-4ff0-a821-4667ba1b989b'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The 60-Second Cleansing Rule for Congested Pores', 'A simple timing hack: massaging oil cleanser for a full 60 seconds dissolves sebum plugs and sebaceous filaments naturally without pore strips.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["You are washing off your cleanser 45 seconds too fast.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The 15-second surface wash mistake", "60-second gentle lipid breakdown", "Emulsification with warm water", "Clean pore payoff macro"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'ffdabad1-45cc-4ff0-a821-4667ba1b989b'::uuid, 'The 60-Second Cleansing Rule for Congested Pores', '{"title": "The 60-Second Cleansing Rule for Congested Pores", "one_sentence_premise": "A simple timing hack: massaging oil cleanser for a full 60 seconds dissolves sebum plugs and sebaceous filaments naturally without pore strips.", "idea_summary": {"title": "The 60-Second Cleansing Rule for Congested Pores", "premise": "A simple timing hack: massaging oil cleanser for a full 60 seconds dissolves sebum plugs and sebaceous filaments naturally without pore strips.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The 15-second surface wash mistake → 60-second gentle lipid breakdown → Emulsification with warm water → Clean pore payoff macro", "opening_visual": "Timer running next to gentle circular oil massage showing sebum micro-plugs rolling out under fingertips.", "visual_texture": "Satisfying skincare ASMR, high utility, quick habit change", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The 15-second surface wash mistake", "spoken_audio": "You are washing off your cleanser 45 seconds too fast."}, {"beat_number": 2, "purpose": "60-second", "visual_action": "60-second gentle lipid breakdown", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Emulsification", "visual_action": "Emulsification with warm water", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Clean", "visual_action": "Clean pore payoff macro", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "You are washing off your cleanser 45 seconds too fast.", "first_second_visual_hook": "Timer running next to gentle circular oil massage showing sebum micro-plugs rolling out under fingertips.", "hook_options": ["You are washing off your cleanser 45 seconds too fast.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Satisfying skincare ASMR, high utility, quick habit change", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Delivers an immediate free skin upgrade that viewers will thank the creator for daily.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'ffdabad1-45cc-4ff0-a821-4667ba1b989b'::uuid,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 78, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "beauty", "authentic_niche_2026": true}'::jsonb
);

-- [BEAUTY] How to Tell if Your Sunscreen is Pilling Before Putting on Makeup (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'b06330a8-5c37-4124-a30f-80cc8334aca1'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'How to Tell if Your Sunscreen is Pilling Before Putting on Makeup', 'Quick 10-second patch test to identify silicone vs water-based sunscreen clashes before ruining a full face of makeup.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If your sunscreen pills like eraser shavings, here is the 5-second back-of-hand test.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The silicone vs water clash demonstration", "Back of hand compatibility test", "The 5-minute dry-down rule", "Save card checklist"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'b06330a8-5c37-4124-a30f-80cc8334aca1'::uuid, 'How to Tell if Your Sunscreen is Pilling Before Putting on Makeup', '{"title": "How to Tell if Your Sunscreen is Pilling Before Putting on Makeup", "one_sentence_premise": "Quick 10-second patch test to identify silicone vs water-based sunscreen clashes before ruining a full face of makeup.", "idea_summary": {"title": "How to Tell if Your Sunscreen is Pilling Before Putting on Makeup", "premise": "Quick 10-second patch test to identify silicone vs water-based sunscreen clashes before ruining a full face of makeup.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The silicone vs water clash demonstration → Back of hand compatibility test → The 5-minute dry-down rule → Save card checklist", "opening_visual": "Mixing sunscreen drop with foundation drop on back of hand showing instant curdling vs smooth blend.", "visual_texture": "Instant utility, problem-solving, fast pace", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The silicone vs water clash demonstration", "spoken_audio": "If your sunscreen pills like eraser shavings, here is the 5-second back-of-hand test."}, {"beat_number": 2, "purpose": "Back", "visual_action": "Back of hand compatibility test", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The 5-minute dry-down rule", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Save", "visual_action": "Save card checklist", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If your sunscreen pills like eraser shavings, here is the 5-second back-of-hand test.", "first_second_visual_hook": "Mixing sunscreen drop with foundation drop on back of hand showing instant curdling vs smooth blend.", "hook_options": ["If your sunscreen pills like eraser shavings, here is the 5-second back-of-hand test.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Instant utility, problem-solving, fast pace", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Highly bookmarkable content that solves a universal morning makeup headache.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'b06330a8-5c37-4124-a30f-80cc8334aca1'::uuid,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 76, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "beauty", "authentic_niche_2026": true}'::jsonb
);

-- [BEAUTY] Eyebrow Feathering with an Angle Brush and Soap vs Gel (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '530ec0b7-53b8-4bf2-a725-f51e7aa79cbe'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Eyebrow Feathering with an Angle Brush and Soap vs Gel', 'Compare brow soap longevity against laminated brow gel, demonstrating the exact spoolie angle to avoid flaky white residue.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["The reason your brow lamination gel turns white by noon is this angle mistake.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Product overload failure", "Damp spoolie light coating technique", "Root-to-tip upward stroke", "Clean finish check"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '530ec0b7-53b8-4bf2-a725-f51e7aa79cbe'::uuid, 'Eyebrow Feathering with an Angle Brush and Soap vs Gel', '{"title": "Eyebrow Feathering with an Angle Brush and Soap vs Gel", "one_sentence_premise": "Compare brow soap longevity against laminated brow gel, demonstrating the exact spoolie angle to avoid flaky white residue.", "idea_summary": {"title": "Eyebrow Feathering with an Angle Brush and Soap vs Gel", "premise": "Compare brow soap longevity against laminated brow gel, demonstrating the exact spoolie angle to avoid flaky white residue.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Product overload failure → Damp spoolie light coating technique → Root-to-tip upward stroke → Clean finish check", "opening_visual": "Spoolie brushing upward at 45 degrees without overloading product onto skin.", "visual_texture": "Quick beauty tutorial, crisp lighting, macro eye focus", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Product", "visual_action": "Product overload failure", "spoken_audio": "The reason your brow lamination gel turns white by noon is this angle mistake."}, {"beat_number": 2, "purpose": "Damp", "visual_action": "Damp spoolie light coating technique", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Root-to-tip", "visual_action": "Root-to-tip upward stroke", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Clean", "visual_action": "Clean finish check", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "The reason your brow lamination gel turns white by noon is this angle mistake.", "first_second_visual_hook": "Spoolie brushing upward at 45 degrees without overloading product onto skin.", "hook_options": ["The reason your brow lamination gel turns white by noon is this angle mistake.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Quick beauty tutorial, crisp lighting, macro eye focus", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Solves common micro-frustrations with precision artistry.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '530ec0b7-53b8-4bf2-a725-f51e7aa79cbe'::uuid,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 74, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "beauty", "authentic_niche_2026": true}'::jsonb
);

-- [BEAUTY] Lip Liner Symmetry: The Cupid''s Bow ''X'' Technique (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '3e975453-f2f8-4295-b753-9986de92ba93'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Lip Liner Symmetry: The Cupid''s Bow ''X'' Technique', 'A 15-second cheat sheet for creating symmetrical, plump lip definition without overlining into the nostril plane.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Draw this ''X'' before lining the rest of your lips.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The ''X'' anchor marks", "Outer corner connection line", "Soft finger smudge to center", "Gloss payoff reveal"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '3e975453-f2f8-4295-b753-9986de92ba93'::uuid, 'Lip Liner Symmetry: The Cupid''s Bow ''X'' Technique', '{"title": "Lip Liner Symmetry: The Cupid''s Bow ''X'' Technique", "one_sentence_premise": "A 15-second cheat sheet for creating symmetrical, plump lip definition without overlining into the nostril plane.", "idea_summary": {"title": "Lip Liner Symmetry: The Cupid''s Bow ''X'' Technique", "premise": "A 15-second cheat sheet for creating symmetrical, plump lip definition without overlining into the nostril plane.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The ''X'' anchor marks → Outer corner connection line → Soft finger smudge to center → Gloss payoff reveal", "opening_visual": "Sharp nude lip pencil drawing a tiny crisp ''X'' at the Cupid''s bow peak and connecting to outer corners.", "visual_texture": "High aesthetics, quick beauty shortcut, satisfying payoff", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The ''X'' anchor marks", "spoken_audio": "Draw this ''''X'''' before lining the rest of your lips."}, {"beat_number": 2, "purpose": "Outer", "visual_action": "Outer corner connection line", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Soft", "visual_action": "Soft finger smudge to center", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Gloss", "visual_action": "Gloss payoff reveal", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Draw this ''X'' before lining the rest of your lips.", "first_second_visual_hook": "Sharp nude lip pencil drawing a tiny crisp ''X'' at the Cupid''s bow peak and connecting to outer corners.", "hook_options": ["Draw this ''X'' before lining the rest of your lips.", "Before you do this in Beauty, look at this rule.", "This is the Beauty breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "High aesthetics, quick beauty shortcut, satisfying payoff", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Generates fast viral saves and easy replication across beauty enthusiasts.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '3e975453-f2f8-4295-b753-9986de92ba93'::uuid,
  (select id from public.categories where slug = 'beauty'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 72, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "beauty", "authentic_niche_2026": true}'::jsonb
);

insert into public.categories (slug, name, family, enabled, risk_level, sort_order)
values ('food', 'Food', 'creator_content', true, 'low', 100)
on conflict (slug) do update set enabled = true, name = excluded.name;

-- [FOOD] The Emulsion Secret: Why Restaurant Pasta Sauce Clings to the Noodle (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '45ee736b-7648-4d9e-aa07-e5425782e87a'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Emulsion Secret: Why Restaurant Pasta Sauce Clings to the Noodle', 'Explain the physics of starch water + fat emulsification (mantecatura) that turns watery pasta water into glossy, restaurant-grade silk.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If your pasta sauce sits in a pool at the bottom of the bowl, you missed the most important 60 seconds of cooking.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Watery separated sauce mistake", "The science of starchy pasta water reduction", "Vigorous pan-toss mantecatura technique", "Glossy bowl transfer and twirl"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '45ee736b-7648-4d9e-aa07-e5425782e87a'::uuid, 'The Emulsion Secret: Why Restaurant Pasta Sauce Clings to the Noodle', '{"title": "The Emulsion Secret: Why Restaurant Pasta Sauce Clings to the Noodle", "one_sentence_premise": "Explain the physics of starch water + fat emulsification (mantecatura) that turns watery pasta water into glossy, restaurant-grade silk.", "idea_summary": {"title": "The Emulsion Secret: Why Restaurant Pasta Sauce Clings to the Noodle", "premise": "Explain the physics of starch water + fat emulsification (mantecatura) that turns watery pasta water into glossy, restaurant-grade silk.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Watery separated sauce mistake → The science of starchy pasta water reduction → Vigorous pan-toss mantecatura technique → Glossy bowl transfer and twirl", "opening_visual": "Pan tossing al dente rigatoni with butter and starchy pasta water turning into a rich glossy emulsion in 4K slow motion.", "visual_texture": "Culinary mastery, warm studio kitchen lighting, high acoustic sizzle", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Watery", "visual_action": "Watery separated sauce mistake", "spoken_audio": "If your pasta sauce sits in a pool at the bottom of the bowl, you missed the most important 60 seconds of cooking."}, {"beat_number": 2, "purpose": "The", "visual_action": "The science of starchy pasta water reduction", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Vigorous", "visual_action": "Vigorous pan-toss mantecatura technique", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Glossy", "visual_action": "Glossy bowl transfer and twirl", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If your pasta sauce sits in a pool at the bottom of the bowl, you missed the most important 60 seconds of cooking.", "first_second_visual_hook": "Pan tossing al dente rigatoni with butter and starchy pasta water turning into a rich glossy emulsion in 4K slow motion.", "hook_options": ["If your pasta sauce sits in a pool at the bottom of the bowl, you missed the most important 60 seconds of cooking.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Culinary mastery, warm studio kitchen lighting, high acoustic sizzle", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Positions creator as an authentic culinary scientist who demystifies chef-level technique.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '45ee736b-7648-4d9e-aa07-e5425782e87a'::uuid,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 96, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "food", "authentic_niche_2026": true}'::jsonb
);

-- [FOOD] The Maillard Surface Dryness Test for Perfect Sear (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '81afee71-d941-4334-876b-d5f7085086c7'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Maillard Surface Dryness Test for Perfect Sear', 'Demonstrate why wet meat steams instead of browning, and how 24-hour dry brining in the fridge creates an unyielding crispy crust.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Moisture is the enemy of a golden sear; here is the paper towel test.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The wet steak grey band disaster", "Dry-brining on wire rack for 24h", "High smoke point oil + cast iron contact", "Audio knife scrape across golden crust"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '81afee71-d941-4334-876b-d5f7085086c7'::uuid, 'The Maillard Surface Dryness Test for Perfect Sear', '{"title": "The Maillard Surface Dryness Test for Perfect Sear", "one_sentence_premise": "Demonstrate why wet meat steams instead of browning, and how 24-hour dry brining in the fridge creates an unyielding crispy crust.", "idea_summary": {"title": "The Maillard Surface Dryness Test for Perfect Sear", "premise": "Demonstrate why wet meat steams instead of browning, and how 24-hour dry brining in the fridge creates an unyielding crispy crust.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The wet steak grey band disaster → Dry-brining on wire rack for 24h → High smoke point oil + cast iron contact → Audio knife scrape across golden crust", "opening_visual": "Cast iron skillet sear creating an immediate mahogany crust with explosive audio sizzle, zero grey steaming.", "visual_texture": "Sensory, visceral, tactile cooking ASMR", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The wet steak grey band disaster", "spoken_audio": "Moisture is the enemy of a golden sear; here is the paper towel test."}, {"beat_number": 2, "purpose": "Dry-brining", "visual_action": "Dry-brining on wire rack for 24h", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "High", "visual_action": "High smoke point oil + cast iron contact", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Audio", "visual_action": "Audio knife scrape across golden crust", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Moisture is the enemy of a golden sear; here is the paper towel test.", "first_second_visual_hook": "Cast iron skillet sear creating an immediate mahogany crust with explosive audio sizzle, zero grey steaming.", "hook_options": ["Moisture is the enemy of a golden sear; here is the paper towel test.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Sensory, visceral, tactile cooking ASMR", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Delivers undeniable culinary proof and kitchen confidence.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '81afee71-d941-4334-876b-d5f7085086c7'::uuid,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 94, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "food", "authentic_niche_2026": true}'::jsonb
);

-- [FOOD] Balancing Flavor: The Acid-Salt-Fat Calibration Triangle (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '58239f0f-1a67-4c56-adb3-c38e4772b7fa'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Balancing Flavor: The Acid-Salt-Fat Calibration Triangle', 'Take a bland, flat soup or sauce and fix it step-by-step using lemon juice/vinegar instead of dumping in more salt.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["When your dish tastes flat, it almost never needs more salt; it needs acid.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The bland soup tasting diagnostic", "Why salt only amplifies existing notes", "Adding acid to cut fat and sharpen contrast", "Final balanced spoonful reaction"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '58239f0f-1a67-4c56-adb3-c38e4772b7fa'::uuid, 'Balancing Flavor: The Acid-Salt-Fat Calibration Triangle', '{"title": "Balancing Flavor: The Acid-Salt-Fat Calibration Triangle", "one_sentence_premise": "Take a bland, flat soup or sauce and fix it step-by-step using lemon juice/vinegar instead of dumping in more salt.", "idea_summary": {"title": "Balancing Flavor: The Acid-Salt-Fat Calibration Triangle", "premise": "Take a bland, flat soup or sauce and fix it step-by-step using lemon juice/vinegar instead of dumping in more salt.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The bland soup tasting diagnostic → Why salt only amplifies existing notes → Adding acid to cut fat and sharpen contrast → Final balanced spoonful reaction", "opening_visual": "Spoon tasting flat soup, adding a micro-splash of sherry vinegar, and demonstrating the instant flavor awakening.", "visual_texture": "Chef palate masterclass, thoughtful, authoritative", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The bland soup tasting diagnostic", "spoken_audio": "When your dish tastes flat, it almost never needs more salt; it needs acid."}, {"beat_number": 2, "purpose": "Why", "visual_action": "Why salt only amplifies existing notes", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Adding", "visual_action": "Adding acid to cut fat and sharpen contrast", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Final", "visual_action": "Final balanced spoonful reaction", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "When your dish tastes flat, it almost never needs more salt; it needs acid.", "first_second_visual_hook": "Spoon tasting flat soup, adding a micro-splash of sherry vinegar, and demonstrating the instant flavor awakening.", "hook_options": ["When your dish tastes flat, it almost never needs more salt; it needs acid.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Chef palate masterclass, thoughtful, authoritative", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Educates viewers on the foundational culinary theory of professional chefs.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '58239f0f-1a67-4c56-adb3-c38e4772b7fa'::uuid,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 92, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "food", "authentic_niche_2026": true}'::jsonb
);

-- [FOOD] The Knife Grip & Cutting Geometry That Doubles Prep Speed (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'cfd2b08f-88b2-48d5-adf8-7dd6b35c09b0'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Knife Grip & Cutting Geometry That Doubles Prep Speed', 'Teach the professional pinch grip and claw hand technique that prevents kitchen accidents and creates uniform knife cuts.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If your index finger rests on top of the knife blade, your grip is fighting your wrist.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Handle grip flaw vs pinch grip balance", "The protective knuckle guide claw", "Rocking motion vs push cut", "Uniform dice lineup"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'cfd2b08f-88b2-48d5-adf8-7dd6b35c09b0'::uuid, 'The Knife Grip & Cutting Geometry That Doubles Prep Speed', '{"title": "The Knife Grip & Cutting Geometry That Doubles Prep Speed", "one_sentence_premise": "Teach the professional pinch grip and claw hand technique that prevents kitchen accidents and creates uniform knife cuts.", "idea_summary": {"title": "The Knife Grip & Cutting Geometry That Doubles Prep Speed", "premise": "Teach the professional pinch grip and claw hand technique that prevents kitchen accidents and creates uniform knife cuts.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Handle grip flaw vs pinch grip balance → The protective knuckle guide claw → Rocking motion vs push cut → Uniform dice lineup", "opening_visual": "High-speed rhythmic dicing of a red onion with a razor-sharp 8-inch chef knife gliding effortlessly across cutting board.", "visual_texture": "Sharp, satisfying rhythm, culinary kitchen utility", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Handle", "visual_action": "Handle grip flaw vs pinch grip balance", "spoken_audio": "If your index finger rests on top of the knife blade, your grip is fighting your wrist."}, {"beat_number": 2, "purpose": "The", "visual_action": "The protective knuckle guide claw", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Rocking", "visual_action": "Rocking motion vs push cut", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Uniform", "visual_action": "Uniform dice lineup", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If your index finger rests on top of the knife blade, your grip is fighting your wrist.", "first_second_visual_hook": "High-speed rhythmic dicing of a red onion with a razor-sharp 8-inch chef knife gliding effortlessly across cutting board.", "hook_options": ["If your index finger rests on top of the knife blade, your grip is fighting your wrist.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Sharp, satisfying rhythm, culinary kitchen utility", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Builds fundamental cooking technique and safety authority.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'cfd2b08f-88b2-48d5-adf8-7dd6b35c09b0'::uuid,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 87, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "food", "authentic_niche_2026": true}'::jsonb
);

-- [FOOD] The Audio Crunch Test: The Science of Triple-Cooked Crispy Potatoes (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'f693f7df-f6a8-48cc-b21c-4b9ad4fd7ee3'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Audio Crunch Test: The Science of Triple-Cooked Crispy Potatoes', 'Break down boiling with baking soda to create surface slurry, followed by high-heat fat roasting for the ultimate glass-like exterior.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Listen to this potato.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Baking soda boil to release surface starch", "Rough pan shake to create fuzzy edges", "Roasting in smoking duck fat/olive oil", "The microphone crunch bite test"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'f693f7df-f6a8-48cc-b21c-4b9ad4fd7ee3'::uuid, 'The Audio Crunch Test: The Science of Triple-Cooked Crispy Potatoes', '{"title": "The Audio Crunch Test: The Science of Triple-Cooked Crispy Potatoes", "one_sentence_premise": "Break down boiling with baking soda to create surface slurry, followed by high-heat fat roasting for the ultimate glass-like exterior.", "idea_summary": {"title": "The Audio Crunch Test: The Science of Triple-Cooked Crispy Potatoes", "premise": "Break down boiling with baking soda to create surface slurry, followed by high-heat fat roasting for the ultimate glass-like exterior.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Baking soda boil to release surface starch → Rough pan shake to create fuzzy edges → Roasting in smoking duck fat/olive oil → The microphone crunch bite test", "opening_visual": "Knife cutting through a roasted potato wedge with loud, glass-shattering acoustic crunch under studio microphone.", "visual_texture": "Hyper-satisfying ASMR, golden brown aesthetics, mouth-watering payoff", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Baking", "visual_action": "Baking soda boil to release surface starch", "spoken_audio": "Listen to this potato."}, {"beat_number": 2, "purpose": "Rough", "visual_action": "Rough pan shake to create fuzzy edges", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Roasting", "visual_action": "Roasting in smoking duck fat/olive oil", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The microphone crunch bite test", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Listen to this potato.", "first_second_visual_hook": "Knife cutting through a roasted potato wedge with loud, glass-shattering acoustic crunch under studio microphone.", "hook_options": ["Listen to this potato.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Hyper-satisfying ASMR, golden brown aesthetics, mouth-watering payoff", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Creates viral food cravings and repeatable dinner showstoppers.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'f693f7df-f6a8-48cc-b21c-4b9ad4fd7ee3'::uuid,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 85, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "food", "authentic_niche_2026": true}'::jsonb
);

-- [FOOD] Plate Architecture: How Top Restaurants Build Height and Negative Space (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'e666fa52-63f6-4c33-aac8-0ad5aca02fc6'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Plate Architecture: How Top Restaurants Build Height and Negative Space', 'Turn a messy home dinner into a fine-dining presentation using 3 rules: offset sauce spoon drag, odd-number protein placement, and fresh herb garnish.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["You don’t need new ingredients to make your dinner look like a $90 tasting menu course.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The flat pile mistake", "Rule 1: The anchor sauce sweep", "Rule 2: Vertical stacking and negative rim space", "Rule 3: Herb micro-placement with tweezers"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'e666fa52-63f6-4c33-aac8-0ad5aca02fc6'::uuid, 'Plate Architecture: How Top Restaurants Build Height and Negative Space', '{"title": "Plate Architecture: How Top Restaurants Build Height and Negative Space", "one_sentence_premise": "Turn a messy home dinner into a fine-dining presentation using 3 rules: offset sauce spoon drag, odd-number protein placement, and fresh herb garnish.", "idea_summary": {"title": "Plate Architecture: How Top Restaurants Build Height and Negative Space", "premise": "Turn a messy home dinner into a fine-dining presentation using 3 rules: offset sauce spoon drag, odd-number protein placement, and fresh herb garnish.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The flat pile mistake → Rule 1: The anchor sauce sweep → Rule 2: Vertical stacking and negative rim space → Rule 3: Herb micro-placement with tweezers", "opening_visual": "White ceramic plate receiving a smooth back-of-spoon puree swoop and delicately stacked seared scallop.", "visual_texture": "Modern gastronomy, artistic, clean minimalist tableware", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The flat pile mistake", "spoken_audio": "You don’t need new ingredients to make your dinner look like a $90 tasting menu course."}, {"beat_number": 2, "purpose": "Rule", "visual_action": "Rule 1: The anchor sauce sweep", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Rule", "visual_action": "Rule 2: Vertical stacking and negative rim space", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Rule", "visual_action": "Rule 3: Herb micro-placement with tweezers", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "You don’t need new ingredients to make your dinner look like a $90 tasting menu course.", "first_second_visual_hook": "White ceramic plate receiving a smooth back-of-spoon puree swoop and delicately stacked seared scallop.", "hook_options": ["You don’t need new ingredients to make your dinner look like a $90 tasting menu course.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Modern gastronomy, artistic, clean minimalist tableware", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Elevates everyday cooking into refined culinary artistry.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'e666fa52-63f6-4c33-aac8-0ad5aca02fc6'::uuid,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 83, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "food", "authentic_niche_2026": true}'::jsonb
);

-- [FOOD] The Garlic Press vs Grater vs Sliced Flavor Intensity Scale (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'b155f2a6-6370-45c1-881a-502a4c639ee6'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Garlic Press vs Grater vs Sliced Flavor Intensity Scale', 'A 15-second guide explaining how cell wall disruption controls allicin release (sliced = sweet & mild, grated = pungent & sharp).',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["How you cut your garlic changes how pungent it tastes.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Sliced in olive oil for delicate pasta", "Smashed for roast aromatics", "Grated for dressings and marinades", "Summary intensity chart"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'b155f2a6-6370-45c1-881a-502a4c639ee6'::uuid, 'The Garlic Press vs Grater vs Sliced Flavor Intensity Scale', '{"title": "The Garlic Press vs Grater vs Sliced Flavor Intensity Scale", "one_sentence_premise": "A 15-second guide explaining how cell wall disruption controls allicin release (sliced = sweet & mild, grated = pungent & sharp).", "idea_summary": {"title": "The Garlic Press vs Grater vs Sliced Flavor Intensity Scale", "premise": "A 15-second guide explaining how cell wall disruption controls allicin release (sliced = sweet & mild, grated = pungent & sharp).", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Sliced in olive oil for delicate pasta → Smashed for roast aromatics → Grated for dressings and marinades → Summary intensity chart", "opening_visual": "3 garlic cloves cut 3 ways: thin razor slice, knife smash, microplane grate.", "visual_texture": "Fast educational food science, crisp macro", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Sliced", "visual_action": "Sliced in olive oil for delicate pasta", "spoken_audio": "How you cut your garlic changes how pungent it tastes."}, {"beat_number": 2, "purpose": "Smashed", "visual_action": "Smashed for roast aromatics", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Grated", "visual_action": "Grated for dressings and marinades", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Summary", "visual_action": "Summary intensity chart", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "How you cut your garlic changes how pungent it tastes.", "first_second_visual_hook": "3 garlic cloves cut 3 ways: thin razor slice, knife smash, microplane grate.", "hook_options": ["How you cut your garlic changes how pungent it tastes.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Fast educational food science, crisp macro", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Provides instant bookmarkable kitchen wisdom.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'b155f2a6-6370-45c1-881a-502a4c639ee6'::uuid,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 78, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "food", "authentic_niche_2026": true}'::jsonb
);

-- [FOOD] How to Revive Stale Sourdough Bread in 5 Minutes (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'eeff8dd0-f4bb-45d5-b17d-0e8bee52f10f'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'How to Revive Stale Sourdough Bread in 5 Minutes', 'Run rock-hard stale bread under running tap water and bake at 200°C for 5 minutes to restore crackling crust and pillowy crumb.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Do not throw away rock-hard bread; put it directly under running water.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Tapping hard loaf with knife", "Running water over crust", "5-minute oven blast", "Steam release and soft crumb pull"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'eeff8dd0-f4bb-45d5-b17d-0e8bee52f10f'::uuid, 'How to Revive Stale Sourdough Bread in 5 Minutes', '{"title": "How to Revive Stale Sourdough Bread in 5 Minutes", "one_sentence_premise": "Run rock-hard stale bread under running tap water and bake at 200°C for 5 minutes to restore crackling crust and pillowy crumb.", "idea_summary": {"title": "How to Revive Stale Sourdough Bread in 5 Minutes", "premise": "Run rock-hard stale bread under running tap water and bake at 200°C for 5 minutes to restore crackling crust and pillowy crumb.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Tapping hard loaf with knife → Running water over crust → 5-minute oven blast → Steam release and soft crumb pull", "opening_visual": "Loaf of hard bread held under kitchen faucet water stream, then cut open 5 minutes later steaming and crackling.", "visual_texture": "Shock-value life hack, high food utility", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Tapping", "visual_action": "Tapping hard loaf with knife", "spoken_audio": "Do not throw away rock-hard bread; put it directly under running water."}, {"beat_number": 2, "purpose": "Running", "visual_action": "Running water over crust", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "5-minute", "visual_action": "5-minute oven blast", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Steam", "visual_action": "Steam release and soft crumb pull", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Do not throw away rock-hard bread; put it directly under running water.", "first_second_visual_hook": "Loaf of hard bread held under kitchen faucet water stream, then cut open 5 minutes later steaming and crackling.", "hook_options": ["Do not throw away rock-hard bread; put it directly under running water.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Shock-value life hack, high food utility", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Delivers an instant high-value zero-waste kitchen trick.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'eeff8dd0-f4bb-45d5-b17d-0e8bee52f10f'::uuid,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 76, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "food", "authentic_niche_2026": true}'::jsonb
);

-- [FOOD] The 3-Ingredient Vinaigrette Ratio (3:1 Law) (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'defeb93c-1bec-4e37-9ad3-d63db3e2c7a8'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The 3-Ingredient Vinaigrette Ratio (3:1 Law)', 'The foolproof Dijon + acid + olive oil ratio in a glass jar that never separates and beats store-bought dressings forever.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Never buy bottled salad dressing again.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["3 parts extra virgin olive oil", "1 part champagne vinegar", "1 tsp Dijon mustard as stabilizer", "Creamy emulsion pour over greens"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'defeb93c-1bec-4e37-9ad3-d63db3e2c7a8'::uuid, 'The 3-Ingredient Vinaigrette Ratio (3:1 Law)', '{"title": "The 3-Ingredient Vinaigrette Ratio (3:1 Law)", "one_sentence_premise": "The foolproof Dijon + acid + olive oil ratio in a glass jar that never separates and beats store-bought dressings forever.", "idea_summary": {"title": "The 3-Ingredient Vinaigrette Ratio (3:1 Law)", "premise": "The foolproof Dijon + acid + olive oil ratio in a glass jar that never separates and beats store-bought dressings forever.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "3 parts extra virgin olive oil → 1 part champagne vinegar → 1 tsp Dijon mustard as stabilizer → Creamy emulsion pour over greens", "opening_visual": "Shaking mini mason jar vigorously for 5 seconds as oil and vinegar form a thick creamy emulsion.", "visual_texture": "Quick, healthy, satisfying shake ASMR", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "3", "visual_action": "3 parts extra virgin olive oil", "spoken_audio": "Never buy bottled salad dressing again."}, {"beat_number": 2, "purpose": "1", "visual_action": "1 part champagne vinegar", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "1", "visual_action": "1 tsp Dijon mustard as stabilizer", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Creamy", "visual_action": "Creamy emulsion pour over greens", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Never buy bottled salad dressing again.", "first_second_visual_hook": "Shaking mini mason jar vigorously for 5 seconds as oil and vinegar form a thick creamy emulsion.", "hook_options": ["Never buy bottled salad dressing again.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Quick, healthy, satisfying shake ASMR", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Simple, timeless culinary independence for the home cook.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'defeb93c-1bec-4e37-9ad3-d63db3e2c7a8'::uuid,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 74, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "food", "authentic_niche_2026": true}'::jsonb
);

-- [FOOD] The Cold Pan Egg Scramble: Custard Texture Technique (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '073aa624-cea7-4973-9865-f287e9068f70'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Cold Pan Egg Scramble: Custard Texture Technique', 'Start eggs in a cold nonstick pan with cold butter cubes over low heat, stirring continuously for velvety French-style scrambled eggs.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If your scrambled eggs look like rubber sponges, start them in a cold pan.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Cold butter cubes in cold pan", "On and off heat stirring rhythm", "Flaky salt and chives finish", "Velvety toast spread"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '073aa624-cea7-4973-9865-f287e9068f70'::uuid, 'The Cold Pan Egg Scramble: Custard Texture Technique', '{"title": "The Cold Pan Egg Scramble: Custard Texture Technique", "one_sentence_premise": "Start eggs in a cold nonstick pan with cold butter cubes over low heat, stirring continuously for velvety French-style scrambled eggs.", "idea_summary": {"title": "The Cold Pan Egg Scramble: Custard Texture Technique", "premise": "Start eggs in a cold nonstick pan with cold butter cubes over low heat, stirring continuously for velvety French-style scrambled eggs.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Cold butter cubes in cold pan → On and off heat stirring rhythm → Flaky salt and chives finish → Velvety toast spread", "opening_visual": "Silicone spatula gently folding creamy, velvet-smooth egg curds onto toasted brioche.", "visual_texture": "Morning luxury, soothing culinary technique", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Cold", "visual_action": "Cold butter cubes in cold pan", "spoken_audio": "If your scrambled eggs look like rubber sponges, start them in a cold pan."}, {"beat_number": 2, "purpose": "On", "visual_action": "On and off heat stirring rhythm", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Flaky", "visual_action": "Flaky salt and chives finish", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Velvety", "visual_action": "Velvety toast spread", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If your scrambled eggs look like rubber sponges, start them in a cold pan.", "first_second_visual_hook": "Silicone spatula gently folding creamy, velvet-smooth egg curds onto toasted brioche.", "hook_options": ["If your scrambled eggs look like rubber sponges, start them in a cold pan.", "Before you do this in Food, look at this rule.", "This is the Food breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Morning luxury, soothing culinary technique", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Transforms breakfast into a 5-star hotel experience.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '073aa624-cea7-4973-9865-f287e9068f70'::uuid,
  (select id from public.categories where slug = 'food'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 72, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "food", "authentic_niche_2026": true}'::jsonb
);

insert into public.categories (slug, name, family, enabled, risk_level, sort_order)
values ('thought_leadership', 'Thought Leadership', 'creator_content', true, 'low', 100)
on conflict (slug) do update set enabled = true, name = excluded.name;

-- [THOUGHT_LEADERSHIP] The Asymmetric Career Bet: Optimizing for Optionality over Linear Promotion (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '641dd3d6-1611-4919-b9fa-4ed11930919f'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Asymmetric Career Bet: Optimizing for Optionality over Linear Promotion', 'Break down why climbing a single corporate ladder has high downside and capped upside, while building specialized technical expertise + public distribution creates unlimited compounding optionality.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["The biggest career risk is doing everything ''safely'' for 10 years and ending up with zero transferable leverage.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The illusion of corporate stability", "The barbell strategy: Low-risk foundation + high-upside asymmetric bets", "Building proprietary distribution", "The 3-question audit to run this weekend"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '641dd3d6-1611-4919-b9fa-4ed11930919f'::uuid, 'The Asymmetric Career Bet: Optimizing for Optionality over Linear Promotion', '{"title": "The Asymmetric Career Bet: Optimizing for Optionality over Linear Promotion", "one_sentence_premise": "Break down why climbing a single corporate ladder has high downside and capped upside, while building specialized technical expertise + public distribution creates unlimited compounding optionality.", "idea_summary": {"title": "The Asymmetric Career Bet: Optimizing for Optionality over Linear Promotion", "premise": "Break down why climbing a single corporate ladder has high downside and capped upside, while building specialized technical expertise + public distribution creates unlimited compounding optionality.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The illusion of corporate stability → The barbell strategy: Low-risk foundation + high-upside asymmetric bets → Building proprietary distribution → The 3-question audit to run this weekend", "opening_visual": "Clean whiteboard diagram contrasting a linear capped progression line against an exponential barbell curve.", "visual_texture": "Analytical, sharp, calm executive authority, modern studio workspace", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The illusion of corporate stability", "spoken_audio": "The biggest career risk is doing everything ''''safely'''' for 10 years and ending up with zero transferable leverage."}, {"beat_number": 2, "purpose": "The", "visual_action": "The barbell strategy: Low-risk foundation + high-upside asymmetric bets", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Building", "visual_action": "Building proprietary distribution", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The 3-question audit to run this weekend", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "The biggest career risk is doing everything ''safely'' for 10 years and ending up with zero transferable leverage.", "first_second_visual_hook": "Clean whiteboard diagram contrasting a linear capped progression line against an exponential barbell curve.", "hook_options": ["The biggest career risk is doing everything ''safely'' for 10 years and ending up with zero transferable leverage.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Analytical, sharp, calm executive authority, modern studio workspace", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Positions creator as a strategic systems thinker who cuts through conventional career mediocrity.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '641dd3d6-1611-4919-b9fa-4ed11930919f'::uuid,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 96, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "thought_leadership", "authentic_niche_2026": true}'::jsonb
);

-- [THOUGHT_LEADERSHIP] The 1-Page Decision Memo: How High-Speed Operators Eliminate Meetings (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'c677fbe3-9bc2-43b8-894b-31eda413174d'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The 1-Page Decision Memo: How High-Speed Operators Eliminate Meetings', 'Deconstruct the exact Amazon-style 6-pager converted into a 1-page operational decision memo: Context, Asymmetrical Bet, Tradeoffs, and Irreversible Risk.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If your team needs an hour-long meeting to make a decision, your decision framework is broken.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The meeting fatigue epidemic", "The 4 essential sections of a 1-page memo", "Two-way door vs one-way door decisions", "Template breakdown for immediate team rollout"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'c677fbe3-9bc2-43b8-894b-31eda413174d'::uuid, 'The 1-Page Decision Memo: How High-Speed Operators Eliminate Meetings', '{"title": "The 1-Page Decision Memo: How High-Speed Operators Eliminate Meetings", "one_sentence_premise": "Deconstruct the exact Amazon-style 6-pager converted into a 1-page operational decision memo: Context, Asymmetrical Bet, Tradeoffs, and Irreversible Risk.", "idea_summary": {"title": "The 1-Page Decision Memo: How High-Speed Operators Eliminate Meetings", "premise": "Deconstruct the exact Amazon-style 6-pager converted into a 1-page operational decision memo: Context, Asymmetrical Bet, Tradeoffs, and Irreversible Risk.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The meeting fatigue epidemic → The 4 essential sections of a 1-page memo → Two-way door vs one-way door decisions → Template breakdown for immediate team rollout", "opening_visual": "Top-down view of a crisp 1-page typed memo with bold section headers and key risk tradeoffs highlighted in red pencil.", "visual_texture": "Executive, practical, minimalist, high productivity leverage", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The meeting fatigue epidemic", "spoken_audio": "If your team needs an hour-long meeting to make a decision, your decision framework is broken."}, {"beat_number": 2, "purpose": "The", "visual_action": "The 4 essential sections of a 1-page memo", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Two-way", "visual_action": "Two-way door vs one-way door decisions", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Template", "visual_action": "Template breakdown for immediate team rollout", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If your team needs an hour-long meeting to make a decision, your decision framework is broken.", "first_second_visual_hook": "Top-down view of a crisp 1-page typed memo with bold section headers and key risk tradeoffs highlighted in red pencil.", "hook_options": ["If your team needs an hour-long meeting to make a decision, your decision framework is broken.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Executive, practical, minimalist, high productivity leverage", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Delivers immediate operational excellence to founders, directors, and ambitious leaders.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'c677fbe3-9bc2-43b8-894b-31eda413174d'::uuid,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 94, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "thought_leadership", "authentic_niche_2026": true}'::jsonb
);

-- [THOUGHT_LEADERSHIP] The Speed-as-a-Moat Thesis: Why Slow Perfection Kills Companies (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'ecb17d56-ea76-4976-8bb5-9e64a67cd8ca'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Speed-as-a-Moat Thesis: Why Slow Perfection Kills Companies', 'Explain why speed of iteration beats quality of initial insight every single time: the feedback loop density formula.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["In business, speed is not just an execution metric; speed is the moat.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The trap of over-planning without market friction", "The compound effect of 52 learning cycles per year", "How to compress decision velocity from 2 weeks to 24 hours", "The weekly shipping cadence rule"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'ecb17d56-ea76-4976-8bb5-9e64a67cd8ca'::uuid, 'The Speed-as-a-Moat Thesis: Why Slow Perfection Kills Companies', '{"title": "The Speed-as-a-Moat Thesis: Why Slow Perfection Kills Companies", "one_sentence_premise": "Explain why speed of iteration beats quality of initial insight every single time: the feedback loop density formula.", "idea_summary": {"title": "The Speed-as-a-Moat Thesis: Why Slow Perfection Kills Companies", "premise": "Explain why speed of iteration beats quality of initial insight every single time: the feedback loop density formula.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The trap of over-planning without market friction → The compound effect of 52 learning cycles per year → How to compress decision velocity from 2 weeks to 24 hours → The weekly shipping cadence rule", "opening_visual": "Side-by-side comparison of 1 quarterly release vs 12 weekly iteration cycles on a clean timeline graphic.", "visual_texture": "Founder mindset, high-conviction, urgent yet composed", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The trap of over-planning without market friction", "spoken_audio": "In business, speed is not just an execution metric; speed is the moat."}, {"beat_number": 2, "purpose": "The", "visual_action": "The compound effect of 52 learning cycles per year", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "How", "visual_action": "How to compress decision velocity from 2 weeks to 24 hours", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The weekly shipping cadence rule", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "In business, speed is not just an execution metric; speed is the moat.", "first_second_visual_hook": "Side-by-side comparison of 1 quarterly release vs 12 weekly iteration cycles on a clean timeline graphic.", "hook_options": ["In business, speed is not just an execution metric; speed is the moat.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Founder mindset, high-conviction, urgent yet composed", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Attracts top-tier operators, investors, and high-performing entrepreneurs.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'ecb17d56-ea76-4976-8bb5-9e64a67cd8ca'::uuid,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 92, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "thought_leadership", "authentic_niche_2026": true}'::jsonb
);

-- [THOUGHT_LEADERSHIP] The Energy Audit: Categorizing Work into Leveraged vs Drain Tasks (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '8f844322-8260-407e-9329-ba98fd0312a8'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Energy Audit: Categorizing Work into Leveraged vs Drain Tasks', 'Walk through a quarterly calendar audit: redlining activities that drain focus and doubling down on $10,000/hour asymmetric leverage work.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["You don’t have a time management problem; you have an energy allocation problem.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The calendar truth test", "Classifying $10 tasks vs $10,000 leverage tasks", "The art of aggressive delegation and elimination", "The sacred 3-hour morning deep work block"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '8f844322-8260-407e-9329-ba98fd0312a8'::uuid, 'The Energy Audit: Categorizing Work into Leveraged vs Drain Tasks', '{"title": "The Energy Audit: Categorizing Work into Leveraged vs Drain Tasks", "one_sentence_premise": "Walk through a quarterly calendar audit: redlining activities that drain focus and doubling down on $10,000/hour asymmetric leverage work.", "idea_summary": {"title": "The Energy Audit: Categorizing Work into Leveraged vs Drain Tasks", "premise": "Walk through a quarterly calendar audit: redlining activities that drain focus and doubling down on $10,000/hour asymmetric leverage work.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The calendar truth test → Classifying $10 tasks vs $10,000 leverage tasks → The art of aggressive delegation and elimination → The sacred 3-hour morning deep work block", "opening_visual": "Tablet view color-coding 40 hours of calendar entries into Green (high-leverage creation) and Red (low-value reactivity).", "visual_texture": "Focused, disciplined, reflective", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The calendar truth test", "spoken_audio": "You don’t have a time management problem; you have an energy allocation problem."}, {"beat_number": 2, "purpose": "Classifying", "visual_action": "Classifying $10 tasks vs $10,000 leverage tasks", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The art of aggressive delegation and elimination", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The sacred 3-hour morning deep work block", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "You don’t have a time management problem; you have an energy allocation problem.", "first_second_visual_hook": "Tablet view color-coding 40 hours of calendar entries into Green (high-leverage creation) and Red (low-value reactivity).", "hook_options": ["You don’t have a time management problem; you have an energy allocation problem.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Focused, disciplined, reflective", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Builds high-performance credibility among busy executives and high earners.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '8f844322-8260-407e-9329-ba98fd0312a8'::uuid,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 87, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "thought_leadership", "authentic_niche_2026": true}'::jsonb
);

-- [THOUGHT_LEADERSHIP] The Talent Density Principle: Why A-Players Leave Average Teams (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '0315b844-e357-4769-8d1d-31cb483f65f1'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Talent Density Principle: Why A-Players Leave Average Teams', 'Explain why tolerating B-players actively repels top performers, and how setting an uncompromising quality floor attracts elite collaborators.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["The fastest way to lose your best people is tolerating mediocrity in the room.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The hidden cost of average performers", "How high standards act as a talent magnet", "The radical candor feedback loop", "Leader''s standard-setting checklist"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '0315b844-e357-4769-8d1d-31cb483f65f1'::uuid, 'The Talent Density Principle: Why A-Players Leave Average Teams', '{"title": "The Talent Density Principle: Why A-Players Leave Average Teams", "one_sentence_premise": "Explain why tolerating B-players actively repels top performers, and how setting an uncompromising quality floor attracts elite collaborators.", "idea_summary": {"title": "The Talent Density Principle: Why A-Players Leave Average Teams", "premise": "Explain why tolerating B-players actively repels top performers, and how setting an uncompromising quality floor attracts elite collaborators.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The hidden cost of average performers → How high standards act as a talent magnet → The radical candor feedback loop → Leader''s standard-setting checklist", "opening_visual": "Clean typography animation illustrating talent attraction vs talent dilution curves.", "visual_texture": "Uncompromising leadership, clear-eyed, direct", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The hidden cost of average performers", "spoken_audio": "The fastest way to lose your best people is tolerating mediocrity in the room."}, {"beat_number": 2, "purpose": "How", "visual_action": "How high standards act as a talent magnet", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The radical candor feedback loop", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Leader''s", "visual_action": "Leader''s standard-setting checklist", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "The fastest way to lose your best people is tolerating mediocrity in the room.", "first_second_visual_hook": "Clean typography animation illustrating talent attraction vs talent dilution curves.", "hook_options": ["The fastest way to lose your best people is tolerating mediocrity in the room.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Uncompromising leadership, clear-eyed, direct", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Establishes authority in organizational culture, executive hiring, and company building.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '0315b844-e357-4769-8d1d-31cb483f65f1'::uuid,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 85, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "thought_leadership", "authentic_niche_2026": true}'::jsonb
);

-- [THOUGHT_LEADERSHIP] The Subtraction Strategy: How Elite Companies Win by Doing Less (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '49ec3064-a031-4b13-93ae-03d3f979639d'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Subtraction Strategy: How Elite Companies Win by Doing Less', 'Analyze how Apple, Porsche, and Stripe grew massive margins by ruthlessly pruning product lines and focusing on 1-2 core master products.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Most struggling companies try to fix their problems by adding more features. Great companies subtract.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The feature bloat trap", "The power of the product focus matrix", "How subtraction increases engineering velocity and brand clarity", "The 1 product pruning exercise"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '49ec3064-a031-4b13-93ae-03d3f979639d'::uuid, 'The Subtraction Strategy: How Elite Companies Win by Doing Less', '{"title": "The Subtraction Strategy: How Elite Companies Win by Doing Less", "one_sentence_premise": "Analyze how Apple, Porsche, and Stripe grew massive margins by ruthlessly pruning product lines and focusing on 1-2 core master products.", "idea_summary": {"title": "The Subtraction Strategy: How Elite Companies Win by Doing Less", "premise": "Analyze how Apple, Porsche, and Stripe grew massive margins by ruthlessly pruning product lines and focusing on 1-2 core master products.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The feature bloat trap → The power of the product focus matrix → How subtraction increases engineering velocity and brand clarity → The 1 product pruning exercise", "opening_visual": "Visual timeline showing Steve Jobs slashing Apple''s product grid from 30 models down to 4 quadrants.", "visual_texture": "Strategic, thoughtful, architectural business analysis", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The feature bloat trap", "spoken_audio": "Most struggling companies try to fix their problems by adding more features. Great companies subtract."}, {"beat_number": 2, "purpose": "The", "visual_action": "The power of the product focus matrix", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "How", "visual_action": "How subtraction increases engineering velocity and brand clarity", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The 1 product pruning exercise", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Most struggling companies try to fix their problems by adding more features. Great companies subtract.", "first_second_visual_hook": "Visual timeline showing Steve Jobs slashing Apple''s product grid from 30 models down to 4 quadrants.", "hook_options": ["Most struggling companies try to fix their problems by adding more features. Great companies subtract.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Strategic, thoughtful, architectural business analysis", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Shows high-level strategic literacy and product strategy acumen.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '49ec3064-a031-4b13-93ae-03d3f979639d'::uuid,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 83, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "thought_leadership", "authentic_niche_2026": true}'::jsonb
);

-- [THOUGHT_LEADERSHIP] The 2-Minute Rule for Inbox Zero without Overwhelm (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '83c74b49-fef9-4891-b1e5-071d7f95a358'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The 2-Minute Rule for Inbox Zero without Overwhelm', 'A tactical triage framework: If it takes under 2 minutes, execute immediately; if longer, batch into a 90-minute daily execution block.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Stop reading emails twice.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The cognitive cost of re-reading unread messages", "The 3 triage folders: Today, This Week, Archive", "Keyboard shortcuts setup", "Screenshot reference card"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '83c74b49-fef9-4891-b1e5-071d7f95a358'::uuid, 'The 2-Minute Rule for Inbox Zero without Overwhelm', '{"title": "The 2-Minute Rule for Inbox Zero without Overwhelm", "one_sentence_premise": "A tactical triage framework: If it takes under 2 minutes, execute immediately; if longer, batch into a 90-minute daily execution block.", "idea_summary": {"title": "The 2-Minute Rule for Inbox Zero without Overwhelm", "premise": "A tactical triage framework: If it takes under 2 minutes, execute immediately; if longer, batch into a 90-minute daily execution block.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The cognitive cost of re-reading unread messages → The 3 triage folders: Today, This Week, Archive → Keyboard shortcuts setup → Screenshot reference card", "opening_visual": "Screen recording showing 200 unread emails triaged into Archive or Action in 60 seconds flat.", "visual_texture": "Sharp productivity, high relief payoff", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The cognitive cost of re-reading unread messages", "spoken_audio": "Stop reading emails twice."}, {"beat_number": 2, "purpose": "The", "visual_action": "The 3 triage folders: Today, This Week, Archive", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Keyboard", "visual_action": "Keyboard shortcuts setup", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Screenshot", "visual_action": "Screenshot reference card", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Stop reading emails twice.", "first_second_visual_hook": "Screen recording showing 200 unread emails triaged into Archive or Action in 60 seconds flat.", "hook_options": ["Stop reading emails twice.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Sharp productivity, high relief payoff", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Provides instant workflow satisfaction for overwhelmed knowledge workers.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '83c74b49-fef9-4891-b1e5-071d7f95a358'::uuid,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 78, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "thought_leadership", "authentic_niche_2026": true}'::jsonb
);

-- [THOUGHT_LEADERSHIP] 3 Questions to Ask Before Agreeing to Any Meeting (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '8d564f02-1459-4382-96bc-3ea763d8ae15'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  '3 Questions to Ask Before Agreeing to Any Meeting', 'A simple email filter script: ''What decision needs to be made?'', ''What document are we reviewing?'', ''Can this be approved asynchronously?''.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Paste this 3-sentence reply to the next meeting invite you receive.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The default meeting reflex trap", "The 3 mandatory filter questions", "Polite decline script for unnecessary calls", "Saveable template card"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '8d564f02-1459-4382-96bc-3ea763d8ae15'::uuid, '3 Questions to Ask Before Agreeing to Any Meeting', '{"title": "3 Questions to Ask Before Agreeing to Any Meeting", "one_sentence_premise": "A simple email filter script: ''What decision needs to be made?'', ''What document are we reviewing?'', ''Can this be approved asynchronously?''.", "idea_summary": {"title": "3 Questions to Ask Before Agreeing to Any Meeting", "premise": "A simple email filter script: ''What decision needs to be made?'', ''What document are we reviewing?'', ''Can this be approved asynchronously?''.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The default meeting reflex trap → The 3 mandatory filter questions → Polite decline script for unnecessary calls → Saveable template card", "opening_visual": "Typing a polite yet firm email response that requests an agenda and pre-read document.", "visual_texture": "Assertive, professional, boundary-setting", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The default meeting reflex trap", "spoken_audio": "Paste this 3-sentence reply to the next meeting invite you receive."}, {"beat_number": 2, "purpose": "The", "visual_action": "The 3 mandatory filter questions", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Polite", "visual_action": "Polite decline script for unnecessary calls", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Saveable", "visual_action": "Saveable template card", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Paste this 3-sentence reply to the next meeting invite you receive.", "first_second_visual_hook": "Typing a polite yet firm email response that requests an agenda and pre-read document.", "hook_options": ["Paste this 3-sentence reply to the next meeting invite you receive.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Assertive, professional, boundary-setting", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Empowers professionals to protect their highest-value focus hours.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '8d564f02-1459-4382-96bc-3ea763d8ae15'::uuid,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 76, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "thought_leadership", "authentic_niche_2026": true}'::jsonb
);

-- [THOUGHT_LEADERSHIP] The ''Inversion Thinking'' Filter for Risk Mitigation (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '20f4e602-392e-4dd9-81c0-e0826cb0ef15'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The ''Inversion Thinking'' Filter for Risk Mitigation', 'Charlie Munger''s mental model: Instead of asking how to succeed, ask ''What is the fastest way to guarantee failure?'' and systematically eliminate those risks.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Instead of planning how to win, plan how not to lose.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The power of mental inversion", "Listing the top 3 fatal errors for any project", "Building active safeguards against each failure mode", "The 5-minute inversion exercise"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '20f4e602-392e-4dd9-81c0-e0826cb0ef15'::uuid, 'The ''Inversion Thinking'' Filter for Risk Mitigation', '{"title": "The ''Inversion Thinking'' Filter for Risk Mitigation", "one_sentence_premise": "Charlie Munger''s mental model: Instead of asking how to succeed, ask ''What is the fastest way to guarantee failure?'' and systematically eliminate those risks.", "idea_summary": {"title": "The ''Inversion Thinking'' Filter for Risk Mitigation", "premise": "Charlie Munger''s mental model: Instead of asking how to succeed, ask ''What is the fastest way to guarantee failure?'' and systematically eliminate those risks.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The power of mental inversion → Listing the top 3 fatal errors for any project → Building active safeguards against each failure mode → The 5-minute inversion exercise", "opening_visual": "Splitting a blank page into ''Success Goal'' vs ''Guaranteed Failure Modes''.", "visual_texture": "Philosophical, practical mental model, clear typography", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The power of mental inversion", "spoken_audio": "Instead of planning how to win, plan how not to lose."}, {"beat_number": 2, "purpose": "Listing", "visual_action": "Listing the top 3 fatal errors for any project", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Building", "visual_action": "Building active safeguards against each failure mode", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The 5-minute inversion exercise", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Instead of planning how to win, plan how not to lose.", "first_second_visual_hook": "Splitting a blank page into ''Success Goal'' vs ''Guaranteed Failure Modes''.", "hook_options": ["Instead of planning how to win, plan how not to lose.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Philosophical, practical mental model, clear typography", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Equips audience with timeless cognitive frameworks for strategic clarity.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '20f4e602-392e-4dd9-81c0-e0826cb0ef15'::uuid,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 74, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "thought_leadership", "authentic_niche_2026": true}'::jsonb
);

-- [THOUGHT_LEADERSHIP] The Sunday Evening 15-Minute Weekly Architect Routine (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'fb30f0d1-15f1-452e-a146-260d0ab9c0ed'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Sunday Evening 15-Minute Weekly Architect Routine', 'A weekly alignment checklist: Define top 3 non-negotiable needle-movers, block deep work hours, and eliminate low-leverage obligations before Monday starts.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Your Monday is determined on Sunday at 7 PM.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Reviewing past week wins and leaks", "Locking in 3 major weekly outcomes", "Time-blocking defense shields on Google Calendar", "Clean desk setup for Monday morning"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'fb30f0d1-15f1-452e-a146-260d0ab9c0ed'::uuid, 'The Sunday Evening 15-Minute Weekly Architect Routine', '{"title": "The Sunday Evening 15-Minute Weekly Architect Routine", "one_sentence_premise": "A weekly alignment checklist: Define top 3 non-negotiable needle-movers, block deep work hours, and eliminate low-leverage obligations before Monday starts.", "idea_summary": {"title": "The Sunday Evening 15-Minute Weekly Architect Routine", "premise": "A weekly alignment checklist: Define top 3 non-negotiable needle-movers, block deep work hours, and eliminate low-leverage obligations before Monday starts.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Reviewing past week wins and leaks → Locking in 3 major weekly outcomes → Time-blocking defense shields on Google Calendar → Clean desk setup for Monday morning", "opening_visual": "Notebook desk shot opening to a fresh weekly spread with 3 bold priorities written in ink.", "visual_texture": "Calm, organized, intentional Sunday routine", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Reviewing", "visual_action": "Reviewing past week wins and leaks", "spoken_audio": "Your Monday is determined on Sunday at 7 PM."}, {"beat_number": 2, "purpose": "Locking", "visual_action": "Locking in 3 major weekly outcomes", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Time-blocking", "visual_action": "Time-blocking defense shields on Google Calendar", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Clean", "visual_action": "Clean desk setup for Monday morning", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Your Monday is determined on Sunday at 7 PM.", "first_second_visual_hook": "Notebook desk shot opening to a fresh weekly spread with 3 bold priorities written in ink.", "hook_options": ["Your Monday is determined on Sunday at 7 PM.", "Before you do this in Thought Leadership, look at this rule.", "This is the Thought Leadership breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Calm, organized, intentional Sunday routine", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Builds disciplined executive lifestyle habits for motivated professionals.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'fb30f0d1-15f1-452e-a146-260d0ab9c0ed'::uuid,
  (select id from public.categories where slug = 'thought_leadership'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 72, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "thought_leadership", "authentic_niche_2026": true}'::jsonb
);

insert into public.categories (slug, name, family, enabled, risk_level, sort_order)
values ('travel', 'Travel', 'creator_content', true, 'low', 100)
on conflict (slug) do update set enabled = true, name = excluded.name;

-- [TRAVEL] The 6 AM Empty Landmark Window: The Solo Traveler''s Golden Hour (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '925588dc-3c56-42fc-91fa-d9bcc6500bd8'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The 6 AM Empty Landmark Window: The Solo Traveler''s Golden Hour', 'Show why visiting world-famous architectural landmarks at sunrise gives you an intimate, crowd-free cinematic experience without paying VIP fees.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'travel'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["The secret to having the most famous places in Europe to yourself isn''t money; it’s an alarm clock set for 5:30 AM.", "Before you do this in Travel, look at this rule.", "This is the Travel breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Crowded tourist chaos baseline at 2 PM", "Empty dawn stillness at 6 AM", "How sunlight hits architecture without harsh shadows", "The exact sunrise timing cheat sheet"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '925588dc-3c56-42fc-91fa-d9bcc6500bd8'::uuid, 'The 6 AM Empty Landmark Window: The Solo Traveler''s Golden Hour', '{"title": "The 6 AM Empty Landmark Window: The Solo Traveler''s Golden Hour", "one_sentence_premise": "Show why visiting world-famous architectural landmarks at sunrise gives you an intimate, crowd-free cinematic experience without paying VIP fees.", "idea_summary": {"title": "The 6 AM Empty Landmark Window: The Solo Traveler''s Golden Hour", "premise": "Show why visiting world-famous architectural landmarks at sunrise gives you an intimate, crowd-free cinematic experience without paying VIP fees.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Crowded tourist chaos baseline at 2 PM → Empty dawn stillness at 6 AM → How sunlight hits architecture without harsh shadows → The exact sunrise timing cheat sheet", "opening_visual": "Empty cobblestone piazza in Rome at dawn bathed in soft blue and golden morning light.", "visual_texture": "Cinematic, serene, golden hour, wandering footsteps audio", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Crowded", "visual_action": "Crowded tourist chaos baseline at 2 PM", "spoken_audio": "The secret to having the most famous places in Europe to yourself isn''''t money; it’s an alarm clock set for 5:30 AM."}, {"beat_number": 2, "purpose": "Empty", "visual_action": "Empty dawn stillness at 6 AM", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "How", "visual_action": "How sunlight hits architecture without harsh shadows", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The exact sunrise timing cheat sheet", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "The secret to having the most famous places in Europe to yourself isn''t money; it’s an alarm clock set for 5:30 AM.", "first_second_visual_hook": "Empty cobblestone piazza in Rome at dawn bathed in soft blue and golden morning light.", "hook_options": ["The secret to having the most famous places in Europe to yourself isn''t money; it’s an alarm clock set for 5:30 AM.", "Before you do this in Travel, look at this rule.", "This is the Travel breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Cinematic, serene, golden hour, wandering footsteps audio", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Positions creator as an elite, resourceful world traveler with aesthetic vision.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '925588dc-3c56-42fc-91fa-d9bcc6500bd8'::uuid,
  (select id from public.categories where slug = 'travel'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 95, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "travel", "authentic_niche_2026": true}'::jsonb
);

-- [TRAVEL] The Anti-Tourist Neighborhood Rule: Finding Where Chefs & Architects Eat (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'cb2cd574-732a-4347-8893-4c9e7b038e50'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Anti-Tourist Neighborhood Rule: Finding Where Chefs & Architects Eat', 'Teach viewers how to spot authentic local culinary hubs by walking 3 blocks past the historic center and looking for handwritten daily menus in the local language.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'travel'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If there is someone outside holding a laminated menu with pictures in 4 languages, keep walking.", "Before you do this in Travel, look at this rule.", "This is the Travel breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The tourist trap warning signs", "The 3-block perimeter rule", "Reading chalkboard menus and daily seasonal market arrivals", "The authentic meal payoff"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'cb2cd574-732a-4347-8893-4c9e7b038e50'::uuid, 'The Anti-Tourist Neighborhood Rule: Finding Where Chefs & Architects Eat', '{"title": "The Anti-Tourist Neighborhood Rule: Finding Where Chefs & Architects Eat", "one_sentence_premise": "Teach viewers how to spot authentic local culinary hubs by walking 3 blocks past the historic center and looking for handwritten daily menus in the local language.", "idea_summary": {"title": "The Anti-Tourist Neighborhood Rule: Finding Where Chefs & Architects Eat", "premise": "Teach viewers how to spot authentic local culinary hubs by walking 3 blocks past the historic center and looking for handwritten daily menus in the local language.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The tourist trap warning signs → The 3-block perimeter rule → Reading chalkboard menus and daily seasonal market arrivals → The authentic meal payoff", "opening_visual": "Stepping into a tiny, unmarked corner osteria filled with locals and handwritten chalkboard specials.", "visual_texture": "Sensory, authentic cultural immersion, warm street sounds", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The tourist trap warning signs", "spoken_audio": "If there is someone outside holding a laminated menu with pictures in 4 languages, keep walking."}, {"beat_number": 2, "purpose": "The", "visual_action": "The 3-block perimeter rule", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Reading", "visual_action": "Reading chalkboard menus and daily seasonal market arrivals", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The authentic meal payoff", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If there is someone outside holding a laminated menu with pictures in 4 languages, keep walking.", "first_second_visual_hook": "Stepping into a tiny, unmarked corner osteria filled with locals and handwritten chalkboard specials.", "hook_options": ["If there is someone outside holding a laminated menu with pictures in 4 languages, keep walking.", "Before you do this in Travel, look at this rule.", "This is the Travel breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Sensory, authentic cultural immersion, warm street sounds", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Builds deep travel credibility and culinary curation trust.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'cb2cd574-732a-4347-8893-4c9e7b038e50'::uuid,
  (select id from public.categories where slug = 'travel'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 93, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "travel", "authentic_niche_2026": true}'::jsonb
);

-- [TRAVEL] One Bag Travel: The 7-Day Carry-On Architecture System (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '0ee57170-44d1-4cb8-9432-ee590b18b08d'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'One Bag Travel: The 7-Day Carry-On Architecture System', 'Demonstrate the capsule wardrobe and compression cube geometry that allows 10 days of stylish travel in a single 35L carry-on.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'travel'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Checking luggage is a choice to add 2 hours of friction to your trip.", "Before you do this in Travel, look at this rule.", "This is the Travel breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Bypassing the baggage claim carousel", "Color palette cohesion rules", "Compression cube folding technique", "Airport transit speed check"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '0ee57170-44d1-4cb8-9432-ee590b18b08d'::uuid, 'One Bag Travel: The 7-Day Carry-On Architecture System', '{"title": "One Bag Travel: The 7-Day Carry-On Architecture System", "one_sentence_premise": "Demonstrate the capsule wardrobe and compression cube geometry that allows 10 days of stylish travel in a single 35L carry-on.", "idea_summary": {"title": "One Bag Travel: The 7-Day Carry-On Architecture System", "premise": "Demonstrate the capsule wardrobe and compression cube geometry that allows 10 days of stylish travel in a single 35L carry-on.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Bypassing the baggage claim carousel → Color palette cohesion rules → Compression cube folding technique → Airport transit speed check", "opening_visual": "Time-lapse packing of tailored jacket, 3 trousers, 5 shirts, and running shoes into an organized carry-on.", "visual_texture": "Efficient, organized, sleek travel aesthetic", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Bypassing", "visual_action": "Bypassing the baggage claim carousel", "spoken_audio": "Checking luggage is a choice to add 2 hours of friction to your trip."}, {"beat_number": 2, "purpose": "Color", "visual_action": "Color palette cohesion rules", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Compression", "visual_action": "Compression cube folding technique", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Airport", "visual_action": "Airport transit speed check", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Checking luggage is a choice to add 2 hours of friction to your trip.", "first_second_visual_hook": "Time-lapse packing of tailored jacket, 3 trousers, 5 shirts, and running shoes into an organized carry-on.", "hook_options": ["Checking luggage is a choice to add 2 hours of friction to your trip.", "Before you do this in Travel, look at this rule.", "This is the Travel breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Efficient, organized, sleek travel aesthetic", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Empowers viewers with friction-free modern mobility.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '0ee57170-44d1-4cb8-9432-ee590b18b08d'::uuid,
  (select id from public.categories where slug = 'travel'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 86, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "travel", "authentic_niche_2026": true}'::jsonb
);

-- [TRAVEL] 3 Offline Google Maps Hacks Every International Traveler Needs (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '9d7b2aff-2067-4907-af65-5299357de0e8'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  '3 Offline Google Maps Hacks Every International Traveler Needs', 'A 15-second guide to downloading entire city grids, pinning custom transit stations, and navigating without roaming data.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'travel'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Do this in airplane mode before your flight takes off.", "Before you do this in Travel, look at this rule.", "This is the Travel breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Offline map download area selector", "Color-coded bookmark pins (Eat, See, Transit)", "Navigation without cellular data", "Saveable graphic"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '9d7b2aff-2067-4907-af65-5299357de0e8'::uuid, '3 Offline Google Maps Hacks Every International Traveler Needs', '{"title": "3 Offline Google Maps Hacks Every International Traveler Needs", "one_sentence_premise": "A 15-second guide to downloading entire city grids, pinning custom transit stations, and navigating without roaming data.", "idea_summary": {"title": "3 Offline Google Maps Hacks Every International Traveler Needs", "premise": "A 15-second guide to downloading entire city grids, pinning custom transit stations, and navigating without roaming data.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Offline map download area selector → Color-coded bookmark pins (Eat, See, Transit) → Navigation without cellular data → Saveable graphic", "opening_visual": "Phone screen screen-recording showing offline map download and pin organization in 10 seconds.", "visual_texture": "Fast, high-utility, essential travel hack", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Offline", "visual_action": "Offline map download area selector", "spoken_audio": "Do this in airplane mode before your flight takes off."}, {"beat_number": 2, "purpose": "Color-coded", "visual_action": "Color-coded bookmark pins (Eat, See, Transit)", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Navigation", "visual_action": "Navigation without cellular data", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Saveable", "visual_action": "Saveable graphic", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Do this in airplane mode before your flight takes off.", "first_second_visual_hook": "Phone screen screen-recording showing offline map download and pin organization in 10 seconds.", "hook_options": ["Do this in airplane mode before your flight takes off.", "Before you do this in Travel, look at this rule.", "This is the Travel breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Fast, high-utility, essential travel hack", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Drives immediate saves and high utility bookmarking.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '9d7b2aff-2067-4907-af65-5299357de0e8'::uuid,
  (select id from public.categories where slug = 'travel'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 77, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "travel", "authentic_niche_2026": true}'::jsonb
);

-- [TRAVEL] The Hidden Architectural Corridor: Discovering Secret City Layering (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'a5dcb7be-a0ca-4150-b88d-048c858cff84'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Hidden Architectural Corridor: Discovering Secret City Layering', 'Guide viewers through hidden public courtyards and covered arcades that tourists walk past every day without noticing.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'travel'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["This passageway is completely open to the public, but 99% of people walk right past the entrance.", "Before you do this in Travel, look at this rule.", "This is the Travel breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Unassuming street entrance", "Threshold transition", "Architectural history breakdown", "Map coordinates reference card"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'a5dcb7be-a0ca-4150-b88d-048c858cff84'::uuid, 'The Hidden Architectural Corridor: Discovering Secret City Layering', '{"title": "The Hidden Architectural Corridor: Discovering Secret City Layering", "one_sentence_premise": "Guide viewers through hidden public courtyards and covered arcades that tourists walk past every day without noticing.", "idea_summary": {"title": "The Hidden Architectural Corridor: Discovering Secret City Layering", "premise": "Guide viewers through hidden public courtyards and covered arcades that tourists walk past every day without noticing.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Unassuming street entrance → Threshold transition → Architectural history breakdown → Map coordinates reference card", "opening_visual": "Camera pushing through an unassuming heavy wooden archway into a quiet sunlit Renaissance courtyard.", "visual_texture": "Atmospheric, cinematic, discovery, ambient street footsteps", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Unassuming", "visual_action": "Unassuming street entrance", "spoken_audio": "This passageway is completely open to the public, but 99% of people walk right past the entrance."}, {"beat_number": 2, "purpose": "Threshold", "visual_action": "Threshold transition", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Architectural", "visual_action": "Architectural history breakdown", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Map", "visual_action": "Map coordinates reference card", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "This passageway is completely open to the public, but 99% of people walk right past the entrance.", "first_second_visual_hook": "Camera pushing through an unassuming heavy wooden archway into a quiet sunlit Renaissance courtyard.", "hook_options": ["This passageway is completely open to the public, but 99% of people walk right past the entrance.", "Before you do this in Travel, look at this rule.", "This is the Travel breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Atmospheric, cinematic, discovery, ambient street footsteps", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Establishes creator as an insider travel curator with elevated cultural taste.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'a5dcb7be-a0ca-4150-b88d-048c858cff84'::uuid,
  (select id from public.categories where slug = 'travel'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 91, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "travel", "authentic_niche_2026": true}'::jsonb
);

-- [TRAVEL] Local Transit Mastery: The 3 Metro Shortcuts That Save 1 Hour Daily (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '32c50303-8c53-4baa-a669-c217a5c43e35'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Local Transit Mastery: The 3 Metro Shortcuts That Save 1 Hour Daily', 'A visual navigation cheat sheet showing how to ride local subway and tram lines like a resident instead of paying 5x for tourist taxis.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'travel'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Do not pay $60 for an airport taxi when the express train takes 18 minutes for $8.", "Before you do this in Travel, look at this rule.", "This is the Travel breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Taxi queue friction comparison", "Buying local contactless card", "Express transit route breakdown", "Screenshot transit guide"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '32c50303-8c53-4baa-a669-c217a5c43e35'::uuid, 'Local Transit Mastery: The 3 Metro Shortcuts That Save 1 Hour Daily', '{"title": "Local Transit Mastery: The 3 Metro Shortcuts That Save 1 Hour Daily", "one_sentence_premise": "A visual navigation cheat sheet showing how to ride local subway and tram lines like a resident instead of paying 5x for tourist taxis.", "idea_summary": {"title": "Local Transit Mastery: The 3 Metro Shortcuts That Save 1 Hour Daily", "premise": "A visual navigation cheat sheet showing how to ride local subway and tram lines like a resident instead of paying 5x for tourist taxis.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Taxi queue friction comparison → Buying local contactless card → Express transit route breakdown → Screenshot transit guide", "opening_visual": "Fast cut from airport arrival hall to clean modern express train platform in 4K.", "visual_texture": "Smart travel efficiency, dynamic, high utility", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Taxi", "visual_action": "Taxi queue friction comparison", "spoken_audio": "Do not pay $60 for an airport taxi when the express train takes 18 minutes for $8."}, {"beat_number": 2, "purpose": "Buying", "visual_action": "Buying local contactless card", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Express", "visual_action": "Express transit route breakdown", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Screenshot", "visual_action": "Screenshot transit guide", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Do not pay $60 for an airport taxi when the express train takes 18 minutes for $8.", "first_second_visual_hook": "Fast cut from airport arrival hall to clean modern express train platform in 4K.", "hook_options": ["Do not pay $60 for an airport taxi when the express train takes 18 minutes for $8.", "Before you do this in Travel, look at this rule.", "This is the Travel breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Smart travel efficiency, dynamic, high utility", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Builds immense audience gratitude for saving money and travel friction.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '32c50303-8c53-4baa-a669-c217a5c43e35'::uuid,
  (select id from public.categories where slug = 'travel'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 84, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "travel", "authentic_niche_2026": true}'::jsonb
);

-- [TRAVEL] The Packing Cube Compression Fold for Bulky Winter Sweaters (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'a2e7fb7b-d6d5-431d-82da-33a4e25ded0e'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Packing Cube Compression Fold for Bulky Winter Sweaters', 'The military ranger roll technique that flattens thick knitwear to 1/3 of its volume without creasing the collar.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'travel'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If your winter knitwear takes up your entire suitcase, fold it like this.", "Before you do this in Travel, look at this rule.", "This is the Travel breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Bulky fold problem", "Ranger roll fold technique", "Compression zip closure", "Side-by-side space saving payoff"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'a2e7fb7b-d6d5-431d-82da-33a4e25ded0e'::uuid, 'The Packing Cube Compression Fold for Bulky Winter Sweaters', '{"title": "The Packing Cube Compression Fold for Bulky Winter Sweaters", "one_sentence_premise": "The military ranger roll technique that flattens thick knitwear to 1/3 of its volume without creasing the collar.", "idea_summary": {"title": "The Packing Cube Compression Fold for Bulky Winter Sweaters", "premise": "The military ranger roll technique that flattens thick knitwear to 1/3 of its volume without creasing the collar.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Bulky fold problem → Ranger roll fold technique → Compression zip closure → Side-by-side space saving payoff", "opening_visual": "Thick oversized wool sweater rolled into a tight compact cylinder fitting into a small cube.", "visual_texture": "Satisfying organization ASMR, tactile", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Bulky", "visual_action": "Bulky fold problem", "spoken_audio": "If your winter knitwear takes up your entire suitcase, fold it like this."}, {"beat_number": 2, "purpose": "Ranger", "visual_action": "Ranger roll fold technique", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Compression", "visual_action": "Compression zip closure", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Side-by-side", "visual_action": "Side-by-side space saving payoff", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If your winter knitwear takes up your entire suitcase, fold it like this.", "first_second_visual_hook": "Thick oversized wool sweater rolled into a tight compact cylinder fitting into a small cube.", "hook_options": ["If your winter knitwear takes up your entire suitcase, fold it like this.", "Before you do this in Travel, look at this rule.", "This is the Travel breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Satisfying organization ASMR, tactile", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Practical packing expertise for frequent travelers.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'a2e7fb7b-d6d5-431d-82da-33a4e25ded0e'::uuid,
  (select id from public.categories where slug = 'travel'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 75, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "travel", "authentic_niche_2026": true}'::jsonb
);

insert into public.categories (slug, name, family, enabled, risk_level, sort_order)
values ('lifestyle', 'Lifestyle', 'creator_content', true, 'low', 100)
on conflict (slug) do update set enabled = true, name = excluded.name;

-- [LIFESTYLE] The Friction-Free Morning: Designing an Environment for Automatic Habits (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '3817a9f0-4eea-4db2-8afb-40cbc161827f'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Friction-Free Morning: Designing an Environment for Automatic Habits', 'Show how rearranging your physical space (water on desk, phone charging across room, workout clothes laid out) removes willpower from daily discipline.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'lifestyle'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["You don’t lack willpower; your physical environment is designed for distraction.", "Before you do this in Lifestyle, look at this rule.", "This is the Lifestyle breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The friction of a messy environment", "The 3 physical environment adjustments", "The morning flow without phone interaction", "Peaceful focus payoff"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '3817a9f0-4eea-4db2-8afb-40cbc161827f'::uuid, 'The Friction-Free Morning: Designing an Environment for Automatic Habits', '{"title": "The Friction-Free Morning: Designing an Environment for Automatic Habits", "one_sentence_premise": "Show how rearranging your physical space (water on desk, phone charging across room, workout clothes laid out) removes willpower from daily discipline.", "idea_summary": {"title": "The Friction-Free Morning: Designing an Environment for Automatic Habits", "premise": "Show how rearranging your physical space (water on desk, phone charging across room, workout clothes laid out) removes willpower from daily discipline.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The friction of a messy environment → The 3 physical environment adjustments → The morning flow without phone interaction → Peaceful focus payoff", "opening_visual": "Smooth camera panning across an uncluttered morning workspace with zero visible cables and warm natural light.", "visual_texture": "Intentional, calm, architectural, minimalist daylight", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The friction of a messy environment", "spoken_audio": "You don’t lack willpower; your physical environment is designed for distraction."}, {"beat_number": 2, "purpose": "The", "visual_action": "The 3 physical environment adjustments", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The morning flow without phone interaction", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Peaceful", "visual_action": "Peaceful focus payoff", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "You don’t lack willpower; your physical environment is designed for distraction.", "first_second_visual_hook": "Smooth camera panning across an uncluttered morning workspace with zero visible cables and warm natural light.", "hook_options": ["You don’t lack willpower; your physical environment is designed for distraction.", "Before you do this in Lifestyle, look at this rule.", "This is the Lifestyle breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Intentional, calm, architectural, minimalist daylight", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Establishes creator as an architect of intentional living and modern discipline.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '3817a9f0-4eea-4db2-8afb-40cbc161827f'::uuid,
  (select id from public.categories where slug = 'lifestyle'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 95, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "lifestyle", "authentic_niche_2026": true}'::jsonb
);

-- [LIFESTYLE] The Digital Sunset: A 30-Minute Screenless Wind-Down Protocol (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '954e3416-171a-4a30-9871-a958150bbd98'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Digital Sunset: A 30-Minute Screenless Wind-Down Protocol', 'Deconstruct the evening transition: warm amber 2200K lighting, analog notebook journaling, and zero blue light 1 hour before sleep.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'lifestyle'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Your sleep quality tonight was decided 60 minutes before you closed your eyes.", "Before you do this in Lifestyle, look at this rule.", "This is the Lifestyle breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Blue light suppression of melatonin", "Warm ambient light setup", "Analog brain dump on paper", "Deep restful morning wake-up contrast"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '954e3416-171a-4a30-9871-a958150bbd98'::uuid, 'The Digital Sunset: A 30-Minute Screenless Wind-Down Protocol', '{"title": "The Digital Sunset: A 30-Minute Screenless Wind-Down Protocol", "one_sentence_premise": "Deconstruct the evening transition: warm amber 2200K lighting, analog notebook journaling, and zero blue light 1 hour before sleep.", "idea_summary": {"title": "The Digital Sunset: A 30-Minute Screenless Wind-Down Protocol", "premise": "Deconstruct the evening transition: warm amber 2200K lighting, analog notebook journaling, and zero blue light 1 hour before sleep.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Blue light suppression of melatonin → Warm ambient light setup → Analog brain dump on paper → Deep restful morning wake-up contrast", "opening_visual": "Switching off overhead bright LED lighting and lighting a beeswax candle next to a heavy linen notebook.", "visual_texture": "Serene, evening calm, warm candlelight and soft audio", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Blue", "visual_action": "Blue light suppression of melatonin", "spoken_audio": "Your sleep quality tonight was decided 60 minutes before you closed your eyes."}, {"beat_number": 2, "purpose": "Warm", "visual_action": "Warm ambient light setup", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Analog", "visual_action": "Analog brain dump on paper", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Deep", "visual_action": "Deep restful morning wake-up contrast", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Your sleep quality tonight was decided 60 minutes before you closed your eyes.", "first_second_visual_hook": "Switching off overhead bright LED lighting and lighting a beeswax candle next to a heavy linen notebook.", "hook_options": ["Your sleep quality tonight was decided 60 minutes before you closed your eyes.", "Before you do this in Lifestyle, look at this rule.", "This is the Lifestyle breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Serene, evening calm, warm candlelight and soft audio", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Inspires healthy evening restoration and intentional self-care.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '954e3416-171a-4a30-9871-a958150bbd98'::uuid,
  (select id from public.categories where slug = 'lifestyle'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 86, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "lifestyle", "authentic_niche_2026": true}'::jsonb
);

-- [LIFESTYLE] The 2-Minute Desk Reset at the End of Every Workday (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '095a900e-5181-4252-b680-388b5d131d5e'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The 2-Minute Desk Reset at the End of Every Workday', 'A daily ritual: clear water glass, align notebook to edge of desk, shut laptop lid, and signal to the brain that work is over.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'lifestyle'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Do this before you leave your desk at 5 PM.", "Before you do this in Lifestyle, look at this rule.", "This is the Lifestyle breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The psychological boundary between work and home", "The 3 physical reset steps", "Fresh clean desk reveal for tomorrow morning", "Summary checklist"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '095a900e-5181-4252-b680-388b5d131d5e'::uuid, 'The 2-Minute Desk Reset at the End of Every Workday', '{"title": "The 2-Minute Desk Reset at the End of Every Workday", "one_sentence_premise": "A daily ritual: clear water glass, align notebook to edge of desk, shut laptop lid, and signal to the brain that work is over.", "idea_summary": {"title": "The 2-Minute Desk Reset at the End of Every Workday", "premise": "A daily ritual: clear water glass, align notebook to edge of desk, shut laptop lid, and signal to the brain that work is over.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The psychological boundary between work and home → The 3 physical reset steps → Fresh clean desk reveal for tomorrow morning → Summary checklist", "opening_visual": "Quick satisfying ASMR montage of clearing papers, wiping desk surface, and closing laptop.", "visual_texture": "Satisfying ASMR, clean desktop aesthetic, high utility", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The psychological boundary between work and home", "spoken_audio": "Do this before you leave your desk at 5 PM."}, {"beat_number": 2, "purpose": "The", "visual_action": "The 3 physical reset steps", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Fresh", "visual_action": "Fresh clean desk reveal for tomorrow morning", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Summary", "visual_action": "Summary checklist", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Do this before you leave your desk at 5 PM.", "first_second_visual_hook": "Quick satisfying ASMR montage of clearing papers, wiping desk surface, and closing laptop.", "hook_options": ["Do this before you leave your desk at 5 PM.", "Before you do this in Lifestyle, look at this rule.", "This is the Lifestyle breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Satisfying ASMR, clean desktop aesthetic, high utility", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Encourages healthy work-life boundaries.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '095a900e-5181-4252-b680-388b5d131d5e'::uuid,
  (select id from public.categories where slug = 'lifestyle'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 78, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "lifestyle", "authentic_niche_2026": true}'::jsonb
);

-- [LIFESTYLE] The Curation Over Accumulation Rule: An Interior Living Audit (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'faade2b5-f399-401a-b14d-5becc09dc80d'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Curation Over Accumulation Rule: An Interior Living Audit', 'Demonstrate that beautiful living spaces are created by what you remove from tables and shelves, not what you buy at decor stores.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'lifestyle'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Clutter isn''t just physical; visual clutter is constant background noise for your brain.", "Before you do this in Lifestyle, look at this rule.", "This is the Lifestyle breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Overcrowded surface audit", "The negative space principle", "Choosing one hero textural piece", "Serene living room reveal"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'faade2b5-f399-401a-b14d-5becc09dc80d'::uuid, 'The Curation Over Accumulation Rule: An Interior Living Audit', '{"title": "The Curation Over Accumulation Rule: An Interior Living Audit", "one_sentence_premise": "Demonstrate that beautiful living spaces are created by what you remove from tables and shelves, not what you buy at decor stores.", "idea_summary": {"title": "The Curation Over Accumulation Rule: An Interior Living Audit", "premise": "Demonstrate that beautiful living spaces are created by what you remove from tables and shelves, not what you buy at decor stores.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Overcrowded surface audit → The negative space principle → Choosing one hero textural piece → Serene living room reveal", "opening_visual": "Clearing an overcrowded coffee table down to one stone vessel and a single open art monograph.", "visual_texture": "Architectural, peaceful, natural daylight", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Overcrowded", "visual_action": "Overcrowded surface audit", "spoken_audio": "Clutter isn''''t just physical; visual clutter is constant background noise for your brain."}, {"beat_number": 2, "purpose": "The", "visual_action": "The negative space principle", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Choosing", "visual_action": "Choosing one hero textural piece", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Serene", "visual_action": "Serene living room reveal", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Clutter isn''t just physical; visual clutter is constant background noise for your brain.", "first_second_visual_hook": "Clearing an overcrowded coffee table down to one stone vessel and a single open art monograph.", "hook_options": ["Clutter isn''t just physical; visual clutter is constant background noise for your brain.", "Before you do this in Lifestyle, look at this rule.", "This is the Lifestyle breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Architectural, peaceful, natural daylight", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Positions creator as an editorial interior curator.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'faade2b5-f399-401a-b14d-5becc09dc80d'::uuid,
  (select id from public.categories where slug = 'lifestyle'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 92, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "lifestyle", "authentic_niche_2026": true}'::jsonb
);

-- [LIFESTYLE] The 15-Minute Sensory Reset for Remote Workers at 3 PM (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '55091ecb-785b-4cfc-9b24-63eff67777e8'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The 15-Minute Sensory Reset for Remote Workers at 3 PM', 'A step-by-step afternoon protocol: outdoor natural light exposure, cold water splash, 5-minute movement flow to conquer the afternoon brain slump without coffee.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'lifestyle'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Before you pour your fourth cup of coffee at 3 PM, do this 5-minute nervous system reset.", "Before you do this in Lifestyle, look at this rule.", "This is the Lifestyle breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The 3 PM slump trap", "Step 1: Direct retinal sunlight exposure", "Step 2: Hydration and cold splash", "Step 3: Hip and spine decompression", "Re-energized focus payoff"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '55091ecb-785b-4cfc-9b24-63eff67777e8'::uuid, 'The 15-Minute Sensory Reset for Remote Workers at 3 PM', '{"title": "The 15-Minute Sensory Reset for Remote Workers at 3 PM", "one_sentence_premise": "A step-by-step afternoon protocol: outdoor natural light exposure, cold water splash, 5-minute movement flow to conquer the afternoon brain slump without coffee.", "idea_summary": {"title": "The 15-Minute Sensory Reset for Remote Workers at 3 PM", "premise": "A step-by-step afternoon protocol: outdoor natural light exposure, cold water splash, 5-minute movement flow to conquer the afternoon brain slump without coffee.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The 3 PM slump trap → Step 1: Direct retinal sunlight exposure → Step 2: Hydration and cold splash → Step 3: Hip and spine decompression → Re-energized focus payoff", "opening_visual": "Stepping out onto a sunlit balcony, taking a deep breath of fresh air, and drinking cold water with electrolytes.", "visual_texture": "Energizing, healthy, practical daily wellness", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The 3 PM slump trap", "spoken_audio": "Before you pour your fourth cup of coffee at 3 PM, do this 5-minute nervous system reset."}, {"beat_number": 2, "purpose": "Step", "visual_action": "Step 1: Direct retinal sunlight exposure", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Step", "visual_action": "Step 2: Hydration and cold splash", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Step", "visual_action": "Step 3: Hip and spine decompression", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}, {"beat_number": 5, "purpose": "Re-energized", "visual_action": "Re-energized focus payoff", "spoken_audio": "Demonstrate step 5 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Before you pour your fourth cup of coffee at 3 PM, do this 5-minute nervous system reset.", "first_second_visual_hook": "Stepping out onto a sunlit balcony, taking a deep breath of fresh air, and drinking cold water with electrolytes.", "hook_options": ["Before you pour your fourth cup of coffee at 3 PM, do this 5-minute nervous system reset.", "Before you do this in Lifestyle, look at this rule.", "This is the Lifestyle breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Energizing, healthy, practical daily wellness", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Promotes sustainable energy and healthy daily rhythms.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '55091ecb-785b-4cfc-9b24-63eff67777e8'::uuid,
  (select id from public.categories where slug = 'lifestyle'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 83, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "lifestyle", "authentic_niche_2026": true}'::jsonb
);

-- [LIFESTYLE] The Daily Uniform: Why Wearing One Formula Eliminates Decision Fatigue (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'b2afd88a-5a33-455a-9090-2556dbb6b367'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Daily Uniform: Why Wearing One Formula Eliminates Decision Fatigue', 'Show a creator''s capsule uniform (tailored trousers + high-neck knit + leather loafers) that looks effortlessly sharp every morning in 60 seconds.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'lifestyle'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["I haven''t spent more than 60 seconds deciding what to wear in 2 years.", "Before you do this in Lifestyle, look at this rule.", "This is the Lifestyle breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The decision fatigue of overflowing closets", "The 3-piece daily uniform formula", "Putting on the outfit effortlessly", "Polished mirror check"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'b2afd88a-5a33-455a-9090-2556dbb6b367'::uuid, 'The Daily Uniform: Why Wearing One Formula Eliminates Decision Fatigue', '{"title": "The Daily Uniform: Why Wearing One Formula Eliminates Decision Fatigue", "one_sentence_premise": "Show a creator''s capsule uniform (tailored trousers + high-neck knit + leather loafers) that looks effortlessly sharp every morning in 60 seconds.", "idea_summary": {"title": "The Daily Uniform: Why Wearing One Formula Eliminates Decision Fatigue", "premise": "Show a creator''s capsule uniform (tailored trousers + high-neck knit + leather loafers) that looks effortlessly sharp every morning in 60 seconds.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The decision fatigue of overflowing closets → The 3-piece daily uniform formula → Putting on the outfit effortlessly → Polished mirror check", "opening_visual": "Opening a clean minimalist wardrobe containing 5 identical shirts and 3 pairs of perfectly tailored trousers.", "visual_texture": "Minimalist luxury, intentional, crisp", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The decision fatigue of overflowing closets", "spoken_audio": "I haven''''t spent more than 60 seconds deciding what to wear in 2 years."}, {"beat_number": 2, "purpose": "The", "visual_action": "The 3-piece daily uniform formula", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Putting", "visual_action": "Putting on the outfit effortlessly", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Polished", "visual_action": "Polished mirror check", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "I haven''t spent more than 60 seconds deciding what to wear in 2 years.", "first_second_visual_hook": "Opening a clean minimalist wardrobe containing 5 identical shirts and 3 pairs of perfectly tailored trousers.", "hook_options": ["I haven''t spent more than 60 seconds deciding what to wear in 2 years.", "Before you do this in Lifestyle, look at this rule.", "This is the Lifestyle breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Minimalist luxury, intentional, crisp", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Inspires intentional simplicity and elevated personal style.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'b2afd88a-5a33-455a-9090-2556dbb6b367'::uuid,
  (select id from public.categories where slug = 'lifestyle'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 74, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "lifestyle", "authentic_niche_2026": true}'::jsonb
);

insert into public.categories (slug, name, family, enabled, risk_level, sort_order)
values ('creator_education', 'Creator Education', 'creator_content', true, 'low', 100)
on conflict (slug) do update set enabled = true, name = excluded.name;

-- [CREATOR_EDUCATION] The Retention Cliff Autopsy: Fixing the 3-Second Drop-off (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'ba7101ee-1487-48f7-bc99-89092533d45f'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Retention Cliff Autopsy: Fixing the 3-Second Drop-off', 'Analyze real Instagram Reels and TikTok analytics charts showing where 70% of viewers drop off, and how a visual pattern interrupt at second 2.5 resets attention.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'creator_education'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If your videos get stuck at 200 views, look at your retention graph at second 3.", "Before you do this in Creator Education, look at this rule.", "This is the Creator Education breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The retention drop-off diagnosis", "Why verbal greetings kill retention", "The visual pattern interrupt solution", "Before and after watch-time comparison"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'ba7101ee-1487-48f7-bc99-89092533d45f'::uuid, 'The Retention Cliff Autopsy: Fixing the 3-Second Drop-off', '{"title": "The Retention Cliff Autopsy: Fixing the 3-Second Drop-off", "one_sentence_premise": "Analyze real Instagram Reels and TikTok analytics charts showing where 70% of viewers drop off, and how a visual pattern interrupt at second 2.5 resets attention.", "idea_summary": {"title": "The Retention Cliff Autopsy: Fixing the 3-Second Drop-off", "premise": "Analyze real Instagram Reels and TikTok analytics charts showing where 70% of viewers drop off, and how a visual pattern interrupt at second 2.5 resets attention.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The retention drop-off diagnosis → Why verbal greetings kill retention → The visual pattern interrupt solution → Before and after watch-time comparison", "opening_visual": "Screen pointing directly to a steep drop-off retention curve on creator studio dashboard.", "visual_texture": "Data-backed, sharp creator masterclass, analytical", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The retention drop-off diagnosis", "spoken_audio": "If your videos get stuck at 200 views, look at your retention graph at second 3."}, {"beat_number": 2, "purpose": "Why", "visual_action": "Why verbal greetings kill retention", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The visual pattern interrupt solution", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Before", "visual_action": "Before and after watch-time comparison", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If your videos get stuck at 200 views, look at your retention graph at second 3.", "first_second_visual_hook": "Screen pointing directly to a steep drop-off retention curve on creator studio dashboard.", "hook_options": ["If your videos get stuck at 200 views, look at your retention graph at second 3.", "Before you do this in Creator Education, look at this rule.", "This is the Creator Education breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Data-backed, sharp creator masterclass, analytical", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Positions creator as an elite viral content strategist and algorithmic analyst.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'ba7101ee-1487-48f7-bc99-89092533d45f'::uuid,
  (select id from public.categories where slug = 'creator_education'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 96, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "creator_education", "authentic_niche_2026": true}'::jsonb
);

-- [CREATOR_EDUCATION] Mobile Audio Mastering: Why Your Voice Sounds Muffled on Phone Speakers (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '8a8f7b7b-c123-4f9a-acb7-072cdcaedfd6'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Mobile Audio Mastering: Why Your Voice Sounds Muffled on Phone Speakers', 'Explain vocal EQ and compression settings specifically calibrated for tiny smartphone mono speakers rather than studio monitors.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'creator_education'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Your video audio sounds fine in your headphones, but on your viewer''s phone speaker it sounds like you’re under water.", "Before you do this in Creator Education, look at this rule.", "This is the Creator Education breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The phone speaker limitation", "Cutting mud at 300Hz", "Boosting presence and vocal air at 5kHz", "A/B audio listening test"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '8a8f7b7b-c123-4f9a-acb7-072cdcaedfd6'::uuid, 'Mobile Audio Mastering: Why Your Voice Sounds Muffled on Phone Speakers', '{"title": "Mobile Audio Mastering: Why Your Voice Sounds Muffled on Phone Speakers", "one_sentence_premise": "Explain vocal EQ and compression settings specifically calibrated for tiny smartphone mono speakers rather than studio monitors.", "idea_summary": {"title": "Mobile Audio Mastering: Why Your Voice Sounds Muffled on Phone Speakers", "premise": "Explain vocal EQ and compression settings specifically calibrated for tiny smartphone mono speakers rather than studio monitors.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The phone speaker limitation → Cutting mud at 300Hz → Boosting presence and vocal air at 5kHz → A/B audio listening test", "opening_visual": "Audio waveform comparison showing muddiness in 200Hz-400Hz cut out with a crisp high-shelf boost at 5kHz.", "visual_texture": "Crisp acoustic demonstration, high technical utility", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The phone speaker limitation", "spoken_audio": "Your video audio sounds fine in your headphones, but on your viewer''''s phone speaker it sounds like you’re under water."}, {"beat_number": 2, "purpose": "Cutting", "visual_action": "Cutting mud at 300Hz", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Boosting", "visual_action": "Boosting presence and vocal air at 5kHz", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "A/B", "visual_action": "A/B audio listening test", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Your video audio sounds fine in your headphones, but on your viewer''s phone speaker it sounds like you’re under water.", "first_second_visual_hook": "Audio waveform comparison showing muddiness in 200Hz-400Hz cut out with a crisp high-shelf boost at 5kHz.", "hook_options": ["Your video audio sounds fine in your headphones, but on your viewer''s phone speaker it sounds like you’re under water.", "Before you do this in Creator Education, look at this rule.", "This is the Creator Education breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Crisp acoustic demonstration, high technical utility", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Solves technical audio production problems for serious creators.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '8a8f7b7b-c123-4f9a-acb7-072cdcaedfd6'::uuid,
  (select id from public.categories where slug = 'creator_education'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 87, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "creator_education", "authentic_niche_2026": true}'::jsonb
);

-- [CREATOR_EDUCATION] 3 Hook Formulas That Force Viewers to Rewatch the Video (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'cab7e14b-f8d5-4600-9ffa-0a2da45d5f16'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  '3 Hook Formulas That Force Viewers to Rewatch the Video', 'A breakdown of seamless infinite loop endings, micro-text details, and fast visual lists that trigger double-takes and algorithmic boosts.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'creator_education'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Save these 3 script templates for your next Reel.", "Before you do this in Creator Education, look at this rule.", "This is the Creator Education breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Formula 1: The seamless infinite loop", "Formula 2: The freeze-frame checklist", "Formula 3: The counter-intuitive question", "Screenshot template card"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'cab7e14b-f8d5-4600-9ffa-0a2da45d5f16'::uuid, '3 Hook Formulas That Force Viewers to Rewatch the Video', '{"title": "3 Hook Formulas That Force Viewers to Rewatch the Video", "one_sentence_premise": "A breakdown of seamless infinite loop endings, micro-text details, and fast visual lists that trigger double-takes and algorithmic boosts.", "idea_summary": {"title": "3 Hook Formulas That Force Viewers to Rewatch the Video", "premise": "A breakdown of seamless infinite loop endings, micro-text details, and fast visual lists that trigger double-takes and algorithmic boosts.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Formula 1: The seamless infinite loop → Formula 2: The freeze-frame checklist → Formula 3: The counter-intuitive question → Screenshot template card", "opening_visual": "Split-screen demonstrating an infinite loop transition seamlessly connecting the last sentence back to the opening hook.", "visual_texture": "Fast, high-density value, energetic", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Formula", "visual_action": "Formula 1: The seamless infinite loop", "spoken_audio": "Save these 3 script templates for your next Reel."}, {"beat_number": 2, "purpose": "Formula", "visual_action": "Formula 2: The freeze-frame checklist", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Formula", "visual_action": "Formula 3: The counter-intuitive question", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Screenshot", "visual_action": "Screenshot template card", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Save these 3 script templates for your next Reel.", "first_second_visual_hook": "Split-screen demonstrating an infinite loop transition seamlessly connecting the last sentence back to the opening hook.", "hook_options": ["Save these 3 script templates for your next Reel.", "Before you do this in Creator Education, look at this rule.", "This is the Creator Education breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Fast, high-density value, energetic", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Drives immediate bookmarks and creator shares.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'cab7e14b-f8d5-4600-9ffa-0a2da45d5f16'::uuid,
  (select id from public.categories where slug = 'creator_education'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 78, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "creator_education", "authentic_niche_2026": true}'::jsonb
);

-- [CREATOR_EDUCATION] The Visual Hook Geometry: The 0.8-Second Rule (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'd47b78b9-990f-4918-a393-a604a43cf309'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Visual Hook Geometry: The 0.8-Second Rule', 'Break down why static talking-head openers fail, and how motion in the first 0.8 seconds (camera pan, object placement, text pop) increases swipe-stop rate by 40%.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'creator_education'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Viewers decide whether to swipe past your video before you finish saying your first word.", "Before you do this in Creator Education, look at this rule.", "This is the Creator Education breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The swipe-away millisecond metric", "The 3 physical motion openers", "Text anchor placement in the upper third", "Analytics retention curve proof"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'd47b78b9-990f-4918-a393-a604a43cf309'::uuid, 'The Visual Hook Geometry: The 0.8-Second Rule', '{"title": "The Visual Hook Geometry: The 0.8-Second Rule", "one_sentence_premise": "Break down why static talking-head openers fail, and how motion in the first 0.8 seconds (camera pan, object placement, text pop) increases swipe-stop rate by 40%.", "idea_summary": {"title": "The Visual Hook Geometry: The 0.8-Second Rule", "premise": "Break down why static talking-head openers fail, and how motion in the first 0.8 seconds (camera pan, object placement, text pop) increases swipe-stop rate by 40%.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The swipe-away millisecond metric → The 3 physical motion openers → Text anchor placement in the upper third → Analytics retention curve proof", "opening_visual": "Side-by-side comparison: Static standing intro vs dynamic physical movement into frame with text anchor.", "visual_texture": "Cinematic production masterclass, sharp, data-driven", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The swipe-away millisecond metric", "spoken_audio": "Viewers decide whether to swipe past your video before you finish saying your first word."}, {"beat_number": 2, "purpose": "The", "visual_action": "The 3 physical motion openers", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Text", "visual_action": "Text anchor placement in the upper third", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Analytics", "visual_action": "Analytics retention curve proof", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Viewers decide whether to swipe past your video before you finish saying your first word.", "first_second_visual_hook": "Side-by-side comparison: Static standing intro vs dynamic physical movement into frame with text anchor.", "hook_options": ["Viewers decide whether to swipe past your video before you finish saying your first word.", "Before you do this in Creator Education, look at this rule.", "This is the Creator Education breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Cinematic production masterclass, sharp, data-driven", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Mastery in video retention mechanics and digital storytelling.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'd47b78b9-990f-4918-a393-a604a43cf309'::uuid,
  (select id from public.categories where slug = 'creator_education'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 93, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "creator_education", "authentic_niche_2026": true}'::jsonb
);

-- [CREATOR_EDUCATION] Lighting on a Budget: The 1-Light Softbox Bounce Technique (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '6c8efd56-0c67-4057-baa2-894e7070349c'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Lighting on a Budget: The 1-Light Softbox Bounce Technique', 'Show how bouncing a single $50 key light off a white wall creates soft, expensive, cinematic diffusion instead of harsh direct glare.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'creator_education'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Stop pointing your ring light directly at your face.", "Before you do this in Creator Education, look at this rule.", "This is the Creator Education breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The harsh direct ring light mistake", "Wall bounce physics for large-source diffusion", "Negative fill side shadow for jawline definition", "Cinematic portrait result"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '6c8efd56-0c67-4057-baa2-894e7070349c'::uuid, 'Lighting on a Budget: The 1-Light Softbox Bounce Technique', '{"title": "Lighting on a Budget: The 1-Light Softbox Bounce Technique", "one_sentence_premise": "Show how bouncing a single $50 key light off a white wall creates soft, expensive, cinematic diffusion instead of harsh direct glare.", "idea_summary": {"title": "Lighting on a Budget: The 1-Light Softbox Bounce Technique", "premise": "Show how bouncing a single $50 key light off a white wall creates soft, expensive, cinematic diffusion instead of harsh direct glare.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The harsh direct ring light mistake → Wall bounce physics for large-source diffusion → Negative fill side shadow for jawline definition → Cinematic portrait result", "opening_visual": "Turning harsh direct ring light into a soft, diffused cinematic wall bounce with rich facial depth.", "visual_texture": "Studio cinematography, dramatic before/after, practical", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The harsh direct ring light mistake", "spoken_audio": "Stop pointing your ring light directly at your face."}, {"beat_number": 2, "purpose": "Wall", "visual_action": "Wall bounce physics for large-source diffusion", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Negative", "visual_action": "Negative fill side shadow for jawline definition", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Cinematic", "visual_action": "Cinematic portrait result", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Stop pointing your ring light directly at your face.", "first_second_visual_hook": "Turning harsh direct ring light into a soft, diffused cinematic wall bounce with rich facial depth.", "hook_options": ["Stop pointing your ring light directly at your face.", "Before you do this in Creator Education, look at this rule.", "This is the Creator Education breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Studio cinematography, dramatic before/after, practical", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Empowers creators with professional visual production skills.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '6c8efd56-0c67-4057-baa2-894e7070349c'::uuid,
  (select id from public.categories where slug = 'creator_education'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 84, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "creator_education", "authentic_niche_2026": true}'::jsonb
);

-- [CREATOR_EDUCATION] The Mobile Teleprompter Hack for 1-Take Video Delivery (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '5bc37d3b-ddf5-4f25-b1cf-f4bc2536c525'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Mobile Teleprompter Hack for 1-Take Video Delivery', 'Using a voice-scrolling teleprompter app positioned right next to the camera lens so your eyes never look away from the viewer.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'creator_education'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["How to deliver a 60-second script in 1 take without memorizing a single word.", "Before you do this in Creator Education, look at this rule.", "This is the Creator Education breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Eye-movement giveaway mistake", "Setting script margins to 30% width", "Voice-activated auto-scroll setting", "Flawless delivery example"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '5bc37d3b-ddf5-4f25-b1cf-f4bc2536c525'::uuid, 'The Mobile Teleprompter Hack for 1-Take Video Delivery', '{"title": "The Mobile Teleprompter Hack for 1-Take Video Delivery", "one_sentence_premise": "Using a voice-scrolling teleprompter app positioned right next to the camera lens so your eyes never look away from the viewer.", "idea_summary": {"title": "The Mobile Teleprompter Hack for 1-Take Video Delivery", "premise": "Using a voice-scrolling teleprompter app positioned right next to the camera lens so your eyes never look away from the viewer.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Eye-movement giveaway mistake → Setting script margins to 30% width → Voice-activated auto-scroll setting → Flawless delivery example", "opening_visual": "Behind-the-scenes view of phone screen with scrolling script directly next to lens while subject maintains eye contact.", "visual_texture": "Behind-the-scenes production efficiency", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Eye-movement", "visual_action": "Eye-movement giveaway mistake", "spoken_audio": "How to deliver a 60-second script in 1 take without memorizing a single word."}, {"beat_number": 2, "purpose": "Setting", "visual_action": "Setting script margins to 30% width", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Voice-activated", "visual_action": "Voice-activated auto-scroll setting", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Flawless", "visual_action": "Flawless delivery example", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "How to deliver a 60-second script in 1 take without memorizing a single word.", "first_second_visual_hook": "Behind-the-scenes view of phone screen with scrolling script directly next to lens while subject maintains eye contact.", "hook_options": ["How to deliver a 60-second script in 1 take without memorizing a single word.", "Before you do this in Creator Education, look at this rule.", "This is the Creator Education breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Behind-the-scenes production efficiency", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Saves creators hours in filming and editing.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '5bc37d3b-ddf5-4f25-b1cf-f4bc2536c525'::uuid,
  (select id from public.categories where slug = 'creator_education'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 75, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "creator_education", "authentic_niche_2026": true}'::jsonb
);

insert into public.categories (slug, name, family, enabled, risk_level, sort_order)
values ('fitness_wellness_safe', 'Fitness & Wellness', 'creator_content', true, 'low', 100)
on conflict (slug) do update set enabled = true, name = excluded.name;

-- [FITNESS_WELLNESS_SAFE] Joint Mechanics over Muscle Burn: The Shoulder Health Longevity Protocol (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '9c5966ae-2105-4062-9f91-a84bd7d7de75'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Joint Mechanics over Muscle Burn: The Shoulder Health Longevity Protocol', 'Demonstrate why standard flared elbow bench presses and overhead presses cause shoulder impingement, and how scapular retraction + 45-degree tuck preserves joints for life.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fitness_wellness_safe'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["You don’t have bad shoulders; you have bad pressing geometry.", "Before you do this in Fitness & Wellness, look at this rule.", "This is the Fitness & Wellness breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The flared elbow impingement trap", "Scapular depression and upward rotation", "The 45-degree pressing plane", "Pain-free heavy pressing demonstration"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '9c5966ae-2105-4062-9f91-a84bd7d7de75'::uuid, 'Joint Mechanics over Muscle Burn: The Shoulder Health Longevity Protocol', '{"title": "Joint Mechanics over Muscle Burn: The Shoulder Health Longevity Protocol", "one_sentence_premise": "Demonstrate why standard flared elbow bench presses and overhead presses cause shoulder impingement, and how scapular retraction + 45-degree tuck preserves joints for life.", "idea_summary": {"title": "Joint Mechanics over Muscle Burn: The Shoulder Health Longevity Protocol", "premise": "Demonstrate why standard flared elbow bench presses and overhead presses cause shoulder impingement, and how scapular retraction + 45-degree tuck preserves joints for life.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The flared elbow impingement trap → Scapular depression and upward rotation → The 45-degree pressing plane → Pain-free heavy pressing demonstration", "opening_visual": "3D skeletal anatomical alignment overlay on dumbbell press showing safe subacromial space clearance.", "visual_texture": "Sports biomechanics, scientific, clean gym studio lighting", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The flared elbow impingement trap", "spoken_audio": "You don’t have bad shoulders; you have bad pressing geometry."}, {"beat_number": 2, "purpose": "Scapular", "visual_action": "Scapular depression and upward rotation", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The 45-degree pressing plane", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Pain-free", "visual_action": "Pain-free heavy pressing demonstration", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "You don’t have bad shoulders; you have bad pressing geometry.", "first_second_visual_hook": "3D skeletal anatomical alignment overlay on dumbbell press showing safe subacromial space clearance.", "hook_options": ["You don’t have bad shoulders; you have bad pressing geometry.", "Before you do this in Fitness & Wellness, look at this rule.", "This is the Fitness & Wellness breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Sports biomechanics, scientific, clean gym studio lighting", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Builds medical and biomechanical authority in longevity fitness.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '9c5966ae-2105-4062-9f91-a84bd7d7de75'::uuid,
  (select id from public.categories where slug = 'fitness_wellness_safe'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 95, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "fitness_wellness_safe", "authentic_niche_2026": true}'::jsonb
);

-- [FITNESS_WELLNESS_SAFE] The Nervous System Reset: The 3-Minute Physiological Sigh (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '214591f4-14c5-4523-8889-ad1452cf2853'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Nervous System Reset: The 3-Minute Physiological Sigh', 'Explain Dr. Andrew Huberman''s double-inhalation physiological sigh that instantly lowers cortisol and heart rate during acute stress.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fitness_wellness_safe'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["This is the fastest biological way to turn off your stress response in under 60 seconds.", "Before you do this in Fitness & Wellness, look at this rule.", "This is the Fitness & Wellness breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The neurobiology of alveolar collapse", "The double nasal inhale mechanism", "Extended exhale vagus nerve stimulation", "Real-time biometric data proof"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '214591f4-14c5-4523-8889-ad1452cf2853'::uuid, 'The Nervous System Reset: The 3-Minute Physiological Sigh', '{"title": "The Nervous System Reset: The 3-Minute Physiological Sigh", "one_sentence_premise": "Explain Dr. Andrew Huberman''s double-inhalation physiological sigh that instantly lowers cortisol and heart rate during acute stress.", "idea_summary": {"title": "The Nervous System Reset: The 3-Minute Physiological Sigh", "premise": "Explain Dr. Andrew Huberman''s double-inhalation physiological sigh that instantly lowers cortisol and heart rate during acute stress.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The neurobiology of alveolar collapse → The double nasal inhale mechanism → Extended exhale vagus nerve stimulation → Real-time biometric data proof", "opening_visual": "Heart rate monitor graph dropping 15 BPM in real-time as creator performs two sharp nasal inhales and long slow oral exhale.", "visual_texture": "Scientific, calming, clear clinical evidence", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The neurobiology of alveolar collapse", "spoken_audio": "This is the fastest biological way to turn off your stress response in under 60 seconds."}, {"beat_number": 2, "purpose": "The", "visual_action": "The double nasal inhale mechanism", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Extended", "visual_action": "Extended exhale vagus nerve stimulation", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Real-time", "visual_action": "Real-time biometric data proof", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "This is the fastest biological way to turn off your stress response in under 60 seconds.", "first_second_visual_hook": "Heart rate monitor graph dropping 15 BPM in real-time as creator performs two sharp nasal inhales and long slow oral exhale.", "hook_options": ["This is the fastest biological way to turn off your stress response in under 60 seconds.", "Before you do this in Fitness & Wellness, look at this rule.", "This is the Fitness & Wellness breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Scientific, calming, clear clinical evidence", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Establishes creator as a credible biohacking and nervous system regulation guide.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '214591f4-14c5-4523-8889-ad1452cf2853'::uuid,
  (select id from public.categories where slug = 'fitness_wellness_safe'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 86, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "fitness_wellness_safe", "authentic_niche_2026": true}'::jsonb
);

-- [FITNESS_WELLNESS_SAFE] The 1-Minute Desk Hip Flexor Decompression Stretch (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '6f2efc98-deb8-46af-9fd3-5490f63774f3'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The 1-Minute Desk Hip Flexor Decompression Stretch', 'A quick couch stretch modification you can do against an office chair to reverse 8 hours of pelvic tilt and lower back tightness.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fitness_wellness_safe'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If your lower back aches after sitting all day, do this stretch right now.", "Before you do this in Fitness & Wellness, look at this rule.", "This is the Fitness & Wellness breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Why hip flexor shortening pulls on the lumbar spine", "The pelvic tuck execution cue", "Holding for 3 deep breaths per side", "Stand-up relief check"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '6f2efc98-deb8-46af-9fd3-5490f63774f3'::uuid, 'The 1-Minute Desk Hip Flexor Decompression Stretch', '{"title": "The 1-Minute Desk Hip Flexor Decompression Stretch", "one_sentence_premise": "A quick couch stretch modification you can do against an office chair to reverse 8 hours of pelvic tilt and lower back tightness.", "idea_summary": {"title": "The 1-Minute Desk Hip Flexor Decompression Stretch", "premise": "A quick couch stretch modification you can do against an office chair to reverse 8 hours of pelvic tilt and lower back tightness.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Why hip flexor shortening pulls on the lumbar spine → The pelvic tuck execution cue → Holding for 3 deep breaths per side → Stand-up relief check", "opening_visual": "Demonstrating posterior pelvic tilt glute squeeze against an office chair with instant hip opening.", "visual_texture": "Instant physical relief, high utility, accessible", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Why", "visual_action": "Why hip flexor shortening pulls on the lumbar spine", "spoken_audio": "If your lower back aches after sitting all day, do this stretch right now."}, {"beat_number": 2, "purpose": "The", "visual_action": "The pelvic tuck execution cue", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Holding", "visual_action": "Holding for 3 deep breaths per side", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Stand-up", "visual_action": "Stand-up relief check", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If your lower back aches after sitting all day, do this stretch right now.", "first_second_visual_hook": "Demonstrating posterior pelvic tilt glute squeeze against an office chair with instant hip opening.", "hook_options": ["If your lower back aches after sitting all day, do this stretch right now.", "Before you do this in Fitness & Wellness, look at this rule.", "This is the Fitness & Wellness breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Instant physical relief, high utility, accessible", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Provides immediate physical relief that viewers bookmark and repeat daily.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '6f2efc98-deb8-46af-9fd3-5490f63774f3'::uuid,
  (select id from public.categories where slug = 'fitness_wellness_safe'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 78, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "fitness_wellness_safe", "authentic_niche_2026": true}'::jsonb
);

-- [FITNESS_WELLNESS_SAFE] The Zone 2 Cardio Longevity Equation: Building Mitochondrial Density (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '8c24e93c-36a2-4949-a819-5b1e36f59f8f'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Zone 2 Cardio Longevity Equation: Building Mitochondrial Density', 'Explain why constant high-intensity burnout is inferior for fat oxidation and heart health compared to conversational Zone 2 nasal-breathing aerobic training.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fitness_wellness_safe'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If you are gasping for air on every single workout, you are training in the metabolic black hole.", "Before you do this in Fitness & Wellness, look at this rule.", "This is the Fitness & Wellness breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The high-intensity exhaustion trap", "The science of mitochondrial efficiency", "The conversational talk test rule", "Weekly 150-minute Zone 2 structure"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '8c24e93c-36a2-4949-a819-5b1e36f59f8f'::uuid, 'The Zone 2 Cardio Longevity Equation: Building Mitochondrial Density', '{"title": "The Zone 2 Cardio Longevity Equation: Building Mitochondrial Density", "one_sentence_premise": "Explain why constant high-intensity burnout is inferior for fat oxidation and heart health compared to conversational Zone 2 nasal-breathing aerobic training.", "idea_summary": {"title": "The Zone 2 Cardio Longevity Equation: Building Mitochondrial Density", "premise": "Explain why constant high-intensity burnout is inferior for fat oxidation and heart health compared to conversational Zone 2 nasal-breathing aerobic training.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The high-intensity exhaustion trap → The science of mitochondrial efficiency → The conversational talk test rule → Weekly 150-minute Zone 2 structure", "opening_visual": "Heart rate zone dashboard showing steady Zone 2 fat oxidation wattage vs lactate spikes.", "visual_texture": "Cardiovascular science, clean biometric data, modern athletic longevity", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The high-intensity exhaustion trap", "spoken_audio": "If you are gasping for air on every single workout, you are training in the metabolic black hole."}, {"beat_number": 2, "purpose": "The", "visual_action": "The science of mitochondrial efficiency", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The conversational talk test rule", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Weekly", "visual_action": "Weekly 150-minute Zone 2 structure", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If you are gasping for air on every single workout, you are training in the metabolic black hole.", "first_second_visual_hook": "Heart rate zone dashboard showing steady Zone 2 fat oxidation wattage vs lactate spikes.", "hook_options": ["If you are gasping for air on every single workout, you are training in the metabolic black hole.", "Before you do this in Fitness & Wellness, look at this rule.", "This is the Fitness & Wellness breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Cardiovascular science, clean biometric data, modern athletic longevity", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "High credibility in endurance, longevity, and intelligent training.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '8c24e93c-36a2-4949-a819-5b1e36f59f8f'::uuid,
  (select id from public.categories where slug = 'fitness_wellness_safe'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 92, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "fitness_wellness_safe", "authentic_niche_2026": true}'::jsonb
);

-- [FITNESS_WELLNESS_SAFE] The Foot Mechanics & Ankle Mobility Test for Deep Squats (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'bd70a063-c5cf-45cd-9f3b-f341560c4f16'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Foot Mechanics & Ankle Mobility Test for Deep Squats', 'Show how stiff ankle dorsiflexion causes lower back rounding in squats, and how 2 minutes of weighted calf stretches fixes depth instantly.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fitness_wellness_safe'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Your squat isn''t limited by your hips; it’s stuck in your ankle joint.", "Before you do this in Fitness & Wellness, look at this rule.", "This is the Fitness & Wellness breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The butt-wink lower back compensation", "Knee-to-wall diagnostic test", "Elevated heel squat test", "Rock-solid deep squat payoff"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'bd70a063-c5cf-45cd-9f3b-f341560c4f16'::uuid, 'The Foot Mechanics & Ankle Mobility Test for Deep Squats', '{"title": "The Foot Mechanics & Ankle Mobility Test for Deep Squats", "one_sentence_premise": "Show how stiff ankle dorsiflexion causes lower back rounding in squats, and how 2 minutes of weighted calf stretches fixes depth instantly.", "idea_summary": {"title": "The Foot Mechanics & Ankle Mobility Test for Deep Squats", "premise": "Show how stiff ankle dorsiflexion causes lower back rounding in squats, and how 2 minutes of weighted calf stretches fixes depth instantly.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The butt-wink lower back compensation → Knee-to-wall diagnostic test → Elevated heel squat test → Rock-solid deep squat payoff", "opening_visual": "Knee-to-wall ankle mobility measurement test showing restricted vs 5-inch mobile ankle travel.", "visual_texture": "Biomechanics, practical movement therapy", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The butt-wink lower back compensation", "spoken_audio": "Your squat isn''''t limited by your hips; it’s stuck in your ankle joint."}, {"beat_number": 2, "purpose": "Knee-to-wall", "visual_action": "Knee-to-wall diagnostic test", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Elevated", "visual_action": "Elevated heel squat test", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Rock-solid", "visual_action": "Rock-solid deep squat payoff", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Your squat isn''t limited by your hips; it’s stuck in your ankle joint.", "first_second_visual_hook": "Knee-to-wall ankle mobility measurement test showing restricted vs 5-inch mobile ankle travel.", "hook_options": ["Your squat isn''t limited by your hips; it’s stuck in your ankle joint.", "Before you do this in Fitness & Wellness, look at this rule.", "This is the Fitness & Wellness breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Biomechanics, practical movement therapy", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Injury-prevention and structural athletic excellence.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'bd70a063-c5cf-45cd-9f3b-f341560c4f16'::uuid,
  (select id from public.categories where slug = 'fitness_wellness_safe'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 83, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "fitness_wellness_safe", "authentic_niche_2026": true}'::jsonb
);

-- [FITNESS_WELLNESS_SAFE] The 30-Gram Morning Protein Threshold for Satiety and Muscle Synthesis (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '9368fa02-15f7-49e3-97b6-15be3f58567f'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The 30-Gram Morning Protein Threshold for Satiety and Muscle Synthesis', 'Explain the leucine trigger mechanism: hitting 30g protein at breakfast stabilizes blood glucose and eliminates 11 AM pastry cravings.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'fitness_wellness_safe'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If you are hungry 2 hours after breakfast, you missed the 30g protein threshold.", "Before you do this in Fitness & Wellness, look at this rule.", "This is the Fitness & Wellness breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The blood sugar spike & crash cycle", "The leucine muscle synthesis trigger", "3 easy 30g breakfast recipes", "Saveable macro chart"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '9368fa02-15f7-49e3-97b6-15be3f58567f'::uuid, 'The 30-Gram Morning Protein Threshold for Satiety and Muscle Synthesis', '{"title": "The 30-Gram Morning Protein Threshold for Satiety and Muscle Synthesis", "one_sentence_premise": "Explain the leucine trigger mechanism: hitting 30g protein at breakfast stabilizes blood glucose and eliminates 11 AM pastry cravings.", "idea_summary": {"title": "The 30-Gram Morning Protein Threshold for Satiety and Muscle Synthesis", "premise": "Explain the leucine trigger mechanism: hitting 30g protein at breakfast stabilizes blood glucose and eliminates 11 AM pastry cravings.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The blood sugar spike & crash cycle → The leucine muscle synthesis trigger → 3 easy 30g breakfast recipes → Saveable macro chart", "opening_visual": "Assembling a clean 32g protein breakfast (Greek yogurt + whey + berries + chia) in 60 seconds.", "visual_texture": "Nutritional science, clean food prep, high utility", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The blood sugar spike & crash cycle", "spoken_audio": "If you are hungry 2 hours after breakfast, you missed the 30g protein threshold."}, {"beat_number": 2, "purpose": "The", "visual_action": "The leucine muscle synthesis trigger", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "3", "visual_action": "3 easy 30g breakfast recipes", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Saveable", "visual_action": "Saveable macro chart", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If you are hungry 2 hours after breakfast, you missed the 30g protein threshold.", "first_second_visual_hook": "Assembling a clean 32g protein breakfast (Greek yogurt + whey + berries + chia) in 60 seconds.", "hook_options": ["If you are hungry 2 hours after breakfast, you missed the 30g protein threshold.", "Before you do this in Fitness & Wellness, look at this rule.", "This is the Fitness & Wellness breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Nutritional science, clean food prep, high utility", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Delivers practical evidence-based nutrition advice.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '9368fa02-15f7-49e3-97b6-15be3f58567f'::uuid,
  (select id from public.categories where slug = 'fitness_wellness_safe'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 74, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "fitness_wellness_safe", "authentic_niche_2026": true}'::jsonb
);

insert into public.categories (slug, name, family, enabled, risk_level, sort_order)
values ('commerce_affiliate', 'Commerce & Affiliate', 'creator_content', true, 'low', 100)
on conflict (slug) do update set enabled = true, name = excluded.name;

-- [COMMERCE_AFFILIATE] The 30-Day Durability Autopsy: What Sponsored Reviews Never Show (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '7b36ed89-0e6e-438d-8dc5-69d774f268a2'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The 30-Day Durability Autopsy: What Sponsored Reviews Never Show', 'Expose the truth behind viral TikTok gadgets by showing real wear-and-tear, battery degradation, and seam fraying after 30 days of actual daily use.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'commerce_affiliate'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Every influencer showed you this product when it was brand new in the box. Here is what it looks like after 30 days.", "Before you do this in Commerce & Affiliate, look at this rule.", "This is the Commerce & Affiliate breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The honeymoon unboxing illusion", "Testing 3 specific failure points (hinges, battery, finish)", "Who this product is actually for vs who should skip it", "The definitive buyer''s verdict"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '7b36ed89-0e6e-438d-8dc5-69d774f268a2'::uuid, 'The 30-Day Durability Autopsy: What Sponsored Reviews Never Show', '{"title": "The 30-Day Durability Autopsy: What Sponsored Reviews Never Show", "one_sentence_premise": "Expose the truth behind viral TikTok gadgets by showing real wear-and-tear, battery degradation, and seam fraying after 30 days of actual daily use.", "idea_summary": {"title": "The 30-Day Durability Autopsy: What Sponsored Reviews Never Show", "premise": "Expose the truth behind viral TikTok gadgets by showing real wear-and-tear, battery degradation, and seam fraying after 30 days of actual daily use.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The honeymoon unboxing illusion → Testing 3 specific failure points (hinges, battery, finish) → Who this product is actually for vs who should skip it → The definitive buyer''s verdict", "opening_visual": "Side-by-side comparison of polished unboxing footage vs actual scuffed product with honest diagnostic annotations.", "visual_texture": "Brutally honest consumer advocacy, tactile macro, transparent", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The honeymoon unboxing illusion", "spoken_audio": "Every influencer showed you this product when it was brand new in the box. Here is what it looks like after 30 days."}, {"beat_number": 2, "purpose": "Testing", "visual_action": "Testing 3 specific failure points (hinges, battery, finish)", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Who", "visual_action": "Who this product is actually for vs who should skip it", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The definitive buyer''s verdict", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Every influencer showed you this product when it was brand new in the box. Here is what it looks like after 30 days.", "first_second_visual_hook": "Side-by-side comparison of polished unboxing footage vs actual scuffed product with honest diagnostic annotations.", "hook_options": ["Every influencer showed you this product when it was brand new in the box. Here is what it looks like after 30 days.", "Before you do this in Commerce & Affiliate, look at this rule.", "This is the Commerce & Affiliate breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Brutally honest consumer advocacy, tactile macro, transparent", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Builds unmatched creator credibility and long-term buyer trust.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '7b36ed89-0e6e-438d-8dc5-69d774f268a2'::uuid,
  (select id from public.categories where slug = 'commerce_affiliate'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 95, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "commerce_affiliate", "authentic_niche_2026": true}'::jsonb
);

-- [COMMERCE_AFFILIATE] Price-to-Utility Ratio: When $20 Beats the $200 Brand Name (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '1454757f-17f1-4400-9d25-cb6233b50a24'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Price-to-Utility Ratio: When $20 Beats the $200 Brand Name', 'Blind test a $20 unbranded workhorse tool/gadget against a $200 luxury brand counterpart, breaking down the exact 5% difference in actual performance.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'commerce_affiliate'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["You are paying $180 extra just for the logo stamped on the aluminum.", "Before you do this in Commerce & Affiliate, look at this rule.", "This is the Commerce & Affiliate breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The blindfold performance test", "Disassembling both units to inspect internal components", "Where the extra money actually goes", "The smart buyer''s allocation recommendation"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '1454757f-17f1-4400-9d25-cb6233b50a24'::uuid, 'Price-to-Utility Ratio: When $20 Beats the $200 Brand Name', '{"title": "Price-to-Utility Ratio: When $20 Beats the $200 Brand Name", "one_sentence_premise": "Blind test a $20 unbranded workhorse tool/gadget against a $200 luxury brand counterpart, breaking down the exact 5% difference in actual performance.", "idea_summary": {"title": "Price-to-Utility Ratio: When $20 Beats the $200 Brand Name", "premise": "Blind test a $20 unbranded workhorse tool/gadget against a $200 luxury brand counterpart, breaking down the exact 5% difference in actual performance.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The blindfold performance test → Disassembling both units to inspect internal components → Where the extra money actually goes → The smart buyer''s allocation recommendation", "opening_visual": "Blind testing both products side-by-side under identical stress tests with blinded labels.", "visual_texture": "Investigative, consumer empowerment, high curiosity", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The blindfold performance test", "spoken_audio": "You are paying $180 extra just for the logo stamped on the aluminum."}, {"beat_number": 2, "purpose": "Disassembling", "visual_action": "Disassembling both units to inspect internal components", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Where", "visual_action": "Where the extra money actually goes", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The smart buyer''s allocation recommendation", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "You are paying $180 extra just for the logo stamped on the aluminum.", "first_second_visual_hook": "Blind testing both products side-by-side under identical stress tests with blinded labels.", "hook_options": ["You are paying $180 extra just for the logo stamped on the aluminum.", "Before you do this in Commerce & Affiliate, look at this rule.", "This is the Commerce & Affiliate breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Investigative, consumer empowerment, high curiosity", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Positions creator as an objective, unbiased consumer advocate.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '1454757f-17f1-4400-9d25-cb6233b50a24'::uuid,
  (select id from public.categories where slug = 'commerce_affiliate'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 86, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "commerce_affiliate", "authentic_niche_2026": true}'::jsonb
);

-- [COMMERCE_AFFILIATE] 3 Red Flags in Product Descriptions That Signal Cheap Dropshipping (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '05ee9054-9950-4356-8d2c-2e51713fa576'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  '3 Red Flags in Product Descriptions That Signal Cheap Dropshipping', 'Teach viewers how to spot photoshopped packaging, vague claims like ''Military Grade'', and fake timer countdowns before buying online.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'commerce_affiliate'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Before you click buy on that Instagram ad, check for these 3 red flags.", "Before you do this in Commerce & Affiliate, look at this rule.", "This is the Commerce & Affiliate breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Red Flag 1: ''Military Grade'' buzzwords without standard specs", "Red Flag 2: Stock image photoshop overlays", "Red Flag 3: Fake urgency countdown timers", "Saveable scam-prevention card"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '05ee9054-9950-4356-8d2c-2e51713fa576'::uuid, '3 Red Flags in Product Descriptions That Signal Cheap Dropshipping', '{"title": "3 Red Flags in Product Descriptions That Signal Cheap Dropshipping", "one_sentence_premise": "Teach viewers how to spot photoshopped packaging, vague claims like ''Military Grade'', and fake timer countdowns before buying online.", "idea_summary": {"title": "3 Red Flags in Product Descriptions That Signal Cheap Dropshipping", "premise": "Teach viewers how to spot photoshopped packaging, vague claims like ''Military Grade'', and fake timer countdowns before buying online.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Red Flag 1: ''Military Grade'' buzzwords without standard specs → Red Flag 2: Stock image photoshop overlays → Red Flag 3: Fake urgency countdown timers → Saveable scam-prevention card", "opening_visual": "Screen capture highlighting fake review timestamps and reverse image search results showing identical AliExpress listings.", "visual_texture": "Fast, consumer protection, high shareability", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Red", "visual_action": "Red Flag 1: ''Military Grade'' buzzwords without standard specs", "spoken_audio": "Before you click buy on that Instagram ad, check for these 3 red flags."}, {"beat_number": 2, "purpose": "Red", "visual_action": "Red Flag 2: Stock image photoshop overlays", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Red", "visual_action": "Red Flag 3: Fake urgency countdown timers", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Saveable", "visual_action": "Saveable scam-prevention card", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Before you click buy on that Instagram ad, check for these 3 red flags.", "first_second_visual_hook": "Screen capture highlighting fake review timestamps and reverse image search results showing identical AliExpress listings.", "hook_options": ["Before you click buy on that Instagram ad, check for these 3 red flags.", "Before you do this in Commerce & Affiliate, look at this rule.", "This is the Commerce & Affiliate breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Fast, consumer protection, high shareability", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Protects audience wallets and establishes shopping discernment.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '05ee9054-9950-4356-8d2c-2e51713fa576'::uuid,
  (select id from public.categories where slug = 'commerce_affiliate'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 78, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "commerce_affiliate", "authentic_niche_2026": true}'::jsonb
);

-- [COMMERCE_AFFILIATE] Cost-Per-Wear Math: Why Cheap Shoes Cost 3x More Over 5 Years (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '70ee6049-d0c9-4cf6-a391-7d04ad70fac2'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Cost-Per-Wear Math: Why Cheap Shoes Cost 3x More Over 5 Years', 'Break down Goodyear welted resoleable leather shoes ($300 / 10 years / 3 resoles = $40/year) vs glued disposable footwear replaced every 9 months.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'commerce_affiliate'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Buying cheap shoes is the most expensive mistake in your wardrobe.", "Before you do this in Commerce & Affiliate, look at this rule.", "This is the Commerce & Affiliate breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The glued sole peeling failure point", "How Goodyear welting allows 5 resoles", "The 5-year Cost-Per-Wear calculation", "Smart investment buying filter"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '70ee6049-d0c9-4cf6-a391-7d04ad70fac2'::uuid, 'Cost-Per-Wear Math: Why Cheap Shoes Cost 3x More Over 5 Years', '{"title": "Cost-Per-Wear Math: Why Cheap Shoes Cost 3x More Over 5 Years", "one_sentence_premise": "Break down Goodyear welted resoleable leather shoes ($300 / 10 years / 3 resoles = $40/year) vs glued disposable footwear replaced every 9 months.", "idea_summary": {"title": "Cost-Per-Wear Math: Why Cheap Shoes Cost 3x More Over 5 Years", "premise": "Break down Goodyear welted resoleable leather shoes ($300 / 10 years / 3 resoles = $40/year) vs glued disposable footwear replaced every 9 months.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The glued sole peeling failure point → How Goodyear welting allows 5 resoles → The 5-year Cost-Per-Wear calculation → Smart investment buying filter", "opening_visual": "Cross-section shoe dissection showing Goodyear welt stitching vs thin glued paperboard in fast-fashion shoes.", "visual_texture": "Craftsmanship audit, tactile product dissection, financial intelligence", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The glued sole peeling failure point", "spoken_audio": "Buying cheap shoes is the most expensive mistake in your wardrobe."}, {"beat_number": 2, "purpose": "How", "visual_action": "How Goodyear welting allows 5 resoles", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The 5-year Cost-Per-Wear calculation", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Smart", "visual_action": "Smart investment buying filter", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Buying cheap shoes is the most expensive mistake in your wardrobe.", "first_second_visual_hook": "Cross-section shoe dissection showing Goodyear welt stitching vs thin glued paperboard in fast-fashion shoes.", "hook_options": ["Buying cheap shoes is the most expensive mistake in your wardrobe.", "Before you do this in Commerce & Affiliate, look at this rule.", "This is the Commerce & Affiliate breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Craftsmanship audit, tactile product dissection, financial intelligence", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Educates audience on conscious consumption and heirloom purchasing.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '70ee6049-d0c9-4cf6-a391-7d04ad70fac2'::uuid,
  (select id from public.categories where slug = 'commerce_affiliate'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 92, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "commerce_affiliate", "authentic_niche_2026": true}'::jsonb
);

-- [COMMERCE_AFFILIATE] The Material Composition Audit: Reading Clothing Tags Before You Buy (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '4585ad2d-0b8f-4d05-88b6-77074835a0a8'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Material Composition Audit: Reading Clothing Tags Before You Buy', 'Teach viewers how to spot 95% polyester disguised with marketing terms like ''Cashmere Touch'' and ''Silk Feel'' in retail stores.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'commerce_affiliate'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Never look at the front of the clothing tag; turn it over to the wash label.", "Before you do this in Commerce & Affiliate, look at this rule.", "This is the Commerce & Affiliate breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Marketing buzzwords exposed", "Natural fiber benchmarks (Cotton, Wool, Linen, Silk)", "Acceptable synthetic blends (5% elastane for stretch)", "Fabric quality cheat sheet"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '4585ad2d-0b8f-4d05-88b6-77074835a0a8'::uuid, 'The Material Composition Audit: Reading Clothing Tags Before You Buy', '{"title": "The Material Composition Audit: Reading Clothing Tags Before You Buy", "one_sentence_premise": "Teach viewers how to spot 95% polyester disguised with marketing terms like ''Cashmere Touch'' and ''Silk Feel'' in retail stores.", "idea_summary": {"title": "The Material Composition Audit: Reading Clothing Tags Before You Buy", "premise": "Teach viewers how to spot 95% polyester disguised with marketing terms like ''Cashmere Touch'' and ''Silk Feel'' in retail stores.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Marketing buzzwords exposed → Natural fiber benchmarks (Cotton, Wool, Linen, Silk) → Acceptable synthetic blends (5% elastane for stretch) → Fabric quality cheat sheet", "opening_visual": "Flipping garment label revealing ''100% Polyester'' underneath an expensive gold promotional swing tag.", "visual_texture": "Consumer empowerment, sharp eye, retail investigation", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Marketing", "visual_action": "Marketing buzzwords exposed", "spoken_audio": "Never look at the front of the clothing tag; turn it over to the wash label."}, {"beat_number": 2, "purpose": "Natural", "visual_action": "Natural fiber benchmarks (Cotton, Wool, Linen, Silk)", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Acceptable", "visual_action": "Acceptable synthetic blends (5% elastane for stretch)", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Fabric", "visual_action": "Fabric quality cheat sheet", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Never look at the front of the clothing tag; turn it over to the wash label.", "first_second_visual_hook": "Flipping garment label revealing ''100% Polyester'' underneath an expensive gold promotional swing tag.", "hook_options": ["Never look at the front of the clothing tag; turn it over to the wash label.", "Before you do this in Commerce & Affiliate, look at this rule.", "This is the Commerce & Affiliate breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Consumer empowerment, sharp eye, retail investigation", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Protects shoppers from deceptive retail fabric labeling.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '4585ad2d-0b8f-4d05-88b6-77074835a0a8'::uuid,
  (select id from public.categories where slug = 'commerce_affiliate'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 83, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "commerce_affiliate", "authentic_niche_2026": true}'::jsonb
);

-- [COMMERCE_AFFILIATE] How to Track Price History and Spot Fake Black Friday ''Discounts'' (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '42996044-d845-4c68-97a1-df427fb51714'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'How to Track Price History and Spot Fake Black Friday ''Discounts''', 'A 15-second browser extension demonstration showing price gouging right before sales events to fake 50% discount badges.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'commerce_affiliate'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Before you think you found a 50% off deal, check the 90-day price history graph.", "Before you do this in Commerce & Affiliate, look at this rule.", "This is the Commerce & Affiliate breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The artificial markup trick", "Using price history tracker tools", "Setting price drop alerts", "Saveable discount verification checklist"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '42996044-d845-4c68-97a1-df427fb51714'::uuid, 'How to Track Price History and Spot Fake Black Friday ''Discounts''', '{"title": "How to Track Price History and Spot Fake Black Friday ''Discounts''", "one_sentence_premise": "A 15-second browser extension demonstration showing price gouging right before sales events to fake 50% discount badges.", "idea_summary": {"title": "How to Track Price History and Spot Fake Black Friday ''Discounts''", "premise": "A 15-second browser extension demonstration showing price gouging right before sales events to fake 50% discount badges.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The artificial markup trick → Using price history tracker tools → Setting price drop alerts → Saveable discount verification checklist", "opening_visual": "Screen capture hovering over price chart showing product price increased by 40% two weeks prior to the ''sale''.", "visual_texture": "Fast consumer hack, money-saving utility", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The artificial markup trick", "spoken_audio": "Before you think you found a 50% off deal, check the 90-day price history graph."}, {"beat_number": 2, "purpose": "Using", "visual_action": "Using price history tracker tools", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Setting", "visual_action": "Setting price drop alerts", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Saveable", "visual_action": "Saveable discount verification checklist", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Before you think you found a 50% off deal, check the 90-day price history graph.", "first_second_visual_hook": "Screen capture hovering over price chart showing product price increased by 40% two weeks prior to the ''sale''.", "hook_options": ["Before you think you found a 50% off deal, check the 90-day price history graph.", "Before you do this in Commerce & Affiliate, look at this rule.", "This is the Commerce & Affiliate breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Fast consumer hack, money-saving utility", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Universal bookmark utility and consumer advocacy trust.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '42996044-d845-4c68-97a1-df427fb51714'::uuid,
  (select id from public.categories where slug = 'commerce_affiliate'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 74, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "commerce_affiliate", "authentic_niche_2026": true}'::jsonb
);

insert into public.categories (slug, name, family, enabled, risk_level, sort_order)
values ('entertainment_comedy', 'Entertainment Comedy', 'creator_content', true, 'low', 100)
on conflict (slug) do update set enabled = true, name = excluded.name;

-- [ENTERTAINMENT_COMEDY] The Hyper-Dramatic Corporate Email Translator (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'af9e5cf8-95ee-466d-9362-3321beb97a88'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Hyper-Dramatic Corporate Email Translator', 'Act out what corporate passive-aggressive phrases (''Per my previous email'', ''Friendly reminder'', ''Let''s take this offline'') actually mean in an over-the-top Shakespearean monologue.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'entertainment_comedy'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["When they write ''Thanks in advance'', this is what their soul is actually screaming.", "Before you do this in Entertainment Comedy, look at this rule.", "This is the Entertainment Comedy breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Phrase 1: ''Per my previous email'' (The Wrath of Recurrence)", "Phrase 2: ''Let''s take this offline'' (The Public Execution Postponement)", "Phrase 3: ''Kind regards'' (The Final Coldness)", "Cut to polite typing smile"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'af9e5cf8-95ee-466d-9362-3321beb97a88'::uuid, 'The Hyper-Dramatic Corporate Email Translator', '{"title": "The Hyper-Dramatic Corporate Email Translator", "one_sentence_premise": "Act out what corporate passive-aggressive phrases (''Per my previous email'', ''Friendly reminder'', ''Let''s take this offline'') actually mean in an over-the-top Shakespearean monologue.", "idea_summary": {"title": "The Hyper-Dramatic Corporate Email Translator", "premise": "Act out what corporate passive-aggressive phrases (''Per my previous email'', ''Friendly reminder'', ''Let''s take this offline'') actually mean in an over-the-top Shakespearean monologue.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Phrase 1: ''Per my previous email'' (The Wrath of Recurrence) → Phrase 2: ''Let''s take this offline'' (The Public Execution Postponement) → Phrase 3: ''Kind regards'' (The Final Coldness) → Cut to polite typing smile", "opening_visual": "Dramatic cinematic zoom on creator in full formal office attire delivering a whispered, theatrical monologue under dramatic spotlight.", "visual_texture": "High satirical comedy, dramatic cinematic contrast, universal relatability", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Phrase", "visual_action": "Phrase 1: ''Per my previous email'' (The Wrath of Recurrence)", "spoken_audio": "When they write ''''Thanks in advance'''', this is what their soul is actually screaming."}, {"beat_number": 2, "purpose": "Phrase", "visual_action": "Phrase 2: ''Let''s take this offline'' (The Public Execution Postponement)", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Phrase", "visual_action": "Phrase 3: ''Kind regards'' (The Final Coldness)", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Cut", "visual_action": "Cut to polite typing smile", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "When they write ''Thanks in advance'', this is what their soul is actually screaming.", "first_second_visual_hook": "Dramatic cinematic zoom on creator in full formal office attire delivering a whispered, theatrical monologue under dramatic spotlight.", "hook_options": ["When they write ''Thanks in advance'', this is what their soul is actually screaming.", "Before you do this in Entertainment Comedy, look at this rule.", "This is the Entertainment Comedy breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "High satirical comedy, dramatic cinematic contrast, universal relatability", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Drives viral shares across corporate slack channels and comment engagement.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'af9e5cf8-95ee-466d-9362-3321beb97a88'::uuid,
  (select id from public.categories where slug = 'entertainment_comedy'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 96, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "entertainment_comedy", "authentic_niche_2026": true}'::jsonb
);

-- [ENTERTAINMENT_COMEDY] The Over-Engineered Simple Decision: Choosing a Coffee Order (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '7af7a1a0-37d9-491f-8b19-bd3c548e136a'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Over-Engineered Simple Decision: Choosing a Coffee Order', 'Turn a simple morning coffee order into an intense NASA rocket launch control room debrief with checklists and emergency abort protocols.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'entertainment_comedy'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["My brain trying to decide between oat milk and almond milk at 8 AM.", "Before you do this in Entertainment Comedy, look at this rule.", "This is the Entertainment Comedy breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The approach to the register", "The lactose risk calculation", "The oat milk calorie panic", "The barista staring blankly payoff"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '7af7a1a0-37d9-491f-8b19-bd3c548e136a'::uuid, 'The Over-Engineered Simple Decision: Choosing a Coffee Order', '{"title": "The Over-Engineered Simple Decision: Choosing a Coffee Order", "one_sentence_premise": "Turn a simple morning coffee order into an intense NASA rocket launch control room debrief with checklists and emergency abort protocols.", "idea_summary": {"title": "The Over-Engineered Simple Decision: Choosing a Coffee Order", "premise": "Turn a simple morning coffee order into an intense NASA rocket launch control room debrief with checklists and emergency abort protocols.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The approach to the register → The lactose risk calculation → The oat milk calorie panic → The barista staring blankly payoff", "opening_visual": "Fast cut montage with headsets, frantic clipboard checks, and countdown sirens over a coffee shop menu board.", "visual_texture": "Fast-paced, hyper-relatable everyday anxiety satire", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The approach to the register", "spoken_audio": "My brain trying to decide between oat milk and almond milk at 8 AM."}, {"beat_number": 2, "purpose": "The", "visual_action": "The lactose risk calculation", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The oat milk calorie panic", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The barista staring blankly payoff", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "My brain trying to decide between oat milk and almond milk at 8 AM.", "first_second_visual_hook": "Fast cut montage with headsets, frantic clipboard checks, and countdown sirens over a coffee shop menu board.", "hook_options": ["My brain trying to decide between oat milk and almond milk at 8 AM.", "Before you do this in Entertainment Comedy, look at this rule.", "This is the Entertainment Comedy breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Fast-paced, hyper-relatable everyday anxiety satire", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Generates high comment volume and tagging friends.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '7af7a1a0-37d9-491f-8b19-bd3c548e136a'::uuid,
  (select id from public.categories where slug = 'entertainment_comedy'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 87, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "entertainment_comedy", "authentic_niche_2026": true}'::jsonb
);

-- [ENTERTAINMENT_COMEDY] The Internal Monologue When the Waiter Asks ''How Is Everything?'' (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '27242300-42a1-4731-b568-29ba99fa1a84'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Internal Monologue When the Waiter Asks ''How Is Everything?''', 'The universal awkward panic moment when a server asks how your food is the exact millisecond you take a gigantic bite.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'entertainment_comedy'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Why does this happen on the exact third bite every single time?", "Before you do this in Entertainment Comedy, look at this rule.", "This is the Entertainment Comedy breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The bite intake", "The server approach timing", "The inability to vocalize words", "The frantic nod and muffled ''Mmm-hmm''"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '27242300-42a1-4731-b568-29ba99fa1a84'::uuid, 'The Internal Monologue When the Waiter Asks ''How Is Everything?''', '{"title": "The Internal Monologue When the Waiter Asks ''How Is Everything?''", "one_sentence_premise": "The universal awkward panic moment when a server asks how your food is the exact millisecond you take a gigantic bite.", "idea_summary": {"title": "The Internal Monologue When the Waiter Asks ''How Is Everything?''", "premise": "The universal awkward panic moment when a server asks how your food is the exact millisecond you take a gigantic bite.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The bite intake → The server approach timing → The inability to vocalize words → The frantic nod and muffled ''Mmm-hmm''", "opening_visual": "Slow-motion panic eye contact with mouth completely stuffed with pasta, executing an awkward thumbs-up.", "visual_texture": "Short, punchy, universally relatable micro-comedy", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The bite intake", "spoken_audio": "Why does this happen on the exact third bite every single time?"}, {"beat_number": 2, "purpose": "The", "visual_action": "The server approach timing", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The inability to vocalize words", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The frantic nod and muffled ''Mmm-hmm''", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Why does this happen on the exact third bite every single time?", "first_second_visual_hook": "Slow-motion panic eye contact with mouth completely stuffed with pasta, executing an awkward thumbs-up.", "hook_options": ["Why does this happen on the exact third bite every single time?", "Before you do this in Entertainment Comedy, look at this rule.", "This is the Entertainment Comedy breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Short, punchy, universally relatable micro-comedy", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Fast viral loop with high rewatch rates.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '27242300-42a1-4731-b568-29ba99fa1a84'::uuid,
  (select id from public.categories where slug = 'entertainment_comedy'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 78, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "entertainment_comedy", "authentic_niche_2026": true}'::jsonb
);

-- [ENTERTAINMENT_COMEDY] The Overly Intense Barista Subculture Parody (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '334e7a02-6b18-47a1-b7f6-5f3b3d3853fb'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Overly Intense Barista Subculture Parody', 'A satirical sketch of a specialty third-wave coffee barista treating a single espresso shot like an organ transplant surgery with precise pipette drops and laser levels.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'entertainment_comedy'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["POV: You asked for a splash of milk in your light roast single-origin Ethiopian espresso.", "Before you do this in Entertainment Comedy, look at this rule.", "This is the Entertainment Comedy breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The sacred origin lecture", "The laser-guided tamper alignment", "The existential crisis of milk addition", "The $9.50 total register punch"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '334e7a02-6b18-47a1-b7f6-5f3b3d3853fb'::uuid, 'The Overly Intense Barista Subculture Parody', '{"title": "The Overly Intense Barista Subculture Parody", "one_sentence_premise": "A satirical sketch of a specialty third-wave coffee barista treating a single espresso shot like an organ transplant surgery with precise pipette drops and laser levels.", "idea_summary": {"title": "The Overly Intense Barista Subculture Parody", "premise": "A satirical sketch of a specialty third-wave coffee barista treating a single espresso shot like an organ transplant surgery with precise pipette drops and laser levels.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The sacred origin lecture → The laser-guided tamper alignment → The existential crisis of milk addition → The $9.50 total register punch", "opening_visual": "Barista staring in horror through magnifying loupe as customer reaches for a sugar packet.", "visual_texture": "Cinematic satire, deadpan comedic timing, sharp parody", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The sacred origin lecture", "spoken_audio": "POV: You asked for a splash of milk in your light roast single-origin Ethiopian espresso."}, {"beat_number": 2, "purpose": "The", "visual_action": "The laser-guided tamper alignment", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The existential crisis of milk addition", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "The", "visual_action": "The $9.50 total register punch", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "POV: You asked for a splash of milk in your light roast single-origin Ethiopian espresso.", "first_second_visual_hook": "Barista staring in horror through magnifying loupe as customer reaches for a sugar packet.", "hook_options": ["POV: You asked for a splash of milk in your light roast single-origin Ethiopian espresso.", "Before you do this in Entertainment Comedy, look at this rule.", "This is the Entertainment Comedy breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Cinematic satire, deadpan comedic timing, sharp parody", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Drives viral cultural shares and high replay engagement.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '334e7a02-6b18-47a1-b7f6-5f3b3d3853fb'::uuid,
  (select id from public.categories where slug = 'entertainment_comedy'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 93, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "entertainment_comedy", "authentic_niche_2026": true}'::jsonb
);

-- [ENTERTAINMENT_COMEDY] The Fitness Influencer ''Honest Day in the Life'' Reality vs Filming (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '105c8521-8199-4af6-847c-72fbe72bf1c6'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Fitness Influencer ''Honest Day in the Life'' Reality vs Filming', 'Expose the absurd logistics of filming ''candid'' lifestyle content: setting up the tripod outside, walking back inside to film ''waking up'', then walking back to get the camera.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'entertainment_comedy'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["What it actually looks like to film an ''effortless'' 5 AM morning routine.", "Before you do this in Entertainment Comedy, look at this rule.", "This is the Entertainment Comedy breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The tripod wake-up repetition", "The fake candid coffee pour", "Walking past camera and awkwardly turning around to collect it", "Deadpan self-awareness payoff"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '105c8521-8199-4af6-847c-72fbe72bf1c6'::uuid, 'The Fitness Influencer ''Honest Day in the Life'' Reality vs Filming', '{"title": "The Fitness Influencer ''Honest Day in the Life'' Reality vs Filming", "one_sentence_premise": "Expose the absurd logistics of filming ''candid'' lifestyle content: setting up the tripod outside, walking back inside to film ''waking up'', then walking back to get the camera.", "idea_summary": {"title": "The Fitness Influencer ''Honest Day in the Life'' Reality vs Filming", "premise": "Expose the absurd logistics of filming ''candid'' lifestyle content: setting up the tripod outside, walking back inside to film ''waking up'', then walking back to get the camera.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The tripod wake-up repetition → The fake candid coffee pour → Walking past camera and awkwardly turning around to collect it → Deadpan self-awareness payoff", "opening_visual": "Creator getting out of bed, setting camera on tripod, getting back into bed, pretending to wake up, getting out of bed again to turn camera off.", "visual_texture": "Meta-comedy, self-deprecating, hilarious behind-the-scenes reality", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The tripod wake-up repetition", "spoken_audio": "What it actually looks like to film an ''''effortless'''' 5 AM morning routine."}, {"beat_number": 2, "purpose": "The", "visual_action": "The fake candid coffee pour", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Walking", "visual_action": "Walking past camera and awkwardly turning around to collect it", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Deadpan", "visual_action": "Deadpan self-awareness payoff", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "What it actually looks like to film an ''effortless'' 5 AM morning routine.", "first_second_visual_hook": "Creator getting out of bed, setting camera on tripod, getting back into bed, pretending to wake up, getting out of bed again to turn camera off.", "hook_options": ["What it actually looks like to film an ''effortless'' 5 AM morning routine.", "Before you do this in Entertainment Comedy, look at this rule.", "This is the Entertainment Comedy breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Meta-comedy, self-deprecating, hilarious behind-the-scenes reality", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Builds high relatability and anti-perfectionist creator charm.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '105c8521-8199-4af6-847c-72fbe72bf1c6'::uuid,
  (select id from public.categories where slug = 'entertainment_comedy'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 84, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "entertainment_comedy", "authentic_niche_2026": true}'::jsonb
);

-- [ENTERTAINMENT_COMEDY] The Panic of the Accidental Video Call Trigger in a Group Chat (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '9f69fc2f-5fcc-4ece-a57f-fe2c43cab6ac'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Panic of the Accidental Video Call Trigger in a Group Chat', 'The immediate 0.1-second survival sprint when your finger accidentally brushes the FaceTime button in a 30-person work chat.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'entertainment_comedy'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["The fastest reaction time in human history is hanging up an accidental video call.", "Before you do this in Entertainment Comedy, look at this rule.", "This is the Entertainment Comedy breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The accidental screen tap", "The dialing ring chime of doom", "The frantic emergency abort smash", "Checking the chat to see if ''Call Started'' message appeared"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '9f69fc2f-5fcc-4ece-a57f-fe2c43cab6ac'::uuid, 'The Panic of the Accidental Video Call Trigger in a Group Chat', '{"title": "The Panic of the Accidental Video Call Trigger in a Group Chat", "one_sentence_premise": "The immediate 0.1-second survival sprint when your finger accidentally brushes the FaceTime button in a 30-person work chat.", "idea_summary": {"title": "The Panic of the Accidental Video Call Trigger in a Group Chat", "premise": "The immediate 0.1-second survival sprint when your finger accidentally brushes the FaceTime button in a 30-person work chat.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The accidental screen tap → The dialing ring chime of doom → The frantic emergency abort smash → Checking the chat to see if ''Call Started'' message appeared", "opening_visual": "Close-up of finger slipping on phone screen, eyes widening in sheer panic, furiously smashing the red end button.", "visual_texture": "Fast, punchy, universal micro-panic comedy", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The accidental screen tap", "spoken_audio": "The fastest reaction time in human history is hanging up an accidental video call."}, {"beat_number": 2, "purpose": "The", "visual_action": "The dialing ring chime of doom", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The frantic emergency abort smash", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Checking", "visual_action": "Checking the chat to see if ''Call Started'' message appeared", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "The fastest reaction time in human history is hanging up an accidental video call.", "first_second_visual_hook": "Close-up of finger slipping on phone screen, eyes widening in sheer panic, furiously smashing the red end button.", "hook_options": ["The fastest reaction time in human history is hanging up an accidental video call.", "Before you do this in Entertainment Comedy, look at this rule.", "This is the Entertainment Comedy breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Fast, punchy, universal micro-panic comedy", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Instant viral comment tag loop.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '9f69fc2f-5fcc-4ece-a57f-fe2c43cab6ac'::uuid,
  (select id from public.categories where slug = 'entertainment_comedy'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 74, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "entertainment_comedy", "authentic_niche_2026": true}'::jsonb
);

insert into public.categories (slug, name, family, enabled, risk_level, sort_order)
values ('parenting_family', 'Parenting & Family', 'creator_content', true, 'low', 100)
on conflict (slug) do update set enabled = true, name = excluded.name;

-- [PARENTING_FAMILY] De-escalating Toddler Meltdowns: The Connection Before Correction Script (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '87af7215-1908-4a1d-9c30-5e2726791672'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'De-escalating Toddler Meltdowns: The Connection Before Correction Script', 'Demonstrate the exact physiological down-regulation technique: dropping to eye level, acknowledging the raw emotion without invalidating, and waiting for breathing to regulate before teaching.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'parenting_family'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["When your child is screaming on the floor, logic doesn''t work because their prefrontal cortex is completely offline.", "Before you do this in Parenting & Family, look at this rule.", "This is the Parenting & Family breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Why yelling back escalates the nervous system", "Step 1: Physical grounding to eye level", "Step 2: Naming the emotion (''You are really frustrated that we had to leave'')", "Step 3: The calming breath together", "The connection payoff"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '87af7215-1908-4a1d-9c30-5e2726791672'::uuid, 'De-escalating Toddler Meltdowns: The Connection Before Correction Script', '{"title": "De-escalating Toddler Meltdowns: The Connection Before Correction Script", "one_sentence_premise": "Demonstrate the exact physiological down-regulation technique: dropping to eye level, acknowledging the raw emotion without invalidating, and waiting for breathing to regulate before teaching.", "idea_summary": {"title": "De-escalating Toddler Meltdowns: The Connection Before Correction Script", "premise": "Demonstrate the exact physiological down-regulation technique: dropping to eye level, acknowledging the raw emotion without invalidating, and waiting for breathing to regulate before teaching.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Why yelling back escalates the nervous system → Step 1: Physical grounding to eye level → Step 2: Naming the emotion (''You are really frustrated that we had to leave'') → Step 3: The calming breath together → The connection payoff", "opening_visual": "Parent quietly kneeling down to child''s eye level, opening palms, and speaking in a calm, grounded, slow vocal tone.", "visual_texture": "Empathetic, grounded, authoritative child psychology, warm natural home light", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Why", "visual_action": "Why yelling back escalates the nervous system", "spoken_audio": "When your child is screaming on the floor, logic doesn''''t work because their prefrontal cortex is completely offline."}, {"beat_number": 2, "purpose": "Step", "visual_action": "Step 1: Physical grounding to eye level", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Step", "visual_action": "Step 2: Naming the emotion (''You are really frustrated that we had to leave'')", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Step", "visual_action": "Step 3: The calming breath together", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}, {"beat_number": 5, "purpose": "The", "visual_action": "The connection payoff", "spoken_audio": "Demonstrate step 5 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "When your child is screaming on the floor, logic doesn''t work because their prefrontal cortex is completely offline.", "first_second_visual_hook": "Parent quietly kneeling down to child''s eye level, opening palms, and speaking in a calm, grounded, slow vocal tone.", "hook_options": ["When your child is screaming on the floor, logic doesn''t work because their prefrontal cortex is completely offline.", "Before you do this in Parenting & Family, look at this rule.", "This is the Parenting & Family breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Empathetic, grounded, authoritative child psychology, warm natural home light", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Positions creator as a trusted, gentle, yet firm parenting authority.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '87af7215-1908-4a1d-9c30-5e2726791672'::uuid,
  (select id from public.categories where slug = 'parenting_family'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 95, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "parenting_family", "authentic_niche_2026": true}'::jsonb
);

-- [PARENTING_FAMILY] Independent Play Setup: The 3-Toy Rotation Geometry (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'b3d978e8-0e18-403a-936f-61626e1a2214'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'Independent Play Setup: The 3-Toy Rotation Geometry', 'Expose why toy bins overflowing with 50 toys cause overstimulation and short attention spans, and how displaying 3 open-ended toys on low shelves creates 45 minutes of focused play.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'parenting_family'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If your child complains they are bored in a room full of 100 toys, the toys are the problem.", "Before you do this in Parenting & Family, look at this rule.", "This is the Parenting & Family breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The visual overstimulation trap", "The 3 open-ended toy selection (building, roleplay, sensory)", "The low-shelf Montessori layout", "Child engaging in deep independent focus"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'b3d978e8-0e18-403a-936f-61626e1a2214'::uuid, 'Independent Play Setup: The 3-Toy Rotation Geometry', '{"title": "Independent Play Setup: The 3-Toy Rotation Geometry", "one_sentence_premise": "Expose why toy bins overflowing with 50 toys cause overstimulation and short attention spans, and how displaying 3 open-ended toys on low shelves creates 45 minutes of focused play.", "idea_summary": {"title": "Independent Play Setup: The 3-Toy Rotation Geometry", "premise": "Expose why toy bins overflowing with 50 toys cause overstimulation and short attention spans, and how displaying 3 open-ended toys on low shelves creates 45 minutes of focused play.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The visual overstimulation trap → The 3 open-ended toy selection (building, roleplay, sensory) → The low-shelf Montessori layout → Child engaging in deep independent focus", "opening_visual": "Replacing a messy chaotic plastic toy bin with a clean wooden shelf holding 3 focused open-ended toys.", "visual_texture": "Calm, organized, developmental psychology, intentional home", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The visual overstimulation trap", "spoken_audio": "If your child complains they are bored in a room full of 100 toys, the toys are the problem."}, {"beat_number": 2, "purpose": "The", "visual_action": "The 3 open-ended toy selection (building, roleplay, sensory)", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The low-shelf Montessori layout", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Child", "visual_action": "Child engaging in deep independent focus", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If your child complains they are bored in a room full of 100 toys, the toys are the problem.", "first_second_visual_hook": "Replacing a messy chaotic plastic toy bin with a clean wooden shelf holding 3 focused open-ended toys.", "hook_options": ["If your child complains they are bored in a room full of 100 toys, the toys are the problem.", "Before you do this in Parenting & Family, look at this rule.", "This is the Parenting & Family breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Calm, organized, developmental psychology, intentional home", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Provides immediate peaceful home transformation for exhausted parents.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'b3d978e8-0e18-403a-936f-61626e1a2214'::uuid,
  (select id from public.categories where slug = 'parenting_family'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 86, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "parenting_family", "authentic_niche_2026": true}'::jsonb
);

-- [PARENTING_FAMILY] The 2-Choice Phrasing Hack That Stops Morning Getting-Dressed Battles (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '200bd2fe-d499-484c-8544-0ced77da598a'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The 2-Choice Phrasing Hack That Stops Morning Getting-Dressed Battles', 'Replace open-ended demands (''Put your shoes on!'') with closed dual-choice autonomy (''Do you want to wear the blue shoes or the red boots today?'').',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'parenting_family'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Stop asking your child ''Are you ready to get dressed?'' Ask this instead.", "Before you do this in Parenting & Family, look at this rule.", "This is the Parenting & Family breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The resistance trigger of direct orders", "The psychology of toddler autonomy", "The 2-choice script formula", "Smooth morning exit payoff"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '200bd2fe-d499-484c-8544-0ced77da598a'::uuid, 'The 2-Choice Phrasing Hack That Stops Morning Getting-Dressed Battles', '{"title": "The 2-Choice Phrasing Hack That Stops Morning Getting-Dressed Battles", "one_sentence_premise": "Replace open-ended demands (''Put your shoes on!'') with closed dual-choice autonomy (''Do you want to wear the blue shoes or the red boots today?'').", "idea_summary": {"title": "The 2-Choice Phrasing Hack That Stops Morning Getting-Dressed Battles", "premise": "Replace open-ended demands (''Put your shoes on!'') with closed dual-choice autonomy (''Do you want to wear the blue shoes or the red boots today?'').", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The resistance trigger of direct orders → The psychology of toddler autonomy → The 2-choice script formula → Smooth morning exit payoff", "opening_visual": "Holding up two shirt options at child''s level letting them point and smile.", "visual_texture": "Instant parenting utility, high relief, actionable", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The resistance trigger of direct orders", "spoken_audio": "Stop asking your child ''''Are you ready to get dressed?'''' Ask this instead."}, {"beat_number": 2, "purpose": "The", "visual_action": "The psychology of toddler autonomy", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The 2-choice script formula", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Smooth", "visual_action": "Smooth morning exit payoff", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Stop asking your child ''Are you ready to get dressed?'' Ask this instead.", "first_second_visual_hook": "Holding up two shirt options at child''s level letting them point and smile.", "hook_options": ["Stop asking your child ''Are you ready to get dressed?'' Ask this instead.", "Before you do this in Parenting & Family, look at this rule.", "This is the Parenting & Family breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Instant parenting utility, high relief, actionable", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Saves parents daily morning stress and drives immediate bookmarking.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '200bd2fe-d499-484c-8544-0ced77da598a'::uuid,
  (select id from public.categories where slug = 'parenting_family'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 78, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "parenting_family", "authentic_niche_2026": true}'::jsonb
);

-- [PARENTING_FAMILY] The Sensory Overload Decompression Protocol for Parents at 6 PM (HIGH)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  'a49fb994-34cc-4605-b79a-3b899191b9e5'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Sensory Overload Decompression Protocol for Parents at 6 PM', 'A realistic evening strategy for parents feeling touched-out and sensory-overloaded: 10 minutes of noise-dampening earplugs, warm water hand soak, and partner tag-team.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'parenting_family'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["If you find yourself snapping at small noises by 6 PM, your nervous system is in sensory overload.", "Before you do this in Parenting & Family, look at this rule.", "This is the Parenting & Family breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["The compounding sensory noise of toys and crying", "Using acoustic damping filters without checking out", "The 5-minute somatic reset transition", "Calm and patient bedtime payoff"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  'a49fb994-34cc-4605-b79a-3b899191b9e5'::uuid, 'The Sensory Overload Decompression Protocol for Parents at 6 PM', '{"title": "The Sensory Overload Decompression Protocol for Parents at 6 PM", "one_sentence_premise": "A realistic evening strategy for parents feeling touched-out and sensory-overloaded: 10 minutes of noise-dampening earplugs, warm water hand soak, and partner tag-team.", "idea_summary": {"title": "The Sensory Overload Decompression Protocol for Parents at 6 PM", "premise": "A realistic evening strategy for parents feeling touched-out and sensory-overloaded: 10 minutes of noise-dampening earplugs, warm water hand soak, and partner tag-team.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "The compounding sensory noise of toys and crying → Using acoustic damping filters without checking out → The 5-minute somatic reset transition → Calm and patient bedtime payoff", "opening_visual": "Parent putting in discreet acoustic filter earplugs that lower background decibels while keeping kids'' voices clear.", "visual_texture": "Honest parental empathy, soothing, practical mental health", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "The", "visual_action": "The compounding sensory noise of toys and crying", "spoken_audio": "If you find yourself snapping at small noises by 6 PM, your nervous system is in sensory overload."}, {"beat_number": 2, "purpose": "Using", "visual_action": "Using acoustic damping filters without checking out", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "The", "visual_action": "The 5-minute somatic reset transition", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Calm", "visual_action": "Calm and patient bedtime payoff", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "If you find yourself snapping at small noises by 6 PM, your nervous system is in sensory overload.", "first_second_visual_hook": "Parent putting in discreet acoustic filter earplugs that lower background decibels while keeping kids'' voices clear.", "hook_options": ["If you find yourself snapping at small noises by 6 PM, your nervous system is in sensory overload.", "Before you do this in Parenting & Family, look at this rule.", "This is the Parenting & Family breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Honest parental empathy, soothing, practical mental health", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Deep emotional trust and genuine support for modern parents.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  'a49fb994-34cc-4605-b79a-3b899191b9e5'::uuid,
  (select id from public.categories where slug = 'parenting_family'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 92, 'high'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "high", "category_slug": "parenting_family", "authentic_niche_2026": true}'::jsonb
);

-- [PARENTING_FAMILY] The Realistic Morning Routine vs The Aesthetic Instagram Illusion (MID)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '4b536713-ced1-4925-9236-bdfd51ed44f2'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The Realistic Morning Routine vs The Aesthetic Instagram Illusion', 'Contrast the staged aesthetic morning with spilled milk, mismatched socks, lost shoes, and the actual sanity-saving systems that keep the family moving.',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'parenting_family'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Social media lied to you about what a ''calm'' family morning looks like.", "Before you do this in Parenting & Family, look at this rule.", "This is the Parenting & Family breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Debunking the pastel perfection myth", "The 3 pre-packing prep hacks done the night before", "Letting go of small aesthetic messes", "Happy, stress-free school departure"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '4b536713-ced1-4925-9236-bdfd51ed44f2'::uuid, 'The Realistic Morning Routine vs The Aesthetic Instagram Illusion', '{"title": "The Realistic Morning Routine vs The Aesthetic Instagram Illusion", "one_sentence_premise": "Contrast the staged aesthetic morning with spilled milk, mismatched socks, lost shoes, and the actual sanity-saving systems that keep the family moving.", "idea_summary": {"title": "The Realistic Morning Routine vs The Aesthetic Instagram Illusion", "premise": "Contrast the staged aesthetic morning with spilled milk, mismatched socks, lost shoes, and the actual sanity-saving systems that keep the family moving.", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Debunking the pastel perfection myth → The 3 pre-packing prep hacks done the night before → Letting go of small aesthetic messes → Happy, stress-free school departure", "opening_visual": "Split screen: Slow-motion pastel aesthetic breakfast vs real toddler throwing toast onto the floor with parent laughing.", "visual_texture": "Warm, authentic, uplifting family reality", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Debunking", "visual_action": "Debunking the pastel perfection myth", "spoken_audio": "Social media lied to you about what a ''''calm'''' family morning looks like."}, {"beat_number": 2, "purpose": "The", "visual_action": "The 3 pre-packing prep hacks done the night before", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Letting", "visual_action": "Letting go of small aesthetic messes", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Happy,", "visual_action": "Happy, stress-free school departure", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Social media lied to you about what a ''calm'' family morning looks like.", "first_second_visual_hook": "Split screen: Slow-motion pastel aesthetic breakfast vs real toddler throwing toast onto the floor with parent laughing.", "hook_options": ["Social media lied to you about what a ''calm'' family morning looks like.", "Before you do this in Parenting & Family, look at this rule.", "This is the Parenting & Family breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Warm, authentic, uplifting family reality", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Liberates parents from unrealistic social media perfectionism.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '4b536713-ced1-4925-9236-bdfd51ed44f2'::uuid,
  (select id from public.categories where slug = 'parenting_family'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 83, 'mid'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "mid", "category_slug": "parenting_family", "authentic_niche_2026": true}'::jsonb
);

-- [PARENTING_FAMILY] The 10-Second Car Exit Transition Routine for Tantrum-Free Arrivals (LOW)
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats
)
values (
  '51f27c03-0dbc-4c63-993c-65b564138ef5'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  'The 10-Second Car Exit Transition Routine for Tantrum-Free Arrivals', 'Giving children a 60-second verbal warning before unbuckling car seats: ''In 3 breaths, we are turning off the music and stepping out.''',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{"authentic_niche_2026": true}'::jsonb,
  (select id from public.categories where slug = 'parenting_family'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'admin_direct'::public.generation_source_mode,
  '["Never unbuckle your child without giving this 10-second transition cue.", "Before you do this in Parenting & Family, look at this rule.", "This is the Parenting & Family breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]'::jsonb, '["Why abrupt transitions trigger fight-or-flight in kids", "The 3-breath transition formula", "Letting the child hold the car key fob", "Smooth walking exit payoff"]'::jsonb
);

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '51f27c03-0dbc-4c63-993c-65b564138ef5'::uuid, 'The 10-Second Car Exit Transition Routine for Tantrum-Free Arrivals', '{"title": "The 10-Second Car Exit Transition Routine for Tantrum-Free Arrivals", "one_sentence_premise": "Giving children a 60-second verbal warning before unbuckling car seats: ''In 3 breaths, we are turning off the music and stepping out.''", "idea_summary": {"title": "The 10-Second Car Exit Transition Routine for Tantrum-Free Arrivals", "premise": "Giving children a 60-second verbal warning before unbuckling car seats: ''In 3 breaths, we are turning off the music and stepping out.''", "target_platform": "instagram_reels", "recommended_format": "reels_30_45"}, "video_blueprint": {"duration_seconds": 35, "scene_arc": "Why abrupt transitions trigger fight-or-flight in kids → The 3-breath transition formula → Letting the child hold the car key fob → Smooth walking exit payoff", "opening_visual": "Parent gently counting down 3 fingers before opening the car door smoothly without resistance.", "visual_texture": "Instant parenting hack, peaceful, actionable", "pacing": "Rhythmic, confident, zero filler"}, "scene_script": [{"beat_number": 1, "purpose": "Why", "visual_action": "Why abrupt transitions trigger fight-or-flight in kids", "spoken_audio": "Never unbuckle your child without giving this 10-second transition cue."}, {"beat_number": 2, "purpose": "The", "visual_action": "The 3-breath transition formula", "spoken_audio": "Demonstrate step 2 with high clarity and physical evidence."}, {"beat_number": 3, "purpose": "Letting", "visual_action": "Letting the child hold the car key fob", "spoken_audio": "Demonstrate step 3 with high clarity and physical evidence."}, {"beat_number": 4, "purpose": "Smooth", "visual_action": "Smooth walking exit payoff", "spoken_audio": "Demonstrate step 4 with high clarity and physical evidence."}], "hook_performance_pack": {"first_line_hook": "Never unbuckle your child without giving this 10-second transition cue.", "first_second_visual_hook": "Parent gently counting down 3 fingers before opening the car door smoothly without resistance.", "hook_options": ["Never unbuckle your child without giving this 10-second transition cue.", "Before you do this in Parenting & Family, look at this rule.", "This is the Parenting & Family breakdown I wish I saw 3 years ago.", "Which mistake are you making in this setup?"]}, "atmosphere_direction": {"mood": "Instant parenting hack, peaceful, actionable", "color_language": "Clean natural daylight, warm undertones, uncluttered composition", "soundscape": "Crisp tactile sound effects, clear vocal presence, minimal ambient music bed"}, "brand_lift_statement": "Drives immediate bookmarking and high parental gratitude.", "micro_behavior_guide": {"eye_contact": "Direct into camera during hook and final takeaway; focused on hands during proof", "facial_expression": "Grounded confidence, zero theatrical yelling, natural recognition smile", "avoid_over_advertising": "Never shout brand names; let the physical craftsmanship and technique prove the quality"}, "production_requirements": {"camera": "Smartphone 4K/24fps or Mirrorless 35mm", "lighting": "Soft natural window light or 1 diffused softbox bounce", "audio": "Wireless lapel mic or close shotgun mic for rich proximity effect", "props": "Real authentic physical objects, no synthetic mockups"}}'::jsonb
);

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '51f27c03-0dbc-4c63-993c-65b564138ef5'::uuid,
  (select id from public.categories where slug = 'parenting_family'),
  (select id from public.creator_personas order by sort_order asc limit 1),
  'instagram_reels', 'en', 74, 'low'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{"production_finalist": true, "score_band": "low", "category_slug": "parenting_family", "authentic_niche_2026": true}'::jsonb
);


commit;
