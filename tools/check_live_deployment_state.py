import urllib.request
import re

url = "https://anomalybox.com/"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode("utf-8")
    headers = dict(resp.headers)

print("Status:", resp.status)
print("X-Vercel-Id:", headers.get("x-vercel-id", "none"))
print("Age:", headers.get("age", "none"))
print("Cache-Control:", headers.get("cache-control", "none"))

scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html)
print(f"Total scripts: {len(scripts)}")
for s in scripts[:5]:
    print("  Script:", s)

