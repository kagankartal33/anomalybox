import urllib.request
import urllib.error
import urllib.parse
import ssl
from html.parser import HTMLParser
from concurrent.futures import ThreadPoolExecutor, as_completed

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE = 'https://anomalybox.com'
HEADERS = {'User-Agent': 'Mozilla/5.0'}

hub_urls = [
    'https://anomalybox.com/',
    'https://anomalybox.com/resources',
    'https://anomalybox.com/creator-lanes',
    'https://anomalybox.com/creator-personas',
    'https://anomalybox.com/tools',
    'https://anomalybox.com/services',
    'https://anomalybox.com/templates',
    'https://anomalybox.com/reels',
    'https://anomalybox.com/content-ideas',
    'https://anomalybox.com/store',
    'https://anomalybox.com/pricing',
    'https://anomalybox.com/about',
    'https://anomalybox.com/methodology',
    'https://anomalybox.com/atelier',
    'https://anomalybox.com/legal'
]

class LinkCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.images = []
    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        if tag == 'a':
            href = attr_dict.get('href')
            if href: self.links.append(href)
        elif tag == 'img':
            src = attr_dict.get('src')
            if src: self.images.append(src)

def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
            return url, r.status, r.read().decode('utf-8', errors='replace'), None
    except urllib.error.HTTPError as e:
        return url, e.code, None, str(e)
    except Exception as e:
        return url, 0, None, str(e)

print('Fetching all hub pages...')
discovered_links = {}
discovered_images = {}

for h in hub_urls:
    _, status, html, err = fetch(h)
    if status != 200:
        print(f'HUB ERROR {status} on {h}: {err}')
        continue
    parser = LinkCollector()
    parser.feed(html)
    for l in parser.links:
        if not l or l.startswith('#') or l.startswith('mailto:') or l.startswith('javascript:'):
            continue
        abs_l = urllib.parse.urljoin(h, l)
        if abs_l.startswith(BASE):
            if abs_l not in discovered_links:
                discovered_links[abs_l] = []
            discovered_links[abs_l].append(h)
    for im in parser.images:
        if not im or im.startswith('data:'):
            continue
        abs_im = urllib.parse.urljoin(h, im)
        if abs_im.startswith(BASE):
            if abs_im not in discovered_images:
                discovered_images[abs_im] = []
            discovered_images[abs_im].append(h)

print(f'Total unique links found on hubs: {len(discovered_links)}')
print(f'Total unique images found on hubs: {len(discovered_images)}')

print('\nTesting all discovered links...')
broken_links = []
with ThreadPoolExecutor(max_workers=20) as exec:
    futures = {exec.submit(fetch, u): u for u in discovered_links}
    for f in as_completed(futures):
        u, st, _, err = f.result()
        if st != 200:
            broken_links.append((u, st, discovered_links[u]))

print(f'\nBroken links found on hubs: {len(broken_links)}')
for u, st, srcs in broken_links:
    print(f'  [HTTP {st}] {u}')
    print(f'    Linked from: {srcs[:2]}')

print('\nTesting all discovered images...')
broken_images = []
def check_img(u):
    req = urllib.request.Request(u, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
            return u, r.status, None
    except urllib.error.HTTPError as e:
        return u, e.code, str(e)
    except Exception as e:
        return u, 0, str(e)

with ThreadPoolExecutor(max_workers=20) as exec:
    futures = {exec.submit(check_img, im): im for im in discovered_images}
    for f in as_completed(futures):
        im_url, st, err = f.result()
        if st != 200:
            broken_images.append((im_url, st, discovered_images[im_url]))

print(f'Broken images found: {len(broken_images)}')
for im, st, srcs in broken_images:
    print(f'  [HTTP {st}] {im}')
    print(f'    Used on: {srcs[:2]}')

