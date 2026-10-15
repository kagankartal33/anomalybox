import https from 'node:https';

const BASE = "https://anomalybox.com";
const routes = [
  "/",
  "/api/health",
  "/store",
  "/tools/first-3-seconds-auditor",
  "/tools/creator-capacity-calculator",
  "/content-ideas",
  "/resources",
  "/services",
  "/dossiers/classic-red",
  "/sitemap.xml",
  "/robots.txt",
  "/llms.txt"
];

async function checkUrl(path) {
  const url = `${BASE}${path}`;
  const start = Date.now();
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const time = Date.now() - start;
        resolve({
          path,
          status: res.statusCode,
          timeMs: time,
          contentLength: data.length,
          server: res.headers['server'] || 'Vercel',
          cacheControl: res.headers['cache-control'] || 'none'
        });
      });
    }).on('error', (err) => {
      resolve({ path, status: 'ERROR', error: err.message });
    });
  });
}

async function run() {
  console.log(`[LIVE PROBE] Connecting to ${BASE} ...\n`);
  const results = await Promise.all(routes.map(r => checkUrl(r)));
  console.table(results);
}

run();
