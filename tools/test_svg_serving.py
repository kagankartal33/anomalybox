import urllib.request

urls = [
    "http://localhost:3000/assets/legacy-resources/why-reels-get-stuck-at-200-views-creative-audit.svg",
    "http://localhost:3000/assets/legacy-resources/first-3-seconds-hook-retention-framework.svg",
    "http://localhost:3000/assets/legacy-resources/creator-decision-fatigue-and-burnout-solution.svg",
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            print(f"[STATUS {response.status}] {url.split('/')[-1]} ({len(response.read())} bytes)")
    except Exception as e:
        print(f"[FAIL] {url.split('/')[-1]} -> {e}")
