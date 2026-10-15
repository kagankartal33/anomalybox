import json
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

root = Path(__file__).resolve().parents[1]
reg = json.loads((root / 'lib' / 'seo-package-registry.json').read_text(encoding='utf-8'))['pages']
seo_content = (root / 'lib' / 'seo-content.ts').read_text(encoding='utf-8')
res_part = seo_content.split('export const resources = [')[1]
legacy = re.findall(r'slug:\s*"([^"]+)",\s*title:\s*"([^"]+)"', res_part)

def is_protected(section, title):
    return section == 'templates' or bool(re.search(r'\btemplate\b', title, re.I))

filtered_reg = [p for p in reg if is_protected(p['section'], p['title'])]
filtered_legacy = [(s, t) for s, t in legacy if is_protected('resources', t)]

print('Filtered registry pages (count):', len(filtered_reg))
for p in filtered_reg:
    print(' ', p['path'], '->', p['title'])

print('Filtered legacy pages (count):', len(filtered_legacy))
for s, t in filtered_legacy:
    print(' ', s, '->', t)
