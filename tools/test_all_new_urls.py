import urllib.request
import time

urls = [
    "http://localhost:3000/resources/first-3-seconds-hook-retention-framework",
    "http://localhost:3000/resources/why-reels-get-stuck-at-200-views-creative-audit",
    "http://localhost:3000/resources/why-similar-videos-perform-differently-distribution-audit",
    "http://localhost:3000/resources/creator-decision-fatigue-and-burnout-solution",
    "http://localhost:3000/resources/ai-slop-vs-human-authenticity-for-creators",
    "http://localhost:3000/resources/format-utility-decision-matrix-reels-vs-carousels",
    "http://localhost:3000/resources/save-worthy-vs-share-worthy-content-mechanics",
    "http://localhost:3000/resources/how-many-followers-from-1m-views-conversion-funnel",
    "http://localhost:3000/resources/viral-video-aftermath-how-to-capitalize-on-breakout-reach",
    "http://localhost:3000/resources/creator-pricing-packages-retainers-calculation-guide",
    "http://localhost:3000/resources/usage-rights-whitelisting-revisions-brand-deal-guide",
    "http://localhost:3000/resources/ugc-portfolio-first-paid-deal-conversion-playbook",
    "http://localhost:3000/resources/b2b-expert-linkedin-to-instagram-video-playbook",
    "http://localhost:3000/resources/faceless-content-authenticity-and-monetization-guide",
    "http://localhost:3000/tools/first-3-seconds-auditor",
    "http://localhost:3000/tools/creator-capacity-calculator",
    "http://localhost:3000/tools/format-utility-router",
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as response:
            print(f"[STATUS {response.status}] {url.split('/')[-1]}")
    except Exception as e:
        print(f"[FAIL] {url.split('/')[-1]} -> {e}")
