import json
import os

target_cats = [
    'beauty',
    'commerce_affiliate',
    'creator_education',
    'entertainment_comedy',
    'fashion',
    'fitness_wellness_safe',
    'food',
    'lifestyle',
    'luxury',
    'parenting_family',
    'thought_leadership',
    'travel'
]

file_path = 'production_exports/mvp_finalists_20260703_232232/finalist_cards.jsonl'
extracted_records = []

with open(file_path, 'r', encoding='utf-8-sig') as f:
    for line in f:
        if not line.strip(): continue
        rec = json.loads(line)
        c = rec.get('category_slug')
        if c in target_cats:
            extracted_records.append(rec)

print(f"Extracted {len(extracted_records)} cards for 12 target categories.")

# Save to a dedicated jsonl file
out_path = 'production_exports/store_12_categories_84_cards.jsonl'
with open(out_path, 'w', encoding='utf-8') as f:
    for r in extracted_records:
        f.write(json.dumps(r, ensure_ascii=False) + '\n')

print(f"Saved to {out_path}")

# Breakdown by category
by_cat = {}
for r in extracted_records:
    c = r['category_slug']
    b = r['score_band']
    if c not in by_cat: by_cat[c] = {'low': 0, 'mid': 0, 'high': 0, 'titles': []}
    by_cat[c][b] = by_cat[c].get(b, 0) + 1
    by_cat[c]['titles'].append((r['score_band'], r['card']['title']))

for c, data in sorted(by_cat.items()):
    print(f"\n[{c}] Total: {len(data['titles'])} (Low: {data['low']}, Mid: {data['mid']}, High: {data['high']})")
    for band, title in data['titles']:
        print(f"   [{band.upper().ljust(4)}] {title}")
