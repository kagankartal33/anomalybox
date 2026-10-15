import json
import re
import urllib.request
import ssl
from concurrent.futures import ThreadPoolExecutor, as_completed

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'Mozilla/5.0'}

with open('store_dump.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's find products, categories, personas from the unescaped Next.js RSC payload
# Unescape quotes
unescaped = html.replace('\\"', '"').replace('\\\\', '\\')

# Find products
products = []
# Products pattern
prod_matches = re.findall(r'\{"slug":"([^"]+)","name":"([^"]+)","price_usd_cents":(\d+),"idea_count":(\d+)', unescaped)
for slug, name, price, count in set(prod_matches):
    products.append({'slug': slug, 'name': name, 'price': int(price), 'count': int(count)})

# If none found, search broader
if not products:
    prod_matches = re.findall(r'"slug":"([^"]+)","name":"([^"]+)","price_usd_cents":(\d+)', unescaped)
    for slug, name, price in set(prod_matches):
        products.append({'slug': slug, 'name': name, 'price': int(price), 'count': 0})

# Find personas
personas = []
persona_matches = re.findall(r'\{"id":"[^"]+","slug":"([^"]+)","name":"([^"]+)","description":"([^"]+)"', unescaped)
for slug, name, desc in set(persona_matches):
    personas.append({'slug': slug, 'name': name, 'desc': desc})

# Find categories
categories = []
cat_matches = re.findall(r'\{"id":"[^"]+","slug":"([^"]+)","name":"([^"]+)","family":([^,}]+)', unescaped)
for slug, name, family in set(cat_matches):
    categories.append({'slug': slug, 'name': name, 'family': family.strip('"')})

print(f"=== STORE PRODUCTS ({len(products)}) ===")
for p in sorted(products, key=lambda x: x['price']):
    print(f"  • Product Slug: {p['slug']} | Name: {p['name']} | Price: ${p['price']/100} | Ideas: {p.get('count')}")

print(f"\n=== CREATOR MODES / PERSONAS ({len(personas)}) ===")
for p in sorted(personas, key=lambda x: x['slug']):
    print(f"  • Persona Slug: {p['slug']} | Name: {p['name']}")

print(f"\n=== PURCHASE LANES / CATEGORIES ({len(categories)}) ===")
for c in sorted(categories, key=lambda x: x['slug']):
    print(f"  • Category Slug: {c['slug']} | Name: {c['name']} (Family: {c['family']})")

print("\n" + "="*70)
print(f"Testing live availability API for all {len(products)} Products x {len(categories)} Lanes x {len(personas)} Personas...")
print(f"Total possible purchase combinations: {len(products) * len(categories) * len(personas)}")
print("="*70)

def query_availability(prod_slug, cat_slug, persona_slug):
    url = f"https://anomalybox.com/api/store/availability?box_product_slug={prod_slug}&category_slug={cat_slug}&persona_slug={persona_slug}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return prod_slug, cat_slug, persona_slug, data, None
    except Exception as e:
        return prod_slug, cat_slug, persona_slug, None, str(e)

combos = []
for p in products:
    for c in categories:
        for pe in personas:
            combos.append((p['slug'], c['slug'], pe['slug']))

results = []
with ThreadPoolExecutor(max_workers=30) as executor:
    futures = {executor.submit(query_availability, pr, ca, pe): (pr, ca, pe) for pr, ca, pe in combos}
    for f in as_completed(futures):
        results.append(f.result())

in_stock = [r for r in results if r[3] and r[3].get('ok') is True]
out_of_stock = [r for r in results if r[3] and r[3].get('ok') is False]
errors = [r for r in results if r[4] is not None]

print(f"\n=== OVERALL INVENTORY AVAILABILITY SUMMARY ===")
print(f"Total Routes Tested: {len(results)}")
print(f"  IN STOCK (Fulfillable / Available): {len(in_stock)} ({len(in_stock)/len(results)*100:.1f}%)")
print(f"  OUT OF STOCK (Unavailable): {len(out_of_stock)} ({len(out_of_stock)/len(results)*100:.1f}%)")
if errors:
    print(f"  Errors / Timeouts: {len(errors)}")

# Group by Category (Lane)
by_category = {}
for pr, ca, pe, data, err in results:
    if ca not in by_category:
        by_category[ca] = {
            'total': 0,
            'in_stock': 0,
            'out_of_stock': 0,
            'counts_by_band': {},
            'missing_reasons': set()
        }
    by_category[ca]['total'] += 1
    if data and data.get('ok'):
        by_category[ca]['in_stock'] += 1
        if data.get('counts'):
            by_category[ca]['counts_by_band'] = data['counts']
    else:
        by_category[ca]['out_of_stock'] += 1
        if data and data.get('missing'):
            for m in data['missing']:
                by_category[ca]['missing_reasons'].add(m)

print(f"\n=== DETAILED LANE-BY-LANE (CATEGORY) BREAKDOWN ===")
for ca, stat in sorted(by_category.items()):
    status = "AVAILABLE (100% READY)" if stat['out_of_stock'] == 0 else f"PARTIAL ({stat['in_stock']}/{stat['total']})" if stat['in_stock'] > 0 else "OUT OF STOCK (0%)"
    print(f"\nLane: [{ca}]")
    print(f"  Status: {status}")
    print(f"  In Stock: {stat['in_stock']} / {stat['total']} combinations")
    print(f"  Available Card Counts: {stat['counts_by_band']}")
    if stat['missing_reasons']:
        print(f"  Missing Details: {list(stat['missing_reasons'])}")

# Check if persona affects availability vs lane-primary availability
print("\n=== PERSONA VS LANE STOCK BEHAVIOR ===")
# Note: As documented in lib/inventory.ts, availability is lane-primary (category-primary),
# meaning cards are checked per category and score bands (low/mid/high).
print("System design note from lib/inventory.ts: Availability check is category-primary.")
