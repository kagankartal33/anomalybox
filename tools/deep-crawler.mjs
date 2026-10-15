import https from 'node:https';

const SITEMAP_URL = 'https://anomalybox.com/sitemap.xml';

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AnomalyBox-DeepScanner/2.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, text: data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('[PHASE 3] Starting Deep Live Crawl against https://anomalybox.com ...');
  const t0 = Date.now();
  
  // 1. Fetch sitemap
  const { status, text: sitemapXml } = await fetchText(SITEMAP_URL);
  if (status !== 200) {
    console.error('Failed to fetch sitemap:', status);
    return;
  }

  const urlMatches = [...sitemapXml.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map(m => m[1]);
  console.log(`[PHASE 3] Found ${urlMatches.length} URLs in live sitemap.`);

  const stats = {
    total: urlMatches.length,
    status200: 0,
    errors: [],
    slowRequests: [], // > 1200ms
    fastRequests: [], // < 250ms
    contentIssues: []
  };

  const concurrency = 8;
  let index = 0;

  async function worker() {
    while (index < urlMatches.length) {
      const url = urlMatches[index++];
      const start = Date.now();
      try {
        const res = await fetchText(url);
        const time = Date.now() - start;
        
        if (res.status === 200) {
          stats.status200++;
          if (time < 250) stats.fastRequests.push({ url, time });
          else if (time > 1200) stats.slowRequests.push({ url, time });
          
          // Content scan
          if (res.text.includes('Application error:') || res.text.includes('Internal Server Error') || res.text.includes('Something went wrong')) {
            stats.contentIssues.push({ url, issue: 'Error message in body' });
          }
          if (!res.text.includes('<h1')) {
            stats.contentIssues.push({ url, issue: 'Missing <h1> tag' });
          }
        } else {
          stats.errors.push({ url, status: res.status, time });
        }
      } catch (err) {
        stats.errors.push({ url, error: err.message });
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const duration = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`\n================ CRAWL REPORT (Finished in ${duration}s) ================`);
  console.log(`Total URLs Audited: ${stats.total}`);
  console.log(`200 OK Responses:   ${stats.status200} / ${stats.total} (${((stats.status200/stats.total)*100).toFixed(1)}%)`);
  console.log(`HTTP Errors (4xx/5xx): ${stats.errors.length}`);
  console.log(`Content Issues:     ${stats.contentIssues.length}`);
  console.log(`Sub-250ms Responses:${stats.fastRequests.length}`);
  console.log(`Slow (>1.2s):       ${stats.slowRequests.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\nErrors:', stats.errors);
  }
  if (stats.contentIssues.length > 0) {
    console.log('\nContent Issues:', stats.contentIssues);
  }
  console.log('=================================================================\n');
}

run();
