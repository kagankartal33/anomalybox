update public.box_products
set
  name = 'Classic Red Box',
  metadata = coalesce(metadata, '{}'::jsonb) || '{
    "visible_to_creator": true,
    "shows_scores": false,
    "display_name": "Classic Red Box",
    "short_description": "2 private creator cards calibrated to your lane, creator mode, and production style.",
    "creator_positioning": "A focused private idea box for creators who want two polished directions they can actually shoot.",
    "public_benefits": [
      "2 private creator cards",
      "lane and creator-mode calibration",
      "scene, shot, caption and brand-safety guidance",
      "saved into the Creator Vault"
    ]
  }'::jsonb,
  updated_at = now()
where slug = 'viral_box_500';

update public.box_products
set
  name = 'SIGNATURE PURPLE BOX',
  metadata = coalesce(metadata, '{}'::jsonb) || '{
    "visible_to_creator": true,
    "shows_scores": false,
    "display_name": "SIGNATURE PURPLE BOX",
    "short_description": "5 private strategy cards with deeper execution direction, brand-lift framing, and launch-ready creative angles.",
    "creator_positioning": "The fuller private selection for creators preparing campaigns, launches, or elevated content moments.",
    "public_benefits": [
      "5 private strategy cards",
      "deeper execution direction",
      "brand-lift framing",
      "launch-ready creative angles",
      "saved into the Creator Vault"
    ]
  }'::jsonb,
  updated_at = now()
where slug = 'premium_viral_box_1000';

insert into public.admin_configs (namespace, version, config, enabled)
values (
  'production.finalist_inventory',
  '1.0.0',
  '{
    "target_cards_per_category": 7,
    "minimum_cards_per_category": 5,
    "scope": "enabled_category_routed_persona",
    "production_database": "supabase_free_slim",
    "generator_location": "local_admin_only",
    "selection_policy": {
      "quality_gate_decision": "approve",
      "sort_order": [
        "editorial_quality_score desc",
        "creator_fit_score desc",
        "platform_fit_score desc",
        "brand_safety_score desc",
        "semantic_duplicate_score asc",
        "internal_rank_score desc"
      ],
      "include_internal_scores_in_export": false,
      "include_training_or_candidate_history": false
    },
    "delivery_compatibility": {
      "classic_red_box_minimum": { "low": 1, "high": 1 },
      "signature_purple_box_minimum": { "low": 2, "mid": 1, "high": 2 }
    }
  }'::jsonb,
  true
)
on conflict (namespace, version) do update set
  config = excluded.config,
  enabled = excluded.enabled;
