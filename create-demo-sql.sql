-- =====================================================
-- DEMO ACCOUNT SETUP SQL (run in Supabase Studio SQL editor)
-- =====================================================
-- 1. First create the account normally via the website signup at /login
--    Use: demo.creator@viralbox.test  /  DemoViralBox2026!
-- 2. Then run this SQL (replace the email if needed)
-- 3. This will give the user 1 x $500 box (sealed) and 1 x $1000 box (opened)

-- Get the user id
DO $$
DECLARE
  demo_user_id uuid;
  cat_id uuid;
  per_id uuid;
  box500_id uuid;
  box1000_id uuid;
  delivery500_id uuid := gen_random_uuid();
  delivery1000_id uuid := gen_random_uuid();
  idea1_id uuid := gen_random_uuid();
  idea2_id uuid := gen_random_uuid();
BEGIN
  -- Find the demo user
  SELECT id INTO demo_user_id 
  FROM auth.users 
  WHERE email = 'demo.creator@viralbox.test' 
  LIMIT 1;

  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'User demo.creator@viralbox.test not found. Please sign up first at /login.';
  END IF;

  -- Find category + persona (beauty + luxury_editor)
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'beauty' LIMIT 1;
  SELECT id INTO per_id FROM public.creator_personas WHERE slug = 'luxury_editor' LIMIT 1;

  IF cat_id IS NULL OR per_id IS NULL THEN
    RAISE EXCEPTION 'Required category or persona not found. Make sure seeds are loaded.';
  END IF;

  -- Find box products
  SELECT id INTO box500_id FROM public.box_products WHERE slug = 'viral_box_500' LIMIT 1;
  SELECT id INTO box1000_id FROM public.box_products WHERE slug = 'premium_viral_box_1000' LIMIT 1;

  IF box500_id IS NULL OR box1000_id IS NULL THEN
    RAISE EXCEPTION 'Box products not found. Run seeds.';
  END IF;

  -- Create sample idea cards (these are what the user will see)
  INSERT INTO public.idea_cards (idea_id, title, card)
  VALUES 
  (idea1_id, 'The Decision Filter Before the Final Shot', 
   jsonb_build_object(
     'one_sentence_premise', 'Show the three important choices that happen before the polished final look.',
     'idea_summary', jsonb_build_object('title', 'The Decision Filter Before the Final Shot'),
     'video_blueprint', jsonb_build_object('duration_seconds', 28, 'opening_visual', 'Close-up of perfect final result'),
     'scene_script', jsonb_build_array(
       jsonb_build_object('purpose', 'Hook', 'beat', 'Reveal the final polished shot'),
       jsonb_build_object('purpose', 'Proof', 'beat', 'Walk through the 3 decision filters'),
       jsonb_build_object('purpose', 'CTA', 'beat', 'Saveable checklist')
     ),
     'brand_lift_statement', 'Makes you look like someone with real taste and standards.',
     'b_roll_plan', jsonb_build_array('Product texture', 'Hands making choices', 'Before/after comparison'),
     'caption_pack', jsonb_build_object('caption_options', jsonb_build_array('What do you remove to make it better?'))
   )),

  (idea2_id, 'Edit to Look Expensive (Not Just Styled)', 
   jsonb_build_object(
     'one_sentence_premise', 'Luxury often comes from what you take away, not what you add.',
     'idea_summary', jsonb_build_object('title', 'Edit to Look Expensive'),
     'video_blueprint', jsonb_build_object('duration_seconds', 31),
     'scene_script', jsonb_build_array(
       jsonb_build_object('purpose', 'Problem', 'beat', 'Over-accessorized starting look'),
       jsonb_build_object('purpose', 'Process', 'beat', 'Live elimination'),
       jsonb_build_object('purpose', 'Payoff', 'beat', 'Final restrained version')
     ),
     'brand_lift_statement', 'Positions you as a person with sophisticated judgment.'
   ));

  -- Create the two deliveries
  INSERT INTO public.idea_box_deliveries (id, user_id, box_product_id, category_id, persona_id, status, allocation, delivered_at, created_at)
  VALUES 
    (delivery500_id, demo_user_id, box500_id, cat_id, per_id, 'delivered', '{"low":1,"high":1}'::jsonb, now(), now()),
    (delivery1000_id, demo_user_id, box1000_id, cat_id, per_id, 'delivered', '{"low":2,"mid":1,"high":2}'::jsonb, now(), now());

  -- Link items (this is what makes the cards appear in the vault)
  INSERT INTO public.idea_box_items (id, delivery_id, user_id, inventory_id, idea_id, slot_index, assigned_band)
  VALUES 
    (gen_random_uuid(), delivery500_id, demo_user_id, gen_random_uuid(), idea1_id, 1, 'high'),
    (gen_random_uuid(), delivery1000_id, demo_user_id, gen_random_uuid(), idea1_id, 1, 'low'),
    (gen_random_uuid(), delivery1000_id, demo_user_id, gen_random_uuid(), idea2_id, 2, 'high');

  -- Mark the $1000 box as already opened so the user sees cards immediately
  UPDATE public.idea_box_deliveries 
  SET metadata = jsonb_build_object('opened_at', now(), 'opened_by', demo_user_id::text)
  WHERE id = delivery1000_id;

  -- Make sure profile is correct
  UPDATE public.profiles SET role = 'creator', display_name = 'Demo Creator' WHERE id = demo_user_id;

  RAISE NOTICE '✅ SUCCESS!';
  RAISE NOTICE 'Demo account now has:';
  RAISE NOTICE '  - 1x $500 box (SEALED)';
  RAISE NOTICE '  - 1x $1000 box (OPENED with 2 sample cards)';
  RAISE NOTICE 'Login with: demo.creator@viralbox.test / DemoViralBox2026!';
END $$;