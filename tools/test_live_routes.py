import urllib.request

urls = [
    "http://localhost:3000/resources/first-3-seconds-hook-retention-framework",
    "http://localhost:3000/resources/why-reels-get-stuck-at-200-views-creative-audit",
    "http://localhost:3000/resources/creator-decision-fatigue-and-burnout-solution",
    "http://localhost:3000/tools/first-3-seconds-auditor",
    "http://localhost:3000/tools/creator-capacity-calculator",
    "http://localhost:3000/tools/format-utility-router",
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            print(f"[STATUS {response.status}] {url}")
    except Exception as e:
        print(f"[FAIL] {url} -> {e}")
