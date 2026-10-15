"""Concise local/production HTML metadata and JSON-LD smoke check."""
import json
import re
import sys
import urllib.request


base = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://localhost:3010"
paths = [
    "/resources/b2b-saas-linkedin-video-systems",
    "/content-ideas/instagram-content-ideas",
    "/dossiers/classic-red",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/checkout/success",
    "/profile",
]

for path in paths:
    request = urllib.request.Request(base + path, headers={"User-Agent": "anomalybox-seo-audit/1.0"})
    with urllib.request.urlopen(request, timeout=15) as response:
        html = response.read().decode("utf-8", "ignore")
        status = response.status
    blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
    parsed = []
    for block in blocks:
        try:
            parsed.append(json.loads(block))
        except json.JSONDecodeError:
            pass
    flattened = json.dumps(parsed)
    print(
        path,
        f"status={status}",
        f"ld={len(parsed)}",
        f"Article={'Article' in flattened}",
        f"Service={'Service' in flattened}",
        f"Product={'Product' in flattened}",
        f"FAQPage={'FAQPage' in flattened}",
        f"HowTo={'HowTo' in flattened}",
        f"Breadcrumb={'BreadcrumbList' in flattened}",
        f"canonical={'rel=\"canonical\"' in html}",
        f"noindex={'noindex' in html.lower()}",
    )
