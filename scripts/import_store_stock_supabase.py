import os
import json
import uuid
import urllib.request
import urllib.error

def load_env():
    env = {}
    for fn in ['.env.local', '.env', '.env.vercel']:
        if os.path.exists(fn):
            for line in open(fn, encoding='utf-8'):
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    if k.strip() not in env:
                        env[k.strip()] = v.strip(' "\'')
    return env

env = load_env()
url = env.get('NEXT_PUBLIC_SUPABASE_URL')
key = env.get('SUPABASE_SERVICE_ROLE_KEY')

print("Connecting to Supabase at:", url)

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=representation'
}

def api_post(endpoint, data):
    req = urllib.request.Request(f"{url}/rest/v1/{endpoint}", data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='replace')
        return e.code, err_body
    except Exception as e:
        return 0, str(e)

def api_get(endpoint):
    req = urllib.request.Request(f"{url}/rest/v1/{endpoint}", headers=headers, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        print(f"Error GET {endpoint}: {e}")
        return []

# 1. Upsert Categories
store_cats = [
    {'slug': 'beauty', 'name': 'Beauty', 'family': 'creator_content', 'enabled': True},
    {'slug': 'commerce_affiliate', 'name': 'Commerce & Affiliate', 'family': 'creator_content', 'enabled': True},
    {'slug': 'creator_education', 'name': 'Creator Education', 'family': 'creator_content', 'enabled': True},
    {'slug': 'entertainment_comedy', 'name': 'Entertainment Comedy', 'family': 'creator_content', 'enabled': True},
    {'slug': 'fashion', 'name': 'Fashion', 'family': 'creator_content', 'enabled': True},
    {'slug': 'fitness_wellness_safe', 'name': 'Fitness & Wellness Safe', 'family': 'creator_content', 'enabled': True},
    {'slug': 'food', 'name': 'Food', 'family': 'creator_content', 'enabled': True},
    {'slug': 'lifestyle', 'name': 'Lifestyle', 'family': 'creator_content', 'enabled': True},
    {'slug': 'luxury', 'name': 'Luxury', 'family': 'creator_content', 'enabled': True},
    {'slug': 'parenting_family', 'name': 'Parenting & Family', 'family': 'creator_content', 'enabled': True},
    {'slug': 'thought_leadership', 'name': 'Thought Leadership', 'family': 'creator_content', 'enabled': True},
    {'slug': 'travel', 'name': 'Travel', 'family': 'creator_content', 'enabled': True}
]

print("Step 1: Upserting 12 Categories...")
for cat in store_cats:
    c_stat, c_res = api_post('categories?on_conflict=slug', [cat])
    print(f"  Category '{cat['slug']}': Status {c_stat}")

# Get category map for exactly the 12 slugs
slug_filter = ','.join([c['slug'] for c in store_cats])
db_cats = api_get(f'categories?select=id,slug&slug=in.({slug_filter})')
cat_map = {c['slug']: c['id'] for c in db_cats}

# Get persona map
db_personas = api_get('creator_personas?select=id,slug&limit=100')
persona_map = {p['slug']: p['id'] for p in db_personas}
default_persona_id = list(persona_map.values())[0] if persona_map else None

print(f"\nLoaded {len(cat_map)} target categories: {list(cat_map.keys())}")
print(f"Loaded {len(persona_map)} personas.")

# Read 84 extracted cards
with open('production_exports/store_12_categories_84_cards.jsonl', 'r', encoding='utf-8') as f:
    cards = [json.loads(line) for line in f if line.strip()]

print(f"\nStep 2: Processing and inserting {len(cards)} idea cards into Supabase...")

candidate_rows = []
card_rows = []
inventory_rows = []

for r in cards:
    cat_slug = r['category_slug']
    cat_id = cat_map.get(cat_slug)
    if not cat_id:
        print(f"Warning: Category '{cat_slug}' not found in DB map!")
        continue

    p_slug = r.get('persona_slug', 'expert_guide')
    p_id = persona_map.get(p_slug, default_persona_id)
    
    idea_id = r.get('idea_id') or str(uuid.uuid4())
    cand = r.get('candidate', {})
    card = r.get('card', {})
    score_band = r['score_band']
    rank = r.get('rank', 85)
    
    title = card.get('title') or cand.get('title') or 'Creator Brief Card'
    premise = cand.get('one_sentence_premise') or card.get('card', {}).get('one_sentence_premise') or 'Execution-ready creator brief.'

    candidate_rows.append({
        'id': idea_id,
        'platform': 'instagram_reels',
        'format': 'reels',
        'language': 'en',
        'locale': 'en-US',
        'title': title,
        'one_sentence_premise': premise,
        'safety_status': 'SAFE',
        'perspective_prism_status': 'PASS',
        'confidence_band': 'high',
        'status': 'published',
        'decision_trace': cand.get('decision_trace', {'production_finalist': True}),
        'category_id': cat_id,
        'persona_id': p_id,
        'candidate_source': 'admin_direct',
        'hook_options': cand.get('hook_options', []),
        'story_beats': cand.get('story_beats', []),
        'comedy_remix': cand.get('comedy_remix', {}),
        'human_awareness': cand.get('human_awareness', {}),
        'production_requirements': cand.get('production_requirements', {})
    })

    card_rows.append({
        'idea_id': idea_id,
        'title': title,
        'card': card.get('card', {})
    })

    inventory_rows.append({
        'idea_id': idea_id,
        'category_id': cat_id,
        'persona_id': p_id,
        'platform': 'instagram_reels',
        'language': 'en',
        'internal_rank_score': rank,
        'score_band': score_band,
        'quality_floor_passed': True,
        'status': 'available',
        'reuse_count': 0,
        'max_reuse_count': 1,
        'metadata': {
            'production_finalist': True,
            'score_band': score_band,
            'category_slug': cat_slug,
            'creator_visible_scores': False
        }
    })

print(f"\nUpserting {len(candidate_rows)} idea_candidates...")
cand_stat, cand_res = api_post('idea_candidates?on_conflict=id', candidate_rows)
print(f"  idea_candidates status: {cand_stat}")

print(f"Upserting {len(card_rows)} idea_cards...")
card_stat, card_res = api_post('idea_cards?on_conflict=idea_id', card_rows)
print(f"  idea_cards status: {card_stat}")

print(f"Upserting {len(inventory_rows)} idea_inventory...")
inv_stat, inv_res = api_post('idea_inventory?on_conflict=idea_id', inventory_rows)
print(f"  idea_inventory status: {inv_stat}")

# Verify inventory counts
print("\nStep 3: Verification of Store Categories inventory counts:")
for cat in store_cats:
    slug = cat['slug']
    cid = cat_map.get(slug)
    if cid:
        inv = api_get(f"idea_inventory?select=score_band&category_id=eq.{cid}&status=eq.available")
        counts = {'low': 0, 'mid': 0, 'high': 0}
        for item in inv:
            counts[item['score_band']] = counts.get(item['score_band'], 0) + 1
        print(f"  - {slug.ljust(25)} -> Low: {counts['low']}, Mid: {counts['mid']}, High: {counts['high']} | Total: {len(inv)}")
