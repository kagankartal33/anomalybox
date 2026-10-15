update public.categories
set enabled = false,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'removed_from_app', true,
      'removed_reason', 'restricted_category_not_offered',
      'removed_at', coalesce(metadata->>'removed_at', now()::text)
    ),
    updated_at = now()
where slug in (
  'absurd_procedure',
  'adult_content',
  'adult_entertainment_service',
  'beautymodelingadult_content',
  'book_launch_content',
  'bureaucratic_comedy',
  'casino',
  'celebrity_fan_lore',
  'comedy_worldbuilding',
  'gambling_and_casinos',
  'gun_range',
  'literary_lifestyle',
  'lottery_retailer',
  'narrative_serial_content',
  'sex_therapist',
  'showsadult_content',
  'tobacco_store',
  'visual_meme_post'
);
