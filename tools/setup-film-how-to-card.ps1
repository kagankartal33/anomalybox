# Seeds the site promo filming card + sealed SIGNATURE PURPLE BOX for the demo creator.

param(
  [string]$Email = "demo.creator@viralbox.test"
)

$ErrorActionPreference = "Stop"

$ideaId = "a1b2c3d4-film-howto-0001-000000000001"
$inventoryId = "b2c3d4e5-film-howto-0002-000000000002"
$deliveryId = "c3d4e5f6-film-howto-0003-000000000003"
$itemId = "d4e5f6a7-film-howto-0004-000000000004"

$cardJson = @'
{
  "idea_summary": {
    "title": "The Scene Flow Save",
    "premise": "Open your sealed box, read Scene Flow, and turn one private card into a shootable reel."
  },
  "one_sentence_premise": "A private card that moves you from phone to reel in fifteen seconds.",
  "why_it_can_work": "Creators save when the hook, proof, and CTA are already structured.",
  "brand_lift_statement": "Positions you as a creator who shoots with intention, not guesswork.",
  "video_blueprint": {
    "duration_seconds": 15,
    "opening_visual": "Phone screen showing sealed SIGNATURE PURPLE BOX in Creator Vault.",
    "scene_arc": "Vault reveal -> Scene Flow read -> proof shoot -> save CTA."
  },
  "execution_beats": [
    {"start": 0, "end": 3, "purpose": "Hook", "primary_action": "Reveal sealed SIGNATURE PURPLE BOX in Creator Vault.", "on_screen_text": "Private, not public", "voiceover": "Not another idea dump."},
    {"start": 3, "end": 7, "purpose": "Premise", "primary_action": "Open Scene Flow and read the first beat before filming.", "on_screen_text": "Read before you shoot", "voiceover": "A private card built to shoot."},
    {"start": 7, "end": 12, "purpose": "Proof", "primary_action": "Film one clean proof gesture with a single beauty prop.", "on_screen_text": "One beat. One take.", "voiceover": "Hook. Proof. Payoff."},
    {"start": 12, "end": 15, "purpose": "CTA", "primary_action": "End on a saveable filter and post the reel.", "on_screen_text": "Save the filter", "voiceover": "Built to be shot, not brainstormed."}
  ],
  "scene_script": [
    {"second": "0-3", "purpose": "attention", "voiceover": "Not another idea dump.", "on_screen_text": "Private, not public"},
    {"second": "3-7", "purpose": "premise", "voiceover": "A private card built to shoot.", "on_screen_text": "Read before you shoot"},
    {"second": "7-12", "purpose": "proof", "voiceover": "Hook. Proof. Payoff.", "on_screen_text": "One beat. One take."},
    {"second": "12-15", "purpose": "cta", "voiceover": "Built to be shot, not brainstormed.", "on_screen_text": "Save the filter"}
  ],
  "shot_list": [
    {"second": "0-3", "shot": "Phone screen over shoulder", "action": "Show Creator Vault and sealed purple box.", "overlay": "Private, not public"},
    {"second": "3-7", "shot": "Scene Flow close-up", "action": "Tap first beat and read what to do.", "overlay": "Read before you shoot"},
    {"second": "7-12", "shot": "Medium creator frame", "action": "Film one proof gesture with a beauty prop.", "overlay": "One beat. One take."},
    {"second": "12-15", "shot": "Reel end frame", "action": "Hold save CTA long enough to screenshot.", "overlay": "Save the filter"}
  ],
  "caption_pack": {
    "caption_options": ["Built to be shot, not brainstormed.", "Save this Scene Flow before your next reel."],
    "cta": "Explore the Store and open your first private box."
  },
  "brand_safety": {
    "disclosure_text": "If sponsored, use #ad at the start of the caption and video.",
    "claim_boundary": "Personal context only. No universal result promises.",
    "do_not_say": ["Guaranteed viral", "Works for everyone"]
  },
  "variant_pack": {
    "short_15s": "Vault reveal, Scene Flow read, one proof beat, save CTA."
  }
}
'@ -replace "'", "''"

$sql = @"
DO `$$
DECLARE
  demo_user_id uuid;
  cat_id uuid;
  per_id uuid;
  box_id uuid;
BEGIN
  SELECT id INTO demo_user_id FROM auth.users WHERE email = '$Email' LIMIT 1;
  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'User $Email not found. Sign up first at /login.';
  END IF;

  SELECT id INTO cat_id FROM public.categories WHERE slug = 'beauty' LIMIT 1;
  SELECT id INTO per_id FROM public.creator_personas WHERE slug = 'luxury_editor' LIMIT 1;
  SELECT id INTO box_id FROM public.box_products WHERE slug = 'premium_viral_box_1000' LIMIT 1;

  INSERT INTO public.idea_cards (idea_id, title, card)
  VALUES ('$ideaId', 'The Scene Flow Save', '$cardJson'::jsonb)
  ON CONFLICT (idea_id) DO UPDATE SET title = excluded.title, card = excluded.card, updated_at = now();

  INSERT INTO public.idea_inventory (
    id, idea_id, category_id, persona_id, platform, language, content_style_layers,
    internal_rank_score, score_band, quality_floor_passed, status, reuse_count, max_reuse_count, metadata
  ) VALUES (
    '$inventoryId', '$ideaId', cat_id, per_id, 'instagram_reels', 'en', array['premium_video_blueprint']::text[],
    92, 'high', true, 'available', 0, 1, '{"promo":"site_ad"}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;

  DELETE FROM public.idea_box_items WHERE delivery_id = '$deliveryId';
  DELETE FROM public.idea_box_deliveries WHERE id = '$deliveryId';

  INSERT INTO public.idea_box_deliveries (
    id, user_id, box_product_id, category_id, persona_id, status, allocation, delivered_at, created_at, metadata
  ) VALUES (
    '$deliveryId', demo_user_id, box_id, cat_id, per_id, 'delivered',
    '{"low":1,"mid":1,"high":1}'::jsonb, now(), now(), '{}'::jsonb
  );

  INSERT INTO public.idea_box_items (
    id, delivery_id, user_id, inventory_id, idea_id, slot_index, assigned_band
  ) VALUES (
    '$itemId', '$deliveryId', demo_user_id, '$inventoryId', '$ideaId', 1, 'high'
  );

  RAISE NOTICE 'Promo filming card ready for % at /cards/$ideaId', '$Email';
END `$$;
"@

$sql | docker exec -i supabase_db_ViralBox psql -U postgres -d postgres -v ON_ERROR_STOP=1
Write-Host "Seeded promo card $ideaId with sealed purple box delivery $deliveryId"