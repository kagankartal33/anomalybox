revoke all privileges on all tables in schema public from public, anon, authenticated;
revoke all privileges on all sequences in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;

grant select (
  id,
  slug,
  name,
  family,
  risk_level,
  enabled,
  sort_order,
  metadata,
  created_at,
  updated_at
) on public.categories to anon, authenticated;

grant select (
  id,
  slug,
  name,
  description,
  tags,
  enabled,
  sort_order,
  metadata,
  created_at,
  updated_at
) on public.creator_personas to anon, authenticated;

grant select (
  id,
  slug,
  name,
  price_usd_cents,
  idea_count,
  enabled,
  metadata,
  created_at,
  updated_at
) on public.box_products to anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.creator_profiles to authenticated;
grant select, insert, update, delete on public.brands to authenticated;
grant select, insert, update, delete on public.audience_profiles to authenticated;
grant select, insert, update, delete on public.creator_category_preferences to authenticated;
grant select, insert, update, delete on public.experiments to authenticated;
grant select, insert, update, delete on public.experiment_variants to authenticated;
grant select, insert, update, delete on public.performance_events to authenticated;

grant select on public.algorithm_definitions to anon, authenticated;
grant select on public.trend_signals to authenticated;

grant select (
  id,
  user_id,
  box_product_id,
  amount_usd_cents,
  currency,
  status,
  created_at,
  updated_at
) on public.purchases to authenticated;

grant select (
  id,
  user_id,
  box_product_id,
  purchase_id,
  status,
  checkout_url,
  created_at,
  updated_at
) on public.checkout_sessions to authenticated;

grant select (
  id,
  user_id,
  purchase_id,
  box_product_id,
  category_id,
  persona_id,
  status,
  delivered_at,
  created_at,
  updated_at
) on public.idea_box_deliveries to authenticated;

grant select (
  id,
  delivery_id,
  user_id,
  idea_id,
  slot_index,
  created_at
) on public.idea_box_items to authenticated;

grant select on public.idea_candidates to authenticated;
grant select on public.idea_cards to authenticated;
grant select on public.audit_logs to authenticated;

grant usage, select on all sequences in schema public to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

revoke all privileges on public.admin_configs from public, anon, authenticated;
revoke all privileges on public.idea_scores from public, anon, authenticated;
revoke all privileges on public.human_awareness_assessments from public, anon, authenticated;
revoke all privileges on public.idea_generation_batches from public, anon, authenticated;
revoke all privileges on public.idea_import_errors from public, anon, authenticated;
revoke all privileges on public.idea_inventory from public, anon, authenticated;
revoke all privileges on public.viral_training_sources from public, anon, authenticated;
revoke all privileges on public.viral_training_examples from public, anon, authenticated;
revoke all privileges on public.viral_pattern_rules from public, anon, authenticated;
revoke all privileges on public.generator_eval_cases from public, anon, authenticated;
revoke all privileges on public.viral_training_compilations from public, anon, authenticated;
revoke all privileges on public.viral_training_example_features from public, anon, authenticated;
revoke all privileges on public.viral_training_pattern_affinity from public, anon, authenticated;
