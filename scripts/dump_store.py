import urllib.request
import ssl
import json
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request('https://anomalybox.com/store', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, context=ctx) as resp:
    html = resp.read().decode('utf-8')

with open('store_dump.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Saved store_dump.html. Length:', len(html))

# Let's search for box_products, categories, and creator_personas
# In Next.js RSC, strings are often escaped like \"slug\":\"...\"
patterns = [
    r'\\?"slug\\?":\\?"([^\\"]+)\\?"',
    r'"slug":"([^"]+)"'
]

all_slugs = set()
for p in patterns:
    matches = re.findall(p, html)
    all_slugs.update(matches)

print(f"Total unique slugs found: {len(all_slugs)}")
print("Sample slugs:", sorted(list(all_slugs))[:30])
