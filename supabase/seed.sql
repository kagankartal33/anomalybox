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
  'Yanlış Mantık Oyunu',
  'Wrong Logic Game',
  'Tanıdık bir durumu, kendinden emin hatalı mantık ve baskı ile komedi oyununa çevirir.',
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
  'Yanlış Profesyonellik',
  'False Professionalism',
  'Basit bir duygu veya gündelik olayı kurumsal, akademik ya da uzman diliyle aşırı ciddiye alır.',
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
  'Ekran Görüntüsü Çarpışması',
  'Screenshot Collision',
  'Sıradan mesaj, bildirim veya yorum metnini anlamını değiştiren bir bağlamla yan yana getirir.',
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
  'Şakayı tek ekran görüntüsünde bile niyeti anlaşılacak ve güvenli hedefe yönlenecek şekilde kurar.',
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
  'Button Seçici',
  'Button Selector',
  'Aynı fikre beş kısa kapanış üretir ve en bağlı, en kısa, en anlaşılır olanı seçer.',
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