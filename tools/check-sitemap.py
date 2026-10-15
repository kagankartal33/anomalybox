"""Check every sitemap URL returns a successful response."""
import sys
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit, urlunsplit


base = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://localhost:3010"
sitemap_url = base + "/sitemap.xml"
with urllib.request.urlopen(sitemap_url, timeout=20) as response:
    root = ET.fromstring(response.read())
namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
urls = [node.text for node in root.findall("sm:url/sm:loc", namespace) if node.text]
def check(url):
    parsed = urlsplit(url)
    target = urlunsplit((urlsplit(base).scheme, urlsplit(base).netloc, parsed.path, parsed.query, parsed.fragment))
    try:
        request = urllib.request.Request(target, headers={"User-Agent": "anomalybox-sitemap-audit/1.0"})
        with urllib.request.urlopen(request, timeout=10) as response:
            if response.status != 200:
                return target, response.status
    except Exception as error:  # pragma: no cover - diagnostic output
        return target, str(error)
    return None


with ThreadPoolExecutor(max_workers=20) as executor:
    bad = [result for result in executor.map(check, urls) if result is not None]
print(f"sitemap_urls={len(urls)}")
print(f"bad={len(bad)}")
for item in bad[:20]:
    print(item)
raise SystemExit(1 if bad else 0)
