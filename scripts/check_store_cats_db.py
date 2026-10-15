import os
import json
import urllib.request

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

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json'
}

def query_table(endpoint):
    req = urllib.request.Request(f'{url}/rest/v1/{endpoint}', headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        print(f'Error querying {endpoint}: {e}')
        return []

store_slugs = [
    "beauty",
    "commerce_affiliate",
    "creator_education",
    "entertainment_comedy",
    "fashion",
    "fitness_wellness_safe",
    "food",
    "lifestyle",
    "luxury",
    "parenting_family",
    "thought_leadership",
    "travel"
]

all_cats = query_table('categories?select=id,slug,name,enabled')
cat_dict = {c['slug']: c for c in all_cats}

print("Checking 12 Store Categories in Supabase DB:")
for slug in store_slugs:
    if slug in cat_dict:
        c = cat_dict[slug]
        inv = query_table(f"idea_inventory?select=score_band&category_id=eq.{c['id']}&status=eq.available")
        counts = {'low': 0, 'mid': 0, 'high': 0}
        for item in inv:
            counts[item['score_band']] = counts.get(item['score_band'], 0) + 1
        print(f"  [FOUND] {slug.ljust(25)} (ID: {c['id']}) -> Enabled: {c['enabled']} | Inventory: {counts}")
    else:
        print(f"  [MISSING] {slug.ljust(25)} NOT FOUND in categories table!")
