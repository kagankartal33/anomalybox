import json
import uuid

with open('production_exports/store_12_categories_84_cards.jsonl', 'r', encoding='utf-8') as f:
    records = [json.loads(line) for line in f if line.strip()]

category_meta = {
    "beauty": "Beauty",
    "commerce_affiliate": "Commerce & Affiliate",
    "creator_education": "Creator Education",
    "entertainment_comedy": "Entertainment Comedy",
    "fashion": "Fashion",
    "fitness_wellness_safe": "Fitness & Wellness Safe",
    "food": "Food",
    "lifestyle": "Lifestyle",
    "luxury": "Luxury",
    "parenting_family": "Parenting & Family",
    "thought_leadership": "Thought Leadership",
    "travel": "Travel"
}

sql_lines = []
sql_lines.append("-- ===========================================================================")
sql_lines.append("-- ANOMALY BOX: ALL 12 PURCHASE LANES FULL INVENTORY SEED")
sql_lines.append("-- ===========================================================================\n")
sql_lines.append("begin;\n")

# 1. Ensure all 12 categories exist and are enabled
sql_lines.append("-- 1. Ensure 12 Store Categories exist and are enabled")
for slug, name in category_meta.items():
    escaped_name = name.replace("'", "''")
    sql_lines.append(f"""insert into public.categories (slug, name, family, enabled, risk_level, sort_order)
values ('{slug}', '{escaped_name}', 'creator_content', true, 'low', 100)
on conflict (slug) do update set enabled = true, name = excluded.name;\n""")

# 2. Insert idea_candidates, idea_cards, idea_inventory
sql_lines.append("\n-- 2. Insert 84 Idea Cards & Inventory\n")

for r in records:
    cat_slug = r['category_slug']
    persona_slug = r.get('persona_slug', 'expert_guide')
    score_band = r['score_band']
    idea_id = r.get('idea_id') or str(uuid.uuid4())
    rank = r.get('rank', 85)
    
    cand = r.get('candidate', {})
    card = r.get('card', {})
    title = (card.get('title') or cand.get('title') or 'Creator Brief Card').replace("'", "''")
    premise = (cand.get('one_sentence_premise') or card.get('card', {}).get('one_sentence_premise') or 'Execution-ready creator brief.').replace("'", "''")
    
    card_json_str = json.dumps(card.get('card', {}), ensure_ascii=False).replace("'", "''")
    hook_options_str = json.dumps(cand.get('hook_options', []), ensure_ascii=False).replace("'", "''")
    story_beats_str = json.dumps(cand.get('story_beats', []), ensure_ascii=False).replace("'", "''")
    comedy_remix_str = json.dumps(cand.get('comedy_remix', {}), ensure_ascii=False).replace("'", "''")
    human_awareness_str = json.dumps(cand.get('human_awareness', {}), ensure_ascii=False).replace("'", "''")
    prod_req_str = json.dumps(cand.get('production_requirements', {}), ensure_ascii=False).replace("'", "''")
    decision_trace_str = json.dumps(cand.get('decision_trace', {"production_finalist": True}), ensure_ascii=False).replace("'", "''")
    inv_metadata_str = json.dumps({
        "production_finalist": True,
        "score_band": score_band,
        "category_slug": cat_slug,
        "creator_visible_scores": False
    }, ensure_ascii=False).replace("'", "''")

    sql_block = f"""-- Card: {title} ({cat_slug} / {score_band})
insert into public.idea_candidates (
  id, platform, format, language, locale, title, one_sentence_premise,
  safety_status, perspective_prism_status, confidence_band, status,
  decision_trace, category_id, persona_id, candidate_source,
  hook_options, story_beats, comedy_remix, human_awareness, production_requirements
)
values (
  '{idea_id}'::uuid, 'instagram_reels', 'reels', 'en', 'en-US',
  '{title}', '{premise}',
  'SAFE'::public.safety_status, 'PASS'::public.review_decision, 'high', 'published'::public.idea_status,
  '{decision_trace_str}'::jsonb,
  (select id from public.categories where slug = '{cat_slug}'),
  coalesce((select id from public.creator_personas where slug = '{persona_slug}' limit 1), (select id from public.creator_personas where slug = 'expert_guide' limit 1), (select id from public.creator_personas limit 1)),
  'admin_direct'::public.generation_source_mode,
  '{hook_options_str}'::jsonb, '{story_beats_str}'::jsonb, '{comedy_remix_str}'::jsonb, '{human_awareness_str}'::jsonb, '{prod_req_str}'::jsonb
)
on conflict (id) do update set
  title = excluded.title,
  one_sentence_premise = excluded.one_sentence_premise,
  category_id = excluded.category_id,
  persona_id = excluded.persona_id,
  status = excluded.status,
  updated_at = now();

insert into public.idea_cards (
  idea_id, title, card
)
values (
  '{idea_id}'::uuid, '{title}', '{card_json_str}'::jsonb
)
on conflict (idea_id) do update set
  title = excluded.title,
  card = excluded.card,
  updated_at = now();

insert into public.idea_inventory (
  idea_id, category_id, persona_id, platform, language,
  internal_rank_score, score_band, quality_floor_passed,
  status, reuse_count, max_reuse_count, published_at, metadata
)
values (
  '{idea_id}'::uuid,
  (select id from public.categories where slug = '{cat_slug}'),
  coalesce((select id from public.creator_personas where slug = '{persona_slug}' limit 1), (select id from public.creator_personas where slug = 'expert_guide' limit 1), (select id from public.creator_personas limit 1)),
  'instagram_reels', 'en', {rank}, '{score_band}'::public.score_band, true,
  'available'::public.inventory_status, 0, 1, now(),
  '{inv_metadata_str}'::jsonb
)
on conflict (idea_id) do update set
  category_id = excluded.category_id,
  persona_id = excluded.persona_id,
  score_band = excluded.score_band,
  status = 'available'::public.inventory_status,
  quality_floor_passed = true,
  metadata = excluded.metadata,
  updated_at = now();
"""
    sql_lines.append(sql_block)

sql_lines.append("\ncommit;\n")

out_sql_path = 'supabase/seeds/store_all_12_categories_stock.sql'
with open(out_sql_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"Generated {out_sql_path}")
