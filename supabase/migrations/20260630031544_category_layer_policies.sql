create table public.category_layer_policies (
  id uuid primary key default gen_random_uuid(),
  policy_slug text not null unique,
  scope_type text not null check (scope_type in ('category', 'family', 'fallback')),
  category_slug text,
  category_family text,
  platform text not null default 'instagram_reels',
  required_layers text[] not null default '{}',
  optional_layers text[] not null default '{}',
  premium_layers text[] not null default '{}',
  restricted_layers text[] not null default '{}',
  practical_effects jsonb not null default '{}'::jsonb,
  generator_instructions text[] not null default '{}',
  quality_rules jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (policy_slug = lower(policy_slug)),
  check (policy_slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  check (
    (scope_type = 'category' and category_slug is not null and category_family is null)
    or (scope_type = 'family' and category_family is not null and category_slug is null)
    or (scope_type = 'fallback' and category_slug is null and category_family is null)
  )
);

create unique index category_layer_policies_category_uidx
on public.category_layer_policies(category_slug, platform)
where scope_type = 'category';

create unique index category_layer_policies_family_uidx
on public.category_layer_policies(category_family, platform)
where scope_type = 'family';

create unique index category_layer_policies_fallback_uidx
on public.category_layer_policies(platform)
where scope_type = 'fallback';

create index category_layer_policies_enabled_idx
on public.category_layer_policies(enabled, scope_type, platform);

create trigger category_layer_policies_set_updated_at
before update on public.category_layer_policies
for each row execute function public.set_updated_at();

alter table public.category_layer_policies enable row level security;

revoke all privileges on public.category_layer_policies from public, anon, authenticated;
grant all privileges on public.category_layer_policies to service_role;

create or replace function public.category_layer_policy_for_scope(
  p_category_slug text,
  p_platform text default 'instagram_reels',
  p_box_product_slug text default null
)
returns table (
  policy_slug text,
  scope_type text,
  category_slug text,
  category_family text,
  platform text,
  required_layers text[],
  optional_layers text[],
  premium_layers text[],
  restricted_layers text[],
  effective_layers text[],
  practical_effects jsonb,
  generator_instructions text[],
  quality_rules jsonb,
  metadata jsonb
)
language sql
security invoker
set search_path = public, pg_temp
as $$
  with category_context as (
    select c.family
    from public.categories c
    where c.slug = p_category_slug
    limit 1
  ),
  ranked as (
    select
      policy.*,
      case
        when policy.scope_type = 'category' and policy.category_slug = p_category_slug then 0
        when policy.scope_type = 'family' and policy.category_family = (select family from category_context) then 1
        when policy.scope_type = 'fallback' then 2
        else 9
      end as scope_rank
    from public.category_layer_policies policy
    where policy.enabled = true
      and policy.platform in (coalesce(p_platform, 'instagram_reels'), 'instagram_reels')
      and (
        (policy.scope_type = 'category' and policy.category_slug = p_category_slug)
        or (policy.scope_type = 'family' and policy.category_family = (select family from category_context))
        or policy.scope_type = 'fallback'
      )
  ),
  selected as (
    select *
    from ranked
    order by scope_rank, case when platform = p_platform then 0 else 1 end, policy_slug
    limit 1
  )
  select
    selected.policy_slug,
    selected.scope_type,
    selected.category_slug,
    selected.category_family,
    selected.platform,
    selected.required_layers,
    selected.optional_layers,
    selected.premium_layers,
    selected.restricted_layers,
    (
      select coalesce(array_agg(distinct layer order by layer), '{}'::text[])
      from unnest(selected.required_layers || selected.optional_layers || selected.premium_layers) as layer
    ) as effective_layers,
    selected.practical_effects || jsonb_build_object(
      'box_product_slug', p_box_product_slug,
      'creator_visible', false
    ),
    selected.generator_instructions,
    selected.quality_rules,
    selected.metadata || jsonb_build_object('creator_visible', false)
  from selected;
$$;

revoke all on function public.category_layer_policy_for_scope(text, text, text) from public, anon, authenticated;
grant execute on function public.category_layer_policy_for_scope(text, text, text) to service_role;

with policies(policy_slug, scope_type, category_slug, category_family, required_layers, optional_layers, premium_layers, restricted_layers, summary, effect_map, instructions) as (
  values
  (
    'global_creator_premium_default', 'fallback', null, null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer']::text[],
    array['audience_identity_layer','comment_trigger_layer','save_worthy_utility_layer','relatability_break_layer']::text[],
    array['status_shift_layer','proof_without_boring_layer','sponsor_softness_layer']::text[],
    array[]::text[],
    'Gives every category a premium card backbone: brand value, creator fit, pacing, risk control, and platform adaptation.',
    jsonb_build_object(
      'brand_lift_layer','Explains the short brand value the idea adds to the influencer.',
      'creator_style_adapter','Adapts the same idea to creator tone, energy level, and creator mode.',
      'scene_energy_curve_layer','Manages the first second, premise, proof, payoff, and CTA rhythm.',
      'risk_reputation_layer','Reduces claim, sponsor, reputation, and sensitivity risk for high-profile creators.',
      'platform_conversion_layer','Makes Reels, Story, Carousel, and Shorts versions practical.'
    ),
    array[
      'Always include a category_layer_pack with applied_layers and one practical effect per required layer.',
      'Never expose internal policy_slug, scores, bands or training source names to creators.'
    ]::text[]
  ),
  (
    'creator_content_family_default', 'family', null, 'creator_content',
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','audience_identity_layer']::text[],
    array['comment_trigger_layer','save_worthy_utility_layer','status_shift_layer','relatability_break_layer']::text[],
    array['luxury_signal_layer','proof_without_boring_layer','sponsor_softness_layer','ritual_series_layer']::text[],
    array[]::text[],
    'Enriches long-tail creator categories with audience identity and actionable platform behavior instead of a blank template.',
    jsonb_build_object(
      'audience_identity_layer','Connects the idea to the micro-community the follower wants to belong to.',
      'comment_trigger_layer','Adds a safe discussion prompt or comment question.',
      'save_worthy_utility_layer','Turns the card into a save-worthy checklist or decision filter.'
    ),
    array['Use the selected category metadata to adapt audience identity and risk wording.']::text[]
  ),
  (
    'beauty_premium_proof_policy', 'category', 'beauty', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','proof_without_boring_layer','luxury_signal_layer','sponsor_softness_layer']::text[],
    array['save_worthy_utility_layer','relatability_break_layer','audience_identity_layer']::text[],
    array['status_shift_layer','comment_trigger_layer']::text[],
    array['unsafe_before_after_claims']::text[],
    'Moves beauty ideas toward close-up proof, safe claim boundaries, and premium texture without feeling like an ad.',
    jsonb_build_object(
      'proof_without_boring_layer','Shows product or ritual proof through close-ups, mini tests, and context.',
      'luxury_signal_layer','Creates a texture, lighting, and quiet premium edit feel.',
      'sponsor_softness_layer','Softens sponsored integration through natural-use moments and disclosure.'
    ),
    array['Prefer close-up proof over transformation claims.', 'Avoid medical or universal skin/body promises.']::text[]
  ),
  (
    'fashion_status_identity_policy', 'category', 'fashion', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','status_shift_layer','audience_identity_layer','luxury_signal_layer','comment_trigger_layer']::text[],
    array['ritual_series_layer','relatability_break_layer','cultural_localization_layer']::text[],
    array['sponsor_softness_layer','save_worthy_utility_layer']::text[],
    array[]::text[],
    'Turns fashion ideas into style decisions with status, identity, and a comment engine, not only outfit display.',
    jsonb_build_object(
      'status_shift_layer','Moves creator perception toward more premium, bold, or accessible taste.',
      'audience_identity_layer','Links the style to an aesthetic group followers want to belong to.',
      'comment_trigger_layer','Turns the outfit choice into a safe two-option comment question.'
    ),
    array['Frame outfit choices as taste decisions, not only product display.']::text[]
  ),
  (
    'luxury_signal_policy', 'category', 'luxury', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','luxury_signal_layer','status_shift_layer','sponsor_softness_layer']::text[],
    array['cultural_localization_layer','proof_without_boring_layer','audience_identity_layer']::text[],
    array['ritual_series_layer']::text[],
    array['loud_discount_language']::text[],
    'Makes luxury content feel expensive but calm, positioning the influencer as a selective editor.',
    jsonb_build_object(
      'luxury_signal_layer','Builds a quiet, detail-led language with quality light and sound.',
      'status_shift_layer','Creates the perception that the creator has a high taste standard.',
      'sponsor_softness_layer','Keeps premium brand integration subtle, safe, and low-pressure.'
    ),
    array['Avoid loud sales pressure; use editorial selection language.']::text[]
  ),
  (
    'travel_local_save_policy', 'category', 'travel', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','cultural_localization_layer','save_worthy_utility_layer','audience_identity_layer']::text[],
    array['luxury_signal_layer','proof_without_boring_layer','comment_trigger_layer']::text[],
    array['ritual_series_layer','status_shift_layer']::text[],
    array['unsafe_location_privacy']::text[],
    'Turns travel ideas into atmosphere, location intelligence, and save-worthy route or hotel decisions.',
    jsonb_build_object(
      'cultural_localization_layer','Adds a shoot mode that fits the city, hotel, car, or holiday context.',
      'save_worthy_utility_layer','Gives followers a reusable route or checklist value.',
      'audience_identity_layer','Connects the idea to a specific travel style and audience.'
    ),
    array['Avoid live location leakage and unsafe travel claims.']::text[]
  ),
  (
    'food_sensory_save_policy', 'category', 'food', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','proof_without_boring_layer','comment_trigger_layer','save_worthy_utility_layer','relatability_break_layer']::text[],
    array['cultural_localization_layer','audience_identity_layer','luxury_signal_layer']::text[],
    array['ritual_series_layer']::text[],
    array['unsafe_ingestion_claims']::text[],
    'Turns food ideas into taste and texture proof, order decisions, and save-worthy guides.',
    jsonb_build_object(
      'proof_without_boring_layer','Shows taste, texture, and service details.',
      'comment_trigger_layer','Builds a comment engine around which choice is better or worth it.',
      'relatability_break_layer','Softens perfect food aesthetics with a real human moment.'
    ),
    array['Use sensory proof without health or absolute taste claims.']::text[]
  ),
  (
    'fitness_wellness_safe_policy', 'category', 'fitness_wellness_safe', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','proof_without_boring_layer','save_worthy_utility_layer','relatability_break_layer']::text[],
    array['audience_identity_layer','comment_trigger_layer','status_shift_layer']::text[],
    array['sponsor_softness_layer']::text[],
    array['medical_or_body_transformation_claims']::text[],
    'Limits health claims in wellness ideas while creating safe routines and practical checklists.',
    jsonb_build_object(
      'risk_reputation_layer','Controls health, body-claim, and before/after risk.',
      'save_worthy_utility_layer','Creates a safe routine or decision list.',
      'relatability_break_layer','Replaces perfect-body promises with a realistic process feel.'
    ),
    array['Use personal context and boundaries; do not promise outcomes.']::text[]
  ),
  (
    'parenting_family_reputation_policy', 'category', 'parenting_family', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','relatability_break_layer','audience_identity_layer','comment_trigger_layer']::text[],
    array['save_worthy_utility_layer','proof_without_boring_layer']::text[],
    array['ritual_series_layer']::text[],
    array['minor_privacy_leak']::text[],
    'Protects child privacy and balances warmth with safety in family and parenting content.',
    jsonb_build_object(
      'risk_reputation_layer','Controls minor privacy and family sensitivity.',
      'relatability_break_layer','Makes polished family performance feel more human.',
      'audience_identity_layer','Speaks to followers who recognize the same parenting moment.'
    ),
    array['Avoid child-identifying details and shame-based parenting framing.']::text[]
  ),
  (
    'creator_education_utility_policy', 'category', 'creator_education', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','save_worthy_utility_layer','proof_without_boring_layer','status_shift_layer']::text[],
    array['comment_trigger_layer','audience_identity_layer']::text[],
    array['ritual_series_layer']::text[],
    array[]::text[],
    'Turns education ideas into save-worthy mini lessons and expertise signals for creators.',
    jsonb_build_object(
      'save_worthy_utility_layer','Creates a checklist, decision tree, or mini guide.',
      'proof_without_boring_layer','Builds trust through examples, proof, or comparison.',
      'status_shift_layer','Positions the creator as an expert who makes the subject simple.'
    ),
    array['Make the output useful enough to save, not just interesting to watch.']::text[]
  ),
  (
    'thought_leadership_tension_policy', 'category', 'thought_leadership', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','status_shift_layer','viral_tension_layer','comment_trigger_layer']::text[],
    array['proof_without_boring_layer','audience_identity_layer','save_worthy_utility_layer']::text[],
    array['cultural_localization_layer']::text[],
    array['political_or_legal_overclaim']::text[],
    'Makes thought leadership ideas discussable while keeping reputation risk under control.',
    jsonb_build_object(
      'viral_tension_layer','Creates a small idea tension: is it excessive, necessary, or misunderstood?',
      'status_shift_layer','Positions the creator as clear-thinking and responsible.',
      'comment_trigger_layer','Opens a comment question without forcing polarization.'
    ),
    array['Use evidence boundaries and avoid legal/medical/financial certainty.']::text[]
  ),
  (
    'entertainment_comedy_ritual_policy', 'category', 'entertainment_comedy', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','relatability_break_layer','viral_tension_layer','ritual_series_layer','audience_identity_layer']::text[],
    array['comment_trigger_layer','absurd_procedure_layer','narrative_serial_layer']::text[],
    array['cultural_localization_layer']::text[],
    array['harmful_prank']::text[],
    'Turns comedy ideas from one-off jokes into repeatable rituals, timing systems, and audience in-jokes.',
    jsonb_build_object(
      'ritual_series_layer','Turns the joke into a repeatable series or ritual.',
      'viral_tension_layer','Creates watch motivation through a small absurd tension.',
      'relatability_break_layer','Makes polished performance feel human and shareable.'
    ),
    array['Avoid harmful pranks, humiliation and direct imitation of public figures.']::text[]
  ),
  (
    'bureaucratic_absurd_policy', 'category', 'bureaucratic_comedy', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','absurd_procedure_layer','ritual_series_layer','comment_trigger_layer']::text[],
    array['relatability_break_layer','viral_tension_layer','audience_identity_layer']::text[],
    array['narrative_serial_layer']::text[],
    array['real_institution_defamation']::text[],
    'Packages bureaucratic comedy as a procedural game with a repeatable format and safe comment engine.',
    jsonb_build_object(
      'absurd_procedure_layer','Turns illogical rules or paperwork processes into safe absurd play.',
      'ritual_series_layer','Creates a repeatable series language around forms, institutions, or approvals.',
      'comment_trigger_layer','Builds a safe question that invites followers to share their own experience.'
    ),
    array['Use fictionalized institutions and avoid naming real officials.']::text[]
  ),
  (
    'absurd_procedure_policy', 'category', 'absurd_procedure', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','absurd_procedure_layer','viral_tension_layer','ritual_series_layer']::text[],
    array['comment_trigger_layer','relatability_break_layer']::text[],
    array['narrative_serial_layer']::text[],
    array['unsafe_absurd_action']::text[],
    'Turns absurd processes into comedy mechanisms without encouraging harmful behavior.',
    jsonb_build_object(
      'absurd_procedure_layer','Turns an impossible but familiar rule into a comic system.',
      'viral_tension_layer','Keeps viewers watching to see where the absurd rule leads.',
      'ritual_series_layer','Makes the format repeatable.'
    ),
    array['Keep absurd actions fictional, safe and non-harmful.']::text[]
  ),
  (
    'book_launch_story_policy', 'category', 'book_launch_content', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','narrative_serial_layer','audience_identity_layer','ritual_series_layer']::text[],
    array['save_worthy_utility_layer','comment_trigger_layer','status_shift_layer']::text[],
    array['comedy_worldbuilding_layer']::text[],
    array['direct_text_or_character_leak']::text[],
    'Packages book and author content as story-world, series, and reader identity instead of simple sales posts.',
    jsonb_build_object(
      'narrative_serial_layer','Turns the book idea into a curiosity-building series.',
      'audience_identity_layer','Creates reader belonging and curiosity.',
      'ritual_series_layer','Splits the launch process into repeatable episodes.'
    ),
    array['Never expose manuscript text, exact character names or source passages.']::text[]
  ),
  (
    'literary_lifestyle_policy', 'category', 'literary_lifestyle', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','audience_identity_layer','narrative_serial_layer','ritual_series_layer']::text[],
    array['luxury_signal_layer','comment_trigger_layer','save_worthy_utility_layer']::text[],
    array['status_shift_layer']::text[],
    array['direct_quote_copy']::text[],
    'Moves literary lifestyle content toward aesthetic reader identity and repeatable ritual formats.',
    jsonb_build_object(
      'audience_identity_layer','Claims a reader/writer aesthetic group.',
      'narrative_serial_layer','Turns a reading or writing moment into a mini story arc.',
      'ritual_series_layer','Turns a single idea into a weekly reader ritual.'
    ),
    array['Use reading/writing atmosphere, not copied prose.']::text[]
  ),
  (
    'narrative_serial_policy', 'category', 'narrative_serial_content', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','narrative_serial_layer','ritual_series_layer','viral_tension_layer']::text[],
    array['comment_trigger_layer','audience_identity_layer','comedy_worldbuilding_layer']::text[],
    array['status_shift_layer']::text[],
    array['source_scene_copy']::text[],
    'Turns serial content into a format system that manages cliffhangers, payoff, and follower response.',
    jsonb_build_object(
      'narrative_serial_layer','Builds episode, cliffhanger, and payoff rhythm.',
      'viral_tension_layer','Carries curiosity into the next episode.',
      'comment_trigger_layer','Turns follower predictions into a comment engine.'
    ),
    array['Use original situations and never copy source scenes.']::text[]
  ),
  (
    'comedy_worldbuilding_policy', 'category', 'comedy_worldbuilding', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','comedy_worldbuilding_layer','narrative_serial_layer','ritual_series_layer']::text[],
    array['audience_identity_layer','comment_trigger_layer','absurd_procedure_layer']::text[],
    array['viral_tension_layer']::text[],
    array['source_character_copy']::text[],
    'Turns comedy worlds into lore, rituals, and recurring-joke systems without copying characters.',
    jsonb_build_object(
      'comedy_worldbuilding_layer','Builds an original content world, recurring-joke logic, and lore skeleton.',
      'narrative_serial_layer','Creates an episode flow that reveals the world piece by piece.',
      'ritual_series_layer','Creates a repeatable format followers recognize.'
    ),
    array['Do not copy character names, quotes or exact fictional worlds.']::text[]
  ),
  (
    'commerce_affiliate_trust_policy', 'category', 'commerce_affiliate', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','sponsor_softness_layer','proof_without_boring_layer','save_worthy_utility_layer']::text[],
    array['comment_trigger_layer','luxury_signal_layer','relatability_break_layer']::text[],
    array['status_shift_layer']::text[],
    array['undisclosed_ad_or_overclaim']::text[],
    'Turns affiliate and sponsor ideas into natural, disclosure-safe content with a decision filter.',
    jsonb_build_object(
      'sponsor_softness_layer','Reduces sales pressure and adds disclosure.',
      'proof_without_boring_layer','Shows the product through proof and context.',
      'save_worthy_utility_layer','Gives followers a checklist to use before buying.'
    ),
    array['Disclosure is mandatory for sponsor, affiliate or gifted contexts.']::text[]
  ),
  (
    'celebrity_fan_lore_safe_policy', 'category', 'celebrity_fan_lore', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','audience_identity_layer','ritual_series_layer','comment_trigger_layer']::text[],
    array['viral_tension_layer','status_shift_layer','relatability_break_layer']::text[],
    array['cultural_localization_layer']::text[],
    array['public_figure_imitation_or_defamation']::text[],
    'Turns fan and lore content into audience-owned formats while controlling name, likeness, and reputation risk.',
    jsonb_build_object(
      'audience_identity_layer','Creates belonging and inside-context feeling for the fan audience.',
      'ritual_series_layer','Turns lore commentary into a repeatable series.',
      'risk_reputation_layer','Reduces imitation, defamation, and likeness risk.'
    ),
    array['Do not imitate, defame or imply private facts about public figures.']::text[]
  ),
  (
    'visual_meme_post_policy', 'category', 'visual_meme_post', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','comment_trigger_layer','viral_tension_layer']::text[],
    array['audience_identity_layer','relatability_break_layer','ritual_series_layer']::text[],
    array['luxury_signal_layer']::text[],
    array['copied_meme_surface']::text[],
    'Builds visual meme and post ideas as new comment-triggering patterns instead of copied surfaces.',
    jsonb_build_object(
      'comment_trigger_layer','Opens a discussion or choice question under the visual.',
      'viral_tension_layer','Turns the small contradiction inside the meme into safe tension.',
      'platform_conversion_layer','Adapts the same idea into Reels, Story, and Carousel variants.'
    ),
    array['Use meme mechanics, not copied templates or exact captions.']::text[]
  ),
  (
    'author_brand_content_policy', 'category', 'author_brand_content', null,
    array['brand_lift_layer','creator_style_adapter','scene_energy_curve_layer','risk_reputation_layer','platform_conversion_layer','narrative_serial_layer','audience_identity_layer','ritual_series_layer']::text[],
    array['status_shift_layer','save_worthy_utility_layer','comment_trigger_layer']::text[],
    array['comedy_worldbuilding_layer']::text[],
    array['raw_manuscript_leak']::text[],
    'Turns the author brand into a premium creator brand through process, story world, and reader relationship.',
    jsonb_build_object(
      'brand_lift_layer','Positions the author as a creator with an idea world, not only a book seller.',
      'narrative_serial_layer','Turns the writing process into a followable series.',
      'audience_identity_layer','Gives readers the feeling of joining early.'
    ),
    array['Keep manuscript/source text internal; use process and atmosphere.']::text[]
  )
)
insert into public.category_layer_policies (
  policy_slug,
  scope_type,
  category_slug,
  category_family,
  required_layers,
  optional_layers,
  premium_layers,
  restricted_layers,
  practical_effects,
  generator_instructions,
  quality_rules,
  metadata
)
select
  policy_slug,
  scope_type,
  category_slug,
  category_family,
  required_layers,
  optional_layers,
  premium_layers,
  restricted_layers,
  jsonb_build_object(
    'summary', summary,
    'layer_effects', effect_map,
    'practical_impact', jsonb_build_object(
      'idea_card', 'Adds category-specific strategic layer outputs that make the card more premium and usable.',
      'quality_gate', 'Missing required layers lower premium completeness and trigger refine.',
      'creator_visible', true
    ),
    'creator_visible', false
  ),
  instructions,
  jsonb_build_object(
    'min_required_layer_coverage', 1.0,
    'premium_bonus_layers_min', 2,
    'missing_required_decision', 'refine',
    'creator_visible', false
  ),
  jsonb_build_object(
    'source', 'category_layer_policy_v1',
    'internal', true,
    'creator_visible', false
  )
from policies
on conflict (policy_slug) do update set
  required_layers = excluded.required_layers,
  optional_layers = excluded.optional_layers,
  premium_layers = excluded.premium_layers,
  restricted_layers = excluded.restricted_layers,
  practical_effects = excluded.practical_effects,
  generator_instructions = excluded.generator_instructions,
  quality_rules = excluded.quality_rules,
  metadata = excluded.metadata,
  enabled = true,
  updated_at = now();
