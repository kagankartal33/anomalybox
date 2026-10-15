delete from public.viral_training_example_features;
delete from public.viral_training_compilations
where version = '2026-v1';

with example_context as (
  select
    example.*,
    lower(concat_ws(
      ' ',
      example.title,
      example.phenomenon_type,
      example.abstracted_mechanism,
      example.reusable_pattern,
      coalesce(example.participation_mode, ''),
      array_to_string(example.emotional_triggers, ' '),
      array_to_string(example.format_signals, ' '),
      array_to_string(example.safety_risks, ' '),
      coalesce(example.platform, ''),
      coalesce(example.category_slug, ''),
      coalesce(example.metadata ->> 'source_class', '')
    )) as search_text,
    case
      when jsonb_typeof(example.metadata -> 'source_urls') = 'array'
        then jsonb_array_length(example.metadata -> 'source_urls')
      else 0
    end as source_url_count,
    example.metadata ? 'real_title' as real_documented
  from public.viral_training_examples example
),
raw_features as (
  select
    example_context.id as example_id,
    array[
      case when example_context.phenomenon_type = 'challenge' or example_context.search_text ~ '(challenge|participation|nomination|duet|stitch)' then 'VTP-001' end,
      case when example_context.search_text ~ '(nostalgia|throwback|2016|2017|2018|2019|old internet|past|then and now|yearbook)' then 'VTP-002' end,
      case when example_context.phenomenon_type = 'meme' or example_context.search_text ~ '(meme|template|caption|joke|humor|remix|recognition|emotional shape)' then 'VTP-003' end,
      case when example_context.search_text ~ '(transition|reveal|before|after|glow|transformation|change|makeover)' then 'VTP-004' end,
      case when example_context.search_text ~ '(live|poll|comment|interactive|viewer input|audience input|chat)' then 'VTP-005' end,
      case when example_context.phenomenon_type = 'ai_format' or example_context.search_text ~ '(^|[^a-z])(ai|artificial intelligence|deepfake|virtual|synthetic)([^a-z]|$)' then 'VTP-006' end,
      case when example_context.search_text ~ '(behind the scenes|bts|process|unfiltered|human|mistake|real-life|real life|imperfect)' then 'VTP-007' end,
      case when example_context.phenomenon_type in ('commerce_format', 'marketing_case') or example_context.category_slug = 'commerce_affiliate' then 'VTP-008' end,
      case when example_context.search_text ~ '(brand|community|co-design|co design|fan input|campaign|sponsor)' then 'VTP-009' end,
      case when example_context.phenomenon_type = 'social_movement' or example_context.search_text ~ '(values|movement|cause|activism|solidarity|public issue)' then 'VTP-010' end,
      case when example_context.search_text ~ '(creative risk|playful|controlled chaos|wild format|surreal|absurd|format game)' then 'VTP-011' end,
      case when example_context.search_text ~ '(fan|fandom|lore|inside joke|canon|universe|stan)' then 'VTP-012' end,
      case when example_context.search_text ~ '(how to|guide|checklist|search|answer|tutorial|save|saved|faq)' then 'VTP-013' end,
      case when example_context.search_text ~ '(series|episode|part [0-9]|recurring|weekly|daily)' then 'VTP-014' end,
      case when example_context.search_text ~ '(dm|direct message|broadcast|story poll|close friends|private community)' then 'VTP-015' end,
      case when example_context.search_text ~ '(reaction|reacts|responds|response|take|opinion|outrage)' then 'VTP-016' end,
      case when example_context.search_text ~ '(ugc|user-generated|submission|submit|audience made|community made|permission)' then 'VTP-017' end,
      case when example_context.search_text ~ '(trend|curate|taste|editorial|filter|what i would choose)' then 'VTP-018' end,
      case when example_context.search_text ~ '(process proof|human proof|unedited|mistake|correction|draft|workflow)' then 'VTP-019' end,
      case when example_context.search_text ~ '(curiosity gap|surprise|unexpected|why this works|what happens|open question)' then 'VTP-020' end,
      case when example_context.search_text ~ '(shopping|shop|buy|purchase|affiliate|commerce|product|roi|worth it)' then 'VTP-021' end,
      case when example_context.search_text ~ '(maximalism|maximalist|fast edit|dense edit|aesthetic overload|visual overload)' then 'VTP-022' end,
      case when example_context.search_text ~ '(expert|authority|explainer|professional|analysis|breakdown)' then 'VTP-023' end,
      case when example_context.search_text ~ '(content pillar|media system|workflow|repurpose|pillar|format system)' then 'VTP-024' end,
      case when example_context.search_text ~ '(review|comparison|trust|honest limit|proof|receipt|shopping)' then 'VTP-025' end,
      case when example_context.training_use <> 'negative_example' then 'VTP-026' end,
      case when example_context.training_use <> 'negative_example' then 'VTP-027' end,
      case when example_context.search_text ~ '(^|[^a-z])(receipt|receipts|claim|claims|myth|take|opinion|movement|substantiation|proof note)([^a-z]|$)' then 'VTP-028' end,
      case when example_context.search_text ~ '(shorts|short-form|short form|long-form|long form|youtube|series)' then 'VTP-029' end,
      case when example_context.search_text ~ '(dm|decision|private answer|lead magnet|funnel|inbox)' then 'VTP-030' end,
      case when example_context.search_text ~ '(lore|ritual|symbol|recurring joke|community ritual)' then 'VTP-031' end,
      case when example_context.search_text ~ '(objection|comment|question|pushback|reply|response)' then 'VTP-032' end,
      case when example_context.search_text ~ '(ritual|habit|daily prompt|weekly prompt|community habit|challenge)' then 'VTP-033' end,
      case when example_context.search_text ~ '(fan context|new viewer|newcomer|old audience|dual audience)' then 'VTP-034' end,
      case when example_context.search_text ~ '(myth|misconception|debunk|wrong belief|false belief)' then 'VTP-035' end,
      case when example_context.phenomenon_type = 'ai_format' or example_context.search_text ~ '(^|[^a-z])(ai|artificial intelligence|human-led ai|workflow)([^a-z]|$)' then 'VTP-036' end,
      case when example_context.phenomenon_type = 'localization_case' or example_context.search_text ~ '(local|localized|global remix|turkey|regional|city|culture)' then 'VTP-037' end,
      case when example_context.search_text ~ '(save|checklist|step-by-step|steps|utility|template|decision tree)' then 'VTP-038' end,
      case when example_context.category_slug in ('beauty', 'fashion', 'food', 'luxury') or example_context.search_text ~ '(sensory|texture|sound|close-up|close up|taste|touch|product close)' then 'VTP-039' end,
      case when example_context.search_text ~ '(^|[^a-z])(sponsor|sponsored|ad|advertisement|partner|partnership|affiliate|deal|brand safety|disclosure)([^a-z]|$)' then 'VTP-040' end
    ]::text[] as raw_pattern_ids,
    jsonb_build_object(
      'real_documented', example_context.real_documented,
      'source_backed', example_context.source_url_count > 0,
      'source_url_count', example_context.source_url_count,
      'copy_risk_weight', case example_context.copy_risk when 'high' then 1.0 when 'medium' then 0.55 else 0.2 end,
      'safety_weight', case example_context.risk_level when 'restricted' then 1.0 when 'medium' then 0.55 else 0.15 end,
      'platform_specificity', case
        when example_context.platform like 'instagram%' then 0.95
        when example_context.platform in ('tiktok', 'youtube_shorts', 'x') then 0.85
        when example_context.platform = 'internet' then 0.35
        else 0.6
      end,
      'generator_value', round(least(1.0, (
        0.45
        + case when example_context.real_documented then 0.15 else 0.05 end
        + least(0.18, (cardinality(example_context.emotional_triggers) + cardinality(example_context.format_signals)) * 0.025)
        + case when example_context.platform like 'instagram%' then 0.12 else 0.0 end
        + case when example_context.category_slug in ('beauty', 'fashion', 'travel', 'lifestyle', 'food', 'luxury', 'commerce_affiliate') then 0.08 else 0.0 end
      ))::numeric, 4),
      'premium_fit', round((case
        when example_context.category_slug in ('luxury', 'beauty', 'fashion', 'travel', 'commerce_affiliate') then 0.9
        when example_context.category_slug in ('creator_education', 'thought_leadership', 'food', 'lifestyle') then 0.75
        else 0.6
      end)::numeric, 4)
    ) as quality_vector,
    jsonb_build_object(
      'recommended_use', case
        when example_context.training_use = 'negative_example' then 'guardrail_only'
        when example_context.risk_level = 'restricted' then 'avoid_surface_use_mechanism_only'
        else 'pattern_affinity'
      end,
      'prompt_rule', 'extract mechanism only; never copy title, person, image, audio, catchphrase or exact execution',
      'creator_card_use', 'feed why_it_can_work, brand_safety, hook_performance_pack and production_plan',
      'preferred_output_layers', case
        when example_context.category_slug in ('beauty', 'fashion', 'luxury') then jsonb_build_array('editorial_taste', 'sensory_proof', 'brand_safety')
        when example_context.category_slug in ('commerce_affiliate', 'food') then jsonb_build_array('shopping_trust', 'emotional_roi', 'proof_boundary')
        when example_context.category_slug in ('creator_education', 'thought_leadership') then jsonb_build_array('searchable_answer', 'receipt_stack', 'save_utility')
        else jsonb_build_array('promise_packaging', 'comment_engine', 'low_regret_attention')
      end,
      'platform_fit', case
        when example_context.platform like 'instagram%' then 'native'
        when example_context.platform = 'internet' then 'requires_platform_translation'
        else 'adaptable'
      end
    ) as generator_fit,
    array[
      case when example_context.copy_risk = 'high' or example_context.metadata ? 'anti_copy' then 'copy_surface_block' end,
      case when example_context.risk_level in ('medium', 'restricted') then 'safety_review' end,
      case when example_context.training_use = 'negative_example' then 'negative_example_guardrail' end,
      case when example_context.search_text ~ '(harm|danger|injury|vehicle|eat|drink|body|diet|medical|health)' then 'harm_or_claim_guard' end,
      case when example_context.search_text ~ '(privacy|private|dm|message|child|family)' then 'privacy_guard' end,
      case when example_context.search_text ~ '(^|[^a-z])(sponsor|sponsored|ad|advertisement|partner|partnership|affiliate|commerce|shopping|buy)([^a-z]|$)' then 'disclosure_needed' end,
      case when example_context.phenomenon_type = 'social_movement' then 'social_sensitivity_guard' end,
      case when example_context.phenomenon_type = 'ai_format' or example_context.search_text ~ '(^|[^a-z])(ai|deepfake|synthetic)([^a-z]|$)' then 'ai_disclosure_needed' end
    ]::text[] as raw_risk_flags
  from example_context
),
normalized_features as (
  select
    raw_features.example_id,
    case
      when cardinality(patterns.pattern_ids) = 0 then array['VTP-003', 'VTP-026', 'VTP-027']::text[]
      else patterns.pattern_ids
    end as derived_pattern_ids,
    raw_features.quality_vector,
    raw_features.generator_fit,
    flags.risk_flags
  from raw_features
  cross join lateral (
    select coalesce(array_agg(distinct pattern_id order by pattern_id), '{}'::text[]) as pattern_ids
    from unnest(raw_features.raw_pattern_ids) as pattern_id
    where pattern_id is not null
  ) patterns
  cross join lateral (
    select coalesce(array_agg(distinct risk_flag order by risk_flag), '{}'::text[]) as risk_flags
    from unnest(raw_features.raw_risk_flags) as risk_flag
    where risk_flag is not null
  ) flags
)
insert into public.viral_training_example_features (
  example_id,
  training_version,
  derived_pattern_ids,
  quality_vector,
  generator_fit,
  risk_flags
)
select
  normalized_features.example_id,
  '2026-v1',
  normalized_features.derived_pattern_ids,
  normalized_features.quality_vector,
  normalized_features.generator_fit,
  normalized_features.risk_flags
from normalized_features;

insert into public.viral_training_compilations (
  version,
  example_count,
  pattern_count,
  source_count,
  real_example_count,
  quality_report,
  pattern_distribution,
  category_distribution,
  platform_distribution,
  active
)
select
  '2026-v1',
  (select count(*)::integer from public.viral_training_examples),
  (select count(*)::integer from public.viral_pattern_rules where enabled = true),
  (select count(*)::integer from public.viral_training_sources where enabled = true),
  (select count(*)::integer from public.viral_training_examples where metadata ? 'real_title'),
  jsonb_build_object(
    'compiled_feature_rows', (select count(*) from public.viral_training_example_features where training_version = '2026-v1'),
    'empty_pattern_examples', (select count(*) from public.viral_training_example_features where cardinality(derived_pattern_ids) = 0),
    'average_generator_value', (
      select round(avg((quality_vector ->> 'generator_value')::numeric), 4)
      from public.viral_training_example_features
      where training_version = '2026-v1'
    ),
    'average_premium_fit', (
      select round(avg((quality_vector ->> 'premium_fit')::numeric), 4)
      from public.viral_training_example_features
      where training_version = '2026-v1'
    ),
    'high_copy_risk_examples', (select count(*) from public.viral_training_examples where copy_risk = 'high'),
    'restricted_examples', (select count(*) from public.viral_training_examples where risk_level = 'restricted'),
    'training_policy', 'pattern_only_anti_copy',
    'creator_visible', false
  ),
  (
    select coalesce(jsonb_object_agg(pattern_id, example_count order by pattern_id), '{}'::jsonb)
    from (
      select pattern_id, count(*) as example_count
      from public.viral_training_example_features feature
      cross join lateral unnest(feature.derived_pattern_ids) as pattern_id
      where feature.training_version = '2026-v1'
      group by pattern_id
    ) pattern_counts
  ),
  (
    select coalesce(jsonb_object_agg(category_key, example_count order by category_key), '{}'::jsonb)
    from (
      select coalesce(example.category_slug, 'uncategorized') as category_key, count(*) as example_count
      from public.viral_training_examples example
      group by coalesce(example.category_slug, 'uncategorized')
    ) category_counts
  ),
  (
    select coalesce(jsonb_object_agg(platform, example_count order by platform), '{}'::jsonb)
    from (
      select example.platform, count(*) as example_count
      from public.viral_training_examples example
      group by example.platform
    ) platform_counts
  ),
  true;

with active_compilation as (
  select id
  from public.viral_training_compilations
  where version = '2026-v1'
),
pattern_examples as (
  select
    pattern_id,
    example.category_slug,
    example.platform,
    feature.quality_vector,
    feature.risk_flags
  from public.viral_training_example_features feature
  join public.viral_training_examples example
    on example.id = feature.example_id
  cross join lateral unnest(feature.derived_pattern_ids) as pattern_id
  where feature.training_version = '2026-v1'
    and example.category_slug is not null
),
grouped_affinity as (
  select
    pattern_examples.pattern_id,
    pattern_examples.category_slug,
    pattern_examples.platform,
    count(*)::integer as example_count,
    avg((pattern_examples.quality_vector ->> 'generator_value')::numeric) as avg_generator_value,
    avg((pattern_examples.quality_vector ->> 'premium_fit')::numeric) as avg_premium_fit,
    avg((pattern_examples.quality_vector ->> 'platform_specificity')::numeric) as avg_platform_specificity,
    avg((pattern_examples.quality_vector ->> 'copy_risk_weight')::numeric) as avg_copy_risk_weight,
    bool_or(coalesce((pattern_examples.quality_vector ->> 'source_backed')::boolean, false)) as has_source_backing
  from pattern_examples
  group by
    pattern_examples.pattern_id,
    pattern_examples.category_slug,
    pattern_examples.platform
)
insert into public.viral_training_pattern_affinity (
  compilation_id,
  pattern_id,
  category_slug,
  platform,
  example_count,
  signal_weight,
  quality_vector
)
select
  active_compilation.id,
  grouped_affinity.pattern_id,
  grouped_affinity.category_slug,
  grouped_affinity.platform,
  grouped_affinity.example_count,
  round(greatest(0.05, least(1.0, (
    0.18
    + least(0.42, ln(grouped_affinity.example_count + 1) / ln(50) * 0.42)
    + grouped_affinity.avg_generator_value * 0.18
    + grouped_affinity.avg_premium_fit * 0.12
    + grouped_affinity.avg_platform_specificity * 0.10
    - case when grouped_affinity.avg_copy_risk_weight > 0.8 then 0.05 else 0.0 end
  )))::numeric, 4),
  jsonb_build_object(
    'avg_generator_value', round(grouped_affinity.avg_generator_value, 4),
    'avg_premium_fit', round(grouped_affinity.avg_premium_fit, 4),
    'avg_platform_specificity', round(grouped_affinity.avg_platform_specificity, 4),
    'avg_copy_risk_weight', round(grouped_affinity.avg_copy_risk_weight, 4),
    'source_backed', grouped_affinity.has_source_backing,
    'dominant_risk_flags', (
      select coalesce(jsonb_agg(distinct risk_flag), '[]'::jsonb)
      from pattern_examples risk_source
      cross join lateral unnest(risk_source.risk_flags) as risk_flag
      where risk_source.pattern_id = grouped_affinity.pattern_id
        and risk_source.category_slug = grouped_affinity.category_slug
        and risk_source.platform = grouped_affinity.platform
    ),
    'creator_visible', false
  )
from grouped_affinity
cross join active_compilation;

update public.viral_training_compilations
set active = false
where version <> '2026-v1';

update public.admin_configs
set enabled = false
where namespace = 'training.compiled_profile'
  and version <> '2026-v1';

insert into public.admin_configs (namespace, version, config, enabled)
select
  'training.compiled_profile',
  compilation.version,
  jsonb_build_object(
    'compilation_id', compilation.id,
    'version', compilation.version,
    'example_count', compilation.example_count,
    'real_example_count', compilation.real_example_count,
    'pattern_count', compilation.pattern_count,
    'source_count', compilation.source_count,
    'quality_report', compilation.quality_report,
    'pattern_distribution', compilation.pattern_distribution,
    'category_distribution', compilation.category_distribution,
    'platform_distribution', compilation.platform_distribution,
    'generator_policy', jsonb_build_object(
      'use', 'ranked pattern affinity and quality vectors as internal planning signals',
      'never_copy', jsonb_build_array('title', 'person', 'catchphrase', 'image', 'audio', 'exact scene', 'exact challenge'),
      'always_add', jsonb_build_array('creator_fit', 'platform_fit', 'brand_safety', 'production_plan', 'hook_performance_pack'),
      'creator_visible', false
    ),
    'top_affinities', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'pattern_id', top_rows.pattern_id,
          'category_slug', top_rows.category_slug,
          'platform', top_rows.platform,
          'example_count', top_rows.example_count,
          'signal_weight', top_rows.signal_weight
        )
      ), '[]'::jsonb)
      from (
        select
          affinity.pattern_id,
          affinity.category_slug,
          affinity.platform,
          affinity.example_count,
          affinity.signal_weight
        from public.viral_training_pattern_affinity affinity
        where affinity.compilation_id = compilation.id
        order by affinity.signal_weight desc, affinity.example_count desc, affinity.pattern_id
        limit 40
      ) top_rows
    )
  ),
  true
from public.viral_training_compilations compilation
where compilation.version = '2026-v1'
on conflict (namespace, version) do update set
  config = excluded.config,
  enabled = excluded.enabled;
