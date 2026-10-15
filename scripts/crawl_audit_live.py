import urllib.request
import urllib.error
import urllib.parse
import ssl
import re
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
import xml.etree.ElementTree as ET

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
}

BASE_URL = 'https://anomalybox.com'

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = None
        self.meta_desc = None
        self.canonical = None
        self.og_title = None
        self.og_desc = None
        self.og_image = None
        self.h1_list = []
        self.in_title = False
        self.in_h1 = False
        self.cur_h1 = []
        self.links = []
        self.images = []
        self.json_ld = []
        self.in_script_ld = False
        self.cur_script_ld = []
        self.text_content = []

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        if tag == 'title':
            self.in_title = True
        elif tag == 'h1':
            self.in_h1 = True
            self.cur_h1 = []
        elif tag == 'meta':
            name = attr_dict.get('name', '').lower()
            prop = attr_dict.get('property', '').lower()
            content = attr_dict.get('content', '')
            if name == 'description':
                self.meta_desc = content
            elif prop == 'og:title' or name == 'og:title':
                self.og_title = content
            elif prop == 'og:description' or name == 'og:description':
                self.og_desc = content
            elif prop == 'og:image' or name == 'og:image':
                self.og_image = content
        elif tag == 'link':
            rel = attr_dict.get('rel', '').lower()
            if rel == 'canonical':
                self.canonical = attr_dict.get('href')
        elif tag == 'a':
            href = attr_dict.get('href')
            if href:
                self.links.append(href)
        elif tag == 'img':
            src = attr_dict.get('src')
            if src:
                self.images.append(src)
        elif tag == 'script':
            stype = attr_dict.get('type', '').lower()
            if stype == 'application/ld+json':
                self.in_script_ld = True
                self.cur_script_ld = []

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        elif tag == 'h1':
            self.in_h1 = False
            self.h1_list.append(''.join(self.cur_h1).strip())
        elif tag == 'script' and self.in_script_ld:
            self.in_script_ld = False
            self.json_ld.append(''.join(self.cur_script_ld).strip())

    def handle_data(self, data):
        if self.in_title and self.title is None:
            self.title = data.strip()
        elif self.in_h1:
            self.cur_h1.append(data)
        elif self.in_script_ld:
            self.cur_script_ld.append(data)
        self.text_content.append(data)

def fetch_url(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
            content = resp.read()
            charset = resp.headers.get_content_charset() or 'utf-8'
            return url, resp.status, dict(resp.headers), content.decode(charset, errors='replace'), None
    except urllib.error.HTTPError as e:
        return url, e.code, dict(e.headers), None, str(e)
    except Exception as e:
        return url, 0, {}, None, str(e)

def check_asset(url):
    req = urllib.request.Request(url, headers=HEADERS, method='HEAD')
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=8) as resp:
            return url, resp.status
    except urllib.error.HTTPError as e:
        return url, e.code
    except Exception:
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, context=ctx, timeout=8) as resp:
                return url, resp.status
        except urllib.error.HTTPError as e2:
            return url, e2.code
        except Exception:
            return url, 0

def run_audit():
    results = {
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'sitemap_urls_count': 0,
        'sitemap_errors': [],
        'pages_audited_count': 0,
        'pages_with_status_200': 0,
        'broken_urls': [],
        'missing_h1': [],
        'multiple_h1': [],
        'missing_meta_desc': [],
        'missing_canonical': [],
        'low_word_count': [],
        'json_ld_errors': [],
        'broken_internal_links': [],
        'broken_images': [],
        'extra_endpoints': {},
        'page_details': {}
    }

    print('[1/5] Fetching special endpoints...', flush=True)
    special = ['/robots.txt', '/sitemap.xml', '/llms.txt', '/feed.xml']
    for ep in special:
        _, status, headers, body, err = fetch_url(BASE_URL + ep)
        results['extra_endpoints'][ep] = {
            'status': status,
            'size': len(body) if body else 0,
            'content_type': headers.get('content-type', headers.get('Content-Type'))
        }
        print(f'  {ep} -> Status: {status}, Size: {len(body) if body else 0} bytes', flush=True)

    # Parse sitemap
    sitemap_urls = []
    _, s_stat, _, s_body, _ = fetch_url(BASE_URL + '/sitemap.xml')
    if s_stat == 200 and s_body:
        try:
            root = ET.fromstring(s_body)
            for elem in root.findall('.//{*}loc'):
                if elem.text:
                    sitemap_urls.append(elem.text.strip())
            results['sitemap_urls_count'] = len(sitemap_urls)
            print(f'  Found {len(sitemap_urls)} URLs in sitemap.xml', flush=True)
        except Exception as e:
            results['sitemap_errors'].append(str(e))
            print(f'  Sitemap parse error: {e}', flush=True)

    core_routes = [
        '/',
        '/about',
        '/pricing',
        '/login',
        '/methodology',
        '/atelier',
        '/boxes',
        '/store',
        '/resources',
        '/tools',
        '/templates',
        '/reels',
        '/creator-lanes',
        '/creator-personas',
        '/content-ideas',
        '/services',
        '/legal',
        '/forgot-password',
        '/onboarding',
        '/dossiers/classic-red',
        '/dossiers/signature-purple'
    ]

    all_urls = list(set([BASE_URL + r for r in core_routes] + sitemap_urls))
    results['pages_audited_count'] = len(all_urls)
    print(f'[2/5] Crawling {len(all_urls)} URLs concurrently (25 workers)...', flush=True)

    discovered_links = {}
    discovered_images = {}

    with ThreadPoolExecutor(max_workers=25) as executor:
        future_to_url = {executor.submit(fetch_url, u): u for u in all_urls}
        done_count = 0
        for future in as_completed(future_to_url):
            done_count += 1
            url, status, headers, body, err = future.result()
            if done_count % 25 == 0 or done_count == len(all_urls):
                print(f'  Progress: {done_count}/{len(all_urls)}', flush=True)

            if status != 200:
                results['broken_urls'].append({'url': url, 'status': status, 'error': err})
                continue

            results['pages_with_status_200'] += 1
            parser = PageParser()
            try:
                parser.feed(body)
            except Exception as pe:
                pass

            words = len(' '.join(parser.text_content).split())
            page_rec = {
                'url': url,
                'status': status,
                'title': parser.title,
                'meta_desc': parser.meta_desc,
                'canonical': parser.canonical,
                'og_title': parser.og_title,
                'og_image': parser.og_image,
                'h1': parser.h1_list,
                'word_count': words,
                'links_count': len(parser.links),
                'images_count': len(parser.images),
                'json_ld_count': len(parser.json_ld)
            }
            results['page_details'][url] = page_rec

            if not parser.title:
                results['broken_urls'].append({'url': url, 'issue': 'Missing <title>'})
            if not parser.meta_desc:
                results['missing_meta_desc'].append(url)
            if not parser.canonical:
                results['missing_canonical'].append(url)
            if len(parser.h1_list) == 0:
                results['missing_h1'].append(url)
            elif len(parser.h1_list) > 1:
                results['multiple_h1'].append({'url': url, 'h1s': parser.h1_list})
            if words < 80:
                results['low_word_count'].append({'url': url, 'word_count': words})

            for j_str in parser.json_ld:
                try:
                    json.loads(j_str)
                except Exception as je:
                    results['json_ld_errors'].append({'url': url, 'error': str(je)})

            for l in parser.links:
                if not l or l.startswith('#') or l.startswith('mailto:') or l.startswith('tel:') or l.startswith('javascript:'):
                    continue
                abs_l = urllib.parse.urljoin(url, l)
                if abs_l.startswith(BASE_URL):
                    if abs_l not in discovered_links:
                        discovered_links[abs_l] = []
                    discovered_links[abs_l].append(url)

            for im in parser.images:
                if not im or im.startswith('data:'):
                    continue
                abs_im = urllib.parse.urljoin(url, im)
                if abs_im.startswith(BASE_URL):
                    if abs_im not in discovered_images:
                        discovered_images[abs_im] = []
                    discovered_images[abs_im].append(url)

    print(f'[3/5] Testing {len(discovered_links)} discovered internal links...', flush=True)
    untested_links = [u for u in discovered_links if u not in results['page_details'] and u not in [x['url'] for x in results['broken_urls']]]
    print(f'  Untested internal links to verify: {len(untested_links)}', flush=True)

    with ThreadPoolExecutor(max_workers=20) as executor:
        future_to_link = {executor.submit(fetch_url, u): u for u in untested_links}
        for future in as_completed(future_to_link):
            u, stat, hdrs, bdy, err = future.result()
            if stat != 200:
                results['broken_internal_links'].append({
                    'url': u,
                    'status': stat,
                    'sources': discovered_links[u][:3]
                })

    print(f'[4/5] Testing {len(discovered_images)} discovered images...', flush=True)
    with ThreadPoolExecutor(max_workers=25) as executor:
        future_to_img = {executor.submit(check_asset, im): im for im in discovered_images}
        for future in as_completed(future_to_img):
            im_url, stat = future.result()
            if stat != 200:
                results['broken_images'].append({
                    'image': im_url,
                    'status': stat,
                    'sources': discovered_images[im_url][:3]
                })

    print('[5/5] Writing report...', flush=True)
    with open('tmp_live_audit_report.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f'=== AUDIT SUMMARY ===')
    print(f'Total URLs in Sitemap: {results["sitemap_urls_count"]}')
    print(f'Total URLs Audited: {results["pages_audited_count"]}')
    print(f'Status 200 OK: {results["pages_with_status_200"]}')
    print(f'Broken / Error Pages: {len(results["broken_urls"])}')
    print(f'Broken Internal Links: {len(results["broken_internal_links"])}')
    print(f'Broken Images: {len(results["broken_images"])}')
    print(f'Missing Meta Description: {len(results["missing_meta_desc"])}')
    print(f'Missing Canonical: {len(results["missing_canonical"])}')
    print(f'Missing H1: {len(results["missing_h1"])}')
    print(f'Multiple H1: {len(results["multiple_h1"])}')
    print(f'Low Word Count (<80 words): {len(results["low_word_count"])}')
    print(f'JSON-LD Errors: {len(results["json_ld_errors"])}')

if __name__ == '__main__':
    run_audit()
