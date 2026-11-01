import json
import glob
import os

consolidation = json.load(open("lib/seo-consolidation.json", encoding="utf-8"))
redirect_map = {}
for c in consolidation.get("clusters", []):
    for r in c.get("redirects", []):
        redirect_map[r] = c["winner"]
for r in consolidation.get("retiredHubPages", []):
    redirect_map[r["source"]] = r["destination"]

files_to_check = glob.glob("lib/**/*.json", recursive=True) + glob.glob("lib/**/*.ts", recursive=True) + glob.glob("app/**/*.tsx", recursive=True)

print(f"Checking {len(files_to_check)} files...")
found = 0
for f in files_to_check:
    if "seo-consolidation.json" in f:
        continue
    try:
        text = open(f, encoding="utf-8").read()
    except Exception:
        continue
    file_hits = []
    for s, dest in redirect_map.items():
        if s in text:
            file_hits.append((s, dest))
    if file_hits:
        found += 1
        print(f"  {f}: {len(file_hits)} hits")
        for s, dest in file_hits[:3]:
            print(f"    {s} -> {dest}")

print(f"Total non-consolidation files referencing merged sources: {found}")
