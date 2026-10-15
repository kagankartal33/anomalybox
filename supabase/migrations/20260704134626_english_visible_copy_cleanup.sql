-- Normalize app-visible category labels and internal policy copy to English.
-- This keeps stable slugs/routes intact while removing legacy Turkish labels
-- from onboarding, store, admin review, and generator context payloads.

update public.categories
set
  name = case slug
    when 'animal_content' then 'Animal Content'
    when 'business_and_entrepreneurship' then 'Business & Entrepreneurship'
    when 'education_and_learning' then 'Education & Learning'
    when 'fitness' then 'Fitness'
    when 'food_and_cooking' then 'Food & Cooking'
    when 'gaming' then 'Gaming'
    when 'health_and_medical' then 'Health & Medical'
    when 'mental_health' then 'Mental Health'
    when 'parenting' then 'Parenting'
    when 'travel' then 'Travel'
    when '2026_i_erik_reticisi_trendleri' then '2026 Creator Trends'
    else name
  end,
  metadata = case slug
    when 'real_estate' then jsonb_set(coalesce(metadata, '{}'::jsonb), '{aliases}', '["Real Estate"]'::jsonb, true)
    when 'science' then jsonb_set(coalesce(metadata, '{}'::jsonb), '{aliases}', '["Science"]'::jsonb, true)
    else metadata
  end,
  updated_at = now()
where slug in (
  'animal_content',
  'business_and_entrepreneurship',
  'education_and_learning',
  'fitness',
  'food_and_cooking',
  'gaming',
  'health_and_medical',
  'mental_health',
  'parenting',
  'travel',
  '2026_i_erik_reticisi_trendleri',
  'real_estate',
  'science'
);

with english_policies(policy_slug, summary, layer_effects) as (
  values
  (
    'global_creator_premium_default',
    'Gives every category a premium card backbone: brand value, creator fit, pacing, risk control, and platform adaptation.',
    jsonb_build_object(
      'brand_lift_layer', 'Explains the short brand value the idea adds to the influencer.',
      'creator_style_adapter', 'Adapts the same idea to creator tone, energy level, and creator mode.',
      'scene_energy_curve_layer', 'Manages the first second, premise, proof, payoff, and CTA rhythm.',
      'risk_reputation_layer', 'Reduces claim, sponsor, reputation, and sensitivity risk for high-profile creators.',
      'platform_conversion_layer', 'Makes Reels, Story, Carousel, and Shorts versions practical.'
    )
  ),
  (
    'creator_content_family_default',
    'Enriches long-tail creator categories with audience identity and actionable platform behavior instead of a blank template.',
    jsonb_build_object(
      'audience_identity_layer', 'Connects the idea to the micro-community the follower wants to belong to.',
      'comment_trigger_layer', 'Adds a safe discussion prompt or comment question.',
      'save_worthy_utility_layer', 'Turns the card into a save-worthy checklist or decision filter.'
    )
  ),
  (
    'beauty_premium_proof_policy',
    'Moves beauty ideas toward close-up proof, safe claim boundaries, and premium texture without feeling like an ad.',
    jsonb_build_object(
      'proof_without_boring_layer', 'Shows product or ritual proof through close-ups, mini tests, and context.',
      'luxury_signal_layer', 'Creates a texture, lighting, and quiet premium edit feel.',
      'sponsor_softness_layer', 'Softens sponsored integration through natural-use moments and disclosure.'
    )
  ),
  (
    'fashion_status_identity_policy',
    'Turns fashion ideas into style decisions with status, identity, and a comment engine, not only outfit display.',
    jsonb_build_object(
      'status_shift_layer', 'Moves creator perception toward more premium, bold, or accessible taste.',
      'audience_identity_layer', 'Links the style to an aesthetic group followers want to belong to.',
      'comment_trigger_layer', 'Turns the outfit choice into a safe two-option comment question.'
    )
  ),
  (
    'luxury_signal_policy',
    'Makes luxury content feel expensive but calm, positioning the influencer as a selective editor.',
    jsonb_build_object(
      'luxury_signal_layer', 'Builds a quiet, detail-led language with quality light and sound.',
      'status_shift_layer', 'Creates the perception that the creator has a high taste standard.',
      'sponsor_softness_layer', 'Keeps premium brand integration subtle, safe, and low-pressure.'
    )
  ),
  (
    'travel_local_save_policy',
    'Turns travel ideas into atmosphere, location intelligence, and save-worthy route or hotel decisions.',
    jsonb_build_object(
      'cultural_localization_layer', 'Adds a shoot mode that fits the city, hotel, car, or holiday context.',
      'save_worthy_utility_layer', 'Gives followers a reusable route or checklist value.',
      'audience_identity_layer', 'Connects the idea to a specific travel style and audience.'
    )
  ),
  (
    'food_sensory_save_policy',
    'Turns food ideas into taste and texture proof, order decisions, and save-worthy guides.',
    jsonb_build_object(
      'proof_without_boring_layer', 'Shows taste, texture, and service details.',
      'comment_trigger_layer', 'Builds a comment engine around which choice is better or worth it.',
      'relatability_break_layer', 'Softens perfect food aesthetics with a real human moment.'
    )
  ),
  (
    'fitness_wellness_safe_policy',
    'Limits health claims in wellness ideas while creating safe routines and practical checklists.',
    jsonb_build_object(
      'risk_reputation_layer', 'Controls health, body-claim, and before/after risk.',
      'save_worthy_utility_layer', 'Creates a safe routine or decision list.',
      'relatability_break_layer', 'Replaces perfect-body promises with a realistic process feel.'
    )
  ),
  (
    'parenting_family_reputation_policy',
    'Protects child privacy and balances warmth with safety in family and parenting content.',
    jsonb_build_object(
      'risk_reputation_layer', 'Controls minor privacy and family sensitivity.',
      'relatability_break_layer', 'Makes polished family performance feel more human.',
      'audience_identity_layer', 'Speaks to followers who recognize the same parenting moment.'
    )
  ),
  (
    'creator_education_utility_policy',
    'Turns education ideas into save-worthy mini lessons and expertise signals for creators.',
    jsonb_build_object(
      'save_worthy_utility_layer', 'Creates a checklist, decision tree, or mini guide.',
      'proof_without_boring_layer', 'Builds trust through examples, proof, or comparison.',
      'status_shift_layer', 'Positions the creator as an expert who makes the subject simple.'
    )
  ),
  (
    'thought_leadership_tension_policy',
    'Makes thought leadership ideas discussable while keeping reputation risk under control.',
    jsonb_build_object(
      'viral_tension_layer', 'Creates a small idea tension: is it excessive, necessary, or misunderstood?',
      'status_shift_layer', 'Positions the creator as clear-thinking and responsible.',
      'comment_trigger_layer', 'Opens a comment question without forcing polarization.'
    )
  ),
  (
    'entertainment_comedy_ritual_policy',
    'Turns comedy ideas from one-off jokes into repeatable rituals, timing systems, and audience in-jokes.',
    jsonb_build_object(
      'ritual_series_layer', 'Turns the joke into a repeatable series or ritual.',
      'viral_tension_layer', 'Creates watch motivation through a small absurd tension.',
      'relatability_break_layer', 'Makes polished performance feel human and shareable.'
    )
  ),
  (
    'bureaucratic_absurd_policy',
    'Packages bureaucratic comedy as a procedural game with a repeatable format and safe comment engine.',
    jsonb_build_object(
      'absurd_procedure_layer', 'Turns illogical rules or paperwork processes into safe absurd play.',
      'ritual_series_layer', 'Creates a repeatable series language around forms, institutions, or approvals.',
      'comment_trigger_layer', 'Builds a safe question that invites followers to share their own experience.'
    )
  ),
  (
    'absurd_procedure_policy',
    'Turns absurd processes into comedy mechanisms without encouraging harmful behavior.',
    jsonb_build_object(
      'absurd_procedure_layer', 'Turns an impossible but familiar rule into a comic system.',
      'viral_tension_layer', 'Keeps viewers watching to see where the absurd rule leads.',
      'ritual_series_layer', 'Makes the format repeatable.'
    )
  ),
  (
    'book_launch_story_policy',
    'Packages book and author content as story-world, series, and reader identity instead of simple sales posts.',
    jsonb_build_object(
      'narrative_serial_layer', 'Turns the book idea into a curiosity-building series.',
      'audience_identity_layer', 'Creates reader belonging and curiosity.',
      'ritual_series_layer', 'Splits the launch process into repeatable episodes.'
    )
  ),
  (
    'literary_lifestyle_policy',
    'Moves literary lifestyle content toward aesthetic reader identity and repeatable ritual formats.',
    jsonb_build_object(
      'audience_identity_layer', 'Claims a reader/writer aesthetic group.',
      'narrative_serial_layer', 'Turns a reading or writing moment into a mini story arc.',
      'ritual_series_layer', 'Turns a single idea into a weekly reader ritual.'
    )
  ),
  (
    'narrative_serial_policy',
    'Turns serial content into a format system that manages cliffhangers, payoff, and follower response.',
    jsonb_build_object(
      'narrative_serial_layer', 'Builds episode, cliffhanger, and payoff rhythm.',
      'viral_tension_layer', 'Carries curiosity into the next episode.',
      'comment_trigger_layer', 'Turns follower predictions into a comment engine.'
    )
  ),
  (
    'comedy_worldbuilding_policy',
    'Turns comedy worlds into lore, rituals, and recurring-joke systems without copying characters.',
    jsonb_build_object(
      'comedy_worldbuilding_layer', 'Builds an original content world, recurring-joke logic, and lore skeleton.',
      'narrative_serial_layer', 'Creates an episode flow that reveals the world piece by piece.',
      'ritual_series_layer', 'Creates a repeatable format followers recognize.'
    )
  ),
  (
    'commerce_affiliate_trust_policy',
    'Turns affiliate and sponsor ideas into natural, disclosure-safe content with a decision filter.',
    jsonb_build_object(
      'sponsor_softness_layer', 'Reduces sales pressure and adds disclosure.',
      'proof_without_boring_layer', 'Shows the product through proof and context.',
      'save_worthy_utility_layer', 'Gives followers a checklist to use before buying.'
    )
  ),
  (
    'celebrity_fan_lore_safe_policy',
    'Turns fan and lore content into audience-owned formats while controlling name, likeness, and reputation risk.',
    jsonb_build_object(
      'audience_identity_layer', 'Creates belonging and inside-context feeling for the fan audience.',
      'ritual_series_layer', 'Turns lore commentary into a repeatable series.',
      'risk_reputation_layer', 'Reduces imitation, defamation, and likeness risk.'
    )
  ),
  (
    'visual_meme_post_policy',
    'Builds visual meme and post ideas as new comment-triggering patterns instead of copied surfaces.',
    jsonb_build_object(
      'comment_trigger_layer', 'Opens a discussion or choice question under the visual.',
      'viral_tension_layer', 'Turns the small contradiction inside the meme into safe tension.',
      'platform_conversion_layer', 'Adapts the same idea into Reels, Story, and Carousel variants.'
    )
  ),
  (
    'author_brand_content_policy',
    'Turns the author brand into a premium creator brand through process, story world, and reader relationship.',
    jsonb_build_object(
      'brand_lift_layer', 'Positions the author as a creator with an idea world, not only a book seller.',
      'narrative_serial_layer', 'Turns the writing process into a followable series.',
      'audience_identity_layer', 'Gives readers the feeling of joining early.'
    )
  )
)
update public.category_layer_policies p
set
  practical_effects = jsonb_set(
    jsonb_set(coalesce(p.practical_effects, '{}'::jsonb), '{summary}', to_jsonb(e.summary), true),
    '{layer_effects}',
    e.layer_effects,
    true
  ),
  updated_at = now()
from english_policies e
where p.policy_slug = e.policy_slug;
